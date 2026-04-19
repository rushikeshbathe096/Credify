# app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    GROQ_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    JWT_SECRET: str = "dev-secret-change-in-prod"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
