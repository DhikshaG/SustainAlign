import { Container } from '../ui/Container'
import { Section } from '../ui/Section'

export function LogoCloud({ title, logos }) {
  return (
    <Section bg="slate" className="py-12">
      <Container>
        {title && (
          <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-8">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((logo) => (
            <span key={logo} className="text-lg font-semibold text-slate-400">
              {logo}
            </span>
          ))}
        </div>
      </Container>
    </Section>
  )
}
