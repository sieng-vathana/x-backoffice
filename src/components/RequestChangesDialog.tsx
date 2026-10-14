import { useEffect, useState } from 'react'
import { Modal } from './ui/Modal'
import type { StoreResponse } from '../types/store'
import { getStoreReadiness } from '../lib/storeReadiness'

interface RequestChangesDialogProps {
  store: StoreResponse | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

export function RequestChangesDialog({ store, isSubmitting, onClose, onSubmit }: RequestChangesDialogProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!store) return
    const missing = getStoreReadiness(store).missing
    setMessage(missing.length
      ? `Please update the following before resubmitting: ${missing.map((item) => item.label).join(', ')}.`
      : 'Please review the marketplace listing details and resubmit the application.')
  }, [store])

  const remaining = 500 - message.length

  return (
    <Modal
      isOpen={Boolean(store)}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Request merchant updates"
      subtitle={store ? `${store.name} · Business #${store.businessId}` : undefined}
      maxWidth="md"
    >
      {store ? <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
          The store will move to <strong>Waiting for merchant</strong>. The merchant can edit the store details and submit it for review again.
        </div>
        <div>
          <label htmlFor="marketplace-change-message" className="mb-1.5 block text-xs font-medium text-zinc-700">Tell the merchant what to update</label>
          <textarea
            id="marketplace-change-message"
            autoFocus
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Explain what needs to change before the listing can be approved."
            className="min-h-[120px] w-full rounded-lg border border-zinc-300 p-3 text-xs leading-relaxed text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-900/10"
          />
          <div className="mt-1 flex justify-between gap-3 text-[10px] text-zinc-400">
            <span>Be specific so the merchant can fix it without another review round.</span>
            <span className={remaining < 40 ? 'text-amber-700' : ''}>{remaining} characters left</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={isSubmitting || !message.trim()} onClick={() => onSubmit(message.trim())} className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-reply-line" />}
            Send update request
          </button>
        </div>
      </div> : null}
    </Modal>
  )
}
