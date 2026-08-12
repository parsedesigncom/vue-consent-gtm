# vue-consent-gtm

Ein wiederverwendbares, **DSGVO-konformes Cookie-Consent-Plugin für Vue 3** mit nativer Anbindung an den **Google Tag Manager (Consent Mode v2)**.

- Kein Server-Backend, kein externer Consent-Dienst
- Trennung von Logik und UI — eigene Banner-Komponente möglich
- Consent Mode v2 Default `denied`, Update erst nach Nutzerentscheidung
- Granulare Kategorien, Versionierung, Ablauf, Widerruf
- Anpassbar per CSS-Variablen (`--pdc-*`)

---

## Installation

```bash
npm install vue-consent-gtm
```

## Einbindung

In der `main.js` / `main.ts` deiner Vue-3-App:

```js
import { createApp } from 'vue'
import App from './App.vue'
import VueConsentGtm from 'vue-consent-gtm'
import 'vue-consent-gtm/style.css'

const app = createApp(App)

app.use(VueConsentGtm, {
  gtmId: 'GTM-XXXXXXX',
  consentVersion: 1,
  expiryDays: 182,
  loadGtmOnlyAfterConsent: false,
  onConsentChange(choices) {
    console.log('Consent geändert:', choices)
  }
})

app.mount('#app')
```

Die Banner-Komponente wird automatisch eingebunden, sobald noch keine Entscheidung getroffen wurde.

## Config-Quelle wählen

Das Plugin erwartet nur ein Objekt in `app.use(...)`. Woher die Werte kommen, bleibt dir überlassen. Vier gängige Muster:

**A) Hardcoded** — einfachster Fall, eine Umgebung:
```js
app.use(VueConsentGtm, { gtmId: 'GTM-XXXXXXX' })
```

**B) Eigene Config-Datei** — sauber trennen, keine Build-Tool-Magie:
```js
// src/config/consent.js
export const consentConfig = { gtmId: 'GTM-XXXXXXX' }

// main.js
import { consentConfig } from './config/consent.js'
app.use(VueConsentGtm, consentConfig)
```

**C) `.env` via Vite / Nuxt / Vue-CLI** — Standard bei Multi-Environment:
```env
# .env
VITE_GTM_ID=GTM-XXXXXXX
```
```js
app.use(VueConsentGtm, { gtmId: import.meta.env.VITE_GTM_ID })
```

**D) Runtime-Config aus Meta-Tag oder JSON** — für CMS-getriebene Sites oder ein-Build-für-alle-Umgebungen:
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
  <button v-if="consent.hasConsent('marketing')">Marketing aktiv</button>
  <button @click="consent.reset()">Cookie-Einstellungen ändern</button>
</template>
```

### Manager-API

| Methode / Property | Beschreibung |
|---|---|
| `hasConsent(key)` | Prüft, ob für die Kategorie eingewilligt wurde |
| `isDecided()` | Wurde bereits eine Entscheidung getroffen? |
| `acceptAll()` | Alle Kategorien annehmen |
| `rejectAll()` | Alle optionalen ablehnen |
| `save(choices)` | Individuelle Auswahl speichern |
| `reset()` | Einwilligung löschen (Banner erscheint erneut) |
| `trackEvent(event, params, { requires })` | Pusht nur bei entsprechender Zustimmung |
| `push(obj)` | Direkter `dataLayer.push` |
| `locale` | Aktive Sprache (`'de'` oder `'en'`), reaktiv |
| `texts` | Aufgelöste Texte für die aktive Sprache |
| `supportedLocales` | Liste der eingebauten Sprachen |
| `setLocale(loc)` | Sprache setzen (`'de'`, `'en'` oder `'auto'` für Browser-Detection) |
| `localize(value)` | Löst einen `{ de, en }`-Wert für die aktive Sprache auf |

In Options-API / Templates auch als `$consent` verfügbar.

## Konfiguration

| Option | Typ | Default | Beschreibung |
|---|---|---|---|
| `gtmId` | `string` | — | **Pflicht.** GTM-Container-ID |
| `consentVersion` | `number` | `1` | Erhöhen invalidiert gespeicherte Einwilligung |
| `expiryDays` | `number` | `182` | Gültigkeitsdauer der Zustimmung |
| `categories` | `object` | Standard | Kategorien-Definition mit lokalisierten Labels |
| `loadGtmOnlyAfterConsent` | `boolean` | `false` | Strengste Auslegung: GTM erst nach Zustimmung laden |
| `locale` | `'auto' \| 'de' \| 'en'` | `'auto'` | Startsprache. `'auto'` erkennt Browser-Sprache |
| `fallbackLocale` | `'de' \| 'en'` | `'en'` | Sprache wenn Browser-Detection nicht greift |
| `texts` | `object` | — | Text-Overrides pro Sprache: `{ de: {...}, en: {...} }` |
| `onConsentChange` | `function` | — | Callback bei jeder Änderung |

## Mehrsprachigkeit (i18n)

Das Plugin liefert DE und EN out-of-the-box. Die Sprache wird automatisch anhand des Browsers erkannt: startet `navigator.language` mit `de` → Deutsch, sonst Englisch (bzw. der eingestellte `fallbackLocale`).

**Feste Sprache:**
```js
app.use(VueConsentGtm, { gtmId: '…', locale: 'de' })
```

**Automatische Erkennung mit Fallback:**
```js
app.use(VueConsentGtm, { gtmId: '…', locale: 'auto', fallbackLocale: 'en' })
```

**Einzelne Texte überschreiben — pro Sprache:**
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

Alle nicht überschriebenen Keys fallen auf die Default-Texte zurück.

**Verfügbare Text-Keys** (pro Sprache identisch):
`title`, `body`, `acceptAll`, `rejectAll`, `settings`, `save`, `close`, `required`, `policyLinkLabel`, `policyLinkHref`

**Eigene Kategorie-Labels lokalisieren:**
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

**Runtime-Sprachwechsel** (z. B. wenn deine App einen eigenen Sprach-Switcher hat):
```js
const consent = useConsent()
consent.setLocale('en')       // sofort Englisch
consent.setLocale('auto')     // zurück zur Browser-Erkennung
```

## Standard-Kategorien

| Kategorie | Consent-Signale (v2) |
|---|---|
| `necessary` (immer aktiv) | `security_storage`, `functionality_storage` |
| `preferences` | `functionality_storage`, `personalization_storage` |
| `analytics` | `analytics_storage` |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` |

Bei Kollision zwischen Kategorien gilt: **granted gewinnt**.

## Styling

Alle Farben, Radien und Abstände sind per CSS-Variablen anpassbar:

```css
:root {
  --pdc-primary: #0057ff;
  --pdc-bg: #ffffff;
  --pdc-text: #111111;
  --pdc-radius: 8px;
  /* ... */
}
```

Du kannst die Standard-Komponente auch komplett ersetzen und lediglich `useConsent()` in deiner eigenen UI verwenden.

## GTM-Setup (wichtig!)

Damit Consent tatsächlich wirkt, müssen deine Tags im GTM an die passenden Einwilligungs-Signale gebunden werden:

- Google Analytics → `analytics_storage`
- Google Ads / Meta Ads → `ad_storage`, `ad_user_data`, `ad_personalization`

Empfohlen: In den GTM-Einstellungen `url_passthrough` und `ads_data_redaction` aktivieren.

## DSGVO — was das Plugin technisch erzwingt

1. Optionale Kategorien starten auf `false` (Opt-in)
2. Consent Mode v2 Default = `denied` **vor** dem Laden von GTM-Tags
3. „Alle ablehnen" ist gleichwertig zu „Alle akzeptieren"
4. Kategorien einzeln wählbar im Einstellungs-Dialog
5. Nachweisbar: Zeitstempel + Policy-Version im `localStorage`
6. Erneute Abfrage bei geänderter `consentVersion` oder nach Ablauf
7. Widerruf jederzeit über `reset()`
8. Empfohlene GTM-Flags aktiv

> Hinweis: Vollständige Rechtssicherheit hängt zusätzlich von Datenschutzerklärung, konkretem GTM-Setup und ggf. anwaltlicher Prüfung ab.

## Entwicklung

```bash
# Repository klonen und Abhängigkeiten installieren
npm install

# .env aus Beispiel erstellen
cp .env.example .env

# Dev-Server für die Demo starten
npm run dev

# Library für Produktion bauen (ESM + UMD nach dist/)
npm run build
```

## Lizenz

MIT
