import type { Metadata } from 'next';
import GalleryContent from './gallery-content';

export const metadata: Metadata = {
  title: 'Photo Gallery | HandySolver',
  description: 'A peek at life at HandySolver — birthdays, celebrations, team moments, and the bits between the work.',
};

export default function Gallery() {
  return <GalleryContent />;
}
