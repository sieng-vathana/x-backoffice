import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../context/ToastContext'
import { deliveryConfigService, type DeliveryProvider } from '../services/deliveryConfigService'

const providerDetails: Record<DeliveryProvider, { description: string; icon: string }> = {
  GRAB: {
    description: 'On-demand pickup and local parcel delivery through GrabExpress.',
    icon: 'ri-e-bike-2-line',
  },
  VIREAK_BUNTHAM: {
    description: 'Parcel and intercity delivery through Vireak Buntham.',
    icon: 'ri-truck-line',
  },
  OWN_RIDER: {
    description: 'Let each merchant offer delivery with its own riders.',
    icon: 'ri-user-star-line',
  },
}

export const DeliverySetupPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { success, error } = useToast()
  const [enabledProviders, setEnabledProviders] = useState<DeliveryProvider[]>([])

  const providersQuery = useQuery({
    queryKey: ['deliveryProviders'],
    queryFn: () => deliveryConfigService.getProviders(),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (providersQuery.data) {
      setEnabledProviders(providersQuery.data.filter((provider) => provider.enabled).map((provider) => provider.providerType))
    }
  }, [providersQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => deliveryConfigService.updateProviders(enabledProviders),
    onSuccess: (providers) => {
      queryClient.setQueryData(['deliveryProviders'], providers)
      success('Platform delivery providers saved.')
    },
    onError: (cause: Error) => error(cause.message || 'Could not save delivery providers.'),
  })

  const originalProviders = providersQuery.data?.filter((provider) => provider.enabled).map((provider) => provider.providerType) ?? []
  const isDirty = [...enabledProviders].sort().join('|') !== [...originalProviders].sort().join('|')

  const toggleProvider = (provider: DeliveryProvider) => {
    setEnabledProviders((current) => {
      if (current.includes(provider)) {
        if (current.length === 1) return current
        return current.filter((item) => item !== provider)
      }
      return [...current, provider]
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            <i className="ri-e-bike-2-line text-base" /> Platform fulfillment
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Delivery providers</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Choose which delivery providers are offered across the platform. Merchants choose their own store providers in the Merchant Portal.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Simulated integrations
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <i className="ri-information-line mt-0.5 text-lg text-sky-700" />
        <p>
          Turning a provider on makes it available for merchants to configure. It does not enable it for every store. Courier booking is currently simulated; live provider accounts and API credentials still need to be connected.
        </p>
      </div>

      {providersQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
          <p className="font-bold">Could not load delivery providers.</p>
          <p className="mt-1 text-rose-600">{(providersQuery.error as Error).message}</p>
          <button onClick={() => void providersQuery.refetch()} className="mt-4 rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white">Try again</button>
        </div>
      ) : providersQuery.isLoading || !providersQuery.data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-line bg-white" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {providersQuery.data.map((provider) => {
              const details = providerDetails[provider.providerType]
              const enabled = enabledProviders.includes(provider.providerType)
              return (
                <article key={provider.providerType} className={`rounded-2xl border bg-white p-5 shadow-sm transition ${enabled ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-line'}`}>
                  <div className="flex items-start gap-4">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <i className={details.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 text-base font-bold text-ink">{provider.displayName}</h2>
                      <p className="mt-1 text-sm leading-5 text-muted">{details.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <div>
                      <div className={`text-sm font-bold ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {enabled ? 'Available to merchants' : 'Unavailable to merchants'}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">{provider.integrationMode.toLowerCase()} booking</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${enabled ? 'Disable' : 'Enable'} ${provider.displayName}`}
                      disabled={enabled && enabledProviders.length === 1}
                      title={enabled && enabledProviders.length === 1 ? 'Keep at least one provider available.' : undefined}
                      onClick={() => toggleProvider(provider.providerType)}
                      className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted">
              <span className="font-bold text-ink">{enabledProviders.length} provider{enabledProviders.length === 1 ? '' : 's'} available</span>
              <span> · Merchants can configure them per store.</span>
            </div>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty || saveMutation.isPending || enabledProviders.length === 0}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className={saveMutation.isPending ? 'ri-loader-4-line animate-spin' : 'ri-save-line'} />
              {saveMutation.isPending ? 'Saving…' : 'Save provider availability'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
