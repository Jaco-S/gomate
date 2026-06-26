'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number
  lng: number
  zoom?: number
}

export default function Map({ lat, lng, zoom = 15 }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(containerRef.current!).setView([lat, lng], zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO'
      }).addTo(map)

      const motoIcon = L.divIcon({
        html: `<div style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🛵</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      const marker = L.marker([lat, lng], { icon: motoIcon }).addTo(map)

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng])
  }, [lat, lng])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
    </div>
  )
}
