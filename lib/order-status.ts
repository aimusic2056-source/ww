export const ALL_ORDER_STATUSES = [
  "pending",
  "accepted",
  "ready_for_pickup",
  "rejected",
  "completed",
  "delivered",
  "picked_up",
  "at_store",
] as const

export type OrderStatus = (typeof ALL_ORDER_STATUSES)[number]

export const COMPLETED_ORDER_STATUSES: readonly OrderStatus[] = [
  "ready_for_pickup",
  "completed",
  "delivered",
  "picked_up",
  "at_store",
]

export const REVENUE_ORDER_STATUSES: readonly OrderStatus[] = [
  "accepted",
  ...COMPLETED_ORDER_STATUSES,
]

export function isOrderCompleted(status: string): boolean {
  return COMPLETED_ORDER_STATUSES.includes(status as OrderStatus)
}

export function isRevenueOrder(status: string): boolean {
  return REVENUE_ORDER_STATUSES.includes(status as OrderStatus)
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}
