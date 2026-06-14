from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.schemas.common import create_success_response, create_error_response
from app.services.expense_service import ExpenseService
from app.services.user_service import UserService
from datetime import date
import uuid

bp = Blueprint("expenses", __name__)


@bp.route("/groups/<uuid:group_id>/expenses", methods=["GET"])
@jwt_required()
def list_expenses(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if start_date:
        start_date = date.fromisoformat(start_date)
    if end_date:
        end_date = date.fromisoformat(end_date)

    expenses, total = ExpenseService(db.session).get_group_expenses(
        group_id, user.id, page, per_page, start_date, end_date
    )

    result = []
    for exp in expenses:
        result.append({
            "id": str(exp.id),
            "group_id": str(exp.group_id),
            "description": exp.description,
            "amount": str(exp.amount),
            "currency": exp.currency,
            "expense_date": exp.expense_date.isoformat(),
            "split_type": exp.split_type,
            "paid_by": str(exp.paid_by),
            "payer_name": exp.payer.full_name if exp.payer else None,
            "created_by": str(exp.created_by),
            "created_at": exp.created_at.isoformat(),
            "updated_at": exp.updated_at.isoformat(),
        })

    return jsonify(create_success_response({
        "expenses": result,
        "total": total,
        "page": page,
        "per_page": per_page,
    }).model_dump())


@bp.route("/groups/<uuid:group_id>/expenses", methods=["POST"])
@jwt_required()
def create_expense(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = ExpenseCreate(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    expense = ExpenseService(db.session).create_expense(
        group_id=group_id,
        created_by=user.id,
        description=schema.description,
        amount=schema.amount,
        currency=schema.currency,
        expense_date=schema.expense_date,
        split_type=schema.split_type,
        paid_by=schema.paid_by,
        participants=[p.model_dump() for p in schema.participants],
        notes=schema.notes,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(expense.id),
        "group_id": str(expense.group_id),
        "description": expense.description,
        "amount": str(expense.amount),
        "currency": expense.currency,
        "expense_date": expense.expense_date.isoformat(),
        "split_type": expense.split_type,
        "paid_by": str(expense.paid_by),
        "created_by": str(expense.created_by),
        "created_at": expense.created_at.isoformat(),
    }).model_dump()), 201


@bp.route("/groups/<uuid:group_id>/expenses/<uuid:expense_id>", methods=["GET"])
@jwt_required()
def get_expense(group_id, expense_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    expense = ExpenseService(db.session).get_expense(expense_id, user.id)

    participants = []
    for p in expense.participants:
        participants.append({
            "id": str(p.id),
            "user_id": str(p.user_id),
            "user_email": p.user.email if p.user else "",
            "user_name": p.user.full_name if p.user else None,
            "share_value": str(p.share_value) if p.share_value else None,
            "amount_owed": str(p.amount_owed),
        })

    return jsonify(create_success_response({
        "id": str(expense.id),
        "group_id": str(expense.group_id),
        "description": expense.description,
        "amount": str(expense.amount),
        "currency": expense.currency,
        "expense_date": expense.expense_date.isoformat(),
        "split_type": expense.split_type,
        "paid_by": str(expense.paid_by),
        "payer_name": expense.payer.full_name if expense.payer else None,
        "notes": expense.notes,
        "created_by": str(expense.created_by),
        "created_at": expense.created_at.isoformat(),
        "updated_at": expense.updated_at.isoformat(),
        "participants": participants,
    }).model_dump())


@bp.route("/groups/<uuid:group_id>/expenses/<uuid:expense_id>", methods=["PATCH"])
@jwt_required()
def update_expense(group_id, expense_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = ExpenseUpdate(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    update_data = schema.model_dump(exclude_unset=True)
    expense = ExpenseService(db.session).update_expense(
        expense_id=expense_id,
        user_id=user.id,
        **update_data,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(expense.id),
        "description": expense.description,
        "updated_at": expense.updated_at.isoformat(),
    }).model_dump())


@bp.route("/groups/<uuid:group_id>/expenses/<uuid:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(group_id, expense_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    ExpenseService(db.session).delete_expense(expense_id, user.id)
    db.session.commit()

    return jsonify(create_success_response({"message": "Expense deleted"}).model_dump())