export default function LoginPage() {
  return (
    <main style={wrapper}>
      <div style={card}>
        <h1 style={title}>Login (im Aufbau)</h1>

        <div style={field}>
          <label style={labelStyle}>E-Mail</label>
          <input type="email" style={inputStyle} disabled />
        </div>

        <div style={field}>
          <label style={labelStyle}>Passwort</label>
          <input type="password" style={inputStyle} disabled />
        </div>

        <button style={buttonStyle} disabled>
          Login folgt
        </button>
      </div>
    </main>
  );
}

/* ===== STYLES ===== */

const wrapper = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#f5f5f5'
};

const card = {
  width: '100%',
  maxWidth: '400px',
  background: '#fff',
  padding: '30px',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};

const title = {
  fontSize: '22px',
  fontWeight: '600',
  marginBottom: '20px'
};

const field = {
  marginBottom: '15px',
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle = {
  fontSize: '14px',
  marginBottom: '5px'
};

const inputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc'
};

const buttonStyle = {
  marginTop: '15px',
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  background: '#000',
  color: '#fff',
  opacity: 0.6
};
