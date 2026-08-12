export const DEFAULT_TEXTS = {
  de: {
    title: 'Wir respektieren deine Privatsphäre',
    body: 'Wir verwenden Cookies und ähnliche Technologien, um dir die bestmögliche Erfahrung zu bieten. Du kannst frei entscheiden, welche Kategorien du zulässt.',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Alle ablehnen',
    settings: 'Einstellungen',
    save: 'Auswahl speichern',
    close: 'Schließen',
    required: 'Pflicht',
    policyLinkLabel: 'Datenschutzerklärung',
    policyLinkHref: null
  },
  en: {
    title: 'We respect your privacy',
    body: 'We use cookies and similar technologies to provide the best possible experience. You can freely choose which categories you allow.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject all',
    settings: 'Settings',
    save: 'Save selection',
    close: 'Close',
    required: 'Required',
    policyLinkLabel: 'Privacy policy',
    policyLinkHref: null
  }
}

export const SUPPORTED_LOCALES = ['de', 'en']

export function resolveLocale(configured, fallback = 'en') {
  if (configured && configured !== 'auto' && SUPPORTED_LOCALES.includes(configured)) {
    return configured
  }
  if (typeof navigator === 'undefined') return fallback
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('de')) return 'de'
  return fallback
}

export function pickLocalized(value, locale, fallback = 'en') {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (value[locale] != null) return value[locale]
    if (value[fallback] != null) return value[fallback]
    const first = Object.values(value)[0]
    return first != null ? first : ''
  }
  return String(value)
}

export function getTextsForLocale(userTexts, locale, fallback = 'en') {
  const base = { ...(DEFAULT_TEXTS[locale] || DEFAULT_TEXTS[fallback] || DEFAULT_TEXTS.en) }
  if (!userTexts || typeof userTexts !== 'object') return base

  const overrides = userTexts[locale] || userTexts[fallback]
  if (overrides && typeof overrides === 'object') {
    Object.assign(base, overrides)
  }
  return base
}
