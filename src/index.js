import VueConsentGtm from './plugin.js'

export { useConsent } from './useConsent.js'
export { default as CookieBanner } from './components/CookieBanner.vue'
export { default as FloatingConsentButton } from './components/FloatingConsentButton.vue'
export { DEFAULT_CATEGORIES } from './config.js'
export { DEFAULT_TEXTS, SUPPORTED_LOCALES, resolveLocale, pickLocalized } from './i18n.js'
export { CONSENT_INJECTION_KEY, createConsentManager } from './plugin.js'

export default VueConsentGtm
