# Lion IBC – Neukundenaufnahme V1.1

Fokussierte Web-App für die digitale Aufnahme neuer Unternehmen.

## Enthalten
- Lion-IBC-Branding in heller, mobiler Oberfläche
- strukturiertes Neukundenformular
- Rechtsform-Logik für Inhaber / Gesellschafter / Geschäftsführer
- Unternehmensnummer, Betriebsnummer und BG-PIN
- Leistungen inklusive Startdaten
- Umsatzsteuer- und Lohnsteuer-Turnus
- DSGVO-Pflichtfeld und definierte Pflichtfelder
- E-Mail-Versand per Resend an `info@lion-ibc.com`

## Schnellstart lokal
```bash
npm install
npm run dev
```

## Deployment auf Vercel
1. Projekt bei Vercel importieren
2. Diese Umgebungsvariablen setzen:

```env
RESEND_API_KEY=dein_resend_api_key
NOTIFICATION_EMAIL=info@lion-ibc.com
FROM_EMAIL=Lion IBC <onboarding@resend.dev>
```

## Routen
- `/` Startseite
- `/neukunde` Formular Neukundenaufnahme

## Hinweis
Diese Version sendet die Eingaben per E-Mail. Dauerhafte Datenspeicherung auf eigenem Server oder in einer Datenbank kann im nächsten Schritt ergänzt werden.
