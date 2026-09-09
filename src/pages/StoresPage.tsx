import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storeService } from '../services/storeService'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import type { MarketplaceStatus, StoreResponse } from '../types/store'

export const StoresPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [inspectStore, setInspectStore] = useState<StoreResponse | null>(null)
  const [approveTarget, setApproveTarget] = useState<StoreResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<StoreResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Load pending stores
  const { data: pendingStores = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  // Load stores from business 1 (and general stores list)
  const { data: businessStores = { content: [] }, isLoading: loadingBusiness } = useQuery({
    queryKey: ['businessStores'],
    queryFn: () => storeService.getStoresByBusiness(1, 0, 100),
  })

  // Merge and deduplicate stores
  const allStores = useMemo(() => {
    const map = new Map<number, StoreResponse>()
    pendingStores.forEach((s) => map.set(s.id, s))
    businessStores.content.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s)
    })
    return Array.from(map.values())
  }, [pendingStores, businessStores])

  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      const matchTab =
        activeTab === 'ALL' ||
        (activeTab === 'PENDING' && store.marketplaceStatus === 'PENDING_REVIEW') ||
        (activeTab === 'APPROVED' && store.marketplaceStatus === 'APPROVED') ||
        (activeTab === 'REJECTED' && store.marketplaceStatus === 'REJECTED') ||
        (activeTab === 'NOT_LISTED' && (store.marketplaceStatus === 'NOT_LISTED' || !store.marketplaceStatus))

      if (!matchTab) return false

      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        store.name.toLowerCase().includes(term) ||
        store.code.toLowerCase().includes(term) ||
        String(store.businessId).includes(term) ||
        (store.city && store.city.toLowerCase().includes(term))
      )
    })
  }, [allStores, activeTab, search])

  const approveMutation = useMutation({
    mutationFn: (id: number) => storeService.approveMarketplaceStore(id),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" approved!`)
      setApproveTarget(null)
      if (inspectStore?.id === updated.id) setInspectStore(updated)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
      queryClient.invalidateQueries({ queryKey: ['businessStores'] })
    },
    onError: (err: any) => error(err.message || 'Failed to approve.'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      storeService.rejectMarketplaceStore(id, reason),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" application rejected.`)
      setRejectTarget(null)
      setRejectReason('')
      if (inspectStore?.id === updated.id) setInspectStore(updated)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
      queryClient.invalidateQueries({ queryKey: ['businessStores'] })
    },
    onError: (err: any) => error(err.message || 'Failed to reject.'),
  })

  const renderStatusBadge = (status: MarketplaceStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="emerald" dot>
            Approved
          </Badge>
        )
      case 'PENDING_REVIEW':
        return (
          <Badge variant="amber" dot>
            Pending Review
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="rose" dot>
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="slate" dot>
            Not Listed
          </Badge>
        )
    }
  }

  const isLoading = loadingPending || loadingBusiness

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stores & Merchants Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete platform registry of merchant stores, their operation status, and marketplace exposure settings.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          {[
            { id: 'ALL', label: 'All Stores', count: allStores.length },
            {
              id: 'PENDING',
              label: 'Pending Review',
              count: allStores.filter((s) => s.marketplaceStatus === 'PENDING_REVIEW').length,
            },
            {
              id: 'APPROVED',
              label: 'Approved',
              count: allStores.filter((s) => s.marketplaceStatus === 'APPROVED').length,
            },
            {
              id: 'REJECTED',
              label: 'Rejected',
              count: allStores.filter((s) => s.marketplaceStatus === 'REJECTED').length,
            },
            {
              id: 'NOT_LISTED',
              label: 'Not Listed',
              count: allStores.filter((s) => s.marketplaceStatus === 'NOT_LISTED' || !s.marketplaceStatus).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <i className="ri-search-line text-slate-400 text-base" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name, code, business ID, or city..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <i className="ri-close-circle-fill text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <i className="ri-loader-4-line text-3xl animate-spin text-indigo-500 inline-block mb-3" />
            <div className="text-xs font-semibold">Loading stores directory...</div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl mb-3">
              <i className="ri-store-2-line" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Stores Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              No stores matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Store / Business</th>
                  <th className="px-6 py-3.5">Type & City</th>
                  <th className="px-6 py-3.5">Marketplace Status</th>
                  <th className="px-6 py-3.5">POS Status</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{store.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        Code: {store.code} • Business #{store.businessId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{store.storeType || 'Retail'}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{store.city || 'Phnom Penh'}</div>
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(store.marketplaceStatus)}</td>
                    <td className="px-6 py-4">
                      {store.status === 1 ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-slate-700 text-[11px]">{store.phone || '—'}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[140px]">
                        {store.email || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectStore(store)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          View
                        </button>
                        {store.marketplaceStatus === 'PENDING_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(store)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(store)
                                setRejectReason('')
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Store Modal */}
      {inspectStore && (
        <Modal
          isOpen={true}
          onClose={() => setInspectStore(null)}
          title={`Store: ${inspectStore.name}`}
          subtitle={`Store Code: ${inspectStore.code} • Business #${inspectStore.businessId}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Marketplace Status</span>
                <span className="text-[11px] text-slate-500">
                  {inspectStore.marketplaceApprovedAt
                    ? `Approved on ${new Date(inspectStore.marketplaceApprovedAt).toLocaleDateString()}`
                    : inspectStore.marketplaceAppliedAt
                    ? `Applied on ${new Date(inspectStore.marketplaceAppliedAt).toLocaleDateString()}`
                    : 'Not applied to marketplace yet'}
                </span>
              </div>
              {renderStatusBadge(inspectStore.marketplaceStatus)}
            </div>

            {inspectStore.rejectionReason && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900 block">Rejection Feedback</span>
                <span className="text-rose-700 mt-0.5 block">{inspectStore.rejectionReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Name</span>
                <span className="text-slate-900 font-bold">{inspectStore.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Code</span>
                <span className="text-slate-800 font-mono font-bold">{inspectStore.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Business ID</span>
                <span className="text-slate-800 font-semibold">#{inspectStore.businessId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                <span className="text-slate-800 font-mono font-semibold">{inspectStore.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Email</span>
                <span className="text-slate-800 font-semibold">{inspectStore.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Website</span>
                <span className="text-slate-800 font-semibold">{inspectStore.website || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Address</span>
              <div className="text-slate-800 font-medium">
                {inspectStore.addressLine1 || 'No address provided'}
                {inspectStore.addressLine2 ? `, ${inspectStore.addressLine2}` : ''}
              </div>
              <div className="text-slate-500 text-[11px]">
                {inspectStore.city || 'Phnom Penh'}, {inspectStore.stateProvince || 'Phnom Penh'},{' '}
                {inspectStore.countryCode || 'KHM'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {inspectStore.marketplaceStatus === 'PENDING_REVIEW' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(inspectStore)
                      setRejectReason('')
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveTarget(inspectStore)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Approve Store
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setInspectStore(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Approve */}
      {approveTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setApproveTarget(null)}
          onConfirm={() => approveMutation.mutate(approveTarget.id)}
          title="Approve Store for Marketplace"
          message={`Are you sure you want to approve "${approveTarget.name}"?`}
          confirmText="Yes, Approve"
          variant="primary"
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Confirm Reject */}
      {rejectTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setRejectTarget(null)}
          onConfirm={() =>
            rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
          }
          title="Reject Marketplace Application"
          message={`Reject application for "${rejectTarget.name}"?`}
          confirmText="Reject Application"
          variant="danger"
          isLoading={rejectMutation.isPending}
        >
          <div className="pt-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[80px]"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
