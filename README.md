# BabyTools

Statische Multi-Page Website (Vanilla HTML/CSS/JS) fuer kleine Familien-Tools.

## Struktur

- `index.html` -> Landingpage mit Tool-Kacheln
- `assets/css/main.css` -> gemeinsame Styles
- `assets/js/main.js` -> globale Funktionen (Footer-Jahr, aktiver Nav-Link)
- `tools/babywetter/index.html` -> Toolseite
- `tools/babywetter/babywetter.js` -> BabyWetter-Logik
- `404.html` -> Fallback-Seite

## Lokal starten

1. Repo oeffnen.
2. `index.html` im Browser oeffnen oder lokal mit einem einfachen Webserver starten.

Beispiel:

```bash
python3 -m http.server 8000
```

Dann aufrufen:

- `http://localhost:8000/`
- `http://localhost:8000/tools/babywetter/`

## GitHub Pages (Project Page)

Alle Links sind relativ gehalten, damit Deployments unter einem Unterpfad wie `/Babytools/` funktionieren.

## Datenschutz

- Kein Tracking
- Keine Cookies
- Keine externen Analytics-Skripte
