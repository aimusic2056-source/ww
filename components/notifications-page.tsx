"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ShoppingBag, CreditCard, Truck, Megaphone } from "lucide-react"
import type { FirestoreOrder } from "@/components/order-popup-panel"

interface NotificationsPageProps {
  storeId: string | null
  pendingOrders: FirestoreOrder[]
  realtimeOrders: FirestoreOrder[]
  onMarkAllRead: () => void
  onNavigate: (page: string) => void
}

type NotificationType = "new_order" | "payment_captured" | "driver_assigned" | "system_message"
interface Notification { id: string; type: NotificationType; title: string; description: string; timestamp: Date; orderId?: string; isClickable?: boolean }

export function NotificationsPage({ pendingOrders, realtimeOrders, onMarkAllRead, onNavigate }: NotificationsPageProps) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const driverOrder = useMemo(() => realtimeOrders
    .filter(order => order.driverStatus === "assigned" && order.driverSnapshot)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0], [realtimeOrders])

  const notifications = useMemo<Notification[]>(() => {
    const newest = pendingOrders[0]
    const driver = driverOrder?.driverSnapshot
    return [
      newest ? { id: "new-order-card", type: "new_order", title: "New Order Received!", description: `Order #${newest.orderId} for ${newest.userName} (Total: ZMW ${newest.total.toFixed(2)}) is pending fulfillment.`, timestamp: newest.createdAt, orderId: newest.orderId, isClickable: true } : { id: "new-order-card", type: "new_order", title: "New Order Received!", description: "No pending orders at the moment. Tap to view pending orders.", timestamp: new Date(), isClickable: true },
      { id: "payment-1", type: "payment_captured", title: "Payment Captured", description: "Payment for Order #45815 (Mike L.) of $42.00 was successfully processed.", timestamp: new Date(Date.now() - 14 * 60 * 1000) },
      { id: "driver-assigned", type: "driver_assigned", title: "Driver Assigned", description: driverOrder && driver ? `${driver.firstName || "Driver"} ${driver.plateNumber ? `(${driver.plateNumber})` : ""} is driving a ${[driver.color, driver.brand, driver.model].filter(Boolean).join(" ") || "vehicle"} for ${driverOrder.userName} at ${driverOrder.destinationAddress}.` : "No driver assignments yet.", timestamp: driverOrder?.createdAt || new Date(), orderId: driverOrder?.orderId, isClickable: true },
      { id: "system-1", type: "system_message", title: "System Message", description: "App Update: Version 3.4.1 is available now. Bug fixes & improvements.", timestamp: new Date(Date.now() - 52 * 60 * 1000) },
    ]
  }, [pendingOrders, driverOrder])

  const getTimeSince = (timestamp: Date) => { const mins = Math.floor((Date.now() - timestamp.getTime()) / 60000); if (mins < 1) return "Just now"; if (mins < 60) return `${mins} min ago`; const hours = Math.floor(mins / 60); return `${hours} hour${hours === 1 ? "" : "s"} ago` }
  const handleTap = (notification: Notification) => { if (notification.id === "new-order-card") { onNavigate("pendingOrders"); return } if (notification.id === "driver-assigned") { onNavigate("driverAssigned"); return } setReadIds(prev => new Set(prev).add(notification.id)) }
  const styles = { new_order: [ShoppingBag, "bg-[#22c55e]/15", "text-[#22c55e]"], payment_captured: [CreditCard, "bg-[#1a73e8]/15", "text-[#1a73e8]"], driver_assigned: [Truck, "bg-[#14b8a6]/15", "text-[#14b8a6]"], system_message: [Megaphone, "bg-[#a855f7]/15", "text-[#a855f7]"] } as const
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  return <div className="flex flex-col h-full bg-background">
    <div className="bg-card px-4 pt-5 pb-4 shrink-0"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button className="text-card-foreground" aria-label="Go back"><ChevronLeft className="w-6 h-6" /></button><h1 className="text-2xl font-bold text-card-foreground">Notifications</h1></div>{unreadCount > 0 && <button onClick={() => { setReadIds(new Set(notifications.map(n => n.id))); onMarkAllRead() }} className="text-sm font-medium text-muted-foreground">Mark all as read</button>}</div></div>
    <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide"><div className="flex flex-col gap-3 pt-2">{notifications.map(notification => { const [Icon, bg, color] = styles[notification.type]; const unread = !readIds.has(notification.id); return <div key={notification.id} onClick={() => handleTap(notification)} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm cursor-pointer relative active:scale-[0.98]">{unread && <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#f97316]" />}<div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-3`}><Icon className={`w-6 h-6 ${color}`} /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-card-foreground">{notification.title}</h3><p className="text-xs text-muted-foreground/70">{getTimeSince(notification.timestamp)}</p></div><p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notification.description}</p></div></div>})}<div className="text-center py-4"><button className="text-sm text-muted-foreground/70">Older Notifications</button></div></div></div>
  </div>
}

