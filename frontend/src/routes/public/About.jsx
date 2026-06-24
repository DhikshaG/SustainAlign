import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'

const values = [
  { title: 'Impact First', desc: 'Every feature we build is measured by the social outcomes it enables.' },
  { title: 'Transparency', desc: 'Open data flows between corporates, NGOs, and beneficiaries build trust.' },
  { title: 'Innovation', desc: 'AI and automation remove friction so teams focus on strategy, not spreadsheets.' },
  { title: 'Inclusion', desc: 'We design for every role — from field officers to board members.' },
]

const timeline = [
  { year: '2022', event: 'Founded with a mission to digitize CSR in India' },
  { year: '2023', event: 'Launched NGO marketplace with 100+ verified partners' },
  { year: '2024', event: 'Introduced AI Copilot for matching and impact evaluation' },
  { year: '2025', event: 'Expanded to ESG reporting with BRSR integration' },
  { year: '2026', event: '500+ NGOs, ₹500Cr+ funds managed on platform' },
]

export default function About() {
  return (
    <>
      <Seo title="About Us" description="Learn about SustainAlign's mission to transform CSR and ESG management in India." path="/about" />
      <Hero
        title="Building the future of CSR"
        subtitle="We believe technology can unlock the full potential of corporate social responsibility — making every rupee count toward measurable impact."
        primaryCta={{ label: 'Join Our Team', href: '/careers' }}
        secondaryCta={{ label: 'Contact Us', href: '/contact' }}
      />
      <Section bg="white">
        <Container size="narrow">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-slate-600 leading-relaxed text-center">
            SustainAlign exists to bridge the gap between corporate CSR intent and on-ground social impact.
            We provide the infrastructure — from NGO discovery to compliance automation — that lets CSR teams
            focus on what matters: creating lasting change in communities across India.
          </p>
        </Container>
      </Section>
      <Section bg="slate">
        <Container>
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <Card key={v.title}>
                <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600">{v.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      <Section bg="white">
        <Container size="narrow">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Our Journey</h2>
          <div className="space-y-6">
            {timeline.map((t) => (
              <div key={t.year} className="flex gap-4">
                <span className="font-bold text-primary-600 w-16 shrink-0">{t.year}</span>
                <p className="text-slate-600">{t.event}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
