import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, Lightbulb } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Checkbox } from '../../components/ui/Checkbox'
import { BarChartCard } from '../../components/corporate/Charts'
import { DataTable } from '../../components/corporate/DataTable'
import { formatINR } from '../../data/corporate/dashboard'
import { fetchFundAllocation } from '../../lib/compliance'
import {
  fetchFundIntelligence,
  ALLOCATION_SCENARIOS,
  SDG_FOCUS_OPTIONS,
} from '../../lib/allocation'
import { CORPORATE_ROUTES } from '../../lib/routes'

const PRIORITY_VARIANT = {
  high: 'error',
  medium: 'warning',
  low: 'default',
}

const districtColumns = [
  { key: 'rank', label: 'Rank', sortable: true },
  { key: 'district', label: 'District', sortable: true },
  {
    key: 'priority',
    label: 'Priority',
    sortable: true,
    render: (row) => (
      <Badge variant={PRIORITY_VARIANT[row.priority] || 'default'}>{row.priority}</Badge>
    ),
  },
  { key: 'needScore', label: 'Need score', sortable: true },
  { key: 'sdgGap', label: 'SDG gap', sortable: true },
  {
    key: 'currentSpend',
    label: 'Current spend',
    sortable: true,
    render: (row) => formatINR(row.currentSpend),
  },
  {
    key: 'recommendedAllocation',
    label: 'Recommended',
    sortable: true,
    render: (row) => formatINR(row.recommendedAllocation),
  },
]

function NgoRecommendationCard({ ngo }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link
            to={CORPORATE_ROUTES.ngoProfile(ngo.slug)}
            className="font-semibold text-slate-900 hover:text-primary-600"
          >
            {ngo.name}
          </Link>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {ngo.district} · {ngo.theme}
          </p>
        </div>
        <Badge variant="primary" className="shrink-0">
          {ngo.matchPercent}% match
        </Badge>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
        <span>Suggested: <strong>{formatINR(ngo.suggestedAmount)}</strong></span>
        <span>Performance: {ngo.performanceScore ?? '—'}/100</span>
        {ngo.previouslyPartnered && <Badge variant="primary">Past partner</Badge>}
      </div>
      {ngo.reason && (
        <p className="text-sm text-slate-600 italic border-l-2 border-primary-200 pl-3 mb-3">
          {ngo.reason}
        </p>
      )}
      <Button as={Link} to={CORPORATE_ROUTES.ngoProfile(ngo.slug)} variant="secondary" size="sm">
        View profile
      </Button>
    </Card>
  )
}

export default function FundIntelligence() {
  const [unallocated, setUnallocated] = useState(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [scenario, setScenario] = useState('balanced')
  const [sdgFocus, setSdgFocus] = useState([])
  const [includeAi, setIncludeAi] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    fetchFundAllocation()
      .then((data) => {
        if (!active) return
        setUnallocated(data.unallocated)
        setBudgetInput(String(data.unallocated || 0))
      })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])

  function toggleSdg(sdg) {
    setSdgFocus((prev) =>
      prev.includes(sdg) ? prev.filter((s) => s !== sdg) : [...prev, sdg],
    )
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const budgetToAllocate = parseInt(budgetInput, 10) || 0
      const data = await fetchFundIntelligence({
        budgetToAllocate,
        scenario,
        sdgFocus: sdgFocus.length ? sdgFocus : undefined,
        includeAi,
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }

  const themeChartData = (result?.themeSplit || []).map((t) => ({
    name: t.theme,
    current: t.currentAllocated,
    recommended: t.recommended,
  }))

  return (
    <>
      <PageHeader
        title="Fund Allocation Intelligence"
        description="Score underserved districts, recommend theme and district budget splits, and surface matching NGO partners."
        breadcrumbs={[
          { label: 'Fund Allocation', href: CORPORATE_ROUTES.funds },
          { label: 'Intelligence' },
        ]}
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Allocation inputs
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="budget">Budget to allocate (INR)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="mt-1"
                placeholder={unallocated != null ? String(unallocated) : 'Loading…'}
              />
              {unallocated != null && (
                <p className="text-xs text-slate-500 mt-1">
                  Unallocated balance: {formatINR(unallocated)}
                </p>
              )}
            </div>

            <div>
              <Label>Scenario</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALLOCATION_SCENARIOS.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    variant={scenario === s.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setScenario(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>SDG focus (optional)</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {SDG_FOCUS_OPTIONS.map((opt) => (
                  <Checkbox
                    key={opt.sdg}
                    checked={sdgFocus.includes(opt.sdg)}
                    onChange={() => toggleSdg(opt.sdg)}
                    label={opt.label}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>

            <Checkbox
              checked={includeAi}
              onChange={(e) => setIncludeAi(e.target.checked)}
              label="Include AI rationale"
            />

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={loading}
              onClick={handleGenerate}
            >
              {loading ? 'Generating…' : 'Generate recommendations'}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {result?.input && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card><p className="text-sm text-slate-500">Obligation</p><p className="text-xl font-bold">{formatINR(result.input.obligation)}</p></Card>
              <Card><p className="text-sm text-slate-500">Budget to allocate</p><p className="text-xl font-bold">{formatINR(result.input.budgetToAllocate)}</p></Card>
              <Card><p className="text-sm text-slate-500">Unallocated</p><p className="text-xl font-bold text-amber-700">{formatINR(result.input.unallocated)}</p></Card>
              <Card><p className="text-sm text-slate-500">Scenario</p><p className="text-xl font-bold capitalize">{result.input.scenario}</p></Card>
            </div>
          )}

          {result?.offline && (
            <Alert variant="warning">
              AI rationale unavailable (Ollama offline). Numeric recommendations are still based on live data.
            </Alert>
          )}

          {result?.rationale && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                AI rationale
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{result.rationale}</p>
            </Card>
          )}

          {!result && !loading && (
            <Card>
              <p className="text-sm text-slate-500 text-center py-12">
                Set your budget and scenario, then generate recommendations to see theme splits, district priorities, and NGO matches.
              </p>
            </Card>
          )}
        </div>
      </div>

      {result?.themeSplit?.length > 0 && (
        <div className="mb-6">
          <BarChartCard
            title="Theme split — current vs recommended"
            data={themeChartData}
            xKey="name"
            bars={[
              { key: 'current', color: '#94a3b8', name: 'Current allocated' },
              { key: 'recommended', color: '#059669', name: 'Recommended' },
            ]}
            height={280}
          />
        </div>
      )}

      {result?.districts?.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">District allocation</h3>
          <DataTable
            columns={districtColumns}
            data={result.districts}
            keyField="district"
            emptyMessage="No district recommendations"
          />
        </Card>
      )}

      {result?.ngos?.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-4">Recommended NGO partners</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {result.ngos.map((ngo) => (
              <NgoRecommendationCard key={`${ngo.slug}-${ngo.district}-${ngo.theme}`} ngo={ngo} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
