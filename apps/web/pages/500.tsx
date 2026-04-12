export default function Custom500() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '520px', textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>500</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Something went wrong</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          An unexpected error occurred while loading SRP HRMS.
        </p>
        <a href="/" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none' }}>
          Return home
        </a>
      </div>
    </main>
  );
}
