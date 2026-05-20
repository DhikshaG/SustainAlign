import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, X } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Alert'
import { apiFetch } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

const DOC_TYPES = [
  { key: 'registration', label: 'Registration Certificate', required: true },
  { key: '12a', label: '12A Certificate', required: true },
  { key: '80g', label: '80G Certificate', required: false },
  { key: 'fcra', label: 'FCRA Certificate', required: false },
]

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg']

export default function VerificationUpload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleFile = useCallback((key, file) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setError(`${file.name}: only PDF, PNG, and JPG files are accepted`)
      return
    }
    if (file.size > MAX_SIZE) {
      setError(`${file.name}: file must be under 10 MB`)
      return
    }
    setError(null)
    setFiles((prev) => ({ ...prev, [key]: { file, status: 'ready' } }))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const required = DOC_TYPES.filter((d) => d.required).map((d) => d.key)
    const missing = required.filter((k) => !files[k])
    if (missing.length) {
      setError('Please upload all required documents')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      Object.entries(files).forEach(([key, { file }]) => {
        formData.append(key, file)
      })
      await apiFetch('/api/auth/ngo/verification', { method: 'POST', body: formData })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <Alert variant="success" title="Documents submitted!">
          Our verification team will review your documents within 5 business days. You&apos;ll receive an email once verified.
        </Alert>
        <Button onClick={() => navigate(ROUTES.dashboard)} className="w-full mt-6">
          Go to Dashboard
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Upload verification documents</h1>
      <p className="text-sm text-slate-600 mb-6">Upload your NGO registration certificates for verification (PDF, PNG, or JPG, max 10 MB each)</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {DOC_TYPES.map((doc) => (
          <div key={doc.key} className="border border-dashed border-slate-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">
                  {doc.label}
                  {doc.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </div>
              {files[doc.key] && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" /> Ready
                </span>
              )}
            </div>
            {files[doc.key] ? (
              <div className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                <span className="text-sm text-slate-600 truncate">{files[doc.key].file.name}</span>
                <button type="button" onClick={() => setFiles((p) => { const n = { ...p }; delete n[doc.key]; return n })} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 py-4 cursor-pointer hover:bg-slate-50 rounded transition-colors">
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-500">Click to upload or drag and drop</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleFile(doc.key, e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        ))}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Uploading...' : 'Submit for Verification'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600 text-center">
        <Link to={ROUTES.ngoLogin} className="text-primary-600 hover:underline">Skip and verify later</Link>
      </p>
    </Card>
  )
}
