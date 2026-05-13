from flask import Blueprint, request, jsonify
from models import db, Comparison, ComparisonItem, Project, User
from utils import api_response, current_user
from auth_middleware import require_role
from functools import wraps

comparisons_bp = Blueprint('comparisons', __name__)


def require_auth(f):
    """Backwards-compatible shim. Real auth runs in auth_middleware.enforce_auth.

    Existing handlers in this file read request.user_id; we populate it from
    the authenticated user attached to flask.g by the global before_request.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = current_user()
        request.user_id = user.id if user else None
        
        return f(*args, **kwargs)
    return decorated_function


@comparisons_bp.route('/', methods=['GET'])
@require_auth
def get_comparisons():
    """Get all comparisons for the authenticated user"""
    try:
        user_id = request.user_id
        comparisons = Comparison.query.filter_by(user_id=user_id).all()
        
        return api_response(
            data=[comp.to_dict() for comp in comparisons],
            message="Comparisons retrieved successfully"
        )
    except Exception as e:
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/', methods=['POST'])
@require_role('corporate', 'admin')
@require_auth
def create_comparison():
    """Create a new comparison"""
    try:
        data = request.get_json()
        user_id = request.user_id
        
        # Validate required fields
        if not data.get('name'):
            return api_response(error="Comparison name is required", status_code=400)
        
        # Create comparison
        comparison = Comparison(
            user_id=user_id,
            name=data['name'],
            description=data.get('description', '')
        )
        db.session.add(comparison)
        db.session.flush()
        
        # Add projects if provided
        if data.get('project_ids'):
            for project_id in data['project_ids']:
                # Verify project exists
                project = Project.query.get(project_id)
                if not project:
                    continue
                
                item = ComparisonItem(
                    comparison_id=comparison.id,
                    project_id=project_id
                )
                db.session.add(item)
        
        db.session.commit()
        
        return api_response(
            data=comparison.to_dict(),
            message="Comparison created successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>', methods=['GET'])
@require_auth
def get_comparison(comparison_id):
    """Get a specific comparison with all its projects"""
    try:
        user_id = request.user_id
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        return api_response(
            data=comparison.to_dict(),
            message="Comparison retrieved successfully"
        )
    except Exception as e:
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>', methods=['PUT'])
@require_role('corporate', 'admin')
@require_auth
def update_comparison(comparison_id):
    """Update a comparison"""
    try:
        data = request.get_json()
        user_id = request.user_id
        
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        # Update fields
        if 'name' in data:
            comparison.name = data['name']
        if 'description' in data:
            comparison.description = data['description']
        
        db.session.commit()
        
        return api_response(
            data=comparison.to_dict(),
            message="Comparison updated successfully"
        )
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>', methods=['DELETE'])
@require_role('corporate', 'admin')
@require_auth
def delete_comparison(comparison_id):
    """Delete a comparison"""
    try:
        user_id = request.user_id
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        db.session.delete(comparison)
        db.session.commit()
        
        return api_response(message="Comparison deleted successfully")
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>/projects', methods=['POST'])
@require_role('corporate', 'admin')
@require_auth
def add_project_to_comparison(comparison_id):
    """Add a project to a comparison"""
    try:
        data = request.get_json()
        user_id = request.user_id
        
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        project_id = data.get('project_id')
        if not project_id:
            return api_response(error="Project ID is required", status_code=400)
        
        # Check if project already exists in comparison
        existing_item = ComparisonItem.query.filter_by(
            comparison_id=comparison_id, 
            project_id=project_id
        ).first()
        
        if existing_item:
            return api_response(error="Project already in comparison", status_code=400)
        
        # Verify project exists
        project = Project.query.get(project_id)
        if not project:
            return api_response(error="Project not found", status_code=404)
        
        # Add project to comparison
        item = ComparisonItem(
            comparison_id=comparison_id,
            project_id=project_id,
            notes=data.get('notes', ''),
            priority=data.get('priority', 0)
        )
        db.session.add(item)
        db.session.commit()
        
        return api_response(
            data=item.to_dict(),
            message="Project added to comparison successfully",
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>/projects/<int:project_id>', methods=['DELETE'])
@require_role('corporate', 'admin')
@require_auth
def remove_project_from_comparison(comparison_id, project_id):
    """Remove a project from a comparison"""
    try:
        user_id = request.user_id
        
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        item = ComparisonItem.query.filter_by(
            comparison_id=comparison_id, 
            project_id=project_id
        ).first()
        
        if not item:
            return api_response(error="Project not found in comparison", status_code=404)
        
        db.session.delete(item)
        db.session.commit()
        
        return api_response(message="Project removed from comparison successfully")
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)


@comparisons_bp.route('/<int:comparison_id>/projects/<int:project_id>', methods=['PUT'])
@require_role('corporate', 'admin')
@require_auth
def update_project_in_comparison(comparison_id, project_id):
    """Update project notes or priority in comparison"""
    try:
        data = request.get_json()
        user_id = request.user_id
        
        comparison = Comparison.query.filter_by(id=comparison_id, user_id=user_id).first()
        if not comparison:
            return api_response(error="Comparison not found", status_code=404)
        
        item = ComparisonItem.query.filter_by(
            comparison_id=comparison_id, 
            project_id=project_id
        ).first()
        
        if not item:
            return api_response(error="Project not found in comparison", status_code=404)
        
        # Update fields
        if 'notes' in data:
            item.notes = data['notes']
        if 'priority' in data:
            item.priority = data['priority']
        
        db.session.commit()
        
        return api_response(
            data=item.to_dict(),
            message="Project in comparison updated successfully"
        )
    except Exception as e:
        db.session.rollback()
        return api_response(error=str(e), status_code=500)
