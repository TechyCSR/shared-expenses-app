import httpx
from jose import jwt, JWTError
from functools import lru_cache
from typing import Optional

from app.config import settings
from app.utils.exceptions import AuthorizationError


_jwks_cache: dict = {}


async def get_clerk_jwks() -> dict:
    global _jwks_cache
    if not _jwks_cache:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.CLERK_JWKS_URL, timeout=10.0)
            response.raise_for_status()
            _jwks_cache = response.json()
    return _jwks_cache


async def verify_clerk_token(token: str) -> dict:
    try:
        jwks = await get_clerk_jwks()
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise AuthorizationError("Token missing key ID")

        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            await refresh_jwks()
            jwks = await get_clerk_jwks()
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key:
                raise AuthorizationError("Unable to find matching key")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.CLERK_PUBLISHABLE_KEY,
            issuer=settings.CLERK_ISSUER,
        )
        return payload
    except JWTError as e:
        raise AuthorizationError(f"Invalid token: {str(e)}")
    except httpx.HTTPError as e:
        raise AuthorizationError(f"Failed to fetch JWKS: {str(e)}")


async def refresh_jwks() -> None:
    global _jwks_cache
    _jwks_cache = {}
    await get_clerk_jwks()


def extract_clerk_user_id(payload: dict) -> str:
    return payload.get("sub", "")


def extract_clerk_email(payload: dict) -> str:
    return payload.get("email", "")


def extract_clerk_name(payload: dict) -> str:
    return payload.get("name", "") or payload.get("first_name", "") + " " + payload.get("last_name", "")


def extract_clerk_avatar(payload: dict) -> str:
    return payload.get("picture", "") or payload.get("avatar_url", "")