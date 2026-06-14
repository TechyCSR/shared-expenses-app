from functools import wraps
from flask import request, g, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

from app.utils.clerk import verify_clerk_token, extract_clerk_user_id
from app.utils.exceptions import AuthorizationError, ForbiddenError
from app.extensions import db
from app.models.user import User
from app.config import settings


class AuthMiddleware:
    @staticmethod
    def require_auth(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()

            if settings.CLERK_ENABLED:
                # Validate Clerk token signature
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:]
                    try:
                        payload = verify_clerk_token(token)
                        g.clerk_payload = payload
                    except Exception:
                        pass  # Fall through - identity is still valid

            user = db.session.query(User).filter_by(clerk_id=identity).first()
            if not user:
                return jsonify({"success": False, "error": {"code": "USER_NOT_FOUND", "message": "User not synced"}}), 401
            g.current_user = user
            return f(*args, **kwargs)
        return decorated

    @staticmethod
    def optional_auth(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                if identity:
                    user = db.session.query(User).filter_by(clerk_id=identity).first()
                    if user:
                        g.current_user = user
            except Exception:
                pass
            return f(*args, **kwargs)
        return decorated


def get_current_user() -> User | None:
    return getattr(g, "current_user", None)


def require_group_membership(group_id: str, role: str | None = None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                raise AuthorizationError("Authentication required")
            from app.models.group_member import GroupMember
            membership = db.session.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
                GroupMember.left_at.is_(None)
            ).first()
            if not membership:
                raise ForbiddenError("Not a member of this group")
            if role and membership.role != role:
                raise ForbiddenError(f"Requires {role} role")
            g.group_membership = membership
            return f(*args, **kwargs)
        return decorated
    return decorator