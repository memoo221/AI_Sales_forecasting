from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    company_id: int = Field(..., description="The company to forecast for")
    product_id: int | None = Field(None, description="Optional — forecast a single product only")
    horizon_days: int = Field(30, ge=7, le=365, description="How many days ahead to forecast")


class ProductForecastResult(BaseModel):
    product_id: int
    status: str
    forecasts_saved: int | None = None
    reason: str | None = None


class ForecastResponse(BaseModel):
    forecasted: int
    results: list[ProductForecastResult]
