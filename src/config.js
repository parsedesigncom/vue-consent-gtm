export const DEFAULT_CATEGORIES = {
  necessary: {
    label: 'Notwendig',
    description: 'Für den Betrieb der Seite technisch erforderlich. Nicht abwählbar.',
    required: true,
    signals: ['security_storage', 'functionality_storage']
  },
  preferences: {
    label: 'Präferenzen',
    description: 'Speichert Einstellungen wie Sprache oder Region.',
    required: false,
    signals: ['functionality_storage', 'personalization_storage']
  },
  analytics: {
    label: 'Statistik',
    description: 'Anonymisierte Auswertung der Nutzung zur Verbesserung des Angebots.',
    required: false,
    signals: ['analytics_storage']
  },
  marketing: {
    label: 'Marketing',
    description: 'Personalisierte Werbung und Messung von Kampagnen.',
    required: false,
    signals: ['ad_storage', 'ad_user_data', 'ad_personalization']
  }
}

export const DEFAULT_OPTIONS = {
  gtmId: null,
  consentVersion: 1,
  expiryDays: 182,
  categories: DEFAULT_CATEGORIES,
  loadGtmOnlyAfterConsent: false,
  urlPassthrough: true,
  adsDataRedaction: true,
  storageKey: 'pdc_consent',
  onConsentChange: null,
  autoMountBanner: true,
  texts: {
    title: 'Wir respektieren deine Privatsphäre',
    body: 'Wir verwenden Cookies und ähnliche Technologien, um dir die bestmögliche Erfahrung zu bieten. Du kannst frei entscheiden, welche Kategorien du zulässt.',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Alle ablehnen',
    settings: 'Einstellungen',
    save: 'Auswahl speichern',
    close: 'Schließen',
    policyLinkLabel: 'Datenschutzerklärung',
    policyLinkHref: null
  }
}

export function normalizeOptions(userOptions = {}) {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    categories: {
      ...DEFAULT_CATEGORIES,
      ...(userOptions.categories || {})
    },
    texts: {
      ...DEFAULT_OPTIONS.texts,
      ...(userOptions.texts || {})
    }
  }

  if (!merged.gtmId) {
    console.warn('[vue-consent-gtm] Keine gtmId konfiguriert. Consent wird verwaltet, aber es wird kein GTM-Container geladen.')
  }

  for (const key of Object.keys(merged.categories)) {
    const cat = merged.categories[key]
    if (!Array.isArray(cat.signals)) cat.signals = []
    cat.required = !!cat.required
  }

  return merged
}
