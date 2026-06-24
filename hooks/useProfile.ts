'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DeliveryProfile } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<DeliveryProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('delivery_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    load()
  }, [])

  return { profile, loading }
}
