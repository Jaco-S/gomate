export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'pickup'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

export interface DeliveryProfile {
  id: string
  user_id: string
  name: string
  phone: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  delivery_id: string
  name: string
  phone: string
  address: string
  reference?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  delivery_id: string
  customer_id: string
  status: OrderStatus
  tracking_token: string
  price: number
  payment_method: string
  distance_km?: number
  delivered_at?: string
  photo_url?: string
  delivery_note?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface OrderTracking {
  id: string
  order_id: string
  latitude: number
  longitude: number
  accuracy?: number
  recorded_at: string
}
