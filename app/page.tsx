'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F7F7F7',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Hero naranja */}
      <div style={{
        background: '#FF4B2B',
        padding: '56px 24px 36px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
            M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-.5px', lineHeight: 1.2, marginBottom: '6px' }}>
          ¿Qué vas a<br />pedir hoy?
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '20px' }}>
          Entregas rápidas en Machala
        </div>
        <div style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF4B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span style={{ fontSize: '14px', color: '#bbb' }}>Busca un restaurante o producto...</span>
        </div>
      </div>

      {/* Cards de rol */}
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px', padding: '0 4px' }}>
          Elige tu rol
        </div>

        {[
          { icon: '📦', color: '#FF4B2B', bg: '#FFF1EF', title: 'Quiero un pedido', sub: 'Ver locales y ordenar ahora', path: '/marketplace' },
          { icon: '🛵', color: '#4F49E0', bg: '#EEF0FF', title: 'Soy repartidor', sub: 'Gestionar pedidos y entregas', path: '/auth/login' },
          { icon: '🏪', color: '#D97706', bg: '#FFF8EC', title: 'Registrar mi local', sub: 'Sube tu menú y recibe pedidos', path: '/auth/register?role=store' },
        ].map(item => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              border: '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: item.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{item.sub}</div>
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#F5F5F5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', color: '#999', flexShrink: 0
            }}>›</div>
          </div>
        ))}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 4px' }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
          <span style={{ fontSize: '11px', color: '#ccc', fontWeight: 500 }}>o continúa con</span>
          <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
        </div>

        {/* Google */}
        <div
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` }
            })
          }}
          style={{
            background: '#fff',
            border: '1.5px solid #eee',
            borderRadius: '14px',
            padding: '13px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#333',
            cursor: 'pointer',
            margin: '0 4px'
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
          </svg>
          Continuar con Google
        </div>

        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '11px', color: '#ccc' }}>
          Movento · Machala
        </div>
      </div>
    </div>
  )
}