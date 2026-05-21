import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, MapPin, FileText, Users, Star, Shield, Globe, Mail } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { TabbedSections } from '../../components/corporate/TabbedSections'
import { ContactNgoModal } from '../../components/corporate/ContactNgoModal'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/corporate/ProgressBar'
import { fetchCorporateNgo } from '../../lib/ngo'
import { fetchSavedNgos, saveNgo, unsaveNgo } from '../../lib/discovery'
import { CORPORATE_ROUTES } from '../../lib/routes'
import NotFound from '../public/NotFound'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'csr1', label: 'CSR-1' },
  { id: 'focus', label: 'Focus Areas' },
  { id: 'projects', label: 'Past Projects' },
  { id: 'impact', label: 'Impact' },
  { id: 'team', label: 'Team' },
  { id: 'documents', label: 'Documents' },
  { id: 'risk', label: 'Risk Score' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'financial', label: 'Financial Transparency' },
  { id: 'geo', label: 'Geographic Reach' },
]

export default function CorporateNgoProfile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [ngo, setNgo] = useState(null)
  const [status, setStatus] = useState({ slug: null, kind: 'loading' })
  const [activeTab, setActiveTab] = useState('overview')
  const [saved, setSaved] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let active = true
    fetchCorporateNgo(slug)
      .then((data) => {
        if (active) {
          setNgo(data)
          setStatus({ slug, kind: 'ok' })
        }
      })
      .catch(() => {
        if (active) {
          setNgo(null)
          setStatus({ slug, kind: 'notfound' })
        }
      })
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    fetchSavedNgos().then(({ slugs }) => setSaved(slugs.includes(slug))).catch(() => {})
  }, [slug])

  const loading = status.slug !== slug
  const notFound = status.slug === slug && status.kind === 'notfound'

  if (loading) {
    return <p className="text-slate-500 p-6">Loading NGO profile...</p>
  }
  if (notFound || !ngo) return <NotFound />

  const riskScore = ngo.riskScore ?? 0
  const transparency = ngo.financialTransparency ?? 0
  const rating = ngo.rating ?? 0
  const reviewCount = ngo.reviewCount ?? 0

  async function toggleSave() {
    try {
      if (saved) {
        await unsaveNgo(slug)
        setSaved(false)
      } else {
        await saveNgo(slug)
        setSaved(true)
      }
    } catch (err) {
      setToast(err.message || 'Save failed')
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 text-white px-4 py-3 text-sm shadow-lg">{toast}</div>
      )}
      <PageHeader
        title={ngo.name}
        breadcrumbs={[
          { label: 'Discovery', href: CORPORATE_ROUTES.discovery },
          { label: ngo.name },
        ]}
        actions={
          <>
            <Button variant={saved ? 'primary' : 'secondary'} size="sm" onClick={toggleSave}>
              <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save NGO'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowContact(true)}>
              <Mail className="h-4 w-4" /> Contact
            </Button>
            <Button size="sm">Add to Project</Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {ngo.verified && <Badge variant="verified">Verified</Badge>}
        <Badge variant="primary">{ngo.sector}</Badge>
        {(ngo.tags || []).map((t) => <Badge key={t} variant="default">{t}</Badge>)}
        <span className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="h-4 w-4" />{ngo.region}</span>
        {rating > 0 && (
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" />{rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        )}
      </div>

      <TabbedSections tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <p className="text-slate-600 leading-relaxed">{ngo.description}</p>
            <div className="mt-6 grid sm:grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-slate-900">{ngo.beneficiaries}</p><p className="text-xs text-slate-500">Beneficiaries</p></div>
              <div><p className="text-2xl font-bold text-slate-900">{ngo.projects}</p><p className="text-xs text-slate-500">Projects</p></div>
              <div><p className="text-2xl font-bold text-slate-900">{transparency}%</p><p className="text-xs text-slate-500">Transparency</p></div>
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Risk Score</dt><dd className="font-medium">{riskScore}/100</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Budget Range</dt><dd className="font-medium">{ngo.budgetRange || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Org Size</dt><dd className="font-medium capitalize">{ngo.orgSize || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">SDGs</dt><dd className="font-medium">{(ngo.sdgs || []).map((s) => `SDG ${s}`).join(', ') || '—'}</dd></div>
              {ngo.contactPerson && (
                <div className="flex justify-between"><dt className="text-slate-500">Contact</dt><dd className="font-medium">{ngo.contactPerson}</dd></div>
              )}
              {ngo.email && (
                <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium text-primary-600">{ngo.email}</dd></div>
              )}
            </dl>
          </Card>
        </div>
      )}

      {activeTab === 'csr1' && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">CSR-1 Registration Details</h3>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Registration Number</dt><dd className="font-medium mt-1">{ngo.csr1Number || ngo.registrationNumber || '—'}</dd></div>
            <div><dt className="text-slate-500">Verification Status</dt><dd className="mt-1"><Badge variant={ngo.verified ? 'verified' : 'warning'}>{ngo.verificationStatus}</Badge></dd></div>
            <div><dt className="text-slate-500">CSR Themes</dt><dd className="font-medium mt-1">{(ngo.csrThemes || []).join(', ') || '—'}</dd></div>
            <div><dt className="text-slate-500">Implementing Agency</dt><dd className="font-medium mt-1">Eligible under Section 135</dd></div>
          </dl>
        </Card>
      )}

      {activeTab === 'focus' && (
        <div className="flex flex-wrap gap-2">
          {(ngo.focusAreas || []).map((a) => <Badge key={a} variant="primary">{a}</Badge>)}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-3">
          {(ngo.pastProjects || []).length === 0 ? (
            <p className="text-slate-500 text-sm">No past projects listed.</p>
          ) : (
            ngo.pastProjects.map((p) => (
              <Card key={p.id || p.name} padding>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{p.outcome}</p>
                  </div>
                  <span className="font-semibold text-primary-600">{p.budget}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'impact' && (
        <Card>
          {Object.keys(ngo.impactMetrics || {}).length === 0 ? (
            <p className="text-slate-500 text-sm">No impact metrics recorded.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ngo.impactMetrics).map(([key, val]) => (
                <div key={key} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xl font-bold text-slate-900">{typeof val === 'number' ? val.toLocaleString() : val}</p>
                  <p className="text-xs text-slate-500 capitalize mt-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'team' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {(ngo.team || []).length === 0 ? (
            <p className="text-slate-500 text-sm">No team members listed.</p>
          ) : (
            ngo.team.map((member) => (
              <Card key={member.id || member.name}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center"><Users className="h-5 w-5 text-primary-600" /></div>
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-2">
          {(ngo.documents || []).length === 0 ? (
            <p className="text-slate-500 text-sm">No documents available.</p>
          ) : (
            ngo.documents.map((doc) => (
              <Card key={doc.id || doc.name} padding className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.type} · {doc.uploaded || '—'}</p>
                  </div>
                </div>
                {doc.downloadUrl ? (
                  <Button as="a" href={doc.downloadUrl} variant="ghost" size="sm" target="_blank" rel="noreferrer">Download</Button>
                ) : (
                  <Button variant="ghost" size="sm" disabled>Download</Button>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'risk' && (
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <Shield className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-3xl font-bold text-slate-900">{riskScore}/100</p>
              <p className="text-sm text-slate-500">Lower is better · {riskScore < 20 ? 'Low risk' : riskScore < 35 ? 'Medium risk' : 'Elevated risk'}</p>
            </div>
          </div>
          <ProgressBar value={100 - riskScore} label="Trust score" />
        </Card>
      )}

      {activeTab === 'ratings' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-6 w-6 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
            <span className="text-lg font-bold ml-2">{rating.toFixed(1)}</span>
            <span className="text-slate-500">({reviewCount} reviews)</span>
          </div>
          <p className="text-sm text-slate-600">Reviews from corporate partners highlight strong reporting, on-time delivery, and transparent fund utilization.</p>
        </Card>
      )}

      {activeTab === 'financial' && (
        <Card>
          <h3 className="font-semibold mb-4">Financial Transparency Score</h3>
          <ProgressBar value={transparency} label="Transparency index" />
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✓ Annual audited statements published</li>
            <li>✓ Utilization certificates available</li>
            <li>✓ FCRA compliance (where applicable)</li>
          </ul>
        </Card>
      )}

      {activeTab === 'geo' && (
        <Card>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-5 w-5" /> Districts Covered</h3>
          <div className="flex flex-wrap gap-2">
            {(ngo.districts || []).map((d) => <Badge key={d} variant="default">{d}</Badge>)}
          </div>
          <p className="text-sm text-slate-500 mt-4">Primary region: {ngo.region}</p>
        </Card>
      )}

      <div className="mt-6">
        <Button as={Link} to={CORPORATE_ROUTES.discovery} variant="ghost">← Back to Discovery</Button>
      </div>

      {showContact && (
        <ContactNgoModal
          ngo={ngo}
          onClose={() => setShowContact(false)}
          onSuccess={() => {
            setShowContact(false)
            setToast('Message sent successfully')
            setTimeout(() => setToast(null), 3000)
          }}
        />
      )}
    </>
  )
}
