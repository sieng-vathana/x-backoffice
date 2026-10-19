import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storeService } from '../services/storeService'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StoreReadinessPanel } from '../components/StoreReadinessPanel'
import { RequestChangesDialog } from '../components/RequestChangesDialog'
import { useToast } from '../context/ToastContext'
import type { StoreResponse } from '../types/store'
import { getStoreReadiness } from '../lib/storeReadiness'
import { businessApprovalService, type BusinessApproval } from '../services/businessApprovalService'

export const ApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [activeQueue, setActiveQueue] = useState<'PENDING_REVIEW' | 'NEEDS_CHANGES'>('PENDING_REVIEW')
  const [activeDossier, setActiveDossier] = useState<StoreResponse | null>(null)
  const [approveTarget, setApproveTarget] = useState<StoreResponse | null>(null)
  const [rejectTarget, setRejectTarget] = useState<StoreResponse | null>(null)
  const [requestChangesTarget, setRequestChangesTarget] = useState<StoreResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [businessSearch, setBusinessSearch] = useState('')
  const [approveBusinessTarget, setApproveBusinessTarget] = useState<BusinessApproval | null>(null)
  const [rejectBusinessTarget, setRejectBusinessTarget] = useState<BusinessApproval | null>(null)
  const [businessRejectReason, setBusinessRejectReason] = useState('')

  const { data: pendingBusinesses = [], isLoading: loadingBusinesses, isError: businessesFailed, refetch: refetchBusinesses } = useQuery({
    queryKey: ['pendingBusinesses'],
    queryFn: businessApprovalService.pending,
  })

  const approveBusinessMutation = useMutation({
    mutationFn: businessApprovalService.approve,
    onSuccess: (business) => {
      success(`Merchant "${business.name}" approved. Its stores can now be reviewed for the marketplace.`)
      setApproveBusinessTarget(null)
      queryClient.invalidateQueries({ queryKey: ['pendingBusinesses'] })
    },
    onError: (err: Error) => error(err.message || 'Failed to approve merchant.'),
  })

  const rejectBusinessMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => businessApprovalService.reject(id, reason),
    onSuccess: (business) => {
      success(`Merchant "${business.name}" was rejected.`)
      setRejectBusinessTarget(null)
      setBusinessRejectReason('')
      queryClient.invalidateQueries({ queryKey: ['pendingBusinesses'] })
    },
    onError: (err: Error) => error(err.message || 'Failed to reject merchant.'),
  })

  const { data: pendingStores = [], isLoading, refetch } = useQuery({
    queryKey: ['pendingStores'],
    queryFn: () => storeService.getPendingMarketplaceStores(),
  })

  const { data: storesNeedingChanges = [], isLoading: loadingChanges, refetch: refetchChanges } = useQuery({
    queryKey: ['marketplaceStoresNeedingChanges'],
    queryFn: () => storeService.getMarketplaceStoresNeedingChanges(),
  })

  const activeStores = activeQueue === 'PENDING_REVIEW' ? pendingStores : storesNeedingChanges

  const filteredStores = useMemo(() => {
    if (!search.trim()) return activeStores
    const term = search.toLowerCase()
    return activeStores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        (s.city && s.city.toLowerCase().includes(term)) ||
        (s.phone && s.phone.includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term))
    )
  }, [activeStores, search])

  const approveMutation = useMutation({
    mutationFn: (id: number) => storeService.approveMarketplaceStore(id),
    onSuccess: (updated) => {
      success(`Store "${updated.name}" has been approved for Marketplace!`)
      setApproveTarget(null)
      if (activeDossier?.id === updated.id) setActiveDossier(null)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
      queryClient.invalidateQueries({ queryKey: ['marketplaceStoresNeedingChanges'] })
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
      queryClient.invalidateQueries({ queryKey: ['marketplaceStoresNeedingChanges'] })
    },
    onError: (err: any) => {
      error(err.message || 'Failed to reject store.')
    },
  })

  const requestChangesMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => storeService.requestMarketplaceChanges(id, reason),
    onSuccess: (updated) => {
      success(`Update request sent to "${updated.name}".`)
      setRequestChangesTarget(null)
      if (activeDossier?.id === updated.id) setActiveDossier(null)
      queryClient.invalidateQueries({ queryKey: ['pendingStores'] })
      queryClient.invalidateQueries({ queryKey: ['marketplaceStoresNeedingChanges'] })
    },
    onError: (err: any) => error(err.message || 'Failed to request merchant updates.'),
  })

  const approveReadyStore = (store: StoreResponse) => getStoreReadiness(store).ready
  const openRequestChanges = (store: StoreResponse) => {
    setActiveDossier(null)
    setRequestChangesTarget(store)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <span>Merchant Approvals</span>
            <Badge variant="amber" dot>
              {pendingBusinesses.length + pendingStores.length} To review
            </Badge>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review new merchant accounts first, then approve each store listing when it is ready.
          </p>
        </div>

        <button
          onClick={() => { void refetchBusinesses(); void refetch(); void refetchChanges() }}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs flex items-center gap-1.5 transition"
        >
          <i className="ri-refresh-line text-sm text-zinc-500" />
          Refresh
        </button>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">New merchant accounts</h2>
            <p className="text-xs text-zinc-500">New businesses stay pending until a backoffice administrator approves them.</p>
          </div>
          <Badge variant="amber" dot>{pendingBusinesses.length} pending</Badge>
        </div>
        <input
          value={businessSearch}
          onChange={(event) => setBusinessSearch(event.target.value)}
          placeholder="Search merchant name, code, or owner ID"
          aria-label="Search merchant accounts"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
        {loadingBusinesses ? <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading merchants...</div>
          : businessesFailed ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Could not load merchant applications. <button type="button" onClick={() => void refetchBusinesses()} className="font-semibold underline">Retry</button></div>
          : pendingBusinesses.filter((business) => `${business.name} ${business.code} ${business.ownerUserId}`.toLowerCase().includes(businessSearch.toLowerCase())).length === 0
            ? <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">No pending merchant accounts.</div>
            : <div className="grid gap-3 md:grid-cols-2">
              {pendingBusinesses.filter((business) => `${business.name} ${business.code} ${business.ownerUserId}`.toLowerCase().includes(businessSearch.toLowerCase())).map((business) => (
                <div key={business.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-sm font-semibold text-zinc-900">{business.name}</h3><p className="mt-1 text-xs text-zinc-500">{business.code} / Owner #{business.ownerUserId} / Business #{business.id}</p></div>
                    <Badge variant="amber" dot>Pending</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-600">
                    <div><span className="block text-zinc-400">Tax registration</span>{business.taxRegistrationNumber || 'Not provided'}</div>
                    <div><span className="block text-zinc-400">Currency / timezone</span>{business.defaultCurrencyCode} / {business.timeZone}</div>
                    <div><span className="block text-zinc-400">Registered</span>{business.createdAt ? new Date(business.createdAt).toLocaleString() : 'N/A'}</div>
                    <div><span className="block text-zinc-400">Plan chosen</span>{business.plan ? `${business.plan.charAt(0)}${business.plan.slice(1).toLowerCase()} · ${business.billingCycle?.toUpperCase() === 'YEARLY' ? 'yearly' : 'monthly'}` : 'Not chosen'}</div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-4">
                    <button type="button" onClick={() => { setRejectBusinessTarget(business); setBusinessRejectReason('') }} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50">Reject</button>
                    <button type="button" onClick={() => setApproveBusinessTarget(business)} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800">Approve merchant</button>
                  </div>
                </div>
              ))}
            </div>}
      </section>

      <h2 className="text-base font-semibold text-zinc-900">Store listing applications</h2>

      {/* Review queues and search */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
          <button type="button" onClick={() => setActiveQueue('PENDING_REVIEW')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${activeQueue === 'PENDING_REVIEW' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            <i className="ri-inbox-line" /> Needs review <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeQueue === 'PENDING_REVIEW' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-600'}`}>{pendingStores.length}</span>
          </button>
          <button type="button" onClick={() => setActiveQueue('NEEDS_CHANGES')} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${activeQueue === 'NEEDS_CHANGES' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            <i className="ri-time-line" /> Waiting for merchant <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeQueue === 'NEEDS_CHANGES' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-600'}`}>{storesNeedingChanges.length}</span>
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <i className="ri-search-line text-zinc-400 text-sm pl-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by store name, code, phone, email, or city..."
            className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="text-zinc-400 hover:text-zinc-600 text-xs px-1"><i className="ri-close-circle-fill" /></button>}
        </div>
      </div>

      {/* Content */}
      {isLoading || (activeQueue === 'NEEDS_CHANGES' && loadingChanges) ? (
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
            {search ? 'No Matching Applications' : activeQueue === 'NEEDS_CHANGES' ? 'No merchants waiting to update' : 'Queue is Clear'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
            {search
              ? `No pending stores matching "${search}".`
              : activeQueue === 'NEEDS_CHANGES' ? 'Requested updates will appear here until the merchant resubmits.' : 'There are currently no stores awaiting marketplace authorization.'}
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
                  <Badge variant={activeQueue === 'PENDING_REVIEW' ? 'amber' : 'blue'} dot>
                    {activeQueue === 'PENDING_REVIEW' ? 'Pending Review' : 'Waiting for Merchant'}
                  </Badge>
                </div>

                <div className="mt-3">
                  <StoreReadinessPanel store={store} compact />
                </div>

                {activeQueue === 'NEEDS_CHANGES' && store.rejectionReason ? (
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-[11px] leading-relaxed text-sky-900">
                    <strong className="block">Update request sent to merchant</strong>{store.rejectionReason}
                  </div>
                ) : null}

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

                {activeQueue === 'PENDING_REVIEW' ? <div className="flex flex-wrap items-center justify-end gap-2">
                  <button type="button" onClick={() => openRequestChanges(store)} className="px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-medium text-amber-800 shadow-2xs transition hover:bg-amber-50">Request updates</button>
                  <button type="button" onClick={() => { setRejectTarget(store); setRejectReason('') }} className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-medium text-rose-700 shadow-2xs transition hover:bg-rose-50">Reject</button>
                  <button type="button" disabled={!approveReadyStore(store)} title={!approveReadyStore(store) ? 'Complete the listing checklist before approval.' : undefined} onClick={() => setApproveTarget(store)} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300">
                    <i className="ri-check-line text-xs" />{approveReadyStore(store) ? 'Approve' : 'Complete checklist'}
                  </button>
                </div> : <span className="text-[11px] text-zinc-500">Waiting for merchant resubmission</span>}
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
                <span className="text-xs font-medium text-zinc-900 block">Status: {activeDossier.marketplaceStatus === 'NEEDS_CHANGES' ? 'Waiting for merchant updates' : 'Awaiting review'}</span>
                <span className="text-[11px] text-zinc-500">
                  Applied:{' '}
                  {activeDossier.marketplaceAppliedAt
                    ? new Date(activeDossier.marketplaceAppliedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              <Badge variant={activeDossier.marketplaceStatus === 'NEEDS_CHANGES' ? 'blue' : 'amber'} dot>
                {activeDossier.marketplaceStatus === 'NEEDS_CHANGES' ? 'NEEDS_CHANGES' : 'PENDING_REVIEW'}
              </Badge>
            </div>

            <StoreReadinessPanel store={activeDossier} />

            {activeDossier.marketplaceStatus === 'NEEDS_CHANGES' && activeDossier.rejectionReason ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3.5 text-xs leading-relaxed text-sky-900">
                <span className="mb-1 block font-semibold">Update request sent to merchant</span>{activeDossier.rejectionReason}
              </div>
            ) : null}

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
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
              {activeDossier.marketplaceStatus === 'PENDING_REVIEW' ? <>
                <button type="button" onClick={() => openRequestChanges(activeDossier)} className="px-3.5 py-1.5 rounded-lg border border-amber-200 bg-white text-xs font-medium text-amber-800 hover:bg-amber-50 transition">Request updates</button>
                <button type="button" onClick={() => { setRejectTarget(activeDossier); setRejectReason('') }} className="px-3.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-medium text-rose-700 hover:bg-rose-50 transition">Reject application</button>
                <button
                  type="button"
                  disabled={!approveReadyStore(activeDossier)}
                  title={!approveReadyStore(activeDossier) ? 'Complete the listing checklist before approval.' : undefined}
                  onClick={() => setApproveTarget(activeDossier)}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  <i className="ri-check-line text-xs" />{approveReadyStore(activeDossier) ? 'Approve Store' : 'Complete checklist'}
                </button>
              </> : null}
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

      <RequestChangesDialog
        store={requestChangesTarget}
        isSubmitting={requestChangesMutation.isPending}
        onClose={() => setRequestChangesTarget(null)}
        onSubmit={(reason) => requestChangesTarget && requestChangesMutation.mutate({ id: requestChangesTarget.id, reason })}
      />

      {approveBusinessTarget && <ConfirmDialog
        isOpen onClose={() => setApproveBusinessTarget(null)}
        onConfirm={() => approveBusinessMutation.mutate(approveBusinessTarget.id)}
        title="Approve merchant account"
        message={`Approve ${approveBusinessTarget.name}? The merchant can then submit stores for marketplace review.`}
        confirmText="Approve merchant" isLoading={approveBusinessMutation.isPending}
      />}
      {rejectBusinessTarget && <ConfirmDialog
        isOpen onClose={() => setRejectBusinessTarget(null)}
        onConfirm={() => { if (businessRejectReason.trim()) rejectBusinessMutation.mutate({ id: rejectBusinessTarget.id, reason: businessRejectReason.trim() }); else error('Enter a rejection reason.') }}
        title="Reject merchant account"
        message={`Tell ${rejectBusinessTarget.name} what needs to change before resubmission.`}
        confirmText="Reject merchant" variant="danger" isLoading={rejectBusinessMutation.isPending}
      >
        <textarea value={businessRejectReason} onChange={(event) => setBusinessRejectReason(event.target.value)} maxLength={1000} placeholder="Reason for rejection" aria-label="Rejection reason" className="min-h-24 w-full rounded-lg border border-zinc-300 p-3 text-sm" />
      </ConfirmDialog>}
    </div>
  )
}
