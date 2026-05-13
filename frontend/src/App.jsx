import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import DashboardPage from './pages/dashboard/dashboard.jsx'
import LoginPage from './pages/auth/login.jsx'
import SignupPage from './pages/auth/signup.jsx'
import ForgotPasswordPage from './pages/auth/forgot-password.jsx'
import ProfileSetupPage from './pages/auth/profile-setup.jsx'
import AppLayout from './layouts/AppLayout.jsx'

// Profile Setup pages
import CompanyDetailsPage from './pages/profile/company-details/company-details.jsx'

// Discovery pages
import ProjectAddPage from './pages/discovery/project-add/project-add.jsx'
import ProjectCardsPage from './pages/discovery/project-cards/project-cards.jsx'

// Alignment & Evaluation
import AiMatchingPage from './pages/alignment/ai-matching/ai-matching.jsx'
import ComparisonMatrixPage from './pages/alignment/comparison-matrix/comparison-matrix.jsx'
import RiskScoringPage from './pages/alignment/risk-scoring/risk-scoring.jsx'

// Decision Support
import RecommendationRationalePage from './pages/decision/rationale/rationale.jsx'
import ApprovalWorkflowPage from './pages/decision/approval/approval.jsx'

// Monitoring & Tracking
import ProjectTrackerPage from './pages/monitoring/tracker/tracker.jsx'
import ImpactDashboardPage from './pages/monitoring/impact/impact.jsx'
import MonitoringAlertsPage from './pages/monitoring/alerts/alerts.jsx'

// Reporting & Compliance
import ReportGeneratorPage from './pages/reporting/generator/generator.jsx'
import AuditTrailPage from './pages/reporting/audit-trail/audit-trail.jsx'

// Marketplace
import NgoDashboardPage from './pages/marketplace/ngo/ngo.jsx'
import MatchingEnginePage from './pages/marketplace/matching/matching.jsx'
import CollaborationToolsPage from './pages/marketplace/collaboration/collaboration.jsx'
import NgoOnboardingPage from './pages/marketplace/ngo-add/ngo-onboarding.jsx'

// Settings & Admin
import UserManagementPage from './pages/settings/users/users.jsx'
import AgentControlsPage from './pages/settings/agents/agents.jsx'
import IntegrationSetupPage from './pages/settings/integrations/integrations.jsx'
import ApiManagementPage from './pages/settings/apis/apis.jsx'

// Help & Support
import AiChatAssistantPage from './pages/support/chat/chat.jsx'
import FaqPage from './pages/support/faq/faq.jsx'
import FeedbackPage from './pages/support/feedback/feedback.jsx'

import { isAuthenticated } from './lib/auth'
import LogoutPage from './pages/auth/Logout.jsx'
import RouteGuard, { RequireRole } from './components/RouteGuard.jsx'

function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

// Custom layout component that conditionally renders header
function ConditionalAppLayout() {
  // Check if user is a new corporate user
  const isNewCorporateUser = localStorage.getItem('newCorporateUser') === 'true'
  
  if (isNewCorporateUser) {
    // For new corporate users, render without header
    return (
      <div className="min-h-screen font-sans overflow-x-hidden">
        <Outlet />
      </div>
    )
  }
  
  // For existing users, render with full header
  return <AppLayout />
}

export default function App() {
  return (
    <Routes>
      {/* 🔐 Authentication & Access */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      {/* NGO onboarding (pre-access) */}
      <Route path="/ngo-onboarding" element={<NgoOnboardingPage />} />

      {/* App routes with conditional header rendering */}
      <Route element={<RequireAuth />}>
        <Route element={<RouteGuard><ConditionalAppLayout /></RouteGuard>}>
        {/* 🏠 Corporate Dashboard (Main Landing) */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 🏗️ Corporate Profile Setup */}
        <Route path="/profile/company-details" element={<CompanyDetailsPage />} />
        <Route path="/profile/company-showcase" element={<CompanyDetailsPage />} />

        {/* 🔎 Project Discovery Page (Agent 1) */}
        <Route path="/discovery/add" element={<ProjectAddPage />} />
        <Route path="/discovery/cards" element={<ProjectCardsPage />} />

        {/* 🎯 Alignment & Evaluation Page (Agents 2 & 3) — corporate/admin only */}
        <Route element={<RequireRole roles={['corporate', 'admin']} />}>
          <Route path="/alignment/matching" element={<AiMatchingPage />} />
          <Route path="/alignment/comparison-matrix" element={<ComparisonMatrixPage />} />
          <Route path="/alignment/risk" element={<RiskScoringPage />} />
        </Route>

        {/* 🧑‍⚖️ Decision Support Page (Agent 4) — corporate/admin only */}
        <Route element={<RequireRole roles={['corporate', 'admin']} />}>
          <Route path="/decision/rationale" element={<RecommendationRationalePage />} />
          <Route path="/decision/approval" element={<ApprovalWorkflowPage />} />
        </Route>

        {/* 📊 Monitoring & Tracking Page (Agent 5) */}
        <Route path="/monitoring/tracker" element={<ProjectTrackerPage />} />
        <Route path="/monitoring/impact" element={<ImpactDashboardPage />} />
        <Route path="/monitoring/alerts" element={<MonitoringAlertsPage />} />

        {/* 📑 Reporting & Compliance Page (Agent 6) — corporate/admin only */}
        <Route element={<RequireRole roles={['corporate', 'admin']} />}>
          <Route path="/reporting/generator" element={<ReportGeneratorPage />} />
          <Route path="/reporting/audit-trail" element={<AuditTrailPage />} />
        </Route>

        {/* 📂 CSR/ESG Marketplace (Future) */}
        <Route path="/marketplace/ngo" element={<NgoDashboardPage />} />
        <Route element={<RequireRole roles={['corporate', 'admin']} />}>
          <Route path="/marketplace/matching" element={<MatchingEnginePage />} />
          <Route path="/marketplace/collaboration" element={<CollaborationToolsPage />} />
          {/* Aliases for the requested marketplace breakdown */}
          <Route path="/marketplace/projects" element={<CollaborationToolsPage />} />
        </Route>

        {/* ⚙️ Settings & Admin Panel — admin only */}
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/settings/users" element={<UserManagementPage />} />
          <Route path="/settings/agents" element={<AgentControlsPage />} />
          <Route path="/settings/integrations" element={<IntegrationSetupPage />} />
          <Route path="/settings/apis" element={<ApiManagementPage />} />
          {/* Aliases to match requested naming */}
          <Route path="/settings/system" element={<IntegrationSetupPage />} />
          <Route path="/settings/data" element={<ApiManagementPage />} />
        </Route>

        {/* ❓ Help & Support */}
        <Route path="/support/chat" element={<AiChatAssistantPage />} />
        <Route path="/support/faq" element={<FaqPage />} />
        <Route path="/support/feedback" element={<FeedbackPage />} />
        {/* Alias for Knowledge Base */}
        <Route path="/support/knowledge-base" element={<FaqPage />} />
        </Route>
      </Route>

      {/* explicit logout route */}
      <Route path="/logout" element={<LogoutPage />} />
    </Routes>
  )
}
