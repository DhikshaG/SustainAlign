from flask import Blueprint, jsonify

from auth_middleware import require_role


reports_bp = Blueprint('reports', __name__)


@reports_bp.post('/generate')
@require_role('corporate', 'admin')
def generate_report():
    # Placeholder generator. Real implementation lands in Phase 2-A (week 3).
    return jsonify({'status': 'queued'}), 202


