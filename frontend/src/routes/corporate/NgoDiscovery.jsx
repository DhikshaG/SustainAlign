import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Heart, GitCompare, Mail, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { FilterPanel, FilterField } from '../../components/corporate/FilterPanel'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/corporate/EmptyState'
import { corporateNgos, discoveryFilters } from '../../data/corporate/ngos'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { Search } from 'lucide-react'

const SAVED_KEY = 'savedNgos'

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')
  } catch {
    return []
  }
}

export default function NgoDiscovery() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('All')
  const [sdg, setSdg] = useState('all')
  const [theme, setTheme] = useState('All')
  const [budget, setBudget] = useState('All')
  const [size, setSize] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [tagFilter, setTagFilter] = useState('')
  const [saved, setSaved] = useState(getSaved)
  const [compare, setCompare] = useState([])
  const [contactNgo, setContactNgo] = useState(null)
  const [toast, setToast] = useState(null)

  const aiRecommended = corporateNgos.filter((n) => n.aiRecommended)

  const filtered = useMemo(() => {
    return corporateNgos.filter((ngo) => {
      if (search && !`${ngo.name} ${ngo.description}`.toLowerCase().includes(search.toLowerCase())) return false
      if (location !== 'All' && ngo.region !== location) return false
      if (sdg !== 'all' && !ngo.sdgs.includes(Number(sdg))) return false
      if (theme !== 'All' && !ngo.csrThemes.includes(theme)) return false
      if (budget !== 'All' && ngo.budgetRange !== budget) return false
      if (size !== 'all' && ngo.orgSize !== size) return false
      if (verifiedOnly && !ngo.verified) return false
      if (tagFilter === 'sdg-4' && !ngo.sdgs.includes(4)) return false
      if (tagFilter === 'sdg-13' && !ngo.sdgs.includes(13)) return false
      if (tagFilter === 'climate' && !ngo.csrThemes.includes('Environment')) return false
      return true
    })
  }, [search, location, sdg, theme, budget, size, verifiedOnly, tagFilter])

  function toggleSave(slug) {
    const next = saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug]
    setSaved(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  function toggleCompare(slug) {
    setCompare((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 3) return prev
      return [...prev, slug]
    })
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const compareNgos = corporateNgos.filter((n) => compare.includes(n.slug))

  return (
    <>
      <PageHeader
        title="NGO Discovery"
        description="Search, filter, and compare verified implementing agencies for your CSR programs."
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* AI recommendations */}
      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-white border-primary-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-slate-900">AI Recommendations</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {aiRecommended.map((ngo) => (
            <Link
              key={ngo.slug}
              to={CORPORATE_ROUTES.ngoProfile(ngo.slug)}
              className="flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm hover:border-primary-400"
            >
              <span className="font-medium text-slate-900">{ngo.name}</span>
              <Badge variant="verified">{ngo.rating?.toFixed(1)}★</Badge>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        <FilterPanel className="lg:col-span-1 h-fit">
          <FilterField label="Location">
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
              {discoveryFilters.locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="SDG">
            <Select value={sdg} onChange={(e) => setSdg(e.target.value)}>
              {discoveryFilters.sdgs.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Impact tag">
            <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
              <option value="">All tags</option>
              <option value="sdg-4">SDG 4 — Education</option>
              <option value="sdg-13">SDG 13 — Climate</option>
              <option value="climate">Climate impact</option>
            </Select>
          </FilterField>
          <FilterField label="CSR Theme">
            <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {discoveryFilters.csrThemes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Budget Range">
            <Select value={budget} onChange={(e) => setBudget(e.target.value)}>
              {discoveryFilters.budgetRanges.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="NGO Size">
            <Select value={size} onChange={(e) => setSize(e.target.value)}>
              {discoveryFilters.orgSizes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </FilterField>
          <Checkbox
            label="Verified only"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
        </FilterPanel>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search NGOs by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No NGOs match your filters" description="Try adjusting filters or search terms." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((ngo) => (
                <Card key={ngo.slug}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={CORPORATE_ROUTES.ngoProfile(ngo.slug)} className="font-semibold text-slate-900 hover:text-primary-600">
                      {ngo.name}
                    </Link>
                    {ngo.verified && <Badge variant="verified">Verified</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ngo.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ngo.focusAreas.slice(0, 3).map((a) => (
                      <Badge key={a} variant="primary">{a}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ngo.region}</span>
                    <span>{ngo.rating?.toFixed(1)}★ ({ngo.reviewCount})</span>
                    <span>Risk: {ngo.riskScore}/100</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={saved.includes(ngo.slug) ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => toggleSave(ngo.slug)}
                    >
                      <Heart className={`h-3.5 w-3.5 ${saved.includes(ngo.slug) ? 'fill-current' : ''}`} />
                      {saved.includes(ngo.slug) ? 'Saved' : 'Save'}
                    </Button>
                    <Button
                      variant={compare.includes(ngo.slug) ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => toggleCompare(ngo.slug)}
                      disabled={!compare.includes(ngo.slug) && compare.length >= 3}
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      Compare
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setContactNgo(ngo)}>
                      <Mail className="h-3.5 w-3.5" />
                      Contact
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare drawer */}
      {compareNgos.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg lg:pl-72">
          <div className="max-w-5xl mx-auto">
            <h4 className="font-semibold text-slate-900 mb-3">Compare NGOs ({compareNgos.length}/3)</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {compareNgos.map((ngo) => (
                <div key={ngo.slug} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium">{ngo.name}</p>
                  <p>Rating: {ngo.rating?.toFixed(1)} · Risk: {ngo.riskScore}</p>
                  <p>Transparency: {ngo.financialTransparency}%</p>
                  <p>Budget: {ngo.budgetRange}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCompare([])}>Clear</Button>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Contact {contactNgo.name}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setContactNgo(null)
                showToast('Message sent — demo mode')
              }}
              className="space-y-3"
            >
              <Input placeholder="Subject" required />
              <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} placeholder="Message" required />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setContactNgo(null)}>Cancel</Button>
                <Button type="submit">Send</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
