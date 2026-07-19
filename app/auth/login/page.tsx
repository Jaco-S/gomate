'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o contrasena incorrectos'); setLoading(false); return }
    const { data: profile } = await supabase.from('delivery_profiles').select('id').eq('user_id', data.user?.id).single()
    if (profile) { window.location.href = '/dashboard' } else { window.location.href = '/store-admin' }
  }

  const inp = { width: '100%', background: '#F7F7F7', border: '1.5px solid #EBEBEB', borderRadius: '12px', padding: '13px 16px', fontSize: '15px', color: '#111', outline: 'none', fontFamily: 'system-ui' } as React.CSSProperties

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#FF4B2B', padding: '56px 24px 32px' }}>
        <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span></div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>Bienvenido de vuelta</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px' }}>Inicia sesion para continuar</div>
      </div>
      <div style={{ flex: 1, padding: '28px 20px' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && <div style={{ background: '#FFF1EF', border: '1.5px solid #FFCDC6', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#CC2200' }}>{error}</div>}
          <div><div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>EMAIL</div><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={inp} /></div>
          <div><div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>CONTRASENA</div><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 caracteres" required style={inp} /></div>
          <button type="submit" disabled={loading} style={{ width: '100%', height: '52px', background: loading ? '#ffb3a3' : '#FF4B2B', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '14px', cursor: 'pointer', marginTop: '8px', fontFamily: 'system-ui' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}/><span style={{ fontSize: '11px', color: '#ccc' }}>o continua con</span><div style={{ flex: 1, height: '1px', background: '#eee' }}/>
          </div>
          <button type="button" onClick={async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } }) }} style={{ width: '100%', height: '52px', background: '#fff', border: '1.5px solid #eee', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#333', fontFamily: 'system-ui' }}>
            <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
            Continuar con Google
          </button>
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#999' }}>No tienes cuenta? <span onClick={() => router.push('/auth/register')} style={{ color: '#FF4B2B', fontWeight: 700, cursor: 'pointer' }}>Registrate</span></div>
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#999' }}>Eres un local? <span onClick={() => router.push('/auth/register?role=store')} style={{ color: '#D97706', fontWeight: 700, cursor: 'pointer' }}>Registrate aqui</span></div>
        </form>
      </div>
    </div>
  )
}
