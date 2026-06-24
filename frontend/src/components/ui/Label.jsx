import clsx from 'clsx'

export function Label({ htmlFor, children, required, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx('block text-sm font-medium text-slate-700 mb-1.5', className)}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
