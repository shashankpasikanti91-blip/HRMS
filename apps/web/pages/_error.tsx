import type { NextPageContext } from 'next';

function ErrorPage({ statusCode }: { statusCode?: number }) {
  const code = statusCode || 500;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '520px', textAlign: 'center' }}>
        <p style={{ color: code === 404 ? '#2563eb' : '#dc2626', fontWeight: 600, marginBottom: '8px' }}>{code}</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{code === 404 ? 'Page not found' : 'Unexpected error'}</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          {code === 404 ? 'The page you requested is unavailable.' : 'An unexpected SRP HRMS error occurred.'}
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: '8px', background: '#0f172a', color: '#fff', textDecoration: 'none' }}>
          Go to sign in
        </a>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
