import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Container } from '../ui/Container'
import { Section } from '../ui/Section'
import { ROUTES } from '../../lib/routes'

export function PricingTable({ tiers }) {
  return (
    <Section bg="slate">
      <Container>
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative flex flex-col ${tier.highlighted ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-slate-900">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                {tier.period && <span className="text-slate-500">{tier.period}</span>}
              </div>
              <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                as={Link}
                to={tier.id === 'enterprise' ? ROUTES.contact : ROUTES.demo}
                variant={tier.highlighted ? 'primary' : 'secondary'}
                className="mt-8 w-full"
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
