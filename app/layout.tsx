import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'HandySolver | Ideas into impact',
  description: 'Hands-on business transformation, custom software, and practical AI. Bring people, processes, and technology together with HandySolver.',
  icons: { icon: '/hs-logo.png', shortcut: '/hs-logo.png' },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
