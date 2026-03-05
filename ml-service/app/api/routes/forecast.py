from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services.forecaster import run_forecast_for_company

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.post("/", response_model=ForecastResponse)
def trigger_forecast(request: ForecastRequest, db: Session = Depends(get_db)):
    """
    Trigger revenue forecasting for a company.
    Optionally pass product_id to forecast a single product.
    """
    try:
        result = run_forecast_for_company(
            db=db,
            company_id=request.company_id,
            product_id=request.product_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
