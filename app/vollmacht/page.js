export default function VollmachtPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f5ef',
        padding: '40px 20px'
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e7e2d8',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(16, 24, 40, 0.06)'
        }}
      >
        <h1 style={{ fontSize: '34px', marginBottom: '20px', color: '#101828' }}>
          Vollmacht
        </h1>

        <p style={{ lineHeight: 1.8, color: '#475467' }}>
          Hiermit bevollmächtige ich Lion IBC, mich bzw. mein Unternehmen im Rahmen der
          Unternehmensgründung sowie der damit zusammenhängenden organisatorischen und behördlichen
          Prozesse zu unterstützen und die hierfür erforderlichen Schritte vorzubereiten und zu
          begleiten.
        </p>

        <p style={{ lineHeight: 1.8, color: '#475467', marginTop: '18px' }}>
          Dies umfasst insbesondere die Vorbereitung und Begleitung der Gründung, die Abstimmung mit
          dem Notar, die Gewerbeanmeldung, die steuerliche Erfassung sowie weitere im Zusammenhang
          mit der Unternehmensgründung erforderliche organisatorische Maßnahmen.
        </p>

        <p style={{ lineHeight: 1.8, color: '#475467', marginTop: '18px' }}>
          Ich bestätige, dass die von mir gemachten Angaben vollständig und richtig sind. Mir ist
          bekannt, dass Lion IBC auf Grundlage dieser Angaben tätig wird.
        </p>

        <p style={{ lineHeight: 1.8, color: '#475467', marginTop: '18px' }}>
          Die Bestätigung dieser Vollmacht erfolgt im Rahmen des digitalen Formularprozesses
          zusätzlich durch meine Unterschrift im vorgesehenen Unterschriftenfeld.
        </p>
      </div>
    </main>
  );
}

