'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { orders, loading }
}