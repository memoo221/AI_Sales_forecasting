import pandas as pd
from datetime import datetime, timezone

PLACEHOLDER_DATE = datetime(1970, 1, 1, tzinfo=timezone.utc)


def preprocess_sales(records: list[dict]) -> pd.DataFrame:
    """
    Clean and prepare raw sale records for forecasting.

    Steps:
      1. Convert to DataFrame
      2. Drop placeholder dates (1970-01-01) inserted during ingestion
      3. Drop rows where both revenue and date are unusable
      4. Impute missing revenue with the median of available values
      5. Sort by date ascending
      6. Fill time series gaps (missing dates between first and last sale)

    Returns a clean DataFrame with columns: ds (date), y (revenue)
    ready for Prophet.
    """
    if not records:
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(records, columns=["date", "revenue"])

    # Normalize date column to datetime
    df["date"] = pd.to_datetime(df["date"], utc=True)

    # Step 1: Drop placeholder dates set during ingestion for missing dates
    df = df[df["date"] > pd.Timestamp(PLACEHOLDER_DATE)]

    if df.empty:
        return pd.DataFrame(columns=["ds", "y"])

    # Step 2: Impute missing revenue with median of known values
    median_revenue = df["revenue"].median(skipna=True)
    if pd.isna(median_revenue):
        median_revenue = 0.0
    df["revenue"] = df["revenue"].fillna(median_revenue)

    # Step 3: Aggregate by date (in case multiple rows for same date)
    df = df.groupby("date", as_index=False)["revenue"].sum()

    # Step 4: Sort ascending — Prophet requires chronological order
    df = df.sort_values("date").reset_index(drop=True)

    # Step 5: Fill time series gaps with 0 revenue
    # (missing dates = no sales that day, not unknown)
    full_range = pd.date_range(
        start=df["date"].min(),
        end=df["date"].max(),
        freq="D",
        tz="UTC",
    )
    df = df.set_index("date").reindex(full_range, fill_value=0).reset_index()
    df.columns = ["date", "revenue"]

    # Rename to Prophet's required column names
    df = df.rename(columns={"date": "ds", "revenue": "y"})

    # Prophet requires timezone-naive timestamps
    df["ds"] = df["ds"].dt.tz_localize(None)

    return df
