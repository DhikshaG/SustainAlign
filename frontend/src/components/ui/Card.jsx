import clsx from 'clsx'

export function Card({ className, children, padding = true }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        padding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
