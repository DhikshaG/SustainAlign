import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { fetchPublicNgo } from '../../../lib/ngo'
import { ROUTES } from '../../../lib/routes'
import NotFound from '../NotFound'
import { MapPin, Users, FolderKanban } from 'lucide-react'

export default function NgoProfile() {
  const { slug } = useParams()
  const [ngo, setNgo] = useState(null)
  const [status, setStatus] = useState({ slug: null, kind: 'loading' })

  useEffect(() => {
    let active = true
    fetchPublicNgo(slug)
      .then((data) => {
        if (active) {
          setNgo(data)
          setStatus({ slug, kind: 'ok' })
        }
      })
      .catch(() => {
        if (active) {
          setNgo(null)
          setStatus({ slug, kind: 'notfound' })
        }
      })
    return () => { active = false }
  }, [slug])

  const loading = status.slug !== slug
  const notFound = status.slug === slug && status.kind === 'notfound'

  if (loading) {
    return <Section bg="white" className="pt-12"><Container><p className="text-slate-500">Loading...</p></Container></Section>
  }
  if (notFound || !ngo) return <NotFound />

  return (
    <>
      <Seo title={ngo.name} description={ngo.description} path={`/ngos/${slug}`} />
      <Section bg="white" className="pt-12">
        <Container>
          <Link to={ROUTES.ngos} className="text-sm text-primary-600 hover:underline mb-6 inline-block">
            &larr; Back to Directory
          </Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">{ngo.name}</h1>
                {ngo.verified && <Badge variant="verified">Verified</Badge>}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">{ngo.description}</p>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Focus Areas</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {(ngo.focusAreas || []).map((a) => <Badge key={a} variant="primary">{a}</Badge>)}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Active Projects</h2>
              <p className="text-sm text-slate-500">Project details available after corporate login.</p>
            </div>
            <div>
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    {ngo.region}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-primary-600" />
                    {ngo.beneficiaries} beneficiaries
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FolderKanban className="h-4 w-4 text-primary-600" />
                    {ngo.projects} active projects
                  </div>
                  <Badge>{ngo.sector}</Badge>
                  <Button as={Link} to={ROUTES.corporateLogin} className="w-full mt-4">
                    Match with this NGO
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
