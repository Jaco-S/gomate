'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'

export function useOrders(onNewOrder?: () => void) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const prevCountRef = { current: -1 }

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('delivery_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const { data: myOrders } = await supabase
        .from('orders')
        .select('*, customer:customers(*), customer_v2:customers_v2(*)')
        .eq('delivery_id', profile.id)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false })

      const { data: poolOrders } = await supabase
        .from('orders')
        .select('*, customer:customers(*), customer_v2:customers_v2(*)')
        .is('delivery_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const all = [...(poolOrders || []), ...(myOrders || [])]

      // detectar pedido nuevo
      if (prevCountRef.current !== -1 && all.length > prevCountRef.current) {
  onNewOrder?.()
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Movento — Nuevo pedido', {
        body: 'Tienes un nuevo pedido esperando',
        icon: '/icon-192.png',
        tag: 'new-order',
        requireInteraction: true
      })
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('Movento — Nuevo pedido', {
            body: 'Tienes un nuevo pedido esperando',
            icon: '/icon-192.png',
            tag: 'new-order',
            requireInteraction: true
          })
        }
      })
    }
  }
}
      prevCountRef.current = all.length

      setOrders(all)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { orders, loading }
}