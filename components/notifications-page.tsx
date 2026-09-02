"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, CreditCard, Megaphone, ShoppingBag, Truck } from "lucide-react"
import type { FirestoreOrder } from "@/components/order-popup-panel"
import { isRevenueOrder } from "@/lib/order-status"

interface Props {
  storeId: string | null
  pendingOrders: FirestoreOrder[]
  realtimeOrders: FirestoreOrder[]
  onMarkAllRead: () => void
  onNavigate: (page: string) => void
}

type Type = "new_order" | "payment_captured" | "driver_assigned" | "system_message"

const styles = {
  new_order: [ShoppingBag, "bg-[#22c55e]/15", "text-[#22c55e]"],
  payment_captured: [CreditCard, "bg-[#1a73e8]/15", "text-[#1a73e8]"],
  driver_assigned: [Truck, "bg-[#14b8a6]/15", "text-[#14b8a6]"],
  system_message: [Megaphone, "bg-[#a855f7]/15", "text-[#a855f7]"],
} as const

export function NotificationsPage({ pendingOrders, realtimeOrders, onMarkAllRead, onNavigate }: Props) {
  const [readInstances, setReadInstances] = useState<Record<string, string>>({})

  const latestPending = useMemo(
    () =>
      [...pendingOrders, ...realtimeOrders.filter((order) => order.status === "pending")].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0],
    [pendingOrders, realtimeOrders],
  )

  const latestPayment = useMemo(
    () =>
      realtimeOrders
        .filter((order) => isRevenueOrder(order.status))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0],
    [realtimeOrders],
  )

  const latestDriver = useMemo(
    () =>
      realtimeOrders
        .filter((order) => order.driverSnapshot && order.driverStatus)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0],
    [realtimeOrders],
  )

  const notifications = useMemo(() => {
    const result: {
      id: string
      instance: string
      type: Type
      title: string
      description: string
      timestamp: Date
      navigate?: string
    }[] = []

    if (latestPending) {
      result.push({
        id: "new-order",
        instance: latestPending.id,
        type: "new_order",
        title: "New Order Received!",
        description: `Order #${latestPending.orderId} for ${latestPending.userName} (Total: ZMW ${latestPending.subtotal.toFixed(2)}) is pending fulfillment.`,
        timestamp: latestPending.createdAt,
        navigate: "pendingOrders",
      })
    }

    if (latestPayment) {
      result.push({
        id: "payment-captured",
        instance: latestPayment.id,
        type: "payment_captured",
        title: "Payment Captured",
        description: `Payment for Order #${latestPayment.orderId} (${latestPayment.userName}) of ZMW ${latestPayment.subtotal.toFixed(2)} was processed.`,
        timestamp: latestPayment.createdAt,
        navigate: "payments",
      })
    }

    if (latestDriver) {
      const driver = latestDriver.driverSnapshot!
      result.push({
        id: "driver-assigned",
        instance: latestDriver.id,
        type: "driver_assigned",
        title: "Driver Assigned",
        description: `${driver.firstName || "Driver"}${driver.plateNumber ? ` (${driver.plateNumber})` : ""} is delivering for ${latestDriver.userName} at ${latestDriver.destinationAddress}.`,
        timestamp: latestDriver.createdAt,
        navigate: "driverAssigned",
      })
    }

    result.push({
      id: "system-1",
      instance: "system-1",
      type: "system_message",
      title: "System Message",
      description: "App Update: Version 3.4.1 is available now. Bug fixes & improvements.",
      timestamp: new Date(Date.now() - 52 * 60 * 1000),
    })

    return result
  }, [latestPending, latestPayment, latestDriver])

  const since = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }

  const isUnread = (notification: (typeof notifications)[number]) =>
    readInstances[notification.id] !== notification.instance

  const tap = (notification: (typeof notifications)[number]) => {
    setReadInstances((previous) => ({ ...previous, [notification.id]: notification.instance }))
    if (notification.navigate) onNavigate(notification.navigate)
  }

  const unread = notifications.filter(isUnread).length

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card px-4 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-card-foreground" aria-label="Go back">
              <ChevronLeft className="size-6" />
            </button>
            <h1 className="text-2xl font-bold text-card-foreground">Notifications</h1>
          </div>
          {unread > 0 && (
            <button
              onClick={() => {
                setReadInstances(Object.fromEntries(notifications.map((notification) => [notification.id, notification.instance])))
                onMarkAllRead()
              }}
              className="text-sm text-muted-foreground"
            >
              Mark all as read
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
        <div className="flex flex-col gap-3 pt-2">
          {notifications.map((notification) => {
            const [Icon, bg, color] = styles[notification.type]
            return (
              <button
                key={notification.id}
                onClick={() => tap(notification)}
                className="relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm"
              >
                {isUnread(notification) && <span className="absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#f97316]" />}
                <div className={`${bg} ml-3 flex size-12 shrink-0 items-center justify-center rounded-xl`}>
                  <Icon className={`size-6 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-card-foreground">{notification.title}</h2>
                    <span className="text-xs text-muted-foreground/70">{since(notification.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
