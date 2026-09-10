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
        <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Stores & Merchants</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Platform registry of merchant stores, operation status, and marketplace exposure settings.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-zinc-100">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium ${
                  activeTab === tab.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2.5">
          <i className="ri-search-line text-zinc-400 text-sm pl-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores by name, code, business ID, or city..."
            className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-600 text-xs px-1">
              <i className="ri-close-circle-fill" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-zinc-400">
            <i className="ri-loader-4-line text-2xl animate-spin text-zinc-500 inline-block mb-2" />
            <div className="text-xs font-medium">Loading stores directory...</div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-16 text-center text-zinc-500">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl mb-2">
              <i className="ri-store-2-line" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900">No Stores Found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-0.5">
              No stores matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/75 text-zinc-500 font-medium text-[11px] uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-2.5">Store / Business</th>
                  <th className="px-5 py-2.5">Type & City</th>
                  <th className="px-5 py-2.5">Marketplace Status</th>
                  <th className="px-5 py-2.5">POS Status</th>
                  <th className="px-5 py-2.5">Contact</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-zinc-900">{store.name}</div>
                      <div className="text-zinc-400 text-[11px] font-mono mt-0.5">
                        {store.code} • Business #{store.businessId}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-zinc-800">{store.storeType || 'Retail'}</div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">{store.city || 'Phnom Penh'}</div>
                    </td>
                    <td className="px-5 py-3.5">{renderStatusBadge(store.marketplaceStatus)}</td>
                    <td className="px-5 py-3.5">
                      {store.status === 1 ? (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-zinc-700 text-[11px]">{store.phone || '—'}</div>
                      <div className="text-zinc-400 text-[11px] truncate max-w-[140px]">
                        {store.email || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectStore(store)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition"
                        >
                          Inspect
                        </button>
                        {store.marketplaceStatus === 'PENDING_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setApproveTarget(store)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(store)
                                setRejectReason('')
                              }}
                              className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition shadow-2xs"
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
          title={inspectStore.name}
          subtitle={`Store Code: ${inspectStore.code} • Business #${inspectStore.businessId}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-900 block">Marketplace Status</span>
                <span className="text-[11px] text-zinc-500">
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
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs">
                <span className="font-medium text-rose-900 block">Rejection Feedback</span>
                <span className="text-rose-700 mt-0.5 block">{inspectStore.rejectionReason}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Name</span>
                <span className="text-zinc-900 font-medium">{inspectStore.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Code</span>
                <span className="text-zinc-800 font-mono">{inspectStore.code}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Business ID</span>
                <span className="text-zinc-800">#{inspectStore.businessId}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Phone</span>
                <span className="text-zinc-800 font-mono">{inspectStore.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Email</span>
                <span className="text-zinc-800">{inspectStore.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Website</span>
                <span className="text-zinc-800">{inspectStore.website || 'N/A'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <span className="text-zinc-400 font-medium uppercase text-[10px] tracking-wider block">Address</span>
              <div className="text-zinc-900 font-medium">
                {inspectStore.addressLine1 || 'No address provided'}
                {inspectStore.addressLine2 ? `, ${inspectStore.addressLine2}` : ''}
              </div>
              <div className="text-zinc-500 text-[11px]">
                {inspectStore.city || 'Phnom Penh'}, {inspectStore.stateProvince || 'Phnom Penh'},{' '}
                {inspectStore.countryCode || 'KHM'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              {inspectStore.marketplaceStatus === 'PENDING_REVIEW' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(inspectStore)
                      setRejectReason('')
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveTarget(inspectStore)}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800"
                  >
                    Approve Store
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setInspectStore(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200"
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
          confirmText="Approve Store"
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
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 min-h-[80px]"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
