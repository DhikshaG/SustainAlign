import clsx from 'clsx'

export function Container({ className, children, size = 'default' }) {
  const sizes = {
    narrow: 'max-w-3xl',
    default: 'max-w-7xl',
    wide: 'max-w-[90rem]',
  }
  return (
    <div className={clsx('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size], className)}>
      {children}
    </div>
  )
}
