from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    debug: bool = False
    firebase_service_account_path: str = ""
    google_cloud_project: str = ""
    gemini_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
