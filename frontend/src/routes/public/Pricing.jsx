import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { PricingTable } from '../../components/marketing/PricingTable'
import { FAQ } from '../../components/marketing/FAQ'
import { CTASection } from '../../components/marketing/CTASection'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { pricingTiers, pricingComparison } from '../../data/pricing'
import { faqs } from '../../data/faqs'
import { ROUTES } from '../../lib/routes'
import { Check, X } from 'lucide-react'

function ComparisonCell({ value }) {
  if (value === true) return <Check className="h-5 w-5 text-primary-600 mx-auto" />
  if (value === false) return <X className="h-5 w-5 text-slate-300 mx-auto" />
  return <span className="text-sm text-slate-600">{value}</span>
}

export default function Pricing() {
  return (
    <>
      <Seo title="Pricing" description="Flexible pricing plans for corporates of all sizes. Starter, Growth, and Enterprise tiers." path="/pricing" />
      <Hero
        title="Simple, transparent pricing"
        subtitle="Choose the plan that fits your CSR program. All plans include NGO marketplace access and compliance tracking."
        primaryCta={{ label: 'Book a Demo', href: ROUTES.demo }}
        secondaryCta={{ label: 'Contact Sales', href: ROUTES.contact }}
      />
      <PricingTable tiers={pricingTiers} />
      <Section bg="white">
        <Container>
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-4 font-medium text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-900">Starter</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-900">Growth</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {pricingComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-600">{row.feature}</td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.starter} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.growth} /></td>
                    <td className="py-3 px-4 text-center"><ComparisonCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>
      <FAQ title="Pricing FAQ" items={faqs.slice(0, 3)} />
      <CTASection title="Not sure which plan is right?" subtitle="Talk to our team for a custom recommendation." ctaLabel="Contact Sales" ctaHref={ROUTES.contact} />
    </>
  )
}
