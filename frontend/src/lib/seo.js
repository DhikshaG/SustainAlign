export const SITE_NAME = 'SustainAlign'
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://sustainalign.com'
export const DEFAULT_DESCRIPTION =
  'SustainAlign is the AI-powered CSR and ESG management platform that connects corporates with verified NGOs, automates Section 135 compliance, and delivers measurable impact.'

export function buildMeta({ title, description, path = '' }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — CSR & ESG Management Platform`
  const url = `${SITE_URL}${path}`
  return {
    title: fullTitle,
    description: description || DEFAULT_DESCRIPTION,
    url,
    ogImage: `${SITE_URL}/og-default.png`,
  }
}
