import { Container } from '../ui/Container'

export function StatsBand({ stats }) {
  return (
    <section className="bg-primary-600 py-12">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-primary-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
