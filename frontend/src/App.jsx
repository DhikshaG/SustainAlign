import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicLayout } from './components/layout/PublicLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ROUTES } from './lib/routes'

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
import Dashboard from './routes/app/Dashboard'
import { RequireAuth } from './components/RequireAuth'

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

          <Route path={ROUTES.dashboard} element={<RequireAuth><Dashboard /></RequireAuth>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
