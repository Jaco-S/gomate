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

      // nuevo usuario — ir al selector de rol
      router.push('/')
    }

    handleCallback()
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ color: '#606060', fontSize: '14px' }}>Iniciando sesión...</div>
    </div>
  )
}
