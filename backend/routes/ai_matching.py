from flask import Blueprint, request, jsonify
from ai_models.ai_matching_service import AIMatchingService
from models.base import db
from auth_middleware import require_role
import logging

logger = logging.getLogger(__name__)

ai_matching_bp = Blueprint('ai_matching', __name__, url_prefix='/api/ai-matching')

# AI matching is a corporate-facing feature. NGO own-results view will be added
# in Phase 1 as a separate endpoint with explicit ownership filtering.
require_ai_auth = require_role('corporate', 'admin')

@ai_matching_bp.route('/generate-rationale', methods=['POST'])
@require_ai_auth
def generate_rationale():
    """Generate AI-powered project matching rationale"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        company_id = data.get('company_id')
        project_filters = data.get('filters', {})
        
        if not company_id:
            return jsonify({'error': 'Company ID is required'}), 400
        
        # Generate rationale
        rationale_data = AIMatchingService.generate_project_matching_rationale(
            company_id=company_id,
            project_filters=project_filters
        )
        
        if rationale_data:
            return jsonify({
                'success': True,
                'message': 'Rationale generated successfully',
                'data': rationale_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate rationale'
            }), 500
            
    except Exception as e:
        logger.error(f"Error generating rationale: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/rationales/<int:company_id>', methods=['GET'])
@require_ai_auth
def get_company_rationales(company_id):
    """Get all rationales for a company"""
    try:
        rationales = AIMatchingService.get_company_rationales(company_id)
        
        return jsonify({
            'success': True,
            'data': rationales
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting company rationales: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/rationales/detail/<int:rationale_id>', methods=['GET'])
@require_ai_auth
def get_rationale_detail(rationale_id):
    """Get detailed rationale by ID"""
    try:
        rationale = AIMatchingService.get_rationale_by_id(rationale_id)
        
        if rationale:
            return jsonify({
                'success': True,
                'data': rationale
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Rationale not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting rationale detail: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/rationales/<int:rationale_id>', methods=['PUT'])
@require_ai_auth
def update_rationale(rationale_id):
    """Update rationale"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        success = AIMatchingService.update_rationale(rationale_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Rationale updated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update rationale'
            }), 500
            
    except Exception as e:
        logger.error(f"Error updating rationale: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/rationales/<int:rationale_id>/notes', methods=['POST'])
@require_ai_auth
def add_rationale_note(rationale_id):
    """Add note to rationale"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        author = data.get('author', 'Anonymous')
        content = data.get('content')
        
        if not content:
            return jsonify({'error': 'Note content is required'}), 400
        
        success = AIMatchingService.add_rationale_note(rationale_id, author, content)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Note added successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to add note'
            }), 500
            
    except Exception as e:
        logger.error(f"Error adding rationale note: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/company/<int:company_id>/data', methods=['GET'])
@require_ai_auth
def get_company_data(company_id):
    """Get company data for AI analysis"""
    try:
        company_data = AIMatchingService.get_company_data(company_id)
        
        if company_data:
            return jsonify({
                'success': True,
                'data': company_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Company not found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error getting company data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/available-projects', methods=['GET'])
@require_ai_auth
def get_available_projects():
    """Get available projects for matching"""
    try:
        # Get filters from query parameters
        filters = {}
        
        sdg_goals = request.args.get('sdg_goals')
        if sdg_goals:
            filters['sdg_goals'] = sdg_goals
        
        max_budget = request.args.get('max_budget')
        if max_budget:
            try:
                filters['max_budget'] = float(max_budget)
            except ValueError:
                return jsonify({'error': 'Invalid max_budget parameter'}), 400
        
        location_country = request.args.get('location_country')
        if location_country:
            filters['location_country'] = location_country
        
        ngo_rating_min = request.args.get('ngo_rating_min')
        if ngo_rating_min:
            try:
                filters['ngo_rating_min'] = int(ngo_rating_min)
            except ValueError:
                return jsonify({'error': 'Invalid ngo_rating_min parameter'}), 400
        
        projects = AIMatchingService.get_available_projects(filters)
        
        return jsonify({
            'success': True,
            'data': projects,
            'count': len(projects)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting available projects: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_matching_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Matching Service',
        'timestamp': '2024-01-15T10:00:00Z'
    }), 200
