'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Error al crear cuenta')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('delivery_profiles')
      .insert({ user_id: data.user.id, name: form.name, phone: form.phone })

    if (profileError) {
      setError('Error al crear perfil: ' + profileError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    background: '#F7F7F7',
    border: '1.5px solid #EBEBEB',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '15px',
    color: '#111',
    outline: 'none',
    fontFamily: 'system-ui'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '56px 24px 32px' }}>
        <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
            M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
          </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-.5px' }}>
          Crear cuenta
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px' }}>
          Registro de repartidor
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '28px 20px' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {error && (
            <div style={{ background: '#FFF1EF', border: '1.5px solid #FFCDC6', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#CC2200', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {[
            { label: 'NOMBRE COMPLETO', field: 'name', type: 'text', placeholder: 'Juan Rodriguez' },
            { label: 'TELEFONO', field: 'phone', type: 'tel', placeholder: '+593 99 000 0000' },
            { label: 'EMAIL', field: 'email', type: 'email', placeholder: 'tu@email.com' },
            { label: 'CONTRASENA', field: 'password', type: 'password', placeholder: 'min 6 caracteres' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '6px' }}>{label}</div>
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

          <button type="submit" disabled={loading} style={{
            width: '100%', height: '52px',
            background: loading ? '#ffb3a3' : '#FF4B2B',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            marginTop: '8px', fontFamily: 'system-ui'
          }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: 500 }}>o continua con</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
          </div>

          {/* Google */}
          <button type="button" onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` }
            })
          }} style={{
            width: '100%', height: '52px',
            background: '#fff', border: '1.5px solid #eee',
            borderRadius: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontSize: '14px', fontWeight: 600, color: '#333', fontFamily: 'system-ui'
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
            </svg>
            Continuar con Google
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '8px' }}>
            Ya tienes cuenta?{' '}
            <span onClick={() => router.push('/auth/login')} style={{ color: '#FF4B2B', fontWeight: 700, cursor: 'pointer' }}>
              Inicia sesion
            </span>
          </div>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#999' }}>
            Eres un local?{' '}
            <span onClick={() => router.push('/auth/register?role=store')} style={{ color: '#D97706', fontWeight: 700, cursor: 'pointer' }}>
              Registrate aqui
            </span>
          </div>

        </form>
      </div>
    </div>
  )
}