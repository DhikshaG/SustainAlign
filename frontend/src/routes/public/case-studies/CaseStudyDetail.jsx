import { Link, useParams } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Badge } from '../../../components/ui/Badge'
import { CTASection } from '../../../components/marketing/CTASection'
import { caseStudies } from '../../../data/sample-case-studies'
import { ROUTES } from '../../../lib/routes'
import NotFound from '../NotFound'

export default function CaseStudyDetail() {
  const { slug } = useParams()
  const cs = caseStudies.find((c) => c.slug === slug)
  if (!cs) return <NotFound />

  return (
    <>
      <Seo title={cs.title} description={`${cs.client} — ${cs.challenge}`} path={`/case-studies/${slug}`} />
      <Section bg="white" className="pt-12">
        <Container size="narrow">
          <Link to={ROUTES.caseStudies} className="text-sm text-primary-600 hover:underline mb-6 inline-block">
            &larr; All Case Studies
          </Link>
          <Badge variant="primary" className="mb-4">{cs.sector}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{cs.title}</h1>
          <p className="text-lg text-slate-500 mb-8">{cs.client}</p>
          <div className="grid grid-cols-3 gap-6 mb-10">
            {cs.outcomes.map((o) => (
              <div key={o.label} className="text-center p-4 bg-primary-50 rounded-lg">
                <p className="text-3xl font-bold text-primary-600">{o.metric}</p>
                <p className="text-sm text-slate-600 mt-1">{o.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-6 text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">The Challenge</h2>
              <p>{cs.challenge}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">The Solution</h2>
              <p>{cs.solution}</p>
            </div>
          </div>
          <blockquote className="mt-10 border-l-4 border-primary-500 pl-6 italic text-slate-700">
            &ldquo;{cs.quote}&rdquo;
            <footer className="mt-2 text-sm text-slate-500 not-italic">&mdash; {cs.author}</footer>
          </blockquote>
        </Container>
      </Section>
      <CTASection title="Ready for similar results?" ctaHref={ROUTES.demo} />
    </>
  )
}
