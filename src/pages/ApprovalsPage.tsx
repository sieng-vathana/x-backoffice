import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storeService } from '../services/storeService'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import type { StoreResponse } from '../types/store'

export const ApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [activeDossier, setActiveDossier] = useState<StoreResponse | null>(null)
  const [approveTarget, setApproveTarget] = useState<StoreResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<StoreResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: pendingStores = [], isLoading, refetch } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  const filteredStores = useMemo(() => {
    if (!search.trim()) return pendingStores
    const term = search.toLowerCase()
    return pendingStores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        (s.city && s.city.toLowerCase().includes(term)) ||
        (s.phone && s.phone.includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term))
    )
  }, [pendingStores, search])

  const approveMutation = useMutation({
    mutationFn: (id: number) => storeService.approveMarketplaceStore(id),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" has been approved for Marketplace!`)
      setApproveTarget(null)
      if (activeDossier?.id === updated.id) setActiveDossier(null)
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
      success(`Store "${updated.name}" marketplace application was rejected.`)
      setRejectTarget(null)
      setRejectReason('')
      if (activeDossier?.id === updated.id) setActiveDossier(null)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to reject store.')
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Merchant Marketplace Approvals</span>
            <Badge variant="amber" dot>
              {pendingStores.length} Pending
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review store details, inspect KYC/location info, and authorize stores to publish products to the consumer marketplace.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 transition"
        >
          <i className="ri-refresh-line text-sm" />
          Refresh Queue
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <i className="ri-search-line text-slate-400 text-base" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pending applications by store name, code, phone, email, or city..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            <i className="ri-close-circle-fill" />
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center text-slate-400">
          <i className="ri-loader-4-line text-3xl animate-spin text-indigo-500 inline-block mb-3" />
          <div className="text-xs font-semibold">Loading merchant applications...</div>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl mb-3">
            <i className="ri-checkbox-circle-line" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {search ? 'No Matching Applications' : 'Queue is Clear'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search
              ? `No pending store matching "${search}". Try clearing search.`
              : 'There are currently no stores waiting for marketplace authorization. All applications have been reviewed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Business #{store.businessId}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{store.name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">Code: {store.code}</div>
                  </div>
                  <Badge variant="amber" dot>
                    Pending Review
                  </Badge>
                </div>

                {/* Quick Info Grid */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Type</span>
                    <span className="text-slate-700 font-semibold">{store.storeType || 'General Retail'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                    <span className="text-slate-700 font-semibold truncate block">
                      {store.city || store.addressLine1 || 'Phnom Penh'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                    <span className="text-slate-700 font-semibold font-mono">{store.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Applied On</span>
                    <span className="text-slate-700 font-semibold">
                      {store.marketplaceAppliedAt
                        ? new Date(store.marketplaceAppliedAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Photos Preview */}
                {store.images && store.images.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase mb-2">
                      Store Photos ({store.images.length})
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {store.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt="Store photo"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDossier(store)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
                >
                  <i className="ri-information-line text-sm" />
                  Inspect Dossier
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(store)
                      setRejectReason('')
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveTarget(store)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5"
                  >
                    <i className="ri-check-line" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Dossier Modal */}
      {activeDossier && (
        <Modal
          isOpen={true}
          onClose={() => setActiveDossier(null)}
          title={`Merchant Application: ${activeDossier.name}`}
          subtitle={`Business ID #${activeDossier.businessId} • Store Code: ${activeDossier.code}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Status overview */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Status: Awaiting Approval</span>
                <span className="text-[11px] text-amber-700">
                  Application submitted:{' '}
                  {activeDossier.marketplaceAppliedAt
                    ? new Date(activeDossier.marketplaceAppliedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <Badge variant="amber" dot>
                PENDING_REVIEW
              </Badge>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Name</span>
                <span className="text-slate-900 font-bold">{activeDossier.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Code</span>
                <span className="text-slate-800 font-mono font-bold">{activeDossier.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Store Category/Type</span>
                <span className="text-slate-800 font-semibold">{activeDossier.storeType || 'General Retail'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Phone</span>
                <span className="text-slate-800 font-mono font-semibold">{activeDossier.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Alternate Phone</span>
                <span className="text-slate-800 font-mono font-semibold">{activeDossier.alternatePhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                <span className="text-slate-800 font-semibold">{activeDossier.email || 'N/A'}</span>
              </div>
            </div>

            {/* Address & Coordinates */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="text-slate-500 font-bold uppercase text-[10px] block">Location & Address</span>
              <div className="text-slate-800 font-medium">
                {activeDossier.addressLine1 || 'No address specified'}
                {activeDossier.addressLine2 ? `, ${activeDossier.addressLine2}` : ''}
              </div>
              <div className="text-slate-600 text-[11px]">
                {activeDossier.city || 'Phnom Penh'}, {activeDossier.stateProvince || 'Phnom Penh'},{' '}
                {activeDossier.countryCode || 'KHM'} {activeDossier.postalCode ? `(${activeDossier.postalCode})` : ''}
              </div>
              {activeDossier.latitude && activeDossier.longitude && (
                <div className="text-[11px] text-indigo-600 font-mono pt-1">
                  GPS Coordinates: {activeDossier.latitude}, {activeDossier.longitude}
                </div>
              )}
            </div>

            {/* Photos */}
            {activeDossier.images && activeDossier.images.length > 0 && (
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-2">
                  Storefront & Product Photos
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {activeDossier.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                    >
                      <img src={img.url} alt="Store" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                        View Photo
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(activeDossier)
                  setRejectReason('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => setApproveTarget(activeDossier)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5"
              >
                <i className="ri-check-line text-sm" />
                Approve Store
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Approve Dialog */}
      {approveTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setApproveTarget(null)}
          onConfirm={() => approveMutation.mutate(approveTarget.id)}
          title="Approve Store for Marketplace"
          message={`Are you sure you want to approve "${approveTarget.name}" (Business #${approveTarget.businessId})? Once approved, products listed by this store will be eligible to appear on the consumer marketplace home page.`}
          confirmText="Yes, Approve"
          variant="primary"
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Confirm Reject Dialog */}
      {rejectTarget && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setRejectTarget(null)}
          onConfirm={() =>
            rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
          }
          title="Reject Marketplace Application"
          message={`Reject marketplace status for "${rejectTarget.name}"? The merchant can view this reason and resubmit.`}
          confirmText="Reject Application"
          variant="danger"
          isLoading={rejectMutation.isPending}
        >
          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Feedback / Reason (Optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please provide accurate business phone number and clearer storefront image..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[90px]"
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
