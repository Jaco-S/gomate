'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { useOrders } from '@/hooks/useOrders'
import { Order } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pending:    '⏳ Pendiente',
  accepted:   '✅ Aceptado',
  pickup:     '📦 Recogiendo',
  in_transit: '🛵 En ruta',
  delivered:  '✔️ Entregado',
  cancelled:  '❌ Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  pending:    '#909090',
  accepted:   '#3730C8',
  pickup:     '#7C3AED',
  in_transit: '#F59E0B',
  delivered:  '#16A34A',
  cancelled:  '#DC2626',
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const { orders, loading: ordersLoading } = useOrders()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const active = orders.filter(o =>
    ['pending','accepted','pickup','in_transit'].includes(o.status)
  )
  const inTransit = orders.filter(o => o.status === 'in_transit')

  if (profileLoading) return (
    <div style={{
      minHeight: '100dvh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ color: '#606060', fontSize: '14px' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh', background: '#0D0D0D',
      fontFamily: 'system-ui, sans-serif', paddingBottom: '80px'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, zIndex: 50, background: '#0D0D0D'
      }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
            Go<span style={{ color: '#3730C8' }}>Mate</span>
          </div>
          <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px' }}>
            Hola, {profile?.name?.split(' ')[0]} 👋
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
  <button onClick={() => router.push('/')} style={{
    background: '#171717', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px', padding: '8px 12px',
    fontSize: '12px', color: '#909090', cursor: 'pointer'
  }}>
    🔄 Roles
  </button>
  <button onClick={handleLogout} style={{
    background: '#171717', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px', padding: '8px 12px',
    fontSize: '12px', color: '#909090', cursor: 'pointer'
  }}>
    Salir
  </button>
</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px 20px 4px' }}>
        {[
          { label: 'Activos', val: active.length, color: '#3730C8' },
          { label: 'En ruta', val: inTransit.length, color: '#F59E0B' },
        ].map(m => (
          <div key={m.label} style={{
            background: '#171717', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '16px'
          }}>
            <div style={{ fontSize: '11px', color: '#505050', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: m.color, letterSpacing: '-1px' }}>
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {inTransit.length > 0 && (
        <div onClick={() => router.push(`/orders/${inTransit[0].id}`)} style={{
          margin: '8px 20px',
          background: 'rgba(55,48,200,0.12)',
          border: '1px solid rgba(55,48,200,0.35)',
          borderRadius: '16px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#3730C8', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', flexShrink: 0
          }}>🛵</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>
              {inTransit[0].customer?.name} — en ruta
            </div>
            <div style={{ fontSize: '12px', color: '#3730C8', marginTop: '2px' }}>
              GPS activo · toca para ver
            </div>
          </div>
          <div style={{
            width: '9px', height: '9px', borderRadius: '50%',
            background: '#3730C8', flexShrink: 0,
            animation: 'pulse 1.4s ease-in-out infinite'
          }}/>
        </div>
      )}

      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#909090', textTransform: 'uppercase', letterSpacing: '.02em' }}>
          Pedidos activos
        </div>
        <span onClick={() => router.push('/orders')} style={{ fontSize: '13px', color: '#3730C8', fontWeight: 600, cursor: 'pointer' }}>
          Ver todos
        </span>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ordersLoading && (
          <div style={{ color: '#505050', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
            Cargando pedidos...
          </div>
        )}
        {!ordersLoading && active.length === 0 && (
          <div style={{ color: '#505050', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: .3 }}>📦</div>
            No hay pedidos activos
          </div>
        )}
        {active.map((order: Order) => (
          <div key={order.id} onClick={() => router.push(`/orders/${order.id}`)} style={{
            background: '#171717', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(55,48,200,0.12)', border: '1px solid rgba(55,48,200,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#3730C8', flexShrink: 0
            }}>
              {order.customer?.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {order.customer?.name}
              </div>
              <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {order.customer?.address}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
                background: `${STATUS_COLOR[order.status]}22`,
                color: STATUS_COLOR[order.status],
                border: `1px solid ${STATUS_COLOR[order.status]}44`
              }}>
                {STATUS_LABEL[order.status]}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0' }}>
                ${order.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => router.push('/orders/new')} style={{
        position: 'fixed', bottom: '80px', right: '20px',
        width: '54px', height: '54px', borderRadius: '16px',
        background: '#3730C8', color: '#fff', fontSize: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 101,
        boxShadow: '0 4px 24px rgba(55,48,200,0.45)'
      }}>+</div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '64px', background: '#171717',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', zIndex: 100
      }}>
        {[
          { icon: '🏠', label: 'Inicio', path: '/dashboard' },
          { icon: '📋', label: 'Pedidos', path: '/orders' },
          { icon: '📊', label: 'Historial', path: '/history' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px', cursor: 'pointer',
            color: item.path === '/dashboard' ? '#3730C8' : '#505050',
            fontSize: '10px', fontWeight: 500
          }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.4;transform:scale(1.4)}
        }
      `}</style>
    </div>
  )
}
