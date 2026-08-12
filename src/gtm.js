const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

const ALL_SIGNALS = [
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'analytics_storage',
  'functionality_storage',
  'personalization_storage',
  'security_storage'
]

let gtmScriptInjected = false

function ensureDataLayer() {
  if (!isBrowser) return null
  window.dataLayer = window.dataLayer || []
  return window.dataLayer
}

function gtag(...args) {
  const dl = ensureDataLayer()
  if (!dl) return
  dl.push(arguments)
}

export function pushToDataLayer(obj) {
  const dl = ensureDataLayer()
  if (!dl) return
  dl.push(obj)
}

export function signalsFromChoices(choices, categories) {
  const signals = {}
  for (const s of ALL_SIGNALS) signals[s] = 'denied'

  for (const key of Object.keys(choices)) {
    if (!choices[key]) continue
    const cat = categories[key]
    if (!cat) continue
    for (const sig of cat.signals) {
      signals[sig] = 'granted'
    }
  }

  signals.security_storage = 'granted'
  return signals
}

export function setConsentDefault(options) {
  if (!isBrowser) return
  ensureDataLayer()

  const defaults = {}
  for (const s of ALL_SIGNALS) defaults[s] = 'denied'
  defaults.security_storage = 'granted'
  defaults.wait_for_update = 500

  gtag('consent', 'default', defaults)

  if (options.urlPassthrough) {
    gtag('set', 'url_passthrough', true)
  }
  if (options.adsDataRedaction) {
    gtag('set', 'ads_data_redaction', true)
  }
}

export function updateConsent(choices, options) {
  if (!isBrowser) return
  const signals = signalsFromChoices(choices, options.categories)
  gtag('consent', 'update', signals)
}

export function loadGtm(gtmId) {
  if (!isBrowser || !gtmId || gtmScriptInjected) return
  if (document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
    gtmScriptInjected = true
    return
  }

  const dl = ensureDataLayer()
  dl.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
  s.setAttribute('data-gtm-id', gtmId)
  const first = document.getElementsByTagName('script')[0]
  if (first && first.parentNode) {
    first.parentNode.insertBefore(s, first)
  } else {
    document.head.appendChild(s)
  }
  gtmScriptInjected = true
}
