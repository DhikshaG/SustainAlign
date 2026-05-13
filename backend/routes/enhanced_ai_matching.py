"""
Enhanced AI Matching API Routes with IBM Watson Integration
"""

from flask import Blueprint, request, jsonify, current_app, g
import logging
from typing import Dict, Any

from ai_models.watson_enhanced_matching import watson_enhanced_matching
from models.company_details import Company
from models.projects import Project
from auth_middleware import require_role
from utils import current_user as _current_user

logger = logging.getLogger(__name__)

# Create Blueprint
enhanced_ai_bp = Blueprint('enhanced_ai_matching', __name__, url_prefix='/api/enhanced-ai')


# Shim — see routes/watson_agents.py for rationale. Scheduled for deletion in
# Day 3 of Phase 0; until then this keeps existing handlers functional with
# real auth in place of the broken flask_login dependency.
login_required = require_role('corporate', 'admin')


class _CurrentUserProxy:
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

@enhanced_ai_bp.route('/matching', methods=['POST'])
@login_required
def generate_enhanced_matching():
    """Generate enhanced project matching using AI + Watson agents"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Get company ID from current user
        company = Company.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        company_id = company.id
        
        # Extract parameters
        project_filters = data.get('filters', {})
        use_watson = data.get('use_watson', True)
        
        # Generate enhanced matching
        result = watson_enhanced_matching.generate_enhanced_project_matching(
            company_id=company_id,
            project_filters=project_filters,
            use_watson=use_watson
        )
        
        if result:
            return jsonify(result), 200
        else:
            return jsonify({'error': 'Failed to generate enhanced matching'}), 500
            
    except Exception as e:
        logger.error(f"Error generating enhanced matching: {str(e)}")
        return jsonify({'error': f'Enhanced matching failed: {str(e)}'}), 500

@enhanced_ai_bp.route('/matching/summary', methods=['GET'])
@login_required
def get_matching_summary():
    """Get summary of enhanced matching results for the company"""
    try:
        # Get company ID from current user
        company = Company.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        company_id = company.id
        
        # Get enhanced matching summary
        summary = watson_enhanced_matching.get_enhanced_matching_summary(company_id)
        
        if summary:
            return jsonify(summary), 200
        else:
            return jsonify({'error': 'No enhanced matching data found'}), 404
            
    except Exception as e:
        logger.error(f"Error getting matching summary: {str(e)}")
        return jsonify({'error': f'Failed to get matching summary: {str(e)}'}), 500

@enhanced_ai_bp.route('/project-analysis', methods=['POST'])
@login_required
def analyze_specific_project():
    """Analyze a specific project using Watson agents"""
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
            'title': project.title,
            'short_description': project.short_description,
            'funding_required': float(project.funding_required) if project.funding_required else 0,
            'duration_months': project.duration_months,
            'location_country': project.location_country,
            'sdg_goals': project.get_sdg_goals() if hasattr(project, 'get_sdg_goals') else [],
            'target_beneficiaries': project.get_target_beneficiaries() if hasattr(project, 'get_target_beneficiaries') else 0
        }
        
        company_data = {
            'id': company.id,
            'company_name': company.company_name,
            'sdg_goals': company.sdg_goals or [],
            'location_country': company.location_country or '',
            'budget': company.budget or 0,
            'focus_area': company.focus_area or []
        }
        
        # Get comprehensive analysis
        analysis = watson_enhanced_matching._get_watson_comprehensive_analysis(
            project_data, company_data
        )
        
        if analysis:
            return jsonify(analysis), 200
        else:
            return jsonify({'error': 'Failed to analyze project'}), 500
            
    except Exception as e:
        logger.error(f"Error analyzing project: {str(e)}")
        return jsonify({'error': f'Project analysis failed: {str(e)}'}), 500

@enhanced_ai_bp.route('/portfolio-optimization', methods=['POST'])
@login_required
def optimize_portfolio():
    """Optimize portfolio of projects using Watson Decision Support Agent"""
    try:
        data = request.get_json()
        
        if not data or 'project_ids' not in data:
            return jsonify({'error': 'Project IDs are required'}), 400
        
        project_ids = data['project_ids']
        available_budget = data.get('available_budget', 1000000)
        
        if not isinstance(project_ids, list) or len(project_ids) == 0:
            return jsonify({'error': 'At least one project ID is required'}), 400
        
        # Get projects data
        projects = Project.query.filter(Project.id.in_(project_ids)).all()
        if len(projects) != len(project_ids):
            return jsonify({'error': 'One or more projects not found'}), 404
        
        # Get company profile
        company = CompanyDetails.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        # Prepare project list
        project_list = []
        for project in projects:
            project_data = {
                'id': project.id,
                'name': project.title,
                'budget': float(project.funding_required) if project.funding_required else 0,
                'timeline_months': project.duration_months or 12,
                'location': project.location_country or '',
                'sdg_focus': project.get_sdg_goals() if hasattr(project, 'get_sdg_goals') else [],
                'expected_beneficiaries': project.get_target_beneficiaries() if hasattr(project, 'get_target_beneficiaries') else 0,
                'complexity_level': 'medium',
                'risk_level': 'medium',
                'expected_return': 0,
                'sustainability_score': 0.5
            }
            project_list.append(project_data)
        
        # Prepare constraints
        constraints = data.get('constraints', {})
        constraints.update({
            'company_sdg_priorities': company.sdg_goals or [],
            'geographic_focus': [company.location_country] if company.location_country else [],
            'budget_preferences': {
                'min_budget': constraints.get('min_budget', 0),
                'max_budget': constraints.get('max_budget', available_budget)
            }
        })
        
        # Get portfolio optimization
        optimization = watson_enhanced_matching._get_portfolio_optimization(
            company.to_dict(), project_list
        )
        
        if optimization:
            return jsonify(optimization), 200
        else:
            return jsonify({'error': 'Failed to optimize portfolio'}), 500
            
    except Exception as e:
        logger.error(f"Error optimizing portfolio: {str(e)}")
        return jsonify({'error': f'Portfolio optimization failed: {str(e)}'}), 500

@enhanced_ai_bp.route('/comparison', methods=['POST'])
@login_required
def compare_projects():
    """Compare multiple projects using Watson agents"""
    try:
        data = request.get_json()
        
        if not data or 'project_ids' not in data:
            return jsonify({'error': 'Project IDs are required'}), 400
        
        project_ids = data['project_ids']
        
        if not isinstance(project_ids, list) or len(project_ids) < 2:
            return jsonify({'error': 'At least two project IDs are required for comparison'}), 400
        
        # Get projects data
        projects = Project.query.filter(Project.id.in_(project_ids)).all()
        if len(projects) != len(project_ids):
            return jsonify({'error': 'One or more projects not found'}), 404
        
        # Get company profile
        company = CompanyDetails.query.filter_by(user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company profile not found'}), 404
        
        # Analyze each project
        project_analyses = []
        for project in projects:
            project_data = {
                'id': project.id,
                'title': project.title,
                'short_description': project.short_description,
                'funding_required': float(project.funding_required) if project.funding_required else 0,
                'duration_months': project.duration_months,
                'location_country': project.location_country,
                'sdg_goals': project.get_sdg_goals() if hasattr(project, 'get_sdg_goals') else [],
                'target_beneficiaries': project.get_target_beneficiaries() if hasattr(project, 'get_target_beneficiaries') else 0
            }
            
            company_data = {
                'id': company.id,
                'company_name': company.company_name,
                'sdg_goals': company.sdg_goals or [],
                'location_country': company.location_country or '',
                'budget': company.budget or 0,
                'focus_area': company.focus_area or []
            }
            
            # Get analysis for this project
            analysis = watson_enhanced_matching._get_watson_comprehensive_analysis(
                project_data, company_data
            )
            
            if analysis:
                project_analyses.append({
                    'project_id': project.id,
                    'project_name': project.title,
                    'analysis': analysis
                })
        
        # Generate comparison summary
        comparison_summary = _generate_comparison_summary(project_analyses)
        
        return jsonify({
            'comparison_type': 'watson_enhanced_comparison',
            'timestamp': watson_enhanced_matching._get_current_timestamp(),
            'project_analyses': project_analyses,
            'comparison_summary': comparison_summary,
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Error comparing projects: {str(e)}")
        return jsonify({'error': f'Project comparison failed: {str(e)}'}), 500

@enhanced_ai_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for enhanced AI matching service"""
    try:
        return jsonify({
            'status': 'healthy',
            'service_type': 'enhanced_ai_matching',
            'watson_integration': watson_enhanced_matching.watson_service.initialized,
            'base_service_available': True,
            'features': [
                'enhanced_project_matching',
                'watson_agent_integration',
                'portfolio_optimization',
                'project_comparison',
                'comprehensive_analysis'
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Error in enhanced AI matching health check: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

def _generate_comparison_summary(project_analyses: list) -> Dict[str, Any]:
    """Generate comparison summary from project analyses"""
    try:
        if not project_analyses:
            return {}
        
        # Extract scores and metrics
        scores = []
        impact_scores = []
        feasibility_scores = []
        alignment_scores = []
        
        for analysis in project_analyses:
            analysis_data = analysis.get('analysis', {})
            if analysis_data.get('success'):
                overall_score = analysis_data.get('overall_score', 0)
                scores.append(overall_score)
                
                # Extract detailed scores
                impact_analysis = analysis_data.get('impact_analysis', {})
                if impact_analysis.get('success'):
                    impact_scores.append(impact_analysis.get('overall_impact_score', 0))
                
                feasibility_analysis = analysis_data.get('feasibility_analysis', {})
                if feasibility_analysis.get('success'):
                    feasibility_scores.append(feasibility_analysis.get('overall_score', 0))
                
                alignment_analysis = analysis_data.get('alignment_analysis', {})
                if alignment_analysis.get('success'):
                    alignment_scores.append(alignment_analysis.get('tool_analysis', {}).get('overall_score', 0))
        
        # Calculate summary statistics
        summary = {
            'total_projects_compared': len(project_analyses),
            'average_overall_score': round(sum(scores) / len(scores), 2) if scores else 0,
            'average_impact_score': round(sum(impact_scores) / len(impact_scores), 2) if impact_scores else 0,
            'average_feasibility_score': round(sum(feasibility_scores) / len(feasibility_scores), 2) if feasibility_scores else 0,
            'average_alignment_score': round(sum(alignment_scores) / len(alignment_scores), 2) if alignment_scores else 0,
            'best_performing_project': _find_best_project(project_analyses, scores),
            'recommendations': _generate_comparison_recommendations(project_analyses, scores)
        }
        
        return summary
        
    except Exception as e:
        logger.error(f"Error generating comparison summary: {str(e)}")
        return {}

def _find_best_project(project_analyses: list, scores: list) -> Dict[str, Any]:
    """Find the best performing project"""
    try:
        if not project_analyses or not scores:
            return {}
        
        best_index = scores.index(max(scores))
        best_analysis = project_analyses[best_index]
        
        return {
            'project_id': best_analysis.get('project_id'),
            'project_name': best_analysis.get('project_name'),
            'overall_score': scores[best_index],
            'analysis_summary': best_analysis.get('analysis', {}).get('comprehensive_recommendations', [])
        }
        
    except Exception as e:
        logger.error(f"Error finding best project: {str(e)}")
        return {}

def _generate_comparison_recommendations(project_analyses: list, scores: list) -> list:
    """Generate recommendations based on comparison"""
    try:
        recommendations = []
        
        if not project_analyses or not scores:
            return recommendations
        
        # Find best and worst projects
        best_score = max(scores)
        worst_score = min(scores)
        
        if best_score > 0.8:
            recommendations.append("Excellent project options available - proceed with top performers")
        elif best_score > 0.6:
            recommendations.append("Good project options available - consider top performers with minor adjustments")
        else:
            recommendations.append("Project options need improvement - consider alternative projects or strategic modifications")
        
        # Score spread analysis
        score_spread = best_score - worst_score
        if score_spread > 0.3:
            recommendations.append("Significant variation in project quality - focus on top performers")
        elif score_spread < 0.1:
            recommendations.append("Similar project quality - consider other factors like budget and timeline")
        
        # Portfolio recommendations
        if len(project_analyses) > 2:
            recommendations.append("Consider portfolio approach with multiple projects for risk diversification")
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating comparison recommendations: {str(e)}")
        return []
