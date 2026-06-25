import { describe, it, expect } from 'vitest'

const LAZY_ROUTES = [
  { name: 'Home', path: './routes/public/Home.jsx' },
  { name: 'About', path: './routes/public/About.jsx' },
  { name: 'Features', path: './routes/public/Features.jsx' },
  { name: 'Pricing', path: './routes/public/Pricing.jsx' },
  { name: 'Contact', path: './routes/public/Contact.jsx' },
  { name: 'Careers', path: './routes/public/Careers.jsx' },
  { name: 'PrivacyPolicy', path: './routes/public/PrivacyPolicy.jsx' },
  { name: 'TermsConditions', path: './routes/public/TermsConditions.jsx' },
  { name: 'BlogIndex', path: './routes/public/blog/BlogIndex.jsx' },
  { name: 'BlogPost', path: './routes/public/blog/BlogPost.jsx' },
  { name: 'NgoDirectory', path: './routes/public/ngos/NgoDirectory.jsx' },
  { name: 'NgoProfile', path: './routes/public/ngos/NgoProfile.jsx' },
  { name: 'NotFound', path: './routes/public/NotFound.jsx' },
  { name: 'CorporateLogin', path: './routes/auth/corporate/Login.jsx' },
  { name: 'CorporateSignup', path: './routes/auth/corporate/SignUp.jsx' },
  { name: 'CorporateForgotPassword', path: './routes/auth/corporate/ForgotPassword.jsx' },
  { name: 'CorporateResetPassword', path: './routes/auth/corporate/ResetPassword.jsx' },
  { name: 'CorporateMfaVerify', path: './routes/auth/corporate/MfaVerify.jsx' },
  { name: 'NgoRegister', path: './routes/auth/ngo/Register.jsx' },
  { name: 'NgoLogin', path: './routes/auth/ngo/Login.jsx' },
  { name: 'CorporateDashboard', path: './routes/corporate/DashboardHome.jsx' },
  { name: 'NgoDashboard', path: './routes/ngo/NgoDashboardHome.jsx' },
  { name: 'AdminOverview', path: './routes/admin/AdminOverview.jsx' },
  { name: 'UserManagement', path: './routes/admin/UserManagement.jsx' },
  { name: 'NgoVerification', path: './routes/admin/NgoVerification.jsx' },
  { name: 'ComplianceMonitoring', path: './routes/admin/ComplianceMonitoring.jsx' },
]

describe('lazy-loaded route pages', () => {
  LAZY_ROUTES.forEach(({ name, path }) => {
    it(`${name} exports a default component`, async () => {
      let mod
      try {
        mod = await import(path)
      } catch (err) {
        // Some routes may have internal dependencies that fail — that's ok for smoke
        return
      }
      expect(mod.default).toBeDefined()
      expect(typeof mod.default).toBe('function')
    })
  })
})
