# BabyTools

Statische Multi-Page Website (Vanilla HTML/CSS/JS) für kleine Familien-Tools.

## Struktur

- `index.html` -> Landingpage mit Tool-Kacheln
- `assets/css/main.css` -> gemeinsame Styles
- `assets/js/main.js` -> globale Funktionen (Footer-Jahr, aktiver Nav-Link)
- `tools/babywetter/index.html` -> Toolseite
- `tools/babywetter/babywetter.js` -> BabyWetter-Logik
- `tools/windelrechner/index.html` -> Toolseite
- `tools/windelrechner/windelrechner.js` -> Windel-Rechner-Logik
- `impressum/index.html` -> Impressum (Platzhalter bitte ersetzen)
- `datenschutz/index.html` -> Datenschutzerklärung (Platzhalter bitte ersetzen)
- `assets/partials/affiliate-hinweis.html` -> Optionaler Hinweisblock für spätere Artikel
- `404.html` -> Fallback-Seite

## Lokal starten

1. Repo öffnen.
2. `index.html` im Browser öffnen oder lokal mit einem einfachen Webserver starten.

Beispiel:

```bash
python3 -m http.server 8000
```

Dann aufrufen:

- `http://localhost:8000/`
- `http://localhost:8000/tools/babywetter/`
- `http://localhost:8000/tools/windelrechner/`

## GitHub Pages (Project Page)

Alle Links sind relativ gehalten, damit Deployments unter einem Unterpfad wie `/Babytools/` funktionieren.

## Datenschutz

- Keine Marketing-Cookies integriert
- Optionales Event-Hook-System vorhanden (`window.babytoolsTrack`)

### Analytics andocken (optional)

Die App feuert interne Events ueber `window.babytoolsTrack(...)`.
GA4 wird nur nach Einwilligung geladen (Consent-Banner in `assets/js/analytics-consent.js`).

Typische Events:

- `page_view`
- `link_click`
- `babywetter_recommendation`
- `babywetter_mode_change`
- `windelrechner_calculate`

Snippet im `<head>` (bereits eingebaut):

```html
<script src="./assets/js/analytics-consent.js"></script>
```

Die Measurement-ID wird zentral in `assets/js/analytics-consent.js` gepflegt (`GA_ID`).

### Google Search Console (kostenlos)

1. In der Search Console eine Domain-Property fuer `babytool.app` anlegen.
2. DNS-Verification im Domain-Provider setzen.
3. `https://babytool.app/sitemap.xml` einreichen.
4. Unter `Leistung` Klicks, Impressionen, CTR und Queries beobachten.

## Legal pages added

Impressum und Datenschutz sind als statische, direkt aufrufbare Seiten angelegt und
von allen Seiten im Footer verlinkt.

Vor Livegang bitte diese Platzhalter ersetzen:

- `[VORNAME NACHNAME]`
- `[STRASSE HAUSNUMMER]`
- `[PLZ ORT]`
- `[KONTAKT-EMAIL]`
- `[TELEFON]` (optional, aber empfohlen)
- `https://[DEINE-DOMAIN]/...` in den canonical-Links
