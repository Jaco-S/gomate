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
    name: '',
    phone: '',
    address: '',
    reference: '',
    payment_method: 'cash',
    notes: ''
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

    // 1. crear cliente
    const { data: customer, error: custErr } = await supabase
      .from('customers_v2')
      .insert({ name: form.name, phone: form.phone, address: form.address })
      .select()
      .single()

    if (custErr) { setLoading(false); alert('Error al crear cliente'); return }

    // 2. obtener primer repartidor disponible
    const { data: delivery } = await supabase
      .from('delivery_profiles')
      .select('id')
      .eq('is_available', true)
      .limit(1)
      .single()

    if (!delivery) { setLoading(false); alert('No hay repartidores disponibles ahora'); return }

    // 3. crear order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        delivery_id: delivery.id,
        customer_id: delivery.id, // placeholder
        customer_v2_id: customer.id,
        store_id: cart.store_id,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        price: total,
        payment_method_v2: form.payment_method,
        notes: form.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (orderErr) { setLoading(false); alert('Error al crear pedido: ' + orderErr.message); return }

    // 4. crear order_items
    const items = cart.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity
    }))

    await supabase.from('order_items').insert(items)

    // 5. crear payment
    await supabase.from('payments').insert({
      order_id: order.id,
      method: form.payment_method,
      amount: total,
      status: 'pending'
    })

    // 6. limpiar carrito
    localStorage.removeItem('gomate_cart')

    // 7. ir al tracking
    router.push(`/t/${order.tracking_token}`)
  }

  const inputStyle = {
    width: '100%', background: '#222',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', padding: '13px 14px',
    fontSize: '15px', color: '#F0F0F0',
    outline: 'none', fontFamily: 'system-ui'
  }

  if (!cart) return null

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div onClick={() => router.back()} style={{ cursor: 'pointer', fontSize: '20px', color: '#909090' }}>←</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0' }}>Confirmar pedido</div>
      </div>

      <form onSubmit={handleOrder} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Resumen del carrito */}
        <div style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>
            🏪 {store?.name}
          </div>
          {cart.items?.map((item: any) => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#F0F0F0', marginBottom: '8px' }}>
              <span>{item.quantity}x {item.name}</span>
              <span style={{ fontWeight: 600 }}>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#606060', marginBottom: '6px' }}>
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#606060', marginBottom: '6px' }}>
            <span>🛵 Envío</span><span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#F0F0F0', marginTop: '8px' }}>
            <span>Total</span><span style={{ color: '#3730C8' }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Datos del cliente */}
        <div>
          <div style={{ fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Tus datos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#909090', marginBottom: '5px' }}>Nombre</div>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tu nombre" required style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#909090', marginBottom: '5px' }}>Teléfono</div>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+593 99 000 0000" required type="tel" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div>
          <div style={{ fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Dirección de entrega</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#909090', marginBottom: '5px' }}>Dirección</div>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle, número, sector" required style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#909090', marginBottom: '5px' }}>Referencia</div>
              <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Frente al parque, edificio azul..." style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#909090', marginBottom: '5px' }}>Notas para el repartidor</div>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Opcional" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <div style={{ fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Método de pago</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'cash', label: '💵 Efectivo' },
              { value: 'transfer', label: '🏦 Transferencia' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => set('payment_method', opt.value)}
                style={{
                  flex: 1, padding: '14px',
                  background: form.payment_method === opt.value ? 'rgba(55,48,200,0.12)' : '#171717',
                  border: `1px solid ${form.payment_method === opt.value ? '#3730C8' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '12px', textAlign: 'center',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  color: form.payment_method === opt.value ? '#3730C8' : '#909090'
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>

          {form.payment_method === 'transfer' && (
            <div style={{ marginTop: '12px', background: 'rgba(55,48,200,0.08)', border: '1px solid rgba(55,48,200,0.2)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '13px', color: '#3730C8', fontWeight: 600, marginBottom: '6px' }}>Datos para transferencia:</div>
              <div style={{ fontSize: '12px', color: '#606060', lineHeight: 1.6 }}>
                Banco: Banco Pichincha<br />
                Cuenta: 1234567890<br />
                Tipo: Corriente<br />
                Nombre: GoMate Delivery
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', height: '54px',
            background: loading ? '#2A2460' : '#3730C8',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            fontFamily: 'system-ui'
          }}
        >
          {loading ? 'Procesando...' : `Hacer pedido · $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}