import { useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { PieChartCard, LineChartCard } from '../../components/corporate/Charts'
import { fundAllocation } from '../../data/corporate/funds'
import { formatINR } from '../../data/corporate/dashboard'

const scenarioLabels = { baseline: 'Baseline', aggressive: 'Aggressive', balanced: 'Balanced' }

export default function FundAllocation() {
  const [scenario, setScenario] = useState('baseline')
  const sim = fundAllocation.simulations[scenario]

  const themePie = fundAllocation.themes.map((t) => ({
    name: t.name,
    value: t.allocated,
  }))

  const simChart = Object.entries(sim).map(([key, pct]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(fundAllocation.totalBudget * pct / 100),
  }))

  return (
    <>
      <PageHeader
        title="Fund Allocation"
        description="Budget planner, theme allocation, district prioritization, and spending forecasts."
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PieChartCard title="Theme Allocation" data={themePie} />
        <LineChartCard title="Spending Forecast" data={fundAllocation.forecast} lines={[{ key: 'projected', color: '#059669', name: 'Projected Spend' }]} />
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Budget Planner</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 font-semibold text-slate-700">Theme</th>
                <th className="py-2 font-semibold text-slate-700">Allocated</th>
                <th className="py-2 font-semibold text-slate-700">Spent</th>
                <th className="py-2 font-semibold text-slate-700">Recommended</th>
              </tr>
            </thead>
            <tbody>
              {fundAllocation.themes.map((t) => (
                <tr key={t.name} className="border-b border-slate-100">
                  <td className="py-3 text-slate-900">{t.name}</td>
                  <td className="py-3">{formatINR(t.allocated)}</td>
                  <td className="py-3">{formatINR(t.spent)}</td>
                  <td className="py-3 text-primary-600">{formatINR(t.recommended)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">District Prioritization</h3>
        <div className="space-y-3">
          {fundAllocation.districts.map((d) => (
            <div key={d.district} className="flex items-center gap-4 text-sm">
              <span className="font-bold text-primary-600 w-6">#{d.rank}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{d.district}</p>
                <p className="text-slate-500">Gap: {d.sdgGap}</p>
              </div>
              <span className="font-medium">{formatINR(d.allocation)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                d.priority === 'high' ? 'bg-red-100 text-red-700' : d.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>{d.priority}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Allocation Simulation</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(fundAllocation.simulations).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScenario(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scenario === key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {scenarioLabels[key]}
            </button>
          ))}
        </div>
        <PieChartCard data={simChart} height={280} />
      </Card>
    </>
  )
}
