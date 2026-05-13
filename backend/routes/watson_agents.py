"""
IBM WatsonX Orchestrate Agents API Routes
Integration with SustainAlign backend
"""

from flask import Blueprint, request, jsonify, current_app, g
import logging
from typing import Dict, Any

from ibm_watson.watson_service import watson_service
from models.user import User
from models.projects import Project
from models.company_details import Company
from auth_middleware import require_role
from utils import current_user as _current_user

logger = logging.getLogger(__name__)

# Create Blueprint
watson_bp = Blueprint('watson_agents', __name__, url_prefix='/api/watson')


# Shim layer so the existing @login_required decorators and `current_user.id`
# references continue to work without touching every handler. The real auth
# is enforced by auth_middleware.enforce_auth (registered globally) plus the
# per-route role decorator below.
login_required = require_role('corporate', 'admin')


class _CurrentUserProxy:
    """Behaves like flask_login.current_user but is backed by g.user."""

    @property
    def _user(self):
        return _current_user()

    @property
    def id(self):
        u = self._user
        return u.id if u else None

    @property
    def is_admin(self):
        return getattr(g, 'role', None) == 'admin'

    @property
    def is_authenticated(self):
        return self._user is not None

    def __getattr__(self, item):
        u = self._user
        if u is None:
            raise AttributeError(item)
        return getattr(u, item)


current_user = _CurrentUserProxy()

@watson_bp.route('/initialize', methods=['POST'])
@login_required
def initialize_watson():
    """Initialize IBM WatsonX Orchestrate service"""
    try:
        if not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        success = watson_service.initialize()
        
        if success:
            return jsonify({
                'message': 'Watson service initialized successfully',
                'status': 'initialized'
            }), 200
        else:
            return jsonify({
                'message': 'Watson service initialization failed',
                'status': 'failed'
            }), 500
            
    except Exception as e:
        logger.error(f"Error initializing Watson service: {str(e)}")
        return jsonify({'error': f'Initialization failed: {str(e)}'}), 500

@watson_bp.route('/analyze-alignment', methods=['POST'])
@login_required
def analyze_project_alignment():
    """Analyze project alignment with company objectives"""
    try:
        data = request.get_json()
        
        if not data or 'project_id' not in data:
            return jsonify({'error': 'Project ID is required'}), 400
        
        project_id = data['project_id']
        
        # Get project data
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get company profile
        company = Company.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        # Prepare data for analysis
        project_data = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'budget': project.budget,
            'timeline_months': project.timeline_months,
            'location': project.location,
            'sdg_focus': project.sdg_focus or [],
            'impact_metrics': project.impact_metrics or {},
            'complexity_level': project.complexity_level or 'medium',
            'expected_beneficiaries': project.expected_beneficiaries or 0
        }
        
        company_profile = {
            'id': company.id,
            'company_name': company.company_name,
            'sdg_priorities': company.sdg_priorities or [],
            'geographic_focus': company.geographic_focus or [],
            'available_budget': company.available_budget or 0,
            'csr_focus_areas': company.csr_focus_areas or []
        }
        
        # Perform analysis
        result = watson_service.analyze_project_alignment(project_data, company_profile)
        
        return jsonify(result), 200 if result.get('success', False) else 500
        
    except Exception as e:
        logger.error(f"Error analyzing project alignment: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@watson_bp.route('/evaluate-feasibility', methods=['POST'])
@login_required
def evaluate_project_feasibility():
    """Evaluate project feasibility"""
    try:
        data = request.get_json()
        
        if not data or 'project_id' not in data:
            return jsonify({'error': 'Project ID is required'}), 400
        
        project_id = data['project_id']
        
        # Get project data
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get company profile
        company = Company.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        # Prepare data for analysis
        project_data = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'budget': project.budget,
            'timeline_months': project.timeline_months,
            'location': project.location,
            'complexity_level': project.complexity_level or 'medium',
            'risk_level': project.risk_level or 'medium',
            'team_size': project.team_size or 5,
            'technology_requirements': project.technology_requirements or [],
            'resource_requirements': project.resource_requirements or {}
        }
        
        company_profile = {
            'id': company.id,
            'company_name': company.company_name,
            'capabilities': company.capabilities or [],
            'available_resources': company.available_resources or {}
        }
        
        # Perform evaluation
        result = watson_service.evaluate_project_feasibility(project_data, company_profile)
        
        return jsonify(result), 200 if result.get('success', False) else 500
        
    except Exception as e:
        logger.error(f"Error evaluating project feasibility: {str(e)}")
        return jsonify({'error': f'Evaluation failed: {str(e)}'}), 500

@watson_bp.route('/assess-impact', methods=['POST'])
@login_required
def assess_project_impact():
    """Assess project impact"""
    try:
        data = request.get_json()
        
        if not data or 'project_id' not in data:
            return jsonify({'error': 'Project ID is required'}), 400
        
        project_id = data['project_id']
        
        # Get project data
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Prepare data for analysis
        project_data = {
            'id': project.id,
            'name': project.name,
            'impact_metrics': project.impact_metrics or {},
            'baseline_data': project.baseline_data or {},
            'timeframe': data.get('timeframe', '12_months'),
            'expected_beneficiaries': project.expected_beneficiaries or 0,
            'sustainability_score': project.sustainability_score or 0.5
        }
        
        # Perform assessment
        result = watson_service.assess_project_impact(project_data)
        
        return jsonify(result), 200 if result.get('success', False) else 500
        
    except Exception as e:
        logger.error(f"Error assessing project impact: {str(e)}")
        return jsonify({'error': f'Assessment failed: {str(e)}'}), 500

@watson_bp.route('/optimize-budget', methods=['POST'])
@login_required
def optimize_budget_allocation():
    """Optimize budget allocation across multiple projects"""
    try:
        data = request.get_json()
        
        if not data or 'available_budget' not in data or 'project_ids' not in data:
            return jsonify({'error': 'Available budget and project IDs are required'}), 400
        
        available_budget = float(data['available_budget'])
        project_ids = data['project_ids']
        
        if not isinstance(project_ids, list) or len(project_ids) == 0:
            return jsonify({'error': 'At least one project ID is required'}), 400
        
        # Get projects data
        projects = Project.query.filter(Project.id.in_(project_ids)).all()
        if len(projects) != len(project_ids):
            return jsonify({'error': 'One or more projects not found'}), 404
        
        # Get company profile for constraints
        company = Company.query.filter_by(user_id=current_user.id).first()
        
        # Prepare project list
        project_list = []
        for project in projects:
            project_data = {
                'id': project.id,
                'name': project.name,
                'budget': project.budget,
                'timeline_months': project.timeline_months,
                'location': project.location,
                'sdg_focus': project.sdg_focus or [],
                'expected_beneficiaries': project.expected_beneficiaries or 0,
                'complexity_level': project.complexity_level or 'medium',
                'risk_level': project.risk_level or 'medium',
                'expected_return': project.expected_return or 0,
                'sustainability_score': project.sustainability_score or 0.5,
                'sdg_alignment_score': project.sdg_alignment_score or 0.5
            }
            project_list.append(project_data)
        
        # Prepare constraints
        constraints = data.get('constraints', {})
        if company:
            constraints.update({
                'company_sdg_priorities': company.sdg_priorities or [],
                'geographic_focus': company.geographic_focus or [],
                'budget_preferences': {
                    'min_budget': constraints.get('min_budget', 0),
                    'max_budget': constraints.get('max_budget', available_budget)
                }
            })
        
        # Perform optimization
        result = watson_service.optimize_budget_allocation(
            available_budget, project_list, constraints
        )
        
        return jsonify(result), 200 if result.get('success', False) else 500
        
    except Exception as e:
        logger.error(f"Error optimizing budget allocation: {str(e)}")
        return jsonify({'error': f'Optimization failed: {str(e)}'}), 500

@watson_bp.route('/comprehensive-analysis', methods=['POST'])
@login_required
def get_comprehensive_analysis():
    """Get comprehensive project analysis using multiple agents"""
    try:
        data = request.get_json()
        
        if not data or 'project_id' not in data:
            return jsonify({'error': 'Project ID is required'}), 400
        
        project_id = data['project_id']
        
        # Get project data
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get company profile
        company = CompanyDetails.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        # Prepare comprehensive project data
        project_data = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'budget': project.budget,
            'timeline_months': project.timeline_months,
            'location': project.location,
            'sdg_focus': project.sdg_focus or [],
            'impact_metrics': project.impact_metrics or {},
            'baseline_data': project.baseline_data or {},
            'complexity_level': project.complexity_level or 'medium',
            'risk_level': project.risk_level or 'medium',
            'expected_beneficiaries': project.expected_beneficiaries or 0,
            'sustainability_score': project.sustainability_score or 0.5,
            'expected_return': project.expected_return or 0,
            'team_size': project.team_size or 5,
            'technology_requirements': project.technology_requirements or [],
            'resource_requirements': project.resource_requirements or {}
        }
        
        company_profile = {
            'id': company.id,
            'company_name': company.company_name,
            'sdg_priorities': company.sdg_priorities or [],
            'geographic_focus': company.geographic_focus or [],
            'available_budget': company.available_budget or 0,
            'csr_focus_areas': company.csr_focus_areas or [],
            'capabilities': company.capabilities or [],
            'available_resources': company.available_resources or {}
        }
        
        # Perform comprehensive analysis
        result = watson_service.get_comprehensive_analysis(project_data, company_profile)
        
        return jsonify(result), 200 if result.get('success', False) else 500
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@watson_bp.route('/agents/status', methods=['GET'])
@login_required
def get_agents_status():
    """Get status of deployed agents"""
    try:
        if not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        agents = watson_service.agent_manager.list_agents()
        
        return jsonify({
            'agents': agents,
            'service_initialized': watson_service.initialized,
            'config_configured': watson_service.config.is_configured()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting agents status: {str(e)}")
        return jsonify({'error': f'Failed to get agents status: {str(e)}'}), 500

@watson_bp.route('/tools/execute', methods=['POST'])
@login_required
def execute_tool():
    """Execute a specific Watson tool"""
    try:
        data = request.get_json()
        
        if not data or 'tool_name' not in data or 'parameters' not in data:
            return jsonify({'error': 'Tool name and parameters are required'}), 400
        
        tool_name = data['tool_name']
        parameters = data['parameters']
        
        if tool_name not in watson_service.tools:
            return jsonify({'error': f'Unknown tool: {tool_name}'}), 400
        
        # Execute the tool
        tool_function = watson_service.tools[tool_name]
        result = tool_function(**parameters)
        
        return jsonify({
            'tool_name': tool_name,
            'result': result,
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return jsonify({'error': f'Tool execution failed: {str(e)}'}), 500

@watson_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for Watson service"""
    try:
        return jsonify({
            'status': 'healthy',
            'service_initialized': watson_service.initialized,
            'config_configured': watson_service.config.is_configured(),
            'available_tools': list(watson_service.tools.keys()),
            'available_agents': list(watson_service.config.agent_configs.keys())
        }), 200
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
