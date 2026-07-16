'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StoreSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', delivery_fee: '', min_order: ''
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: storeData } = await supabase
        .from('stores').select('*').eq('user_id', user.id).single()

      if (!storeData) { router.push('/'); return }

      setStore(storeData)
      setForm({
        name: storeData.name || '',
        description: storeData.description || '',
        address: storeData.address || '',
        phone: storeData.phone || '',
        delivery_fee: storeData.delivery_fee?.toString() || '0',
        min_order: storeData.min_order?.toString() || '0'
      })
      setLoading(false)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    await supabase.from('stores').update({
      name: form.name,
      description: form.description,
      address: form.address,
      phone: form.phone,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      min_order: parseFloat(form.min_order) || 0
    }).eq('id', store.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: '100%', background: '#F7F7F7',
    border: '1.5px solid #EBEBEB', borderRadius: '12px',
    padding: '13px 16px', fontSize: '15px', color: '#111',
    outline: 'none', fontFamily: 'system-ui'
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#D97706', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div onClick={() => router.push('/store-admin')} style={{ cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}>←</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Configuracion del local</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '32px', marginTop: '4px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: store?.status === 'active' ? '#86EFAC' : '#FDE68A' }}/>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
            {store?.status === 'active' ? 'Local activo' : 'Pendiente de aprobacion por el administrador'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {saved && (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#16A34A', fontWeight: 600, textAlign: 'center' }}>
            ✅ Cambios guardados
          </div>
        )}

        {/* Informacion basica */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>Informacion basica</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE DEL LOCAL</div>
              <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DESCRIPCION</div>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe tu negocio" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DIRECCION</div>
              <input value={form.address} onChange={e => set('address', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>TELEFONO / WHATSAPP</div>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>Configuracion de entrega</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>COSTO DE ENVIO ($)</div>
              <input value={form.delivery_fee} onChange={e => set('delivery_fee', e.target.value)} type="number" step="0.01" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>PEDIDO MINIMO ($)</div>
              <input value={form.min_order} onChange={e => set('min_order', e.target.value)} type="number" step="0.01" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Estado */}
        <div style={{ background: store?.status === 'active' ? '#F0FDF4' : '#FFF8EC', borderRadius: '16px', padding: '16px', border: store?.status === 'active' ? '1.5px solid #BBF7D0' : '1.5px solid #FDE68A' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: store?.status === 'active' ? '#16A34A' : '#D97706', marginBottom: '4px' }}>
            {store?.status === 'active' ? '✅ Local aprobado y activo' : '⏳ Pendiente de aprobacion'}
          </div>
          <div style={{ fontSize: '12px', color: store?.status === 'active' ? '#22C55E' : '#D97706' }}>
            {store?.status === 'active'
              ? 'Tu local aparece en el marketplace de Movento'
              : 'El administrador revisara y aprobara tu local pronto'}
          </div>
        </div>

        <button type="submit" disabled={saving} style={{
          width: '100%', height: '52px',
          background: saving ? '#F5D79E' : '#D97706',
          color: '#fff', fontSize: '15px', fontWeight: 700,
          border: 'none', borderRadius: '14px', cursor: 'pointer',
          fontFamily: 'system-ui'
        }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '📋', label: 'Pedidos', path: '/store-admin' },
          { icon: '🍽️', label: 'Productos', path: '/store-admin/products' },
          { icon: '⚙️', label: 'Mi local', path: '/store-admin/settings' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/store-admin/settings' ? '#D97706' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}