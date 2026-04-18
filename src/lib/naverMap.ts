const NAVER_MAP_SCRIPT_ID = 'naver-map-script'
const NAVER_MAP_SCRIPT_BASE_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js'

export function loadNaverMapScript(keyId: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null

    if (window.naver?.maps) {
      resolve()
      return
    }

    const handleLoad = () => {
      if (window.naver?.maps) {
        resolve()
        return
      }

      reject(new Error('NAVER Maps API loaded without maps namespace'))
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('NAVER Maps API failed to load')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = NAVER_MAP_SCRIPT_ID
    script.async = true
    script.src = `${NAVER_MAP_SCRIPT_BASE_URL}?ncpKeyId=${encodeURIComponent(keyId)}`
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('NAVER Maps API failed to load')),
      { once: true },
    )
    document.head.appendChild(script)
  })
}
