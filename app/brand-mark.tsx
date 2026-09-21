export default function BrandMark({ className = '' }: { className?: string }) {
  return <span className={`hs-brand ${className}`}>
    <span className="hs-brand-image" aria-hidden="true"><img src="/hs-logo.png" alt="" width="776" height="704" /></span>
    <span className="hs-brand-name"><span style={{ color: '#ff7a21' }}>handy</span>solver</span>
  </span>;
}
