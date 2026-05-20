import { Link } from 'react-router-dom'
import { Users, ShieldCheck, AlertTriangle, Headphones, BarChart3 } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { StatCard } from '../../components/corporate/StatCard'
import { Card } from '../../components/ui/Card'
import { adminOverview } from '../../data/admin/overview'
import { ADMIN_ROUTES } from '../../lib/routes'

const quickLinks = [
  { label: 'User Management', href: ADMIN_ROUTES.users, icon: Users },
  { label: 'NGO Verification', href: ADMIN_ROUTES.ngoVerification, icon: ShieldCheck },
  { label: 'Fraud Monitoring', href: ADMIN_ROUTES.fraud, icon: AlertTriangle },
  { label: 'Support Tickets', href: ADMIN_ROUTES.support, icon: Headphones },
  { label: 'Platform Analytics', href: ADMIN_ROUTES.analytics, icon: BarChart3 },
]

export default function AdminOverview() {
  return (
    <>
      <PageHeader title="Platform Overview" description="Internal admin dashboard for SustainAlign operations." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={adminOverview.totalUsers.toLocaleString()} />
        <StatCard label="Corporate Tenants" value={adminOverview.corporateTenants} />
        <StatCard label="NGO Tenants" value={adminOverview.ngoTenants} />
        <StatCard label="Pending Verifications" value={adminOverview.pendingVerifications} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Open Tickets" value={adminOverview.openTickets} />
        <StatCard label="Fraud Alerts" value={adminOverview.fraudAlerts} />
        <StatCard label="Active Projects" value={adminOverview.activeProjects.toLocaleString()} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {quickLinks.map((l) => {
              const Icon = l.icon
              return (
                <Link key={l.href} to={l.href} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50">
                  <Icon className="h-4 w-4 text-slate-500" /> {l.label}
                </Link>
              )
            })}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <ul className="space-y-3 text-sm">
            {adminOverview.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
                <div><p className="font-medium text-slate-900">{a.action}</p><p className="text-slate-500">{a.entity}</p></div>
                <span className="text-slate-400 shrink-0">{a.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
