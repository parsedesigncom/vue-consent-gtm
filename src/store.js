import { reactive, computed, readonly } from 'vue'

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function emptyChoices(categories) {
  const out = {}
  for (const key of Object.keys(categories)) {
    out[key] = !!categories[key].required
  }
  return out
}

function readStorage(storageKey) {
  if (!isBrowser) return null
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (_e) {
    return null
  }
}

function writeStorage(storageKey, payload) {
  if (!isBrowser) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch (_e) {
    /* Quota / Private Mode — still work in memory */
  }
}

function clearStorage(storageKey) {
  if (!isBrowser) return
  try {
    localStorage.removeItem(storageKey)
  } catch (_e) { /* noop */ }
}

export function createStore(options) {
  const { categories, consentVersion, expiryDays, storageKey } = options

  const state = reactive({
    decided: false,
    version: null,
    timestamp: null,
    choices: emptyChoices(categories)
  })

  function loadFromStorage() {
    const saved = readStorage(storageKey)
    if (!saved) return false

    if (saved.version !== consentVersion) {
      clearStorage(storageKey)
      return false
    }

    if (typeof saved.timestamp === 'number' && expiryDays > 0) {
      const ageMs = Date.now() - saved.timestamp
      const maxAgeMs = expiryDays * 24 * 60 * 60 * 1000
      if (ageMs > maxAgeMs) {
        clearStorage(storageKey)
        return false
      }
    }

    const nextChoices = emptyChoices(categories)
    if (saved.choices && typeof saved.choices === 'object') {
      for (const key of Object.keys(nextChoices)) {
        if (categories[key].required) {
          nextChoices[key] = true
          continue
        }
        if (typeof saved.choices[key] === 'boolean') {
          nextChoices[key] = saved.choices[key]
        }
      }
    }

    state.choices = nextChoices
    state.version = saved.version
    state.timestamp = saved.timestamp
    state.decided = true
    return true
  }

  function persist() {
    writeStorage(storageKey, {
      version: state.version,
      timestamp: state.timestamp,
      choices: { ...state.choices }
    })
  }

  function commit(choices) {
    const next = emptyChoices(categories)
    for (const key of Object.keys(next)) {
      if (categories[key].required) {
        next[key] = true
        continue
      }
      if (typeof choices[key] === 'boolean') {
        next[key] = choices[key]
      }
    }
    state.choices = next
    state.version = consentVersion
    state.timestamp = Date.now()
    state.decided = true
    persist()
  }

  function acceptAll() {
    const all = {}
    for (const key of Object.keys(categories)) all[key] = true
    commit(all)
  }

  function rejectAll() {
    const none = {}
    for (const key of Object.keys(categories)) none[key] = !!categories[key].required
    commit(none)
  }

  function reset() {
    clearStorage(storageKey)
    state.choices = emptyChoices(categories)
    state.version = null
    state.timestamp = null
    state.decided = false
  }

  return {
    state: readonly(state),
    _internalState: state,
    isDecided: computed(() => state.decided),
    hasConsent: (key) => !!state.choices[key],
    acceptAll,
    rejectAll,
    save: commit,
    reset,
    loadFromStorage
  }
}
