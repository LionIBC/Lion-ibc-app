import Link from 'next/link';

    export default function HomePage() {
  return (
    <main className="container">

      {/* LOGO */}
      <div style={{ marginBottom: '30px' }}>
        <img
          src="/logo.png"
          alt="Lion IBC Logo"
          style={{ height: '160px', width: 'auto', display: 'block' }}
        />
      </div>

      <section className="hero heroPanel">
        <div className="brandPill">LION IBC · Neukundenaufnahme</div>

        <h1>Digitale Unternehmensaufnahme für neue Mandanten</h1>

        <p>Bitte wählen Sie den passenden Bereich:</p>

        <div style={{ marginTop: '20px', display: 'flex', gap: '40px' }}>
          <a href="/neukunde">Neukunde</a>
          <a href="/mitarbeiter">Bestandskunde</a>
        </div>
      </section>
    
    </main>
  );
}
