import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Leaf } from 'lucide-react'
import { Button } from '../ui/Button'
import { Container } from '../ui/Container'
import { primaryNav, footerNav } from '../../data/nav'
import { ROUTES } from '../../lib/routes'

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to={ROUTES.home} className="flex items-center gap-2 font-bold text-slate-900">
            <Leaf className="h-6 w-6 text-primary-600" />
            <span>SustainAlign</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname === item.href ? 'text-primary-600' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button as={Link} to={ROUTES.corporateLogin} variant="ghost" size="sm">
              Log in
            </Button>
            <Button as={Link} to={ROUTES.demo} size="sm">
              Book a Demo
            </Button>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden pb-4 space-y-2" aria-label="Mobile navigation">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block py-2 text-sm font-medium text-slate-600 hover:text-primary-600"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Button as={Link} to={ROUTES.corporateLogin} variant="secondary" size="sm">
                Log in
              </Button>
              <Button as={Link} to={ROUTES.demo} size="sm">
                Book a Demo
              </Button>
            </div>
          </nav>
        )}
      </Container>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <Container>
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to={ROUTES.home} className="flex items-center gap-2 font-bold text-white mb-4">
              <Leaf className="h-5 w-5 text-primary-400" />
              SustainAlign
            </Link>
            <p className="text-sm text-slate-400">
              AI-powered CSR & ESG management platform for corporates and NGOs.
            </p>
          </div>
          {Object.entries(footerNav).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 capitalize">
                {section}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 py-6 text-sm text-slate-500 text-center">
          &copy; {new Date().getFullYear()} SustainAlign. All rights reserved.
        </div>
      </Container>
    </footer>
  )
}

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
