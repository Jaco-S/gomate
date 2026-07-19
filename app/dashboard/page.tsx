'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useOrders } from '@/hooks/useOrders'
import { Order } from '@/types'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useState, useRef, useCallback } from 'react'

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pendiente', accepted: '✅ Aceptado',
  pickup: '📦 Recogiendo', in_transit: '🛵 En ruta',
  delivered: '✔️ Entregado', cancelled: '❌ Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#888', accepted: '#FF4B2B', pickup: '#D97706',
  in_transit: '#FF4B2B', delivered: '#22C55E', cancelled: '#EF4444',
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const [newOrderAlert, setNewOrderAlert] = useState(false)
const audioRef = useRef<HTMLAudioElement | null>(null)

const handleNewOrder = useCallback(() => {
  setNewOrderAlert(true)
  // sonido de alerta
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch(e) {}
  setTimeout(() => setNewOrderAlert(false), 5000)
}, [])

const { orders, loading: ordersLoading } = useOrders(handleNewOrder)
  const supabase = createClient()
const { permission, requestPermission } = usePushNotifications()
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const active = orders.filter(o => ['pending','accepted','pickup','in_transit'].includes(o.status))
  const inTransit = orders.filter(o => o.status === 'in_transit')

  if (profileLoading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb', fontSize: '14px' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>
{newOrderAlert && (
  <div style={{
    position: 'fixed', top: '20px', left: '20px', right: '20px',
    background: '#FF4B2B', color: '#fff',
    borderRadius: '16px', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: '12px',
    zIndex: 200, boxShadow: '0 8px 32px rgba(255,75,43,0.5)',
    animation: 'slideDown 0.3s ease'
  }}>
    <div style={{ fontSize: '24px' }}>📦</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '15px' }}>Nuevo pedido recibido</div>
      <div style={{ fontSize: '12px', opacity: .85, marginTop: '2px' }}>Toca para ver el pedido</div>
    </div>
  </div>
)}
      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
              M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
              Hola, {profile?.name?.split(' ')[0]} 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              🔄 Roles
            </button>
{permission !== 'granted' && (
  <button onClick={requestPermission} style={{
    background: 'rgba(255,255,255,0.2)', border: 'none',
    borderRadius: '10px', padding: '8px 12px',
    fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600
  }}>
    🔔 Activar alertas
  </button>
)}
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Activos', val: active.length, icon: '📋' },
            { label: 'En ruta', val: inTransit.length, icon: '🛵' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>{m.icon} {m.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner en ruta */}
      {inTransit.length > 0 && (
        <div onClick={() => router.push(`/orders/${inTransit[0].id}`)} style={{ margin: '16px 20px 0', background: '#fff', border: '1.5px solid #FF4B2B', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🛵</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{inTransit[0].customer?.name} — en ruta</div>
            <div style={{ fontSize: '12px', color: '#FF4B2B', marginTop: '2px' }}>GPS activo · toca para ver</div>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4B2B', animation: 'pulse 1.4s infinite', flexShrink: 0 }}/>
        </div>
      )}

      {/* Lista pedidos */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>Pedidos activos</div>
        <span onClick={() => router.push('/orders')} style={{ fontSize: '13px', color: '#FF4B2B', fontWeight: 700, cursor: 'pointer' }}>Ver todos</span>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ordersLoading && <div style={{ color: '#bbb', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>Cargando...</div>}

        {!ordersLoading && active.length === 0 && (
          <div style={{ color: '#bbb', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            No hay pedidos activos
          </div>
        )}

        {active.map((order: Order) => (
          <div key={order.id} onClick={() => router.push(`/orders/${order.id}`)} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#FF4B2B', flexShrink: 0 }}>
              {(order.customer?.name || 'CL').slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {order.customer?.name || 'Cliente'}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {order.customer?.address || 'Pedido del marketplace'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: `${STATUS_COLOR[order.status]}15`, color: STATUS_COLOR[order.status], border: `1px solid ${STATUS_COLOR[order.status]}30` }}>
                {STATUS_LABEL[order.status]}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                ${order.price?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <div onClick={() => router.push('/orders/new')} style={{ position: 'fixed', bottom: '80px', right: '20px', width: '54px', height: '54px', borderRadius: '16px', background: '#FF4B2B', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 101, boxShadow: '0 4px 24px rgba(255,75,43,0.4)' }}>+</div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'Inicio', path: '/dashboard' },
          { icon: '📋', label: 'Pedidos', path: '/orders' },
          { icon: '📊', label: 'Historial', path: '/history' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/dashboard' ? '#FF4B2B' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
  @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
`}</style>
    </div>
  )
}