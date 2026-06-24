import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import { ROUTES } from '../../lib/routes'

export function Hero({
  title,
  subtitle,
  primaryCta = { label: 'Book a Demo', href: ROUTES.demo },
  secondaryCta = { label: 'Explore Features', href: ROUTES.features },
  badge,
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          {badge && (
            <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 mb-6">
              {badge}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {primaryCta && (
                <Button as={Link} to={primaryCta.href} size="lg">
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button as={Link} to={secondaryCta.href} variant="secondary" size="lg">
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
