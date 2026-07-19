'use client'

import { useEffect, useState } from 'react'
import { getFirebaseMessaging } from '@/lib/firebase/config'
import { getToken } from 'firebase/messaging'
import { createClient } from '@/lib/supabase/client'

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<string>('default')

  async function requestPermission() {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return

    const perm = await Notification.requestPermission()
    setPermission(perm)

    if (perm !== 'granted') return

    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    })

    if (!fcmToken) return
    setToken(fcmToken)

    // guardar token en Supabase
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('delivery_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    await supabase.from('push_subscriptions').upsert({
      delivery_id: profile.id,
      endpoint: fcmToken,
      p256dh: 'fcm',
      auth: 'fcm'
    }, { onConflict: 'delivery_id,endpoint' })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermission(Notification.permission)
  }, [])

  return { token, permission, requestPermission }
}