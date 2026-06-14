from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.auth import AuthSyncRequest
from app.schemas.common import create_success_response, create_error_response
from app.services.user_service import UserService
from app.utils.clerk import verify_clerk_token, extract_clerk_user_id, extract_clerk_email, extract_clerk_name, extract_clerk_avatar
from app.config import settings
import logging

logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__)


@bp.route("/sync", methods=["POST"])
def sync_user():
    """Sync user from Clerk token or dev credentials"""
    try:
        data = request.get_json()
        schema = AuthSyncRequest(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    clerk_id = schema.clerk_id
    email = schema.email
    full_name = schema.full_name
    avatar_url = schema.avatar_url

    # If Clerk is enabled and we have a session_token, validate it with Clerk
    if settings.CLERK_ENABLED and schema.session_token:
        try:
            payload = verify_clerk_token(schema.session_token)
            clerk_id = extract_clerk_user_id(payload)
            email = extract_clerk_email(payload) or email
            full_name = extract_clerk_name(payload) or full_name
            avatar_url = extract_clerk_avatar(payload) or avatar_url
        except Exception as e:
            logger.warning(f"Clerk token validation failed: {e}. Using provided user data.")
            # In dev mode, fall back to using provided data even if Clerk validation fails

    user, is_new = UserService(db.session).sync_user(
        clerk_id=clerk_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
    )
    db.session.commit()

    access_token = create_access_token(identity=clerk_id)

    response_data = {
        "user_id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "is_new": is_new,
        "access_token": access_token,
    }

    return jsonify(create_success_response(response_data).model_dump()), 201 if is_new else 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    response_data = {
        "id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }

    return jsonify(create_success_response(response_data).model_dump())


@bp.route("/clerk/sync", methods=["POST"])
def clerk_sync():
    """Dedicated endpoint for Clerk webhook or session sync.
    
    Accepts Clerk session token and syncs user to our database.
    Falls back to using provided user data if Clerk validation fails in dev mode.
    """
    auth_header = request.headers.get("Authorization", "")
    clerk_token = None
    user_data_from_token = None

    if auth_header.startswith("Bearer "):
        clerk_token = auth_header[7:]

    # Try to validate Clerk token if provided
    if clerk_token and settings.CLERK_ENABLED:
        try:
            payload = verify_clerk_token(clerk_token)
            user_data_from_token = {
                "clerk_id": extract_clerk_user_id(payload),
                "email": extract_clerk_email(payload),
                "full_name": extract_clerk_name(payload),
                "avatar_url": extract_clerk_avatar(payload),
            }
        except Exception as e:
            logger.warning(f"Clerk token validation failed: {e}. Using provided user data.")
            # Fall back to using request body data

    # Get user data from request body
    try:
        data = request.get_json() or {}
    except:
        data = {}

    # Use Clerk token data if available, otherwise use request body data
    clerk_id = user_data_from_token["clerk_id"] if user_data_from_token else data.get("clerk_id")
    email = user_data_from_token["email"] if user_data_from_token else data.get("email")
    full_name = user_data_from_token["full_name"] if user_data_from_token else data.get("full_name")
    avatar_url = user_data_from_token["avatar_url"] if user_data_from_token else data.get("avatar_url")

    # Fall back to defaults if not provided
    if not clerk_id:
        return create_error_response("VALIDATION_ERROR", "clerk_id is required", None, 400)
    if not email:
        email = f"{clerk_id}@clerk.dev"

    user, is_new = UserService(db.session).sync_user(
        clerk_id=clerk_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
    )
    db.session.commit()

    access_token = create_access_token(identity=clerk_id)

    response_data = {
        "user_id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "is_new": is_new,
        "access_token": access_token,
    }

    return jsonify(create_success_response(response_data).model_dump()), 201 if is_new else 200