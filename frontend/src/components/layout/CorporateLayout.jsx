import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Leaf, Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { corporateNavSections } from '../../data/corporate/nav'
import { CORPORATE_ROUTES, ROUTES } from '../../lib/routes'
import { getRole } from '../../lib/auth'
import { canAccessNavItem } from '../../lib/corporate/roles'
import { useAuth } from '../../context/AuthContext'
import { dashboardSummary } from '../../data/corporate/dashboard'

export function CorporateLayout() {
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
    if (href === CORPORATE_ROUTES.home) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const visibleSections = corporateNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessNavItem(role, item.roles)),
    }))
    .filter((section) => section.items.length > 0)

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-200">
        <Leaf className="h-6 w-6 text-primary-600 shrink-0" />
        <span className="font-bold text-slate-900 truncate">SustainAlign</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6" aria-label="Corporate navigation">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.label}
            </p>
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
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white z-30">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button
            type="button"
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search projects, NGOs..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              readOnly
            />
          </div>

          <div className="flex-1 sm:flex-none" />

          <span className="hidden md:inline text-sm text-slate-500 truncate max-w-[160px]">
            {user?.tenantName || 'Corporate'}
          </span>

          <button type="button" className="relative p-2 text-slate-600 hover:text-slate-900" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {dashboardSummary.notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {dashboardSummary.notificationCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700">
                {(user?.fullName || user?.email || '?')[0].toUpperCase()}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.fullName || user?.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
