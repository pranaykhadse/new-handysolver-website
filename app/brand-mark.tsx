import { fixedImage } from '@/lib/image';

export default function BrandMark({ className = '' }: { className?: string }) {
  return <span className={`hs-brand ${className}`}>
    <span className="hs-brand-image" aria-hidden="true"><img {...fixedImage('/hs-logo.png', 52)} alt="" width="776" height="704" /></span>
    {/* Brand orange, the same as the "h" in the logo mark. */}
    <span className="hs-brand-name"><span style={{ color: '#ff7a21' }}>handy</span>solver</span>
  </span>;
}
