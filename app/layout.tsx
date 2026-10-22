import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { CONTACT_EMAIL } from '@/lib/contact';
import './globals.css';

const DESCRIPTION = 'Hands-on business transformation, custom software, and practical AI. Bring people, processes, and technology together with Handysolver.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Handysolver | Ideas into impact',
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Handysolver',
    locale: 'en_IN',
    title: 'Handysolver | Ideas into impact',
    description: DESCRIPTION,
    images: [{ url: '/og-cover.png', width: 1200, height: 630, alt: 'Handysolver — Ideas into impact' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og-cover.png'] },
};

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Handysolver',
  url: SITE_URL,
  logo: `${SITE_URL}/hs-logo.png`,
  description: DESCRIPTION,
  email: CONTACT_EMAIL,
  address: { '@type': 'PostalAddress', addressLocality: 'Gurugram', addressCountry: 'IN' },
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body><link rel="icon" href="/hs-logo.png" />{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }} /></body></html>}
