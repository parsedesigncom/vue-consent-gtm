<script setup>
import { computed } from 'vue'
import { useConsent } from '../src/index.js'

const consent = useConsent()

const status = computed(() => ({
  decided: consent.isDecided(),
  necessary: consent.hasConsent('necessary'),
  preferences: consent.hasConsent('preferences'),
  analytics: consent.hasConsent('analytics'),
  marketing: consent.hasConsent('marketing')
}))

function fireAnalytics() {
  const ok = consent.trackEvent('demo_analytics_click', { source: 'demo' }, { requires: 'analytics' })
  console.log('[demo] analytics event gepusht?', ok)
}
function fireMarketing() {
  const ok = consent.trackEvent('demo_marketing_click', { source: 'demo' }, { requires: 'marketing' })
  console.log('[demo] marketing event gepusht?', ok)
}
</script>

<template>
  <main class="wrap">
    <h1>vue-consent-gtm — Demo</h1>
    <p>Öffne die DevTools → Application → Local Storage bzw. Console, um Consent-Änderungen zu beobachten.</p>

    <section>
      <h2>Aktueller Consent-Status</h2>
      <pre>{{ status }}</pre>
    </section>

    <section>
      <h2>Aktionen</h2>
      <div class="row">
        <button @click="consent.acceptAll()">acceptAll()</button>
        <button @click="consent.rejectAll()">rejectAll()</button>
        <button @click="consent.reset()">reset() — Banner erneut öffnen</button>
      </div>
      <div class="row">
        <button @click="fireAnalytics">trackEvent (requires: analytics)</button>
        <button @click="fireMarketing">trackEvent (requires: marketing)</button>
      </div>
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
</style>
