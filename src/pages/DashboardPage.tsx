import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { storeService } from '../services/storeService'
import { categoryService } from '../services/categoryService'
import { brandService } from '../services/brandService'
import { Badge } from '../components/ui/Badge'
import { getStoreReadiness } from '../lib/storeReadiness'
import { businessApprovalService } from '../services/businessApprovalService'
import { suspensionService } from '../services/suspensionService'

function StatCard({ icon, tone, label, value, note }: { icon: string; tone: string; label: string; value: number | string; note: string }) {
  return (
    <article className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
      <div>
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{note}</p>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tone}`}>
        <i className={icon} />
      </div>
    </article>
  )
}

export const DashboardPage: React.FC = () => {
  const { data: pendingBusinesses = [] } = useQuery({
    queryKey: ['pendingBusinesses'],
    queryFn: businessApprovalService.pending,
  })
  // Queries
  const { data: pendingStores = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  const { data: storesNeedingChanges = [] } = useQuery({
    queryKey: ['marketplaceStoresNeedingChanges'],
    queryFn: () => storeService.getMarketplaceStoresNeedingChanges(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getMarketplaceCategories(),
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getBrands(),
  })

  // Platform overview counts stores across all businesses.
  const { data: adminStores = [] } = useQuery({
    queryKey: ['adminStoresDirectory'],
    queryFn: () => suspensionService.stores('', ''),
  })

  const approvedCount = adminStores.filter(
    (s) => s.marketplaceStatus === 'APPROVED'
  ).length

  const mixTotal = Math.max(approvedCount + pendingStores.length + categories.length + brands.length, 1)
  const mix = [
    { label: 'Approved Stores', value: approvedCount, color: 'bg-emerald-500' },
    { label: 'Pending Review', value: pendingStores.length, color: 'bg-amber-400' },
    { label: 'Categories', value: categories.length, color: 'bg-brand' },
    { label: 'Verified Brands', value: brands.length, color: 'bg-sky-400' },
  ]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#514ab0] via-brand to-[#8b84e8] text-white shadow-lg shadow-brand/25">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Cambodia marketplace</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">Overview</h1>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Platform operations, merchant review queue, and catalog directory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/approvals" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand shadow-sm hover:bg-white/90">
              <i className="ri-verified-badge-line" />
              <span>Review Queue</span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs">{pendingBusinesses.length + pendingStores.length}</span>
            </Link>
            <Link to="/categories" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25">
              Manage Categories
            </Link>
          </div>
        </div>
      </section>

      {(pendingBusinesses.length > 0 || pendingStores.length > 0 || storesNeedingChanges.length > 0) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <i className="ri-error-warning-line text-lg" />
            </div>
            <div className="text-sm text-amber-950">
              <div className="font-bold">
                <span>{pendingBusinesses.length}</span> merchant accounts and <span>{pendingStores.length}</span> store listings need review
              </div>
              <div className="text-amber-800">
                {storesNeedingChanges.length} {storesNeedingChanges.length === 1 ? 'merchant is' : 'merchants are'} waiting for requested updates.
              </div>
            </div>
          </div>
          <Link to="/approvals" className="self-start rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark sm:self-auto">
            Open Review Queue
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="ri-time-line" tone="bg-amber-50 text-amber-600" label="Pending Review" value={loadingPending ? '—' : pendingStores.length} note={pendingStores.length === 0 ? 'Queue is clear' : 'Awaiting admin decision'} />
        <StatCard icon="ri-store-2-line" tone="bg-emerald-50 text-emerald-600" label="Approved Stores" value={approvedCount} note="Live on marketplace" />
        <StatCard icon="ri-folder-shared-line" tone="bg-brand-soft text-brand" label="Categories" value={categories.length} note="Standard taxonomies" />
        <StatCard icon="ri-price-tag-3-line" tone="bg-sky-50 text-sky-600" label="Verified Brands" value={brands.length} note="Product manufacturers" />
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Catalog mix</h2>
            <p className="mt-0.5 text-xs text-muted">Approved stores, the review queue, categories, and brands.</p>
          </div>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#f3f4f8]">
          {mix.map((part) => (
            <div key={part.label} className={part.color} style={{ width: `${(part.value / mixTotal) * 100}%` }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {mix.map((part) => (
            <div key={part.label} className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span className={`h-2.5 w-2.5 rounded-full ${part.color}`} />
              <span>{part.label}</span>
              <span className="ml-auto text-ink">{part.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Applications Section */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Merchant Applications
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Stores requesting permission to publish catalog items to the public consumer portal.
            </p>
          </div>
          {pendingStores.length > 0 && (
            <Link
              to="/approvals"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition"
            >
              <span>View all ({pendingStores.length})</span>
              <i className="ri-arrow-right-line text-xs" />
            </Link>
          )}
        </div>

        {loadingPending ? (
          <div className="p-12 text-center text-zinc-400">
            <i className="ri-loader-4-line text-2xl animate-spin inline-block text-zinc-500 mb-2" />
            <div className="text-xs font-medium">Checking application queue...</div>
          </div>
        ) : pendingStores.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto text-xl mb-2">
              <i className="ri-check-line" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900">Review Queue Clear</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-0.5">
              All merchant applications have been reviewed. New submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/75 text-zinc-500 font-medium text-[11px] uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-2.5">Store / Merchant</th>
                  <th className="px-5 py-2.5">Type & Location</th>
                  <th className="px-5 py-2.5">Applied Date</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendingStores.slice(0, 5).map((store) => (
                  <tr key={store.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-zinc-900">{store.name}</div>
                      <div className="text-zinc-400 text-[11px] font-mono mt-0.5">
                        {store.code} • Business #{store.businessId}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-zinc-700">{store.storeType || 'General Retail'}</div>
                      <div className="text-zinc-500 text-[11px]">{store.salesChannel === 'POS' ? 'POS only' : store.salesChannel === 'ONLINE' ? 'Online store only' : 'POS + Online'}</div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">
                        {store.city || store.addressLine1 || 'Phnom Penh'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 font-mono text-[11px]">
                      {store.marketplaceAppliedAt
                        ? new Date(store.marketplaceAppliedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="amber" dot>
                        Pending Review
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${getStoreReadiness(store).ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                          {getStoreReadiness(store).items.length - getStoreReadiness(store).missing.length}/{getStoreReadiness(store).items.length} ready
                        </span>
                        <Link to="/approvals" className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-2xs">Review</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Directory Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categories Preview */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900">Platform Categories</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Taxonomies available on marketplace</p>
              </div>
              <Link to="/categories" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
                View all →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {categories.slice(0, 4).map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden text-[11px] text-zinc-500">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <i className="ri-folder-line" />
                      )}
                    </div>
                    <span className="font-medium text-zinc-800 truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {cat.code || `#${cat.id}`}
                  </span>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-xs text-zinc-400 py-4 text-center">No categories created yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Brands Preview */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-xs font-semibold text-zinc-900">Registered Brands</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Brand manufacturers</p>
              </div>
              <Link to="/brands" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
                View all →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {brands.slice(0, 4).map((brand) => (
                <div key={brand.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden text-[11px] text-zinc-500">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <i className="ri-price-tag-3-line" />
                      )}
                    </div>
                    <span className="font-medium text-zinc-800 truncate">{brand.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {brand.code || `#${brand.id}`}
                  </span>
                </div>
              ))}
              {brands.length === 0 && (
                <div className="text-xs text-zinc-400 py-4 text-center">No brands registered yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
