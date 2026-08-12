# vue-consent-gtm

Ein wiederverwendbares, **DSGVO-konformes Cookie-Consent-Plugin für Vue 3** mit nativer Anbindung an den **Google Tag Manager (Consent Mode v2)**.

- Kein Server-Backend, kein externer Consent-Dienst
- Trennung von Logik und UI — eigene Banner-Komponente möglich
- Consent Mode v2 Default `denied`, Update erst nach Nutzerentscheidung
- Granulare Kategorien, Versionierung, Ablauf, Widerruf
- **i18n out-of-the-box** (DE + EN) mit Browser-Detection
- **Floating Cookie-Button** für den Widerruf auf jeder Seite
- **Farben aus dem Config** anpassbar (Fallback auf sinnvolle Defaults)
- Feste Schriftart **Arial** — keine Font-Konflikte mit der Host-App

---

## Installation

```bash
npm install vue-consent-gtm
```

## Einbindung

### Minimal — nur GTM-ID

```js
import { createApp } from 'vue'
import App from './App.vue'
import VueConsentGtm from 'vue-consent-gtm'
import 'vue-consent-gtm/style.css'

const app = createApp(App)
app.use(VueConsentGtm, { gtmId: 'GTM-XXXXXXX' })
app.mount('#app')
```

Damit ist alles aktiv: Banner, Browser-Sprachendetection (DE/EN), Consent Mode v2 default `denied`, Floating-Button für den Widerruf nach der ersten Entscheidung.

### Komplettes Beispiel mit allen Optionen

```js
app.use(VueConsentGtm, {
  gtmId: 'GTM-XXXXXXX',
  consentVersion: 1,
  expiryDays: 182,
  loadGtmOnlyAfterConsent: false,

  // Sprache
  locale: 'auto',              // 'auto' | 'de' | 'en'
  fallbackLocale: 'en',

  // Text-Overrides pro Sprache (optional)
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

  // Widerruf-Button (Cookie-Icon)
  floatingButton: {
    enabled: true,
    position: 'bottom-left'    // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  },

  // Farben & Optik (alles optional, fällt auf Defaults zurück)
  theme: {
    primary: '#e11d48',
    radius: '14px'
  },

  onConsentChange(choices) {
    console.log('Consent changed:', choices)
  }
})
```

Der Banner erscheint automatisch, wenn noch keine Entscheidung getroffen wurde. Nach der Entscheidung erscheint der Cookie-Button an der konfigurierten Position.

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
  <button v-if="consent.hasConsent('marketing')">Marketing active</button>
  <button @click="consent.openSettings()">{{ consent.texts.cookieSettings }}</button>
</template>
```

> Tipp: `openSettings()` öffnet nur den Einstellungs-Dialog (Nutzer kann Auswahl ändern). `reset()` löscht die gespeicherte Einwilligung komplett — der Banner erscheint danach wieder wie beim ersten Besuch.

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
| `openSettings()` | Einstellungs-Dialog öffnen (auch nach erteilter Zustimmung) — für Widerruf |
| `closeSettings()` | Einstellungs-Dialog schließen |
| `showSettings` | Ist der Einstellungs-Dialog gerade offen? (reaktiv) |

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
| `floatingButton` | `object` | `{ enabled: true, position: 'bottom-left' }` | Schwebender Cookie-Button für Widerruf. `position`: `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right'` |
| `theme` | `object` | — | Farben und Optik (siehe [Theme](#theme-farben--optik)). Alles optional, jeder Key hat einen Default |
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
`title`, `body`, `acceptAll`, `rejectAll`, `settings`, `save`, `close`, `required`, `cookieSettings`, `policyLinkLabel`, `policyLinkHref`

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

## Theme (Farben & Optik)

Über die `theme`-Option lassen sich Farben, Radien, Schatten und die Größe/Position des Floating Buttons direkt aus dem Config setzen — ohne globales CSS. Alles ist optional; wird ein Key nicht gesetzt, greifen die eingebauten Defaults.

```js
app.use(VueConsentGtm, {
  gtmId: '…',
  theme: {
    primary: '#e11d48',           // Buttons „Akzeptieren", Fokusring
    primaryContrast: '#ffffff',   // Text auf Primary
    bg: '#ffffff',                // Panel-Hintergrund
    text: '#111827',              // Text
    muted: '#6b7280',             // Beschreibungstext, sekundäre Infos
    border: '#e5e7eb',            // Rahmen
    secondaryBg: '#f2f4f7',       // „Ablehnen" / „Speichern"-Buttons
    secondaryText: '#111827',
    radius: '14px',               // Panel- und Button-Radius
    shadow: '0 12px 32px rgba(0,0,0,0.18)',
    maxWidth: '640px',            // Panel-Breite
    backdrop: 'rgba(0,0,0,0.35)', // Overlay

    // Floating Cookie-Button
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

**Beispiel — nur die Primary-Farbe der Marke setzen:**
```js
theme: { primary: '#e11d48' }
```

**Beispiel — Dark-Mode:**
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

> Font ist fest auf **Arial** — bewusst, damit das Banner in jeder Host-App identisch aussieht und keine Font-Konflikte auftreten. Wenn du eigene Fonts brauchst, ersetze die Standard-Komponente (siehe „Eigene UI" unten).

`theme` schreibt die Werte als **Inline-CSS-Variablen** auf die Komponente. Wenn du sie zusätzlich per CSS (z. B. Media-Query fürs Dark-Mode) übersteuern willst, brauchst du `!important` oder eine höhere Selektor-Spezifität — oder du setzt einfach nur eines von beiden.

## Standard-Kategorien

| Kategorie | Consent-Signale (v2) |
|---|---|
| `necessary` (immer aktiv) | `security_storage`, `functionality_storage` |
| `preferences` | `functionality_storage`, `personalization_storage` |
| `analytics` | `analytics_storage` |
| `marketing` | `ad_storage`, `ad_user_data`, `ad_personalization` |

Bei Kollision zwischen Kategorien gilt: **granted gewinnt**.

## Widerruf & Einstellungen erneut öffnen

DSGVO verlangt, dass der Widerruf **so einfach ist wie die Erteilung**. Das Plugin bietet dafür zwei Wege:

**1) Automatischer Floating Button** (Default)
Nach der ersten Entscheidung erscheint unten links ein kleiner Cookie-Button. Klick öffnet den Einstellungs-Dialog. Position konfigurierbar:

```js
app.use(VueConsentGtm, {
  gtmId: '…',
  floatingButton: { enabled: true, position: 'bottom-right' }
})
```

**2) Eigener Trigger** (Footer-Link, Menü-Eintrag, etc.)
Wenn du den Floating Button ausschaltest und stattdessen deinen eigenen Trigger im Layout platzieren willst:

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

**Kompletter Widerruf** (Zustimmung löschen und Banner erneut zeigen):
```js
consent.reset()
```

## Styling

Alle Farben, Radien und Abstände sind per CSS-Variablen anpassbar.

**Banner + Einstellungs-Dialog:**
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

**Floating Cookie-Button:**
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

**Dark-Mode-Beispiel:**
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

Du kannst die Standard-Komponente auch komplett ersetzen und lediglich `useConsent()` in deiner eigenen UI verwenden. Deaktiviere dazu Banner und Floating-Button:
```js
app.use(VueConsentGtm, {
  gtmId: '…',
  autoMountBanner: false,
  floatingButton: { enabled: false }
})
```
Und importiere bei Bedarf die Einzelkomponenten:
```js
import { CookieBanner, FloatingConsentButton } from 'vue-consent-gtm'
```

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
7. Widerruf jederzeit — via Floating-Button, `openSettings()` oder `reset()`
8. Empfohlene GTM-Flags aktiv (`url_passthrough`, `ads_data_redaction`)

> Hinweis: Vollständige Rechtssicherheit hängt zusätzlich von Datenschutzerklärung, konkretem GTM-Setup und ggf. anwaltlicher Prüfung ab.

## Updates in deine SPA holen

Neue Version des Plugins verfügbar? In der SPA:

```bash
npm update vue-consent-gtm            # holt neueste kompatible Version (^0.x)
# oder gezielt:
npm install vue-consent-gtm@latest
npm ls vue-consent-gtm                # prüft welche Version installiert ist
```

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
