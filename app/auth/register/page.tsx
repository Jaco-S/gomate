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
            <div style={{ background: '#FFF1EF', border: '1.5px solid #FFCDC6', borderRadius: '12px', padding: '12px 16px', fontSize: '13px',