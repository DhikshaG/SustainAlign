import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, GitCompare, Mail, MapPin, Search, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { FilterPanel, FilterField } from '../../components/corporate/FilterPanel'
import { ContactNgoModal } from '../../components/corporate/ContactNgoModal'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { EmptyState } from '../../components/corporate/EmptyState'
import {
  fetchDiscoveryFilters,
  fetchDiscoveryNgos,
  fetchSavedNgos,
  saveNgo,
  unsaveNgo,
  filtersToSearchParams,
  searchParamsToFilters,
  PAGE_SIZE,
} from '../../lib/discovery'
import { getCompareItems, toggleCompareItem, clearCompareItems } from '../../lib/compare-ngos'
import { CORPORATE_ROUTES } from '../../lib/routes'

export default function NgoDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => searchParamsToFilters(searchParams))
  const [filterOptions, setFilterOptions] = useState(null)
  const [ngos, setNgos] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [syncKey, setSyncKey] = useState(0)
  const [readyKey, setReadyKey] = useState(-1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [savedSlugs, setSavedSlugs] = useState(new Set())
  const [compareItems, setCompareItems] = useState(getCompareItems)
  const [contactNgo, setContactNgo] = useState(null)
  const [toast, setToast] = useState(null)

  const filterKey = useMemo(() => {
    const f = { ...filters }
    delete f.savedOnly
    return JSON.stringify(f)
  }, [filters])
  const loading = readyKey !== syncKey

  const apiParams = useMemo(() => ({
    q: filters.q || undefined,
    state: filters.state !== 'All' ? filters.state : undefined,
    sdg: filters.sdg !== 'all' ? filters.sdg : undefined,
    theme: filters.theme !== 'All' ? filters.theme : undefined,
    impact: filters.impact !== 'all' ? filters.impact : undefined,
    budgetRange: filters.budgetRange !== 'All' ? filters.budgetRange : undefined,
    verified: filters.verified === 'true' ? 'true' : undefined,
    limit: PAGE_SIZE,
    offset: 0,
  }), [filters])

  useEffect(() => {
    fetchDiscoveryFilters().then(setFilterOptions).catch(() => setFilterOptions(null))
    fetchSavedNgos().then(({ slugs }) => setSavedSlugs(new Set(slugs))).catch(() => {})
  }, [])

  useEffect(() => {
    setSearchParams(filtersToSearchParams(filters), { replace: true })
  }, [filters, setSearchParams])

  useEffect(() => {
    let active = true
    fetchDiscoveryNgos(apiParams)
      .then((result) => {
        if (!active) return
        setNgos(result.ngos)
        setTotal(result.total)
        setOffset(result.ngos.length)
        setError(null)
        setReadyKey(syncKey)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Failed to load NGOs')
        setNgos([])
        setTotal(0)
        setReadyKey(syncKey)
      })
    return () => { active = false }
  }, [filterKey, syncKey, apiParams])

  const displayedNgos = filters.savedOnly
    ? ngos.filter((n) => savedSlugs.has(n.slug))
    : ngos

  function updateFilter(key, value) {
    if (key === 'savedOnly') {
      setFilters((prev) => ({ ...prev, savedOnly: value }))
      return
    }
    setReadyKey(-1)
    setSyncKey((k) => k + 1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const result = await fetchDiscoveryNgos({ ...apiParams, offset, limit: PAGE_SIZE })
      setNgos((prev) => [...prev, ...result.ngos])
      setOffset((o) => o + result.ngos.length)
      setTotal(result.total)
    } catch (err) {
      setError(err.message || 'Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  function retry() {
    setReadyKey(-1)
    setSyncKey((k) => k + 1)
  }

  async function toggleSave(slug) {
    try {
      if (savedSlugs.has(slug)) {
        await unsaveNgo(slug)
        setSavedSlugs((prev) => {
          const next = new Set(prev)
          next.delete(slug)
          return next
        })
        showToast('Removed from saved NGOs')
      } else {
        await saveNgo(slug)
        setSavedSlugs((prev) => new Set(prev).add(slug))
        showToast('NGO saved')
      }
    } catch (err) {
      showToast(err.message || 'Save failed')
    }
  }

  function handleCompare(ngo) {
    setCompareItems(toggleCompareItem(ngo))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const hasMore = offset < total

  const opts = filterOptions || {
    states: [{ value: 'All', label: 'All states' }],
    sdgs: [{ value: 'all', label: 'All SDGs' }],
    themes: [{ value: 'All', label: 'All themes' }],
    impactAreas: [{ value: 'all', label: 'All impact areas' }],
    budgetRanges: [{ value: 'All', label: 'All budgets' }],
  }

  return (
    <>
      <PageHeader
        title="NGO Discovery"
        description="Search and filter verified implementing agencies for your CSR programs."
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <FilterPanel className="lg:col-span-1 h-fit">
          <FilterField label="State">
            <Select value={filters.state} onChange={(e) => updateFilter('state', e.target.value)}>
              {opts.states.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="SDG">
            <Select value={filters.sdg} onChange={(e) => updateFilter('sdg', e.target.value)}>
              {opts.sdgs.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Theme">
            <Select value={filters.theme} onChange={(e) => updateFilter('theme', e.target.value)}>
              {opts.themes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Impact area">
            <Select value={filters.impact} onChange={(e) => updateFilter('impact', e.target.value)}>
              {opts.impactAreas.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Budget">
            <Select value={filters.budgetRange} onChange={(e) => updateFilter('budgetRange', e.target.value)}>
              {opts.budgetRanges.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </Select>
          </FilterField>
          <Checkbox
            label="Verified only"
            checked={filters.verified === 'true'}
            onChange={(e) => updateFilter('verified', e.target.checked ? 'true' : 'all')}
          />
          <Checkbox
            label="Saved only"
            checked={filters.savedOnly}
            onChange={(e) => updateFilter('savedOnly', e.target.checked)}
          />
        </FilterPanel>

        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search NGOs by name or description..."
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              className="pl-10"
            />
          </div>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              {filters.savedOnly ? `${displayedNgos.length} saved NGO${displayedNgos.length !== 1 ? 's' : ''} shown` : `${total} NGO${total !== 1 ? 's' : ''} found`}
            </p>
          )}

          {error && (
            <Card className="flex items-center justify-between gap-4">
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="secondary" onClick={retry}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </Card>
          )}

          {loading ? (
            <p className="text-slate-500">Loading NGOs...</p>
          ) : !error && displayedNgos.length === 0 ? (
            <EmptyState icon={Search} title="No NGOs match your filters" description="Try adjusting filters or search terms." />
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {displayedNgos.map((ngo) => (
                  <Card key={ngo.slug}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={CORPORATE_ROUTES.ngoProfile(ngo.slug)} className="font-semibold text-slate-900 hover:text-primary-600">
                        {ngo.name}
                      </Link>
                      {ngo.verified && <Badge variant="verified">Verified</Badge>}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{ngo.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(ngo.focusAreas || []).slice(0, 3).map((a) => (
                        <Badge key={a} variant="primary">{a}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ngo.region}</span>
                      {ngo.riskScore != null && <span>Risk: {ngo.riskScore}/100</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={savedSlugs.has(ngo.slug) ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => toggleSave(ngo.slug)}
                      >
                        <Heart className={`h-3.5 w-3.5 ${savedSlugs.has(ngo.slug) ? 'fill-current' : ''}`} />
                        {savedSlugs.has(ngo.slug) ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant={compareItems.some((c) => c.slug === ngo.slug) ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleCompare(ngo)}
                        disabled={!compareItems.some((c) => c.slug === ngo.slug) && compareItems.length >= 3}
                      >
                        <GitCompare className="h-3.5 w-3.5" /> Compare
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setContactNgo(ngo)}>
                        <Mail className="h-3.5 w-3.5" /> Contact
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {!filters.savedOnly && hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {compareItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg lg:pl-72">
          <div className="max-w-5xl mx-auto">
            <h4 className="font-semibold text-slate-900 mb-3">Compare NGOs ({compareItems.length}/3)</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {compareItems.map((ngo) => (
                <div key={ngo.slug} className="rounded-lg border border-slate-200 p-3">
                  <Link to={CORPORATE_ROUTES.ngoProfile(ngo.slug)} className="font-medium hover:text-primary-600">{ngo.name}</Link>
                  <p className="mt-1">{ngo.verified ? 'Verified' : 'Unverified'} · Risk: {ngo.riskScore ?? '—'}</p>
                  <p>Transparency: {ngo.financialTransparency ?? '—'}% · Budget: {ngo.budgetRange ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    SDGs: {(ngo.sdgs || []).map((s) => `SDG ${s}`).join(', ') || '—'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(ngo.focusAreas || []).slice(0, 2).map((a) => (
                      <Badge key={a} variant="default">{a}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setCompareItems([]); clearCompareItems() }}>Clear</Button>
          </div>
        </div>
      )}

      {contactNgo && (
        <ContactNgoModal
          ngo={contactNgo}
          onClose={() => setContactNgo(null)}
          onSuccess={(result) => showToast(`Message sent (ref ${result.inquiryId?.slice(0, 8)})`)}
        />
      )}
    </>
  )
}
