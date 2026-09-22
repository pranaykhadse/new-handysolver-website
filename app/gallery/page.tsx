import type { Metadata } from 'next';
import GalleryContent from './gallery-content';

export const metadata: Metadata = {
  title: 'Photo Gallery | HandySolver',
  description: 'A peek at life at HandySolver - birthdays, celebrations, team moments, and the bits between the work.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Photo Gallery | HandySolver',
    description: 'A peek at life at HandySolver - birthdays, celebrations, team moments, and the bits between the work.',
    url: '/gallery',
  },
};

import BreadcrumbsJsonLd from '../breadcrumbs-jsonld';

export default function Gallery() {
  return <><BreadcrumbsJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }]} /><GalleryContent /></>;
}
