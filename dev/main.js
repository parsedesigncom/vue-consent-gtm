import { createApp } from 'vue'
import App from './App.vue'
import VueConsentGtm from '../src/index.js'

const app = createApp(App)

app.use(VueConsentGtm, {
  gtmId: import.meta.env.VITE_GTM_ID || 'GTM-XXXXXXX',
  consentVersion: Number(import.meta.env.VITE_CONSENT_VERSION || 1),
  expiryDays: Number(import.meta.env.VITE_CONSENT_EXPIRY_DAYS || 182),
  loadGtmOnlyAfterConsent: String(import.meta.env.VITE_LOAD_GTM_ONLY_AFTER_CONSENT).toLowerCase() === 'true',
  locale: 'auto',
  fallbackLocale: 'en',
  texts: {
    de: { policyLinkHref: '#datenschutz' },
    en: { policyLinkHref: '#privacy' }
  },
  theme: {
    primary: '#0057ff',
    radius: '12px'
  },
  onConsentChange(choices) {
    console.log('[demo] Consent changed:', choices)
  }
})

app.mount('#app')
