import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { DataTable } from '../../components/corporate/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { adminUsers } from '../../data/admin/users'

export default function UserManagement() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return adminUsers
    return adminUsers.filter((u) => u.email.includes(q) || u.name.toLowerCase().includes(q) || u.tenant.toLowerCase().includes(q))
  }, [search])

  const columns = [
    { key: 'email', label: 'Email', sortable: true, render: (r) => <span className="font-medium">{r.email}</span> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tenant', label: 'Tenant', sortable: true },
    { key: 'type', label: 'Type', render: (r) => <Badge variant="default">{r.type}</Badge> },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'verified' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader title="User Management" description="Manage users across all tenants. Actions are demo-only in Phase 1." />
      <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md mb-4" />
      <DataTable columns={columns} data={filtered} keyField="id" />
    </>
  )
}
