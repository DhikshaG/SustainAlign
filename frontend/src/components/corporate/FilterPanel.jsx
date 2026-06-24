import clsx from 'clsx'

export function FilterPanel({ title = 'Filters', children, className }) {
  return (
    <aside className={clsx('rounded-xl border border-slate-200 bg-white p-5', className)}>
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </aside>
  )
}

export function FilterField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      )}
    >
      {label}
    </button>
  )
}
