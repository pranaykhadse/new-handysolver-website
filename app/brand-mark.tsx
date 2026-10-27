import { fixedImage } from '@/lib/image';

export default function BrandMark({ className = '' }: { className?: string }) {
  return <span className={`hs-brand ${className}`}>
    <span className="hs-brand-image" aria-hidden="true"><img {...fixedImage('/hs-logo.png', 52)} alt="" width="776" height="704" /></span>
    {/* A deeper orange than the brand orange, so the word stays readable on the light header. */}
    <span className="hs-brand-name"><span style={{ color: '#b84600' }}>handy</span>solver</span>
  </span>;
}
