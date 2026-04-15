'use client';

const modules = [
  {
    title: 'Kunden',
    href: '/intern/kunden',
    description: 'Mandanten, Stammdaten und Ansprechpartner verwalten.',
    status: 'aktiv'
  },
  {
    title: 'Aufträge',
    href: '/intern/auftraege',
    description: 'Auftragsbestätigungen, Positionen und Statusübersicht.',
    status: 'aktiv'
  },
  {
    title: 'Rechnungen',
    href: '/intern/rechnungen',
    description: 'Rechnungen, Abschläge, Schlussrechnungen und PDF/Facturae.',
    status: 'aktiv'
  },
  {
    title: 'Wiederkehrende Rechnungen',
    href: '/intern/wiederkehrende-rechnungen',
    description: 'Vorlagen, Intervalle und automatische Rechnungsläufe.',
    status: 'aktiv'
  },
  {
    title: 'DATEV Export',
    href: '/intern/datev-export',
    description: 'Rechnungen als CSV für die Buchhaltung exportieren.',
    status: 'aktiv'
  },
  {
    title: 'Bank',
    href: '/intern/bank',
    description: 'Bankverbindungen, CSV-Import und Zahlungsabgleich.',
    status: 'aktiv'
  },
  {
    title: 'Mahnlauf',
    href: '/intern/mahnlauf',
    description: 'Überfällige Rechnungen erkennen und Mahnstufen verwalten.',
    status: 'aktiv'
  },
  {
    title: 'Tickets',
    href: '/intern/tickets',
    description: 'Interne Bearbeitung von Vorgängen und offenen Aufgaben.',
    status: 'vorbereitet'
  },
  {
    title: 'Dokumente',
    href: '/intern/dokumente',
    description: 'Dokumente, Uploads und spätere zentrale Verwaltung.',
    status: 'vorbereitet'
  },
  {
    title: 'E-Mail Versand',
    href: '/intern/emails',
    description: 'Versandhistorie, automatische E-Mails und Protokolle.',
    status: 'vorbereitet'
  }
];

function statusStyle(status) {
  if (status === 'aktiv') {
    return {
      background: '#ecfdf3',
      border: '1px solid #abefc6',
      color: '#067647'
    };
  }

  return {
    background: '#fffaeb',
    border: '1px solid #fedf89',
    color: '#b54708'
  };
}

export default function InternDashboardPage() {
  return (
    <main style={wrap}>
      <div style={container}>
        <section style={heroCard}>
          <div style={badge}>Intern</div>
          <h1 style={mainTitle}>Internes Dashboard</h1>
          <p style={heroText}>
            Zentrale Übersicht für dein Team. Von hier aus können alle internen Bereiche direkt geöffnet werden,
            ohne jedes Mal Pfade manuell anzupassen.
          </p>
        </section>

        <section style={infoCard}>
          <div style={infoGrid}>
            <div style={infoBox}>
              <div style={infoLabel}>Schnellzugriff</div>
              <div style={infoValue}>Alle internen Module an einem Ort</div>
            </div>

            <div style={infoBox}>
              <div style={infoLabel}>Pfad</div>
              <div style={infoValue}>/intern</div>
            </div>

            <div style={infoBox}>
              <div style={infoLabel}>Ziel</div>
              <div style={infoValue}>Mitarbeiter können alles direkt testen</div>
            </div>
          </div>
        </section>

        <section style={grid}>
          {modules.map((module) => (
            <a key={module.href} href={module.href} style={card}>
              <div style={cardTop}>
                <h2 style={cardTitle}>{module.title}</h2>
                <div style={{ ...statusPill, ...statusStyle(module.status) }}>
                  {module.status}
                </div>
              </div>

              <p style={cardText}>{module.description}</p>

              <div style={cardFooter}>
                <span style={pathText}>{module.href}</span>
                <span style={arrow}>→</span>
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}

const wrap = {
  padding: 30,
  background: '#f7f5ef',
  minHeight: '100vh'
};

const container = {
  maxWidth: 1320,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const heroCard = {
  background: '#fff',
  padding: 28,
  borderRadius: 20,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #ddd6c8',
  color: '#6b5b45',
  background: '#faf8f3',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 12
};

const mainTitle = {
  margin: 0,
  fontSize: 32,
  color: '#101828'
};

const heroText = {
  margin: '12px 0 0 0',
  fontSize: 16,
  color: '#475467',
  lineHeight: 1.6,
  maxWidth: 850
};

const infoCard = {
  background: '#fff',
  padding: 22,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 16
};

const infoBox = {
  padding: 16,
  borderRadius: 16,
  background: '#fcfcfd',
  border: '1px solid #eceff3'
};

const infoLabel = {
  fontSize: 12,
  color: '#667085',
  marginBottom: 8
};

const infoValue = {
  fontSize: 15,
  fontWeight: 700,
  color: '#101828'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16
};

const card = {
  display: 'block',
  textDecoration: 'none',
  background: '#fff',
  padding: 22,
  borderRadius: 18,
  border: '1px solid #e7e1d6',
  boxShadow: '0 10px 24px rgba(16, 24, 40, 0.04)'
};

const cardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const cardTitle = {
  margin: 0,
  fontSize: 22,
  color: '#101828'
};

const statusPill = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap'
};

const cardText = {
  margin: '14px 0 0 0',
  fontSize: 15,
  color: '#475467',
  lineHeight: 1.6,
  minHeight: 72
};

const cardFooter = {
  marginTop: 18,
  paddingTop: 14,
  borderTop: '1px solid #f2f4f7',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const pathText = {
  fontSize: 13,
  color: '#8c6b43',
  fontWeight: 700
};

const arrow = {
  color: '#8c6b43',
  fontWeight: 700,
  fontSize: 18
};
