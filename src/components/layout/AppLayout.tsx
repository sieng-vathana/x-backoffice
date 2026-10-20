import React, { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { RealtimeBridge } from '../realtime/RealtimeBridge'
import { storeService } from '../../services/storeService'
import { businessApprovalService } from '../../services/businessApprovalService'
import { LocaleSwitcher } from '../../i18n/LocaleSwitcher'
import { lookup } from '../../i18n/LocaleContext'

type NavItem = {
  to: string
  label: string
  icon: string
  activeIcon: string
  end?: boolean
  badge?: number | null
  preview?: boolean
}

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('bo.sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const { data: pendingStores = [] } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  const { data: pendingBusinesses = [] } = useQuery({
    queryKey: ['pendingBusinesses'],
    queryFn: businessApprovalService.pending,
  })
  // Both lists reload when a merchant signs up or applies, pushed through RealtimeBridge.

  const pendingCount = pendingStores.length + pendingBusinesses.length

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(true)
      return
    }
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem('bo.sidebar', next ? 'collapsed' : 'open')
      } catch {
        // Storage unavailable
      }
      return next
    })
  }

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Workspace',
      items: [
        { to: '/', label: 'Overview', icon: 'ri-dashboard-3-line', activeIcon: 'ri-dashboard-3-fill', end: true },
        { to: '/operations/orders', label: 'Order control', icon: 'ri-shopping-bag-3-line', activeIcon: 'ri-shopping-bag-3-fill', preview: true },
        { to: '/operations/reports', label: 'Platform reports', icon: 'ri-line-chart-line', activeIcon: 'ri-line-chart-fill', preview: true },
      ],
    },
    {
      label: 'Merchant network',
      items: [
        { to: '/approvals', label: 'Merchant approvals', icon: 'ri-verified-badge-line', activeIcon: 'ri-verified-badge-fill', badge: pendingCount > 0 ? pendingCount : null },
        { to: '/stores', label: 'Stores directory', icon: 'ri-store-2-line', activeIcon: 'ri-store-2-fill' },
        { to: '/merchants', label: 'Merchant control', icon: 'ri-shield-user-line', activeIcon: 'ri-shield-user-fill' },
      ],
    },
    {
      label: 'Marketplace catalog',
      items: [
        { to: '/categories', label: 'Categories', icon: 'ri-folder-shared-line', activeIcon: 'ri-folder-shared-fill' },
        { to: '/brands', label: 'Brands', icon: 'ri-price-tag-3-line', activeIcon: 'ri-price-tag-3-fill' },
      ],
    },
    {
      label: 'Customer & fulfillment',
      items: [
        { to: '/operations/customers', label: 'Customers', icon: 'ri-user-heart-line', activeIcon: 'ri-user-heart-fill', preview: true },
        { to: '/delivery-setup', label: 'Delivery providers', icon: 'ri-e-bike-2-line', activeIcon: 'ri-e-bike-2-fill' },
        { to: '/operations/delivery', label: 'Delivery operations', icon: 'ri-route-line', activeIcon: 'ri-route-fill', preview: true },
      ],
    },
    {
      label: 'Finance',
      items: [
        { to: '/operations/payments', label: 'Payments & settlements', icon: 'ri-bank-card-line', activeIcon: 'ri-bank-card-fill', preview: true },
      ],
    },
  ]

  const routeLabels: Record<string, string> = {
    '/': 'Overview',
    '/approvals': 'Merchant approvals',
    '/stores': 'Stores directory',
    '/merchants': 'Merchant control',
    '/categories': 'Categories',
    '/brands': 'Brands',
    '/delivery-setup': 'Delivery providers',
    '/operations/orders': 'Order control',
    '/operations/customers': 'Customers',
    '/operations/delivery': 'Delivery operations',
    '/operations/payments': 'Payments & settlements',
    '/operations/reports': 'Platform reports',
  }
  const pageLabel = routeLabels[location.pathname] ?? 'Admin workspace'
  const searchable = useMemo(() => navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))), [pendingCount])
  const results = query.trim()
    ? searchable.filter((item) => {
        const needle = query.trim().toLowerCase()
        const khmer = (lookup(item.label) ?? '').toLowerCase()
        return item.label.toLowerCase().includes(needle) || khmer.includes(needle)
      })
    : []

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false)
      if (userRef.current && !userRef.current.contains(event.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setQuery('')
    setUserOpen(false)
  }, [location.pathname])

  const displayName = user?.fullName || user?.username || 'Administrator'
  const initials = (user?.username || 'AD').substring(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-canvas text-ink antialiased">
      <RealtimeBridge />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#1b2138]/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#1b2138] text-slate-300 transition-all duration-200 lg:static ${
          collapsed ? 'lg:w-[84px]' : ''
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-[68px] items-center justify-between gap-2 border-b border-white/10 px-4">
          <div className={`flex min-w-0 items-center gap-3 ${collapsed ? 'lg:mx-auto' : ''}`}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-sm font-extrabold text-white shadow-lg shadow-brand/40">
              X
            </div>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <div className="text-sm font-extrabold leading-none text-white">X Platform</div>
              <div className="mt-1 text-[11px] text-slate-400">Backoffice</div>
            </div>
          </div>
          <button type="button" className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <section key={group.label}>
              <div className={`px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 ${collapsed ? 'lg:hidden' : ''}`}>
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${
                        collapsed ? 'lg:justify-center lg:px-0' : ''
                      } ${isActive ? 'bg-brand text-white shadow-md shadow-black/20' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <i className={`text-lg leading-none ${isActive ? item.activeIcon : item.icon}`} />
                        <span className={`min-w-0 flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                        <span className={`flex shrink-0 items-center gap-1 ${collapsed ? 'lg:hidden' : ''}`}>
                          {item.preview && (
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${isActive ? 'bg-white/15 text-white' : 'bg-white/8 text-slate-400'}`}>
                              Preview
                            </span>
                          )}
                          {item.badge ? (
                            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">{item.badge}</span>
                          ) : null}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">
              {initials}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate text-sm font-bold text-white">{displayName}</div>
              <div className="truncate text-[11px] text-slate-400">Platform Admin</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className={`rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 ${collapsed ? 'lg:hidden' : ''}`}
            >
              <i className="ri-logout-box-r-line" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-line bg-white px-4 shadow-[0_1px_2px_rgba(56,65,74,0.05)] sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-brand-soft hover:text-brand"
            >
              <i className="ri-menu-2-line text-lg" />
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-sm font-semibold text-muted sm:flex">
              <span>Backoffice</span>
              <i className="ri-arrow-right-s-line text-base text-slate-300" />
              <span className="truncate text-ink">{pageLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div ref={searchRef} className="relative hidden md:block">
              <label className="flex h-10 w-64 items-center gap-2 rounded-full border border-line bg-[#f6f7fb] px-3 text-sm text-muted focus-within:border-brand lg:w-72">
                <i className="ri-search-line" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search pages"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
                />
              </label>
              {searchOpen && query.trim() && (
                <div className="absolute right-0 z-40 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl">
                  {results.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-muted">No matching pages</div>
                  ) : (
                    results.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => navigate(item.to)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-brand-soft"
                      >
                        <i className={`${item.icon} text-brand`} />
                        <span>{item.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <LocaleSwitcher />

            <NavLink
              to="/approvals"
              title="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-brand"
            >
              <i className="ri-notification-3-line text-lg" />
              {pendingCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>

            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => setUserOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[#f6f7fb]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">{initials}</span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-32 truncate text-sm font-bold leading-tight text-ink">{displayName}</span>
                  <span className="block text-[11px] text-muted">Platform Admin</span>
                </span>
                <i className="ri-arrow-down-s-line hidden text-muted lg:block" />
              </button>
              {userOpen && (
                <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-white py-1 shadow-xl">
                  <div className="border-b border-line px-3 py-2">
                    <div className="truncate text-sm font-bold text-ink">{displayName}</div>
                    <div className="text-xs text-muted">Platform Admin</div>
                  </div>
                  <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    <i className="ri-logout-box-r-line" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {pendingCount > 0 && location.pathname !== '/approvals' && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6">
            <span className="flex items-center gap-2 font-semibold">
              <i className="ri-error-warning-line" />
              <span>{pendingCount}</span>
              <span>{pendingCount > 1 ? 'Pending Approvals' : 'Pending Approval'}</span>
            </span>
            <NavLink to="/approvals" className="font-bold text-brand hover:text-brand-dark">
              Open the review queue
            </NavLink>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
