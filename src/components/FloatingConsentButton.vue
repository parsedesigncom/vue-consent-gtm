<script setup>
import { computed } from 'vue'
import { useConsent } from '../useConsent.js'

const consent = useConsent()

const visible = computed(() => consent.isDecided() && !consent.showSettings)
const label = computed(() => consent.texts.cookieSettings)
const positionClass = computed(() => {
  const pos = consent.options.floatingButton?.position || 'bottom-left'
  return `pdc-fab--${pos}`
})

function open() {
  consent.openSettings()
}
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="pdc-fab"
    :class="positionClass"
    :aria-label="label"
    :title="label"
    @click="open"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.95 11.14a4.5 4.5 0 0 1-5.1-5.05 4.5 4.5 0 0 1-4.55-4.06A10 10 0 1 0 22 12c0-.29-.02-.58-.05-.86Z"
        stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"
      />
      <circle cx="8.5" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="13.5" cy="14.5" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="0.9" fill="currentColor" />
      <circle cx="9" cy="15.5" r="0.9" fill="currentColor" />
    </svg>
  </button>
</template>

<style>
.pdc-fab {
  --pdc-fab-size: 44px;
  --pdc-fab-bg: #ffffff;
  --pdc-fab-color: #111827;
  --pdc-fab-border: #e5e7eb;
  --pdc-fab-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  --pdc-fab-hover-bg: #f9fafb;
  --pdc-fab-offset: 20px;
  --pdc-fab-z: 2147482900;

  position: fixed;
  width: var(--pdc-fab-size);
  height: var(--pdc-fab-size);
  border-radius: 50%;
  background: var(--pdc-fab-bg);
  color: var(--pdc-fab-color);
  border: 1px solid var(--pdc-fab-border);
  box-shadow: var(--pdc-fab-shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  z-index: var(--pdc-fab-z);
  transition: transform 120ms ease, background 120ms ease;
}
.pdc-fab:hover { background: var(--pdc-fab-hover-bg); transform: scale(1.05); }
.pdc-fab:focus-visible { outline: 2px solid #0057ff; outline-offset: 2px; }

.pdc-fab--bottom-left  { left: var(--pdc-fab-offset);  bottom: var(--pdc-fab-offset); }
.pdc-fab--bottom-right { right: var(--pdc-fab-offset); bottom: var(--pdc-fab-offset); }
.pdc-fab--top-left     { left: var(--pdc-fab-offset);  top: var(--pdc-fab-offset); }
.pdc-fab--top-right    { right: var(--pdc-fab-offset); top: var(--pdc-fab-offset); }
</style>
