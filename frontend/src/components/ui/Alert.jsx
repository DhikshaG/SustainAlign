import clsx from 'clsx'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const styles = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
}

export function Alert({ variant = 'info', title, children, className }) {
  const Icon = icons[variant]
  return (
    <div
      role="alert"
      className={clsx('flex gap-3 rounded-lg border p-4', styles[variant], className)}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        {title && <p className="font-medium mb-1">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  )
}
