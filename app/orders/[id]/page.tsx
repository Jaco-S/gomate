'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', accepted: 'Aceptado',
  pickup: 'Recogiendo', in_transit: 'En ruta',
  delivered: 'Entregado', cancelled: 'Cancelado',
}

const STATUS_NEXT: Record<string, string> = {
  pending: 'Aceptar pedido',
  accepted: 'Recoger paquete',
  pickup: 'Salir en ruta',
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
  const prevPosition = useRef<{ lat: number, lng: number } | null>(null)
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, customer:customers(*), customer_v2:customers_v2(*)')
        .eq('id', id as string)
        .maybeSingle()
      setOrder(data)
      setLoading(false)
    }
    load()
  }, [id])

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
          setHeading(Math.atan2(dLng, dLat) * (180 / Math.PI))
        }
        prevPosition.current = { lat, lng }
        await supabase.from('order_tracking').insert({ order_id: id, latitude: lat, longitude: lng, accuracy })
        await supabase.channel(`tracking:${id}`).send({ type: 'broadcast', event: 'location', payload: { lat, lng, timestamp: Date.now() } })
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current) }
  }, [order?.status])

  async function advanceStatus() {
    if (!order) return
    setUpdating(true)
    if (order.status === 'in_transit') {
      const { data, error } = await supabase.rpc('deliver_order', { p_order_id: order.id })
      if (error) { alert('Error: ' + error.message); setUpdating(false); return }
      setOrder(data)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    } else if (order.status === 'pending' && !order.delivery_id) {
      const { data, error } = await supabase.rpc('accept_order', { p_order_id: order.id })
      if (error) { alert('Error: ' + error.message); setUpdating(false); return }
      setOrder(data)
    } else {
      const { data, error } = await supabase.rpc('advance_order_status', { p_order_id: order.id })
      if (error) { alert('Error: ' + error.message); setUpdating(false); return }
      setOrder(data)
    }
    setUpdating(false)
  }

  async function cancelOrder() {
    if (!order) return
    setUpdating(true)
    const { data, error } = await supabase.rpc('cancel_order', { p_order_id: order.id })
    if (error) { alert('Error: ' + error.message); setUpdating(false); return }
    setOrder(data)
    setUpdating(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', color: '#bbb' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
        <div>Pedido no encontrado</div>
      </div>
    </div>
  )

  const clientName = (order as any).customer_v2?.name || order.customer?.name || 'Cliente'
  const clientPhone = (order as any).customer_v2?.phone || order.customer?.phone || ''
  const clientAddress = (order as any).customer_v2?.address || order.customer?.address || ''
  const clientRef = order.customer?.reference || ''
  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${order.tracking_token}` : ''
  const price = order.price || (order as any).total || 0

  const STATUS_COLOR: Record<string, string> = {
    pending: '#888', accepted: '#FF4B2B', pickup: '#D97706',
    in_transit: '#FF4B2B', delivered: '#22C55E', cancelled: '#EF4444'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}>←</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Detalle del pedido</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* Mapa GPS */}
      {order.status === 'in_transit' && (
        <div style={{ margin: '16px 20px 0', height: '220px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
          {position ? (
            <Map lat={position.lat} lng={position.lng} heading={heading} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px' }}>📡</div>
              <div style={{ fontSize: '13px', color: '#bbb' }}>Obteniendo GPS...</div>
            </div>
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#FF4B2B', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', zIndex: 1000 }}>
            LIVE
          </div>
        </div>
      )}

      {/* Cliente */}
      <div style={{ margin: '16px 20px 0', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '18px', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#FF4B2B', flexShrink: 0 }}>
            {clientName.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#111' }}>{clientName}</div>
            {clientPhone && <div style={{ fontSize: '13px', color: '#999', marginTop: '3px' }}>{clientPhone}</div>}
          </div>
          {clientPhone && (
            <a href={`tel:${clientPhone}`} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>📞</a>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {clientAddress && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', marginTop: '1px' }}>📍</span>
              <div>
                <div style={{ fontSize: '14px', color: '#111' }}>{clientAddress}</div>
                {clientRef && <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{clientRef}</div>}
              </div>
            </div>
          )}
          {order.notes && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>📝</span>
              <div style={{ fontSize: '14px', color: '#666' }}>{order.notes}</div>
            </div>
          )}
        </div>
        <div style={{ height: '1px', background: '#f0f0f0', margin: '14px 0' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#999' }}>Total a cobrar</div>
            <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>Efectivo al entregar</div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FF4B2B' }}>${price.toFixed(2)}</div>
        </div>
      </div>

      {/* Link tracking */}
      <div style={{ margin: '10px 20px 0', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🔗 {trackingUrl}
        </div>
        <div onClick={() => { navigator.clipboard.writeText(trackingUrl); }} style={{ fontSize: '11px', fontWeight: 700, color: '#FF4B2B', background: '#FFF1EF', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0, border: '1px solid #FFCDC6' }}>
          Copiar
        </div>
      </div>

      {/* Botones */}
      {!['delivered', 'cancelled'].includes(order.status) && (
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={advanceStatus} disabled={updating} style={{ width: '100%', height: '52px', background: updating ? '#ffb3a3' : '#FF4B2B', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '14px', cursor: 'pointer', fontFamily: 'system-ui', boxShadow: '0 4px 16px rgba(255,75,43,0.3)' }}>
            {updating ? 'Actualizando...' : STATUS_NEXT[order.status]}
          </button>
          <button onClick={cancelOrder} disabled={updating} style={{ width: '100%', height: '48px', background: '#FEF2F2', color: '#EF4444', fontSize: '14px', fontWeight: 600, border: '1.5px solid #FECACA', borderRadius: '14px', cursor: 'pointer', fontFamily: 'system-ui' }}>
            Cancelar pedido
          </button>
        </div>
      )}

      {/* Foto zona */}
      {order.status === 'in_transit' && (
        <div style={{ margin: '16px 20px 0', border: '1.5px dashed #eee', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', cursor: 'pointer', background: '#fafafa' }}>
          <div style={{ fontSize: '32px' }}>📷</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#999' }}>Tomar foto al entregar</div>
          <div style={{ fontSize: '11px', color: '#bbb' }}>Se guarda como confirmacion de entrega</div>
        </div>
      )}

      {/* Entregado */}
      {order.status === 'delivered' && (
        <div style={{ margin: '16px 20px 0', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '18px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>Entrega completada</div>
          {order.distance_km && <div style={{ fontSize: '13px', color: '#22C55E', marginTop: '6px' }}>{order.distance_km} km recorridos</div>}
          <button onClick={() => router.push('/dashboard')} style={{ marginTop: '16px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui' }}>
            Volver al inicio
          </button>
        </div>
      )}

      {order.status === 'cancelled' && (