'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StorePage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  const [store, setStore] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*, category:store_categories(*)')
        .eq('id', id)
        .single()

      const { data: cats } = await supabase
        .from('product_categories')
        .select('*')
        .eq('store_id', id)
        .order('position')

      const { data: prods } = await supabase
        .from('products')
        .select('*, category:product_categories(*)')
        .eq('store_id', id)
        .eq('is_available', true)
        .order('position')

      setStore(storeData)
      setCategories(cats || [])
      setProducts(prods || [])
      setLoading(false)
    }
    load()
  }, [id])

  function addToCart(productId: string) {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  function removeFromCart(productId: string) {
    setCart(prev => {
      const next = { ...prev }
      if (next[productId] > 1) next[productId]--
      else delete next[productId]
      return next
    })
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartTotal = Object.entries(cart).reduce((sum, [pid, qty]) => {
    const product = products.find(p => p.id === pid)
    return sum + (product?.price || 0) * qty
  }, 0)

  function goToCheckout() {
    const items = Object.entries(cart).map(([pid, qty]) => {
      const product = products.find(p => p.id === pid)
      return { product_id: pid, quantity: qty, unit_price: product?.price, name: product?.name }
    })
    localStorage.setItem('gomate_cart', JSON.stringify({ store_id: id, items, delivery_fee: store?.delivery_fee || 0 }))
    router.push('/checkout')
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#606060' }}>Cargando menú...</div>
    </div>
  )

  const productsByCategory = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id)
  }))

  const uncategorized = products.filter(p => !p.category_id)

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '100px' }}>

      {/* Cover */}
      <div style={{
        height: '180px',
        background: store?.cover_url ? `url(${store.cover_url}) center/cover` : 'linear-gradient(135deg, #1a1a2e, #3730C8)',
        position: 'relative'
      }}>
        <div
          onClick={() => router.push('/marketplace')}
          style={{
            position: 'absolute', top: '16px', left: '16px',
            paddingTop: 'env(safe-area-inset-top)',
            width: '36px', height: '36px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '18px', color: '#fff'
          }}
        >←</div>
      </div>

      {/* Info del local */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          {store?.logo_url ? (
            <img src={store.logo_url} style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(55,48,200,0.12)', border: '1px solid rgba(55,48,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              {store?.category?.icon || '🏪'}
            </div>
          )}
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#F0F0F0' }}>{store?.name}</div>
            <div style={{ fontSize: '13px', color: '#606060', marginTop: '2px' }}>{store?.category?.name}</div>
          </div>
        </div>
        {store?.description && (
          <div style={{ fontSize: '13px', color: '#606060', lineHeight: 1.5, marginBottom: '10px' }}>{store.description}</div>
        )}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#606060' }}>
          <span>🛵 Envío: ${store?.delivery_fee?.toFixed(2)}</span>
          {store?.min_order > 0 && <span>📦 Pedido mínimo: ${store?.min_order?.toFixed(2)}</span>}
          {store?.phone && <span>📞 {store.phone}</span>}
        </div>
      </div>

      {/* Productos sin categoría */}
      {uncategorized.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uncategorized.map(product => (
              <ProductCard key={product.id} product={product} qty={cart[product.id] || 0} onAdd={() => addToCart(product.id)} onRemove={() => removeFromCart(product.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Productos por categoría */}
      {productsByCategory.map(cat => cat.products.length > 0 && (
        <div key={cat.id} style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#606060', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>
            {cat.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cat.products.map((product: any) => (
              <ProductCard key={product.id} product={product} qty={cart[product.id] || 0} onAdd={() => addToCart(product.id)} onRemove={() => removeFromCart(product.id)} />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {products.length === 0 && (
        <div style={{ textAlign: 'center', color: '#505050', padding: '48px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: .3 }}>🍽️</div>
          <div>Este local no tiene productos aún</div>
        </div>
      )}

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', right: '20px',
          background: '#3730C8', borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', zIndex: 100,
          boxShadow: '0 4px 24px rgba(55,48,200,0.5)'
        }} onClick={goToCheckout}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {cartCount}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Ver carrito</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>${(cartTotal + (store?.delivery_fee || 0)).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, qty, onAdd, onRemove }: any) {
  return (
    <div style={{
      background: '#171717',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {product.image_url ? (
        <img src={product.image_url} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
          🍽️
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>{product.name}</div>
        {product.description && (
          <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.description}
          </div>
        )}
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#3730C8', marginTop: '6px' }}>${product.price?.toFixed(2)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {qty > 0 ? (
          <>
            <div onClick={onRemove} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#222', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', color: '#F0F0F0', fontWeight: 700 }}>−</div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
          </>
        ) : null}
        <div onClick={onAdd} style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#3730C8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', color: '#fff', fontWeight: 700 }}>+</div>
      </div>
    </div>
  )
}