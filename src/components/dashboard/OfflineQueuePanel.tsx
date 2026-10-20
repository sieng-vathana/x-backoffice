import { useQuery } from '@tanstack/react-query'
import { offlineQueueService } from '../../services/offlineQueueService'

/** Cash sales held on POS computers across all merchants. Shown only when something is waiting or needs a check. */
export const OfflineQueuePanel: React.FC = () => {
  const { data: devices = [] } = useQuery({
    queryKey: ['offlineQueue', 'all'],
    queryFn: offlineQueueService.all,
    refetchInterval: 30_000,
  })
  const waiting = devices.filter((device) => device.waitingCount > 0 || device.attentionCount > 0)
  if (waiting.length === 0) return null

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
      <p className="m-0 text-sm font-bold text-sky-900">Offline cash sales on POS computers</p>
      <p className="mt-1 mb-2 text-xs text-sky-800">These are saved on the computer until its internet returns. Check any that need attention.</p>
      <ul className="m-0 list-none space-y-1 p-0 text-xs text-zinc-800">
        {waiting.map((device) => (
          <li key={device.deviceId} className="flex flex-wrap items-center justify-between gap-2">
            <span>Merchant #{device.businessId} · Store #{device.storeId} · computer {device.deviceId.slice(-6)}</span>
            <span>
              {device.waitingCount > 0 ? `${device.waitingCount} waiting (${device.currencyCode} ${device.waitingTotal.toFixed(2)})` : ''}
              {device.attentionCount > 0 ? ` · ${device.attentionCount} need a check` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
