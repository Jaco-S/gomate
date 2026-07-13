'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [cart, setCart] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', address: '', reference: '', payment_method: 'cash', notes: ''
  })

  useEffect(() => {
    const cartData = localStorage.getItem('gomate_cart')
    if (!cartData) { router.push('/marketplace'); return }
    const parsed = JSON.parse(cartData)
    setCart(parsed)
    supabase.from('stores').select('*').eq('id', parsed.store_id).single()
      .then(({ data }) => setStore(data))
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const subtotal = cart?.items?.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0) || 0
  const deliveryFee = cart?.delivery_fee || 0
  const total = subtotal + deliveryFee

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: customer, error: custErr } = await supabase
      .from('customers_v2')
      .insert({ name: form.name, phone: form.phone, address: form.address })
      .select().single()

    if (custErr) { setLoading(false); alert('Error: ' + custErr.message); return }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_v2_id: customer.id,
        store_id: cart.store_id,
        subtotal, delivery_fee: deliveryFee, total, price: total,
        payment_method_v2: form.payment_method,
        notes: form.notes, status: 'pending'
      })
      .select().single()

    if (orderErr) { setLoading(false); alert('Error: ' + orderErr.message); return }

    const items = cart.items.map((item: any) => ({
      order_id: order.id, product_id: item.product_id,
      quantity: item.quantity, unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity
    }))
    await supabase.from('order_items').insert(items)
    await supabase.from('payments').insert({ order_id: order.id, method: form.payment_method, amount: total, status: 'pending' })

    localStorage.removeItem('gomate_cart')
    router.push(`/t/${order.tracking_token}`)
  }

  const inputStyle = {
    width: '100%', background: '#F7F7F7',
    border: '1.5px solid #EBEBEB', borderRadius: '12px',
    padding: '14px 16px', fontSize: '15px', color: '#111',
    outline: 'none', fontFamily: 'system-ui'
  }

  if (!cart) return null

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ background: '#FF4B2B', padding: '52px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div onClick={() => router.back()} style={{ cursor: 'pointer', fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}>←</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Confirmar pedido</div>
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginLeft: '32px' }}>
          {store?.name}
        </div>
      </div>

      <form onSubmit={handleOrder} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Resumen */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Tu pedido</div>
          {cart.items?.map((item: any) => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              <span>{item.quantity}x {item.name}</span>
              <span style={{ fontWeight: 600, color: '#111' }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: '#f0f0f0', margin: '12px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#999', marginBottom: '6px' }}>
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#999', marginBottom: '6px' }}>
            <span>🛵 Envio</span><span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#111', marginTop: '8px' }}>
            <span>Total</span>
            <span style={{ color: '#FF4B2B' }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Datos */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>Tus datos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOMBRE</div>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tu nombre" required style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>TELEFONO</div>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+593 99 000 0000" required type="tel" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>Direccion de entrega</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>DIRECCION</div>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle, numero, sector" required style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>REFERENCIA</div>
              <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Frente al parque..." style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>NOTAS</div>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Opcional" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Pago */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '14px' }}>Metodo de pago</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'cash', label: '💵 Efectivo' },
              { value: 'transfer', label: '🏦 Transferencia' }
            ].map(opt => (
              <div key={opt.value} onClick={() => set('payment_method', opt.value)} style={{ flex: 1, padding: '14px', background: form.payment_method === opt.value ? '#FFF1EF' : '#F7F7F7', border: `1.5px solid ${form.payment_method === opt.value ? '#FF4B2B' : '#EBEBEB'}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: form.payment_method === opt.value ? '#FF4B2B' : '#888' }}>
                {opt.label}
              </div>
            ))}
          </div>

          {form.payment_method === 'transfer' && (
            <div style={{ marginTop: '12px', background: '#FFF8EC', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', marginBottom: '6px' }}>Datos para transferencia:</div>
              <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>
                Banco: Banco Pichincha<br/>
                Cuenta: 1234567890<br/>
                Tipo: Corriente<br/>
                Nombre: Movento Delivery
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', height: '54px', background: loading ? '#ffb3a3' : '#FF4B2B', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', borderRadius: '16px', cursor: 'pointer', fontFamily: 'system-ui', boxShadow: '0 4px 16px rgba(255,75,43,0.35)' }}>
          {loading ? 'Procesando...' : `Hacer pedido · $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}