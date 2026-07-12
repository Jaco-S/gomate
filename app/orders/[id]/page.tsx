'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const STATUS_LABEL: Record<string, string> = {
  pending:    '⏳ Pendiente',
  accepted:   '✅ Aceptado',
  pickup:     '📦 Recogiendo',
  in_transit: '🛵 En ruta',
  delivered:  '✔️ Entregado',
  cancelled:  '❌ Cancelado',
}

const STATUS_NEXT: Record<string, string> = {
  pending:    'Aceptar pedido',
  accepted:   'Recoger paquete',
  pickup:     'Salir en ruta',
  in_transit: 'Marcar entregado',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null)
  const [heading, setHeading] = useState(0)
const prevPosition = useRef<{lat: number, lng: number} | null>(null)
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .eq('id', id)
        .single()
      setOrder(data)
      setLoading(false)
    }
    load()
  }, [id])

  // GPS tracking cuando está en_transit
  useEffect(() => {
    if (order?.status !== 'in_transit') return
    if (!navigator.geolocation) return

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        setPosition({ lat, lng })
if (prevPosition.current) {
  const dLng = lng - prevPosition.current.lng
  const dLat = lat - prevPosition.current.lat
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI)
  setHeading(angle)
}
prevPosition.current = { lat, lng }

        // guardar en Supabase
        await supabase.from('order_tracking').insert({
          order_id: id,
          latitude: lat,
          longitude: lng,
          accuracy
        })

        // broadcast por Realtime
        await supabase.channel(`tracking:${id}`).send({
          type: 'broadcast',
          event: 'location',
          payload: { lat, lng, timestamp: Date.now() }
        })
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [order?.status])

async function advanceStatus() {
  if (!order) return
  setUpdating(true)
  if (order.status === 'in_transit') {
    const { data } = await supabase.rpc('deliver_order', { p_order_id: order.id })
    setOrder(data)
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
  } else if (order.status === 'pending' && !order.delivery_id) {
    const { data, error } = await supabase.rpc('accept_order', { p_order_id: order.id })
    if (error) { alert('Error: ' + error.message); setUpdating(false); return }
    setOrder(data)
  } else {
    const { data } = await supabase.rpc('advance_order_status', { p_order_id: order.id })
    setOrder(data)
  }
  setUpdating(false)
}

  async function cancelOrder() {
    if (!order) return
    setUpdating(true)
    const { data } = await supabase.rpc('cancel_order', { p_order_id: order.id })
    setOrder(data)
    setUpdating(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#606060' }}>Cargando...</div>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#606060' }}>Pedido no encontrado</div>
    </div>
  )

  const statusColor: Record<string, string> = {
    pending: '#909090', accepted: '#3730C8', pickup: '#7C3AED',
    in_transit: '#F59E0B', delivered: '#16A34A', cancelled: '#DC2626'
  }

  const trackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${order.tracking_token}`
    : ''

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', fontSize: '20px', color: '#909090' }}>←</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>Detalle pedido</div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: `${statusColor[order.status]}22`, color: statusColor[order.status], border: `1px solid ${statusColor[order.status]}44` }}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Mapa GPS en tiempo real */}
      {order.status === 'in_transit' && (
        <div style={{ margin: '16px 20px 0', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
          {position ? (
            <Map lat={position.lat} lng={position.lng} heading={heading} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px' }}>📡</div>
              <div style={{ fontSize: '13px', color: '#606060' }}>Obteniendo GPS...</div>
            </div>
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#F59E0B', color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000', animation: 'pulse 1.4s infinite' }}/>
            LIVE
          </div>
        </div>
      )}

      {/* Cliente */}
      <div style={{ margin: '16px 20px', background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(55,48,200,0.12)', border: '1px solid rgba(55,48,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#3730C8' }}>
            {order.customer?.name?.slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#F0F0F0' }}>{order.customer?.name}</div>
            <div style={{ fontSize: '13px', color: '#909090', marginTop: '3px' }}>{order.customer?.phone}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span>📍</span>
            <div>
              <div style={{ fontSize: '14px', color: '#F0F0F0' }}>{order.customer?.address}</div>
              {order.customer?.reference && <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px' }}>{order.customer.reference}</div>}
            </div>
          </div>
          {order.notes && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <span>📝</span>
              <div style={{ fontSize: '14px', color: '#F0F0F0' }}>{order.notes}</div>
            </div>
          )}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '14px 0' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#606060' }}>Total a cobrar</div>
            <div style={{ fontSize: '11px', color: '#505050', marginTop: '2px' }}>Efectivo al entregar</div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#3730C8' }}>${order.price.toFixed(2)}</div>
        </div>
      </div>

      {/* Link tracking */}
      <div style={{ margin: '0 20px 16px', background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#606060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🔗 {trackingUrl}
        </div>
        <div onClick={() => navigator.clipboard.writeText(trackingUrl)} style={{ fontSize: '11px', fontWeight: 700, color: '#3730C8', background: 'rgba(55,48,200,0.12)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0, border: '1px solid rgba(55,48,200,0.3)' }}>
          Copiar
        </div>
      </div>

      {/* Botones */}
      {!['delivered', 'cancelled'].includes(order.status) && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={advanceStatus} disabled={updating} style={{ width: '100%', height: '52px', background: updating ? '#2A2460' : '#3730C8', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            {updating ? 'Actualizando...' : STATUS_NEXT[order.status]}
          </button>
          <button onClick={cancelOrder} disabled={updating} style={{ width: '100%', height: '48px', background: 'rgba(220,38,38,0.12)', color: '#EF4444', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(220,38,38,0.25)', borderRadius: '12px', cursor: 'pointer' }}>
            ✕ Cancelar pedido
          </button>
        </div>
      )}

      {order.status === 'delivered' && (
        <div style={{ margin: '0 20px', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A' }}>Entrega completada</div>
          {order.distance_km && <div style={{ fontSize: '13px', color: '#16A34A', marginTop: '4px' }}>{order.distance_km} km recorridos</div>}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}