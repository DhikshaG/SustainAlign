import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { CorporateLayout } from './components/layout/CorporateLayout'
import { NgoLayout } from './components/layout/NgoLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ROUTES } from './lib/routes'
import { RequireAuth } from './components/RequireAuth'
import { RequireRole } from './components/RequireRole'
import { CORPORATE_ROLES } from './lib/corporate/roles'
import { NGO_ROLES } from './lib/ngo/roles'
import { ADMIN_ROLES } from './lib/admin/roles'

import Home from './routes/public/Home'
import About from './routes/public/About'
import Features from './routes/public/Features'
import Pricing from './routes/public/Pricing'
import Contact from './routes/public/Contact'
import DemoBooking from './routes/public/DemoBooking'
import Careers from './routes/public/Careers'
import PrivacyPolicy from './routes/public/PrivacyPolicy'
import TermsConditions from './routes/public/TermsConditions'
import BlogIndex from './routes/public/blog/BlogIndex'
import BlogPost from './routes/public/blog/BlogPost'
import NgoDirectory from './routes/public/ngos/NgoDirectory'
import NgoProfile from './routes/public/ngos/NgoProfile'
import CaseStudiesIndex from './routes/public/case-studies/CaseStudiesIndex'
import CaseStudyDetail from './routes/public/case-studies/CaseStudyDetail'
import NotFound from './routes/public/NotFound'

import CorporateSignUp from './routes/auth/corporate/SignUp'
import CorporateLogin from './routes/auth/corporate/Login'
import ForgotPassword from './routes/auth/corporate/ForgotPassword'
import ResetPassword from './routes/auth/corporate/ResetPassword'
import MfaVerify from './routes/auth/corporate/MfaVerify'
import InviteTeam from './routes/auth/corporate/InviteTeam'
import NgoRegister from './routes/auth/ngo/Register'
import VerificationUpload from './routes/auth/ngo/VerificationUpload'
import NgoLogin from './routes/auth/ngo/Login'

import DashboardHome from './routes/corporate/DashboardHome'
import NgoDiscovery from './routes/corporate/NgoDiscovery'
import CorporateNgoProfile from './routes/corporate/CorporateNgoProfile'
import ProjectsIndex from './routes/corporate/ProjectsIndex'
import ProjectDetail from './routes/corporate/ProjectDetail'
import ComplianceDashboard from './routes/corporate/ComplianceDashboard'
import ReportingAnalytics from './routes/corporate/ReportingAnalytics'
import ReportGenerator from './routes/corporate/ReportGenerator'
import AiCopilot from './routes/corporate/AiCopilot'
import FundAllocation from './routes/corporate/FundAllocation'
import FundIntelligence from './routes/corporate/FundIntelligence'
import EsgDashboard from './routes/corporate/EsgDashboard'
import VolunteerManagement from './routes/corporate/VolunteerManagement'
import ApprovalsPage from './routes/corporate/ApprovalsPage'
import DocumentVault from './routes/corporate/DocumentVault'
import CommunicationCenter from './routes/corporate/CommunicationCenter'
import AuditTrail from './routes/corporate/AuditTrail'
import SettingsPage from './routes/corporate/SettingsPage'

import NgoDashboardHome from './routes/ngo/NgoDashboardHome'
import ProfileManagement from './routes/ngo/ProfileManagement'
import NgoProjectsIndex from './routes/ngo/NgoProjectsIndex'
import NgoProjectDetail from './routes/ngo/NgoProjectDetail'
import NgoPartnershipInbox from './routes/ngo/NgoPartnershipInbox'
import NgoCommunicationCenter from './routes/ngo/NgoCommunicationCenter'
import NgoSubmissions from './routes/ngo/NgoSubmissions'
import FinancialReporting from './routes/ngo/FinancialReporting'
import BeneficiaryTracking from './routes/ngo/BeneficiaryTracking'

import AdminOverview from './routes/admin/AdminOverview'
import UserManagement from './routes/admin/UserManagement'
import NgoVerification from './routes/admin/NgoVerification'
import FraudMonitoring from './routes/admin/FraudMonitoring'
import PlatformAnalytics from './routes/admin/PlatformAnalytics'
import SupportTickets from './routes/admin/SupportTickets'
import ComplianceMonitoring from './routes/admin/ComplianceMonitoring'
import AiMonitoringPage from './routes/admin/AiMonitoringPage'
import ContentModeration from './routes/admin/ContentModeration'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path={ROUTES.about} element={<About />} />
            <Route path={ROUTES.features} element={<Features />} />
            <Route path={ROUTES.pricing} element={<Pricing />} />
            <Route path={ROUTES.contact} element={<Contact />} />
            <Route path={ROUTES.demo} element={<DemoBooking />} />
            <Route path={ROUTES.careers} element={<Careers />} />
            <Route path={ROUTES.privacy} element={<PrivacyPolicy />} />
            <Route path={ROUTES.terms} element={<TermsConditions />} />
            <Route path={ROUTES.blog} element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path={ROUTES.ngos} element={<NgoDirectory />} />
            <Route path="/ngos/:slug" element={<NgoProfile />} />
            <Route path={ROUTES.caseStudies} element={<CaseStudiesIndex />} />
            <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path={ROUTES.corporateSignup} element={<CorporateSignUp />} />
            <Route path={ROUTES.corporateLogin} element={<CorporateLogin />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
            <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
            <Route path={ROUTES.mfa} element={<MfaVerify />} />
            <Route path={ROUTES.inviteTeam} element={<InviteTeam />} />
            <Route path={ROUTES.ngoSignup} element={<NgoRegister />} />
            <Route path={ROUTES.ngoVerification} element={<VerificationUpload />} />
            <Route path={ROUTES.ngoLogin} element={<NgoLogin />} />
          </Route>

          <Route
            path={ROUTES.dashboard}
            element={
              <RequireAuth>
                <RequireRole roles={CORPORATE_ROLES}>
                  <CorporateLayout />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="esg" element={<EsgDashboard />} />
            <Route path="discovery" element={<NgoDiscovery />} />
            <Route path="ngos/:slug" element={<CorporateNgoProfile />} />
            <Route path="projects" element={<ProjectsIndex />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="compliance" element={<ComplianceDashboard />} />
            <Route path="reporting" element={<ReportingAnalytics />} />
            <Route path="reports/generate" element={<ReportGenerator />} />
            <Route path="copilot" element={<AiCopilot />} />
            <Route path="funds" element={<FundAllocation />} />
            <Route path="funds/intelligence" element={<FundIntelligence />} />
            <Route path="volunteers" element={<VolunteerManagement />} />
            <Route path="documents" element={<DocumentVault />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="communications" element={<CommunicationCenter />} />
            <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/ngo"
            element={
              <RequireAuth>
                <RequireRole roles={NGO_ROLES}>
                  <NgoLayout />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route index element={<NgoDashboardHome />} />
            <Route path="profile" element={<ProfileManagement />} />
            <Route path="projects" element={<NgoProjectsIndex />} />
            <Route path="projects/:id" element={<NgoProjectDetail />} />
            <Route path="partnership-requests" element={<NgoPartnershipInbox />} />
            <Route path="communications" element={<NgoCommunicationCenter />} />
            <Route path="submissions" element={<NgoSubmissions />} />
            <Route path="finance" element={<FinancialReporting />} />
            <Route path="beneficiaries" element={<BeneficiaryTracking />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminLayout />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="ngo-verification" element={<NgoVerification />} />
            <Route path="fraud" element={<FraudMonitoring />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="compliance" element={<ComplianceMonitoring />} />
            <Route path="ai-monitoring" element={<AiMonitoringPage />} />
            <Route path="content" element={<ContentModeration />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
