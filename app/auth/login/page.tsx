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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

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
      {/* Logo */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-1px' }}>
          Go<span style={{ color: '#3730C8' }}>Mate</span>
        </div>
        <div style={{ fontSize: '14px', color: '#606060', marginTop: '6px' }}>
          Panel del repartidor
        </div>
      </div>

      {/* Card */}
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: '360px',
        background: '#171717',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0', marginBottom: '4px' }}>
          Iniciar sesión
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#EF4444'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#909090', fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            style={{
              background: '#222222',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '13px 14px',
              fontSize: '15px',
              color: '#F0F0F0',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#909090', fontWeight: 500 }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              background: '#222222',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '13px 14px',
              fontSize: '15px',
              color: '#F0F0F0',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: '50px',
            background: loading ? '#2A2460' : '#3730C8',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '4px',
            transition: 'background .15s'
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#606060' }}>
          ¿No tienes cuenta?{' '}
          <a href="/auth/register" style={{ color: '#3730C8', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate
          </a>
        </div>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#606060' }}>
          ¿Eres un local?{' '}
          <a href="/auth/register?role=store" style={{ color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate aquí
          </a>
        </div>
          </a>
        </div>
      </form>
    </div>
  )
}