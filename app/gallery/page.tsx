import type { Metadata } from 'next';
import { OG_DEFAULTS } from '@/lib/seo';
import GalleryContent from './gallery-content';

export const metadata: Metadata = {
  title: 'Photo Gallery | Handysolver',
  description: 'A peek at life at Handysolver — birthdays, celebrations, team moments, and the bits between the work.',
  alternates: { canonical: '/gallery' },
  openGraph: { ...OG_DEFAULTS,
    title: 'Photo Gallery | Handysolver',
    description: 'A peek at life at Handysolver — birthdays, celebrations, team moments, and the bits between the work.',
    url: '/gallery',
  },
};

import BreadcrumbsJsonLd from '../breadcrumbs-jsonld';

export default function Gallery() {
  return <><BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }]} /><GalleryContent /></>;
}
