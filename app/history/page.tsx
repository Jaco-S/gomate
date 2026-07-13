'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('delivery_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('orders')
        .select('*, customer:customers(*), customer_v2:customers_v2(*)')
        .eq('delivery_id', profile.id)
        .in('status', ['delivered', 'cancelled'])
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const delivered = orders.filter(o => o.status === 'delivered')
  const totalCobrado = delivered.reduce((sum, o) => sum + (o.price || o.total || 0), 0)
  const totalKm = delivered.reduce((sum, o) => sum + (o.distance_km || 0), 0)

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Historial</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
          {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '16px 20px' }}>
        {[
          { label: 'Cobrado', val: `$${totalCobrado.toFixed(2)}`, color: '#22C55E' },
          { label: 'Km', val: totalKm.toFixed(1), color: '#FF4B2B' },
          { label: 'Entregas', val: delivered.length.toString(), color: '#111' },
        ].map(m => (
          <div key={m.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, letterSpacing: '-.5px' }}>{m.val}</div>
            <div style={{ fontSize: '10px', color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>Cargando...</div>}

      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#999' }}>No hay entregas hoy</div>
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {orders.map(order => {
          const name = order.customer_v2?.name || order.customer?.name || 'Cliente'
          return (
            <div key={order.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: order.status === 'delivered' ? '#F0FDF4' : '#FEF2F2', border: order.status === 'delivered' ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
                {order.status === 'delivered' ? '✅' : '❌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{name}</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>{new Date(order.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                  {order.distance_km && <><span>·</span><span>{order.distance_km} km</span></>}
                  {order.photo_url && <><span>·</span><span>📷</span></>}
                </div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: order.status === 'delivered' ? '#111' : '#EF4444' }}>
                {order.status === 'delivered' ? `$${(order.price || order.total || 0).toFixed(2)}` : '$0'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'Inicio', path: '/dashboard' },
          { icon: '📋', label: 'Pedidos', path: '/orders' },
          { icon: '📊', label: 'Historial', path: '/history' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/history' ? '#FF4B2B' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}