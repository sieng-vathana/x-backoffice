import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { REALTIME_RECONNECTED, startRealtime, stopRealtime, useRealtimeEvent } from '../../lib/realtime'

/** Keeps the live connection open while staff are signed in and reloads the approval queue when it changes. */
export function RealtimeBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    startRealtime()
    return () => stopRealtime()
  }, [])

  // A merchant signed up or applied to the marketplace, or other staff approved or rejected one.
  useRealtimeEvent(['approvals.changed', REALTIME_RECONNECTED], () => {
    for (const queryKey of [['pendingBusinesses'], ['pendingStores'], ['marketplaceStoresNeedingChanges'], ['adminMerchants'], ['adminStores']]) {
      void queryClient.invalidateQueries({ queryKey })
    }
  })

  return null
}
