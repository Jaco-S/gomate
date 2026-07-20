'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const STATUS_INFO: Record<string, { label: string, sub: string, color: string, icon: string }> = {
  pending:    { label: 'Esperando repartidor', sub: 'Tu pedido esta siendo procesado', color: '#888', icon: '⏳' },
  accepted:   { label: 'Pedido aceptado', sub: 'El repartidor va a buscar tu paquete', color: '#FF4B2B', icon: '✅' },
  pickup:     { label: 'Recogiendo paquete', sub: 'El repartidor tiene tu pedido', color: '#D97706', icon: '📦' },
  in_transit: { label: 'Tu pedido esta en camino', sub: 'El repartidor se dirige a tu ubicacion', color: '#FF4B2B', icon: '🛵' },
  delivered:  { label: 'Pedido entregado!', sub: 'Tu pedido fue entregado exitosamente', color: '#22C55E', icon: '✅' },
  cancelled:  { label: 'Pedido cancelado', sub: 'Este pedido fue cancelado', color: '#EF4444', icon: '❌' },
}

export default function PublicTrackingPage() {
  const { token } = useParams()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('*, customer:customers(*), customer_v2:customers_v2(*)')
      .eq('tracking_token', token)
      .single()

    setOrder(data)
    setLoading(false)

    if (!data) return

    // escuchar cambios de estado SIEMPRE
    supabase.channel(`order-status:${data.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${data.id}`
      }, ({ new: updated }) => {
        setOrder((prev: any) => ({ ...prev, ...updated }))
      })
      .subscribe()

    if (data?.status === 'in_transit') {
      const { data: tracking } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', data.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (tracking) {
        setPosition({ lat: tracking.latitude, lng: tracking.longitude })
        setLastUpdate(new Date(tracking.recorded_at).toLocaleTimeString())
      }

      supabase.channel(`tracking:${data.id}`)
        .on('broadcast', { event: 'location' }, ({ payload }) => {
          setPosition({ lat: payload.lat, lng: payload.lng })
          setLastUpdate(new Date().toLocaleTimeString())
        })
        .subscribe()
    }
  }
  load()
}, [token])

useEffect(() => {
  if (!order || order.status !== 'in_transit') return

  const supabase = createClient()

  const trackingChannel = supabase.channel(`tracking:${order.id}`)
    .on('broadcast', { event: 'location' }, ({ payload }) => {
      setPosition({ lat: payload.lat, lng: payload.lng })
      setLastUpdate(new Date().toLocaleTimeString())
    })
    .subscribe()

  return () => { supabase.removeChannel(trackingChannel) }
}, [order?.status])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', color: '#bbb' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
        <div>Pedido no encontrado</div>
      </div>
    </div>
  )

  const info = STATUS_INFO[order.status] || STATUS_INFO.pending
  const clientName = order.customer_v2?.name || order.customer?.name || 'Cliente'
  const clientAddress = order.customer_v2?.address || order.customer?.address || ''

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
            M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px' }}>
            Seguimiento en vivo
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ margin: '16px 20px 0', background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, border: `1.5px solid ${info.color}30` }}>
          {info.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{info.label}</div>
          <div style={{ fontSize: '12px', color: info.color, marginTop: '3px', fontWeight: 500 }}>{info.sub}</div>
        </div>
        {order.status === 'in_transit' && (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4B2B', animation: 'pulse 1.4s infinite', flexShrink: 0 }}/>
        )}
      </div>

      {/* Mapa */}
      {order.status === 'in_transit' && (
        <div style={{ margin: '12px 20px', height: '220px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', position: 'relative' }}>
          {position ? (
            <Map lat={position.lat} lng={position.lng} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px' }}>📡</div>
              <div style={{ fontSize: '13px', color: '#bbb' }}>Esperando ubicacion...</div>
            </div>
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#FF4B2B', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', zIndex: 1000 }}>
            LIVE
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 20px', marginTop: order.status !== 'in_transit' ? '12px' : '0' }}>
        {lastUpdate && (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#bbb', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Actualizado</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{lastUpdate}</div>
          </div>
        )}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#bbb', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Cliente</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</div>
        </div>
      </div>

      {/* Direccion */}
      {clientAddress && (
        <div style={{ margin: '10px 20px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>📍</span>
          <div style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>{clientAddress}</div>
        </div>
      )}

      {/* Pago */}
      <div style={{ margin: '10px 20px', background: '#FFF1EF', border: '1.5px solid #FFCDC6', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', color: '#FF4B2B', fontWeight: 600 }}>💵 Total a pagar en efectivo</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF4B2B' }}>${order.price?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</div>
      </div>
{order.status === 'delivered' && (
  <div style={{ padding: '0 20px 16px' }}>
    <button onClick={() => window.location.href = '/'} style={{
      width: '100%', height: '52px',
      background: '#FF4B2B', color: '#fff',
      fontSize: '15px', fontWeight: 700,
      border: 'none', borderRadius: '14px',
      cursor: 'pointer', fontFamily: 'system-ui'
    }}>
      Hacer otro pedido
    </button>
  </div>
)}
      {order.status === 'delivered' && order.photo_url && (
        <div style={{ margin: '10px 20px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#bbb', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' }}>Foto de entrega</div>
          <img src={order.photo_url} alt="Foto de entrega" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover' }} />
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}