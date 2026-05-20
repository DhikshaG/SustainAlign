import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { ngoProfile } from '../../data/ngo/profile'

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'csr1', label: 'CSR-1' },
  { id: 'focus', label: 'Focus Areas' },
  { id: 'stories', label: 'Impact Stories' },
]

export default function ProfileManagement() {
  const [activeTab, setActiveTab] = useState('profile')
  const [focusAreas] = useState(ngoProfile.focusAreas)
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <PageHeader title="Profile Management" description="Update your NGO profile, certifications, and impact stories." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      <TabbedSections tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'profile' && (
        <Card>
          <form className="space-y-4 max-w-xl" onSubmit={(e) => { e.preventDefault(); showToast('Profile saved — demo mode') }}>
            <Input defaultValue={ngoProfile.name} placeholder="Organization name" />
            <Input defaultValue={ngoProfile.contactPerson} placeholder="Contact person" />
            <Input defaultValue={ngoProfile.email} placeholder="Email" type="email" />
            <Input defaultValue={ngoProfile.phone} placeholder="Phone" />
            <Textarea defaultValue={ngoProfile.description} rows={4} placeholder="Description" />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>
      )}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          {ngoProfile.certifications.map((c) => (
            <Card key={c.id} className="flex justify-between items-center">
              <div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">Issued: {c.issued}{c.expires ? ` · Expires: ${c.expires}` : ''}</p></div>
              <Badge variant="verified">Active</Badge>
            </Card>
          ))}
          <Button variant="secondary" onClick={() => showToast('Certification added — demo mode')}><Plus className="h-4 w-4" /> Add Certification</Button>
        </div>
      )}
      {activeTab === 'csr1' && (
        <Card>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center mb-4">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Upload CSR-1 registration certificate</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => showToast('CSR-1 uploaded — demo mode')}>Choose File</Button>
          </div>
          {ngoProfile.csr1Document && (
            <p className="text-sm text-slate-600">Current: {ngoProfile.csr1Document.name} ({ngoProfile.csr1Document.size}) · {ngoProfile.csr1Document.uploaded}</p>
          )}
        </Card>
      )}
      {activeTab === 'focus' && (
        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            {focusAreas.map((a) => (
              <Badge key={a} variant="primary">{a}</Badge>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <Input placeholder="Add focus area" id="new-focus" />
            <Button variant="secondary" onClick={() => showToast('Focus area added — demo mode')}>Add</Button>
          </div>
        </Card>
      )}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          {ngoProfile.impactStories.map((s) => (
            <Card key={s.id}>
              <p className="font-medium text-slate-900">{s.title}</p>
              <p className="text-xs text-slate-500 mb-2">{s.date}</p>
              <p className="text-sm text-slate-600">{s.excerpt}</p>
            </Card>
          ))}
          <Button onClick={() => showToast('Story added — demo mode')}><Plus className="h-4 w-4" /> Add Impact Story</Button>
        </div>
      )}
    </>
  )
}
