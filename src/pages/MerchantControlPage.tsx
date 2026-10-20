import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { MerchantProfileDialog } from '../components/MerchantProfileDialog'
import { useToast } from '../context/ToastContext'
import {
  suspensionService,
  type ManagedMerchant,
  type ManagedStore,
  type MerchantFilter,
  type StoreFilter,
} from '../services/suspensionService'

type Tab = 'merchants' | 'stores'
type Target = { kind: 'merchant'; item: ManagedMerchant } | { kind: 'store'; item: ManagedStore }

const MERCHANT_FILTERS: { value: MerchantFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

const STORE_FILTERS: { value: StoreFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const REASON_TEMPLATES = [
  'Unpaid platform fees',
  'Customer complaints under investigation',
  'Selling prohibited or counterfeit goods',
  'Suspected fraud or chargebacks',
  'Requested by the merchant',
]

const PLANS = [
  { code: 'STARTER', name: 'Starter', monthly: 9, yearly: 90, limits: '1 store, 3 staff, 300 products. POS, KHQR and payment alerts.' },
  { code: 'BUSINESS', name: 'Business', monthly: 25, yearly: 250, limits: '3 stores, 15 staff, 3000 products. Adds inventory, purchasing, customers, all alerts and full reports.' },
  { code: 'PRO', name: 'Pro', monthly: 49, yearly: 490, limits: 'Unlimited. Adds the marketplace, delivery and priority support.' },
]

/** Merchants created before plans existed have no plan and get every Pro feature. */
function planOf(merchant: ManagedMerchant) {
  return PLANS.find((plan) => plan.code === merchant.plan?.toUpperCase()) ?? PLANS[2]
}

/** Server times have no zone and are UTC; show them in the viewer's time. */
function formatTime(value?: string | null) {
  if (!value) return '—'
  const text = /[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function merchantStatus(merchant: ManagedMerchant): { label: string; variant: 'emerald' | 'amber' | 'rose' | 'slate' } {
  if (merchant.suspended) return { label: 'Suspended', variant: 'rose' }
  if (merchant.status === 1) return { label: 'Active', variant: 'emerald' }
  if (merchant.status === 0) return { label: 'Pending', variant: 'amber' }
  if (merchant.status === -1) return { label: 'Rejected', variant: 'slate' }
  return { label: `Status ${merchant.status}`, variant: 'slate' }
}

/** Platform control over merchants and their stores: suspend with a reason, or reinstate. */
export const MerchantControlPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [tab, setTab] = useState<Tab>('merchants')
  const [merchantFilter, setMerchantFilter] = useState<MerchantFilter>('')
  const [storeFilter, setStoreFilter] = useState<StoreFilter>('')
  const [search, setSearch] = useState('')
  const [suspendTarget, setSuspendTarget] = useState<Target | null>(null)
  const [reinstateTarget, setReinstateTarget] = useState<Target | null>(null)
  const [reason, setReason] = useState('')
  const [planTarget, setPlanTarget] = useState<ManagedMerchant | null>(null)
  const [profileTarget, setProfileTarget] = useState<ManagedMerchant | null>(null)
  const [planChoice, setPlanChoice] = useState('BUSINESS')
  const [cycleChoice, setCycleChoice] = useState('MONTHLY')

  const merchantsQuery = useQuery({
    queryKey: ['adminMerchants', merchantFilter, search],
    queryFn: () => suspensionService.merchants(merchantFilter, search),
  })
  // Every merchant, to show which merchant a store belongs to and whether it is suspended as a whole.
  const allMerchantsQuery = useQuery({
    queryKey: ['adminMerchants', '', ''],
    queryFn: () => suspensionService.merchants('', ''),
  })
  const storesQuery = useQuery({
    queryKey: ['adminStores', storeFilter, search],
    queryFn: () => suspensionService.stores(storeFilter, search),
    enabled: tab === 'stores',
  })
  const merchantsById = useMemo(
    () => new Map((allMerchantsQuery.data ?? []).map((merchant) => [merchant.id, merchant])),
    [allMerchantsQuery.data],
  )
  const suspendedMerchants = (allMerchantsQuery.data ?? []).filter((merchant) => merchant.suspended).length

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminMerchants'] })
    void queryClient.invalidateQueries({ queryKey: ['adminStores'] })
  }

  const suspendMutation = useMutation({
    mutationFn: ({ target, why }: { target: Target; why: string }): Promise<ManagedMerchant | ManagedStore> => target.kind === 'merchant'
      ? suspensionService.suspendMerchant(target.item.id, why)
      : suspensionService.suspendStore(target.item.id, why),
    onSuccess: (_, { target }) => {
      success(`${target.item.name} is suspended. The merchant has been notified.`)
      setSuspendTarget(null)
      setReason('')
      refresh()
    },
    onError: (err: Error) => error(err.message || 'Could not suspend.'),
  })

  const reinstateMutation = useMutation({
    mutationFn: (target: Target): Promise<ManagedMerchant | ManagedStore> => target.kind === 'merchant'
      ? suspensionService.reinstateMerchant(target.item.id)
      : suspensionService.reinstateStore(target.item.id),
    onSuccess: (_, target) => {
      success(`${target.item.name} is reinstated. The merchant has been notified.`)
      setReinstateTarget(null)
      refresh()
    },
    onError: (err: Error) => error(err.message || 'Could not reinstate.'),
  })

  const planMutation = useMutation({
    mutationFn: ({ merchant, plan, cycle }: { merchant: ManagedMerchant; plan: string; cycle: string }) => suspensionService.changePlan(merchant.id, plan, cycle),
    onSuccess: (_, { merchant, plan }) => {
      success(`${merchant.name} is now on the ${PLANS.find((item) => item.code === plan)?.name ?? plan} plan. The owner has been emailed.`)
      setPlanTarget(null)
      refresh()
    },
    onError: (err: Error) => error(err.message || 'Could not change the plan.'),
  })

  const openPlan = (merchant: ManagedMerchant) => {
    setPlanChoice(planOf(merchant).code)
    setCycleChoice(merchant.billingCycle?.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY')
    setPlanTarget(merchant)
  }

  const filters = tab === 'merchants' ? MERCHANT_FILTERS : STORE_FILTERS
  const activeFilter = tab === 'merchants' ? merchantFilter : storeFilter
  const setFilter = (value: string) => (tab === 'merchants' ? setMerchantFilter(value as MerchantFilter) : setStoreFilter(value as StoreFilter))
  const listQuery = tab === 'merchants' ? merchantsQuery : storesQuery

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-zinc-900">
            <span>Merchant control</span>
            {suspendedMerchants > 0 ? <Badge variant="rose" dot>{suspendedMerchants} suspended</Badge> : null}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Suspend a merchant or a single store with a reason. Suspension blocks sign-in, sales and the marketplace listing, and the merchant is told by Telegram and email.
          </p>
        </div>
        <button type="button" onClick={refresh} className="flex items-center gap-1.5 self-start rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 sm:self-auto">
          <i className="ri-refresh-line text-sm text-zinc-500" /> Refresh
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
          {(['merchants', 'stores'] as const).map((value) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${tab === value ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
              <i className={value === 'merchants' ? 'ri-building-4-line' : 'ri-store-2-line'} />
              {value === 'merchants' ? 'Merchants' : 'Stores'}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <button key={filter.value || 'all'} type="button" onClick={() => setFilter(filter.value)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${activeFilter === filter.value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                {filter.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === 'merchants' ? 'Search merchant name or code' : 'Search store name, code or city'}
            aria-label="Search"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 sm:max-w-xs"
          />
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">Loading…</div>
      ) : listQuery.isError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Could not load the list.'}{' '}
          <button type="button" onClick={() => void listQuery.refetch()} className="font-semibold underline">Retry</button>
        </div>
      ) : tab === 'merchants' ? (
        <MerchantList
          merchants={merchantsQuery.data ?? []}
          onShowProfile={setProfileTarget}
          onSuspend={(item) => { setReason(''); setSuspendTarget({ kind: 'merchant', item }) }}
          onReinstate={(item) => setReinstateTarget({ kind: 'merchant', item })}
          onShowStores={(merchant) => { setTab('stores'); setStoreFilter(''); setSearch(merchant.code) }}
          onChangePlan={openPlan}
        />
      ) : (
        <StoreList
          stores={storesQuery.data ?? []}
          merchantsById={merchantsById}
          onSuspend={(item) => { setReason(''); setSuspendTarget({ kind: 'store', item }) }}
          onReinstate={(item) => setReinstateTarget({ kind: 'store', item })}
        />
      )}

      <Modal
        isOpen={suspendTarget !== null}
        onClose={() => { if (!suspendMutation.isPending) setSuspendTarget(null) }}
        title={suspendTarget ? `Suspend ${suspendTarget.kind === 'merchant' ? 'merchant' : 'store'} "${suspendTarget.item.name}"` : 'Suspend'}
        subtitle={suspendTarget?.kind === 'merchant'
          ? 'The owner and staff are signed out and cannot sign in, sales and KHQR payments stop, and all its stores leave the marketplace.'
          : 'Sales stop at this store and it leaves the marketplace. Staff who only work at this store cannot sign in. Other stores are not affected.'}
        maxWidth="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (suspendTarget && reason.trim()) suspendMutation.mutate({ target: suspendTarget, why: reason.trim() })
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-700">Reason <span className="text-rose-600">*</span></span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={4}
              required
              autoFocus
              placeholder="The merchant sees this reason in Telegram, email and when they try to sign in."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-400">{reason.length}/500</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {REASON_TEMPLATES.map((template) => (
              <button key={template} type="button" onClick={() => setReason(template)} className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50">
                {template}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button type="button" onClick={() => setSuspendTarget(null)} disabled={suspendMutation.isPending} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" disabled={!reason.trim() || suspendMutation.isPending} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50">
              {suspendMutation.isPending ? 'Suspending…' : 'Suspend and notify'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={planTarget !== null}
        onClose={() => { if (!planMutation.isPending) setPlanTarget(null) }}
        title={planTarget ? `Change plan for "${planTarget.name}"` : 'Change plan'}
        subtitle="The new plan's features and limits apply right away, and the owner is told by email. No payment is taken online."
        maxWidth="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (planTarget) planMutation.mutate({ merchant: planTarget, plan: planChoice, cycle: cycleChoice })
          }}
        >
          <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium">
            {(['MONTHLY', 'YEARLY'] as const).map((cycle) => (
              <button key={cycle} type="button" role="radio" aria-checked={cycleChoice === cycle} onClick={() => setCycleChoice(cycle)} className={`rounded-md px-3 py-1.5 transition ${cycleChoice === cycle ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Plan" className="space-y-2">
            {PLANS.map((plan) => (
              <button
                key={plan.code}
                type="button"
                role="radio"
                aria-checked={planChoice === plan.code}
                onClick={() => setPlanChoice(plan.code)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition ${planChoice === plan.code ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 hover:bg-zinc-50'}`}
              >
                <i className={`mt-0.5 text-base ${planChoice === plan.code ? 'ri-radio-button-line text-zinc-900' : 'ri-checkbox-blank-circle-line text-zinc-300'}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-900">{plan.name}</span>
                    <span className="text-xs font-semibold text-zinc-700">${cycleChoice === 'YEARLY' ? `${plan.yearly} / year` : `${plan.monthly} / month`}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{plan.limits}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button type="button" onClick={() => setPlanTarget(null)} disabled={planMutation.isPending} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button
              type="submit"
              disabled={planMutation.isPending || (planTarget !== null && planTarget.plan?.toUpperCase() === planChoice && (planTarget.billingCycle?.toUpperCase() ?? 'MONTHLY') === cycleChoice)}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {planMutation.isPending ? 'Saving…' : 'Change plan and notify'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={reinstateTarget !== null}
        onClose={() => setReinstateTarget(null)}
        onConfirm={() => { if (reinstateTarget) reinstateMutation.mutate(reinstateTarget) }}
        title={reinstateTarget ? `Reinstate "${reinstateTarget.item.name}"?` : 'Reinstate'}
        message={reinstateTarget?.kind === 'merchant'
          ? 'Sign-in, sales and marketplace listings come back on, and the merchant is notified.'
          : 'This store can sell and appear on the marketplace again, and the merchant is notified.'}
        confirmText="Reinstate"
        variant="primary"
        isLoading={reinstateMutation.isPending}
      />

      <MerchantProfileDialog
        merchant={profileTarget}
        onClose={() => setProfileTarget(null)}
        actions={profileTarget ? <>
          <button type="button" onClick={() => { openPlan(profileTarget); setProfileTarget(null) }} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><i className="ri-vip-crown-2-line mr-1" />Change plan</button>
          {profileTarget.suspended
            ? <button type="button" onClick={() => { setReinstateTarget({ kind: 'merchant', item: profileTarget }); setProfileTarget(null) }} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800">Reinstate merchant</button>
            : <button type="button" onClick={() => { setReason(''); setSuspendTarget({ kind: 'merchant', item: profileTarget }); setProfileTarget(null) }} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50">Suspend merchant</button>}
        </> : undefined}
      />
    </div>
  )
}

function MerchantList({ merchants, onShowProfile, onSuspend, onReinstate, onShowStores, onChangePlan }: {
  merchants: ManagedMerchant[]
  onShowProfile: (merchant: ManagedMerchant) => void
  onSuspend: (merchant: ManagedMerchant) => void
  onReinstate: (merchant: ManagedMerchant) => void
  onShowStores: (merchant: ManagedMerchant) => void
  onChangePlan: (merchant: ManagedMerchant) => void
}) {
  if (merchants.length === 0) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">No merchants match.</div>
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {merchants.map((merchant) => {
        const status = merchantStatus(merchant)
        const plan = planOf(merchant)
        const yearly = merchant.billingCycle?.toUpperCase() === 'YEARLY'
        const trialEnds = merchant.trialEndsAt ? new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(merchant.trialEndsAt) ? merchant.trialEndsAt : `${merchant.trialEndsAt}Z`) : null
        const trialActive = trialEnds !== null && trialEnds.getTime() > Date.now()
        return (
          <div key={merchant.id} className={`rounded-xl border bg-white p-5 shadow-2xs ${merchant.suspended ? 'border-rose-200' : 'border-zinc-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-zinc-900">{merchant.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{merchant.code} / Owner #{merchant.ownerUserId} / Merchant #{merchant.id}</p>
              </div>
              <Badge variant={status.variant} dot>{status.label}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-600">
              <div><span className="block text-zinc-400">Registered</span>{formatTime(merchant.createdAt)}</div>
              <div><span className="block text-zinc-400">Currency / timezone</span>{merchant.defaultCurrencyCode} / {merchant.timeZone}</div>
              <div className="col-span-2">
                <span className="block text-zinc-400">Plan</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={plan.code === 'PRO' ? 'emerald' : plan.code === 'BUSINESS' ? 'amber' : 'slate'}>{plan.name}</Badge>
                  {merchant.plan ? (
                    <span>${yearly ? `${plan.yearly} / year` : `${plan.monthly} / month`}</span>
                  ) : (
                    <span className="text-zinc-400">No plan set (joined before plans), gets every Pro feature</span>
                  )}
                  {trialActive ? <span className="text-amber-700">· Trial until {trialEnds?.toLocaleDateString()}</span> : null}
                </span>
              </div>
            </div>
            {merchant.suspended ? (
              <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
                <span className="font-semibold">Suspended {formatTime(merchant.suspendedAt)}</span>
                {merchant.suspendedByUserId ? <span className="text-rose-600"> by admin #{merchant.suspendedByUserId}</span> : null}
                <p className="mt-1 mb-0">{merchant.suspensionReason}</p>
              </div>
            ) : null}
            <div className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-4">
              <button type="button" onClick={() => onShowProfile(merchant)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                <i className="ri-file-user-line mr-1" /> Details
              </button>
              <button type="button" onClick={() => onShowStores(merchant)} className="mr-auto rounded-lg px-2 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100">
                <i className="ri-store-2-line" /> Stores
              </button>
              <button type="button" onClick={() => onChangePlan(merchant)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                <i className="ri-vip-crown-2-line" /> Change plan
              </button>
              {merchant.suspended ? (
                <button type="button" onClick={() => onReinstate(merchant)} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800">Reinstate</button>
              ) : (
                <button type="button" onClick={() => onSuspend(merchant)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50">Suspend</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StoreList({ stores, merchantsById, onSuspend, onReinstate }: {
  stores: ManagedStore[]
  merchantsById: Map<number, ManagedMerchant>
  onSuspend: (store: ManagedStore) => void
  onReinstate: (store: ManagedStore) => void
}) {
  if (stores.length === 0) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">No stores match.</div>
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Store</th>
            <th className="hidden px-4 py-2.5 font-medium md:table-cell">Merchant</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {stores.map((store) => {
            const merchant = merchantsById.get(store.businessId)
            return (
              <tr key={store.id} className={store.suspended ? 'bg-rose-50/40' : undefined}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-zinc-900">{store.name}</div>
                  <div className="text-xs text-zinc-500">{store.code}{store.city ? ` · ${store.city}` : ''}</div>
                  {store.suspended ? (
                    <div className="mt-1.5 text-xs text-rose-700">
                      <span className="font-semibold">Suspended {formatTime(store.suspendedAt)}:</span> {store.suspensionReason}
                    </div>
                  ) : null}
                </td>
                <td className="hidden px-4 py-3 align-top text-xs text-zinc-600 md:table-cell">
                  {merchant?.name ?? `Merchant #${store.businessId}`}
                  {merchant?.suspended ? <div className="mt-1"><Badge variant="rose">Merchant suspended</Badge></div> : null}
                </td>
                <td className="px-4 py-3 align-top">
                  {store.suspended ? <Badge variant="rose" dot>Suspended</Badge> : <Badge variant="emerald" dot>Active</Badge>}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  {store.suspended ? (
                    <button type="button" onClick={() => onReinstate(store)} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">Reinstate</button>
                  ) : (
                    <button type="button" onClick={() => onSuspend(store)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50">Suspend</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
