from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.settlement import SettlementCreate
from app.schemas.common import create_success_response, create_error_response
from app.services.settlement_service import SettlementService
from app.services.user_service import UserService

bp = Blueprint("settlements", __name__)


@bp.route("/groups/<uuid:group_id>/settlements", methods=["GET"])
@jwt_required()
async def list_settlements(group_id):
    clerk_id = get_jwt_identity()
    user = await UserService(db.session).get_by_clerk_id(clerk_id)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    settlements, total = await SettlementService(db.session).get_group_settlements(
        group_id, user.id, page, per_page
    )

    result = []
    for s in settlements:
        result.append({
            "id": str(s.id),
            "group_id": str(s.group_id),
            "from_user_id": str(s.from_user_id),
            "to_user_id": str(s.to_user_id),
            "amount": str(s.amount),
            "currency": s.currency,
            "settlement_date": s.settlement_date.isoformat(),
            "notes": s.notes,
            "created_by": str(s.created_by),
            "created_at": s.created_at.isoformat(),
        })

    return jsonify(create_success_response({
        "settlements": result,
        "total": total,
        "page": page,
        "per_page": per_page,
    }))


@bp.route("/groups/<uuid:group_id>/settlements", methods=["POST"])
@jwt_required()
async def create_settlement(group_id):
    clerk_id = get_jwt_identity()
    user = await UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = SettlementCreate(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    settlement = await SettlementService(db.session).create_settlement(
        group_id=group_id,
        created_by=user.id,
        from_user_id=schema.from_user_id,
        to_user_id=schema.to_user_id,
        amount=schema.amount,
        currency=schema.currency,
        settlement_date=schema.settlement_date,
        notes=schema.notes,
    )
    await db.session.commit()

    return jsonify(create_success_response({
        "id": str(settlement.id),
        "group_id": str(settlement.group_id),
        "from_user_id": str(settlement.from_user_id),
        "to_user_id": str(settlement.to_user_id),
        "amount": str(settlement.amount),
        "currency": settlement.currency,
        "settlement_date": settlement.settlement_date.isoformat(),
        "notes": settlement.notes,
        "created_by": str(settlement.created_by),
        "created_at": settlement.created_at.isoformat(),
    })), 201


@bp.route("/groups/<uuid:group_id>/settlements/<uuid:settlement_id>", methods=["DELETE"])
@jwt_required()
async def delete_settlement(group_id, settlement_id):
    clerk_id = get_jwt_identity()
    user = await UserService(db.session).get_by_clerk_id(clerk_id)

    await SettlementService(db.session).delete_settlement(settlement_id, user.id)
    await db.session.commit()

    return jsonify(create_success_response({"message": "Settlement deleted"}))