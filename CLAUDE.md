# CLAUDE.md — vue-consent-gtm

Anleitung für den Coding-Agenten in diesem Projekt. Diese Datei beschreibt **was** gebaut wird und **welche Regeln** gelten — nicht den fertigen Code. Halte dich an die Konventionen und die DSGVO-Vorgaben unten.

## Ziel

Ein wiederverwendbares, DSGVO-konformes Cookie-Consent-Plugin für **Vue 3**, das als eigenes npm-Package in mehrere SPAs eingebunden wird. Die GTM-Container-ID kommt aus der Config. Nach erteilter Einwilligung sendet das Plugin Events an den Google-Tag-Manager-dataLayer.

Motivation: Unabhängigkeit von kostenpflichtigen Cookie-Tools, volle Kontrolle über UI, Kategorien und Datenfluss.

## Nicht-Ziele / Grenzen

- Kein Server-Backend, kein Consent-Log auf dem Server (Einwilligung wird clientseitig in localStorage gehalten).
- Kein UI-Framework als Abhängigkeit (kein Tailwind/Bootstrap-Zwang). Styling über CSS-Variablen.
- Keine Third-Party-Consent-Scripts laden. Alles selbst.
- Vorerst nur Vue 3. Vue 2 ist explizit außen vor.

## Tech-Stack & Konventionen

- Vue 3, Composition API, `<script setup>` in SFCs.
- Build als Library mit Vite (`build.lib`), Ausgabe ESM + UMD.
- `vue` ist **peerDependency** und im Build `external` (nicht mitbündeln).
- Kein TypeScript-Zwang; wenn TS, dann strikt und mit `.d.ts`-Export.
- Kein Node-only-Code im Runtime-Pfad; SSR-safe (Zugriffe auf `window`/`document` nur guarded).
- Reactivity über `reactive`/`ref`/`computed`. Nach außen `readonly` State geben.
- Öffentliche API klein und stabil halten; interne Module nicht exportieren.

## Modulare Architektur (Trennung Logik / UI)

```
src/
  config.js        Defaults, Kategorien-Definition, Mapping Kategorie -> Consent-Signale
  store.js         Reaktiver State + localStorage (Version, Timestamp, Ablauf, revoke)
  gtm.js           Consent Mode v2 (gtag), GTM-Loader, dataLayer-Push
  plugin.js        Vue-Plugin (app.use) + Consent-Manager als öffentliche API
  useConsent.js    Composable (inject des Managers)
  components/
    CookieBanner.vue   Banner + Einstellungs-Dialog, rein über Props/CSS-Variablen anpassbar
  index.js         Public Exports
```

Die Logik (`store` + `gtm` + `plugin`) muss ohne die mitgelieferte UI funktionieren. Ein Nutzer soll `CookieBanner.vue` durch eine eigene Komponente ersetzen und nur `useConsent()` verwenden können.

## Öffentliche API (Soll-Zustand)

- Plugin: `app.use(VueConsentGtm, { gtmId, consentVersion, expiryDays, categories, ... })`
- Composable: `const consent = useConsent()`
- Manager-Methoden:
  - `hasConsent(key) => boolean`
  - `isDecided() => boolean`
  - `acceptAll()`, `rejectAll()`, `save(choices)`, `reset()`
  - `trackEvent(event, params, { requires })` — pusht nur, wenn die verlangte Kategorie eingewilligt wurde
  - `push(obj)` — Rohzugriff auf den dataLayer
- Auch als globale Property `$consent` für Options-API/Templates.

## Konfiguration (Pflicht-Verhalten)

- `gtmId` (Pflicht): fehlt sie, nur Warnung loggen, nicht crashen.
- `consentVersion` (Zahl): bei Erhöhung wird gespeicherte Einwilligung ungültig → erneut fragen.
- `expiryDays`: nach Ablauf erneut fragen (Standard ~182 Tage).
- `categories`: Standard = necessary / preferences / analytics / marketing. Jede Kategorie mappt auf Consent-Mode-Signale.
- `loadGtmOnlyAfterConsent`: bei `true` GTM-Script erst nach Zustimmung injizieren (strengste Auslegung).
- `onConsentChange(choices)`: Callback bei jeder Änderung.

## Consent-Signal-Mapping (Consent Mode v2)

- necessary → `security_storage`, `functionality_storage` (immer granted, nicht abwählbar)
- preferences → `functionality_storage`, `personalization_storage`
- analytics → `analytics_storage`
- marketing → `ad_storage`, `ad_user_data`, `ad_personalization`

Bei Signal-Kollision zwischen Kategorien gilt: **granted gewinnt**.

## DSGVO-Vorgaben (technisch erzwingen, nicht nur dokumentieren)

1. **Opt-in**: alle optionalen Kategorien starten auf `false`. Kein vorausgewähltes Häkchen.
2. **Consent Mode v2 Default = denied**: `gtag('consent','default', …)` mit allen Ad-/Analytics-Signalen auf `denied` **bevor** irgendein GTM-Tag lädt. Erst nach Nutzerentscheidung `consent 'update'`.
3. **Gleichwertige Buttons**: „Alle ablehnen" ist genauso sichtbar/prominent wie „Alle akzeptieren". Kein Dark Pattern.
4. **Granular**: einzelne Kategorien getrennt an-/abwählbar im Einstellungs-Dialog.
5. **Nachweisbarkeit**: Einwilligung mit Zeitstempel + Policy-Version speichern.
6. **Erneute Abfrage** bei geänderter `consentVersion` oder Ablauf.
7. **Widerruf** jederzeit so einfach wie die Erteilung (`reset()` blendet Banner erneut ein).
8. Empfohlen: `url_passthrough` und `ads_data_redaction` aktivieren.

Wichtig für den Agenten: Diese 8 Punkte sind Akzeptanzkriterien. Änderungen dürfen sie nicht aushebeln.

## GTM-seitige Voraussetzung (in Doku erwähnen)

Damit Consent wirkt, müssen in GTM die Tags an die Einwilligungsprüfung gebunden werden (Analytics → `analytics_storage`, Ads → `ad_storage`/`ad_user_data`/`ad_personalization`). Das Plugin liefert nur die Signale.

## localStorage-Format

```
{ version: <consentVersion>, timestamp: <ms>, choices: { <key>: boolean, ... } }
```

Beim Laden: Version- und Ablauf-Prüfung; bei Mismatch verwerfen und Banner zeigen. Unbekannte Kategorien ignorieren, `required`-Kategorien immer auf `true`.

## Styling

Banner nutzt CSS-Variablen mit Präfix `--pdc-*` (z. B. `--pdc-primary`, `--pdc-radius`). Pro App überschreibbar. Keine Inline-Styles für Themable-Werte.

## Build & Skripte

- `npm run dev` — Vite Dev
- `npm run build` — Library-Build nach `dist/`
- Exports in `package.json`: `import`/`require` + separater `./style.css`-Export.

## Definition of Done

- `npm run build` läuft ohne Fehler und ohne Export-Warnungen.
- Package lässt sich in einer Beispiel-SPA via `app.use()` einbinden; Banner erscheint bei fehlender Entscheidung.
- Vor Zustimmung werden keine Marketing-/Analyse-Cookies gesetzt (Consent Mode default denied verifizierbar im Netzwerk-/Application-Tab).
- `trackEvent(..., { requires: 'analytics' })` pusht nur bei erteilter Analytics-Einwilligung.
- Alle 8 DSGVO-Akzeptanzkriterien erfüllt.

## Offene Punkte / mögliche Erweiterungen

- TypeScript-Typen (`.d.ts`).
- Unit-Tests (Vitest) für `store` (Versionierung, Ablauf, revoke) und `gtm` (Signal-Mapping).
- Floating-Button-Komponente „Cookie-Einstellungen" zum erneuten Öffnen.
- i18n der UI-Texte.

## Hinweis

Diese Datei deckt die technische Umsetzung ab. Vollständige Rechtssicherheit hängt zusätzlich von Datenschutzerklärung, konkretem GTM-Setup und ggf. anwaltlicher Prüfung ab.
