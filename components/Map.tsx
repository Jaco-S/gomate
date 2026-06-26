'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number
  lng: number
  zoom?: number
  heading?: number
}

export default function Map({ lat, lng, zoom = 15, heading = 0 }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function createIcon(L: any, bearing: number) {
    return L.divIcon({
      html: `
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;
            width:0;height:0;
            border-left:8px solid transparent;
            border-right:8px solid transparent;
            border-bottom:14px solid #3730C8;
            top:-10px;left:50%;
            transform:translateX(-50%) rotate(${bearing}deg);
            transform-origin:8px 24px;
            filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          "></div>
          <div style="
            width:38px;height:38px;
            background:#fff;
            border-radius:50%;
            border:3px solid #3730C8;
            display:flex;align-items:center;justify-content:center;
            font-size:20px;
            box-shadow:0 3px 12px rgba(55,48,200,0.4);
          ">🛵</div>
        </div>`,
      className: '',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    })
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(containerRef.current!).setView([lat, lng], zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO'
      }).addTo(map)

      const marker = L.marker([lat, lng], { icon: createIcon(L, heading) }).addTo(map)

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
    import('leaflet').then(L =>$content = @'
'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number
  lng: number
  zoom?: number
  heading?: number
}

export default function Map({ lat, lng, zoom = 15, heading = 0 }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function createIcon(L: any, bearing: number) {
    return L.divIcon({
      html: `
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;
            width:0;height:0;
            border-left:8px solid transparent;
            border-right:8px solid transparent;
            border-bottom:14px solid #3730C8;
            top:-10px;left:50%;
            transform:translateX(-50%) rotate(${bearing}deg);
            transform-origin:8px 24px;
            filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          "></div>
          <div style="
            width:38px;height:38px;
            background:#fff;
            border-radius:50%;
            border:3px solid #3730C8;
            display:flex;align-items:center;justify-content:center;
            font-size:20px;
            box-shadow:0 3px 12px rgba(55,48,200,0.4);
          ">🛵</div>
        </div>`,
      className: '',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    })
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(containerRef.current!).setView([lat, lng], zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO'
      }).addTo(map)

      const marker = L.marker([lat, lng], { icon: createIcon(L, heading) }).addTo(map)

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
    import('leaflet').then(L => {
      markerRef.current.setLatLng([lat, lng])
      markerRef.current.setIcon(createIcon(L, heading))
      mapRef.current.setView([lat, lng])
    })
  }, [lat, lng, heading])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
    </div>
  )
}
