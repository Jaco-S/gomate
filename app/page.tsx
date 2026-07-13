'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0D0D0D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-1px' }}>
         <span style={{ color: '#3730C8' }}>Movento</span>
        </div>
        <div style={{ fontSize: '14px', color: '#606060', marginTop: '8px' }}>
          Entregas en tiempo real · Machala
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Cliente */}
        <div
          onClick={() => { setLoading('client'); router.push('/marketplace') }}
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'border-color .2s'
          }}
        >
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(22,163,74,0.12)',
            border: '1px solid rgba(22,163,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', flexShrink: 0
          }}>📦</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F0' }}>Quiero un pedido</div>
            <div style={{ fontSize: '13px', color: '#606060', marginTop: '4px' }}>Ver locales y hacer un pedido</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '20px', color: '#505050' }}>›</div>
        </div>

        {/* Repartidor */}
        <div
          onClick={() => { setLoading('delivery'); router.push('/auth/login') }}
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'border-color .2s'
          }}
        >
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(55,48,200,0.12)',
            border: '1px solid rgba(55,48,200,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', flexShrink: 0
          }}>🛵</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F0' }}>Soy repartidor</div>
            <div style={{ fontSize: '13px', color: '#606060', marginTop: '4px' }}>Gestionar pedidos y entregas</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '20px', color: '#505050' }}>›</div>
        </div>

        {/* Local/Negocio */}
        <div
          onClick={() => { setLoading('store'); router.push('/auth/register?role=store') }}
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0
          }}>🏪</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>Registrar mi local</div>
            <div style={{ fontSize: '12px', color: '#606060', marginTop: '3px' }}>Sube tu menú y recibe pedidos</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '20px', color: '#505050' }}>›</div>
        </div>
      </div>

      <div style={{ marginTop: '32px', fontSize: '11px', color: '#404040', textAlign: 'center' }}>
        Movento · Ecuador · $0/mes
      </div>
    </div>
  )
}
