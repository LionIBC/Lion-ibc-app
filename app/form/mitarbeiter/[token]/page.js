export default function MitarbeiterTokenPage({ params }) {
  const { token } = params;

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#101828' }}>
        Mitarbeiterformular
      </h1>

      <p style={{ marginTop: '10px', color: '#667085' }}>
        Dieser Bereich wird aktuell aufgebaut.
      </p>

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#98a2b3' }}>
        Token: {token}
      </p>
    </div>
  );
}

