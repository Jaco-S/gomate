'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StoreProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [store, setStore] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', category_id: ''
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: storeData } = await supabase
        .from('stores').select('*').eq('user_id', user.id).single()

      if (!storeData) { router.push('/'); return }
      setStore(storeData)

      const { data: cats } = await supabase
        .from('product_categories').select('*')
        .eq('store_id', storeData.id).order('position')

      const { data: prods } = await supabase
        .from('products').select('*, category:product_categories(*)')
        .eq('store_id', storeData.id).order('position')

      setCategories(cats || [])
      setProducts(prods || [])
      setLoading(false)
    }
    load()
  }, [])

  async function addCategory() {
    if (!newCategory.trim()) return
    const { data } = await supabase
      .from('product_categories')
      .insert({ store_id: store.id, name: newCategory, position: categories.length })
      .select().single()
    setCategories(prev => [...prev, data])
    setNewCategory('')
    setShowNewCategory(false)
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.price) return
    const { data } = await supabase
      .from('products')
      .insert({
        store_id: store.id,
        category_id: newProduct.category_id || null,
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        is_available: true,
        position: products.length
      })
      .select('*, category:product_categories(*)').single()
    setProducts(prev => [...prev, data])
    setNewProduct({ name: '', description: '', price: '', category_id: '' })
    setShowNewProduct(false)
  }

  async function toggleAvailable(productId: string, current: boolean) {
    await supabase.from('products').update({ is_available: !current }).eq('id', productId)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: !current } : p))
  }

  async function deleteProduct(productId: string) {
    await supabase.from('products').delete().eq('id', productId)
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const inputStyle = {
    width: '100%', background: '#F7F7F7',
    border: '1.5px solid #EBEBEB', borderRadius: '10px',
    padding: '12px 14px', fontSize: '14px', color: '#111',
    outline: 'none', fontFamily: 'system-ui'
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#bbb' }}>Cargando...</div>
    </div>
  )

  const productsByCategory = categories.map(cat => ({
    ...cat, products: products.filter(p => p.category_id === cat.id)
  }))
  const uncategorized = products.filter(p => !p.category_id)

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: '#D97706', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div onClick={() => router.push('/store-admin')} style={{ cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}>←</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Mis productos</div>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginLeft: '32px' }}>{store?.name}</div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setShowNewCategory(true)} style={{ flex: 1, height: '44px', background: '#fff', border: '1.5px solid #eee', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#D97706', cursor: 'pointer', fontFamily: 'system-ui' }}>
          + Nueva categoría
        </button>
        <button onClick={() => setShowNewProduct(true)} style={{ flex: 1, height: '44px', background: '#D97706', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'system-ui' }}>
          + Nuevo producto
        </button>
      </div>

      {/* Modal nueva categoría */}
      {showNewCategory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Nueva categoría</div>
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ej: Hamburguesas, Bebidas..." style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setShowNewCategory(false)} style={{ flex: 1, height: '48px', background: '#F7F7F7', border: '1.5px solid #eee', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: 'system-ui' }}>Cancelar</button>
              <button onClick={addCategory} style={{ flex: 1, height: '48px', background: '#D97706', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'system-ui' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo producto */}
      {showNewProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>Nuevo producto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE</div>
                <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Burger Clasica" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DESCRIPCION</div>
                <input value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Ingredientes o descripcion breve" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>PRECIO ($)</div>
                <input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="0.00" type="number" step="0.01" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>CATEGORIA</div>
                <select value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Sin categoria</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowNewProduct(false)} style={{ flex: 1, height: '48px', background: '#F7F7F7', border: '1.5px solid #eee', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: 'system-ui' }}>Cancelar</button>
              <button onClick={addProduct} style={{ flex: 1, height: '48px', background: '#D97706', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'system-ui' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {products.length === 0 && !showNewProduct && (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '48px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#999' }}>No hay productos aun</div>
            <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>Agrega tu primer producto</div>
          </div>
        )}

        {uncategorized.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>Sin categoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uncategorized.map(product => (
                <ProductCard key={product.id} product={product} onToggle={() => toggleAvailable(product.id, product.is_available)} onDelete={() => deleteProduct(product.id)} />
              ))}
            </div>
          </div>
        )}

        {productsByCategory.map(cat => cat.products.length > 0 && (
          <div key={cat.id}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>{cat.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cat.products.map((product: any) => (
                <ProductCard key={product.id} product={product} onToggle={() => toggleAvailable(product.id, product.is_available)} onDelete={() => deleteProduct(product.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', zIndex: 100 }}>
        {[
          { icon: '📋', label: 'Pedidos', path: '/store-admin' },
          { icon: '🍽️', label: 'Productos', path: '/store-admin/products' },
          { icon: '⚙️', label: 'Mi local', path: '/store-admin/settings' },
        ].map(item => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', color: item.path === '/store-admin/products' ? '#D97706' : '#bbb', fontSize: '10px', fontWeight: 600 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product, onToggle, onDelete }: any) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', opacity: product.is_available ? 1 : 0.5 }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#FFF8EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
        🍽️
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{product.name}</div>
        {product.description && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.description}</div>}
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>${product.price?.toFixed(2)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
        <div onClick={onToggle} style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', background: product.is_available ? '#F0FDF4' : '#F7F7F7', color: product.is_available ? '#16A34A' : '#999', border: product.is_available ? '1px solid #BBF7D0' : '1px solid #eee' }}>
          {product.is_available ? 'Disponible' : 'No disponible'}
        </div>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <div onClick={() => setConfirmDelete(false)} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: '#F7F7F7', color: '#888', cursor: 'pointer', border: '1px solid #eee' }}>No</div>
            <div onClick={onDelete} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', border: '1px solid #FECACA' }}>Si</div>
          </div>
        ) : (
          <div onClick={() => setConfirmDelete(true)} style={{ fontSize: '10px', color: '#EF4444', cursor: 'pointer', padding: '3px 8px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FECACA' }}>Eliminar</div>
        )}
      </div>
    </div>
  )
}