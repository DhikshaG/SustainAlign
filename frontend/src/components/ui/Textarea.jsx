import clsx from 'clsx'
import { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea({ className, error, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 min-h-[120px] resize-y',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error ? 'border-red-500' : 'border-slate-300',
        className,
      )}
      {...props}
    />
  )
})
