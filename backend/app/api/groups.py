from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.group import GroupCreate, GroupUpdate, GroupMemberAdd
from app.schemas.common import create_success_response, create_error_response, create_paginated_response
from app.services.group_service import GroupService
from app.services.user_service import UserService

bp = Blueprint("groups", __name__)


@bp.route("", methods=["GET"])
@jwt_required()
def list_groups():
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)
    groups = GroupService(db.session).get_user_groups(user.id)

    result = []
    for g in groups:
        members = GroupService(db.session).get_members(g.id)
        result.append({
            "id": str(g.id),
            "name": g.name,
            "description": g.description,
            "default_currency": g.default_currency,
            "created_by": str(g.created_by),
            "created_at": g.created_at.isoformat(),
            "updated_at": g.updated_at.isoformat(),
            "member_count": len([m for m in members if m.is_active()]),
        })

    return jsonify(create_success_response(result).model_dump())


@bp.route("", methods=["POST"])
@jwt_required()
def create_group():
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = GroupCreate(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    group = GroupService(db.session).create_group(
        name=schema.name,
        created_by=user.id,
        description=schema.description,
        default_currency=schema.default_currency,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(group.id),
        "name": group.name,
        "description": group.description,
        "default_currency": group.default_currency,
        "created_by": str(group.created_by),
        "created_at": group.created_at.isoformat(),
        "updated_at": group.updated_at.isoformat(),
        "member_count": 1,
    }).model_dump()), 201


@bp.route("/<uuid:group_id>", methods=["GET"])
@jwt_required()
def get_group(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    group = GroupService(db.session).get_group(group_id)
    members = GroupService(db.session).get_members(group_id)

    active_members = [m for m in members if m.is_active()]
    is_member = any(m.user_id == user.id and m.is_active() for m in members)
    user_member = next((m for m in members if m.user_id == user.id and m.is_active()), None)

    return jsonify(create_success_response({
        "id": str(group.id),
        "name": group.name,
        "description": group.description,
        "default_currency": group.default_currency,
        "created_by": str(group.created_by),
        "created_at": group.created_at.isoformat(),
        "updated_at": group.updated_at.isoformat(),
        "member_count": len(active_members),
        "is_member": is_member,
        "user_role": user_member.role if user_member else None,
    }).model_dump())


@bp.route("/<uuid:group_id>", methods=["PATCH"])
@jwt_required()
def update_group(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = GroupUpdate(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    group = GroupService(db.session).update_group(
        group_id=group_id,
        user_id=user.id,
        name=schema.name,
        description=schema.description,
        default_currency=schema.default_currency,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(group.id),
        "name": group.name,
        "description": group.description,
        "default_currency": group.default_currency,
        "created_by": str(group.created_by),
        "created_at": group.created_at.isoformat(),
        "updated_at": group.updated_at.isoformat(),
    }).model_dump())


@bp.route("/<uuid:group_id>", methods=["DELETE"])
@jwt_required()
def delete_group(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    GroupService(db.session).delete_group(group_id, user.id)
    db.session.commit()

    return jsonify(create_success_response({"message": "Group deleted"}).model_dump()), 200


@bp.route("/<uuid:group_id>/members", methods=["GET"])
@jwt_required()
def list_members(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    members = GroupService(db.session).get_members(group_id)
    result = []

    from app.models import User
    for m in members:
        member_user = db.session.get(User, m.user_id)
        result.append({
            "id": str(m.id),
            "user_id": str(m.user_id),
            "clerk_id": member_user.clerk_id if member_user else None,
            "email": member_user.email if member_user else "",
            "full_name": member_user.full_name if member_user else "",
            "avatar_url": member_user.avatar_url if member_user else None,
            "role": m.role,
            "joined_at": m.joined_at.isoformat(),
            "left_at": m.left_at.isoformat() if m.left_at else None,
            "is_active": m.is_active(),
        })

    return jsonify(create_success_response(result).model_dump())


@bp.route("/<uuid:group_id>/members/timeline", methods=["GET"])
@jwt_required()
def member_timeline(group_id):
    timeline = GroupService(db.session).get_member_timeline(group_id)

    def serialize_members(members):
        result = []
        from app.models import User
        for m in members:
            member_user = db.session.get(User, m.user_id)
            result.append({
                "id": str(m.id),
                "user_id": str(m.user_id),
                "email": member_user.email if member_user else "",
                "full_name": member_user.full_name if member_user else "",
                "role": m.role,
                "joined_at": m.joined_at.isoformat(),
                "left_at": m.left_at.isoformat() if m.left_at else None,
                "is_active": m.is_active(),
            })
        return result

    return jsonify(create_success_response({
        "current_members": serialize_members(timeline["current_members"]),
        "past_members": serialize_members(timeline["past_members"]),
    }).model_dump())


@bp.route("/<uuid:group_id>/members", methods=["POST"])
@jwt_required()
def add_member(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    try:
        data = request.get_json()
        schema = GroupMemberAdd(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    membership = GroupService(db.session).add_member(
        group_id=group_id,
        admin_id=user.id,
        email=schema.email,
        role=schema.role,
    )
    db.session.commit()

    from app.models import User
    member_user = db.session.get(User, membership.user_id)

    return jsonify(create_success_response({
        "id": str(membership.id),
        "user_id": str(membership.user_id),
        "email": member_user.email,
        "full_name": member_user.full_name,
        "role": membership.role,
        "joined_at": membership.joined_at.isoformat(),
    }).model_dump()), 201


@bp.route("/<uuid:group_id>/members/<uuid:user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(group_id, user_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    membership = GroupService(db.session).remove_member(
        group_id=group_id,
        admin_id=user.id,
        user_id=user_id,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "message": "Member removed",
        "left_at": membership.left_at.isoformat() if membership.left_at else None,
    }).model_dump())