from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.schemas.common import create_success_response, create_error_response
from app.services.balance_service import BalanceService
from app.services.user_service import UserService
from datetime import date
import uuid

bp = Blueprint("balances", __name__)


@bp.route("/groups/<uuid:group_id>/balances", methods=["GET"])
@jwt_required()
def get_group_balances(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if start_date:
        start_date = date.fromisoformat(start_date)
    if end_date:
        end_date = date.fromisoformat(end_date)

    balances = BalanceService(db.session).get_group_balances(
        group_id, start_date, end_date
    )

    return jsonify(create_success_response(balances).model_dump())


@bp.route("/groups/<uuid:group_id>/balances/<uuid:user_id>", methods=["GET"])
@jwt_required()
def get_user_balance(group_id, user_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if start_date:
        start_date = date.fromisoformat(start_date)
    if end_date:
        end_date = date.fromisoformat(end_date)

    balance = BalanceService(db.session).get_user_balance(
        group_id, user_id, start_date, end_date
    )

    return jsonify(create_success_response(balance).model_dump())