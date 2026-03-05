from fastapi import FastAPI
from app.api.routes import forecast, health
from app.core.config import settings

app = FastAPI(
    title="Sales AI — ML Service",
    description="Revenue forecasting microservice using Prophet",
    version="1.0.0",
)

app.include_router(health.router)
app.include_router(forecast.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.ml_service_port, reload=True)
