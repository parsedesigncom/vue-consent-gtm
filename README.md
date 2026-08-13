# vue-consent-gtm

A reusable, **GDPR-compliant cookie consent plugin for Vue 3** with native integration into **Google Tag Manager (Consent Mode v2)**.

- No server backend, no external consent service
- Separation of logic and UI — bring your own banner component
- Consent Mode v2 default `denied`, updated only after user decision
- Granular categories, versioning, expiry, revocation
- **i18n out-of-the-box** (DE + EN) with browser detection
- **Floating cookie button** for revocation on every page
- **Colors configurable via config** (falls back to sensible defaults)
- Fixed **Arial** font — no font conflicts with the host app

---

## Installation

```bash
npm install vue-consent-gtm
```

## Setup

### Minimal — just the GTM ID

```js
import { createApp } from 'vue'
import App from './App.vue'
import VueConsentGtm from 'vue-consent-gtm'
import 'vue-consent-gtm/style.css'

const app = createApp(App)
app.use(VueConsentGtm, { gtmId: 'GTM-XXXXXXX' })
app.mount('#app')
```

That's all: banner, browser language detection (DE/EN), Consent Mode v2 default `denied`, floating button for revocation after the first decision.

### Full example with all options

```js
app.use(VueConsentGtm, {
  gtmId: 'GTM-XXXXXXX',
  consentVersion: 1,
  expiryDays: 182,
  loadGtmOnlyAfterConsent: false,

  // Language
  locale: 'auto',              // 'auto' | 'de' | 'en'
  fallbackLocale: 'en',

  // Text overrides per language (optional)
  texts: {
    de: {
      title: 'Cookies bei Merci-Snacks',
      policyLinkHref: '/datenschutz',
      policyLinkLabel: 'Datenschutz'
    },
    en: {
      title: 'Cookies at Merci-Snacks',
      policyLinkHref: '/privacy',
      policyLinkLabel: 'Privacy policy'
    }
  },

  // Revocation button (cookie icon)
  floatingButton: {
    enabled: true,
    position: 'bottom-left'    // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  },

  // Colors & appearance (all optional, falls back to defaults)
  theme: {
    primary: '#e11d48',
    radius: '14px'
  },

  onConsentChange(choices) {
    console.log('Consent changed:', choices)
  }
})
```

The banner appears automatically if no decision has been made yet. After the decision, the cookie button appears at the configured position.

## Config source

The plugin only expects an object in `app.use(...)`. Where the values come from is up to you. Four common patterns:

**A) Hardcoded** — simplest case, one environment:
```js
app.use(VueConsentGtm, { gtmId: 'GTM-XXXXXXX' })
```

**B) Dedicated config file** — clean separation, no build-tool magic:
```js
// src/config/consent.js
export const consentConfig = { gtmId: 'GTM-XXXXXXX' }

// main.js
import { consentConfig } from './config/consent.js'
app.use(VueConsentGtm, consentConfig)
```

**C) `.env` via Vite / Nuxt / Vue-CLI** — standard for multi-environment:
```env
# .env
VITE_GTM_ID=GTM-XXXXXXX
```
```js
app.use(VueConsentGtm, { gtmId: import.meta.env.VITE_GTM_ID })
```

**D) Runtime config from meta tag or JSON** — for CMS-driven sites or one-build-per-all-environments:
```html
<meta name="gtm-id" content="GTM-XXXXXXX">
```
```js
const gtmId = document.querySelector('meta[name="gtm-id"]')?.content
app.use(VueConsentGtm, { gtmId })
```

## Composable `useConsent()`

```vue
<script setup>
import { useConsent } from 'vue-consent-gtm'

const consent = useConsent()

function onCta() {
  consent.trackEvent('cta_click', { label: 'Hero' }, { requires: 'analytics' })
}
</script>

<template>
  <button v-if="consent.hasConsent('marketing')">Marketing active</button>
  <button @click="consent.openSettings()">{{ consent.texts.cookieSettings }}</button>
</template>
```

> Tip: `openSettings()` only opens the settings dialog (user can change their selection). `reset()` deletes the stored consent completely — the banner then appears again as on the first visit.

### Manager API

| Method / property | Description |
|---|---|
| `hasConsent(key)` | Checks whether the category has been consented to |
| `isDecided()` | Has a decision already been made? |
| `acceptAll()` | Accept all categories |
| `rejectAll()` | Reject all optional categories |
| `save(choices)` | Save an individual selection |
| `reset()` | Delete consent (banner appears again) |
| `trackEvent(event, params, { requires })` | Pushes only with the corresponding consent |
| `push(obj)` | Direct `dataLayer.push` |
| `locale` | Active language (`'de'` or `'en'`), reactive |
| `texts` | Resolved texts for the active language |
| `supportedLocales` | List of built-in languages |
| `setLocale(loc)` | Set language (`'de'`, `'en'` or `'auto'` for browser detection) |
| `localize(value)` | Resolves a `{ de, en }` value for the active language |
| `openSettings()` | Open the settings dialog (also after consent was given) — for revocation |
| `closeSettings()` | Close the settings dialog |
| `showSettings` | Is the settings dialog currently open? (reactive) |

Also available as `$consent` in the Options API / templates.

## Tracking custom events (`trackEvent`)

Instead of listening for clicks in GTM by class / selector (fragile, breaks on every CSS refactor), you can send events directly from your Vue code to the `dataLayer`. The plugin automatically gates them by consent category — if consent is missing, nothing flows.

### Basic principle

```js
consent.trackEvent(eventName, params, { requires: 'analytics' })
```

What happens:
1. Checks `consent.hasConsent('analytics')`
2. If `true` → `dataLayer.push({ event: eventName, ...params })`
3. If `false` → nothing, returns `false`

### Simple example — button click

```vue
<script setup>
import { useConsent } from 'vue-consent-gtm'
const consent = useConsent()

function onCtaClick() {
  consent.trackEvent('cta_click', {
    button_label: 'Buy now',
    location: 'hero'
  }, { requires: 'analytics' })
}
</script>

<template>
  <button @click="onCtaClick">Buy now</button>
</template>
```

### The `requires` parameter — per-event consent gate

| Value | When event fires |
|---|---|
| `{ requires: 'analytics' }` | Only with analytics consent |
| `{ requires: 'marketing' }` | Only with marketing consent |
| *(omitted)* | Always — for purely functional events |

Rule of thumb: usage statistics = `analytics`, conversion tracking for ads = `marketing`.

### Practical patterns

**Section view via IntersectionObserver:**

```vue
<script setup>
import { onMounted, ref } from 'vue'
import { useConsent } from 'vue-consent-gtm'
const consent = useConsent()
const section = ref(null)

onMounted(() => {
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      consent.trackEvent('section_view', {
        section_name: 'testimonials',
        section_position: 3
      }, { requires: 'analytics' })
      io.disconnect()
    }
  }, { threshold: 0.5 })
  io.observe(section.value)
})
</script>

<template><section ref="section">…</section></template>
```

**Dwell time per route (composable):**

```js
// composables/usePageTiming.js
import { onMounted, onUnmounted } from 'vue'
import { useConsent } from 'vue-consent-gtm'
import { useRoute } from 'vue-router'

export function usePageTiming() {
  const consent = useConsent()
  const route = useRoute()
  let enteredAt = 0
  onMounted(() => { enteredAt = Date.now() })
  onUnmounted(() => {
    consent.trackEvent('page_dwell', {
      page_path: route.fullPath,
      dwell_ms: Date.now() - enteredAt
    }, { requires: 'analytics' })
  })
}
```

**Checkout steps:**

```js
consent.trackEvent('checkout_step', {
  step: 1,
  step_name: 'address',
  cart_value: 89.90,
  currency: 'EUR'
}, { requires: 'marketing' })
```

**External links:**

```vue
<a href="https://partner.com"
   @click="consent.trackEvent('outbound_click', { outbound_url: 'https://partner.com' }, { requires: 'analytics' })">
  Partner
</a>
```

### GTM side — set up once per event

**1. For each event parameter → Data Layer Variable:**
- Variable type: **Data Layer Variable**
- Data Layer Variable Name: the exact parameter name from your code (`button_label`, `section_name`, `step`, …)
- GTM variable name: conventionally `dlv_button_label`

**2. For the event name → Custom Event trigger:**
- Trigger type: **Custom Event**
- Event name: exact match of your event name (`cta_click`)
- Fires on: **All Custom Events** (or with a filter)

**3. Hook a tag (e.g. GA4 Event) to the trigger:**
- Event Name: `cta_click`
- Event Parameters: `button_label = {{dlv_button_label}}`, `location = {{dlv_location}}`

### Naming conventions

To keep GA4 from turning into chaos:

| Rule | Good | Bad |
|---|---|---|
| snake_case | `cta_click` | `CTA Click` |
| Verb + object | `video_play` | `videoStarted` |
| Consistent prefixes | `cta_click`, `cta_hover`, `cta_view` | wildly mixed |
| Use GA4 standard events | `select_content`, `login`, `sign_up`, `purchase` | custom names |
| Parameters over many events | `cta_click` + `variant: 'A'` | `cta_click_variant_A` |

GA4 provides a [list of recommended event names](https://support.google.com/analytics/answer/9267735) — using them causes GA4's standard reports to be populated automatically.

### Using raw `push()`

For complex payloads (e.g. GA4 Enhanced Ecommerce with an `ecommerce` object), you can push directly to the dataLayer — but you have to **check consent yourself**:

```js
if (consent.hasConsent('marketing')) {
  consent.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: 'T-12345',
      value: 89.90,
      currency: 'EUR',
      items: [
        { item_id: 'SKU-1', item_name: 'Widget', price: 89.90, quantity: 1 }
      ]
    }
  })
}
```

`push()` has no `requires` argument because nested objects (`ecommerce`, `user_properties`, etc.) don't sensibly flatten into event params. For everything else, `trackEvent()` is simpler and safer.

### Debugging

```js
// See all your own events (without GTM internals)
window.dataLayer.filter(e => e.event && !e.event.startsWith('gtm.'))
```

In the **Tag Assistant**, each `trackEvent()` appears as its own entry in the left-hand event list → click it → the "Data Layer" tab shows all parameters.

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `gtmId` | `string` | — | **Required.** GTM container ID |
| `consentVersion` | `number` | `1` | Incrementing invalidates stored consent |
| `expiryDays` | `number` | `182` | Consent validity duration |
| `categories` | `object` | Default | Category definition with localized labels |
| `loadGtmOnlyAfterConsent` | `boolean` | `false` | Strictest reading: load GTM only after consent |
| `locale` | `'auto' \| 'de' \| 'en'` | `'auto'` | Initial language. `'auto'` detects browser language |
| `fallbackLocale` | `'de' \| 'en'` | `'en'` | Language when browser detection doesn't apply |
| `texts` | `object` | — | Text overrides per language: `{ de: {...}, en: {...} }` |
| `floatingButton` | `object` | `{ enabled: true, position: 'bottom-left' }` | Floating cookie button for revocation. `position`: `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right'` |
| `theme` | `object` | — | Colors and appearance (see [Theme](#theme-colors--appearance)). All optional, each key has a default |
| `onConsentChange` | `function` | — | Callback on every change |

## Internationalization (i18n)

The plugin ships with DE and EN out-of-the-box. The language is detected automatically from the browser: if `navigator.language` starts with `de` → German, otherwise English (or the configured `fallbackLocale`).

**Fixed language:**
```js
app.use(VueConsentGtm, { gtmId: '…', locale: 'de' })
```

**Automatic detection with fallback:**
```js
app.use(VueConsentGtm, { gtmId: '…', locale: 'auto', fallbackLocale: 'en' })
```

**Override individual texts — per language:**
```js
app.use(VueConsentGtm, {
  gtmId: '…',
  texts: {
    de: {
      title: 'Cookies bei Merci-Snacks',
      policyLinkHref: '/datenschutz',
      policyLinkLabel: 'Datenschutz'
    },
    en: {
      title: 'Cookies at Merci-Snacks',
      policyLinkHref: '/privacy',
      policyLinkLabel: 'Privacy policy'
    }
  }
})
```

Any keys you don't override fall back to the default texts.

**Available text keys** (identical per language):
`title`, `body`, `acceptAll`, `rejectAll`, `settings`, `save`, `close`, `required`, `cookieSettings`, `policyLinkLabel`, `policyLinkHref`

**Localize your own category labels:**
```js
categories: {
  necessary: { /* … */ },
  custom: {
    required: false,
    signals: ['analytics_storage'],
    label: { de: 'Video-Player', en: 'Video player' },
    description: {
      de: 'Bindet externe Video-Player ein.',
      en: 'Embeds external video players.'
    }
  }
}
```

**Runtime language switch** (e.g. when your app has its own language switcher):
```js
const consent = useConsent()
consent.setLocale('en')       // English immediately
consent.setLocale('auto')     // back to browser detection
```

## Theme (colors & appearance)

The `theme` option lets you set colors, radii, shadows and the size/position of the floating button directly from the config — no global CSS needed. Everything is optional; if a key is not set, the built-in defaults apply.

```js
app.use(VueConsentGtm, {
  gtmId: '…',
  theme: {
    primary: '#e11d48',           // "Accept" buttons, focus ring
    primaryContrast: '#ffffff',   // Text on primary
    bg: '#ffffff',                // Panel background
    text: '#111827',              // Text
    muted: '#6b7280',             // Description text, secondary info
    border: '#e5e7eb',            // Borders
    secondaryBg: '#f2f4f7',       // "Reject" / "Save" buttons
    secondaryText: '#111827',
    radius: '14px',               // Panel and button radius
    shadow: '0 12px 32px rgba(0,0,0,0.18)',
    maxWidth: '640px',            // Panel width
    backdrop: 'rgba(0,0,0,0.35)', // Overlay

    // Floating cookie button
    fabSize: '44px',
    fabBg: '#ffffff',
    fabColor: '#111827',
    fabBorder: '#e5e7eb',
    fabShadow: '0 4px 14px rgba(0,0,0,0.15)',
    fabHoverBg: '#f9fafb',
    fabOffset: '20px'
  }
})
```

**Example — set only the brand primary color:**
```js
theme: { primary: '#e11d48' }
```

**Example — dark mode:**
```js
theme: {
  bg: '#1a1a1a',
  text: '#eeeeee',
  muted: '#a1a1aa',
  border: '#333',
  secondaryBg: '#2a2a2a',
  secondaryText: '#eeeeee',
  fabBg: '#1a1a1a',
  fabColor: '#eeeeee',
  fabBorder: '#333'
}
```

> Font is hardcoded to **Arial** — deliberately, so the banner looks identical in every host app and no font conflicts occur. If you need your own fonts, replace the default component (see "Bring your own UI" below).

`theme` writes the values as **inline CSS variables** on the component. If you also want to override them via CSS (e.g. a media query for dark mode), you'll need `!important` or higher selector specificity — or you can just set one or the other.

## Default categories

| Category | Consent signals (v2) |
|---|---|
| `necessary` (always active) | `security_storage`, `functionality_storage` |
| `preferences` | `functionality_storage`, `personalization_storage` |
| `analytics` | `analytics_storage` |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` |

On collision between categories: **granted wins**.

## Revocation & reopening settings

GDPR requires that revocation is **as easy as granting**. The plugin offers two ways:

**1) Automatic floating button** (default)
After the first decision, a small cookie button appears at the bottom left. Clicking it opens the settings dialog. Position is configurable:

```js
app.use(VueConsentGtm, {
  gtmId: '…',
  floatingButton: { enabled: true, position: 'bottom-right' }
})
```

**2) Your own trigger** (footer link, menu entry, etc.)
If you disable the floating button and want to place your own trigger in your layout:

```js
app.use(VueConsentGtm, {
  gtmId: '…',
  floatingButton: { enabled: false }
})
```

```vue
<script setup>
import { useConsent } from 'vue-consent-gtm'
const consent = useConsent()
</script>

<template>
  <footer>
    <button @click="consent.openSettings()">{{ consent.texts.cookieSettings }}</button>
  </footer>
</template>
```

**Full revocation** (delete consent and show banner again):
```js
consent.reset()
```

## Styling

All colors, radii and spacings are adjustable via CSS variables.

**Banner + settings dialog:**
```css
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
  --pdc-shadow: 0 12px 32px rgba(0,0,0,0.18);
  --pdc-max-width: 640px;
  --pdc-backdrop: rgba(0,0,0,0.35);
}
```

**Floating cookie button:**
```css
.pdc-fab {
  --pdc-fab-size: 44px;
  --pdc-fab-bg: #ffffff;
  --pdc-fab-color: #111827;
  --pdc-fab-border: #e5e7eb;
  --pdc-fab-shadow: 0 4px 14px rgba(0,0,0,0.15);
  --pdc-fab-hover-bg: #f9fafb;
  --pdc-fab-offset: 20px;
}
```

**Dark-mode example:**
```css
@media (prefers-color-scheme: dark) {
  .pdc-root {
    --pdc-bg: #1a1a1a;
    --pdc-text: #eee;
    --pdc-secondary-bg: #2a2a2a;
    --pdc-secondary-text: #eee;
    --pdc-border: #333;
  }
  .pdc-fab {
    --pdc-fab-bg: #1a1a1a;
    --pdc-fab-color: #eee;
    --pdc-fab-border: #333;
  }
}
```

You can also fully replace the default component and only use `useConsent()` in your own UI. To do so, disable the banner and floating button:
```js
app.use(VueConsentGtm, {
  gtmId: '…',
  autoMountBanner: false,
  floatingButton: { enabled: false }
})
```
And import the individual components as needed:
```js
import { CookieBanner, FloatingConsentButton } from 'vue-consent-gtm'
```

## GTM setup — step by step

The plugin only delivers the **consent signals** to the `dataLayer`. Whether your tags respect these signals is decided in the GTM container. Without the following steps, tags will fire despite rejection — the consent layer would then be pointless.

### 1) Get your GTM container ID

Create a container (Web platform) at [tagmanager.google.com](https://tagmanager.google.com). The ID has the format `GTM-XXXXXXX` and is passed as `gtmId` to the plugin:

```js
app.use(VueConsentGtm, { gtmId: 'GTM-XXXXXXX' })
```

The plugin injects the GTM loader itself. **Do not additionally paste the GTM snippet code from the GTM UI into your HTML** — otherwise GTM will load twice and the consent default may come too late.

### 2) Enable Consent Overview in GTM

In GTM: **Admin → Container Settings → Consent Overview** enable. This shows a consent column in the tag list and lets you set the required signals per tag.

### 3) Set built-in consent signals per tag

Open each tag that sets cookies or sends personal data → **"Consent Settings"** → **"Require additional consent for tag to fire"** → choose the appropriate signals:

| Tag type | Required signals |
|---|---|
| Google Analytics 4 (Config + Events) | `analytics_storage` |
| Google Ads Conversion / Remarketing | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Floodlight | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Meta / Facebook Pixel (Custom HTML) | `ad_storage`, `ad_user_data`, `ad_personalization` |
| LinkedIn Insight (Custom HTML) | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Personalization / A/B testing | `personalization_storage` |
| Purely session / security tags | `security_storage`, `functionality_storage` |

Google's own tags (GA4, Ads) also check the signals internally via Consent Mode v2 — i.e. on `denied` they switch to a ping / cookieless mode. Custom HTML tags (Meta, LinkedIn, TikTok, …) check **nothing on their own** and must be bound via "Require additional consent".

### 4) Enable additional consent flags (recommended)

In **Container Settings → Advanced** enable:

- **URL Passthrough** — prevents campaign parameters (`gclid`, `utm_*`) from being lost due to missing cookies
- **Ads Data Redaction** — redacts IP portions and click IDs when ad consent is missing

The plugin can also send these two flags to the `dataLayer` before the GTM load. Enabling them in the GTM UI is still recommended so the setting also applies to server-side GTM containers.

### 5) Trigger for custom events from `trackEvent()`

When you call `consent.trackEvent('cta_click', { label: 'Hero' }, { requires: 'analytics' })`, the plugin pushes the following object to the `dataLayer`:

```jsonc
{ "event": "cta_click", "label": "Hero" }
```

In GTM, create a trigger of type **Custom Event** with **Event name = `cta_click`** and attach it to the desired tag. The payload fields (here `label`) are available as a **Data Layer Variable** with exactly this name.

### 6) `cookie_consent_update` event (automatic on every change)

On **every consent change** (Accept/Reject/Save/Reset), the plugin automatically pushes this event to the `dataLayer` — without you having to do anything in the `onConsentChange` callback:

```jsonc
{
  "event": "cookie_consent_update",
  "consent_reason": "update",             // "update" or "reset"
  "consent": {
    "necessary": true,
    "preferences": false,
    "analytics": false,
    "marketing": true
  },
  "consent_signals": {
    "security_storage": "granted",
    "functionality_storage": "granted",
    "personalization_storage": "denied",
    "analytics_storage": "denied",
    "ad_storage": "granted",
    "ad_user_data": "granted",
    "ad_personalization": "granted"
  }
}
```

With this, in GTM you can:
- Set **triggers** on `cookie_consent_update` and filter per category or signal
- Read **Data Layer Variables** with dot notation: `consent.marketing`, `consent_signals.ad_storage`, `consent_reason`
- Have custom-HTML pixels (Meta, LinkedIn, TikTok) react live to changes — no reload

#### Use case: live revoke/grant of Meta Pixel (no reload)

Meta Pixel stays in browser memory after the first load — consent settings only block **new** firings but don't remove the already-loaded pixel. Using the `cookie_consent_update` event, the pixel can be **actively** stopped or reactivated:

**Create a Data Layer Variable:**
- Name: `dlv_consent_marketing`
- Data Layer Variable Name: `consent.marketing`

**Create two triggers (both of type Custom Event):**

| Trigger name | Event name | Filter |
|---|---|---|
| CE — Marketing Granted | `cookie_consent_update` | `dlv_consent_marketing` **equals** `true` |
| CE — Marketing Revoked | `cookie_consent_update` | `dlv_consent_marketing` **equals** `false` |

**Create two Custom HTML tags** (both **without** consent settings — otherwise they'd block themselves):

*Tag "Meta Pixel — Grant":*
```html
<script>
  if (typeof fbq === 'function') fbq('consent', 'grant');
</script>
```
Trigger: `CE — Marketing Granted`

*Tag "Meta Pixel — Revoke":*
```html
<script>
(function() {
  if (typeof fbq === 'function') fbq('consent', 'revoke');

  var cookieNames = ['_fbp', '_fbc'];
  var host = window.location.hostname;
  var parts = host.split('.');
  var domains = [host, '.' + host];
  for (var i = 1; i < parts.length - 1; i++) {
    domains.push('.' + parts.slice(i).join('.'));
  }
  cookieNames.forEach(function(name) {
    domains.forEach(function(d) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
    });
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
})();
</script>
```
Trigger: `CE — Marketing Revoked`

On the **existing Meta Pixel base tag**, replace the `cookie_consent_update` trigger with **`CE — Marketing Granted`** so the base tag only re-fires on an actual grant rather than being triggered unnecessarily on every deny click.

### 7) Verification in GTM preview mode

1. In GTM, click **Preview** → open your domain → **Tag Assistant** connects.
2. **Before** any user decision, click the first event entry on the left in Tag Assistant → tab **"Consent"**:
   All signals except `security_storage` must be **denied**. No analytics / ads tag may have fired.
3. Click **"Accept all"** in the banner. In Tag Assistant, a `consent update` event appears, all signals go to **granted**, and now GA4/Ads tags fire.
4. Test **"Reject all"**: all signals stay `denied`, Google tags fire in cookieless mode (no `_ga`, `_gcl_*`, `_fbp` cookies in the **Application → Cookies** tab), custom HTML tags don't fire at all.
5. Call `consent.reset()` in the devtools console → banner appears again → step 2 must apply again.

### 8) Common mistakes

- **GTM snippet included twice** (in `index.html` **and** via the plugin) → consent default comes too late because the first GTM has already loaded. Only include it via the plugin.
- **Consent settings on the tag left empty** → tag fires despite rejection. Set "Require additional consent" for every optional tag.
- **`gtmId` missing / wrong** → the plugin logs a warning and still sets the consent default. Without a valid ID, GTM never loads.
- **`loadGtmOnlyAfterConsent: true` chosen, but GA4 events expected before consent** → in this mode there is no `dataLayer` consumer until the user consents. For cookieless pings, leave **`loadGtmOnlyAfterConsent: false`** (default).
- **Custom HTML tag without consent binding** (Meta/LinkedIn/TikTok) → fires despite rejection. Consent Mode v2 **only** protects Google tags automatically.

## GDPR — what the plugin technically enforces

1. Optional categories start on `false` (opt-in)
2. Consent Mode v2 default = `denied` **before** any GTM tags load
3. "Reject all" is equivalent to "Accept all"
4. Categories individually selectable in the settings dialog
5. Auditable: timestamp + policy version in `localStorage`
6. Re-prompt on changed `consentVersion` or after expiry
7. Revocation at any time — via floating button, `openSettings()` or `reset()`
8. Recommended GTM flags active (`url_passthrough`, `ads_data_redaction`)

> Note: Full legal certainty additionally depends on your privacy policy, concrete GTM setup and, if necessary, legal review.

## Getting updates into your SPA

New version of the plugin available? In your SPA:

```bash
npm update vue-consent-gtm            # get the latest compatible version (^0.x)
# or specifically:
npm install vue-consent-gtm@latest
npm ls vue-consent-gtm                # check which version is installed
```

## Development

```bash
# Clone repository and install dependencies
npm install

# Create .env from example
cp .env.example .env

# Start dev server for the demo
npm run dev

# Build library for production (ESM + UMD to dist/)
npm run build
```

## License

MIT
