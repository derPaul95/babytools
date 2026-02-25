# BabyTools

BabyTools ist ein minimales, statisches Webprojekt in Vanilla HTML/CSS/JS (ohne Build-System, ohne Framework, ohne Backend).

Enthalten ist das Tool **BabyWetter**: eine Outfit-Empfehlung fuer Babys/Kleinkinder auf Basis von Wetterdaten, Altersklasse und Situation.

## Aktueller Funktionsumfang

- Wetter laden ueber:
  - `Standort verwenden` (Geolocation)
  - `Ort suchen` (Open-Meteo Geocoding)
- Treffer werden als klickbare Buttons angezeigt.
- Bei `Standort verwenden` wird der Ortsname per Reverse-Geocoding aufgeloest.
  - Falls kein Name gefunden wird: Fallback auf naechsten Ort aus interner Liste.
- Altersklassen als Button-Auswahl:
  - `Neugeboren (0-3)`
  - `Baby (4-12)`
  - `Kleinkind (1-3)`
- Situationen als Button-Auswahl:
  - `Kinderwagen`
  - `Normal draussen`
  - `Trage`
- Ergebnisdarstellung mit visuellen Karten:
  - Temperatur
  - Gefuehlte Temperatur
  - Risiko (inkl. Badge + Icon)
- Outfit-Ausgabe als nummerierte Layer-Stufen.
- Hinweise als kompakte Info-Chips.
- Robuste Fehlerbehandlung mit Statusmeldungen und Fallbacks.

## Logik (Kurz)

- Gefuehlte Temperatur wird ueber Temperatur, Wind und Regen approximiert.
- Altersklasse und Situation haben eigene Regelsets/Offsets.
- Zusaetzliche Sicherheitsregeln greifen bei Kaelte, Wind und Naesse.
- Wetterbedingung (`weather_code`) beeinflusst Hinweise (z. B. Sonne, Nebel, Schnee).
- Eine optionale Zusatzschicht wird immer empfohlen.

## Lokal starten

1. Projektordner oeffnen.
2. `index.html` per Doppelklick im Browser oeffnen.

Hinweis: Fuer Geolocation kann je nach Browser ein lokaler Webserver sinnvoll sein.

## Datenquellen

Open-Meteo APIs:

- Forecast: `https://api.open-meteo.com/v1/forecast`
  - Felder: `temperature_2m`, `wind_speed_10m`, `precipitation`, `weather_code`
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Reverse Geocoding: `https://geocoding-api.open-meteo.com/v1/reverse`

## Deployment auf GitHub Pages (kurz)

1. Repository nach GitHub pushen.
2. In GitHub: `Settings` -> `Pages`.
3. Unter `Build and deployment` bei `Source` waehlen: `Deploy from a branch`.
4. Branch `main` (oder `master`) und Ordner `/ (root)` auswaehlen.
5. Speichern und auf die veroeffentlichte URL warten.

## Datenschutz

- Keine Cookies
- Kein Tracking
- Keine externen Analytics-Skripte
