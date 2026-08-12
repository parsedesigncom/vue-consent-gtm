<script setup>
import { computed } from 'vue'
import { useConsent } from '../src/index.js'

const consent = useConsent()

const status = computed(() => ({
  locale: consent.locale,
  decided: consent.isDecided(),
  necessary: consent.hasConsent('necessary'),
  preferences: consent.hasConsent('preferences'),
  analytics: consent.hasConsent('analytics'),
  marketing: consent.hasConsent('marketing')
}))

function fireAnalytics() {
  const ok = consent.trackEvent('demo_analytics_click', { source: 'demo' }, { requires: 'analytics' })
  console.log('[demo] analytics event pushed?', ok)
}
function fireMarketing() {
  const ok = consent.trackEvent('demo_marketing_click', { source: 'demo' }, { requires: 'marketing' })
  console.log('[demo] marketing event pushed?', ok)
}
</script>

<template>
  <main class="wrap">
    <h1>vue-consent-gtm — Demo</h1>
    <p>Open DevTools → Application → Local Storage / Console to observe consent changes.</p>

    <section>
      <h2>Language</h2>
      <div class="row">
        <button
          v-for="loc in consent.supportedLocales"
          :key="loc"
          :class="{ active: consent.locale === loc }"
          @click="consent.setLocale(loc)"
        >
          {{ loc.toUpperCase() }}
        </button>
        <button @click="consent.setLocale('auto')">AUTO (browser)</button>
      </div>
      <p class="hint">Active locale: <strong>{{ consent.locale }}</strong></p>
    </section>

    <section>
      <h2>Consent status</h2>
      <pre>{{ status }}</pre>
    </section>

    <section>
      <h2>Actions</h2>
      <div class="row">
        <button @click="consent.acceptAll()">acceptAll()</button>
        <button @click="consent.rejectAll()">rejectAll()</button>
        <button @click="consent.openSettings()">openSettings() — reopen settings dialog</button>
        <button @click="consent.reset()">reset() — reopen banner</button>
      </div>
      <div class="row">
        <button @click="fireAnalytics">trackEvent (requires: analytics)</button>
        <button @click="fireMarketing">trackEvent (requires: marketing)</button>
      </div>
      <p class="hint">A floating cookie button is visible in the bottom-left corner once a decision has been made.</p>
    </section>
  </main>
</template>

<style>
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #fafafa; color: #111; }
.wrap { max-width: 720px; margin: 40px auto; padding: 0 20px; }
h1 { margin-top: 0; }
section { margin-top: 24px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
pre { background: #f3f4f6; padding: 12px; border-radius: 8px; overflow: auto; }
.row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.hint { margin-top: 8px; color: #6b7280; font-size: 0.9rem; }
button {
  appearance: none;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-weight: 600;
}
button:hover { background: #f9fafb; }
button.active { background: #0057ff; color: white; border-color: #0057ff; }
</style>
