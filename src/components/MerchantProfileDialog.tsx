import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { suspensionService } from '../services/suspensionService'
import type { BusinessApproval } from '../services/businessApprovalService'
import { resolveImageUrl } from '../lib/api'

function displayDate(value?: string | null) {
  if (!value) return 'Not recorded'
  const date = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function addressOf(store: { addressLine1?: string; addressLine2?: string; landmark?: string; city?: string; stateProvince?: string; postalCode?: string; countryCode?: string }) {
  return [store.addressLine1, store.addressLine2, store.landmark, store.city, store.stateProvince, store.postalCode, store.countryCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

function mapLinks(store: { latitude?: number; longitude?: number; addressLine1?: string; city?: string; stateProvince?: string; countryCode?: string }) {
  const lat = Number(store.latitude)
  const lon = Number(store.longitude)
  const hasCoordinates = store.latitude != null && store.longitude != null
    && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  if (!hasCoordinates) {
    const address = [store.addressLine1, store.city, store.stateProvince, store.countryCode].filter(Boolean).join(', ')
    if (!address) return null
    return {
      open: `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`,
      embed: null,
    }
  }
  const delta = 0.006
  const bounds = [lon - delta, lat - delta, lon + delta, lat + delta].join(',')
  return {
    open: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,
    embed: `https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${lat},${lon}`,
  }
}

function channelLabel(value?: string | null) {
  switch (value?.toUpperCase()) {
    case 'POS': return 'POS only'
    case 'ONLINE': return 'Online only'
    case 'BOTH': return 'POS + online'
    default: return value || 'Not set'
  }
}

export function MerchantProfileDialog({
  merchant,
  onClose,
  actions,
}: {
  merchant: BusinessApproval | null
  onClose: () => void
  actions?: React.ReactNode
}) {
  const open = merchant !== null
  const query = useQuery({
    queryKey: ['merchantProfile', merchant?.id],
    queryFn: () => suspensionService.merchantProfile(merchant!.id),
    enabled: open,
  })
  const profile = query.data
  const [expandedMaps, setExpandedMaps] = useState<Set<number>>(() => new Set())

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={merchant ? `${merchant.name} · Merchant profile` : 'Merchant profile'}
      subtitle="Owner contact, registration details, and every store associated with this merchant."
      maxWidth="4xl"
    >
      {query.isLoading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">Loading merchant and store information…</div>
      ) : query.isError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {query.error instanceof Error ? query.error.message : 'Could not load the merchant profile.'}{' '}
          <button type="button" onClick={() => void query.refetch()} className="font-semibold underline">Retry</button>
        </div>
      ) : profile ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-zinc-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">Merchant account</h4>
                <p className="mt-1 text-xs text-zinc-500">{profile.merchant.code} · Merchant #{profile.merchant.id} · Owner #{profile.merchant.ownerUserId}</p>
              </div>
              {profile.merchant.suspended
                ? <Badge variant="rose" dot>Suspended</Badge>
                : profile.merchant.status === 1
                  ? <Badge variant="emerald" dot>Approved</Badge>
                  : profile.merchant.status === 0
                    ? <Badge variant="amber" dot>Pending review</Badge>
                    : <Badge variant="slate" dot>Rejected</Badge>}
            </div>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Registered" value={displayDate(profile.merchant.createdAt)} />
              <Info label="Last updated" value={displayDate(profile.merchant.updatedAt)} />
              <Info label="Default currency / time zone" value={`${profile.merchant.defaultCurrencyCode || '—'} / ${profile.merchant.timeZone || '—'}`} />
              <Info label="Tax registration" value={profile.merchant.taxRegistrationNumber || 'Not provided'} />
              <Info label="Tax registration type" value={profile.merchant.taxRegistrationLabel || 'Not provided'} />
              <Info label="Prices include tax" value={profile.merchant.pricesIncludeTax === false ? 'No' : 'Yes'} />
              <Info label="Plan" value={`${profile.merchant.plan || 'Legacy'} · ${profile.merchant.billingCycle || 'No billing cycle'}`} />
              <Info label="Trial ends" value={displayDate(profile.merchant.trialEndsAt)} />
              <Info label="Bakong account" value={profile.merchant.bakongAccountId || 'Not configured'} />
            </div>
            {profile.merchant.reviewReason ? <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"><span className="font-semibold">Review note:</span> {profile.merchant.reviewReason}</div> : null}
            {profile.merchant.suspensionReason ? <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900"><span className="font-semibold">Suspension reason:</span> {profile.merchant.suspensionReason}</div> : null}
          </section>

          <section className="rounded-xl border border-zinc-200 p-4">
            <h4 className="text-sm font-semibold text-zinc-900">Account owner</h4>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {profile.owner.profileImage ? (
                <img src={resolveImageUrl(profile.owner.profileImage)} alt="" className="h-12 w-12 rounded-full border border-zinc-200 object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-500">{(profile.owner.fullName || profile.owner.username || '?').slice(0, 1).toUpperCase()}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{profile.owner.fullName || 'Name not provided'}</p>
                <p className="text-xs text-zinc-500">@{profile.owner.username} · User #{profile.owner.id}</p>
              </div>
              <Badge variant={profile.owner.status === 1 ? 'emerald' : 'slate'} dot>{profile.owner.status === 1 ? 'Account active' : `User status ${profile.owner.status ?? 'unknown'}`}</Badge>
            </div>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <ContactInfo label="Email" value={profile.owner.email} href={profile.owner.email ? `mailto:${profile.owner.email}` : undefined} />
              <ContactInfo label="Phone" value={profile.owner.phone} href={profile.owner.phone ? `tel:${profile.owner.phone}` : undefined} />
              <Info label="Account created" value={displayDate(profile.owner.createdAt)} />
              <Info label="Last sign-in" value={displayDate(profile.owner.lastLogin)} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">Registered stores</h4>
                <p className="mt-0.5 text-xs text-zinc-500">Store contact details and locations submitted by this merchant.</p>
              </div>
              <Badge variant="slate">{profile.stores.length} {profile.stores.length === 1 ? 'store' : 'stores'}</Badge>
            </div>
            {profile.stores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-xs text-zinc-500">No stores have been registered yet.</div>
            ) : profile.stores.map((store) => {
              const location = addressOf(store)
              const map = mapLinks(store)
              const isMapOpen = expandedMaps.has(store.id)
              const hours = store.openingHours?.days ? Object.entries(store.openingHours.days) : []
              const storeImages = (store.images ?? []).flatMap((image) => {
                const source = (image.imageUrl ?? image.url)?.trim()
                return source ? [{ ...image, source }] : []
              }).sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
              const primaryImage = storeImages[0]?.source
              return (
                <article key={store.id} className="overflow-hidden rounded-xl border border-zinc-200">
                  <div className="flex flex-wrap items-start gap-3 p-4">
                    {primaryImage ? <img src={resolveImageUrl(primaryImage)} alt={`${store.name} storefront`} className="h-16 w-16 rounded-lg border border-zinc-200 object-cover" /> : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-sm font-semibold text-zinc-900">{store.name}</h5>
                        <Badge variant="slate">{channelLabel(store.salesChannel)}</Badge>
                        <Badge variant={store.suspended ? 'rose' : 'emerald'} dot>{store.suspended ? 'Suspended' : store.status === 0 ? 'Inactive' : 'Active'}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">{store.code} · Store #{store.id} · {store.storeType || 'Store type not set'} · Marketplace {store.marketplaceStatus?.replaceAll('_', ' ').toLowerCase() || 'not listed'}</p>
                      <p className="mt-2 text-xs text-zinc-700">{location || 'Address not provided'}</p>
                    </div>
                  </div>
                  {storeImages.length > 0 ? (
                    <div className="border-t border-zinc-100 px-4 py-3">
                      <div className="mb-2 text-[11px] font-medium text-zinc-400">Shop photos · {storeImages.length}</div>
                      <div className="flex flex-wrap gap-2">
                        {storeImages.slice(0, 6).map((image, index) => (
                          <a key={image.id ?? `${store.id}-${index}`} href={resolveImageUrl(image.source)} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                            <img src={resolveImageUrl(image.source)} alt={`${store.name} shop ${index + 1}`} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.closest('a')?.classList.add('hidden') }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/70 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <ContactInfo label="Store email" value={store.email} href={store.email ? `mailto:${store.email}` : undefined} />
                    <ContactInfo label="Phone" value={store.phone} href={store.phone ? `tel:${store.phone}` : undefined} />
                    <ContactInfo label="Alternate phone" value={store.alternatePhone} href={store.alternatePhone ? `tel:${store.alternatePhone}` : undefined} />
                    <ContactInfo label="Website" value={store.website} href={store.website ? (store.website.match(/^https?:\/\//i) ? store.website : `https://${store.website}`) : undefined} external />
                    <div className="sm:col-span-2 lg:col-span-4">
                      <span className="block text-[11px] font-medium text-zinc-400">Location</span>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-700">
                        <span>{store.latitude != null && store.longitude != null ? `${store.latitude}, ${store.longitude}` : 'Map coordinates not provided'}</span>
                        {map ? <a href={map.open} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline"><i className="ri-map-pin-line mr-1" />Open map</a> : null}
                        {map?.embed ? <button type="button" onClick={() => setExpandedMaps((current) => {
                          const next = new Set(current)
                          if (next.has(store.id)) next.delete(store.id)
                          else next.add(store.id)
                          return next
                        })} className="font-medium text-blue-700 hover:underline">{isMapOpen ? 'Hide map preview' : 'Show map preview'}</button> : null}
                      </div>
                      {isMapOpen && map?.embed ? <iframe title={`${store.name} map`} src={map.embed} loading="lazy" className="mt-3 h-52 w-full rounded-lg border border-zinc-200" referrerPolicy="no-referrer" /> : null}
                    </div>
                    {hours.length ? (
                      <div className="sm:col-span-2 lg:col-span-4">
                        <span className="block text-[11px] font-medium text-zinc-400">Opening hours · {store.openingHours?.timeZone || 'store time zone'}</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {hours.map(([day, value]) => <span key={day} className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600">{day}: {value.closed ? 'Closed' : `${value.openTime || '—'}–${value.closeTime || '—'}`}</span>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </section>
          {actions ? <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4">{actions}</div> : null}
        </div>
      ) : null}
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><span className="block text-[11px] font-medium text-zinc-400">{label}</span><span className="mt-1 block break-words text-zinc-700">{value}</span></div>
}

function ContactInfo({ label, value, href, external = false }: { label: string; value?: string | null; href?: string; external?: boolean }) {
  return <div className="min-w-0"><span className="block text-[11px] font-medium text-zinc-400">{label}</span>{value ? href ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="mt-1 block break-all text-blue-700 hover:underline">{value}</a> : <span className="mt-1 block break-all text-zinc-700">{value}</span> : <span className="mt-1 block text-zinc-400">Not provided</span>}</div>
}
