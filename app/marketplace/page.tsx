'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarketplacePage() {
  const router = useRouter()
  const supabase = createClient()
  const [stores, setStores] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase.from('store_categories').select('*').order('name')
      const { data: strs } = await supabase.from('stores').select('*, category:store_categories(*)').eq('status', 'active').order('name')
      setCategories(cats || [])
      setStores(strs || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = stores.filter(s => {
    const matchCat = selected ? s.category_id === selected : true
    const matchSearch = search ? s.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
            M<span style={{ opacity: .7, fontWeight: 400 }}>ovento</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📍 Machala
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Busca un restaurante o producto..."
            style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#333', background: 'transparent', width: '100%', fontFamily: 'system-ui' }}
          />
        </div>
      </div>

      {/* Categorías */}
      <div style={{ padding: '14px 20px 4px', overflowX: 'auto', display: 'flex', gap: '8px', scrollbarWidth: 'none' }}>
        <div onClick={() => setSelected(null)} style={{ flexShrink: 0, padding: '7px 16px', background: !selected ? '#FF4B2B' : '#fff', border: `1.5px solid ${!selected ? '#FF4B2B' : '#eee'}`, borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: !selected ? '#fff' : '#888', whiteSpace: 'nowrap' }}>
          Todos
        </div>
        {categories.map(cat => (
          <div key={cat.id} onClick={() => setSelected(selected === cat.id ? null : cat.id)} style={{ flexShrink: 0, padding: '7px 16px', background: selected === cat.id ? '#FF4B2B' : '#fff', border: `1.5px solid ${selected === cat.id ? '#FF4B2B' : '#eee'}`, borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: selected === cat.id ? '#fff' : '#888', whiteSpace: 'nowrap' }}>
            {cat.icon} {cat.name}
          </div>
        ))}
      </div>

      {/* Locales */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 0', fontSize: '14px' }}>Cargando locales...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏪</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#999' }}>No hay locales disponibles</div>
            <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>Pronto habrá más opciones</div>
          </div>
        )}

        {filtered.map(store => (
          <div key={store.id} onClick={() => router.push(`/store/${store.id}`)} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ height: '130px', background: store.cover_url ? `url(${store.cover_url}) center/cover` : 'linear-gradient(135deg, #FF4B2B, #FF8C69)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {!store.cover_url && <div style={{ fontSize: '48px', opacity: .4 }}>{store.category?.icon || '🏪'}</div>}
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#22C55E', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Abierto</div>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFF1EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {store.category?.icon || '🏪'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{store.name}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '1px' }}>{store.category?.name}</div>
                </div>
              </div>
              {store.description && <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', lineHeight: 1.4 }}>{store.description}</div>}
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#bbb', fontWeight: 500 }}>
                <span>🛵 Envio: ${store.delivery_fee?.toFixed(2) || '0.00'}</span>
                {store.min_order > 0 && <span>📦 Min: ${store.min_order?.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => router.push('/')} style={{ textAlign: 'center', fontSize: '13px', color: '#bbb', cursor: 'pointer', padding: '8px 0' }}>
        ← Cambiar rol
      </div>
    </div>
  )
}