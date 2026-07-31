'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'develop.ecu@gmail.com' // cambia por tu email real

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthorized(true)

      const { data } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })

      setStores(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function approve(id: string) {
    await supabase.from('stores').update({ status: 'active' }).eq('id', id)
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s))
  }

  async function reject(id: string) {
    await supabase.from('stores').update({ status: 'suspended' }).eq('id', id)
    setStores(prev => prev.map(s => s.id === id ? { ...s, status: 'suspended' } : s))
  }

  if (!authorized || loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  const pending = stores.filter(s => s.status === 'pending')
  const active = stores.filter(s => s.status === 'active')
  const suspended = stores.filter(s => s.status === 'suspended')

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      <div style={{ background: '#111', padding: '52px 20px 24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
          M<span style={{ opacity: .5, fontWeight: 400 }}>ovento</span> Admin
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Panel de administración</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
          {[
            { label: 'Pendientes', val: pending.length, color: '#F59E0B' },
            { label: 'Activos', val: active.length, color: '#22C55E' },
            { label: 'Suspendidos', val: suspended.length, color: '#EF4444' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '2px' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pendientes */}
      {pending.length > 0 && (
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B', marginBottom: '12px' }}>⏳ Pendientes de aprobación · {pending.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pending.map(store => (
              <StoreCard key={store.id} store={store} onApprove={() => approve(store.id)} onReject={() => reject(store.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Activos */}
      {active.length > 0 && (
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E', marginBottom: '12px' }}>✅ Locales activos · {active.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {active.map(store => (
              <StoreCard key={store.id} store={store} onReject={() => reject(store.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Suspendidos */}
      {suspended.length > 0 && (
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', marginBottom: '12px' }}>❌ Suspendidos · {suspended.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suspended.map(store => (
              <StoreCard key={store.id} store={store} onApprove={() => approve(store.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StoreCard({ store, onApprove, onReject }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{store.name}</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{store.address}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{store.phone}</div>
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
          background: store.status === 'active' ? '#F0FDF4' : store.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
          color: store.status === 'active' ? '#16A34A' : store.status === 'pending' ? '#D97706' : '#EF4444',
          border: store.status === 'active' ? '1px solid #BBF7D0' : store.status === 'pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
        }}>
          {store.status === 'active' ? 'Activo' : store.status === 'pending' ? 'Pendiente' : 'Suspendido'}
        </span>
      </div>
      {store.description && <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>{store.description}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        {onApprove && (
          <button onClick={onApprove} style={{ flex: 1, height: '40px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui' }}>
            ✓ Aprobar
          </button>
        )}
        {onReject && (
          <button onClick={onReject} style={{ flex: 1, height: '40px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui' }}>
            ✕ {store.status === 'active' ? 'Suspender' : 'Rechazar'}
          </button>
        )}
      </div>
    </div>
  )
}