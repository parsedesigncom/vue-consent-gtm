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

| Methode | Beschreibung |
|---|---|
| `hasConsent(key)` | Prüft, ob für die Kategorie eingewilligt wurde |
| `isDecided()` | Wurde bereits eine Entscheidung getroffen? |
| `acceptAll()` | Alle Kategorien annehmen |
| `rejectAll()` | Alle optionalen ablehnen |
| `save(choices)` | Individuelle Auswahl speichern |
| `reset()` | Einwilligung löschen (Banner erscheint erneut) |
| `trackEvent(event, params, { requires })` | Pusht nur bei entsprechender Zustimmung |
| `push(obj)` | Direkter `dataLayer.push` |

In Options-API / Templates auch als `$consent` verfügbar.

## Konfiguration

| Option | Typ | Default | Beschreibung |
|---|---|---|---|
| `gtmId` | `string` | — | **Pflicht.** GTM-Container-ID |
| `consentVersion` | `number` | `1` | Erhöhen invalidiert gespeicherte Einwilligung |
| `expiryDays` | `number` | `182` | Gültigkeitsdauer der Zustimmung |
| `categories` | `object` | Standard | Definition der Kategorien und deren Consent-Signale |
| `loadGtmOnlyAfterConsent` | `boolean` | `false` | Strengste Auslegung: GTM erst nach Zustimmung laden |
| `onConsentChange` | `function` | — | Callback bei jeder Änderung |

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
