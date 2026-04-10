export default function MitarbeiterPage() {
  return (
    <main style={wrapper}>
      <div style={container}>
        <h1 style={title}>Mitarbeiter anlegen</h1>

        <p style={subtitle}>
          Erfassen Sie alle relevanten Daten für einen neuen Mitarbeiter.
        </p>

        {/* SECTION 1 */}
        <section style={section}>
          <h2 style={sectionTitle}>1. Arbeitgeber</h2>

          <div style={grid}>
            <div>
              <label style={label}>Unternehmen</label>
              <input style={input} />
            </div>

            <div>
              <label style={label}>Einstellungsart</label>
              <select style={input}>
                <option>Arbeitnehmer</option>
                <option>Minijob</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section style={section}>
          <h2 style={sectionTitle}>2. Persönliche Daten</h2>

          <div style={grid}>
            <input placeholder="Vorname" style={input} />
            <input placeholder="Nachname" style={input} />
            <input placeholder="Straße" style={input} />
            <input placeholder="PLZ" style={input} />
            <input placeholder="Ort" style={input} />
            <input type="date" style={input} />
            <input placeholder="E-Mail" style={input} />
            <input placeholder="Telefon" style={input} />
          </div>
        </section>

        {/* SECTION 3 */}
        <section style={section}>
          <h2 style={sectionTitle}>3. Steuer</h2>

          <div style={grid}>
            <input placeholder="Steuer-ID" style={input} />
            <input placeholder="Steuerklasse" style={input} />
          </div>
        </section>

        <button style={button}>Mitarbeiter speichern</button>
      </div>
    </main>
  );
}

/* ===== STYLES ===== */

const wrapper = {
  background: '#f5f5f5',
  minHeight: '100vh',
  padding: '40px 20px'
};

const container = {
  maxWidth: '900px',
  margin: '0 auto',
  background: '#fff',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};

const title = {
  fontSize: '32px',
  fontWeight: '700',
  marginBottom: '10px'
};

const subtitle = {
  color: '#666',
  marginBottom: '30px'
};

const section = {
  marginBottom: '30px'
};

const sectionTitle = {
  fontSize: '20px',
  marginBottom: '15px'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px'
};

const label = {
  fontSize: '14px',
  marginBottom: '5px',
  display: 'block'
};

const input = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #ddd'
};

const button = {
  marginTop: '20px',
  padding: '14px',
  width: '100%',
  borderRadius: '12px',
  border: 'none',
  background: '#000',
  color: '#fff',
  fontWeight: '600'
};
