from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    ml_service_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
