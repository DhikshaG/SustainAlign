import { Link } from 'react-router-dom'
import { Seo } from '../../components/seo/Seo'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { Button } from '../../components/ui/Button'
import { ROUTES } from '../../lib/routes'

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" description="The page you are looking for does not exist." />
      <Section bg="white" className="py-32">
        <Container size="narrow" className="text-center">
          <p className="text-6xl font-bold text-primary-600 mb-4">404</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
          <p className="text-slate-600 mb-8">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
          <Button as={Link} to={ROUTES.home}>Go Home</Button>
        </Container>
      </Section>
    </>
  )
}
