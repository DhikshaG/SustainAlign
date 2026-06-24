import clsx from 'clsx'
import { forwardRef } from 'react'

export const Checkbox = forwardRef(function Checkbox({ className, label, id, ...props }, ref) {
  return (
    <label htmlFor={id} className={clsx('flex items-start gap-2 cursor-pointer', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        {...props}
      />
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </label>
  )
})
