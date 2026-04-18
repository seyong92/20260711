/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_MAP_KEY_ID?: string
  readonly VITE_NAVER_MAP_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  naver?: {
    maps?: {
      LatLng: new (lat: number, lng: number) => unknown
      Map: new (
        element: HTMLElement,
        options: {
          center: unknown
          zoom: number
          zoomControl?: boolean
          scaleControl?: boolean
          logoControl?: boolean
          mapDataControl?: boolean
        },
      ) => unknown
      Marker: new (options: {
        position: unknown
        map: unknown
      }) => unknown
    }
  }
}
