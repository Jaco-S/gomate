'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StoreRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', description: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { error } = await supabase.from('stores').insert({
      user_id: user.id,
      name: form.name,
      address: form.address,
      phone: form.phone,
      description: form.description,
      status: 'pending'
    })

    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    router.push('/store-admin')
  }

  const inputStyle = {
    width: '100%', background: '#F7F7F7',
    border: '1.5px solid #EBEBEB', borderRadius: '12px',
    padding: '13px 16px', fontSize: '15px', color: '#111',
    outline: 'none', fontFamily: 'system-ui'
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#D97706', padding: '56px 24px 32px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: '16px' }}>
          M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>Registrar mi local</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '6px' }}>Completa los datos de tu negocio</div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE DEL LOCAL</div>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Burger House" required style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DESCRIPCION</div>
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe tu negocio" style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DIRECCION</div>
          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Direccion del local" required style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>TELEFONO</div>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+593 99 000 0000" type="tel" style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', height: '52px', background: loading ? '#F5D79E' : '#D97706', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '14px', cursor: 'pointer', marginTop: '8px', fontFamily: 'system-ui' }}>
          {loading ? 'Registrando...' : 'Registrar local'}
        </button>
      </form>
    </div>
  )
}