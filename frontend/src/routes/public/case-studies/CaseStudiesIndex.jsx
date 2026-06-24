import { Link } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Hero } from '../../../components/marketing/Hero'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { caseStudies } from '../../../data/sample-case-studies'
import { ROUTES } from '../../../lib/routes'

export default function CaseStudiesIndex() {
  return (
    <>
      <Seo title="Case Studies" description="See how leading corporates use SustainAlign to drive measurable CSR impact." path="/case-studies" />
      <Hero title="Customer Success Stories" subtitle="Real outcomes from corporates using SustainAlign to transform their CSR programs." primaryCta={{ label: 'Book a Demo', href: ROUTES.demo }} secondaryCta={null} />
      <Section bg="white">
        <Container>
          <div className="grid sm:grid-cols-2 gap-8">
            {caseStudies.map((cs) => (
              <Link key={cs.slug} to={ROUTES.caseStudy(cs.slug)}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <Badge variant="primary" className="mb-3">{cs.sector}</Badge>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{cs.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{cs.client}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {cs.outcomes.map((o) => (
                      <div key={o.label} className="text-center">
                        <p className="text-2xl font-bold text-primary-600">{o.metric}</p>
                        <p className="text-xs text-slate-500">{o.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
