import { useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'

let leafletLoader = null

async function loadLeafletDependencies() {
  if (!leafletLoader) {
    leafletLoader = Promise.all([
      import('leaflet'),
      import('react-leaflet'),
      import('leaflet/dist/images/marker-icon-2x.png'),
      import('leaflet/dist/images/marker-icon.png'),
      import('leaflet/dist/images/marker-shadow.png'),
    ])
      .then(
        ([
          leafletModule,
          reactLeafletModule,
          markerIcon2xModule,
          markerIconModule,
          markerShadowModule,
        ]) => {
          const L = leafletModule.default ?? leafletModule
          const markerIcon2x = markerIcon2xModule.default ?? markerIcon2xModule
          const markerIcon = markerIconModule.default ?? markerIconModule
          const markerShadow = markerShadowModule.default ?? markerShadowModule

          const defaultMarkerIcon = L.icon({
            iconRetinaUrl: markerIcon2x,
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })

          return {
            MapContainer: reactLeafletModule.MapContainer,
            Marker: reactLeafletModule.Marker,
            TileLayer: reactLeafletModule.TileLayer,
            defaultMarkerIcon,
          }
        },
      )
      .catch((error) => {
        leafletLoader = null
        throw error
      })
  }

  return leafletLoader
}

export default function OfferMap({ latitude, longitude }) {
  const [mapDependencies, setMapDependencies] = useState(null)
  const [loadError, setLoadError] = useState('')
  const position = useMemo(() => [latitude, longitude], [latitude, longitude])

  useEffect(() => {
    let isCancelled = false

    async function setupMap() {
      try {
        const dependencies = await loadLeafletDependencies()

        if (!isCancelled) {
          setMapDependencies(dependencies)
        }
      } catch {
        if (!isCancelled) {
          setLoadError('No se pudo cargar el mapa.')
        }
      }
    }

    setupMap()

    return () => {
      isCancelled = true
    }
  }, [])

  if (loadError) {
    return <div className="offer-map offer-map-status">{loadError}</div>
  }

  if (!mapDependencies) {
    return <div className="offer-map offer-map-status">Cargando mapa...</div>
  }

  const { MapContainer, Marker, TileLayer, defaultMarkerIcon } = mapDependencies

  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom
      dragging
      doubleClickZoom
      boxZoom
      keyboard
      touchZoom
      zoomControl
      className="offer-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={defaultMarkerIcon} />
    </MapContainer>
  )
}
