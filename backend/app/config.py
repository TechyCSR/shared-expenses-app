from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Shared Expenses API"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = Field(
        default="sqlite:///./shared_expenses.db",
        description="Database connection URL (SQLite for dev, PostgreSQL for prod)"
    )

    # Clerk — optional in dev. When CLERK_ENABLED=false, the backend issues JWTs
    # for an email-based dev login flow that auto-creates users.
    CLERK_ENABLED: bool = Field(
        default=False,
        description="When false, dev-mode email login is used and Clerk JWT validation is skipped"
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
        default="dev-secret-change-in-production-please-use-a-random-string",
        description="Secret key for internal JWT signing"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES: int = 60 * 60 * 24 * 7  # 7 days

    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated CORS origins"
    )

    DEFAULT_CURRENCY: str = "INR"
    SUPPORTED_CURRENCIES: str = Field(
        default="INR,USD,EUR,GBP,JPY",
        description="Comma-separated supported currency codes"
    )

    MAX_CSV_SIZE_MB: int = 5
    MAX_CSV_ROWS: int = 1000

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return v
        if isinstance(v, list):
            return ",".join(v)
        return v

    @field_validator("SUPPORTED_CURRENCIES", mode="before")
    @classmethod
    def parse_supported_currencies(cls, v):
        if isinstance(v, str):
            return v
        if isinstance(v, list):
            return ",".join(v)
        return v

    def get_cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def get_supported_currencies_list(self) -> list[str]:
        return [c.strip() for c in self.SUPPORTED_CURRENCIES.split(",") if c.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()