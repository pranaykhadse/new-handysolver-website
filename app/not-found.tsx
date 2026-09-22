import Link from 'next/link';

// Branded 404 (served with HTTP 404 status automatically). Keeps lost
// visitors — and link equity — inside the site instead of bouncing.
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f2e9',
        color: '#090909',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', color: '#ff7a21', fontWeight: 600, margin: '0 0 14px' }}>
          404 — THIS PAGE WANDERED OFF
        </p>
        <h1 style={{ fontSize: 'clamp(38px, 6vw, 62px)', fontWeight: 500, letterSpacing: -2, lineHeight: 1.05, margin: '0 0 16px' }}>
          Lost? <em style={{ fontFamily: 'Georgia, serif', color: '#ff7a21' }}>Let&apos;s fix that.</em>
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: '#62615d', margin: '0 0 28px' }}>
          The page you&apos;re looking for moved, or never existed. Here are some useful places instead.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{ background: '#090909', color: '#fffaf3', padding: '13px 22px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            Home
          </Link>
          <Link
            href="/careers/open-roles"
            style={{ background: 'transparent', color: '#090909', padding: '13px 22px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #d8d4ca' }}
          >
            Open roles
          </Link>
          <Link
            href="/lets-talk"
            style={{ background: '#ff7a21', color: '#090909', padding: '13px 22px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            Let&apos;s talk
          </Link>
        </div>
      </div>
    </div>
  );
}
