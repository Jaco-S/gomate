'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const STATUS_INFO: Record<string, { label: string, sub: string, color: string, icon: string }> = {
  pending:    { label: 'Esperando repartidor', sub: 'Tu pedido está siendo procesado', color: '#909090', icon: '⏳' },
  accepted:   { label: 'Pedido aceptado', sub: 'El repartidor va a buscar tu paquete', color: '#3730C8', icon: '✅' },
  pickup:     { label: 'Recogiendo paquete', sub: 'El repartidor tiene tu pedido', color: '#7C3AED', icon: '📦' },
  in_transit: { label: 'Tu pedido está en camino', sub: 'El repartidor se dirige a tu ubicación', color: '#F59E0B', icon: '🛵' },
  delivered:  { label: '¡Pedido entregado!', sub: 'Tu pedido fue entregado exitosamente', color: '#16A34A', icon: '✅' },
  cancelled:  { label: 'Pedido cancelado', sub: 'Este pedido fue cancelado', color: '#DC2626', icon: '❌' },
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
        .select('*, customer:customers(*)')
        .eq('tracking_token', token)
        .single()

      setOrder(data)
      setLoading(false)

      if (data?.status === 'in_transit') {
        // obtener última posición
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

        // suscribir al canal realtime
        supabase.channel(`tracking:${data.id}`)
          .on('broadcast', { event: 'location' }, ({ payload }) => {
            setPosition({ lat: payload.lat, lng: payload.lng })
            setLastUpdate(new Date().toLocaleTimeString())
          })
          .subscribe()

        // también escuchar cambios en la tabla orders
        supabase.channel(`order:${data.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${data.id}`
          }, ({ new: updated }) => {
            setOrder((prev: any) => ({ ...prev, ...updated }))
          })
          .subscribe()
      }
    }

    load()
  }, [token])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#606060' }}>Cargando...</div>
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', color: '#606060' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
        <div>Pedido no encontrado</div>
      </div>
    </div>
  )

  const info = STATUS_INFO[order.status] || STATUS_INFO.pending

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
          Go<span style={{ color: '#3730C8' }}>Mate</span>
        </div>
        <div style={{ fontSize: '12px', color: '#505050' }}>Seguimiento en vivo</div>
      </div>

      {/* Status banner */}
      <div style={{ margin: '16px 20px', background: `${info.color}15`, border: `1px solid ${info.color}40`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {info.icon}
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>{info.label}</div>
          <div style={{ fontSize: '12px', color: info.color, marginTop: '3px' }}>{info.sub}</div>
        </div>
        {order.status === 'in_transit' && (
          <div style={{ marginLeft: 'auto', width: '9px', height: '9px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.4s infinite', flexShrink: 0 }}/>
        )}
      </div>

      {/* Mapa */}
      {order.status === 'in_transit' && (
        <div style={{ margin: '0 20px', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
          {position ? (
            <Map lat={position.lat} lng={position.lng} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px' }}>📡</div>
              <div style={{ fontSize: '13px', color: '#606060' }}>Esperando ubicación...</div>
            </div>
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#F59E0B', color: '#000', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', zIndex: 1000 }}>
            LIVE
          </div>
        </div>
      )}

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px 20px 0' }}>
        {lastUpdate && (
          <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', color: '#505050', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Actualizado</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>{lastUpdate}</div>
          </div>
        )}
        <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: '#505050', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Dirección</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer?.address}</div>
        </div>
      </div>

      {/* Pago */}
      <div style={{ margin: '12px 20px', background: 'rgba(55,48,200,0.12)', border: '1px solid rgba(55,48,200,0.35)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', color: '#3730C8', fontWeight: 600 }}>💵 Total a pagar en efectivo</div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#3730C8' }}>${order.price?.toFixed(2)}</div>
      </div>

      {/* Entregado — foto */}
      {order.status === 'delivered' && order.photo_url && (
        <div style={{ margin: '0 20px 16px', background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#606060', marginBottom: '10px', fontWeight: 600 }}>FOTO DE ENTREGA</div>
          <img src={order.photo_url} alt="Foto de entrega" style={{ width: '100%', borderRadius: '10px', objectFit: 'cover' }} />
        </div>
      )}

      {order.status === 'delivered' && order.delivery_note && (
        <div style={{ margin: '0 20px 16px', background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '10px' }}>
          <span>📝</span>
          <div style={{ fontSize: '13px', color: '#909090', lineHeight: 1.5 }}>{order.delivery_note}</div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
      `}</style>
    </div>
  )
}