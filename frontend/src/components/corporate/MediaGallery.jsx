import { Image, FileText, Film, Download } from 'lucide-react'
import { api } from '../../lib/api'

function mimeIcon(mime) {
  if (!mime) return FileText
  if (mime.startsWith('image/')) return Image
  if (mime.startsWith('video/')) return Film
  return FileText
}

function isImage(mime) {
  return mime?.startsWith('image/')
}

export function MediaGallery({ items = [], className = '' }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No media uploaded yet.</p>
  }

  async function handleDownload(item) {
    if (!item.downloadUrl) return
    try {
      const blob = await api.download(item.downloadUrl)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.name || 'download'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(item.downloadUrl, '_blank')
    }
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
      {items.map((item) => {
        const Icon = mimeIcon(item.mime)
        return (
          <div
            key={item.id}
            className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 aspect-square flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center p-2">
              {isImage(item.mime) ? (
                <Icon className="h-10 w-10 text-primary-500" />
              ) : (
                <Icon className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="p-2 border-t border-slate-100 bg-white">
              <p className="text-xs font-medium text-slate-900 truncate" title={item.name}>
                {item.name}
              </p>
              {item.projectName && (
                <p className="text-xs text-slate-500 truncate">{item.projectName}</p>
              )}
            </div>
            {item.downloadUrl && (
              <button
                type="button"
                onClick={() => handleDownload(item)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download"
              >
                <Download className="h-4 w-4 text-slate-600" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
