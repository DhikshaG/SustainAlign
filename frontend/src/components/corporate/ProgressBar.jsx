export function ProgressBar({ value, max = 100, label, showValue = true, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-slate-600">{label}</span>}
          {showValue && <span className="font-medium text-slate-900">{pct}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
