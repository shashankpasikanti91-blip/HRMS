export default function Custom404() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '520px', textAlign: 'center' }}>
        <p style={{ color: '#2563eb', fontWeight: 600, marginBottom: '8px' }}>404</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Page not found</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          The page you requested is unavailable. Return to SRP HRMS to continue.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none' }}>
          Go to sign in
        </a>
      </div>
    </main>
  );
}
