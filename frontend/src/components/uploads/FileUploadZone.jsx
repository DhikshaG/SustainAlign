import { useState, useCallback } from 'react'
import { Upload, CheckCircle, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { uploadFile } from '../../lib/uploads'

const DEFAULT_MAX = 10 * 1024 * 1024
const DEFAULT_ACCEPT = ['application/pdf', 'image/png', 'image/jpeg']

export function FileUploadZone({
  category,
  entityType,
  entityId,
  label = 'Upload file',
  hint = 'PDF, PNG, or JPG up to 10 MB',
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX,
  onUploaded,
  multiple = false,
}) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = useCallback((f) => {
    if (!accept.includes(f.type)) {
      setError('File type not allowed')
      return false
    }
    if (f.size > maxSize) {
      setError('File exceeds size limit')
      return false
    }
    setError(null)
    return true
  }, [accept, maxSize])

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const res = await uploadFile(file, { category, entityType, entityId })
      setDone(true)
      onUploaded?.(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
      {error && <Alert variant="error" className="mb-4 text-left">{error}</Alert>}
      {done ? (
        <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-5 w-5" /> Uploaded successfully
        </div>
      ) : file ? (
        <div className="flex items-center justify-between bg-slate-50 rounded px-3 py-2 mb-4">
          <span className="text-sm text-slate-600 truncate">{file.name}</span>
          <button type="button" onClick={() => { setFile(null); setDone(false) }} className="text-slate-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-500">{hint}</span>
          <input
            type="file"
            className="hidden"
            accept={accept.map((m) => m.split('/')[1]).join(',')}
            multiple={multiple}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f && validate(f)) setFile(f)
            }}
          />
        </label>
      )}
      {file && !done && (
        <Button type="button" size="sm" disabled={uploading} onClick={handleUpload}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      )}
    </div>
  )
}
