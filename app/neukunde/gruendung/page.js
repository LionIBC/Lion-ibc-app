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
    taetigkeit: '',
    stammkapital: '',
    hinweise: '',
    dsgvoAkzeptiert: false,
    vollmachtAkzeptiert: false
  };

  const [form, setForm] = useState(initialState);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const [gesellschafterCount, setGesellschafterCount] = useState(1);
  const [geschaeftsfuehrerCount, setGeschaeftsfuehrerCount] = useState(1);

  const [weitereUnterlagen, setWeitereUnterlagen] = useState([]);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
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

    setSending(true);

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

    setSending(false);
    setStatus('success');
  }

  return (
    <main className="page-bg">
      <div className="container">

        <div className="card">
          <h1 className="hero-title">Unternehmensgründung</h1>

          <form onSubmit={handleSubmit}>

            {/* Ansprechpartner */}
            <h3 className="sectionTitle">Ansprechpartner</h3>
            <div className="grid">
              <input placeholder="Vorname" required onChange={(e) => update('vorname', e.target.value)} />
              <input placeholder="Nachname" required onChange={(e) => update('nachname', e.target.value)} />
              <input placeholder="Telefon" required onChange={(e) => update('telefon', e.target.value)} />
              <input placeholder="E-Mail" required onChange={(e) => update('email', e.target.value)} />
            </div>

            {/* Rechtsform */}
            <h3 className="sectionTitle">Rechtsform</h3>
            <select onChange={(e) => update('rechtsform', e.target.value)} required>
              <option value="">Bitte wählen</option>
              <option>Einzelunternehmen</option>
              <option>GmbH</option>
              <option>UG</option>
              <option>AG</option>
            </select>

            {/* Firmenname */}
            <h3 className="sectionTitle">Firmenname</h3>
            <input placeholder="Firmenname" required onChange={(e) => update('firmenname', e.target.value)} />

            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <input placeholder="Alternativer Name 1" required onChange={(e) => update('alternativeFirmennamen', e.target.value)} />
                <input placeholder="Alternativer Name 2" required onChange={(e) => update('alternativeFirmennamen2', e.target.value)} />
              </>
            )}

            {/* Gesellschafter */}
            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <h3 className="sectionTitle">Gesellschafter</h3>

                <select onChange={(e) => setGesellschafterCount(Number(e.target.value))}>
                  {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                </select>

                {Array.from({ length: gesellschafterCount }).map((_, i) => (
                  <div key={i}>
                    <h4>Gesellschafter {i+1}</h4>
                    <input placeholder="Name" onChange={(e) => update(`g_${i}_name`, e.target.value)} />
                    <input placeholder="Adresse" onChange={(e) => update(`g_${i}_adresse`, e.target.value)} />
                    <input placeholder="Steuer-ID" onChange={(e) => update(`g_${i}_steuer`, e.target.value)} />
                  </div>
                ))}
              </>
            )}

            {/* Geschäftsführer */}
            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <h3 className="sectionTitle">Geschäftsführer</h3>

                <select onChange={(e) => setGeschaeftsfuehrerCount(Number(e.target.value))}>
                  {[1,2,3].map(n => <option key={n}>{n}</option>)}
                </select>

                {Array.from({ length: geschaeftsfuehrerCount }).map((_, i) => (
                  <div key={i}>
                    <h4>Geschäftsführer {i+1}</h4>
                    <input placeholder="Name" onChange={(e) => update(`gf_${i}_name`, e.target.value)} />
                    <input placeholder="Adresse" onChange={(e) => update(`gf_${i}_adresse`, e.target.value)} />
                    <input placeholder="Steuer-ID" onChange={(e) => update(`gf_${i}_steuer`, e.target.value)} />
                  </div>
                ))}
              </>
            )}

            {/* Dokumente */}
            <h3 className="sectionTitle">Unterlagen</h3>
            <p>
              Bitte laden Sie folgende Dokumente hoch:
              <br />- Ausweis
              <br />- ggf. Meldebescheinigung
              <br />- weitere Unterlagen
            </p>

            <input type="file" multiple onChange={(e) => setWeitereUnterlagen(e.target.files)} />

            {/* Unterschrift */}
            <h3 className="sectionTitle">Unterschrift</h3>
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
              {sending ? 'Wird gesendet...' : 'Absenden'}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
