import { useState, useEffect } from 'react'
import { Plus, Upload } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { TagPicker } from '../../components/tags/TagPicker'
import { useAuth } from '../../context/AuthContext'
import {
  fetchNgoProfile,
  updateNgoProfile,
  addCertification,
  addStory,
  uploadNgoMedia,
} from '../../lib/ngo'

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'tags', label: 'Tags & Taxonomy' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'csr1', label: 'CSR-1' },
  { id: 'focus', label: 'Focus Areas' },
  { id: 'stories', label: 'Impact Stories' },
]

export default function ProfileManagement() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({})
  const [toast, setToast] = useState(null)
  const [newCert, setNewCert] = useState({ name: '', issued: '' })
  const [newStory, setNewStory] = useState({ title: '', excerpt: '' })

  useEffect(() => {
    let active = true
    fetchNgoProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        setForm({
          name: data.name || '',
          contactPerson: data.contactPerson || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          pan: data.pan || '',
          csr1Number: data.csr1Number || '',
          registrationNumber: data.registrationNumber || '',
          description: data.description || '',
        })
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    try {
      const updated = await updateNgoProfile(form)
      setProfile(updated)
      showToast('Profile saved')
    } catch (err) {
      showToast(err.message || 'Save failed')
    }
  }

  async function handleAddCert() {
    if (!newCert.name) return
    try {
      await addCertification(newCert)
      const refreshed = await fetchNgoProfile()
      setProfile(refreshed)
      setNewCert({ name: '', issued: '' })
      showToast('Certification added')
    } catch (err) {
      showToast(err.message || 'Failed')
    }
  }

  async function handleAddStory() {
    if (!newStory.title) return
    try {
      await addStory(newStory)
      const refreshed = await fetchNgoProfile()
      setProfile(refreshed)
      setNewStory({ title: '', excerpt: '' })
      showToast('Story added')
    } catch (err) {
      showToast(err.message || 'Failed')
    }
  }

  async function handleCsr1Upload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadNgoMedia(file, 'public_document')
      await updateNgoProfile({ csr1Number: form.csr1Number || profile?.csr1Number })
      showToast('CSR-1 document uploaded')
    } catch (err) {
      showToast(err.message || 'Upload failed')
    }
  }

  if (loading) {
    return <PageHeader title="Profile Management" description="Loading profile..." />
  }

  return (
    <>
      <PageHeader title="Profile Management" description="Update your NGO profile, certifications, and impact stories." />
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>}
      <TabbedSections tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'profile' && (
        <Card>
          <form className="space-y-4 max-w-xl" onSubmit={handleSaveProfile}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Organization name" />
            <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Contact person" />
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" />
            <Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} placeholder="PAN" />
            <Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Registration number" />
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Description" />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>
      )}
      {activeTab === 'tags' && user?.tenantId && (
        <Card>
          <p className="text-sm text-slate-600 mb-4">Structured tags power AI matching with corporate CSR themes, SDGs, geography, and impact areas.</p>
          <TagPicker entityType="ngo" entityId={user.tenantId} />
        </Card>
      )}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          {(profile?.certifications || []).map((c) => (
            <Card key={c.id} className="flex justify-between items-center">
              <div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">Issued: {c.issued}{c.expires ? ` · Expires: ${c.expires}` : ''}</p></div>
              <Badge variant="verified">{c.status || 'Active'}</Badge>
            </Card>
          ))}
          <Card className="space-y-3 max-w-md">
            <Input value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} placeholder="Certification name" />
            <Input value={newCert.issued} onChange={(e) => setNewCert({ ...newCert, issued: e.target.value })} placeholder="Issued date (YYYY-MM-DD)" />
            <Button variant="secondary" onClick={handleAddCert}><Plus className="h-4 w-4" /> Add Certification</Button>
          </Card>
        </div>
      )}
      {activeTab === 'csr1' && (
        <Card>
          <Input
            className="mb-4 max-w-md"
            value={form.csr1Number ?? profile?.csr1Number ?? ''}
            onChange={(e) => setForm({ ...form, csr1Number: e.target.value })}
            placeholder="CSR-1 registration number"
          />
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center mb-4">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Upload CSR-1 registration certificate</p>
            <label className="inline-block mt-3">
              <Button variant="secondary" size="sm" as="span">Choose File</Button>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleCsr1Upload} />
            </label>
          </div>
          {profile?.csr1Number && (
            <p className="text-sm text-slate-600">CSR-1 Number: {profile.csr1Number}</p>
          )}
        </Card>
      )}
      {activeTab === 'focus' && (
        <Card>
          <p className="text-sm text-slate-600 mb-4">Focus areas are managed via Tags & Taxonomy. Current focus areas:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(profile?.focusAreas || []).map((a) => (
              <Badge key={a} variant="primary">{a}</Badge>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setActiveTab('tags')}>Edit in Tags & Taxonomy</Button>
        </Card>
      )}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          {(profile?.impactStories || []).map((s) => (
            <Card key={s.id}>
              <p className="font-medium text-slate-900">{s.title}</p>
              <p className="text-xs text-slate-500 mb-2">{s.date}</p>
              <p className="text-sm text-slate-600">{s.excerpt}</p>
            </Card>
          ))}
          <Card className="space-y-3 max-w-xl">
            <Input value={newStory.title} onChange={(e) => setNewStory({ ...newStory, title: e.target.value })} placeholder="Story title" />
            <Textarea value={newStory.excerpt} onChange={(e) => setNewStory({ ...newStory, excerpt: e.target.value })} rows={3} placeholder="Excerpt" />
            <Button onClick={handleAddStory}><Plus className="h-4 w-4" /> Add Impact Story</Button>
          </Card>
        </div>
      )}
    </>
  )
}
