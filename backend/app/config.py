from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./finance_app.db"
    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 120
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
