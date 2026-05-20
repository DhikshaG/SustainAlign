import clsx from 'clsx'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  as: Component = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0',
  }
  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  }
  return (
    <Component
      className={clsx(base, variants[variant], variant !== 'link' && sizes[size], className)}
      {...props}
    >
      {children}
    </Component>
  )
}
