import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../../../components/seo/Seo'
import { Hero } from '../../../components/marketing/Hero'
import { Container } from '../../../components/ui/Container'
import { Section } from '../../../components/ui/Section'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { ngoSectors, ngoRegions } from '../../../data/sample-ngos'
import { fetchPublicNgos } from '../../../lib/ngo'
import { ROUTES } from '../../../lib/routes'
import { MapPin, Users } from 'lucide-react'

export default function NgoDirectory() {
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [sector, setSector] = useState('All')
  const [region, setRegion] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    fetchPublicNgos()
      .then((data) => { if (active) setNgos(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setNgos([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    return ngos.filter((n) => {
      if (sector !== 'All' && n.sector !== sector) return false
      if (region !== 'All' && n.region !== region) return false
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [ngos, sector, region, search])

  return (
    <>
      <Seo title="NGO Directory" description="Browse verified NGOs on SustainAlign. Filter by sector, region, and verification status." path="/ngos" />
      <Hero title="NGO Directory" subtitle="Discover verified NGOs aligned to your CSR focus areas." primaryCta={{ label: 'Register as NGO', href: ROUTES.ngoSignup }} secondaryCta={null} />
      <Section bg="white">
        <Container>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input placeholder="Search NGOs..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
            <Select value={sector} onChange={(e) => setSector(e.target.value)} className="sm:w-48">
              {ngoSectors.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
            </Select>
            <Select value={region} onChange={(e) => setRegion(e.target.value)} className="sm:w-48">
              {ngoRegions.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
            </Select>
          </div>
          {loading ? (
            <p className="text-slate-500">Loading NGOs...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500">No verified NGOs match your filters.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((ngo) => (
                <Link key={ngo.slug} to={ROUTES.ngoProfile(ngo.slug)}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">{ngo.name}</h3>
                      {ngo.verified && <Badge variant="verified">Verified</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{ngo.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ngo.region}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ngo.beneficiaries}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(ngo.focusAreas || []).slice(0, 3).map((a) => (
                        <Badge key={a} variant="default">{a}</Badge>
                      ))}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
