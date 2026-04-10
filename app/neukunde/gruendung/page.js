'use client';

import { useEffect, useRef, useState } from 'react';

export default function GruendungPage() {

  const initialState = {
    vorname: '',
    nachname: '',
    telefon: '',
    email: '',

    firmenname: '',
    alternativeFirmennamen: '',
    alternativeFirmennamen2: '',
    rechtsform: '',
    unternehmenssitz: '',
    geschaeftsadresseVorhanden: '',
    taetigkeit: '',

    stammkapital: '',

    umsatz1Jahr: '',
    gewinn1Jahr: '',
    kleinunternehmerregelung: '',

    mitarbeiter: '',
    anzahlMitarbeiter: '',
    startBeschaeftigung: '',

    hinweise: '',

    dsgvoAkzeptiert: false,
    vollmachtAkzeptiert: false
  };

  const [form, setForm] = useState(initialState);
  const [gesellschafterCount, setGesellschafterCount] = useState(1);
  const [geschaeftsfuehrerCount, setGeschaeftsfuehrerCount] = useState(1);

  const [weitereUnterlagen, setWeitereUnterlagen] = useState([]);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasSignatureRef = useRef(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startDrawing(e) {
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
  }

  function draw(e) {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    hasSignatureRef.current = true;
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasSignatureRef.current = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!hasSignatureRef.current) {
      alert('Bitte unterschreiben');
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    Array.from(weitereUnterlagen).forEach((file) => {
      formData.append('weitereUnterlagen', file);
    });

    formData.append('unterschrift', canvasRef.current.toDataURL());

    await fetch('/api/new-gruendung', {
      method: 'POST',
      body: formData
    });

    alert('Gesendet');
  }

  return (
    <main className="page-bg">
      <div className="container">
        <div className="card">

          {/* Ansprechpartner */}
          <h3>Ansprechpartner</h3>
          <input placeholder="Vorname" onChange={(e)=>update('vorname', e.target.value)} required />
          <input placeholder="Nachname" onChange={(e)=>update('nachname', e.target.value)} required />

          {/* Rechtsform */}
          <h3>Rechtsform</h3>
          <select onChange={(e)=>update('rechtsform', e.target.value)} required>
            <option value="">Bitte wählen</option>
            <option>Einzelunternehmen</option>
            <option>GmbH</option>
            <option>UG</option>
          </select>

          {/* Firmenname */}
          <h3>Firmenname</h3>
          <input placeholder="Firmenname" onChange={(e)=>update('firmenname', e.target.value)} required />

          {form.rechtsform !== 'Einzelunternehmen' && (
            <>
              <input placeholder="Alternativer Name 1" required onChange={(e)=>update('alternativeFirmennamen', e.target.value)} />
              <input placeholder="Alternativer Name 2" required onChange={(e)=>update('alternativeFirmennamen2', e.target.value)} />
            </>
          )}

          {/* Gesellschafter */}
          {form.rechtsform !== 'Einzelunternehmen' && (
            <>
              <h3>Gesellschafter</h3>

              <select onChange={(e)=>setGesellschafterCount(Number(e.target.value))}>
                {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
              </select>

              {Array.from({ length: gesellschafterCount }).map((_, i)=>(
                <div key={i}>
                  <h4>Gesellschafter {i+1}</h4>
                  <input placeholder="Name" onChange={(e)=>update(`g_${i}_name`, e.target.value)} />
                  <input placeholder="Adresse" onChange={(e)=>update(`g_${i}_adresse`, e.target.value)} />
                  <input placeholder="Steuer-ID" onChange={(e)=>update(`g_${i}_steuer`, e.target.value)} />
                </div>
              ))}
            </>
          )}

          {/* Geschäftsführer */}
          {form.rechtsform !== 'Einzelunternehmen' && (
            <>
              <h3>Geschäftsführer</h3>

              <select onChange={(e)=>setGeschaeftsfuehrerCount(Number(e.target.value))}>
                {[1,2,3].map(n => <option key={n}>{n}</option>)}
              </select>

              {Array.from({ length: geschaeftsfuehrerCount }).map((_, i)=>(
                <div key={i}>
                  <h4>Geschäftsführer {i+1}</h4>
                  <input placeholder="Name" onChange={(e)=>update(`gf_${i}_name`, e.target.value)} />
                  <input placeholder="Adresse" onChange={(e)=>update(`gf_${i}_adresse`, e.target.value)} />
                  <input placeholder="Steuer-ID" onChange={(e)=>update(`gf_${i}_steuer`, e.target.value)} />
                </div>
              ))}
            </>
          )}

          {/* Dokumente */}
          <h3>Unterlagen</h3>
          <p>
            Ausweis, ggf. Meldebescheinigung, weitere Unterlagen nach Bedarf
          </p>
          <input type="file" multiple onChange={(e)=>setWeitereUnterlagen(e.target.files)} />

          {/* Unterschrift */}
          <h3>Unterschrift</h3>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            style={{ border: '1px solid #ccc' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
          />

          <button type="button" onClick={clearSignature}>
            löschen
          </button>

          <button type="submit">
            Absenden
          </button>

        </div>
      </div>
    </main>
  );
}
