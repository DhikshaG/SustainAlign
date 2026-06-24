import { Container } from '../ui/Container'
import { Section } from '../ui/Section'

export function FeatureGrid({ title, subtitle, features, columns = 3 }) {
  const colClass = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
  return (
    <Section bg="white">
      <Container>
        {(title || subtitle) && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            {title && <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{title}</h2>}
            {subtitle && <p className="text-lg text-slate-600">{subtitle}</p>}
          </div>
        )}
        <div className={`grid gap-8 ${colClass[columns] || colClass[3]}`}>
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.id || feature.title} className="rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                {Icon && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}
