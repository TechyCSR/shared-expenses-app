from flask import Flask
from flask_cors import CORS

from app.config import settings
from app.extensions import init_extensions


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(settings)

    CORS(app, origins=settings.CORS_ORIGINS, supports_credentials=True)
    init_extensions(app)

    from app.api import auth, groups, expenses, settlements, balances, imports, users

    app.register_blueprint(auth.bp, url_prefix="/api/v1/auth")
    app.register_blueprint(groups.bp, url_prefix="/api/v1/groups")
    app.register_blueprint(expenses.bp, url_prefix="/api/v1")
    app.register_blueprint(settlements.bp, url_prefix="/api/v1")
    app.register_blueprint(balances.bp, url_prefix="/api/v1")
    app.register_blueprint(imports.bp, url_prefix="/api/v1")
    app.register_blueprint(users.bp, url_prefix="/api/v1/users")

    @app.route("/health")
    def health():
        return {"status": "ok", "service": settings.APP_NAME}

    return app