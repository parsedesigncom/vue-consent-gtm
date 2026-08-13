import { h, createApp, reactive } from 'vue'
import { normalizeOptions } from './config.js'
import { createStore } from './store.js'
import { setConsentDefault, updateConsent, loadGtm, pushToDataLayer, pushConsentUpdateEvent } from './gtm.js'
import { resolveLocale, pickLocalized, getTextsForLocale, SUPPORTED_LOCALES } from './i18n.js'
import CookieBanner from './components/CookieBanner.vue'
import FloatingConsentButton from './components/FloatingConsentButton.vue'

export const CONSENT_INJECTION_KEY = Symbol('vue-consent-gtm')

export function createConsentManager(userOptions) {
  const options = normalizeOptions(userOptions)

  setConsentDefault(options)

  const ui = reactive({
    locale: resolveLocale(options.locale, options.fallbackLocale),
    showSettings: false
  })

  const store = createStore(options)
  const wasDecided = store.loadFromStorage()

  if (wasDecided) {
    updateConsent(store._internalState.choices, options)
    if (options.gtmId && (!options.loadGtmOnlyAfterConsent || hasAnyOptionalGranted(store._internalState.choices, options))) {
      loadGtm(options.gtmId)
    }
  } else if (options.gtmId && !options.loadGtmOnlyAfterConsent) {
    loadGtm(options.gtmId)
  }

  function notifyChange() {
    if (typeof options.onConsentChange === 'function') {
      try { options.onConsentChange({ ...store._internalState.choices }) }
      catch (e) { console.error('[vue-consent-gtm] onConsentChange threw:', e) }
    }
  }

  function afterCommit() {
    updateConsent(store._internalState.choices, options)
    if (options.gtmId && options.loadGtmOnlyAfterConsent) {
      if (hasAnyOptionalGranted(store._internalState.choices, options)) {
        loadGtm(options.gtmId)
      }
    }
    pushConsentUpdateEvent(store._internalState.choices, options.categories, 'update')
    notifyChange()
  }

  const manager = {
    options,
    state: store.state,

    get locale() { return ui.locale },
    get texts() { return getTextsForLocale(options.texts, ui.locale, options.fallbackLocale) },
    get supportedLocales() { return SUPPORTED_LOCALES.slice() },
    get showSettings() { return ui.showSettings },

    setLocale(loc) {
      ui.locale = (loc && loc !== 'auto')
        ? resolveLocale(loc, options.fallbackLocale)
        : resolveLocale('auto', options.fallbackLocale)
    },
    localize(value) {
      return pickLocalized(value, ui.locale, options.fallbackLocale)
    },

    openSettings() { ui.showSettings = true },
    closeSettings() { ui.showSettings = false },

    isDecided: () => store._internalState.decided,
    hasConsent: (key) => store.hasConsent(key),

    acceptAll() {
      store.acceptAll()
      afterCommit()
    },
    rejectAll() {
      store.rejectAll()
      afterCommit()
    },
    save(choices) {
      store.save(choices || {})
      afterCommit()
    },
    reset() {
      store.reset()
      ui.showSettings = false
      updateConsent(store._internalState.choices, options)
      pushConsentUpdateEvent(store._internalState.choices, options.categories, 'reset')
      notifyChange()
    },

    push(obj) {
      pushToDataLayer(obj)
    },

    trackEvent(event, params = {}, opts = {}) {
      const required = opts.requires
      if (required && !store.hasConsent(required)) return false
      pushToDataLayer({ event, ...params })
      return true
    }
  }

  return manager
}

function hasAnyOptionalGranted(choices, options) {
  for (const key of Object.keys(choices)) {
    const cat = options.categories[key]
    if (!cat || cat.required) continue
    if (choices[key]) return true
  }
  return false
}

function mountConsentUI(manager) {
  if (typeof document === 'undefined') return
  const host = document.createElement('div')
  host.setAttribute('data-pdc-host', '')
  document.body.appendChild(host)

  const uiApp = createApp({
    render() {
      const children = [h(CookieBanner)]
      if (manager.options.floatingButton?.enabled) {
        children.push(h(FloatingConsentButton))
      }
      return h('div', children)
    }
  })
  uiApp.provide(CONSENT_INJECTION_KEY, manager)
  uiApp.config.globalProperties.$consent = manager
  uiApp.mount(host)
}

const VueConsentGtm = {
  install(app, userOptions) {
    const manager = createConsentManager(userOptions)

    app.provide(CONSENT_INJECTION_KEY, manager)
    app.config.globalProperties.$consent = manager

    if (manager.options.autoMountBanner && typeof window !== 'undefined') {
      mountConsentUI(manager)
    }
  }
}

export default VueConsentGtm
