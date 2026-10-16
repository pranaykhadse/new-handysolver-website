'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import PlayfulHeader from '../playful-header';
import { HomeMotion } from '../playful-interactions';
import '../playful-home.css';
import './gallery.css';

type Photo = { id: string; sort_order: number; src: string; caption: string };

const LABELS: Record<string, string> = { birthday: 'Birthdays', diwali: 'Diwali', sports: 'Sports', farewell: 'Farewells', starbucks: 'Celebrating success', 'rock-n-roll': 'Rock n roll', other: 'More moments' };

function categoryOf(src: string) {
  const m = src.match(//images/([^/]+)/[^/]+$/);
  return m ? m[1].toLowerCase() : 'other';
}

function labelOf(key: string) {
  return LABELS[key] ?? key.replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
}

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2, 5, -3, 1, -2, 4, -5, 3, -1];

export default function GalleryContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('all');

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => setPhotos(d.photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups: { key: string; photos: Photo[] }[] = [];
  photos.forEach(photo => {
    const key = categoryOf(photo.src);
    const group = groups.find(g => g.key === key);
    if (group) group.photos.push(photo); else groups.push({ key, photos: [photo] });
  });
  groups.sort((a, b) => Number(a.key === 'other') - Number(b.key === 'other'));
  const visible = active === 'all' ? groups : groups.filter(g => g.key === active);

  return (
    <div className="handy-home gl-page">
      <HomeMotion />
      <a href="#main" className="hp-skip">Skip to content</a>
      <PlayfulHeader />

      <main id="main">
        <div className="hp-wrap">
          <a className="gl-back" href="/careers"><ArrowLeft size={14}/>Back to careers</a>
        </div>
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
            <>
              <div className="gl-filters" role="group" aria-label="Filter photos by category">
                <button type="button" className="gl-chip" aria-pressed={active === 'all'} onClick={() => setActive('all')}>All <small>{photos.length}</small></button>
                {groups.map(g => (
                  <button type="button" key={g.key} className="gl-chip" aria-pressed={active === g.key} onClick={() => setActive(g.key)}>{labelOf(g.key)} <small>{g.photos.length}</small></button>
                ))}
              </div>
              {visible.map(group => (
                <section key={group.key} className="gl-group" aria-label={labelOf(group.key)}>
                  <h2 className="gl-group-title">{labelOf(group.key)}<small>{group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}</small></h2>
                  <div className="gl-grid">
                    {group.photos.map((photo, idx) => (
                      <figure key={photo.id} className="gl-photo" style={{ transform: `rotate(${ROTATIONS[idx % ROTATIONS.length]}deg)` }}>
                        <img src={photo.src} alt={photo.caption} loading={idx < 4 ? 'eager' : 'lazy'} decoding="async" />
                        <figcaption>{photo.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </main>

      <footer className="hp-footer hp-wrap">
        <div className="hp-footer-top"><p>Real moments. Unscripted, like us.</p><div><a href="/careers">Careers</a><a href="/team">Our people</a><a href="/lets-talk">Contact</a></div></div>
        <div className="hp-footer-bottom">
          <span>© {new Date().getFullYear()} HandySolver</span>
          <span>Gurugram, India. Good ideas travel.</span>
          <a href="#main">Back to the top ↑</a>
        </div>
      </footer>
    </div>
  );
}
