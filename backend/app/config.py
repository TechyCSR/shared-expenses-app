from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Shared Expenses API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/shared_expenses",
        description="PostgreSQL async connection URL"
    )

    CLERK_PUBLISHABLE_KEY: str = Field(default="", description="Clerk publishable key")
    CLERK_SECRET_KEY: str = Field(default="", description="Clerk secret key")
    CLERK_JWKS_URL: str = Field(
        default="https://api.clerk.com/v1/jwks",
        description="Clerk JWKS URL for JWT validation"
    )
    CLERK_ISSUER: str = Field(
        default="https://api.clerk.com",
        description="Clerk token issuer"
    )

    JWT_SECRET_KEY: str = Field(
        default="dev-secret-change-in-production",
        description="Secret key for internal JWT signing"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES: int = 3600

    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )

    DEFAULT_CURRENCY: str = "INR"
    SUPPORTED_CURRENCIES: list[str] = Field(
        default=["INR", "USD", "EUR", "GBP"],
        description="Supported currency codes"
    )

    MAX_CSV_SIZE_MB: int = 5
    MAX_CSV_ROWS: int = 1000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()