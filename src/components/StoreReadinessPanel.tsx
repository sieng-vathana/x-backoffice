import type { StoreResponse } from '../types/store'
import { getStoreReadiness } from '../lib/storeReadiness'

interface StoreReadinessPanelProps {
  store: StoreResponse
  compact?: boolean
}

export function StoreReadinessPanel({ store, compact = false }: StoreReadinessPanelProps) {
  const readiness = getStoreReadiness(store)
  const shownItems = compact ? (readiness.ready ? readiness.items : readiness.missing) : readiness.items

  return (
    <section className={`rounded-lg border p-3.5 ${readiness.ready ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'}`} aria-label="Marketplace listing checklist">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="m-0 text-xs font-semibold text-zinc-900">Marketplace listing checklist</h3>
          <p className="mb-0 mt-0.5 text-[11px] text-zinc-500">
            {readiness.ready ? 'All required information is present.' : `${readiness.missing.length} item${readiness.missing.length === 1 ? '' : 's'} need${readiness.missing.length === 1 ? 's' : ''} merchant updates.`}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${readiness.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {readiness.items.length - readiness.missing.length}/{readiness.items.length} complete
        </span>
      </div>
      <div className={`mt-3 ${compact ? 'space-y-1.5' : 'grid gap-2 sm:grid-cols-2'}`}>
        {shownItems.map((item) => (
          <div key={item.key} className="flex items-start gap-2 text-[11px]">
            <i className={`mt-0.5 text-xs ${item.complete ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-amber-600'}`} aria-hidden />
            <span className="min-w-0">
              <span className={`block font-medium ${item.complete ? 'text-zinc-700' : 'text-zinc-900'}`}>{item.label}</span>
              {!compact || !item.complete ? <span className="mt-0.5 block leading-relaxed text-zinc-500">{item.help}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
