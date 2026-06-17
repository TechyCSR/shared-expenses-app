from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from sqlalchemy.exc import OperationalError as SAOperationalError

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def init_extensions(app: Flask) -> None:
    # Render (and most managed Postgres hosts) silently drop idle SSL connections after
    # ~5 minutes. Without pool_pre_ping, the next query on a pooled connection gets a raw
    # psycopg2.OperationalError("SSL connection has been closed unexpectedly") and a 500.
    # pool_pre_ping issues a cheap "SELECT 1" before each checkout so stale connections
    # are discarded transparently.
    app.config.setdefault(
        "SQLALCHEMY_ENGINE_OPTIONS",
        {
            "pool_pre_ping": True,
            "pool_recycle": 280,
        },
    )
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)