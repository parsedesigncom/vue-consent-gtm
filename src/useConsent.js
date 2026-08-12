import { inject } from 'vue'
import { CONSENT_INJECTION_KEY } from './plugin.js'

export function useConsent() {
  const manager = inject(CONSENT_INJECTION_KEY, null)
  if (!manager) {
    throw new Error('[vue-consent-gtm] useConsent() aufgerufen, aber Plugin ist nicht via app.use(VueConsentGtm, ...) installiert.')
  }
  return manager
}
