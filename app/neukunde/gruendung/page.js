'use client';

import { useState } from 'react';

export default function GruendungPage() {
  const [rechtsform, setRechtsform] = useState('');
  const [gesellschafterCount, setGesellschafterCount] = useState(0);
  const [geschaeftsfuehrerCount, setGeschaeftsfuehrerCount] = useState(0);

  const isEinzelunternehmen = rechtsform === 'Einzelunternehmen';

  return (
    <main className="page-bg">
      <div className="container">

        {/* HEADER */}
        <div className="header">
          <img src="/logo.png" className="logo" />

          <div>
            <div className="brand-title">Unternehmensgründung</div>
            <div className="brand-sub">Bitte geben Sie alle relevanten Daten an</div>
          </div>
        </div>

        <div className="card">

          {/* RECHTSFORM */}
          <h2>Rechtsform</h2>
          <select
            value={rechtsform}
            onChange={(e) => setRechtsform(e.target.value)}
          >
            <option value="">Bitte wählen</option>
            <option>Einzelunternehmen</option>
            <option>GmbH</option>
            <option>UG</option>
            <option>GbR</option>
            <option>AG</option>
          </select>

          {/* FIRMENNAME */}
          <h2>Firmenname</h2>

          <input placeholder="Gewünschter Firmenname" required />

          {!isEinzelunternehmen && (
            <>
              <input placeholder="Alternativer Name 1" required />
              <input placeholder="Alternativer Name 2" required />
            </>
          )}

          {/* GESELLSCHAFTER */}
          {!isEinzelunternehmen && (
            <>
              <h2>Gesellschafter</h2>

              <select onChange={(e) => setGesellschafterCount(Number(e.target.value))}>
                <option value="0">Anzahl wählen</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {Array.from({ length: gesellschafterCount }).map((_, i) => (
                <div key={i} style={{ marginTop: '20px' }}>
                  <h3>Gesellschafter {i + 1}</h3>
                  <input placeholder="Name" required />
                  <input placeholder="Adresse" required />
                  <input placeholder="Steuer-ID" required />
                </div>
              ))}
            </>
          )}

          {/* GESCHÄFTSFÜHRER */}
          {!isEinzelunternehmen && (
            <>
              <h2>Geschäftsführer</h2>

              <select onChange={(e) => setGeschaeftsfuehrerCount(Number(e.target.value))}>
                <option value="0">Anzahl wählen</option>
                {[1,2,3].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {Array.from({ length: geschaeftsfuehrerCount }).map((_, i) => (
                <div key={i} style={{ marginTop: '20px' }}>
                  <h3>Geschäftsführer {i + 1}</h3>
                  <input placeholder="Name" required />
                  <input placeholder="Adresse" required />
                  <input placeholder="Steuer-ID" required />
                </div>
              ))}
            </>
          )}

          {/* DOKUMENTE */}
          <h2>Dokumente</h2>

          <p style={{ marginBottom: '10px', color: '#667085' }}>
            Bitte laden Sie folgende Dokumente hoch:
            <br />
            - Ausweisdokument
            <br />
            - Bei ausländischen Staatsbürgern: Reisepass + Meldebescheinigung
            <br />
            - Weitere Unterlagen nach Bedarf
          </p>

          <input type="file" multiple />

        </div>
      </div>
    </main>
  );
}
