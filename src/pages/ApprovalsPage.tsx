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
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <span>Merchant Approvals</span>
            <Badge variant="amber" dot>
              {pendingStores.length} Pending
            </Badge>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review store details, inspect KYC and location info, and authorize stores to publish marketplace listings.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs flex items-center gap-1.5 transition"
        >
          <i className="ri-refresh-line text-sm text-zinc-500" />
          Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs flex items-center gap-2.5">
        <i className="ri-search-line text-zinc-400 text-sm pl-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by store name, code, phone, email, or city..."
          className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-zinc-400 hover:text-zinc-600 text-xs px-1"
          >
            <i className="ri-close-circle-fill" />
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-16 border border-zinc-200 text-center text-zinc-400">
          <i className="ri-loader-4-line text-2xl animate-spin text-zinc-500 inline-block mb-2" />
          <div className="text-xs font-medium">Loading merchant applications...</div>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-xl p-16 border border-zinc-200 text-center">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto text-xl mb-2">
            <i className="ri-check-line" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {search ? 'No Matching Applications' : 'Queue is Clear'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
            {search
              ? `No pending stores matching "${search}".`
              : 'There are currently no stores awaiting marketplace authorization.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 flex flex-col justify-between"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-zinc-900 text-sm">{store.name}</div>
                    <div className="text-zinc-400 text-[11px] font-mono mt-0.5">
                      Code: {store.code} • Business #{store.businessId}
                    </div>
                  </div>
                  <Badge variant="amber" dot>
                    Pending Review
                  </Badge>
                </div>

                {/* Quick Info Grid */}
                <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Type</span>
                    <span className="text-zinc-800 font-medium">{store.storeType || 'General Retail'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Location</span>
                    <span className="text-zinc-800 font-medium truncate block">
                      {store.city || store.addressLine1 || 'Phnom Penh'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Contact Phone</span>
                    <span className="text-zinc-700 font-mono text-[11px]">{store.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Applied Date</span>
                    <span className="text-zinc-700 font-mono text-[11px]">
                      {store.marketplaceAppliedAt
                        ? new Date(store.marketplaceAppliedAt).toLocaleDateString()
                        : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Photos Preview */}
                {store.images && store.images.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider mb-2">
                      Submitted Photos ({store.images.length})
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {store.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt="Store preview"
                          className="w-12 h-12 rounded-md object-cover border border-zinc-200 shrink-0"
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
              <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDossier(store)}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition"
                >
                  <i className="ri-file-list-2-line text-sm text-zinc-400" />
                  Inspect Details
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(store)
                      setRejectReason('')
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition shadow-2xs"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveTarget(store)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-xs flex items-center gap-1"
                  >
                    <i className="ri-check-line text-xs" />
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
          title={activeDossier.name}
          subtitle={`Business ID #${activeDossier.businessId} • Store Code: ${activeDossier.code}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Status overview */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-900 block">Status: Awaiting Review</span>
                <span className="text-[11px] text-zinc-500">
                  Applied:{' '}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Name</span>
                <span className="text-zinc-900 font-medium">{activeDossier.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Code</span>
                <span className="text-zinc-800 font-mono">{activeDossier.code}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Store Type</span>
                <span className="text-zinc-800">{activeDossier.storeType || 'General Retail'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Phone</span>
                <span className="text-zinc-800 font-mono">{activeDossier.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Alt Phone</span>
                <span className="text-zinc-800 font-mono">{activeDossier.alternatePhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider">Email</span>
                <span className="text-zinc-800">{activeDossier.email || 'N/A'}</span>
              </div>
            </div>

            {/* Address & Coordinates */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1 text-xs">
              <span className="text-zinc-400 font-medium uppercase text-[10px] tracking-wider block">Address</span>
              <div className="text-zinc-900 font-medium">
                {activeDossier.addressLine1 || 'No address specified'}
                {activeDossier.addressLine2 ? `, ${activeDossier.addressLine2}` : ''}
              </div>
              <div className="text-zinc-500 text-[11px]">
                {activeDossier.city || 'Phnom Penh'}, {activeDossier.stateProvince || 'Phnom Penh'},{' '}
                {activeDossier.countryCode || 'KHM'} {activeDossier.postalCode ? `(${activeDossier.postalCode})` : ''}
              </div>
              {activeDossier.latitude && activeDossier.longitude && (
                <div className="text-[11px] text-zinc-600 font-mono pt-1">
                  GPS: {activeDossier.latitude}, {activeDossier.longitude}
                </div>
              )}
            </div>

            {/* Photos */}
            {activeDossier.images && activeDossier.images.length > 0 && (
              <div>
                <span className="text-zinc-400 block text-[10px] font-medium uppercase tracking-wider mb-2">
                  Storefront & Product Photos
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {activeDossier.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block group relative rounded-lg overflow-hidden border border-zinc-200 aspect-video bg-zinc-100"
                    >
                      <img src={img.url} alt="Store" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-medium transition">
                        View Full Photo
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(activeDossier)
                  setRejectReason('')
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => setApproveTarget(activeDossier)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition shadow-xs flex items-center gap-1.5"
              >
                <i className="ri-check-line text-xs" />
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
          message={`Approve "${approveTarget.name}" (Business #${approveTarget.businessId})? Once approved, products listed by this merchant will be eligible to appear on the consumer marketplace.`}
          confirmText="Approve Store"
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
          message={`Reject application for "${rejectTarget.name}". You can select a template reason or enter custom notes:`}
          confirmText="Reject Application"
          variant="danger"
          isLoading={rejectMutation.isPending}
        >
          <div className="pt-2 space-y-2">
            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Incomplete business documentation',
                'Storefront photo invalid/unclear',
                'Unverifiable phone or contact',
                'Duplicate merchant registration',
              ].map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition ${
                    rejectReason === reason
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

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
