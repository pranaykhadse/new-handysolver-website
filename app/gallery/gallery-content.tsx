'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { groupByCategory, labelOf, type FolderMeta } from '@/lib/gallery-category';
import { responsiveImage } from '@/lib/image';
import PlayfulHeader from '../playful-header';
import { HomeMotion } from '../playful-interactions';
import '../playful-home.css';
import './gallery.css';

type Photo = { id: string; sort_order: number; src: string; caption: string; category?: string | null };

// Photos imported from a phone or camera keep the file name as their caption ("IMG 9726", "20241225 181941").
// That means nothing to a visitor, so only real, written captions are shown.
const FILE_NAME_LIKE = /^(?:(?:img|dsc|dscn|pxl|mvimg|vid|image|photo|pic|screenshot|importedphoto|whatsapp[\w\s-]*)[\s_.-]*)?[\d\s_.-]*$|\.(?:jpe?g|png|webp|heic|gif)$/i;
const readableCaption = (caption: string) => { const text = (caption ?? '').trim(); return text && !FILE_NAME_LIKE.test(text) ? text : ''; };

const ROTATIONS = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2, 5, -3, 1, -2, 4, -5, 3, -1];

export default function GalleryContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [folders, setFolders] = useState<FolderMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('all');

  useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => { setPhotos(d.photos ?? []); setFolders(d.folders ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByCategory(photos, folders).map(g => ({ key: g.key, photos: g.items }));
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
          <p className="hp-overline">Life at Handysolver</p>
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
                  <button type="button" key={g.key} className="gl-chip" aria-pressed={active === g.key} onClick={() => setActive(g.key)}>{labelOf(g.key, folders)} <small>{g.photos.length}</small></button>
                ))}
              </div>
              {visible.map(group => (
                <section key={group.key} className="gl-group" aria-label={labelOf(group.key, folders)}>
                  <h2 className="gl-group-title">{labelOf(group.key, folders)}<small>{group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}</small></h2>
                  <div className="gl-grid">
                    {group.photos.map((photo, idx) => (
                      <figure key={photo.id} className="gl-photo" style={{ transform: `rotate(${ROTATIONS[idx % ROTATIONS.length]}deg)` }}>
                        <img {...responsiveImage(photo.src, '(max-width: 760px) 50vw, 360px')} alt={readableCaption(photo.caption) || 'Handysolver team moment'} width={360} height={240} loading={idx < 4 ? 'eager' : 'lazy'} decoding="async" />
                        {readableCaption(photo.caption) && <figcaption>{readableCaption(photo.caption)}</figcaption>}
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
          <span>© {new Date().getFullYear()} Handysolver</span>
          <span>Gurugram, India. Good ideas travel.</span>
          <a href="#main">Back to the top ↑</a>
        </div>
      </footer>
    </div>
  );
}
