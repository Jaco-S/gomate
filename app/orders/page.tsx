'use client'

import { useRouter } from 'next/navigation'
import { useOrders } from '@/hooks/useOrders'

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pendiente', accepted: '✅ Aceptado',
  pickup: '📦 Recogiendo', in_transit: '🛵 En ruta',
  delivered: '✔️ Entregado', cancelled: '❌ Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#888', accepted: '#FF4B2B', pickup: '#D97706',
  in_transit: '#FF4B2B', delivered: '#22C55E', cancelled: '#EF4444',
}

export default function OrdersPage() {
  const router = useRouter()
  const { orders, loading } = useOrders()

  const active = orders.filter(o => !['delivered','cancelled'].includes(o.status))
  const done = orders.filter(o => ['delivered','cancelled'].includes(o.status))

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}>←</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>Todos los pedidos</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {loading && <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>Cargando...</div>}

        {!loading && active.length === 0 && done.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#999' }}>No hay pedidos</div>
            <div onClick={() => router.push('/orders/new')} style={{ marginTop: '16px', display: 'inline-block', background: '#FF4B2B', color: '#fff', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              + Nuevo pedido
            </div>
          </div>
        )}

        {active.length > 0 && (
          <>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>Activos · {active.length}</div>
            {active.map(order => (
              <div key={order.id} onClick={() => router.push(`/orders/${order.id}`)} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#FF4B2B', flexShrink: 0 }}>
                  {(order.customer?.name || 'CL').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.customer?.name || 'Cliente marketplace'}
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
                    ${(order.price || order.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '🏠', label: 'Inicio', path: '/dashboard' },
          { icon: '📋', label: 'Pedidos', path: '/orders' },
          { icon: '📊', label: 'Historial', path: '/history' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/orders' ? '#FF4B2B' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}