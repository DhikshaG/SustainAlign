import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Shield, ChevronDown, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { adminNavSections } from '../../data/admin/nav'
import { ADMIN_ROUTES, ROUTES } from '../../lib/routes'
import { getRole } from '../../lib/auth'
import { canAccessAdminNavItem } from '../../lib/admin/roles'
import { useAuth } from '../../context/AuthContext'
import { NotificationBell } from '../notifications/NotificationBell'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const role = getRole()

  async function handleLogout() {
    await logout()
    navigate(ROUTES.corporateLogin)
  }

  function isActive(href) {
    if (href === ADMIN_ROUTES.home) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  const visibleSections = adminNavSections
    .map((s) => ({ ...s, items: s.items.filter((i) => canAccessAdminNavItem(role, i.roles)) }))
    .filter((s) => s.items.length > 0)

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-700">
        <Shield className="h-6 w-6 text-slate-100 shrink-0" />
        <span className="font-bold text-white truncate">Platform Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6" aria-label="Admin navigation">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-30">{sidebar}</aside>
      <aside className={clsx('fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>{sidebar}</aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button type="button" className="lg:hidden p-2 text-slate-600" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="flex-1 text-sm font-medium text-slate-700">SustainAlign Platform</span>
          <NotificationBell />
          <div className="relative">
            <button type="button" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-white">{(user?.fullName || user?.email || '?')[0].toUpperCase()}</div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium truncate">{user?.fullName || user?.email}</p>
                    <p className="text-xs text-slate-500">Platform Super Admin</p>
                  </div>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
