from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.schemas.common import create_success_response
from app.services.user_service import UserService

bp = Blueprint("users", __name__)


@bp.route("/search", methods=["GET"])
@jwt_required()
def search_users():
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify(create_success_response({"users": [], "total": 0}).model_dump())

    users = UserService(db.session).search_users(query)

    return jsonify(create_success_response({
        "users": [{
            "id": str(u.id),
            "clerk_id": u.clerk_id,
            "email": u.email,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
        } for u in users],
        "total": len(users),
    }).model_dump())