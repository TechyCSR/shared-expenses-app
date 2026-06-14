from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.auth import AuthSyncRequest
from app.schemas.common import create_success_response, create_error_response
from app.services.user_service import UserService

bp = Blueprint("auth", __name__)


@bp.route("/sync", methods=["POST"])
async def sync_user():
    try:
        data = request.get_json()
        schema = AuthSyncRequest(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    user, is_new = await UserService(db.session).sync_user(
        clerk_id=schema.clerk_id,
        email=schema.email,
        full_name=schema.full_name,
        avatar_url=schema.avatar_url,
    )
    await db.session.commit()

    access_token = create_access_token(identity=schema.clerk_id)

    return jsonify(create_success_response({
        "user_id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "is_new": is_new,
        "access_token": access_token,
    })), 201 if is_new else 200


@bp.route("/me", methods=["GET"])
@jwt_required()
async def get_profile():
    clerk_id = get_jwt_identity()
    user = await UserService(db.session).get_by_clerk_id(clerk_id)

    return jsonify(create_success_response({
        "id": str(user.id),
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }))