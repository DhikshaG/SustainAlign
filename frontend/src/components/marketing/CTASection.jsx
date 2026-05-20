import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import { Section } from '../ui/Section'

export function CTASection({ title, subtitle, ctaLabel = 'Book a Demo', ctaHref }) {
  return (
    <Section bg="primary" className="text-center">
      <Container size="narrow">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
        {subtitle && <p className="text-lg text-primary-100 mb-8">{subtitle}</p>}
        <Button as={Link} to={ctaHref} variant="secondary" size="lg">
          {ctaLabel}
        </Button>
      </Container>
    </Section>
  )
}
