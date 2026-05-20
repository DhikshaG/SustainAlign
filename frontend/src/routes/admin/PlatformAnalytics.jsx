import { PageHeader } from '../../components/corporate/PageHeader'
import { AreaChartCard, PieChartCard, BarChartCard } from '../../components/corporate/Charts'
import { platformAnalytics } from '../../data/admin/analytics'

export default function PlatformAnalytics() {
  const growthData = platformAnalytics.userGrowth.map((m) => ({ month: m.month, total: m.total }))
  const csrData = platformAnalytics.csrVolume.map((q) => ({ name: q.month, value: q.volume }))

  return (
    <>
      <PageHeader title="Platform Analytics" description="User growth, tenant breakdown, and CSR volume trends." />
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <AreaChartCard
          title="User Growth"
          data={platformAnalytics.userGrowth}
          lines={[
            { key: 'corporate', color: '#0284c7', name: 'Corporate' },
            { key: 'ngo', color: '#059669', name: 'NGO' },
          ]}
        />
        <PieChartCard title="Tenant Breakdown" data={platformAnalytics.tenantBreakdown} />
      </div>
      <BarChartCard title="Total Users Over Time" data={growthData} xKey="month" bars={[{ key: 'total', color: '#6366f1', name: 'Total Users' }]} />
      <div className="mt-6">
        <PieChartCard title="CSR Volume by Quarter" data={csrData} height={280} />
      </div>
    </>
  )
}
