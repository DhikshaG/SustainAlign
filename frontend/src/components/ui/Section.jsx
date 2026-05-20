import clsx from 'clsx'

export function Section({ className, children, id, bg = 'white', ...props }) {
  const backgrounds = {
    white: 'bg-white',
    slate: 'bg-slate-50',
    primary: 'bg-primary-600 text-white',
  }
  return (
    <section id={id} className={clsx('py-16 sm:py-20 lg:py-24', backgrounds[bg], className)} {...props}>
      {children}
    </section>
  )
}
