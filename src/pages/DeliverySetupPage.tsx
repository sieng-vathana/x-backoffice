import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../context/ToastContext'
import { deliveryConfigService, type DeliveryProvider } from '../services/deliveryConfigService'
import { suspensionService } from '../services/suspensionService'
import type { StoreResponse } from '../types/store'

const providerOptions: {
  id: DeliveryProvider
  name: string
  description: string
  icon: string
}[] = [
  { id: 'GRAB', name: 'GrabExpress', description: 'On-demand pickup and local parcel delivery.', icon: 'ri-e-bike-2-line' },
  { id: 'VIREAK_BUNTHAM', name: 'Vireak Buntham', description: 'Parcel and intercity delivery through Vireak Buntham.', icon: 'ri-truck-line' },
  { id: 'OWN_RIDER', name: 'Store rider', description: 'Fulfil the order with the merchant’s own delivery staff.', icon: 'ri-user-star-line' },
]

const providerName = (provider: DeliveryProvider) => providerOptions.find((item) => item.id === provider)?.name ?? provider

export const DeliverySetupPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [search, setSearch] = useState('')
  const [chosenStoreId, setChosenStoreId] = useState<number | null>(null)
  const [enabledProviders, setEnabledProviders] = useState<DeliveryProvider[]>([])
  const [defaultProvider, setDefaultProvider] = useState<DeliveryProvider>('GRAB')

  const storesQuery = useQuery({
    queryKey: ['adminStoresDirectory'],
    queryFn: () => suspensionService.stores('', ''),
  })
  const stores = storesQuery.data ?? []
  const selectedStoreId = chosenStoreId ?? stores[0]?.id ?? null
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null

  const configQuery = useQuery({
    queryKey: ['storeDeliveryConfig', selectedStoreId],
    queryFn: () => deliveryConfigService.getStoreConfig(selectedStoreId!),
    enabled: selectedStoreId !== null,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!configQuery.data) return
    setEnabledProviders(configQuery.data.enabledProviders)
    setDefaultProvider(configQuery.data.defaultProvider)
  }, [configQuery.data])

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return stores
    return stores.filter((store) =>
      [store.name, store.code, store.city, String(store.businessId), String(store.id)]
        .some((value) => value?.toLowerCase().includes(term)),
    )
  }, [search, stores])

  const saveMutation = useMutation({
    mutationFn: () => deliveryConfigService.updateStoreConfig(selectedStoreId!, { enabledProviders, defaultProvider }),
    onSuccess: (config) => {
      success(`Delivery options saved for ${selectedStore?.name ?? 'the store'}.`)
      queryClient.setQueryData(['storeDeliveryConfig', selectedStoreId], config)
      queryClient.invalidateQueries({ queryKey: ['storeDeliveryConfig', selectedStoreId] })
    },
    onError: (cause: Error) => error(cause.message || 'Could not save delivery settings.'),
  })

  const originalProviders = configQuery.data?.enabledProviders ?? []
  const isDirty =
    [...enabledProviders].sort().join('|') !== [...originalProviders].sort().join('|') ||
    defaultProvider !== configQuery.data?.defaultProvider

  const toggleProvider = (provider: DeliveryProvider) => {
    if (enabledProviders.includes(provider)) {
      if (enabledProviders.length === 1) return
      const next = enabledProviders.filter((item) => item !== provider)
      setEnabledProviders(next)
      if (defaultProvider === provider) setDefaultProvider(next[0])
      return
    }
    setEnabledProviders([...enabledProviders, provider])
  }

  const selectStore = (store: StoreResponse) => setChosenStoreId(store.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            <i className="ri-e-bike-2-line text-base" /> Fulfillment configuration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Store delivery setup</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Choose which couriers each merchant store can offer. Products and orders from a store use these delivery options.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Demo integrations
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <i className="ri-information-line mt-0.5 text-lg text-sky-700" />
        <p>
          Provider availability and the default choice are saved per store. GrabExpress and Vireak Buntham bookings are currently simulated; live courier accounts and API credentials still need to be connected.
        </p>
      </div>

      {storesQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
          <p className="font-bold">Could not load the store directory.</p>
          <p className="mt-1 text-rose-600">{(storesQuery.error as Error).message}</p>
          <button onClick={() => void storesQuery.refetch()} className="mt-4 rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white">Try again</button>
        </div>
      ) : storesQuery.isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-2xl border border-line bg-white" />
          <div className="h-96 animate-pulse rounded-2xl border border-line bg-white" />
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center shadow-sm">
          <i className="ri-store-2-line text-4xl text-slate-300" />
          <h2 className="mt-3 font-bold text-ink">No stores found</h2>
          <p className="mt-1 text-sm text-muted">Approved merchant stores will appear here for delivery setup.</p>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="border-b border-line p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-ink">Merchant stores</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{stores.length}</span>
              </div>
              <label className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-sm text-muted focus-within:border-brand">
                <i className="ri-search-line" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a store" className="w-full bg-transparent text-ink outline-none placeholder:text-slate-400" />
              </label>
            </div>
            <div className="max-h-[580px] overflow-y-auto p-2">
              {filteredStores.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">No stores match this search.</p>
              ) : filteredStores.map((store) => (
                <button
                  type="button"
                  key={store.id}
                  onClick={() => selectStore(store)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${store.id === selectedStoreId ? 'bg-brand-soft ring-1 ring-brand/20' : 'hover:bg-canvas'}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${store.id === selectedStoreId ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <i className="ri-store-2-line" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{store.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">Merchant #{store.businessId}{store.city ? ` · ${store.city}` : ''}</span>
                  </span>
                  {store.id === selectedStoreId && <i className="ri-arrow-right-s-line text-lg text-brand" />}
                </button>
              ))}
            </div>
          </section>

          {!selectedStore ? (
            <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">Choose a store to view its delivery settings.</div>
          ) : configQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
              <p className="font-bold">Could not load delivery settings for {selectedStore.name}.</p>
              <p className="mt-1">{(configQuery.error as Error).message}</p>
              <button onClick={() => void configQuery.refetch()} className="mt-4 rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white">Try again</button>
            </div>
          ) : configQuery.isLoading || !configQuery.data ? (
            <div className="h-96 animate-pulse rounded-2xl border border-line bg-white" />
          ) : (
            <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">Delivery options for</div>
                  <h2 className="mt-1 text-xl font-bold text-ink">{selectedStore.name}</h2>
                  <p className="mt-0.5 text-sm text-muted">Merchant #{selectedStore.businessId}{selectedStore.city ? ` · ${selectedStore.city}` : ''}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                  <i className="ri-flask-line" /> Simulated mode
                </span>
              </div>

              <div className="space-y-6 p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-ink">Available delivery providers</h3>
                      <p className="mt-0.5 text-xs text-muted">Enabled providers appear as choices for this store’s delivery orders.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{enabledProviders.length} enabled</span>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-3">
                    {providerOptions.map((provider) => {
                      const checked = enabledProviders.includes(provider.id)
                      return (
                        <button
                          type="button"
                          key={provider.id}
                          onClick={() => toggleProvider(provider.id)}
                          disabled={checked && enabledProviders.length === 1}
                          aria-pressed={checked}
                          title={checked && enabledProviders.length === 1 ? 'At least one provider must remain enabled.' : undefined}
                          className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${checked ? 'border-brand bg-brand-soft/50 ring-1 ring-brand/20' : 'border-line hover:border-slate-300 hover:bg-canvas'}`}
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${checked ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <i className={provider.icon} />
                            </span>
                            <span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                              <i className="ri-check-line text-sm" />
                            </span>
                          </span>
                          <span className="mt-3 block font-bold text-ink">{provider.name}</span>
                          <span className="mt-1 block min-h-10 text-xs leading-relaxed text-muted">{provider.description}</span>
                          <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${checked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {checked ? 'Available' : 'Disabled'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-end">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-ink">Default provider</span>
                    <span className="mb-2 block text-xs text-muted">Shown first when a cashier gets courier quotes.</span>
                    <select
                      value={defaultProvider}
                      onChange={(event) => setDefaultProvider(event.target.value as DeliveryProvider)}
                      className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-brand"
                    >
                      {providerOptions.filter((item) => enabledProviders.includes(item.id)).map((provider) => (
                        <option key={provider.id} value={provider.id}>{provider.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="rounded-xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
                    <span className="font-bold text-ink">Current routing:</span>{' '}
                    {enabledProviders.length
                      ? `${enabledProviders.map(providerName).join(', ')}. ${providerName(defaultProvider)} is first.`
                      : 'Enable at least one delivery provider.'}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">Changes apply to new quotes. Active deliveries keep their original provider.</p>
                  <button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={!isDirty || enabledProviders.length === 0 || saveMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className={saveMutation.isPending ? 'ri-loader-4-line animate-spin' : 'ri-save-3-line'} />
                    {saveMutation.isPending ? 'Saving…' : 'Save delivery settings'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
