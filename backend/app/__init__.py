import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.exc import OperationalError as SAOperationalError
from sqlalchemy.exc import DBAPIError

from app.config import settings
from app.extensions import init_extensions
from app.utils.exceptions import AppException


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_ALGORITHM"] = settings.JWT_ALGORITHM
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = settings.JWT_ACCESS_TOKEN_EXPIRES
    app.config["DEBUG"] = settings.DEBUG

    CORS(app, origins=settings.get_cors_origins_list(), supports_credentials=True)
    init_extensions(app)

    from app.api import auth, groups, expenses, settlements, balances, imports, users

    app.register_blueprint(auth.bp, url_prefix="/api/v1/auth")
    app.register_blueprint(groups.bp, url_prefix="/api/v1/groups")
    app.register_blueprint(expenses.bp, url_prefix="/api/v1")
    app.register_blueprint(settlements.bp, url_prefix="/api/v1")
    app.register_blueprint(balances.bp, url_prefix="/api/v1")
    app.register_blueprint(imports.bp, url_prefix="/api/v1")
    app.register_blueprint(users.bp, url_prefix="/api/v1/users")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": {"code": "NOT_FOUND", "message": "Resource not found"}}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}}), 405

    @app.errorhandler(AppException)
    def handle_app_exception(e: AppException):
        # Map exception class to HTTP status code
        status_map = {
            "ValidationError": 400,
            "BadRequestError": 400,
            "AuthorizationError": 401,
            "ForbiddenError": 403,
            "NotFoundError": 404,
            "ConflictError": 409,
        }
        code_map = {
            "ValidationError": "VALIDATION_ERROR",
            "BadRequestError": "BAD_REQUEST",
            "AuthorizationError": "UNAUTHORIZED",
            "ForbiddenError": "FORBIDDEN",
            "NotFoundError": "NOT_FOUND",
            "ConflictError": "CONFLICT",
        }
        exc_name = type(e).__name__
        status = status_map.get(exc_name, 400)
        code = code_map.get(exc_name, "BAD_REQUEST")
        return jsonify({"success": False, "error": {"code": code, "message": str(e)}}), status

    @app.errorhandler(500)
    def internal_error(e):
        if settings.DEBUG:
            traceback.print_exc()
        return jsonify({"success": False, "error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}}), 500

    @app.errorhandler(SAOperationalError)
    @app.errorhandler(DBAPIError)
    def handle_db_unavailable(e):
        # Connection-level failures (SSL closed by upstream proxy, server gone away,
        # pool exhausted) shouldn't leak a 500 with a Python traceback to the client.
        # Return a clean 503 so the frontend can retry.
        if settings.DEBUG:
            traceback.print_exc()
        return jsonify({
            "success": False,
            "error": {
                "code": "DATABASE_UNAVAILABLE",
                "message": "Database is temporarily unavailable. Please try again.",
            },
        }), 503

    @app.route("/health")
    def health():
        return {"status": "ok", "service": settings.APP_NAME}

    return app