#!/usr/bin/env python3
"""
Database Seeding Script for SustainAlign
This script removes all existing data from the database and populates it with comprehensive sample data.
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from utils import hash_password
from models import (
    User, Project, ProjectMilestone, ProjectApplication, ProjectImpactReport,
    Company, CompanyBranch, CSRContact, Budget, FocusArea, ComplianceDocument,
    NGOPreference, AIConfig, UserRole, AIMatch, ApprovalRequest, ApprovalStep,
    AuditEvent, ImpactMetricSnapshot, ImpactTimeSeries, ImpactRegionStat,
    ImpactGoal, NGOProfile, NGOImpactEvent, NGODocument, NGOTransparencyReport,
    NGOCertificate, NGOTestimonial, DecisionRationale, RationaleNote,
    ReportJob, ReportArtifact, NGORiskAssessment,
    ProjectTrackingInfo, ProjectTimelineEntry
)
from sample_data import get_all_sample_data
from sample_data.user_sample import (
    get_sample_users as get_sample_users_with_hash,
    print_credentials_table,
)

def clear_database():
    """Remove all existing data from the database"""
    print("🗑️  Clearing existing database data...")
    
    # List of models in order of dependencies (child tables first)
    models_to_clear = [
        # Child/related models first
        ProjectTimelineEntry,
        ProjectTrackingInfo,
        NGORiskAssessment,
        ReportArtifact,
        ReportJob,
        RationaleNote,
        DecisionRationale,
        NGOTestimonial,
        NGOCertificate,
        NGOTransparencyReport,
        NGODocument,
        NGOImpactEvent,
        NGOProfile,
        ImpactGoal,
        ImpactRegionStat,
        ImpactTimeSeries,
        ImpactMetricSnapshot,
        ApprovalStep,
        ApprovalRequest,
        AIMatch,
        ProjectImpactReport,
        ProjectApplication,
        ProjectMilestone,
        Project,
        AIConfig,
        NGOPreference,
        ComplianceDocument,
        FocusArea,
        Budget,
        CSRContact,
        CompanyBranch,
        Company,
        UserRole,
        AuditEvent,
        User
    ]
    
    for model in models_to_clear:
        try:
            count = model.query.delete()
            print(f"   ✅ Cleared {count} records from {model.__name__}")
        except Exception as e:
            print(f"   ⚠️  Warning: Could not clear {model.__name__}: {e}")
    
    # Commit the changes
    db.session.commit()
    print("   ✅ Database cleared successfully")

def seed_database():
    """Populate the database with sample data"""
    print("🌱 Seeding database with sample data...")
    
    # Get all sample data
    sample_data = get_all_sample_data()
    
    # Track statistics
    stats = {}
    
    try:
        # 1. Seed Users first (required for foreign keys).
        # Passwords are bcrypt-hashed at run time from sample_data.user_sample
        # LOGIN_CREDENTIALS — no plaintext-derived hashes are committed to source.
        print("   👥 Seeding users...")
        seeded_users = get_sample_users_with_hash(hasher=hash_password)
        for user_data in seeded_users:
            user = User(**user_data)
            db.session.add(user)
        db.session.commit()
        stats['users'] = len(seeded_users)
        print(f"      ✅ Added {stats['users']} users")
        
        # 2. Seed Companies and related data
        print("   🏢 Seeding companies and related data...")
        company_data = sample_data.get('companies', {})
        
        if 'companies' in company_data:
            for company_item in company_data['companies']:
                company = Company(**company_item)
                db.session.add(company)
            db.session.commit()
            stats['companies'] = len(company_data['companies'])
            print(f"      ✅ Added {stats['companies']} companies")
        
        # Add company branches
        if 'branches' in company_data:
            for branch_data in company_data['branches']:
                branch = CompanyBranch(**branch_data)
                db.session.add(branch)
            db.session.commit()
            stats['branches'] = len(company_data['branches'])
            print(f"      ✅ Added {stats['branches']} company branches")
        
        # Add CSR contacts
        if 'csr_contacts' in company_data:
            for contact_data in company_data['csr_contacts']:
                contact = CSRContact(**contact_data)
                db.session.add(contact)
            db.session.commit()
            stats['csr_contacts'] = len(company_data['csr_contacts'])
            print(f"      ✅ Added {stats['csr_contacts']} CSR contacts")
        
        # Add budgets
        if 'budgets' in company_data:
            for budget_data in company_data['budgets']:
                # Create budget object without splits first
                budget_dict = {k: v for k, v in budget_data.items() if k != 'splits'}
                budget = Budget(**budget_dict)
                
                # Set splits using the helper method if splits exist
                if 'splits' in budget_data and budget_data['splits']:
                    budget.set_splits(budget_data['splits'])
                
                db.session.add(budget)
            db.session.commit()
            stats['budgets'] = len(company_data['budgets'])
            print(f"      ✅ Added {stats['budgets']} budgets")
        
        # Add focus areas
        if 'focus_areas' in company_data:
            for focus_data in company_data['focus_areas']:
                # Create focus area object without priority_sdgs first
                focus_dict = {k: v for k, v in focus_data.items() if k != 'priority_sdgs'}
                focus = FocusArea(**focus_dict)
                
                # Set priority_sdgs using the helper method if it exists
                if 'priority_sdgs' in focus_data and focus_data['priority_sdgs']:
                    focus.set_priority_sdgs(focus_data['priority_sdgs'])
                
                db.session.add(focus)
            db.session.commit()
            stats['focus_areas'] = len(company_data['focus_areas'])
            print(f"      ✅ Added {stats['focus_areas']} focus areas")
        
        # Add compliance documents
        if 'compliance_documents' in company_data:
            for doc_data in company_data['compliance_documents']:
                doc = ComplianceDocument(**doc_data)
                db.session.add(doc)
            db.session.commit()
            stats['compliance_documents'] = len(company_data['compliance_documents'])
            print(f"      ✅ Added {stats['compliance_documents']} compliance documents")
        
        # Add NGO preferences
        if 'ngo_preferences' in company_data:
            for pref_data in company_data['ngo_preferences']:
                # Create NGO preference object without regions first
                pref_dict = {k: v for k, v in pref_data.items() if k != 'regions'}
                pref = NGOPreference(**pref_dict)
                
                # Set regions using the helper method if it exists
                if 'regions' in pref_data and pref_data['regions']:
                    pref.set_regions(pref_data['regions'])
                
                db.session.add(pref)
            db.session.commit()
            stats['ngo_preferences'] = len(company_data['ngo_preferences'])
            print(f"      ✅ Added {stats['ngo_preferences']} NGO preferences")
        
        # Add AI configs
        if 'ai_configs' in company_data:
            for config_data in company_data['ai_configs']:
                # Create AI config object without JSON fields first
                config_dict = {k: v for k, v in config_data.items() if k not in ['optimize_for', 'integrations']}
                config = AIConfig(**config_dict)
                
                # Set optimize_for using the helper method if it exists
                if 'optimize_for' in config_data and config_data['optimize_for']:
                    config.set_optimize_for(config_data['optimize_for'])
                
                # Set integrations using the helper method if it exists
                if 'integrations' in config_data and config_data['integrations']:
                    config.set_integrations(config_data['integrations'])
                
                db.session.add(config)
            db.session.commit()
            stats['ai_configs'] = len(company_data['ai_configs'])
            print(f"      ✅ Added {stats['ai_configs']} AI configs")
        
        # Add user roles
        if 'user_roles' in company_data:
            for role_data in company_data['user_roles']:
                role = UserRole(**role_data)
                db.session.add(role)
            db.session.commit()
            stats['user_roles'] = len(company_data['user_roles'])
            print(f"      ✅ Added {stats['user_roles']} user roles")
        
        # 3. Seed Projects and related data
        print("   📋 Seeding projects and related data...")
        projects_data = sample_data.get('projects', {})
        
        if 'projects' in projects_data:
            for project_data in projects_data['projects']:
                # Create project object without JSON fields first
                json_fields = ['sdg_goals', 'csr_focus_areas', 'target_beneficiaries', 'expected_outcomes', 'kpis', 'past_impact', 'project_images']
                project_dict = {k: v for k, v in project_data.items() if k not in json_fields}
                project = Project(**project_dict)
                
                # Set JSON fields using helper methods if they exist
                if 'sdg_goals' in project_data and project_data['sdg_goals']:
                    project.set_sdg_goals(project_data['sdg_goals'])
                
                if 'csr_focus_areas' in project_data and project_data['csr_focus_areas']:
                    project.set_csr_focus_areas(project_data['csr_focus_areas'])
                
                if 'target_beneficiaries' in project_data and project_data['target_beneficiaries']:
                    project.set_target_beneficiaries(project_data['target_beneficiaries'])
                
                if 'expected_outcomes' in project_data and project_data['expected_outcomes']:
                    project.set_expected_outcomes(project_data['expected_outcomes'])
                
                if 'kpis' in project_data and project_data['kpis']:
                    project.set_kpis(project_data['kpis'])
                
                if 'past_impact' in project_data and project_data['past_impact']:
                    project.set_past_impact(project_data['past_impact'])
                
                if 'project_images' in project_data and project_data['project_images']:
                    project.set_project_images(project_data['project_images'])
                
                db.session.add(project)
            db.session.commit()
            stats['projects'] = len(projects_data['projects'])
            print(f"      ✅ Added {stats['projects']} projects")
        
        # Add project milestones
        if 'milestones' in projects_data:
            for milestone_data in projects_data['milestones']:
                milestone = ProjectMilestone(**milestone_data)
                db.session.add(milestone)
            db.session.commit()
            stats['milestones'] = len(projects_data['milestones'])
            print(f"      ✅ Added {stats['milestones']} project milestones")
        
        # Add project applications
        if 'applications' in projects_data:
            for app_data in projects_data['applications']:
                app = ProjectApplication(**app_data)
                db.session.add(app)
            db.session.commit()
            stats['applications'] = len(projects_data['applications'])
            print(f"      ✅ Added {stats['applications']} project applications")
        
        # Add project impact reports
        if 'impact_reports' in projects_data:
            for report_data in projects_data['impact_reports']:
                # Create impact report object without JSON fields first
                json_fields = ['impact_metrics', 'attachments']
                report_dict = {k: v for k, v in report_data.items() if k not in json_fields}
                report = ProjectImpactReport(**report_dict)
                
                # Set JSON fields using helper methods if they exist
                if 'impact_metrics' in report_data and report_data['impact_metrics']:
                    report.set_impact_metrics(report_data['impact_metrics'])
                
                if 'attachments' in report_data and report_data['attachments']:
                    report.set_attachments(report_data['attachments'])
                
                db.session.add(report)
            db.session.commit()
            stats['impact_reports'] = len(projects_data['impact_reports'])
            print(f"      ✅ Added {stats['impact_reports']} project impact reports")
        
        # 4. Seed AI Matching data
        print("   🤖 Seeding AI matching data...")
        ai_data = sample_data.get('ai_matching', {})
        if 'ai_matches' in ai_data:
            for match_data in ai_data['ai_matches']:
                match = AIMatch(**match_data)
                db.session.add(match)
            db.session.commit()
            stats['ai_matches'] = len(ai_data['ai_matches'])
            print(f"      ✅ Added {stats['ai_matches']} AI matches")
        
        # 5. Seed Approval data
        print("   ✅ Seeding approval data...")
        approval_data = sample_data.get('approvals', {})
        
        if 'approval_requests' in approval_data:
            for request_data in approval_data['approval_requests']:
                request = ApprovalRequest(**request_data)
                db.session.add(request)
            db.session.commit()
            stats['approval_requests'] = len(approval_data['approval_requests'])
            print(f"      ✅ Added {stats['approval_requests']} approval requests")
        
        if 'approval_steps' in approval_data:
            for step_data in approval_data['approval_steps']:
                step = ApprovalStep(**step_data)
                db.session.add(step)
            db.session.commit()
            stats['approval_steps'] = len(approval_data['approval_steps'])
            print(f"      ✅ Added {stats['approval_steps']} approval steps")
        
        # 6. Seed Audit data
        print("   📊 Seeding audit data...")
        audit_data = sample_data.get('audit', {})
        if 'audit_events' in audit_data:
            for event_data in audit_data['audit_events']:
                event = AuditEvent(**event_data)
                db.session.add(event)
            db.session.commit()
            stats['audit_events'] = len(audit_data['audit_events'])
            print(f"      ✅ Added {stats['audit_events']} audit events")
        
        # 7. Seed Impact data
        print("   📈 Seeding impact data...")
        impact_data = sample_data.get('impact', {})
        
        if 'impact_snapshots' in impact_data:
            for snapshot_data in impact_data['impact_snapshots']:
                snapshot = ImpactMetricSnapshot(**snapshot_data)
                db.session.add(snapshot)
            db.session.commit()
            stats['impact_snapshots'] = len(impact_data['impact_snapshots'])
            print(f"      ✅ Added {stats['impact_snapshots']} impact snapshots")
        
        if 'impact_time_series' in impact_data:
            for ts_data in impact_data['impact_time_series']:
                ts = ImpactTimeSeries(**ts_data)
                db.session.add(ts)
            db.session.commit()
            stats['impact_time_series'] = len(impact_data['impact_time_series'])
            print(f"      ✅ Added {stats['impact_time_series']} impact time series")
        
        if 'impact_region_stats' in impact_data:
            for region_data in impact_data['impact_region_stats']:
                region = ImpactRegionStat(**region_data)
                db.session.add(region)
            db.session.commit()
            stats['impact_region_stats'] = len(impact_data['impact_region_stats'])
            print(f"      ✅ Added {stats['impact_region_stats']} impact region stats")
        
        if 'impact_goals' in impact_data:
            for goal_data in impact_data['impact_goals']:
                goal = ImpactGoal(**goal_data)
                db.session.add(goal)
            db.session.commit()
            stats['impact_goals'] = len(impact_data['impact_goals'])
            print(f"      ✅ Added {stats['impact_goals']} impact goals")
        
        # 8. Seed NGO Marketplace data
        print("   🤝 Seeding NGO marketplace data...")
        ngo_data = sample_data.get('ngo_marketplace', {})
        
        if 'ngo_profiles' in ngo_data:
            for profile_data in ngo_data['ngo_profiles']:
                # Create NGO profile object without JSON fields first
                json_fields = ['primary_sectors', 'sdg_focus', 'geographic_focus', 'funding_sources', 'documents']
                profile_dict = {k: v for k, v in profile_data.items() if k not in json_fields}
                profile = NGOProfile(**profile_dict)
                
                # Set JSON fields using helper methods if they exist
                if 'primary_sectors' in profile_data and profile_data['primary_sectors']:
                    profile.set_primary_sectors(profile_data['primary_sectors'])
                
                if 'sdg_focus' in profile_data and profile_data['sdg_focus']:
                    profile.set_sdg_focus(profile_data['sdg_focus'])
                
                if 'geographic_focus' in profile_data and profile_data['geographic_focus']:
                    profile.set_geographic_focus(profile_data['geographic_focus'])
                
                if 'funding_sources' in profile_data and profile_data['funding_sources']:
                    profile.set_funding_sources(profile_data['funding_sources'])
                
                if 'documents' in profile_data and profile_data['documents']:
                    profile.set_documents(profile_data['documents'])
                
                db.session.add(profile)
            db.session.commit()
            stats['ngo_profiles'] = len(ngo_data['ngo_profiles'])
            print(f"      ✅ Added {stats['ngo_profiles']} NGO profiles")
        
        if 'ngo_impact_events' in ngo_data:
            for event_data in ngo_data['ngo_impact_events']:
                # Create impact event object without JSON fields first
                json_fields = ['kpis']
                event_dict = {k: v for k, v in event_data.items() if k not in json_fields}
                event = NGOImpactEvent(**event_dict)
                
                # Set JSON fields using helper methods if they exist
                if 'kpis' in event_data and event_data['kpis']:
                    event.kpis = event_data['kpis']  # db.JSON handles Python objects automatically
                
                db.session.add(event)
            db.session.commit()
            stats['ngo_impact_events'] = len(ngo_data['ngo_impact_events'])
            print(f"      ✅ Added {stats['ngo_impact_events']} NGO impact events")
        
        if 'ngo_documents' in ngo_data:
            for doc_data in ngo_data['ngo_documents']:
                doc = NGODocument(**doc_data)
                db.session.add(doc)
            db.session.commit()
            stats['ngo_documents'] = len(ngo_data['ngo_documents'])
            print(f"      ✅ Added {stats['ngo_documents']} NGO documents")
        
        if 'ngo_transparency_reports' in ngo_data:
            for report_data in ngo_data['ngo_transparency_reports']:
                report = NGOTransparencyReport(**report_data)
                db.session.add(report)
            db.session.commit()
            stats['ngo_transparency_reports'] = len(ngo_data['ngo_transparency_reports'])
            print(f"      ✅ Added {stats['ngo_transparency_reports']} NGO transparency reports")
        
        if 'ngo_certificates' in ngo_data:
            for cert_data in ngo_data['ngo_certificates']:
                cert = NGOCertificate(**cert_data)
                db.session.add(cert)
            db.session.commit()
            stats['ngo_certificates'] = len(ngo_data['ngo_certificates'])
            print(f"      ✅ Added {stats['ngo_certificates']} NGO certificates")
        
        if 'ngo_testimonials' in ngo_data:
            for testimonial_data in ngo_data['ngo_testimonials']:
                testimonial = NGOTestimonial(**testimonial_data)
                db.session.add(testimonial)
            db.session.commit()
            stats['ngo_testimonials'] = len(ngo_data['ngo_testimonials'])
            print(f"      ✅ Added {stats['ngo_testimonials']} NGO testimonials")
        
        # 9. Seed Rationale data
        print("   🧠 Seeding rationale data...")
        rationale_data = sample_data.get('rationale', {})
        
        if 'decision_rationales' in rationale_data:
            for rationale_data_item in rationale_data['decision_rationales']:
                rationale = DecisionRationale(**rationale_data_item)
                db.session.add(rationale)
            db.session.commit()
            stats['decision_rationales'] = len(rationale_data['decision_rationales'])
            print(f"      ✅ Added {stats['decision_rationales']} decision rationales")
        
        if 'rationale_notes' in rationale_data:
            for note_data in rationale_data['rationale_notes']:
                note = RationaleNote(**note_data)
                db.session.add(note)
            db.session.commit()
            stats['rationale_notes'] = len(rationale_data['rationale_notes'])
            print(f"      ✅ Added {stats['rationale_notes']} rationale notes")
        
        # 10. Seed Reporting data
        print("   📄 Seeding reporting data...")
        
        # Add report jobs
        if 'reporting' in sample_data and 'report_jobs' in sample_data['reporting']:
            for job_data in sample_data['reporting']['report_jobs']:
                # Create job object without metrics first
                job_dict = {k: v for k, v in job_data.items() if k != 'metrics'}
                job = ReportJob(**job_dict)
                
                # Set metrics using direct assignment for db.JSON field
                if 'metrics' in job_data and job_data['metrics']:
                    job.metrics = job_data['metrics']
                
                db.session.add(job)
            db.session.commit()
            stats['report_jobs'] = len(sample_data['reporting']['report_jobs'])
            print(f"      ✅ Added {stats['report_jobs']} report jobs")
        
        # Add report artifacts
        if 'reporting' in sample_data and 'report_artifacts' in sample_data['reporting']:
            for artifact_data in sample_data['reporting']['report_artifacts']:
                artifact = ReportArtifact(**artifact_data)
                db.session.add(artifact)
            db.session.commit()
            stats['report_artifacts'] = len(sample_data['reporting']['report_artifacts'])
            print(f"      ✅ Added {stats['report_artifacts']} report artifacts")
        
        # 11. Seed Risk data
        print("   ⚠️  Seeding risk data...")
        risk_data = sample_data.get('risk', {})
        
        if 'ngo_risk_assessments' in risk_data:
            for assessment_data in risk_data['ngo_risk_assessments']:
                # Create risk assessment object without JSON fields first
                json_fields = ['radar_categories', 'radar_values', 'trend_categories', 'trend_avg', 'trend_bench']
                assessment_dict = {k: v for k, v in assessment_data.items() if k not in json_fields}
                assessment = NGORiskAssessment(**assessment_dict)
                
                # Set JSON fields directly since db.JSON handles Python objects automatically
                if 'radar_categories' in assessment_data and assessment_data['radar_categories']:
                    assessment.radar_categories = assessment_data['radar_categories']
                
                if 'radar_values' in assessment_data and assessment_data['radar_values']:
                    assessment.radar_values = assessment_data['radar_values']
                
                if 'trend_categories' in assessment_data and assessment_data['trend_categories']:
                    assessment.trend_categories = assessment_data['trend_categories']
                
                if 'trend_avg' in assessment_data and assessment_data['trend_avg']:
                    assessment.trend_avg = assessment_data['trend_avg']
                
                if 'trend_bench' in assessment_data and assessment_data['trend_bench']:
                    assessment.trend_bench = assessment_data['trend_bench']
                
                db.session.add(assessment)
            db.session.commit()
            stats['ngo_risk_assessments'] = len(risk_data['ngo_risk_assessments'])
            print(f"      ✅ Added {stats['ngo_risk_assessments']} NGO risk assessments")
        
        # 12. Seed Tracker data
        print("   📊 Seeding tracker data...")
        tracker_data = sample_data.get('tracker', {})
        
        if 'project_trackers' in tracker_data:
            for tracker_data_item in tracker_data['project_trackers']:
                # Create tracker object without JSON fields first
                json_fields = ['team_user_ids', 'details']
                tracker_dict = {k: v for k, v in tracker_data_item.items() if k not in json_fields}
                tracker = ProjectTrackingInfo(**tracker_dict)
                
                # Set JSON fields directly since db.JSON handles Python objects automatically
                if 'team_user_ids' in tracker_data_item and tracker_data_item['team_user_ids']:
                    tracker.team_user_ids = tracker_data_item['team_user_ids']
                
                if 'details' in tracker_data_item and tracker_data_item['details']:
                    tracker.details = tracker_data_item['details']
                
                db.session.add(tracker)
            db.session.commit()
            stats['project_trackers'] = len(tracker_data['project_trackers'])
            print(f"      ✅ Added {stats['project_trackers']} project trackers")
        
        if 'tracker_milestones' in tracker_data:
            for milestone_data in tracker_data['tracker_milestones']:
                milestone = ProjectTimelineEntry(**milestone_data)
                db.session.add(milestone)
            db.session.commit()
            stats['tracker_milestones'] = len(tracker_data['tracker_milestones'])
            print(f"      ✅ Added {stats['tracker_milestones']} tracker milestones")
        
        print("   ✅ Database seeding completed successfully!")
        return stats
        
    except Exception as e:
        print(f"   ❌ Error during seeding: {e}")
        db.session.rollback()
        raise

def main():
    """Main function to run the database seeding process"""
    print("🚀 Starting SustainAlign Database Seeding Process")
    print("=" * 60)
    
    # Create Flask app and database context
    app = create_app()
    
    with app.app_context():
        try:
            # Clear existing data
            clear_database()
            print()
            
            # Seed with new data
            stats = seed_database()
            print()
            
            # Print summary
            print("📊 Seeding Summary:")
            print("-" * 30)
            total_records = sum(stats.values())
            for model, count in stats.items():
                print(f"   {model}: {count} records")
            print(f"   Total: {total_records} records")
            print()
            print("🎉 Database seeding completed successfully!")
            print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # Print dev credentials once. They are NOT persisted anywhere
            # else; capture from this output or re-run the seeder.
            print_credentials_table()
            
        except Exception as e:
            print(f"❌ Database seeding failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
