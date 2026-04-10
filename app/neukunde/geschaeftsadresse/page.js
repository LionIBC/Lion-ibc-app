'use client';

import { useEffect, useRef, useState } from 'react';

export default function GeschaeftsadressePage() {
  const initialState = {
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',

    firmenname: '',
    rechtsform: '',
    ort: '',
    hrb: '',
    steuernummer: '',

    startdatum: '',

    dsgvo: false,
    vollmacht: false
  };

  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawing = useRef(false);
  const hasSignature = useRef(false);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = wrapper.offsetWidth;
    const height = 180;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#101828';
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function start(e) {
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    drawing.current = true;
  }

  function draw(e) {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasSignature.current = true;
  }

  function stop() {
    drawing.current = false;
  }

  function clearSignature() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasSignature.current = false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);

    if (!form.dsgvo || !form.vollmacht) {
      setStatus({ type: 'error', message: 'Bitte alle Bestätigungen akzeptieren.' });
      setSending(false);
      return;
    }

    if (!hasSignature.current) {
      setStatus({ type: 'error', message: 'Bitte unterschreiben.' });
      setSending(false);
      return;
    }

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([k, v]) => {
        formData.append(k, v);
      });

      formData.append('unterschrift', canvasRef.current.toDataURL());

      const res = await fetch('/api/geschaeftsadresse', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'Erfolgreich übermittelt.' });
        setForm(initialState);
        clearSignature();
      } else {
        setStatus({ type: 'error', message: 'Fehler beim Senden.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Fehler beim Senden.' });
    }

    setSending(false);
  }

  return (
    <main style={main}>
      <div style={container}>
        <section style={card}>

          <div style={badge}>Geschäftsadresse / Virtuelles Office</div>

          <h1 style={title}>Digitale Aufnahme & Vollmacht</h1>

          <p style={subtitle}>
            Erfassen Sie die relevanten Unternehmensdaten und bestätigen Sie die
            Postempfangsvollmacht digital per Unterschrift.
          </p>

          {status && (
            <div style={status.type === 'error' ? errorBox : successBox}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>

            <h3 style={sectionTitle}>Ansprechpartner</h3>
            <div style={grid}>
              <Input label="Vorname" value={form.vorname} onChange={e => update('vorname', e.target.value)} />
              <Input label="Nachname" value={form.nachname} onChange={e => update('nachname', e.target.value)} />
              <Input label="E-Mail" value={form.email} onChange={e => update('email', e.target.value)} />
              <Input label="Telefon" value={form.telefon} onChange={e => update('telefon', e.target.value)} />
            </div>

            <h3 style={sectionTitle}>Unternehmen</h3>
            <div style={grid}>
              <Input label="Firmenname" value={form.firmenname} onChange={e => update('firmenname', e.target.value)} />
              <Input label="Rechtsform" value={form.rechtsform} onChange={e => update('rechtsform', e.target.value)} />
              <Input label="Ort" value={form.ort} onChange={e => update('ort', e.target.value)} />
              <Input label="HRB Nummer" value={form.hrb} onChange={e => update('hrb', e.target.value)} />
              <Input label="Steuernummer" value={form.steuernummer} onChange={e => update('steuernummer', e.target.value)} />
              <Input label="Startdatum" value={form.startdatum} onChange={e => update('startdatum', e.target.value)} />
            </div>

            <h3 style={sectionTitle}>Postempfangsvollmacht</h3>
            <p style={text}>
              Hiermit bevollmächtige ich Lion IBC, meine geschäftliche Post
              entgegenzunehmen, zu öffnen, zu digitalisieren und weiterzuleiten.
            </p>

            <div ref={wrapperRef} style={signatureBox}>
              <canvas
                ref={canvasRef}
                onMouseDown={start}
                onMouseMove={draw}
                onMouseUp={stop}
                onMouseLeave={stop}
                style={{ width: '100%', height: '180px' }}
              />
            </div>

            <button type="button" onClick={clearSignature} style={secondary}>
              Unterschrift löschen
            </button>

            <div style={{ marginTop: '20px' }}>
              <label>
                <input type="checkbox" checked={form.dsgvo} onChange={e => update('dsgvo', e.target.checked)} />
                Datenschutzerklärung akzeptieren
              </label>
            </div>

            <div>
              <label>
                <input type="checkbox" checked={form.vollmacht} onChange={e => update('vollmacht', e.target.checked)} />
                Vollmacht bestätigen
              </label>
            </div>

            <button style={button}>
              {sending ? 'Senden...' : 'Absenden'}
            </button>

          </form>
        </section>
      </div>
    </main>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label style={label}>{label}</label>
      <input value={value} onChange={onChange} style={input} />
    </div>
  );
}

const main = { minHeight: '100vh', padding: '40px', background: '#f7f5ef' };
const container = { maxWidth: '1100px', margin: '0 auto' };
const card = { background: '#fff', padding: '40px', borderRadius: '24px' };
const badge = { marginBottom: '10px', color: '#8c6b43' };
const title = { fontSize: '32px', fontWeight: '700' };
const subtitle = { color: '#555', marginBottom: '20px' };
const sectionTitle = { marginTop: '30px', marginBottom: '10px' };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };
const input = { padding: '12px', border: '1px solid #ccc', borderRadius: '10px' };
const label = { fontSize: '14px', fontWeight: '600' };
const button = { marginTop: '20px', padding: '14px', background: '#8c6b43', color: '#fff', border: 'none', borderRadius: '10px' };
const secondary = { marginTop: '10px' };
const signatureBox = { border: '1px solid #ccc', marginTop: '10px', borderRadius: '10px' };
const text = { color: '#444' };
const errorBox = { color: 'red' };
const successBox = { color: 'green' };
