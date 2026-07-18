'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isStore = searchParams.get('role') === 'store'
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    storeName: '', storeDescription: '', storeAddress: ''
  })

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

    if (isStore) {
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          user_id: data.user.id,
          name: form.storeName,
          description: form.storeDescription,
          address: form.storeAddress,
          phone: form.phone,
          status: 'pending'
        })

      if (storeError) {
        setError('Error al crear local: ' + storeError.message)
        setLoading(false)
        return
      }
      router.push('/store-admin')
    } else {
      const { error: profileError } = await supabase
        .from('delivery_profiles')
        .insert({ user_id: data.user.id, name: form.name, phone: form.phone })

      if (profileError) {
        setError('Error al crear perfil: ' + profileError.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    }
    router.refresh()
  }

  const inputStyle = {
    width: '100%', background: '#F7F7F7',
    border: '1.5px solid #EBEBEB', borderRadius: '12px',
    padding: '14px 16px', fontSize: '15px', color: '#111',
    outline: 'none', fontFamily: 'system-ui'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: isStore ? '#D97706' : '#FF4B2B', padding: '56px 24px 32px' }}>
        <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '20px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
            M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
          </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-.5px' }}>
          {isStore ? 'Registrar mi local' : 'Crear cuenta'}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px' }}>
          {isStore ? 'Completa los datos de tu negocio' : 'Registro de repartidor'}
        </div>
      </div>

      <div style={{ flex: 1, padding: '28px 20px' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#FFF1EF', border: '1.5px solid #FFCDC6', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#CC2200', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {isStore ? (
            <>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE DEL LOCAL</div>
                <input value={form.storeName} onChange={e => set('storeName', e.target.value)} placeholder="Ej: Burger House" required style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DESCRIPCION</div>
                <input value={form.storeDescription} onChange={e => set('storeDescription', e.target.value)} placeholder="Describe tu negocio" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DIRECCION</div>
                <input value={form.storeAddress} onChange={e => set('storeAddress', e.target.value)} placeholder="Direccion del local" required style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>TELEFONO</div>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+593 99 000 0000" required type="tel" style={inputStyle} />
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE COMPLETO</div>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan Rodriguez" required style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>TELEFONO</div>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+593 99 000 0000" required type="tel" style={inputStyle} />
              </div>
            </>
          )}

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>EMAIL</div>
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" required type="email" style={inputStyle} />
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>CONTRASENA</div>
            <input value={form.password} onChange={e => set('password', e.target.value)} placeholder="min 6 caracteres" required type="password" minLength={6} style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', height: '52px', background: loading ? '#ffb3a3' : (isStore ? '#D97706' : '#FF4B2B'), color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '14px', cursor: 'pointer', marginTop: '8px', fontFamily: 'system-ui' }}>
            {loading ? 'Creando...' : (isStore ? 'Registrar local' : 'Crear cuenta')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
            <span style={{ fontSize: '11px', color: '#ccc', fontWeight: 500 }}>o continua con</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}/>
          </div>

          <button type="button" onClick={async () => {
            localStorage.setItem('movento_role', isStore ? 'store' : 'delivery')
await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })
          }} style={{ width: '100%', height: '52px', background: '#fff', border: '1.5px solid #eee', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: '#333', fontFamily: 'system-ui' }}>
            <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/></svg>
            Continuar con Google
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '4px' }}>
            Ya tienes cuenta?{' '}
            <span onClick={() => router.push('/auth/login')} style={{ color: isStore ? '#D97706' : '#FF4B2B', fontWeight: 700, cursor: 'pointer' }}>
              Inicia sesion
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#bbb' }}>Cargando...</div></div>}>
      <RegisterForm />
    </Suspense>
  )
}