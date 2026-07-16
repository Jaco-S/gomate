'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // verificar si es repartidor
      const { data: delivery } = await supabase
        .from('delivery_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (delivery) { router.push('/dashboard'); return }

      // verificar si es local
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (store) { router.push('/store-admin'); return }

      // nuevo usuario sin perfil — ir al selector de rol
      router.push('/')
    }

    handleCallback()
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>M<span style={{ opacity: .5 }}>ovento</span></div>
        <div style={{ color: '#bbb', fontSize: '14px' }}>Iniciando sesion...</div>
      </div>
    </div>
  )
}