import React, { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { storeService } from '../../services/storeService'
import { businessApprovalService } from '../../services/businessApprovalService'
import { LocaleSwitcher } from '../../i18n/LocaleSwitcher'

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Query pending approvals count for sidebar badge
  const { data: pendingStores = [] } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
    refetchInterval: 15000,
  })

  const { data: pendingBusinesses = [] } = useQuery({
    queryKey: ['pendingBusinesses'],
    queryFn: businessApprovalService.pending,
    refetchInterval: 15000,
  })

  const pendingCount = pendingStores.length + pendingBusinesses.length

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  const navGroups: { label: string; items: { to: string; label: string; icon: string; activeIcon: string; end?: boolean; badge?: number | null; preview?: boolean }[] }[] = [
    { label: 'Workspace', items: [
      { to: '/', label: 'Overview', icon: 'ri-dashboard-3-line', activeIcon: 'ri-dashboard-3-fill', end: true },
      { to: '/operations/orders', label: 'Order control', icon: 'ri-shopping-bag-3-line', activeIcon: 'ri-shopping-bag-3-fill', preview: true },
      { to: '/operations/reports', label: 'Platform reports', icon: 'ri-line-chart-line', activeIcon: 'ri-line-chart-fill', preview: true },
    ] },
    { label: 'Merchant network', items: [
      { to: '/approvals', label: 'Merchant approvals', icon: 'ri-verified-badge-line', activeIcon: 'ri-verified-badge-fill', badge: pendingCount > 0 ? pendingCount : null },
      { to: '/stores', label: 'Stores directory', icon: 'ri-store-2-line', activeIcon: 'ri-store-2-fill' },
      { to: '/merchants', label: 'Merchant control', icon: 'ri-shield-user-line', activeIcon: 'ri-shield-user-fill' },
    ] },
    { label: 'Marketplace catalog', items: [
      { to: '/categories', label: 'Categories', icon: 'ri-folder-shared-line', activeIcon: 'ri-folder-shared-fill' },
      { to: '/brands', label: 'Brands', icon: 'ri-price-tag-3-line', activeIcon: 'ri-price-tag-3-fill' },
    ] },
    { label: 'Customer & fulfillment', items: [
      { to: '/operations/customers', label: 'Customers', icon: 'ri-user-heart-line', activeIcon: 'ri-user-heart-fill', preview: true },
      { to: '/operations/delivery', label: 'Delivery operations', icon: 'ri-e-bike-2-line', activeIcon: 'ri-e-bike-2-fill', preview: true },
    ] },
    { label: 'Finance', items: [
      { to: '/operations/payments', label: 'Payments & settlements', icon: 'ri-bank-card-line', activeIcon: 'ri-bank-card-fill', preview: true },
    ] },
  ]

  const routeLabels: Record<string, string> = {
    '/': 'Overview', '/approvals': 'Merchant approvals', '/stores': 'Stores directory',
    '/categories': 'Categories', '/brands': 'Brands', '/operations/orders': 'Order control',
    '/operations/customers': 'Customers', '/operations/delivery': 'Delivery operations',
    '/operations/payments': 'Payments & settlements', '/operations/reports': 'Platform reports',
  }
  const pageLabel = routeLabels[location.pathname] ?? 'Admin workspace'

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex text-zinc-800 antialiased">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-zinc-700 flex flex-col border-r border-zinc-200 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
              X
            </div>
            <div className="flex flex-col">
              <div className="font-semibold text-xs text-zinc-900 leading-none flex items-center gap-1.5">
                Backoffice
                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 mt-0.5">Cambodia operations</span>
            </div>
          </div>
          <button
            className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-zinc-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
          {navGroups.map((group) => <section key={group.label} className="mb-4">
            <div className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[.13em] text-zinc-400">{group.label}</div>
            <div className="space-y-0.5">{group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <i className={`text-base leading-none ${isActive ? item.activeIcon : item.icon} ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {'preview' in item && item.preview && <span className="rounded bg-zinc-100 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-500">Preview</span>}
                    {'badge' in item && item.badge && <span className="rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">{item.badge}</span>}
                  </div>
                </>
              )}
            </NavLink>
          ))}</div>
          </section>)}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-2.5 border-t border-zinc-200/80 bg-zinc-50/50">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white transition border border-transparent hover:border-zinc-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs shrink-0">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-900 truncate">
                  {user?.fullName || user?.username || 'Administrator'}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">Platform Admin</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
            >
              <i className="ri-logout-box-r-line text-sm" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"
            >
              <i className="ri-menu-2-line text-lg" />
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span>Backoffice</span>
              <span>/</span>
              <span className="text-zinc-700 font-medium">{pageLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <NavLink
                to="/approvals"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}</span>
              </NavLink>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 px-2 py-1 rounded border border-zinc-200 bg-zinc-50">
              <i className="ri-time-line text-zinc-400" />
              <span>Cambodia · GMT+7</span>
            </div>

            <LocaleSwitcher />
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
