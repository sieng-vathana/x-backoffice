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

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Operations Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor merchant applications, review store listings, and manage marketplace categories & brands.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Approvals Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <i className="ri-hourglass-2-line text-lg" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loadingPending ? '...' : pendingStores.length}
            </span>
            <span className="text-xs font-semibold text-amber-600">Stores Awaiting Review</span>
          </div>
          <div className="mt-4">
            <Link
              to="/approvals"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
            >
              Open Review Queue <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Marketplace Categories
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <i className="ri-folder-shared-line text-lg" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{categories.length}</span>
            <span className="text-xs font-semibold text-slate-500">Curated Taxonomies</span>
          </div>
          <div className="mt-4">
            <Link
              to="/categories"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
            >
              Manage Taxonomies <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        </div>

        {/* Brands Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Global Brands
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <i className="ri-price-tag-3-line text-lg" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{brands.length}</span>
            <span className="text-xs font-semibold text-slate-500">Registered Brands</span>
          </div>
          <div className="mt-4">
            <Link
              to="/brands"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
            >
              Browse Directory <i className="ri-arrow-right-line" />
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        </div>

        {/* System Architecture Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              BFF Microservice
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <i className="ri-cpu-line text-lg" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">2 Pods</span>
            <span className="text-xs font-semibold text-emerald-600">Replicas Healthy</span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <i className="ri-check-line text-emerald-500" />
              High Availability Enabled
            </span>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
        </div>
      </div>

      {/* Pending Approvals Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <i className="ri-shield-check-line text-indigo-600" />
              Pending Marketplace Applications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize merchants applying to list products on the public marketplace.
            </p>
          </div>
          <Link
            to="/approvals"
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition"
          >
            View All ({pendingStores.length})
          </Link>
        </div>

        {loadingPending ? (
          <div className="p-12 text-center text-slate-400">
            <i className="ri-loader-4-line text-3xl animate-spin inline-block text-indigo-500" />
            <div className="mt-2 text-xs font-medium">Checking application queue...</div>
          </div>
        ) : pendingStores.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl mb-3">
              <i className="ri-check-double-line" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Review Queue Clear</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All merchant registration requests have been reviewed. New applications will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Store / Merchant</th>
                  <th className="px-6 py-3.5">Type & Location</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingStores.slice(0, 5).map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{store.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        Code: {store.code} • Business #{store.businessId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{store.storeType || 'General Retail'}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {store.city || store.addressLine1 || 'Phnom Penh, Cambodia'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {store.marketplaceAppliedAt
                        ? new Date(store.marketplaceAppliedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="amber" dot>
                        Pending Review
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedStore(store)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectStore(store)
                            setRejectReason('')
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
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

      {/* Confirmation Dialog for Approval */}
      {selectedStore && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          onConfirm={() => approveMutation.mutate(selectedStore.id)}
          title="Authorize Merchant Store for Marketplace"
          message={`Are you sure you want to approve "${selectedStore.name}"? Once approved, the merchant's published catalog will be featured on the public marketplace.`}
          confirmText="Yes, Approve Store"
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
          message={`You are rejecting the marketplace application for "${rejectStore.name}". You can optionally specify feedback or reasons for the merchant:`}
          confirmText="Reject Application"
          variant="danger"
          isLoading={rejectMutation.isPending}
        >
          <div className="pt-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete business documents, invalid product imagery..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[90px]"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
