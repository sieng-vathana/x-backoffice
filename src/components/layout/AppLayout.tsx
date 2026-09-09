import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { storeService } from '../../services/storeService'

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Query pending approvals count for sidebar badge
  const { data: pendingStores = [] } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
    refetchInterval: 15000,
  })

  const pendingCount = pendingStores.length

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: 'ri-dashboard-3-line',
      activeIcon: 'ri-dashboard-3-fill',
      end: true,
    },
    {
      to: '/approvals',
      label: 'Merchant Approvals',
      icon: 'ri-verified-badge-line',
      activeIcon: 'ri-verified-badge-fill',
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      to: '/stores',
      label: 'Stores Directory',
      icon: 'ri-store-2-line',
      activeIcon: 'ri-store-2-fill',
    },
    {
      to: '/categories',
      label: 'Platform Categories',
      icon: 'ri-folder-shared-line',
      activeIcon: 'ri-folder-shared-fill',
    },
    {
      to: '/brands',
      label: 'Global Brands',
      icon: 'ri-price-tag-3-line',
      activeIcon: 'ri-price-tag-3-fill',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <i className="ri-shield-keyhole-line text-lg" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                X PLATFORM
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ADMIN
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Back-Office Console</div>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Management
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <i className={`text-base ${isActive ? item.activeIcon : item.icon}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.fullName || user?.username || 'Administrator'}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Online (Admin)
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/30 transition"
          >
            <i className="ri-logout-box-r-line" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <i className="ri-menu-2-line text-xl" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-900">Control Center</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Operations & Moderation</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <NavLink
                to="/approvals"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition shadow-xs"
              >
                <i className="ri-notification-3-line text-amber-600 animate-bounce" />
                <span>{pendingCount} Merchant Application{pendingCount > 1 ? 's' : ''} Pending</span>
              </NavLink>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <i className="ri-server-line text-indigo-500" />
              <span className="font-semibold text-slate-800">Cluster: x-platform</span>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
