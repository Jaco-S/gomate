'use client'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', fontSize: '20px', color: '#909090' }}>←</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>Pedidos</div>
      </div>
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#505050' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
        <div>No hay pedidos aún</div>
        <div onClick={() => router.push('/orders/new')} style={{ marginTop: '20px', display: 'inline-block', background: '#3730C8', color: '#fff', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
          + Nuevo pedido
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#171717', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[{ icon: '🏠', label: 'Inicio', path: '/dashboard' }, { icon: '📋', label: 'Pedidos', path: '/orders' }, { icon: '📊', label: 'Historial', path: '/history' }].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/orders' ? '#3730C8' : '#505050', fontSize: '10px', fontWeight: 500 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
