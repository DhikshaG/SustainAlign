from flask import Blueprint, jsonify, request, current_app
from sqlalchemy import text
import os
from models import db, User, Company, CompanyBranch, CSRContact, Budget, FocusArea, ComplianceDocument, NGOPreference, AIConfig, UserRole, Project, NGOProfile
from utils import hash_password, current_user
import json

profile_bp = Blueprint('profile', __name__)


def get_current_user():
    """Backwards-compatible shim; real auth runs in auth_middleware.enforce_auth."""
    return current_user()


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


@profile_bp.get('/test-dev')
def test_dev_mode():
    """Test endpoint to verify development mode detection"""
    is_dev = (
        current_app.config.get('ENV') == 'development' or
        current_app.config.get('FLASK_ENV') == 'development' or
        current_app.debug or
        os.environ.get('FLASK_ENV') == 'development' or
        os.environ.get('FLASK_DEBUG') == '1' or
        str(os.environ.get('DEV_NO_AUTH', '')).lower() in ('1', 'true', 'yes')
    )
    
    return jsonify({
        'debug_mode': current_app.debug,
        'env': current_app.config.get('ENV'),
        'flask_env': os.environ.get('FLASK_ENV'),
        'flask_debug': os.environ.get('FLASK_DEBUG'),
        'dev_no_auth': os.environ.get('DEV_NO_AUTH'),
        'is_development': is_dev
    })

@profile_bp.post('/ngo-onboarding')
def save_ngo_onboarding():
    """Save NGO onboarding data by creating/updating NGOProfile and optionally a starter Project.

    Accepts the new schema from ngo-onboarding.jsx. Backwards-compatible with old field names.
    """
    user = get_current_user()
    # Always allow fallback to guest NGO user if unauthenticated
    if not user:
        guest_email = 'guest-ngo@sustainalign.local'
        user = User.query.filter_by(email=guest_email).first()
        if not user:
            try:
                user = User(email=guest_email, password_hash=hash_password('guest'), role='ngo')
                db.session.add(user)
                db.session.flush()
            except Exception:
                db.session.rollback()
                return jsonify({'error': 'Failed to initialize guest user'}), 500

    data = request.get_json() or {}

    # Auto-heal: make sure critical new columns exist
    ensure_column_exists('ngo_profiles', 'about', 'TEXT')

    # Normalize helpers for lists/strings
    def normalize_to_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        if isinstance(value, str):
            # split on comma or semicolon
            parts = [p.strip() for p in value.replace(';', ',').split(',') if p.strip()]
            return parts
        # fallback single item
        return [str(value)]

    try:
        # Resolve NGO name (new key 'name' or legacy 'ngo')
        ngo_name = (data.get('name') or data.get('ngo') or '').strip() or 'NGO'
        ngo = NGOProfile.query.filter_by(name=ngo_name).first()
        if not ngo:
            ngo = NGOProfile(name=ngo_name, country=(data.get('country') or 'India'))
            db.session.add(ngo)
        # Region may come as string or list
        regions = normalize_to_list(data.get('geographic_focus') or data.get('geographicFocus') or data.get('region'))
        if regions:
            ngo.city = regions[0]  # keep simple single city
            ngo.set_geographic_focus(regions)
        verification = (data.get('verification_badge') or data.get('verificationBadge') or data.get('verification') or '').strip()
        if verification:
            ngo.verification_badge = verification
        # Enrich NGOProfile from onboarding data (new keys with fallbacks)
        sectors = normalize_to_list(data.get('primary_sectors') or data.get('primarySectors') or data.get('sector'))
        if sectors:
            ngo.set_primary_sectors(sectors)
        sdgs_list = normalize_to_list(data.get('sdg_focus') or data.get('sdgFocus') or data.get('sdgs'))
        if sdgs_list:
            ngo.set_sdg_focus(sdgs_list)
        # Basics
        ngo.registration_number = data.get('registration_number') or data.get('registrationNumber') or ngo.registration_number
        ngo.legal_status = data.get('legal_status') or data.get('legalStatus') or ngo.legal_status
        try:
            year_est = data.get('year_established') or data.get('yearEstablished')
            ngo.year_established = int(year_est) if year_est not in (None, '') else ngo.year_established
        except Exception:
            pass
        ngo.about = data.get('about') or ngo.about
        # Contact
        ngo.address = data.get('address') or ngo.address
        ngo.state = data.get('state') or ngo.state
        ngo.country = data.get('country') or ngo.country or 'India'
        ngo.phone = data.get('phone') or ngo.phone
        ngo.email = data.get('email') or ngo.email
        ngo.website = data.get('website') or ngo.website
        # Financials
        try:
            budget_val = data.get('annual_budget') or data.get('annualBudget') or data.get('allocated')
            ngo.annual_budget = float(budget_val) if budget_val not in (None, '') else ngo.annual_budget
        except Exception:
            pass
        ngo.currency = (data.get('currency') or ngo.currency or 'INR')
        funds = normalize_to_list(data.get('funding_sources') or data.get('fundingSources'))
        if funds:
            ngo.set_funding_sources(funds)
        # Compliance & credibility
        ngo.pan_number = data.get('pan_number') or data.get('pan') or ngo.pan_number
        ngo.tan_number = data.get('tan_number') or data.get('tan') or ngo.tan_number
        ngo.gst_number = data.get('gst_number') or data.get('gst') or ngo.gst_number
        ngo._80g_status = data.get('_80g_status') or data.get('_80gStatus') or ngo._80g_status
        ngo.fcra_status = data.get('fcra_status') or data.get('fcraStatus') or ngo.fcra_status
        ngo.fcra_number = data.get('fcra_number') or data.get('fcraNumber') or ngo.fcra_number
        try:
            rating_val = data.get('rating')
            ngo.rating = int(rating_val) if rating_val not in (None, '') else ngo.rating
        except Exception:
            pass
        ngo.verification_badge = verification or ngo.verification_badge
        ngo.status = 'active'
        # Media & documents
        docs = normalize_to_list(data.get('documents'))
        if docs:
            ngo.set_documents(docs)
        if data.get('logo_url') or data.get('logoUrl'):
            ngo.logo_url = data.get('logo_url') or data.get('logoUrl')
        if data.get('profile_image_url') or data.get('profileImageUrl'):
            ngo.profile_image_url = data.get('profile_image_url') or data.get('profileImageUrl')
        db.session.flush()

        # Build a starter project from onboarding
        from datetime import datetime, date
        def parse_date(s):
            try:
                if not s:
                    return date.today()
                return datetime.strptime(s, '%Y-%m-%d').date()
            except Exception:
                return date.today()

        title = (data.get('title') or 'Untitled Project').strip()
        start_date = parse_date(data.get('start'))
        end_date = parse_date(data.get('end'))

        total_cost = 0.0
        remaining = 0.0
        try:
            total_cost = float(data.get('allocated') or 0)
        except Exception:
            total_cost = 0.0
        try:
            remaining = float(data.get('remaining') or 0)
        except Exception:
            remaining = 0.0

        project = Project(
            title=title,
            short_description=f"{(sectors[0] if sectors else '')} · {(regions[0] if regions else '')}",
            ngo_name=ngo_name,
            location_city='',
            location_region=(regions[0] if regions else ''),
            location_country='India',
            total_project_cost=total_cost,
            funding_required=remaining,
            currency='INR',
            csr_eligibility=True,
            preferred_contribution_type='cash',
            start_date=start_date,
            end_date=end_date,
            ngo_registration_number=None,
            ngo_80g_status=None,
            ngo_fcra_status=None,
            ngo_rating=None,
            ngo_verification_badge=verification or 'Pending',
            past_projects_completed=0,
            status='draft',
            visibility='public',
            created_by=(user.id if user else None)
        )

        if sdgs_list:
            project.set_sdg_goals(sdgs_list)
        if sectors:
            project.set_csr_focus_areas(sectors)

        # KPIs can be provided as keyed fields or a dict
        kpis = {}
        if isinstance(data.get('kpis'), dict):
            kpis.update(data.get('kpis'))
        if data.get('kpi1'): kpis['kpi1'] = data.get('kpi1')
        if data.get('kpi2'): kpis['kpi2'] = data.get('kpi2')
        if data.get('kpi3'): kpis['kpi3'] = data.get('kpi3')
        if data.get('kpi4'): kpis['kpi4'] = data.get('kpi4')
        if kpis:
            project.set_kpis(kpis)

        db.session.add(project)
        db.session.commit()

        return jsonify({'message': 'Onboarding saved', 'ngo': ngo.to_detail(), 'project': project.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"NGO onboarding save failed: {str(e)}")
        # In development, include error detail to help debugging
        if current_app.debug:
            return jsonify({'error': 'Failed to save onboarding', 'detail': str(e)}), 500
        return jsonify({'error': 'Failed to save onboarding'}), 500


@profile_bp.get('/me')
def me():
    """Get current user profile"""
    user = get_current_user()
    if not user:
        # Development fallback: return/create guest user
        guest_email = 'guest@sustainalign.local'
        user = User.query.filter_by(email=guest_email).first()
        if not user:
            try:
                user = User(email=guest_email, password_hash=hash_password('guest'), role='corporate')
                db.session.add(user)
                db.session.commit()
            except Exception:
                db.session.rollback()
                return jsonify({'error': 'Failed to initialize guest user'}), 500
    return jsonify(user.to_dict())


@profile_bp.get('/companies')
def get_companies():
    """Get all companies for current user"""
    user = get_current_user()
    if not user:
        # Development: return all companies to make UI work without auth
        companies = Company.query.order_by(Company.id.desc()).all()
    else:
        companies = Company.query.filter_by(user_id=user.id).all()
    return jsonify({
        'companies': [company.to_dict() for company in companies]
    })


@profile_bp.get('/companies/<int:company_id>')
def get_company(company_id):
    """Get specific company details"""
    user = get_current_user()
    if not user:
        # Development: allow fetching by id without user restriction
        company = Company.query.filter_by(id=company_id).first()
    else:
        company = Company.query.filter_by(id=company_id, user_id=user.id).first()
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    return jsonify(company.to_dict())


@profile_bp.post('/companies')
def create_company():
    """Create a new company profile. In development, allow unauthenticated and use/create a guest user."""
    user = get_current_user()
    if not user:
        # Development fallback: create or reuse a guest user
        guest_email = 'guest@sustainalign.local'
        user = User.query.filter_by(email=guest_email).first()
        if not user:
            try:
                user = User(email=guest_email, password_hash=hash_password('guest'), role='corporate')
                db.session.add(user)
                db.session.flush()
            except Exception:
                db.session.rollback()
                return jsonify({'error': 'Failed to initialize guest user'}), 500
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Create main company record
        company = Company(
            user_id=user.id,
            company_name=data.get('company', {}).get('companyName', ''),
            logo_url=data.get('company', {}).get('logoFile', ''),
            registration_id=data.get('company', {}).get('registrationId', ''),
            industry=data.get('company', {}).get('industry', ''),
            hq_country=data.get('company', {}).get('hq', {}).get('country', ''),
            hq_state=data.get('company', {}).get('hq', {}).get('state', ''),
            hq_city=data.get('company', {}).get('hq', {}).get('city', ''),
            website=data.get('contact', {}).get('website', '')
        )
        
        db.session.add(company)
        db.session.flush()  # Get the company ID
        
        # Create company branches
        branches_data = data.get('company', {}).get('branches', [])
        for branch_data in branches_data:
            branch = CompanyBranch(
                company_id=company.id,
                country=branch_data.get('country', ''),
                state=branch_data.get('state', ''),
                city=branch_data.get('city', '')
            )
            db.session.add(branch)
        
        # Create CSR contact
        contact_data = data.get('contact', {})
        if contact_data:
            csr_contact = CSRContact(
                company_id=company.id,
                contact_name=contact_data.get('csrContactName', ''),
                contact_role=contact_data.get('csrContactRole', ''),
                email=contact_data.get('csrEmail', ''),
                phone=contact_data.get('csrPhone', '')
            )
            db.session.add(csr_contact)
        
        # Create budget
        budget_data = data.get('budget', {})
        if budget_data:
            budget = Budget(
                company_id=company.id,
                amount=budget_data.get('amount', 0),
                currency=budget_data.get('currency', 'INR'),
                project_size=budget_data.get('projectSize', 'Medium')
            )
            budget.set_splits(budget_data.get('splits', {}))
            db.session.add(budget)
        
        # Create focus area
        focus_data = data.get('focus', {})
        if focus_data:
            focus_area = FocusArea(
                company_id=company.id,
                esg_goals=focus_data.get('esgGoals', ''),
                themes=focus_data.get('themes', ''),
                target_year=focus_data.get('targetYear', ''),
                reporting_standard=focus_data.get('reportingStandard', '')
            )
            focus_area.set_priority_sdgs(focus_data.get('prioritySdgs', []))
            db.session.add(focus_area)
        
        # Create NGO preferences
        ngo_data = data.get('ngoPrefs', {})
        if ngo_data:
            ngo_prefs = NGOPreference(
                company_id=company.id,
                ngo_size=ngo_data.get('ngoSize', 'Mid-level'),
                partnership_model=ngo_data.get('partnershipModel', 'Funding + Execution'),
                spend_history=ngo_data.get('spendHistory', '')
            )
            ngo_prefs.set_regions(ngo_data.get('regions', []))
            db.session.add(ngo_prefs)
        
        # Create AI config
        ai_data = data.get('ai', {})
        if ai_data:
            ai_config = AIConfig(
                company_id=company.id,
                risk_appetite=ai_data.get('riskAppetite', 'Medium'),
                alignment_mode=ai_data.get('alignmentMode', 'Strict compliance')
            )
            ai_config.set_optimize_for(ai_data.get('optimizeFor', []))
            ai_config.set_integrations(ai_data.get('integrations', []))
            db.session.add(ai_config)
        
        # Create user roles
        access_data = data.get('access', {})
        roles_data = access_data.get('roles', [])
        for role_data in roles_data:
            user_role = UserRole(
                company_id=company.id,
                email=role_data.get('email', ''),
                role=role_data.get('role', 'CSR Manager')
            )
            db.session.add(user_role)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company profile created successfully',
            'company': company.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating company: {str(e)}")
        return jsonify({'error': 'Failed to create company profile'}), 500


@profile_bp.put('/companies/<int:company_id>')
def update_company(company_id):
    """Update company profile"""
    user = get_current_user()
    if not user:
        # Development: allow update by id only
        company = Company.query.filter_by(id=company_id).first()
    else:
        company = Company.query.filter_by(id=company_id, user_id=user.id).first()
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update main company record
        company_data = data.get('company', {})
        if company_data:
            company.company_name = company_data.get('companyName', company.company_name)
            company.logo_url = company_data.get('logoFile', company.logo_url)
            company.registration_id = company_data.get('registrationId', company.registration_id)
            company.industry = company_data.get('industry', company.industry)
            company.hq_country = company_data.get('hq', {}).get('country', company.hq_country)
            company.hq_state = company_data.get('hq', {}).get('state', company.hq_state)
            company.hq_city = company_data.get('hq', {}).get('city', company.hq_city)
            company.website = data.get('contact', {}).get('website', company.website)
        
        # Update branches (delete existing and create new)
        CompanyBranch.query.filter_by(company_id=company.id).delete()
        branches_data = data.get('company', {}).get('branches', [])
        for branch_data in branches_data:
            branch = CompanyBranch(
                company_id=company.id,
                country=branch_data.get('country', ''),
                state=branch_data.get('state', ''),
                city=branch_data.get('city', '')
            )
            db.session.add(branch)
        
        # Update CSR contact
        contact_data = data.get('contact', {})
        if contact_data:
            if company.csr_contact:
                company.csr_contact.contact_name = contact_data.get('csrContactName', company.csr_contact.contact_name)
                company.csr_contact.contact_role = contact_data.get('csrContactRole', company.csr_contact.contact_role)
                company.csr_contact.email = contact_data.get('csrEmail', company.csr_contact.email)
                company.csr_contact.phone = contact_data.get('csrPhone', company.csr_contact.phone)
            else:
                csr_contact = CSRContact(
                    company_id=company.id,
                    contact_name=contact_data.get('csrContactName', ''),
                    contact_role=contact_data.get('csrContactRole', ''),
                    email=contact_data.get('csrEmail', ''),
                    phone=contact_data.get('csrPhone', '')
                )
                db.session.add(csr_contact)
        
        # Update budget
        budget_data = data.get('budget', {})
        if budget_data:
            if company.budget:
                company.budget.amount = budget_data.get('amount', company.budget.amount)
                company.budget.currency = budget_data.get('currency', company.budget.currency)
                company.budget.project_size = budget_data.get('projectSize', company.budget.project_size)
                company.budget.set_splits(budget_data.get('splits', {}))
            else:
                budget = Budget(
                    company_id=company.id,
                    amount=budget_data.get('amount', 0),
                    currency=budget_data.get('currency', 'INR'),
                    project_size=budget_data.get('projectSize', 'Medium')
                )
                budget.set_splits(budget_data.get('splits', {}))
                db.session.add(budget)
        
        # Update focus area
        focus_data = data.get('focus', {})
        if focus_data:
            if company.focus_area:
                company.focus_area.esg_goals = focus_data.get('esgGoals', company.focus_area.esg_goals)
                company.focus_area.themes = focus_data.get('themes', company.focus_area.themes)
                company.focus_area.target_year = focus_data.get('targetYear', company.focus_area.target_year)
                company.focus_area.reporting_standard = focus_data.get('reportingStandard', company.focus_area.reporting_standard)
                company.focus_area.set_priority_sdgs(focus_data.get('prioritySdgs', []))
            else:
                focus_area = FocusArea(
                    company_id=company.id,
                    esg_goals=focus_data.get('esgGoals', ''),
                    themes=focus_data.get('themes', ''),
                    target_year=focus_data.get('targetYear', ''),
                    reporting_standard=focus_data.get('reportingStandard', '')
                )
                focus_area.set_priority_sdgs(focus_data.get('prioritySdgs', []))
                db.session.add(focus_area)
        
        # Update NGO preferences
        ngo_data = data.get('ngoPrefs', {})
        if ngo_data:
            if company.ngo_preferences:
                company.ngo_preferences.ngo_size = ngo_data.get('ngoSize', company.ngo_preferences.ngo_size)
                company.ngo_preferences.partnership_model = ngo_data.get('partnershipModel', company.ngo_preferences.partnership_model)
                company.ngo_preferences.spend_history = ngo_data.get('spendHistory', company.ngo_preferences.spend_history)
                company.ngo_preferences.set_regions(ngo_data.get('regions', []))
            else:
                ngo_prefs = NGOPreference(
                    company_id=company.id,
                    ngo_size=ngo_data.get('ngoSize', 'Mid-level'),
                    partnership_model=ngo_data.get('partnershipModel', 'Funding + Execution'),
                    spend_history=ngo_data.get('spendHistory', '')
                )
                ngo_prefs.set_regions(ngo_data.get('regions', []))
                db.session.add(ngo_prefs)
        
        # Update AI config
        ai_data = data.get('ai', {})
        if ai_data:
            if company.ai_config:
                company.ai_config.risk_appetite = ai_data.get('riskAppetite', company.ai_config.risk_appetite)
                company.ai_config.alignment_mode = ai_data.get('alignmentMode', company.ai_config.alignment_mode)
                company.ai_config.set_optimize_for(ai_data.get('optimizeFor', []))
                company.ai_config.set_integrations(ai_data.get('integrations', []))
            else:
                ai_config = AIConfig(
                    company_id=company.id,
                    risk_appetite=ai_data.get('riskAppetite', 'Medium'),
                    alignment_mode=ai_data.get('alignmentMode', 'Strict compliance')
                )
                ai_config.set_optimize_for(ai_data.get('optimizeFor', []))
                ai_config.set_integrations(ai_data.get('integrations', []))
                db.session.add(ai_config)
        
        # Update user roles
        access_data = data.get('access', {})
        roles_data = access_data.get('roles', [])
        UserRole.query.filter_by(company_id=company.id).delete()
        for role_data in roles_data:
            user_role = UserRole(
                company_id=company.id,
                email=role_data.get('email', ''),
                role=role_data.get('role', 'CSR Manager')
            )
            db.session.add(user_role)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company profile updated successfully',
            'company': company.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating company: {str(e)}")
        return jsonify({'error': 'Failed to update company profile'}), 500


@profile_bp.delete('/companies/<int:company_id>')
def delete_company(company_id):
    """Delete company profile"""
    user = get_current_user()
    if not user:
        company = Company.query.filter_by(id=company_id).first()
    else:
        company = Company.query.filter_by(id=company_id, user_id=user.id).first()
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    try:
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company profile deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting company: {str(e)}")
        return jsonify({'error': 'Failed to delete company profile'}), 500


@profile_bp.post('/companies/<int:company_id>/documents')
def upload_document(company_id):
    """Upload compliance document"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    company = Company.query.filter_by(id=company_id, user_id=user.id).first()
    if not company:
        return jsonify({'error': 'Company not found'}), 404
    
    # This is a placeholder for file upload functionality
    # In a real implementation, you would handle file upload here
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        document = ComplianceDocument(
            company_id=company.id,
            document_type=data.get('document_type', 'policy'),
            file_name=data.get('file_name', ''),
            file_url=data.get('file_url', ''),
            file_size=data.get('file_size', 0)
        )
        db.session.add(document)
        db.session.commit()
        
        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading document: {str(e)}")
        return jsonify({'error': 'Failed to upload document'}), 500


