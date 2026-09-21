'use client';

import { useEffect, useState } from 'react';
import PlayfulHeader from '../playful-header';
import { HomeMotion } from '../playful-interactions';
import '../playful-home.css';
import './gallery.css';

type Photo = { id: string; sort_order: number; src: string; caption: string };

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2, 5, -3, 1, -2, 4, -5, 3, -1];

export default function GalleryContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => setPhotos(d.photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="handy-home gl-page">
      <HomeMotion />
      <a href="#main" className="hp-skip">Skip to content</a>
      <PlayfulHeader />

      <main id="main">
        <div className="hp-wrap gl-hero">
          <p className="hp-overline">Life at HandySolver</p>
          <h1>Real moments.<br /><em>Unscripted.</em></h1>
          <p className="gl-lede">The birthdays, the celebrations, the games of cricket and the slices of cake. The bits between the work that make it worth showing up.</p>
        </div>

        <div className="hp-wrap gl-grid-wrap">
          {loading ? (
            <div className="gl-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="gl-skeleton" style={{ transform: `rotate(${ROTATIONS[i]}deg)` }} />
              ))}
            </div>
          ) : (
            <div className="gl-grid">
              {photos.map((photo, idx) => (
                <figure
                  key={photo.id}
                  className="gl-photo"
                  style={{ transform: `rotate(${ROTATIONS[idx % ROTATIONS.length]}deg)` }}
                >
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    loading={idx < 6 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <figcaption>{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="hp-footer hp-wrap">
        <div className="hp-footer-bottom">
          <span>© {new Date().getFullYear()} HandySolver</span>
          <span>Gurugram, India. Good ideas travel.</span>
          <a href="#main">Back to the top ↑</a>
        </div>
      </footer>
    </div>
  );
}
