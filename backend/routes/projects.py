from flask import Blueprint, jsonify, request, current_app
from models import db, User, Project, ProjectMilestone, ProjectApplication, ProjectImpactReport, NGOProfile, AIMatch, Company, NGORiskAssessment, ApprovalRequest, ApprovalStep, ImpactMetricSnapshot, ImpactTimeSeries, ImpactRegionStat, ImpactGoal, ProjectTrackingInfo, ProjectTimelineEntry, ReportJob, ReportArtifact, DecisionRationale, RationaleNote, AuditEvent, NGOImpactEvent, NGODocument, NGOTransparencyReport, NGOCertificate, NGOTestimonial
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from utils import current_user
from auth_middleware import require_role
import json
from datetime import datetime

projects_bp = Blueprint('projects', __name__)
def ensure_column_exists(table_name: str, column_name: str, column_sql_type: str):
    try:
        inspector = db.inspect(db.engine)
        cols = {c['name'] for c in inspector.get_columns(table_name)}
        if column_name in cols:
            return
        with db.engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql_type}"))
        current_app.logger.info(f"Added column {table_name}.{column_name}")
    except Exception as e:
        current_app.logger.warning(f"ensure_column_exists failed for {table_name}.{column_name}: {e}")



def get_current_user():
    """Backwards-compatible shim. Real auth happens in auth_middleware.enforce_auth
    which populates flask.g.user; this just returns it (or None for OPTIONS / public)."""
    return current_user()


@projects_bp.get('/projects')
def list_projects():
    """Get all projects with optional filtering (public)"""
    
    # Get query parameters for filtering
    status = request.args.get('status')
    sdg_goal = request.args.get('sdg_goal')
    focus_area = request.args.get('focus_area')
    location = request.args.get('location')
    min_budget = request.args.get('min_budget')
    max_budget = request.args.get('max_budget')
    
    # Start with base query
    query = Project.query
    
    # Apply filters
    if status:
        query = query.filter(Project.status == status)
    if sdg_goal:
        query = query.filter(Project.sdg_goals.contains(str(sdg_goal)))
    if focus_area:
        query = query.filter(Project.csr_focus_areas.contains(focus_area))
    if location:
        query = query.filter(
            (Project.location_city.contains(location)) |
            (Project.location_region.contains(location)) |
            (Project.location_country.contains(location))
        )
    if min_budget:
        query = query.filter(Project.funding_required >= float(min_budget))
    if max_budget:
        query = query.filter(Project.funding_required <= float(max_budget))
    
    # Get projects
    projects = query.order_by(Project.created_at.desc()).all()
    
    return jsonify({
        'projects': [project.to_dict() for project in projects],
        'total': len(projects)
    })


@projects_bp.get('/ai-matches')
def list_ai_matches():
    """Get AI matches combining company and project data (public)"""
    company_id = request.args.get('company_id', type=int)
    min_score = request.args.get('min_score', default=0, type=int)

    query = AIMatch.query
    if company_id:
        query = query.filter(AIMatch.company_id == company_id)
    if min_score:
        query = query.filter(AIMatch.alignment_score >= min_score)

    matches = query.order_by(AIMatch.alignment_score.desc()).limit(100).all()
    return jsonify([m.to_dict() for m in matches])


@projects_bp.post('/ai-matches')
def create_ai_match():
    """Create a new AI match (public for dev)"""
    data = request.get_json() or {}
    
    # Validate required fields
    if not data.get('project_id') or not data.get('company_id'):
        return jsonify({'error': 'project_id and company_id are required'}), 400
    
    # Create the AI match
    match = AIMatch(
        project_id=data.get('project_id'),
        company_id=data.get('company_id'),
        alignment_score=data.get('alignment_score', 0),
        investment_min=data.get('investment_min'),
        investment_max=data.get('investment_max'),
        investment_currency=data.get('investment_currency', 'USD'),
        timeline_months=data.get('timeline_months'),
        location_text=data.get('location_text'),
        tags=data.get('tags'),
        rationale=data.get('rationale')
    )
    
    db.session.add(match)
    db.session.commit()
    
    return jsonify({
        'message': 'AI match created successfully',
        'match': match.to_dict()
    }), 201


@projects_bp.get('/ngo-risk')
def list_ngo_risk():
    """Summaries for NGO risk scoring page (public)"""
    # Optional filters
    q = request.args.get('q', type=str)
    risk = request.args.get('risk', type=str)

    query = NGORiskAssessment.query.join(NGOProfile, NGORiskAssessment.ngo_id == NGOProfile.id)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(db.func.lower(NGOProfile.name).like(like))
    if risk and risk in ('Low', 'Medium', 'High'):
        query = query.filter(NGORiskAssessment.risk_level == risk)

    items = query.order_by(NGORiskAssessment.updated_at.desc()).limit(200).all()
    ngos = [i.to_summary() for i in items]

    # Headline counts
    total = len(ngos)
    low = sum(1 for n in ngos if n['risk'] == 'Low')
    medium = sum(1 for n in ngos if n['risk'] == 'Medium')
    high = sum(1 for n in ngos if n['risk'] == 'High')

    return jsonify({
        'ngos': ngos,
        'metrics': { 'total': total, 'low': low, 'medium': medium, 'high': high }
    })


@projects_bp.get('/ngo-risk/<int:ngo_id>')
def get_ngo_risk_detail(ngo_id: int):
    item = NGORiskAssessment.query.filter_by(ngo_id=ngo_id).order_by(NGORiskAssessment.updated_at.desc()).first()
    if not item:
        return jsonify({'error': 'Risk assessment not found'}), 404
    return jsonify(item.to_detail())


# Approval workflow endpoints (public for dev)
@projects_bp.post('/approvals')
def create_approval():
    # Ensure new JSON columns exist for SQLite
    ensure_column_exists('approval_requests', 'ai_recommendation', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_notes', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_metrics', 'TEXT')
    data = request.get_json() or {}
    req = ApprovalRequest(
        project_id=data.get('project_id'),
        company_id=data.get('company_id'),
        title=data.get('title') or 'Approval Request',
        summary=data.get('summary'),
        status=data.get('status', 'pending'),
        created_by=None,
    )
    db.session.add(req)
    db.session.flush()

    for idx, step in enumerate(data.get('steps') or []):
        db.session.add(ApprovalStep(
            request_id=req.id,
            name=step.get('name') or f'Step {idx+1}',
            order_index=step.get('order', idx),
            assignee_user_id=step.get('assignee_user_id'),
            assignee_role=step.get('assignee_role'),
            status=step.get('status', 'pending'),
            decision_notes=step.get('decision_notes')
        ))

    db.session.commit()
    return jsonify({'message': 'created', 'approval': req.to_dict()}), 201


@projects_bp.get('/approvals')
def list_approvals():
    # Ensure new JSON columns exist for SQLite
    ensure_column_exists('approval_requests', 'ai_recommendation', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_notes', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_metrics', 'TEXT')
    q = ApprovalRequest.query.order_by(ApprovalRequest.created_at.desc()).limit(200).all()
    return jsonify([r.to_dict() for r in q])


@projects_bp.get('/approvals/<int:approval_id>')
def get_approval(approval_id: int):
    ensure_column_exists('approval_requests', 'ai_recommendation', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_notes', 'TEXT')
    ensure_column_exists('approval_requests', 'compliance_metrics', 'TEXT')
    r = ApprovalRequest.query.get(approval_id)
    if not r:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(r.to_dict())


@projects_bp.put('/approvals/<int:approval_id>')
def update_approval(approval_id: int):
    r = ApprovalRequest.query.get(approval_id)
    if not r:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    if 'title' in data:
        r.title = data['title']
    if 'summary' in data:
        r.summary = data['summary']
    if 'status' in data:
        r.status = data['status']
    if 'aiRecommendation' in data:
        r.ai_recommendation = data['aiRecommendation']
    if 'complianceNotes' in data:
        r.compliance_notes = data['complianceNotes']
    if 'complianceMetrics' in data:
        r.compliance_metrics = data['complianceMetrics']
    db.session.commit()
    return jsonify(r.to_dict())


@projects_bp.put('/approvals/<int:approval_id>/steps/<int:step_id>')
def update_approval_step(approval_id: int, step_id: int):
    """Update approval step status"""
    try:
        step = ApprovalStep.query.filter_by(id=step_id, request_id=approval_id).first()
        if not step:
            return jsonify({'error': 'Step not found'}), 404
            
        data = request.get_json() or {}
        
        # Update step status
        if 'status' in data:
            step.status = data['status']
            if data['status'] in ('approved', 'rejected'):
                step.decided_at = datetime.utcnow()
                
        # Update decision notes
        if 'decision_notes' in data:
            step.decision_notes = data['decision_notes']
            
        # Recompute overall approval status
        req = ApprovalRequest.query.get(approval_id)
        if req:
            req.recompute_status()
            
        db.session.commit()
        
        # Return updated data
        return jsonify({
            'step': step.to_dict(), 
            'approval': req.to_dict() if req else None,
            'message': f'Step {step.name} updated to {step.status}'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating approval step: {str(e)}")
        return jsonify({'error': f'Failed to update step: {str(e)}'}), 500


# Impact dashboard endpoints (public)
@projects_bp.get('/impact/overview')
def impact_overview():
    # latest snapshot (optionally scope by company_id)
    company_id = request.args.get('company_id', type=int)
    q = ImpactMetricSnapshot.query
    if company_id:
        q = q.filter(ImpactMetricSnapshot.company_id == company_id)
    snap = q.order_by(ImpactMetricSnapshot.as_of_date.desc()).first()
    cards = snap.to_cards() if snap else []
    return jsonify({ 'cards': cards })


@projects_bp.get('/impact/trends')
def impact_trends():
    metric = request.args.get('metric', default='co2_reduced_tons', type=str)
    company_id = request.args.get('company_id', type=int)
    q = ImpactTimeSeries.query.filter(ImpactTimeSeries.metric_name == metric).order_by(ImpactTimeSeries.ts_date.asc())
    if company_id:
        q = q.filter(ImpactTimeSeries.company_id == company_id)
    points = [r.to_point() for r in q.limit(365).all()]
    return jsonify({ 'metric': metric, 'series': points })


@projects_bp.get('/impact/regions')
def impact_regions():
    metric = request.args.get('metric', default='co2_reduced_tons', type=str)
    period = request.args.get('period', type=str)
    company_id = request.args.get('company_id', type=int)
    q = ImpactRegionStat.query.filter(ImpactRegionStat.metric_name == metric)
    if period:
        q = q.filter(ImpactRegionStat.period_month == period)
    if company_id:
        q = q.filter(ImpactRegionStat.company_id == company_id)
    rows = [r.to_row() for r in q.limit(1000).all()]
    return jsonify({ 'metric': metric, 'rows': rows })


@projects_bp.get('/impact/goals')
def impact_goals():
    company_id = request.args.get('company_id', type=int)
    q = ImpactGoal.query
    if company_id:
        q = q.filter(ImpactGoal.company_id == company_id)
    goals = [g.to_dict() for g in q.order_by(ImpactGoal.period_month.asc()).limit(100).all()]
    return jsonify({ 'goals': goals })


# Project tracker endpoints (public)
@projects_bp.get('/tracker/projects')
def tracker_projects():
    status = request.args.get('status')  # all | on-track | delayed | completed
    q = db.session.query(ProjectTrackingInfo).join(Project, ProjectTrackingInfo.project_id == Project.id)
    if status and status != 'all':
        q = q.filter(ProjectTrackingInfo.status == status)
    items = q.order_by(ProjectTrackingInfo.updated_at.desc()).limit(200).all()
    return jsonify([i.to_card() for i in items])


@projects_bp.get('/tracker/timeline')
def tracker_timeline():
    items = ProjectTimelineEntry.query.order_by(ProjectTimelineEntry.created_at.asc()).limit(50).all()
    return jsonify([i.to_item() for i in items])


@projects_bp.get('/tracker/projects/<int:project_id>')
def tracker_project_detail(project_id: int):
    rec = ProjectTrackingInfo.query.filter_by(project_id=project_id).first()
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(rec.to_detail())


# Rationale endpoints (public for dev)
@projects_bp.get('/rationales')
def list_rationales():
    """Get all decision rationales with optional filtering"""
    project_id = request.args.get('project_id', type=int)
    company_id = request.args.get('company_id', type=int)
    
    query = DecisionRationale.query
    
    if project_id:
        query = query.filter(DecisionRationale.project_id == project_id)
    if company_id:
        query = query.filter(DecisionRationale.company_id == company_id)
    
    rationales = query.order_by(DecisionRationale.created_at.desc()).limit(100).all()
    return jsonify([rationale.to_dict() for rationale in rationales])


@projects_bp.get('/rationales/<int:rationale_id>')
def get_rationale(rationale_id: int):
    """Get a specific decision rationale"""
    rationale = DecisionRationale.query.get_or_404(rationale_id)
    return jsonify(rationale.to_dict())


@projects_bp.post('/rationales')
def create_rationale():
    """Create a new decision rationale"""
    data = request.get_json() or {}
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({'error': 'title is required'}), 400
    
    rationale = DecisionRationale(
        project_id=data.get('project_id'),
        company_id=data.get('company_id'),
        title=data.get('title'),
        context=data.get('context'),
        criteria=data.get('criteria'),
        options=data.get('options'),
        selected_option=data.get('selected_option'),
        pros=data.get('pros'),
        cons=data.get('cons'),
        reasoning_steps=data.get('reasoning_steps'),
        score_breakdown=data.get('score_breakdown'),
        attachments=data.get('attachments'),
        created_by=data.get('created_by')
    )
    
    db.session.add(rationale)
    db.session.commit()
    
    return jsonify({
        'message': 'Rationale created successfully',
        'rationale': rationale.to_dict()
    }), 201


@projects_bp.put('/rationales/<int:rationale_id>')
def update_rationale(rationale_id: int):
    """Update a decision rationale"""
    rationale = DecisionRationale.query.get_or_404(rationale_id)
    data = request.get_json() or {}
    
    # Update fields
    if 'title' in data:
        rationale.title = data['title']
    if 'context' in data:
        rationale.context = data['context']
    if 'criteria' in data:
        rationale.criteria = data['criteria']
    if 'options' in data:
        rationale.options = data['options']
    if 'selected_option' in data:
        rationale.selected_option = data['selected_option']
    if 'pros' in data:
        rationale.pros = data['pros']
    if 'cons' in data:
        rationale.cons = data['cons']
    if 'reasoning_steps' in data:
        rationale.reasoning_steps = data['reasoning_steps']
    if 'score_breakdown' in data:
        rationale.score_breakdown = data['score_breakdown']
    if 'attachments' in data:
        rationale.attachments = data['attachments']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Rationale updated successfully',
        'rationale': rationale.to_dict()
    })


@projects_bp.post('/rationales/<int:rationale_id>/notes')
def add_rationale_note(rationale_id: int):
    """Add a note to a decision rationale"""
    rationale = DecisionRationale.query.get_or_404(rationale_id)
    data = request.get_json() or {}
    
    if not data.get('content'):
        return jsonify({'error': 'content is required'}), 400
    
    note = RationaleNote(
        rationale_id=rationale_id,
        author=data.get('author'),
        content=data.get('content')
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify({
        'message': 'Note added successfully',
        'note': note.to_dict()
    }), 201





# NGO marketplace endpoints (public)
@projects_bp.get('/ngos')
def list_ngos():
    try:
        ensure_column_exists('ngo_profiles', 'about', 'TEXT')
        # sanity check
        _ = db.inspect(db.engine).get_columns('ngo_profiles')
        rows = NGOProfile.query.order_by(NGOProfile.id.desc()).limit(200).all()
        return jsonify([r.to_summary() for r in rows])
    except OperationalError as oe:
        # Fallback path if column still missing: query minimal fields via raw SQL
        msg = str(oe)
        if 'no such column: ngo_profiles.about' in msg:
            try:
                ensure_column_exists('ngo_profiles', 'about', 'TEXT')
                # raw select limited fields
                sql = text("""
                    SELECT id, name, city, state, country, rating, verification_badge, primary_sectors, logo_url, profile_image_url, total_projects_completed, total_beneficiaries_reached
                    FROM ngo_profiles
                    ORDER BY id DESC LIMIT 200
                """)
                result = db.session.execute(sql).mappings().all()
                def parse_list(v):
                    try:
                        import json as _json
                        return _json.loads(v) if v else []
                    except Exception:
                        return []
                payload = []
                for r in result:
                    payload.append({
                        'id': r['id'],
                        'name': r['name'],
                        'location': { 'city': r['city'], 'state': r['state'], 'country': r['country'] },
                        'rating': r['rating'],
                        'verificationBadge': r['verification_badge'],
                        'sectors': parse_list(r['primary_sectors']),
                        'logoUrl': r['logo_url'],
                        'profileImageUrl': r['profile_image_url'],
                        'projectsCompleted': r['total_projects_completed'],
                        'beneficiariesReached': r['total_beneficiaries_reached'],
                    })
                return jsonify(payload)
            except Exception as e2:
                current_app.logger.error(f"/api/ngos raw fallback failed: {e2}")
                return jsonify({'error': 'failed', 'detail': str(e2)}), 500
        current_app.logger.error(f"/api/ngos operational error: {oe}")
        return jsonify({'error': 'failed', 'detail': msg}), 500
    except Exception as e:
        current_app.logger.error(f"/api/ngos failed: {e}")
        return jsonify({'error': 'failed', 'detail': str(e)}), 500


@projects_bp.get('/ngos/<int:ngo_id>')
def get_ngo(ngo_id: int):
    try:
        ensure_column_exists('ngo_profiles', 'about', 'TEXT')
        _ = db.inspect(db.engine).get_columns('ngo_profiles')
        ngo = NGOProfile.query.filter_by(id=ngo_id).first()
        if not ngo:
            return jsonify({'error': 'NGO not found'}), 404
        return jsonify(ngo.to_detail())
    except Exception as e:
        current_app.logger.error(f"/api/ngos/{ngo_id} failed: {e}")
        if current_app.debug:
            return jsonify({'error': 'failed', 'detail': str(e)}), 500
        return jsonify({'error': 'failed'}), 500

@projects_bp.get('/ngos/<int:ngo_id>/impact-timeline')
def ngo_impact_timeline(ngo_id: int):
    rows = NGOImpactEvent.query.filter_by(ngo_id=ngo_id).order_by(NGOImpactEvent.date.asc()).all()
    return jsonify([r.to_timeline_item() for r in rows])


@projects_bp.get('/ngos/<int:ngo_id>/documents')
def ngo_documents(ngo_id: int):
    rows = NGODocument.query.filter_by(ngo_id=ngo_id).order_by(NGODocument.uploaded_at.desc()).all()
    return jsonify([r.to_row() for r in rows])


@projects_bp.get('/ngos/<int:ngo_id>/transparency')
def ngo_transparency(ngo_id: int):
    rows = NGOTransparencyReport.query.filter_by(ngo_id=ngo_id).order_by(NGOTransparencyReport.created_at.desc()).limit(12).all()
    return jsonify([r.to_dict() for r in rows])


@projects_bp.get('/ngos/<int:ngo_id>/certificates')
def ngo_certificates(ngo_id: int):
    rows = NGOCertificate.query.filter_by(ngo_id=ngo_id).order_by(NGOCertificate.valid_until.desc().nullslast()).all()
    return jsonify([r.to_card() for r in rows])


@projects_bp.get('/ngos/<int:ngo_id>/testimonials')
def ngo_testimonials(ngo_id: int):
    rows = NGOTestimonial.query.filter_by(ngo_id=ngo_id).order_by(NGOTestimonial.created_at.desc()).limit(50).all()
    return jsonify([r.to_card() for r in rows])


# Reporting generator endpoints (public)
@projects_bp.post('/reports')
def create_report_job():
    data = request.get_json() or {}
    job = ReportJob(
        company_id=data.get('company_id'),
        period=data.get('period') or 'Q4 2024',
        report_type=data.get('report_type') or 'CSR Compliance',
        metrics=data.get('metrics') or {},
        status='queued',
        last_updated_human='just now'
    )
    db.session.add(job)
    db.session.commit()
    return jsonify(job.to_dict()), 201


@projects_bp.get('/reports')
def list_report_jobs():
    company_id = request.args.get('company_id', type=int)
    q = ReportJob.query.order_by(ReportJob.created_at.desc())
    if company_id:
        q = q.filter(ReportJob.company_id == company_id)
    jobs = [j.to_dict() for j in q.limit(50).all()]
    return jsonify(jobs)


@projects_bp.get('/reports/<int:job_id>')
def get_report_job(job_id: int):
    j = ReportJob.query.get(job_id)
    if not j:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(j.to_dict())





@projects_bp.get('/projects/<int:project_id>')
def get_project(project_id):
    """Get specific project details (public)"""
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    return jsonify(project.to_dict())


@projects_bp.post('/projects')
def create_project():
    """Create a new project (no auth required)"""
    user = get_current_user()
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Parse dates
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date() if data.get('start_date') else None
        end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date() if data.get('end_date') else None
        
        # Fallback to a guest user if unauthenticated
        if not user:
            guest = User.query.filter_by(email='guest@sustainalign.local').first()
            if not guest:
                from utils import hash_password
                guest = User(email='guest@sustainalign.local', password_hash=hash_password('guest'), role='guest')
                db.session.add(guest)
                db.session.flush()
            user = guest

        # Create project
        project = Project(
            title=data.get('title'),
            short_description=data.get('short_description'),
            ngo_name=data.get('ngo_name'),
            location_city=data.get('location_city'),
            location_region=data.get('location_region'),
            location_country=data.get('location_country'),
            total_project_cost=data.get('total_project_cost'),
            funding_required=data.get('funding_required'),
            currency=data.get('currency', 'INR'),
            csr_eligibility=data.get('csr_eligibility', True),
            preferred_contribution_type=data.get('preferred_contribution_type'),
            start_date=start_date,
            end_date=end_date,
            ngo_registration_number=data.get('ngo_registration_number'),
            ngo_80g_status=data.get('ngo_80g_status'),
            ngo_fcra_status=data.get('ngo_fcra_status'),
            ngo_rating=data.get('ngo_rating'),
            ngo_verification_badge=data.get('ngo_verification_badge'),
            past_projects_completed=data.get('past_projects_completed', 0),
            status=data.get('status', 'draft'),
            visibility=data.get('visibility', 'public'),
            created_by=user.id
        )
        
        # Set JSON fields using helper methods
        if data.get('sdg_goals'):
            project.set_sdg_goals(data['sdg_goals'])
        if data.get('csr_focus_areas'):
            project.set_csr_focus_areas(data['csr_focus_areas'])
        if data.get('target_beneficiaries'):
            project.set_target_beneficiaries(data['target_beneficiaries'])
        if data.get('expected_outcomes'):
            project.set_expected_outcomes(data['expected_outcomes'])
        if data.get('kpis'):
            project.set_kpis(data['kpis'])
        if data.get('past_impact'):
            project.set_past_impact(data['past_impact'])
        if data.get('project_images'):
            project.set_project_images(data['project_images'])
        
        # Set other fields
        if data.get('proposal_document_url'):
            project.proposal_document_url = data['proposal_document_url']
        if data.get('video_link'):
            project.video_link = data['video_link']
        
        # Calculate duration
        project.calculate_duration()
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create project: {str(e)}'}), 500


@projects_bp.put('/projects/<int:project_id>')
@require_role('ngo', 'corporate', 'admin')
def update_project(project_id):
    """Update an existing project. Ownership enforced below; only the creator or admin succeeds."""
    user = get_current_user()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Check if user owns the project or has admin rights
    if project.created_by != user.id and user.role != 'admin':
        return jsonify({'error': 'Not authorized to update this project'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update basic fields
        if 'title' in data:
            project.title = data['title']
        if 'short_description' in data:
            project.short_description = data['short_description']
        if 'ngo_name' in data:
            project.ngo_name = data['ngo_name']
        if 'location_city' in data:
            project.location_city = data['location_city']
        if 'location_region' in data:
            project.location_region = data['location_region']
        if 'location_country' in data:
            project.location_country = data['location_country']
        if 'total_project_cost' in data:
            project.total_project_cost = data['total_project_cost']
        if 'funding_required' in data:
            project.funding_required = data['funding_required']
        if 'currency' in data:
            project.currency = data['currency']
        if 'csr_eligibility' in data:
            project.csr_eligibility = data['csr_eligibility']
        if 'preferred_contribution_type' in data:
            project.preferred_contribution_type = data['preferred_contribution_type']
        if 'status' in data:
            project.status = data['status']
        if 'visibility' in data:
            project.visibility = data['visibility']
        
        # Update dates
        if data.get('start_date'):
            project.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            project.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        # Update JSON fields
        if 'sdg_goals' in data:
            project.set_sdg_goals(data['sdg_goals'])
        if 'csr_focus_areas' in data:
            project.set_csr_focus_areas(data['csr_focus_areas'])
        if 'target_beneficiaries' in data:
            project.set_target_beneficiaries(data['target_beneficiaries'])
        if 'expected_outcomes' in data:
            project.set_expected_outcomes(data['expected_outcomes'])
        if 'kpis' in data:
            project.set_kpis(data['kpis'])
        if 'past_impact' in data:
            project.set_past_impact(data['past_impact'])
        if 'project_images' in data:
            project.set_project_images(data['project_images'])
        
        # Update other fields
        if 'proposal_document_url' in data:
            project.proposal_document_url = data['proposal_document_url']
        if 'video_link' in data:
            project.video_link = data['video_link']
        
        # Recalculate duration if dates changed
        if 'start_date' in data or 'end_date' in data:
            project.calculate_duration()
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update project: {str(e)}'}), 500


@projects_bp.delete('/projects/<int:project_id>')
@require_role('ngo', 'corporate', 'admin')
def delete_project(project_id):
    """Delete a project. Ownership enforced below; only the creator or admin succeeds."""
    user = get_current_user()
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Check if user owns the project or has admin rights
    if project.created_by != user.id and user.role != 'admin':
        return jsonify({'error': 'Not authorized to delete this project'}), 403
    
    try:
        db.session.delete(project)
        db.session.commit()
        return jsonify({'message': 'Project deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete project: {str(e)}'}), 500


@projects_bp.get('/projects/<int:project_id>/milestones')
def get_project_milestones(project_id):
    """Get milestones for a specific project"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    milestones = ProjectMilestone.query.filter_by(project_id=project_id).order_by(ProjectMilestone.target_date).all()
    
    return jsonify({
        'milestones': [milestone.to_dict() for milestone in milestones]
    })


@projects_bp.post('/projects/<int:project_id>/milestones')
def create_project_milestone(project_id):
    """Create a milestone for a project"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Check if user owns the project or has admin rights
    if project.created_by != user.id and user.role != 'admin':
        return jsonify({'error': 'Not authorized to create milestones for this project'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        target_date = datetime.strptime(data.get('target_date'), '%Y-%m-%d').date() if data.get('target_date') else None
        
        milestone = ProjectMilestone(
            project_id=project_id,
            title=data.get('title'),
            description=data.get('description'),
            target_date=target_date,
            status=data.get('status', 'pending'),
            progress_percentage=data.get('progress_percentage', 0)
        )
        
        db.session.add(milestone)
        db.session.commit()
        
        return jsonify({
            'message': 'Milestone created successfully',
            'milestone': milestone.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create milestone: {str(e)}'}), 500


@projects_bp.get('/projects/<int:project_id>/applications')
def get_project_applications(project_id):
    """Get applications for a specific project"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    applications = ProjectApplication.query.filter_by(project_id=project_id).all()
    
    return jsonify({
        'applications': [application.to_dict() for application in applications]
    })


@projects_bp.post('/projects/<int:project_id>/apply')
def apply_to_project(project_id):
    """Apply to a project (for companies)"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Check if project is open for applications
    if project.status != 'published':
        return jsonify({'error': 'Project is not open for applications'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Get user's company
        company = user.companies[0] if user.companies else None
        if not company:
            return jsonify({'error': 'No company profile found. Please create a company profile first.'}), 400
        
        # Check if already applied
        existing_application = ProjectApplication.query.filter_by(
            project_id=project_id, 
            company_id=company.id
        ).first()
        
        if existing_application:
            return jsonify({'error': 'Already applied to this project'}), 400
        
        application = ProjectApplication(
            project_id=project_id,
            company_id=company.id,
            application_type=data.get('application_type'),
            amount_offered=data.get('amount_offered'),
            contribution_details=data.get('contribution_details'),
            status='pending'
        )
        
        db.session.add(application)
        db.session.commit()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to submit application: {str(e)}'}), 500


# Audit endpoints (public for dev)
@projects_bp.get('/audit/events')
def list_audit_events():
    """Get all audit events with optional filtering"""
    try:
        # Get query parameters
        entity_type = request.args.get('entity_type')
        entity_id = request.args.get('entity_id', type=int)
        action = request.args.get('action')
        actor_role = request.args.get('actor_role')
        source = request.args.get('source')
        limit = request.args.get('limit', 100, type=int)
        
        # Build query
        query = AuditEvent.query
        
        if entity_type:
            query = query.filter(AuditEvent.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditEvent.entity_id == entity_id)
        if action:
            query = query.filter(AuditEvent.action == action)
        if actor_role:
            query = query.filter(AuditEvent.actor_role == actor_role)
        if source:
            query = query.filter(AuditEvent.source == source)
        
        # Order by most recent first
        events = query.order_by(AuditEvent.created_at.desc()).limit(limit).all()
        
        return jsonify([event.to_dict() for event in events])
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch audit events: {str(e)}'}), 500


@projects_bp.get('/audit/events/<int:event_id>')
def get_audit_event(event_id: int):
    """Get a specific audit event"""
    try:
        event = AuditEvent.query.get_or_404(event_id)
        return jsonify(event.to_dict())
    except Exception as e:
        return jsonify({'error': f'Failed to fetch audit event: {str(e)}'}), 500


@projects_bp.post('/audit/events')
@require_role('admin')
def create_audit_event():
    """Create a new audit event"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        if not data.get('entity_type'):
            return jsonify({'error': 'entity_type is required'}), 400
        if not data.get('action'):
            return jsonify({'error': 'action is required'}), 400
        
        # Create audit event
        event = AuditEvent(
            entity_type=data['entity_type'],
            entity_id=data.get('entity_id'),
            action=data['action'],
            actor_user_id=data.get('actor_user_id'),
            actor_role=data.get('actor_role'),
            source=data.get('source', 'api'),
            message=data.get('message'),
            meta=data.get('metadata', {})
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'message': 'Audit event created successfully',
            'event': event.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create audit event: {str(e)}'}), 500


@projects_bp.get('/audit/summary')
def get_audit_summary():
    """Get audit summary statistics"""
    try:
        # Get basic counts
        total_events = AuditEvent.query.count()
        
        # Count by entity type
        entity_counts = db.session.query(
            AuditEvent.entity_type,
            db.func.count(AuditEvent.id)
        ).group_by(AuditEvent.entity_type).all()
        
        # Count by action
        action_counts = db.session.query(
            AuditEvent.action,
            db.func.count(AuditEvent.id)
        ).group_by(AuditEvent.action).all()
        
        # Count by source
        source_counts = db.session.query(
            AuditEvent.source,
            db.func.count(AuditEvent.id)
        ).group_by(AuditEvent.source).all()
        
        # Recent activity (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_events = AuditEvent.query.filter(
            AuditEvent.created_at >= yesterday
        ).count()
        
        return jsonify({
            'total_events': total_events,
            'recent_events': recent_events,
            'entity_counts': dict(entity_counts),
            'action_counts': dict(action_counts),
            'source_counts': dict(source_counts)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch audit summary: {str(e)}'}), 500


# Tracker endpoints (public for dev)
@projects_bp.get('/tracker/projects')
def list_tracker_projects():
    """Get all project tracking info with optional filtering"""
    try:
        # Ensure tracker table columns exist
        ensure_column_exists('project_tracking_info', 'details', 'JSON')
        ensure_column_exists('project_tracking_info', 'team_user_ids', 'JSON')
        ensure_column_exists('project_tracking_info', 'gradient_from', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'gradient_to', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'progress_from', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'progress_to', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'metric_color', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'tooltip', 'VARCHAR(255)')
        ensure_column_exists('project_tracking_info', 'cta_label', 'VARCHAR(64)')
        ensure_column_exists('project_tracking_info', 'cta_color', 'VARCHAR(16)')
        
        status = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        
        query = ProjectTrackingInfo.query.join(Project)
        
        if status and status != 'all':
            query = query.filter(ProjectTrackingInfo.status == status)
        
        tracking_info = query.order_by(ProjectTrackingInfo.updated_at.desc()).limit(limit).all()
        return jsonify([info.to_card() for info in tracking_info])
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch tracker projects: {str(e)}'}), 500


@projects_bp.get('/tracker/projects/<int:project_id>')
def get_tracker_project(project_id: int):
    """Get detailed tracking info for a specific project"""
    try:
        # Ensure tracker table columns exist
        ensure_column_exists('project_tracking_info', 'details', 'JSON')
        ensure_column_exists('project_tracking_info', 'team_user_ids', 'JSON')
        ensure_column_exists('project_tracking_info', 'gradient_from', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'gradient_to', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'progress_from', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'progress_to', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'metric_color', 'VARCHAR(16)')
        ensure_column_exists('project_tracking_info', 'tooltip', 'VARCHAR(255)')
        ensure_column_exists('project_tracking_info', 'cta_label', 'VARCHAR(64)')
        ensure_column_exists('project_tracking_info', 'cta_color', 'VARCHAR(16)')
        
        tracking_info = ProjectTrackingInfo.query.filter_by(project_id=project_id).first()
        if not tracking_info:
            return jsonify({'error': 'Project tracking info not found'}), 404
        
        return jsonify(tracking_info.to_detail())
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch tracker project: {str(e)}'}), 500


@projects_bp.post('/tracker/projects')
def create_tracker_project():
    """Create new project tracking info"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        if not data.get('project_id'):
            return jsonify({'error': 'project_id is required'}), 400
        
        # Check if tracking info already exists
        existing = ProjectTrackingInfo.query.filter_by(project_id=data['project_id']).first()
        if existing:
            return jsonify({'error': 'Tracking info already exists for this project'}), 409
        
        tracking_info = ProjectTrackingInfo(
            project_id=data['project_id'],
            status=data.get('status', 'on-track'),
            progress_pct=data.get('progress_pct', 0),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
            subtitle=data.get('subtitle'),
            metric_label=data.get('metric_label'),
            icon=data.get('icon'),
            gradient_from=data.get('gradient_from'),
            gradient_to=data.get('gradient_to'),
            progress_from=data.get('progress_from'),
            progress_to=data.get('progress_to'),
            metric_color=data.get('metric_color'),
            tooltip=data.get('tooltip'),
            team_user_ids=data.get('team_user_ids'),
            cta_label=data.get('cta_label'),
            cta_color=data.get('cta_color'),
            details=data.get('details')
        )
        
        db.session.add(tracking_info)
        db.session.commit()
        
        return jsonify({
            'message': 'Project tracking info created successfully',
            'tracking_info': tracking_info.to_card()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create tracker project: {str(e)}'}), 500


@projects_bp.put('/tracker/projects/<int:project_id>')
def update_tracker_project(project_id: int):
    """Update project tracking info"""
    try:
        data = request.get_json() or {}
        
        tracking_info = ProjectTrackingInfo.query.filter_by(project_id=project_id).first()
        if not tracking_info:
            return jsonify({'error': 'Project tracking info not found'}), 404
        
        # Update fields
        if 'status' in data:
            tracking_info.status = data['status']
        if 'progress_pct' in data:
            tracking_info.progress_pct = data['progress_pct']
        if 'due_date' in data:
            tracking_info.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
        if 'subtitle' in data:
            tracking_info.subtitle = data['subtitle']
        if 'metric_label' in data:
            tracking_info.metric_label = data['metric_label']
        if 'icon' in data:
            tracking_info.icon = data['icon']
        if 'gradient_from' in data:
            tracking_info.gradient_from = data['gradient_from']
        if 'gradient_to' in data:
            tracking_info.gradient_to = data['gradient_to']
        if 'progress_from' in data:
            tracking_info.progress_from = data['progress_from']
        if 'progress_to' in data:
            tracking_info.progress_to = data['progress_to']
        if 'metric_color' in data:
            tracking_info.metric_color = data['metric_color']
        if 'tooltip' in data:
            tracking_info.tooltip = data['tooltip']
        if 'team_user_ids' in data:
            tracking_info.team_user_ids = data['team_user_ids']
        if 'cta_label' in data:
            tracking_info.cta_label = data['cta_label']
        if 'cta_color' in data:
            tracking_info.cta_color = data['cta_color']
        if 'details' in data:
            tracking_info.details = data['details']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Project tracking info updated successfully',
            'tracking_info': tracking_info.to_card()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update tracker project: {str(e)}'}), 500


@projects_bp.get('/tracker/timeline')
def get_tracker_timeline():
    """Get timeline entries for tracker overview"""
    try:
        company_id = request.args.get('company_id', type=int)
        limit = request.args.get('limit', 20, type=int)
        
        query = ProjectTimelineEntry.query
        
        if company_id:
            query = query.filter(ProjectTimelineEntry.company_id == company_id)
        
        entries = query.order_by(ProjectTimelineEntry.created_at.desc()).limit(limit).all()
        return jsonify([entry.to_item() for entry in entries])
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch timeline: {str(e)}'}), 500


@projects_bp.post('/tracker/timeline')
def create_timeline_entry():
    """Create new timeline entry"""
    try:
        data = request.get_json() or {}
        
        if not data.get('text'):
            return jsonify({'error': 'text is required'}), 400
        
        entry = ProjectTimelineEntry(
            color=data.get('color'),
            text=data['text'],
            quarter=data.get('quarter'),
            company_id=data.get('company_id')
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Timeline entry created successfully',
            'entry': entry.to_item()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create timeline entry: {str(e)}'}), 500


@projects_bp.get('/corporate-risk-analysis')
def get_corporate_risk_analysis():
    """Get comprehensive risk analysis for corporate collaboration projects"""
    try:
        # Get all projects that have corporate collaborations (applications)
        collaborations = ProjectApplication.query.filter(
            ProjectApplication.status.in_(['approved', 'in_progress', 'completed'])
        ).all()
        
        # Group by company and analyze risks
        company_risks = {}
        total_projects = 0
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0
        
        for collab in collaborations:
            company_id = collab.company_id
            project = collab.project
            
            if company_id not in company_risks:
                company_risks[company_id] = {
                    'company_id': company_id,
                    'company_name': 'Corporate Partner',  # TODO: Get from Company model
                    'projects': [],
                    'total_investment': 0,
                    'risk_score': 0,
                    'risk_level': 'Low',
                    'unusual_activities': [],
                    'daily_metrics': {
                        'projects_active': 0,
                        'projects_completed': 0,
                        'projects_delayed': 0,
                        'compliance_issues': 0,
                        'budget_overruns': 0
                    }
                }
            
            # Calculate project risk
            project_risk = calculate_project_risk(project, collab)
            company_risks[company_id]['projects'].append({
                'id': project.id,
                'title': project.title,
                'ngo_name': project.ngo_name,
                'status': collab.status,
                'investment': float(collab.amount_offered or 0),
                'risk_score': project_risk['score'],
                'risk_level': project_risk['level'],
                'risk_factors': project_risk['factors'],
                'unusual_activities': project_risk['unusual_activities']
            })
            
            company_risks[company_id]['total_investment'] += float(collab.amount_offered or 0)
            total_projects += 1
            
            # Count risk levels
            if project_risk['level'] == 'High':
                high_risk_count += 1
            elif project_risk['level'] == 'Medium':
                medium_risk_count += 1
            else:
                low_risk_count += 1
        
        # Calculate overall company risk scores
        for company_id, company_data in company_risks.items():
            if company_data['projects']:
                avg_risk_score = sum(p['risk_score'] for p in company_data['projects']) / len(company_data['projects'])
                company_data['risk_score'] = round(avg_risk_score, 2)
                company_data['risk_level'] = get_risk_level(avg_risk_score)
                
                # Aggregate unusual activities
                all_unusual = []
                for project in company_data['projects']:
                    all_unusual.extend(project['unusual_activities'])
                company_data['unusual_activities'] = all_unusual[:10]  # Top 10 most recent
                
                # Calculate daily metrics
                company_data['daily_metrics'] = calculate_daily_metrics(company_data['projects'])
        
        # Get recent unusual activities across all companies
        recent_unusual_activities = get_recent_unusual_activities()
        
        return jsonify({
            'companies': list(company_risks.values()),
            'summary': {
                'total_projects': total_projects,
                'total_companies': len(company_risks),
                'high_risk': high_risk_count,
                'medium_risk': medium_risk_count,
                'low_risk': low_risk_count,
                'total_investment': sum(c['total_investment'] for c in company_risks.values())
            },
            'recent_unusual_activities': recent_unusual_activities,
            'daily_analysis': get_daily_analysis()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def calculate_project_risk(project, collaboration):
    """Calculate risk score for a specific project"""
    risk_score = 0
    risk_factors = []
    unusual_activities = []
    
    # Financial Risk (30% weight)
    financial_risk = 0
    funding_required = float(project.funding_required or 0)
    total_cost = float(project.total_project_cost or 0)
    
    if funding_required > 0 and total_cost > 0:
        funding_ratio = funding_required / total_cost
        if funding_ratio > 0.8:
            financial_risk += 20
            risk_factors.append('High funding requirement ratio')
        elif funding_ratio < 0.3:
            financial_risk += 10
            risk_factors.append('Low funding requirement ratio')
    
    risk_score += financial_risk * 0.3
    
    # NGO Credibility Risk (25% weight)
    ngo_risk = 0
    past_projects = int(project.past_projects_completed or 0)
    rating = int(project.ngo_rating or 0)
    
    if past_projects < 5:
        ngo_risk += 25
        risk_factors.append('Limited project experience')
    elif past_projects < 10:
        ngo_risk += 15
        risk_factors.append('Moderate project experience')
        
    if rating < 3:
        ngo_risk += 20
        risk_factors.append('Low NGO rating')
    elif rating < 4:
        ngo_risk += 10
        risk_factors.append('Moderate NGO rating')
    
    risk_score += ngo_risk * 0.25
    
    # Timeline Risk (20% weight)
    timeline_risk = 0
    duration_months = int(project.duration_months or 0)
    if duration_months > 24:
        timeline_risk += 20
        risk_factors.append('Long project duration')
    elif duration_months < 3:
        timeline_risk += 15
        risk_factors.append('Very short project duration')
    
    risk_score += timeline_risk * 0.20
    
    # Compliance Risk (15% weight)
    compliance_risk = 0
    fcra_status = project.ngo_fcra_status or ''
    g80_status = project.ngo_80g_status or ''
    
    if fcra_status != 'Valid':
        compliance_risk += 30
        risk_factors.append('FCRA status issues')
    if g80_status != 'Valid':
        compliance_risk += 20
        risk_factors.append('80G status issues')
    
    risk_score += compliance_risk * 0.15
    
    # Impact Risk (10% weight)
    impact_risk = 0
    expected_outcomes = project.expected_outcomes
    if not expected_outcomes:
        impact_risk += 15
        risk_factors.append('Limited impact metrics defined')
    
    risk_score += impact_risk * 0.10
    
    # Check for unusual activities
    unusual_activities = detect_unusual_activities(project, collaboration)
    
    return {
        'score': round(risk_score, 2),
        'level': get_risk_level(risk_score),
        'factors': risk_factors,
        'unusual_activities': unusual_activities
    }


def get_risk_level(score):
    """Convert risk score to risk level"""
    if score >= 70:
        return 'High'
    elif score >= 40:
        return 'Medium'
    else:
        return 'Low'


def calculate_daily_metrics(projects):
    """Calculate daily metrics for projects"""
    metrics = {
        'projects_active': 0,
        'projects_completed': 0,
        'projects_delayed': 0,
        'compliance_issues': 0,
        'budget_overruns': 0
    }
    
    for project in projects:
        if project['status'] == 'in_progress':
            metrics['projects_active'] += 1
        elif project['status'] == 'completed':
            metrics['projects_completed'] += 1
        
        # Check for delays (simplified logic)
        if project['risk_level'] == 'High':
            metrics['projects_delayed'] += 1
        
        # Check for compliance issues
        if any('compliance' in factor.lower() for factor in project['risk_factors']):
            metrics['compliance_issues'] += 1
    
    return metrics


def detect_unusual_activities(project, collaboration):
    """Detect unusual activities for a project"""
    unusual = []
    
    # Check for high-risk indicators
    rating = int(project.ngo_rating or 0)
    if rating < 3:
        unusual.append({
            'type': 'low_rating',
            'message': f'NGO rating is low ({rating}/5)',
            'severity': 'high',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # Check for funding anomalies
    funding_required = float(project.funding_required or 0)
    if funding_required > 10000000:  # 1 crore
        unusual.append({
            'type': 'high_funding',
            'message': f'High funding requirement: ₹{funding_required:,.0f}',
            'severity': 'medium',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    # Check for timeline issues
    duration = int(project.duration_months or 0)
    if duration > 36:  # 3 years
        unusual.append({
            'type': 'long_duration',
            'message': f'Very long project duration: {duration} months',
            'severity': 'medium',
            'timestamp': datetime.utcnow().isoformat()
        })
    
    return unusual


def get_recent_unusual_activities():
    """Get recent unusual activities across all projects"""
    # This would typically query a database table for unusual activities
    # For now, return sample data
    return [
        {
            'id': 1,
            'project_id': 1,
            'project_title': 'Healthcare Access in Remote Areas',
            'type': 'compliance_alert',
            'message': 'FCRA certificate expiring in 30 days',
            'severity': 'high',
            'timestamp': datetime.utcnow().isoformat(),
            'company_id': 1
        },
        {
            'id': 2,
            'project_id': 2,
            'project_title': 'Skill Development for Urban Youth',
            'type': 'budget_alert',
            'message': 'Project spending 15% above budget',
            'severity': 'medium',
            'timestamp': datetime.utcnow().isoformat(),
            'company_id': 1
        }
    ]


def get_daily_analysis():
    """Get daily analysis summary"""
    return {
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
        'total_projects_monitored': 15,
        'new_risks_identified': 3,
        'resolved_risks': 1,
        'compliance_alerts': 2,
        'budget_alerts': 1,
        'timeline_alerts': 0,
        'overall_risk_trend': 'stable',
        'recommendations': [
            'Monitor FCRA certificate renewals',
            'Review budget utilization for high-spending projects',
            'Schedule compliance audits for medium-risk NGOs'
        ]
    }


