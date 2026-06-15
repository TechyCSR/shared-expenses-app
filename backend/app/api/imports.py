from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError as PydanticValidationError
from app.extensions import db
from app.schemas.import_job import ImportAnomalyResolve, ImportCommitRequest
from app.schemas.common import create_success_response, create_error_response
from app.services.csv_import_service import CSVImportService
from app.services.user_service import UserService
from app.models import ImportJob, ImportAnomaly, ImportReport
from sqlalchemy import select
import uuid

bp = Blueprint("imports", __name__)


@bp.route("/groups/<uuid:group_id>/imports", methods=["POST"])
@jwt_required()
def upload_csv(group_id):
    clerk_id = get_jwt_identity()
    user = UserService(db.session).get_by_clerk_id(clerk_id)

    if "file" not in request.files:
        return create_error_response("VALIDATION_ERROR", "No file provided", {}, 400)

    file = request.files["file"]
    if not file.filename or not file.filename.endswith(".csv"):
        return create_error_response("VALIDATION_ERROR", "File must be CSV", {}, 400)

    csv_content = file.read().decode("utf-8")

    job = CSVImportService(db.session).parse_and_validate(
        csv_content=csv_content,
        group_id=group_id,
        uploaded_by=user.id,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(job.id),
        "group_id": str(job.group_id),
        "filename": job.filename,
        "status": job.status,
        "total_rows": job.total_rows,
        "created_at": job.created_at.isoformat(),
    }).model_dump()), 201


@bp.route("/imports/<uuid:job_id>", methods=["GET"])
@jwt_required()
def get_import_job(job_id):
    result = db.session.execute(select(ImportJob).where(ImportJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        return create_error_response("NOT_FOUND", "Import job not found", {}, 404)

    return jsonify(create_success_response({
        "id": str(job.id),
        "group_id": str(job.group_id),
        "filename": job.filename,
        "status": job.status,
        "total_rows": job.total_rows,
        "imported_rows": job.imported_rows,
        "rejected_rows": job.rejected_rows,
        "created_at": job.created_at.isoformat(),
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }).model_dump())


@bp.route("/imports/<uuid:job_id>/anomalies", methods=["GET"])
@jwt_required()
def list_anomalies(job_id):
    result = db.session.execute(
        select(ImportAnomaly)
        .where(ImportAnomaly.import_job_id == job_id)
        .order_by(ImportAnomaly.row_number, ImportAnomaly.severity)
    )
    anomalies = result.scalars().all()

    return jsonify(create_success_response([{
        "id": str(a.id),
        "import_job_id": str(a.import_job_id),
        "row_number": a.row_number,
        "anomaly_type": a.anomaly_type,
        "severity": a.severity,
        "message": a.message,
        "suggested_action": a.suggested_action,
        "raw_row_data": a.raw_row_data,
        "user_decision": a.user_decision,
        "user_resolution": a.user_resolution,
        "created_at": a.created_at.isoformat(),
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
    } for a in anomalies]).model_dump())


@bp.route("/imports/<uuid:job_id>/anomalies/<uuid:anomaly_id>", methods=["PATCH"])
@jwt_required()
def resolve_anomaly(job_id, anomaly_id):
    try:
        data = request.get_json()
        schema = ImportAnomalyResolve(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    anomaly = CSVImportService(db.session).resolve_anomaly(
        anomaly_id=anomaly_id,
        decision=schema.decision,
        resolution=schema.resolution,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(anomaly.id),
        "decision": anomaly.user_decision,
        "resolved_at": anomaly.resolved_at.isoformat() if anomaly.resolved_at else None,
    }).model_dump())


@bp.route("/imports/<uuid:job_id>/commit", methods=["POST"])
@jwt_required()
def commit_import(job_id):
    try:
        data = request.get_json() or {}
        schema = ImportCommitRequest(**data)
    except PydanticValidationError as e:
        return create_error_response("VALIDATION_ERROR", "Invalid request", e.errors(), 400)

    job = CSVImportService(db.session).commit_import(
        job_id=job_id,
        force=schema.force,
    )
    db.session.commit()

    return jsonify(create_success_response({
        "id": str(job.id),
        "status": job.status,
        "total_rows": job.total_rows,
        "imported_rows": job.imported_rows,
        "rejected_rows": job.rejected_rows,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }).model_dump())


@bp.route("/imports/<uuid:job_id>/report", methods=["GET"])
@jwt_required()
def get_import_report(job_id):
    report = CSVImportService(db.session).get_report(job_id)

    return jsonify(create_success_response({
        "import_job_id": str(report.import_job_id),
        "report_data": report.report_data,
        "generated_at": report.generated_at.isoformat(),
    }).model_dump())


@bp.route("/imports/<uuid:job_id>/report/download", methods=["GET"])
@jwt_required()
def download_import_report(job_id):
    """Download a human-readable Markdown import report."""
    job = db.session.execute(
        select(ImportJob).where(ImportJob.id == job_id)
    ).scalar_one_or_none()
    if not job:
        return create_error_response("NOT_FOUND", "Import job not found", {}, 404)

    markdown = CSVImportService(db.session).get_report_markdown(job_id)
    filename = f"import_report_{job.filename.rsplit('.', 1)[0]}.md"
    return Response(
        markdown,
        mimetype="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@bp.route("/imports/<uuid:job_id>/approve-all", methods=["POST"])
@jwt_required()
def approve_all_anomalies(job_id):
    """Approve or reject all unresolved anomalies for a job in one go."""
    try:
        data = request.get_json() or {}
    except Exception:
        data = {}

    decision = (data.get("decision") or "approve").lower()
    if decision not in ("approve", "reject"):
        return create_error_response("VALIDATION_ERROR", "decision must be 'approve' or 'reject'", {}, 400)

    count = CSVImportService(db.session).approve_all_anomalies(job_id, decision=decision)
    db.session.commit()

    return jsonify(create_success_response({
        "updated": count,
        "decision": decision,
    }).model_dump())