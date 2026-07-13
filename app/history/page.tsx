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
        .select('*, customer:customers(*)')
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
  const totalCobrado = delivered.reduce((sum, o) => sum + (o.price || 0), 0)
  const totalKm = delivered.reduce((sum, o) => sum + (o.distance_km || 0), 0)

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0D0D0D', zIndex: 50 }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>Historial</div>
        <div style={{ fontSize: '12px', color: '#505050' }}>
          {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Resumen del día */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '16px 20px' }}>
        {[
          { label: 'Cobrado', val: `$${totalCobrado.toFixed(2)}`, color: '#16A34A' },
          { label: 'Km', val: totalKm.toFixed(1), color: '#3730C8' },
          { label: 'Entregas', val: delivered.length.toString(), color: '#F0F0F0' },
        ].map(m => (
          <div key={m.label} style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, letterSpacing: '-.5px' }}>{m.val}</div>
            <div style={{ fontSize: '10px', color: '#505050', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '3px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#505050', padding: '40px 0' }}>Cargando...</div>
      )}

      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', color: '#505050', padding: '40px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: .3 }}>📊</div>
          <div>No hay entregas completadas hoy</div>
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {orders.map(order => (
          <div key={order.id} style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              background: order.status === 'delivered' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
              border: order.status === 'delivered' ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(220,38,38,0.25)'
            }}>
              {order.status === 'delivered' ? '✅' : '❌'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>{order.customer?.name}</div>
              <div style={{ fontSize: '11px', color: '#606060', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{new Date(order.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                {order.distance_km && <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#505050', display: 'inline-block' }}/><span>{order.distance_km} km</span></>}
                {order.photo_url && <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#505050', display: 'inline-block' }}/><span>📷 foto</span></>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: order.status === 'delivered' ? '#F0F0F0' : '#DC2626' }}>
                {order.status === 'delivered' ? `$${order.price?.toFixed(2)}` : '$0'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#171717', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'Inicio', path: '/dashboard' },
          { icon: '📋', label: 'Pedidos', path: '/orders' },
          { icon: '📊', label: 'Historial', path: '/history' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/history' ? '#3730C8' : '#505050', fontSize: '10px', fontWeight: 500 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
