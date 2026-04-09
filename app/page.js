import Link from 'next/link';

    export default function HomePage() {
  return (
    <main className="container">

      {/* LOGO */}
      <div style={{ marginBottom: '30px' }}>
        <img
          src="/logo.png"
          alt="Lion IBC Logo"
          style={{ height: '60px' }}
        />
      </div>

      <section className="hero heroPanel">
        <div className="brandPill">LION IBC · Neukundenaufnahme</div>

        <h1>Digitale Unternehmensaufnahme für neue Mandanten</h1>

        <p>Bitte wählen Sie den passenden Bereich:</p>

        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
          <a href="/neukunde">Neukunde</a>
          <a href="/mitarbeiter">Bestandskunde</a>
        </div>
      </section>




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
       <div style={{
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginTop: "30px"
}}>

  {/* NEUKUNDE */}
  <div style={{
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: "12px",
    background: "#fafafa"
  }}>
    <h3>Neukunde</h3>
    <p style={{ fontSize: "14px", color: "#666" }}>
      Erfassen Sie hier neue Mandanten und übermitteln Sie alle relevanten Unternehmensdaten strukturiert und digital.
    </p>
    <Link href="/neukunde" className="button">
      Neukunde starten
    </Link>
  </div>

  {/* BESTEHENDER MANDANT */}
  <div style={{
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: "12px",
    background: "#fafafa"
  }}>
    <h3>Bestehender Mandant</h3>
   <p style={{ fontSize: "14px", color: "#666" }}>
  Mitarbeiter anlegen, Unterlagen übermitteln und digitale Prozesse nutzen.
  <br />
  <span style={{ fontSize: "12px", color: "#999" }}>
    Geschützter Zugang wird bereitgestellt.
  </span>
</p>

    <a href="/mitarbeiter" style={{
      display: "inline-block",
      marginTop: "10px",
      padding: "10px 16px",
      background: "#000",
      color: "#fff",
      borderRadius: "8px",
      textDecoration: "none"
    }}>
      Mandantenbereich öffnen
    </a>
  </div>

</div>

      </section>

    
    </main>
  );
}
