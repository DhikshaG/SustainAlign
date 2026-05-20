import { Label } from './Label'

export function FormField({ label, htmlFor, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  )
}
