export default function FormHeader({ title, description }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      
      {/* LOGO + BRAND */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <img
          src="/logo.png"
          alt="Lion IBC"
          style={{
            height: '70px',
            objectFit: 'contain'
          }}
        />

        <div>
          <div style={{
            fontSize: '22px',
            fontWeight: '800',
            letterSpacing: '1px',
            color: '#101828'
          }}>
            LION INTERNATIONAL
          </div>

          <div style={{
            fontSize: '14px',
            color: '#8c6b43',
            letterSpacing: '2px'
          }}>
            BUSINESS CONSULTING
          </div>
        </div>
      </div>

      {/* LINIE (Premium Look) */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(to right, transparent, #d6d0c4, transparent)',
        marginBottom: '25px'
      }} />

      {/* TITEL */}
      <h1 style={{
        fontSize: '34px',
        marginBottom: '10px',
        color: '#101828'
      }}>
        {title}
      </h1>

      {/* TEXT */}
      <p style={{
        color: '#475467',
        maxWidth: '700px'
      }}>
        {description}
      </p>
    </div>
  );
}
