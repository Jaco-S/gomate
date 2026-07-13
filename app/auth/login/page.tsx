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

    if (error) {
      setError('Email o contrasena incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('delivery_profiles')
      .select('id')
      .eq('user_id', data.user?.id)
      .single()

    if (profile) {
      router.push('/dashboard')
    } else {
      router.push('/store-admin')
    }
    router.refresh()
  }

  const inputStyle = {
    background: '#222222',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '13px 14px',
    fontSize: '15px',
    color: '#F0F0F0',
    outline: 'none',
    width: '100%'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-1px' }}>
          <span style={{ color: '#3730C8' }}>Movento</span>
        </div>
        <div style={{ fontSize: '14px', color: '#606060', marginTop: '6px' }}>Iniciar sesion</div>
      </div>

      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '360px', background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0', marginBottom: '4px' }}>Ingresar</div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#EF4444' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#909090', fontWeight: 500 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#909090', fontWeight: 500 }}>Contrasena</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 caracteres" required style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', height: '50px', background: loading ? '#2A2460' : '#3730C8', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '4px' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }}/>
          <span style={{ fontSize: '12px', color: '#505050' }}>o continua con</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }}/>
        </div>

        <button type="button" onClick={async () => { const supabase = createClient(); await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } }) }} style={{ width: '100%', height: '50px', background: '#171717', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#F0F0F0', fontFamily: 'system-ui' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
          Continuar con Google
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#606060' }}>
          No tienes cuenta? <a href="/auth/register" style={{ color: '#3730C8', fontWeight: 600, textDecoration: 'none' }}>Registrate</a>
        </div>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#606060' }}>
          Eres un local? <a href="/auth/register?role=store" style={{ color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>Registrate aqui</a>
        </div>
      </form>
    </div>
  )
}
