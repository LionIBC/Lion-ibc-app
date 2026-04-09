'use client';

export default function gruendungPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f7f5ef 0%, #f3f0e8 100%)',
        padding: '32px 20px 60px'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '20px' }}>
          <img src="/logo.png" style={{ height: '120px' }} />
        </div>

        <section style={card}>
          <h1 style={title}>
            Digitale Unternehmensgründung
          </h1>

          <p style={subtitle}>
            Übermitteln Sie uns alle relevanten Informationen. Wir übernehmen die vollständige Gründung inklusive Notar, Gewerbeanmeldung, steuerlicher Erfassung und weiterer Behörden.
          </p>

          <form style={{ marginTop: '30px' }}>

            {/* Ansprechpartner */}
            <h3 style={sectionTitle}>Ansprechpartner</h3>
            <div style={grid}>
              <input placeholder="Vorname" style={input} />
              <input placeholder="Nachname" style={input} />
              <input placeholder="Telefon" style={input} />
              <input placeholder="E-Mail" style={input} />
            </div>

            {/* Gründung */}
            <h3 style={sectionTitle}>Gründungsvorhaben</h3>
            <div style={grid}>
              <input placeholder="Gewünschter Firmenname" style={input} />
              <input placeholder="Alternative Firmennamen (optional)" style={input} />
              <input placeholder="Rechtsform (z.B. GmbH)" style={input} />
              <input placeholder="Unternehmenssitz (Ort)" style={input} />
              <input placeholder="Geschäftsadresse vorhanden? (ja/nein)" style={input} />
              <input placeholder="Tätigkeit / Branche" style={input} />
            </div>

            {/* Gesellschafter */}
            <h3 style={sectionTitle}>Gesellschafter / Geschäftsführer</h3>
            <div style={grid}>
              <input placeholder="Name Gesellschafter 1" style={input} />
              <input placeholder="Beteiligung in %" style={input} />
              <input placeholder="Geschäftsführer (ja/nein)" style={input} />
              <input placeholder="Weitere Gesellschafter vorhanden? (ja/nein)" style={input} />
            </div>

            {/* Stammkapital */}
            <h3 style={sectionTitle}>Stammkapital</h3>
            <div style={grid}>
              <input placeholder="Höhe des Stammkapitals (z.B. 25.000 €)" style={input} />
            </div>

            {/* Steuer */}
            <h3 style={sectionTitle}>Steuer & Behörden</h3>
            <div style={grid}>
              <input placeholder="Umsatz im 1. Jahr (geschätzt)" style={input} />
              <input placeholder="Gewinn im 1. Jahr (geschätzt)" style={input} />
              <input placeholder="Kleinunternehmerregelung (ja/nein/unsicher)" style={input} />
            </div>

            {/* Mitarbeiter */}
            <h3 style={sectionTitle}>Mitarbeiter</h3>
            <div style={grid}>
              <input placeholder="Werden Mitarbeiter eingestellt? (ja/nein)" style={input} />
              <input placeholder="Anzahl Mitarbeiter (optional)" style={input} />
              <input placeholder="Start der Beschäftigung (optional)" style={input} />
            </div>

            {/* Upload */}
            <h3 style={sectionTitle}>Unterlagen</h3>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                Bitte laden Sie vorhandene Unterlagen hoch (z.B. Ausweis, Entwürfe, Dokumente)
              </p>
              <input type="file" multiple />
            </div>

            {/* Zustimmung */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px' }}>
                <input type="checkbox" /> Ich beauftrage Lion IBC mit der Durchführung der Unternehmensgründung und bestätige die Richtigkeit meiner Angaben.
              </label>
            </div>

            {/* Button */}
            <button style={button}>
              Gründung absenden
            </button>

          </form>
        </section>
      </div>
    </main>
  );
}

const card = {
  background: '#ffffff',
  borderRadius: '20px',
  padding: '40px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};

const title = {
  fontSize: '36px',
  fontWeight: '700',
  marginBottom: '10px'
};

const subtitle = {
  color: '#475467',
  marginBottom: '20px'
};

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  fontWeight: '600'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px'
};

const input = {
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #ddd'
};

const button = {
  marginTop: '20px',
  padding: '16px',
  borderRadius: '12px',
  background: '#8c6b43',
  color: '#fff',
  border: 'none',
  fontWeight: '600',
  width: '100%',
  cursor: 'pointer'
};

