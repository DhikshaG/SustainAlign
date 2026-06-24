import clsx from 'clsx'

export function StatCard({ label, value, subtext, icon: Icon, trend, className }) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
          {trend && (
            <p className={clsx('mt-1 text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary-50 p-2.5">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        )}
      </div>
    </div>
  )
}
