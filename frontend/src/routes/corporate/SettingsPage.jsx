import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { settingsData } from '../../data/corporate/settings'
import { getPermissionMatrix } from '../../lib/permissions'
import { useActivityLog } from '../../hooks/useActivityLog'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../lib/routes'
import { CORPORATE_ROLES as CORPORATE_ROLE_OPTIONS } from '../../lib/validation/schemas'

const permissionRoles = [
  { value: 'super_admin', label: 'Super Admin' },
  ...CORPORATE_ROLE_OPTIONS,
]

const tabs = [
  { id: 'team', label: 'Team' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'branding', label: 'Branding' },
  { id: 'security', label: 'Security' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team')
  const [notifications, setNotifications] = useState(settingsData.notifications)
  const { user } = useAuth()
  const { activity: authEvents } = useActivityLog({ limit: 10 })

  function toggleNotif(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }))
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Team management, permissions, integrations, and security."
        actions={
          <Button as={Link} to={ROUTES.inviteTeam} variant="secondary" size="sm">
            Invite Team
          </Button>
        }
      />

      <TabbedSections tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'team' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Team Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Email</th>
                  <th className="py-2 font-semibold">Role</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {settingsData.team.map((member) => (
                  <tr key={member.email} className="border-b border-slate-100">
                    <td className="py-3">{member.name}</td>
                    <td className="py-3 text-slate-600">{member.email}</td>
                    <td className="py-3 capitalize">{member.role.replace('_', ' ')}</td>
                    <td className="py-3"><Badge variant="verified">{member.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'permissions' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Permissions Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left font-semibold">Module</th>
                  {permissionRoles.map((r) => (
                    <th key={r.value} className="py-2 text-center font-semibold text-xs">{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getPermissionMatrix().map((row) => (
                  <tr key={row.module} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{row.module}</td>
                    {permissionRoles.map((r) => (
                      <td key={r.value} className="py-2 text-center">{row[r.value] ? '✓' : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'integrations' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {settingsData.integrations.map((int) => (
            <Card key={int.name}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900">{int.name}</h4>
                <Badge variant={int.status === 'connected' ? 'verified' : 'default'}>{int.status}</Badge>
              </div>
              <p className="text-sm text-slate-600">{int.description}</p>
              {int.status === 'available' && (
                <Button variant="secondary" size="sm" className="mt-3">Connect</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, val]) => (
              <Checkbox
                key={key}
                id={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                checked={val}
                onChange={() => toggleNotif(key)}
              />
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'branding' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Branding</h3>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Company Name</dt><dd className="font-medium mt-1">{settingsData.branding.companyName}</dd></div>
            <div>
              <dt className="text-slate-500">Primary Color</dt>
              <dd className="flex items-center gap-2 mt-1">
                <span className="h-6 w-6 rounded border border-slate-200" style={{ backgroundColor: settingsData.branding.primaryColor }} />
                <span className="font-mono">{settingsData.branding.primaryColor}</span>
              </dd>
            </div>
            <div><dt className="text-slate-500">Logo</dt><dd className="mt-1 text-slate-400">Upload logo — demo mode</dd></div>
          </dl>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Security</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium">{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">MFA</dt><dd><Badge variant="verified">Enabled (Email OTP)</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Session</dt><dd className="font-medium">Active</dd></div>
          </dl>
          <Button variant="secondary" size="sm" className="mt-4">Change Password</Button>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-medium text-slate-900 mb-3">Recent account activity</h4>
            <ul className="space-y-2 text-sm">
              {authEvents.filter((a) => a.action?.startsWith('auth.')).slice(0, 10).map((a) => (
                <li key={a.id} className="flex justify-between text-slate-600">
                  <span>{a.action}</span>
                  <span>{a.at ? new Date(a.at).toLocaleString() : ''}</span>
                </li>
              ))}
              {authEvents.length === 0 && <li className="text-slate-400">No recent auth events</li>}
            </ul>
          </div>
        </Card>
      )}
    </>
  )
}
