import { lazy, Suspense } from 'react'
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

const Home = lazy(() => import('./routes/public/Home'))
const About = lazy(() => import('./routes/public/About'))
const Features = lazy(() => import('./routes/public/Features'))
const Pricing = lazy(() => import('./routes/public/Pricing'))
const Contact = lazy(() => import('./routes/public/Contact'))
const DemoBooking = lazy(() => import('./routes/public/DemoBooking'))
const Careers = lazy(() => import('./routes/public/Careers'))
const PrivacyPolicy = lazy(() => import('./routes/public/PrivacyPolicy'))
const TermsConditions = lazy(() => import('./routes/public/TermsConditions'))
const BlogIndex = lazy(() => import('./routes/public/blog/BlogIndex'))
const BlogPost = lazy(() => import('./routes/public/blog/BlogPost'))
const NgoDirectory = lazy(() => import('./routes/public/ngos/NgoDirectory'))
const NgoProfile = lazy(() => import('./routes/public/ngos/NgoProfile'))
const CaseStudiesIndex = lazy(() => import('./routes/public/case-studies/CaseStudiesIndex'))
const CaseStudyDetail = lazy(() => import('./routes/public/case-studies/CaseStudyDetail'))
const NotFound = lazy(() => import('./routes/public/NotFound'))

const CorporateSignUp = lazy(() => import('./routes/auth/corporate/SignUp'))
const CorporateLogin = lazy(() => import('./routes/auth/corporate/Login'))
const ForgotPassword = lazy(() => import('./routes/auth/corporate/ForgotPassword'))
const ResetPassword = lazy(() => import('./routes/auth/corporate/ResetPassword'))
const MfaVerify = lazy(() => import('./routes/auth/corporate/MfaVerify'))
const InviteTeam = lazy(() => import('./routes/auth/corporate/InviteTeam'))
const NgoRegister = lazy(() => import('./routes/auth/ngo/Register'))
const VerificationUpload = lazy(() => import('./routes/auth/ngo/VerificationUpload'))
const NgoLogin = lazy(() => import('./routes/auth/ngo/Login'))

const DashboardHome = lazy(() => import('./routes/corporate/DashboardHome'))
const NgoDiscovery = lazy(() => import('./routes/corporate/NgoDiscovery'))
const CorporateNgoProfile = lazy(() => import('./routes/corporate/CorporateNgoProfile'))
const ProjectsIndex = lazy(() => import('./routes/corporate/ProjectsIndex'))
const ProjectDetail = lazy(() => import('./routes/corporate/ProjectDetail'))
const ComplianceDashboard = lazy(() => import('./routes/corporate/ComplianceDashboard'))
const ReportingAnalytics = lazy(() => import('./routes/corporate/ReportingAnalytics'))
const ReportGenerator = lazy(() => import('./routes/corporate/ReportGenerator'))
const AiCopilot = lazy(() => import('./routes/corporate/AiCopilot'))
const FundAllocation = lazy(() => import('./routes/corporate/FundAllocation'))
const FundIntelligence = lazy(() => import('./routes/corporate/FundIntelligence'))
const EsgDashboard = lazy(() => import('./routes/corporate/EsgDashboard'))
const VolunteerManagement = lazy(() => import('./routes/corporate/VolunteerManagement'))
const VolunteerEventDetail = lazy(() => import('./routes/corporate/VolunteerEventDetail'))
const VolunteerCheckIn = lazy(() => import('./routes/corporate/VolunteerCheckIn'))
const ApprovalsPage = lazy(() => import('./routes/corporate/ApprovalsPage'))
const DocumentVault = lazy(() => import('./routes/corporate/DocumentVault'))
const CommunicationCenter = lazy(() => import('./routes/corporate/CommunicationCenter'))
const AuditTrail = lazy(() => import('./routes/corporate/AuditTrail'))
const SettingsPage = lazy(() => import('./routes/corporate/SettingsPage'))

const NgoDashboardHome = lazy(() => import('./routes/ngo/NgoDashboardHome'))
const ProfileManagement = lazy(() => import('./routes/ngo/ProfileManagement'))
const NgoProjectsIndex = lazy(() => import('./routes/ngo/NgoProjectsIndex'))
const NgoProjectDetail = lazy(() => import('./routes/ngo/NgoProjectDetail'))
const NgoPartnershipInbox = lazy(() => import('./routes/ngo/NgoPartnershipInbox'))
const NgoCommunicationCenter = lazy(() => import('./routes/ngo/NgoCommunicationCenter'))
const NgoSubmissions = lazy(() => import('./routes/ngo/NgoSubmissions'))
const FinancialReporting = lazy(() => import('./routes/ngo/FinancialReporting'))
const BeneficiaryTracking = lazy(() => import('./routes/ngo/BeneficiaryTracking'))

const AdminOverview = lazy(() => import('./routes/admin/AdminOverview'))
const UserManagement = lazy(() => import('./routes/admin/UserManagement'))
const NgoVerification = lazy(() => import('./routes/admin/NgoVerification'))
const FraudMonitoring = lazy(() => import('./routes/admin/FraudMonitoring'))
const PlatformAnalytics = lazy(() => import('./routes/admin/PlatformAnalytics'))
const SupportTickets = lazy(() => import('./routes/admin/SupportTickets'))
const ComplianceMonitoring = lazy(() => import('./routes/admin/ComplianceMonitoring'))
const AiMonitoringPage = lazy(() => import('./routes/admin/AiMonitoringPage'))
const ContentModeration = lazy(() => import('./routes/admin/ContentModeration'))

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
              <Route path="volunteers/check-in/:token" element={<VolunteerCheckIn />} />
              <Route path="volunteers/:id" element={<VolunteerEventDetail />} />
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
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
