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
      const { data: cats } = await supabase
        .from('store_categories')
        .select('*')
        .order('name')

      const { data: strs } = await supabase
        .from('stores')
        .select('*, category:store_categories(*)')
        .eq('status', 'active')
        .order('name')

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
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        background: '#0D0D0D',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
            Go<span style={{ color: '#3730C8' }}>Mate</span>
          </div>
          <div style={{ fontSize: '12px', color: '#606060' }}>📍 Ecuador</div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar local o comida..."
          style={{
            width: '100%', background: '#171717',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '12px 16px',
            fontSize: '14px', color: '#F0F0F0',
            outline: 'none', fontFamily: 'system-ui'
          }}
        />
      </div>

      {/* Categorías */}
      <div style={{ padding: '16px 20px 8px', overflowX: 'auto', display: 'flex', gap: '8px', scrollbarWidth: 'none' }}>
        <div
          onClick={() => setSelected(null)}
          style={{
            flexShrink: 0, padding: '8px 16px',
            background: !selected ? '#3730C8' : '#171717',
            border: `1px solid ${!selected ? '#3730C8' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '20px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            color: !selected ? '#fff' : '#909090',
            whiteSpace: 'nowrap'
          }}
        >
          🏠 Todos
        </div>
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => setSelected(selected === cat.id ? null : cat.id)}
            style={{
              flexShrink: 0, padding: '8px 16px',
              background: selected === cat.id ? '#3730C8' : '#171717',
              border: `1px solid ${selected === cat.id ? '#3730C8' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              color: selected === cat.id ? '#fff' : '#909090',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.icon} {cat.name}
          </div>
        ))}
      </div>

      {/* Locales */}
      <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#505050', padding: '48px 0', fontSize: '14px' }}>
            Cargando locales...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#505050', padding: '48px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: .3 }}>🏪</div>
            <div style={{ fontSize: '14px' }}>No hay locales disponibles aún</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#404040' }}>Pronto habrá más opciones</div>
          </div>
        )}

        {filtered.map(store => (
          <div
            key={store.id}
            onClick={() => router.push(`/store/${store.id}`)}
            style={{
              background: '#171717',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {/* Cover */}
            <div style={{
              height: '120px',
              background: store.cover_url ? `url(${store.cover_url}) center/cover` : 'linear-gradient(135deg, #1a1a2e, #3730C8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              {!store.cover_url && (
                <div style={{ fontSize: '48px', opacity: .5 }}>{store.category?.icon || '🏪'}</div>
              )}
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: '#16A34A', color: '#fff',
                fontSize: '10px', fontWeight: 700,
                padding: '3px 8px', borderRadius: '20px'
              }}>
                Abierto
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {store.logo_url ? (
                  <img src={store.logo_url} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(55,48,200,0.12)', border: '1px solid rgba(55,48,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {store.category?.icon || '🏪'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>{store.name}</div>
                  <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px' }}>{store.category?.name}</div>
                </div>
              </div>

              {store.description && (
                <div style={{ fontSize: '12px', color: '#606060', marginBottom: '10px', lineHeight: 1.4 }}>
                  {store.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#606060' }}>
                <span>🛵 Envío: ${store.delivery_fee?.toFixed(2) || '0.00'}</span>
                {store.min_order > 0 && <span>📦 Mín: ${store.min_order?.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón volver */}
      <div style={{ padding: '0 20px', marginTop: '8px' }}>
        <div
          onClick={() => router.push('/')}
          style={{ fontSize: '13px', color: '#505050', textAlign: 'center', cursor: 'pointer' }}
        >
          ← Cambiar rol
        </div>
      </div>
    </div>
  )
}
