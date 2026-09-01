"use client"

import { ChevronLeft, Truck } from "lucide-react"
import type { FirestoreOrder } from "@/components/order-popup-panel"

export function DriverAssignedPage({ orders, onBack }: { orders: FirestoreOrder[]; onBack: () => void }) {
  const assigned = orders.filter(order => order.driverStatus || order.driver)
  return <div className="flex flex-col h-full bg-background">
    <header className="bg-card px-4 pt-5 pb-4 border-b border-border"><div className="flex items-center gap-3"><button onClick={onBack} aria-label="Go back"><ChevronLeft /></button><h1 className="text-2xl font-bold">Driver Assigned</h1></div></header>
    <main className="flex-1 overflow-y-auto px-4 py-4"><div className="flex flex-col gap-3">
      {assigned.length === 0 ? <div className="py-16 text-center text-muted-foreground">No driver assignments recorded yet.</div> : assigned.map(order => <article key={order.id} className="bg-card border border-border rounded-xl p-4 shadow-sm"><div className="flex items-start gap-3"><div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center"><Truck className="text-primary" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h2 className="font-bold">Order #{order.orderId}</h2><span className="text-xs text-muted-foreground">{order.driverStatus || "Assigned"}</span></div><p className="text-sm text-muted-foreground">{order.driver?.name || "Driver assigned"}</p><p className="text-xs text-muted-foreground mt-2">{order.destinationAddress}</p><p className="text-xs text-muted-foreground mt-1">Recipient: {order.userName}</p></div></div></article>)}
    </div></main>
  </div>
}
