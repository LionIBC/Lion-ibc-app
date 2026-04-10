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

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = wrapper.offsetWidth;
    const height = 180;

    const oldData = canvas.toDataURL();

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#101828';

    if (oldData && hasSignatureRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = oldData;
    }
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function getPosition(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function startDrawing(event) {
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPosition(event);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(event) {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPosition(event);
    ctx.lineTo(pos.x, pos.y);
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

    if (!form.dsgvoAkzeptiert || !form.vollmachtAkzeptiert || !hasSignatureRef.current) {
      alert('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, typeof value === 'boolean' ? String(value) : value);
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
    <main style={{ minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <section style={card}>

          <h1 style={title}>Unternehmensgründung</h1>

          <form onSubmit={handleSubmit}>

            <h3 style={sectionTitle}>Ansprechpartner</h3>
            <div style={grid}>
              <InputField label="Vorname" required onChange={(e)=>update('vorname', e.target.value)} />
              <InputField label="Nachname" required onChange={(e)=>update('nachname', e.target.value)} />
              <InputField label="Telefon" required onChange={(e)=>update('telefon', e.target.value)} />
              <InputField label="E-Mail" required onChange={(e)=>update('email', e.target.value)} />
            </div>

            <h3 style={sectionTitle}>Gründung</h3>

            <select style={input} onChange={(e)=>update('rechtsform', e.target.value)} required>
              <option value="">Rechtsform wählen</option>
              <option>Einzelunternehmen</option>
              <option>GmbH</option>
              <option>UG</option>
              <option>AG</option>
            </select>

            <input style={input} placeholder="Firmenname" required onChange={(e)=>update('firmenname', e.target.value)} />

            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <input style={input} placeholder="Alternativer Name 1" required onChange={(e)=>update('alternativeFirmennamen', e.target.value)} />
                <input style={input} placeholder="Alternativer Name 2" required onChange={(e)=>update('alternativeFirmennamen2', e.target.value)} />
              </>
            )}

            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <h3 style={sectionTitle}>Gesellschafter</h3>

                <select style={input} onChange={(e)=>setGesellschafterCount(Number(e.target.value))}>
                  {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>

                {Array.from({ length: gesellschafterCount }).map((_, i)=>(
                  <div key={i}>
                    <input style={input} placeholder="Name" onChange={(e)=>update(`g_${i}_name`, e.target.value)} />
                    <input style={input} placeholder="Adresse" onChange={(e)=>update(`g_${i}_adresse`, e.target.value)} />
                    <input style={input} placeholder="Steuer-ID" onChange={(e)=>update(`g_${i}_steuer`, e.target.value)} />
                  </div>
                ))}
              </>
            )}

            {form.rechtsform !== 'Einzelunternehmen' && (
              <>
                <h3 style={sectionTitle}>Geschäftsführer</h3>

                <select style={input} onChange={(e)=>setGeschaeftsfuehrerCount(Number(e.target.value))}>
                  {[1,2,3].map(n => <option key={n}>{n}</option>)}
                </select>

                {Array.from({ length: geschaeftsfuehrerCount }).map((_, i)=>(
                  <div key={i}>
                    <input style={input} placeholder="Name" onChange={(e)=>update(`gf_${i}_name`, e.target.value)} />
                    <input style={input} placeholder="Adresse" onChange={(e)=>update(`gf_${i}_adresse`, e.target.value)} />
                    <input style={input} placeholder="Steuer-ID" onChange={(e)=>update(`gf_${i}_steuer`, e.target.value)} />
                  </div>
                ))}
              </>
            )}

            <h3 style={sectionTitle}>Unterlagen</h3>
            <p>Ausweis, ggf. Meldebescheinigung, weitere Unterlagen</p>
            <input type="file" multiple onChange={(e)=>setWeitereUnterlagen(e.target.files)} />

            <h3 style={sectionTitle}>Unterschrift</h3>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              style={{ border:'1px solid #ccc' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
            />

            <button type="button" onClick={clearSignature}>löschen</button>

            <button type="submit" style={button}>
              {sending ? 'Wird gesendet...' : 'Absenden'}
            </button>

          </form>

        </section>
      </div>
    </main>
  );
}
