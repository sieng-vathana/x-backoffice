import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storeService } from '../services/storeService'
import { categoryService } from '../services/categoryService'
import { brandService } from '../services/brandService'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import type { StoreResponse } from '../types/store'

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [selectedStore, setSelectedStore] = useState<StoreResponse | null>(null)
  const [rejectStore, setRejectStore] = useState<StoreResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Queries
  const { data: pendingStores = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getMarketplaceCategories(),
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getBrands(),
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => storeService.approveMarketplaceStore(id),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" approved successfully!`)
      setSelectedStore(null)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to approve store.')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      storeService.rejectMarketplaceStore(id, reason),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" application rejected.`)
      setRejectStore(null)
      setRejectReason('')
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to reject store.')
    },
  })

  // Load stores for real count
  const { data: businessStores = { content: [] } } = useQuery({
    queryKey: ['businessStores'],
    queryFn: () => storeService.getStoresByBusiness(1, 0, 100),
  })

  const approvedCount = businessStores.content.filter(
    (s) => s.marketplaceStatus === 'APPROVED'
  ).length

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Platform operations, merchant review queue, and catalog directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/approvals"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-xs flex items-center gap-1.5"
          >
            <i className="ri-verified-badge-line text-sm" />
            <span>Review Queue ({pendingStores.length})</span>
          </Link>
          <Link
            to="/categories"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition shadow-2xs"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Action Banner (When pending > 0) */}
      {pendingStores.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <i className="ri-error-warning-line text-base" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-100">
                {pendingStores.length} merchant application{pendingStores.length > 1 ? 's' : ''} awaiting review
              </div>
              <div className="text-[11px] text-zinc-400">
                New stores cannot publish public listings until authorized by an administrator.
              </div>
            </div>
          </div>
          <Link
            to="/approvals"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-900 bg-white hover:bg-zinc-100 transition whitespace-nowrap shadow-xs"
          >
            Open Review Queue
          </Link>
        </div>
      )}

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">
              {loadingPending ? '—' : pendingStores.length}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            {pendingStores.length === 0 ? 'Queue is clear' : 'Awaiting admin decision'}
          </div>
        </div>

        {/* Approved Stores */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Approved Stores</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">
              {approvedCount}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">Live on marketplace</div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Categories</span>
            <i className="ri-folder-shared-line text-zinc-400 text-sm" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">
              {categories.length}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">Standard taxonomies</div>
        </div>

        {/* Brands */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Verified Brands</span>
            <i className="ri-price-tag-3-line text-zinc-400 text-sm" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">
              {brands.length}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">Product manufacturers</div>
        </div>
      </div>

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
                        <button
                          onClick={() => setSelectedStore(store)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-2xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectStore(store)
                            setRejectReason('')
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition shadow-2xs"
                        >
                          Reject
                        </button>
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

      {/* Confirmation Dialog for Approval */}
      {selectedStore && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          onConfirm={() => approveMutation.mutate(selectedStore.id)}
          title="Approve Merchant Application"
          message={`Are you sure you want to approve "${selectedStore.name}"? Once approved, the merchant's catalog will be eligible to appear on the public marketplace.`}
          confirmText="Approve Store"
          variant="primary"
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Rejection Dialog */}
      {rejectStore && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setRejectStore(null)}
          onConfirm={() =>
            rejectMutation.mutate({ id: rejectStore.id, reason: rejectReason })
          }
          title="Reject Merchant Application"
          message={`Reject application for "${rejectStore.name}". You can optionally provide feedback explaining why:`}
          confirmText="Reject Application"
          variant="danger"
          isLoading={rejectMutation.isPending}
        >
          <div className="pt-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete business documents, invalid product imagery..."
              className="w-full text-xs p-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 min-h-[85px]"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
