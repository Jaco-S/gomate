'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StoreAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [store, setStore] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!storeData) { router.push('/store-admin/register'); return }

      setStore(storeData)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, customer_v2:customers_v2(*), order_items(*, product:products(*))')
        .eq('store_id', storeData.id)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('store-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Pendiente', accepted: 'Aceptado',
    pickup: 'Recogiendo', in_transit: 'En ruta',
    delivered: 'Entregado', cancelled: 'Cancelado'
  }

  const STATUS_COLOR: Record<string, string> = {
    pending: '#D97706', accepted: '#FF4B2B', pickup: '#D97706',
    in_transit: '#FF4B2B', delivered: '#22C55E', cancelled: '#EF4444'
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#D97706', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{store?.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: store?.status === 'active' ? '#86EFAC' : '#FDE68A' }}/>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                {store?.status === 'active' ? 'Local activo' : 'Pendiente de aprobacion'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              🔄 Roles
            </button>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Salir
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Pedidos activos</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{orders.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>Total pendiente</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
              ${orders.reduce((sum, o) => sum + (o.subtotal || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Pedidos activos */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>Pedidos activos</div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#999' }}>No hay pedidos activos</div>
          </div>
        )}

        {orders.map(order => (
          <div key={order.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '18px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>
                  {order.customer_v2?.name || 'Cliente'}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {order.customer_v2?.phone} · {order.customer_v2?.address}
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${STATUS_COLOR[order.status]}15`, color: STATUS_COLOR[order.status], border: `1px solid ${STATUS_COLOR[order.status]}30` }}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {order.order_items?.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                  <span>{item.quantity}x {item.product?.name}</span>
                  <span style={{ fontWeight: 600, color: '#111' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: '#f0f0f0', marginBottom: '12px' }}/>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#bbb' }}>
                {new Date(order.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#D97706' }}>
                ${order.subtotal?.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '📋', label: 'Pedidos', path: '/store-admin' },
          { icon: '🍽️', label: 'Productos', path: '/store-admin/products' },
          { icon: '⚙️', label: 'Mi local', path: '/store-admin/settings' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/store-admin' ? '#D97706' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}