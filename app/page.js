import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <section className="hero heroPanel">
        <div className="brandPill">LION IBC · Neukundenaufnahme</div>
        <h1>Digitale Unternehmensaufnahme für neue Mandanten</h1>
        <p>
          Über dieses Formular erfassen Ihre Kunden die wichtigsten Unternehmensdaten,
          Ansprechpartner, Gesellschaftsstruktur, gewünschten Leistungen und steuerlichen
          Meldeturni. Nach dem Absenden erhalten Sie eine strukturierte E-Mail an
          info@lion-ibc.com.
        </p>
        <div className="actions">
          <Link href="/neukunde" className="button">Formular öffnen</Link>
        </div>
      </section>

      <section className="grid">
        <div className="card lightCard">
          <h2>In Version 1.1 enthalten</h2>
          <ul className="clean darkList">
            <li>Rechtsform-Logik für Inhaber, Gesellschafter und Geschäftsführer</li>
            <li>Unternehmensnummer, Betriebsnummer und BG-PIN</li>
            <li>Leistungswünsche mit Startdatum</li>
            <li>Umsatzsteuer- und Lohnsteuer-Turnus</li>
            <li>DSGVO-Pflichtfeld und definierte Pflichtfelder</li>
            <li>direkte E-Mail-Benachrichtigung an info@lion-ibc.com</li>
          </ul>
        </div>

        <div className="card lightCard">
          <h2>Für den nächsten Ausbauschritt vorbereitet</h2>
          <ul className="clean darkList">
            <li>Mitarbeiterformular</li>
            <li>Dateiuploads für Unterlagen</li>
            <li>Admin-Bereich mit Statusübersicht</li>
            <li>Datenbank oder eigener Server</li>
            <li>personalisierte Kundenlinks</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
