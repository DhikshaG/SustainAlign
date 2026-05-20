import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { FeatureGrid } from '../../components/marketing/FeatureGrid'
import { CTASection } from '../../components/marketing/CTASection'
import { platformModules } from '../../data/features'
import { ROUTES } from '../../lib/routes'

export default function Features() {
  return (
    <>
      <Seo
        title="Features"
        description="Explore SustainAlign's 12 core modules — from NGO marketplace to AI Copilot, compliance automation, and ESG reporting."
        path="/features"
      />
      <Hero
        title="12 modules. One platform."
        subtitle="Everything your CSR, ESG, and compliance teams need — from NGO discovery to board-ready reporting."
        primaryCta={{ label: 'Book a Demo', href: ROUTES.demo }}
        secondaryCta={null}
      />
      <FeatureGrid features={platformModules} columns={3} />
      <CTASection
        title="See SustainAlign in action"
        subtitle="Schedule a personalized demo with our team."
        ctaHref={ROUTES.demo}
      />
    </>
  )
}
