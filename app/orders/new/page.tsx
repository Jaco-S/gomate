'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '', reference: '', notes: '', price: '' })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('delivery_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) { setError('Perfil no encontrado'); setLoading(false); return }

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({ delivery_id: profile.id, name: form.name, phone: form.phone, address: form.address, reference: form.reference })
      .select()
      .single()

    if (custErr) { setError(custErr.message); setLoading(false); return }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ delivery_id: profile.id, customer_id: customer.id, price: parseFloat(form.price) || 0, notes: form.notes })
      .select()
      .single()

    if (orderErr) { setError(orderErr.message); setLoading(false); return }

    router.push(`/orders/${order.id}`)
  }

  const inputStyle = { width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '13px 14px', fontSize: '15px', color: '#F0F0F0', outline: 'none', fontFamily: 'system-ui' }

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', fontSize: '20px', color: '#909090' }}>←</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>Nuevo pedido</div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#EF4444' }}>{error}</div>}

        {[
          { label: 'Nombre del cliente', field: 'name', type: 'text', placeholder: 'Juan Rodríguez' },
          { label: 'Teléfono', field: 'phone', type: 'tel', placeholder: '+593 99 000 0000' },
          { label: 'Dirección de entrega', field: 'address', type: 'text', placeholder: 'Calle, número, sector' },
          { label: 'Referencia', field: 'reference', type: 'text', placeholder: 'Frente al parque...' },
          { label: 'Notas', field: 'notes', type: 'text', placeholder: 'Frágil, llamar antes...' },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <div style={{ fontSize: '12px', color: '#909090', fontWeight: 500, marginBottom: '5px' }}>{label}</div>
            <input type={type} value={form[field as keyof typeof form]} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={inputStyle} required={['name','phone','address'].includes(field)} />
          </div>
        ))}

        <div>
          <div style={{ fontSize: '12px', color: '#909090', fontWeight: 500, marginBottom: '5px' }}>Precio acordado ($)</div>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" step="0.01" style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', height: '52px', background: loading ? '#2A2460' : '#3730C8', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px' }}>
          {loading ? 'Creando...' : '✓ Crear pedido'}
        </button>
      </form>
    </div>
  )
}
