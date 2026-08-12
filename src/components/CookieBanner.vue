<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useConsent } from '../useConsent.js'

const consent = useConsent()
const { categories } = consent.options

const showSettings = ref(false)
const visible = computed(() => !consent.isDecided() || showSettings.value)

const texts = computed(() => consent.texts)

const localCategories = computed(() => Object.entries(categories).map(([key, cat]) => ({
  key,
  required: cat.required,
  label: consent.localize(cat.label) || key,
  description: consent.localize(cat.description) || ''
})))

const localChoices = reactive({})
function syncFromState() {
  for (const key of Object.keys(categories)) {
    localChoices[key] = categories[key].required ? true : !!consent.state.choices[key]
  }
}
syncFromState()

watch(() => consent.state.choices, syncFromState, { deep: true })

function openSettings() {
  syncFromState()
  showSettings.value = true
}
function closeSettings() {
  showSettings.value = false
}

function acceptAll() {
  consent.acceptAll()
  showSettings.value = false
}
function rejectAll() {
  consent.rejectAll()
  showSettings.value = false
}
function saveSelection() {
  consent.save({ ...localChoices })
  showSettings.value = false
}
</script>

<template>
  <div v-if="visible" class="pdc-root" role="dialog" aria-modal="true" :aria-label="texts.title">
    <div class="pdc-backdrop" @click.self="consent.isDecided() ? closeSettings() : null" />

    <div class="pdc-panel" :class="{ 'pdc-panel--settings': showSettings }">
      <header class="pdc-header">
        <h2 class="pdc-title">{{ texts.title }}</h2>
      </header>

      <div class="pdc-body">
        <p class="pdc-text">{{ texts.body }}</p>
        <p v-if="texts.policyLinkHref" class="pdc-policy">
          <a :href="texts.policyLinkHref" target="_blank" rel="noopener noreferrer">{{ texts.policyLinkLabel }}</a>
        </p>

        <div v-if="showSettings" class="pdc-categories">
          <div v-for="cat in localCategories" :key="cat.key" class="pdc-category">
            <label class="pdc-category__row">
              <input
                type="checkbox"
                :checked="localChoices[cat.key]"
                :disabled="cat.required"
                @change="localChoices[cat.key] = $event.target.checked"
              />
              <span class="pdc-category__label">
                {{ cat.label }}
                <span v-if="cat.required" class="pdc-badge">{{ texts.required }}</span>
              </span>
            </label>
            <p v-if="cat.description" class="pdc-category__desc">{{ cat.description }}</p>
          </div>
        </div>
      </div>

      <footer class="pdc-footer">
        <template v-if="!showSettings">
          <button type="button" class="pdc-btn pdc-btn--ghost" @click="openSettings">
            {{ texts.settings }}
          </button>
          <button type="button" class="pdc-btn pdc-btn--secondary" @click="rejectAll">
            {{ texts.rejectAll }}
          </button>
          <button type="button" class="pdc-btn pdc-btn--primary" @click="acceptAll">
            {{ texts.acceptAll }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="pdc-btn pdc-btn--ghost" @click="closeSettings">
            {{ texts.close }}
          </button>
          <button type="button" class="pdc-btn pdc-btn--secondary" @click="rejectAll">
            {{ texts.rejectAll }}
          </button>
          <button type="button" class="pdc-btn pdc-btn--secondary" @click="saveSelection">
            {{ texts.save }}
          </button>
          <button type="button" class="pdc-btn pdc-btn--primary" @click="acceptAll">
            {{ texts.acceptAll }}
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<style>
.pdc-root {
  --pdc-primary: #0057ff;
  --pdc-primary-contrast: #ffffff;
  --pdc-secondary-bg: #f2f4f7;
  --pdc-secondary-text: #111827;
  --pdc-bg: #ffffff;
  --pdc-text: #111827;
  --pdc-muted: #6b7280;
  --pdc-border: #e5e7eb;
  --pdc-radius: 10px;
  --pdc-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  --pdc-max-width: 640px;
  --pdc-z: 2147483000;
  --pdc-backdrop: rgba(0, 0, 0, 0.35);

  position: fixed;
  inset: 0;
  z-index: var(--pdc-z);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  pointer-events: none;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--pdc-text);
}

.pdc-backdrop {
  position: absolute;
  inset: 0;
  background: var(--pdc-backdrop);
  pointer-events: auto;
  opacity: 0;
  animation: pdc-fade 180ms ease-out forwards;
}

.pdc-panel {
  position: relative;
  pointer-events: auto;
  background: var(--pdc-bg);
  color: var(--pdc-text);
  border-radius: var(--pdc-radius);
  box-shadow: var(--pdc-shadow);
  max-width: var(--pdc-max-width);
  width: 100%;
  padding: 20px;
  transform: translateY(12px);
  opacity: 0;
  animation: pdc-slide 220ms ease-out forwards;
}

.pdc-panel--settings { max-width: 720px; }

.pdc-header { margin-bottom: 8px; }
.pdc-title { margin: 0; font-size: 1.125rem; line-height: 1.3; font-weight: 600; }
.pdc-body { }
.pdc-text { margin: 0 0 10px 0; color: var(--pdc-text); line-height: 1.5; font-size: 0.95rem; }
.pdc-policy { margin: 0 0 12px 0; font-size: 0.875rem; }
.pdc-policy a { color: var(--pdc-primary); text-decoration: underline; }

.pdc-categories { margin-top: 12px; display: grid; gap: 12px; }
.pdc-category { border: 1px solid var(--pdc-border); border-radius: calc(var(--pdc-radius) - 2px); padding: 10px 12px; }
.pdc-category__row { display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 500; }
.pdc-category__row input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--pdc-primary); cursor: pointer; }
.pdc-category__row input[disabled] { cursor: not-allowed; opacity: 0.7; }
.pdc-category__label { display: inline-flex; align-items: center; gap: 8px; }
.pdc-category__desc { margin: 6px 0 0 28px; font-size: 0.85rem; color: var(--pdc-muted); line-height: 1.4; }

.pdc-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.7rem;
  border-radius: 999px;
  background: var(--pdc-secondary-bg);
  color: var(--pdc-secondary-text);
  font-weight: 500;
}

.pdc-footer {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.pdc-btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: calc(var(--pdc-radius) - 2px);
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
  transition: filter 120ms ease, background 120ms ease, border-color 120ms ease;
}
.pdc-btn:focus-visible { outline: 2px solid var(--pdc-primary); outline-offset: 2px; }

.pdc-btn--primary { background: var(--pdc-primary); color: var(--pdc-primary-contrast); }
.pdc-btn--primary:hover { filter: brightness(0.95); }

.pdc-btn--secondary { background: var(--pdc-secondary-bg); color: var(--pdc-secondary-text); }
.pdc-btn--secondary:hover { filter: brightness(0.97); }

.pdc-btn--ghost { background: transparent; color: var(--pdc-text); border-color: var(--pdc-border); }
.pdc-btn--ghost:hover { background: var(--pdc-secondary-bg); }

@media (min-width: 640px) {
  .pdc-root { align-items: center; }
}

@keyframes pdc-fade { to { opacity: 1; } }
@keyframes pdc-slide { to { transform: translateY(0); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .pdc-backdrop, .pdc-panel { animation: none; opacity: 1; transform: none; }
}
</style>
