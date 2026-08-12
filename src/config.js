export const DEFAULT_CATEGORIES = {
  necessary: {
    required: true,
    signals: ['security_storage', 'functionality_storage'],
    label: { de: 'Notwendig', en: 'Necessary' },
    description: {
      de: 'Für den Betrieb der Seite technisch erforderlich. Nicht abwählbar.',
      en: 'Technically required for the site to work. Cannot be disabled.'
    }
  },
  preferences: {
    required: false,
    signals: ['functionality_storage', 'personalization_storage'],
    label: { de: 'Präferenzen', en: 'Preferences' },
    description: {
      de: 'Speichert Einstellungen wie Sprache oder Region.',
      en: 'Stores settings such as language or region.'
    }
  },
  analytics: {
    required: false,
    signals: ['analytics_storage'],
    label: { de: 'Statistik', en: 'Analytics' },
    description: {
      de: 'Anonymisierte Auswertung der Nutzung zur Verbesserung des Angebots.',
      en: 'Anonymized usage analysis to improve the site.'
    }
  },
  marketing: {
    required: false,
    signals: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    label: { de: 'Marketing', en: 'Marketing' },
    description: {
      de: 'Personalisierte Werbung und Messung von Kampagnen.',
      en: 'Personalized advertising and campaign measurement.'
    }
  }
}

export const DEFAULT_FLOATING_BUTTON = {
  enabled: true,
  position: 'bottom-left'
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
  locale: 'auto',
  fallbackLocale: 'en',
  texts: null,
  floatingButton: DEFAULT_FLOATING_BUTTON
}

export function normalizeOptions(userOptions = {}) {
  const mergedCategories = { ...DEFAULT_CATEGORIES }
  if (userOptions.categories && typeof userOptions.categories === 'object') {
    for (const [key, cat] of Object.entries(userOptions.categories)) {
      mergedCategories[key] = {
        ...(DEFAULT_CATEGORIES[key] || {}),
        ...cat
      }
    }
  }

  const merged = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    categories: mergedCategories,
    floatingButton: {
      ...DEFAULT_FLOATING_BUTTON,
      ...(userOptions.floatingButton || {})
    }
  }

  if (!merged.gtmId) {
    console.warn('[vue-consent-gtm] No gtmId configured. Consent will be managed but no GTM container will be loaded.')
  }

  for (const key of Object.keys(merged.categories)) {
    const cat = merged.categories[key]
    if (!Array.isArray(cat.signals)) cat.signals = []
    cat.required = !!cat.required
  }

  return merged
}
