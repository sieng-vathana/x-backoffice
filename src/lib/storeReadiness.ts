import type { StoreResponse } from '../types/store'

export interface ReadinessItem {
  key: string
  label: string
  help: string
  complete: boolean
}

export function getStoreReadiness(store: StoreResponse): { items: ReadinessItem[]; missing: ReadinessItem[]; ready: boolean } {
  const hours = store.openingHours
  const days = hours?.days
  const expectedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  const validTime = (value?: string | null) => Boolean(value && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
  const isOpenDayValid = (day: string) => {
    const schedule = days?.[day]
    return Boolean(schedule && !schedule.closed && validTime(schedule.openTime) && validTime(schedule.closeTime) && schedule.openTime !== schedule.closeTime)
  }
  const hasHours = Boolean(
    hours?.timeZone?.trim() === 'Asia/Phnom_Penh'
    && days
    && expectedDays.every((day) => Object.prototype.hasOwnProperty.call(days, day) && days[day])
    && expectedDays.every((day) => {
      const schedule = days?.[day]
      if (!schedule || schedule.closed) return true
      return isOpenDayValid(day)
    })
    && expectedDays.some(isOpenDayValid),
  )

  const items: ReadinessItem[] = [
    {
      key: 'store',
      label: 'Store name and type',
      help: 'Add a customer-facing store name and choose a store type.',
      complete: Boolean(store.name?.trim() && store.storeType?.trim()),
    },
    {
      key: 'contact',
      label: 'Contact phone or email',
      help: 'Provide at least one way for customers to contact the store.',
      complete: Boolean(store.phone?.trim() || store.email?.trim()),
    },
    {
      key: 'address',
      label: 'Full address',
      help: 'Complete the street, city, province, and country fields.',
      complete: Boolean(store.addressLine1?.trim() && store.city?.trim() && store.stateProvince?.trim() && store.countryCode?.trim()),
    },
    {
      key: 'hours',
      label: 'Weekly opening hours',
      help: 'Set valid hours for all seven days, with at least one open day.',
      complete: hasHours,
    },
    {
      key: 'photo',
      label: 'Storefront photo',
      help: 'Upload at least one storefront image for the marketplace listing.',
      complete: Boolean(store.images?.some((image) => image.url?.trim())),
    },
  ]

  const missing = items.filter((item) => !item.complete)
  return { items, missing, ready: missing.length === 0 }
}
