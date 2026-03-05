import pandas as pd
from prophet import Prophet
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.services.preprocessor import preprocess_sales

FORECAST_HORIZON_DAYS = 30


def run_forecast_for_company(db: Session, company_id: int, product_id: int = None):
    """
    Run revenue forecasts for all products of a company (or a single product).

    Returns a summary of what was forecasted.
    """
    # Build query — filter by company, optionally by product
    query = """
        SELECT s."productId", s.date, s.revenue
        FROM "Sale" s
        WHERE s."companyId" = :company_id
    """
    if product_id:
        query += ' AND s."productId" = :product_id'

    params = {"company_id": company_id}
    if product_id:
        params["product_id"] = product_id

    rows = db.execute(text(query), params).fetchall()

    if not rows:
        return {"forecasted": 0, "message": "No sales data found"}

    # Group rows by product_id
    grouped = {}
    for row in rows:
        pid = row[0]
        if pid not in grouped:
            grouped[pid] = []
        grouped[pid].append({"date": row[1], "revenue": row[2]})

    results = []

    for pid, records in grouped.items():
        # Skip products with less than 2 data points — Prophet minimum
        if len(records) < 2:
            results.append({"product_id": pid, "status": "skipped", "reason": "not enough data"})
            continue

        # Preprocess
        df = preprocess_sales(records)

        if df.empty or len(df) < 2:
            results.append({"product_id": pid, "status": "skipped", "reason": "empty after preprocessing"})
            continue

        # Run Prophet
        try:
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95,
            )
            model.fit(df)

            future = model.make_future_dataframe(periods=FORECAST_HORIZON_DAYS)
            forecast = model.predict(future)

            # Only keep the future predictions (not historical)
            future_only = forecast[forecast["ds"] > df["ds"].max()][["ds", "yhat"]]

            # Save forecast records to DB
            saved = _save_forecasts(db, company_id, pid, future_only)
            results.append({"product_id": pid, "status": "ok", "forecasts_saved": saved})

        except Exception as e:
            results.append({"product_id": pid, "status": "error", "reason": str(e)})

    return {"forecasted": len(results), "results": results}


def _save_forecasts(db: Session, company_id: int, product_id: int, future_df: pd.DataFrame) -> int:
    """
    Upsert forecast rows into the Forecast table.
    Uses raw SQL to match the Prisma schema exactly.
    """
    saved = 0
    for _, row in future_df.iterrows():
        predicted = max(0.0, float(row["yhat"]))  # revenue can't be negative
        target_date = row["ds"].to_pydatetime()

        db.execute(
            text("""
            INSERT INTO "Forecast" ("productId", "companyId", "predicted", "targetDate", "modelId")
            VALUES (:product_id, :company_id, :predicted, :target_date, NULL)
            ON CONFLICT ("productId", "targetDate", "companyId", "modelId")
            DO UPDATE SET predicted = EXCLUDED.predicted
            """),
            {
                "product_id": product_id,
                "company_id": company_id,
                "predicted": predicted,
                "target_date": target_date,
            },
        )
        saved += 1

    db.commit()
    return saved
