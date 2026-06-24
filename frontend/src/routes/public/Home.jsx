import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { FeatureGrid } from '../../components/marketing/FeatureGrid'
import { StatsBand } from '../../components/marketing/StatsBand'
import { LogoCloud } from '../../components/marketing/LogoCloud'
import { CTASection } from '../../components/marketing/CTASection'
import { FAQ } from '../../components/marketing/FAQ'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { homeFeatures } from '../../data/features'
import { faqs } from '../../data/faqs'
import { ROUTES } from '../../lib/routes'

const stats = [
  { value: '500+', label: 'Verified NGOs' },
  { value: '₹500Cr+', label: 'CSR Funds Managed' },
  { value: '2M+', label: 'Beneficiaries Reached' },
  { value: '98%', label: 'Compliance Rate' },
]

const partnerLogos = ['Tata Steel', 'Infosys', 'HDFC Bank', 'Wipro', 'Reliance', 'Mahindra']

const steps = [
  { step: '1', title: 'Discover & Match', desc: 'AI-powered NGO matching based on your CSR focus areas, budget, and geography.' },
  { step: '2', title: 'Manage & Execute', desc: 'End-to-end project lifecycle with approvals, fund tracking, and field updates.' },
  { step: '3', title: 'Report & Comply', desc: 'Automated Section 135 compliance, impact dashboards, and board-ready reports.' },
]

export default function Home() {
  return (
    <>
      <Seo
        title="CSR & ESG Management Platform"
        description="Connect corporates with verified NGOs, automate Section 135 compliance, and deliver measurable social impact with AI."
        path="/"
      />
      <Hero
        badge="AI-Powered CSR Platform"
        title="Align CSR spend with real social impact"
        subtitle="SustainAlign connects corporates with verified NGOs, automates compliance, and delivers measurable outcomes — all in one platform."
        primaryCta={{ label: 'Book a Demo', href: ROUTES.demo }}
        secondaryCta={{ label: 'Explore Features', href: ROUTES.features }}
      />
      <StatsBand stats={stats} />
      <FeatureGrid
        title="Everything you need for CSR excellence"
        subtitle="From NGO discovery to board reporting — one platform for your entire CSR program."
        features={homeFeatures}
      />
      <Section bg="slate">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-600">Three steps from strategy to measurable impact</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <LogoCloud title="Trusted by leading organizations" logos={partnerLogos} />
      <FAQ title="Common questions" items={faqs.slice(0, 4)} />
      <CTASection
        title="Ready to transform your CSR program?"
        subtitle="Join leading corporates using SustainAlign to drive measurable social impact."
        ctaHref={ROUTES.demo}
      />
    </>
  )
}
