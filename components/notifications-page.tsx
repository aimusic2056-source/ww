"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, CreditCard, Megaphone, ShoppingBag, Truck } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { FirestoreOrder } from "@/components/order-popup-panel"

interface NotificationsPageProps {
  storeId: string | null
  pendingOrders: FirestoreOrder[]
  realtimeOrders: FirestoreOrder[]
  onMarkAllRead: () => void
  onNavigate: (page: string) => void
}

type Notification = { id: string; type: "payment_captured" | "system_message"; title: string; description: string; timestamp: Date }

const assignedDriverStatuses = new Set(["assigned", "at_store", "picked_up", "delivered", "completed"])

export function NotificationsPage({ pendingOrders, realtimeOrders, onMarkAllRead, onNavigate }: NotificationsPageProps) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const driverOrders = useMemo(() => realtimeOrders.filter(order => assignedDriverStatuses.has(order.driverStatus || "")), [realtimeOrders])
  const otherNotifications: Notification[] = [
    { id: "payment-1", type: "payment_captured", title: "Payment Captured", description: "Payment notifications will appear here.", timestamp: new Date(Date.now() - 14 * 60 * 1000) },
    { id: "system-1", type: "system_message", title: "System Message", description: "App updates and important store messages will appear here.", timestamp: new Date(Date.now() - 52 * 60 * 1000) },
  ]

  const updateOrder = async (order: FirestoreOrder, status: "accepted" | "rejected" | "ready_for_pickup") => {
    setUpdatingIds(prev => new Set(prev).add(order.id))
    try { await updateDoc(doc(db, "orders", order.id), { status }) }
    catch (error) { console.error("Error updating notification order:", error) }
    finally { setUpdatingIds(prev => { const next = new Set(prev); next.delete(order.id); return next }) }
  }

  const timeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    return hours < 24 ? `${hours} hour${hours === 1 ? "" : "s"} ago` : "1+ day ago"
  }

  const markRead = (id: string) => setReadIds(prev => new Set(prev).add(id))
  const unreadCount = pendingOrders.length + driverOrders.filter(order => !readIds.has(`driver-${order.id}`)).length + otherNotifications.filter(n => !readIds.has(n.id)).length

  return <div className="flex flex-col h-full bg-background">
    <header className="bg-card px-4 pt-5 pb-4 shrink-0">
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => onNavigate("dashboard")} aria-label="Go back" className="text-card-foreground"><ChevronLeft className="size-6" /></button><h1 className="text-2xl font-bold text-card-foreground">Notifications</h1></div>{unreadCount > 0 && <button onClick={() => { setReadIds(new Set([...pendingOrders.map(o => o.id), ...driverOrders.map(o => `driver-${o.id}`), ...otherNotifications.map(n => n.id)])); onMarkAllRead() }} className="text-sm font-medium text-muted-foreground">Mark all as read</button>}</div>
    </header>
    <main className="flex-1 overflow-y-auto px-4 pb-20"><div className="flex flex-col gap-3 pt-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Pending Orders</h2>
      {pendingOrders.length === 0 && <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">No pending orders.</p>}
      {pendingOrders.map(order => <article key={order.id} className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start gap-3"><div className="size-12 shrink-0 overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center">{order.items[0]?.image ? <img src={order.items[0].image} alt={order.items[0].name} className="size-full object-cover" /> : <ShoppingBag className="text-primary" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="text-sm font-bold">{order.userName}</h3><span className="text-sm font-bold">ZMW {order.total.toFixed(2)}</span></div><p className="text-xs text-muted-foreground">Order #{order.orderId} · {order.items.length} item(s)</p><p className="mt-1 text-xs text-muted-foreground">{timeSince(order.createdAt)}</p><div className="mt-3 flex gap-2" onClick={event => event.stopPropagation()}>{order.status === "pending" ? <><button disabled={updatingIds.has(order.id)} onClick={() => updateOrder(order, "rejected")} className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50">Reject</button><button disabled={updatingIds.has(order.id)} onClick={() => updateOrder(order, "accepted")} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Accept</button></> : <button disabled={updatingIds.has(order.id)} onClick={() => updateOrder(order, "ready_for_pickup")} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Ready for Pickup</button>}</div></div></div></article>)}

      {driverOrders.length > 0 && <><h2 className="mt-3 text-sm font-semibold text-muted-foreground">Driver Assigned</h2>{driverOrders.map(order => { const driver = order.driverSnapshot; const name = driver?.firstName || order.driver?.name || "Driver assigned"; return <article key={`driver-${order.id}`} onClick={() => { markRead(`driver-${order.id}`); onNavigate("driverAssigned") }} className="relative flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">{!readIds.has(`driver-${order.id}`) && <span className="absolute left-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-orange-500" />}<div className="ml-3 size-12 shrink-0 overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center">{driver?.profilePicture ? <img src={driver.profilePicture} alt={name} className="size-full object-cover" /> : <Truck className="text-primary" />}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">Driver Assigned</h3><p className="text-xs text-muted-foreground">{name} accepted Order #{order.orderId}</p><p className="mt-1 text-xs text-muted-foreground">{timeSince(order.createdAt)}</p></div></article>})}</>}

      {otherNotifications.map(notification => <article key={notification.id} onClick={() => markRead(notification.id)} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"><div className={`size-12 shrink-0 rounded-xl flex items-center justify-center ${notification.type === "payment_captured" ? "bg-primary/10" : "bg-muted"}`}>{notification.type === "payment_captured" ? <CreditCard className="text-primary" /> : <Megaphone className="text-muted-foreground" />}</div><div className="flex-1"><div className="flex justify-between gap-3"><h3 className="text-sm font-bold">{notification.title}</h3><span className="text-xs text-muted-foreground">{timeSince(notification.timestamp)}</span></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.description}</p></div></article>)}
    </div></main>
  </div>
}
