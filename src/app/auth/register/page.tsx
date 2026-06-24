'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. crear usuario en auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Error al crear cuenta')
      setLoading(false)
      return
    }

    // 2. crear perfil de repartidor
    const { error: profileError } = await supabase
      .from('delivery_profiles')
      .insert({
        user_id: data.user.id,
        name: form.name,
        phone: form.phone
      })

    if (profileError) {
      setError('Error al crear perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
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
    width: '100%',
    fontFamily: 'system-ui, sans-serif'
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
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-1px' }}>
          Go<span style={{ color: '#3730C8' }}>Mate</span>
        </div>
        <div style={{ fontSize: '14px', color: '#606060', marginTop: '6px' }}>
          Crea tu cuenta de repartidor
        </div>
      </div>

      {/* Card */}
      <form onSubmit={handleRegister} style={{
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
          Crear cuenta
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

        {[
          { label: 'Nombre completo', field: 'name', type: 'text', placeholder: 'Juan Rodríguez' },
          { label: 'Teléfono', field: 'phone', type: 'tel', placeholder: '+593 99 000 0000' },
          { label: 'Email', field: 'email', type: 'email', placeholder: 'tu@email.com' },
          { label: 'Contraseña', field: 'password', type: 'password', placeholder: '••••••••' },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#909090', fontWeight: 500 }}>{label}</label>
            <input
              type={type}
              value={form[field as keyof typeof form]}
              onChange={e => set(field, e.target.value)}
              placeholder={placeholder}
              required
              minLength={field === 'password' ? 6 : undefined}
              style={inputStyle}
            />
          </div>
        ))}

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
            marginTop: '4px'
          }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#606060' }}>
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" style={{ color: '#3730C8', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión
          </a>
        </div>
      </form>
    </div>
  )
}