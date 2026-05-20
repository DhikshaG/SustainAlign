import { ROUTES } from '../lib/routes'

export const primaryNav = [
  { label: 'Features', href: ROUTES.features },
  { label: 'Pricing', href: ROUTES.pricing },
  { label: 'NGO Directory', href: ROUTES.ngos },
  { label: 'Case Studies', href: ROUTES.caseStudies },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'About', href: ROUTES.about },
]

export const footerNav = {
  product: [
    { label: 'Features', href: ROUTES.features },
    { label: 'Pricing', href: ROUTES.pricing },
    { label: 'Demo', href: ROUTES.demo },
    { label: 'NGO Directory', href: ROUTES.ngos },
  ],
  company: [
    { label: 'About', href: ROUTES.about },
    { label: 'Careers', href: ROUTES.careers },
    { label: 'Contact', href: ROUTES.contact },
    { label: 'Blog', href: ROUTES.blog },
  ],
  legal: [
    { label: 'Privacy Policy', href: ROUTES.privacy },
    { label: 'Terms & Conditions', href: ROUTES.terms },
  ],
  auth: [
    { label: 'Corporate Login', href: ROUTES.corporateLogin },
    { label: 'Corporate Sign Up', href: ROUTES.corporateSignup },
    { label: 'NGO Login', href: ROUTES.ngoLogin },
    { label: 'NGO Register', href: ROUTES.ngoSignup },
  ],
}
