'use client';

import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import {
  Plus, Trash2, PencilLine, GripVertical, Save, X,
  AlertTriangle, LogOut, ArrowLeft, Image as ImageIcon,
} from 'lucide-react';
import '../admin.css';
import './gallery-admin.css';

let _onAuthFailure: (() => void) | null = null;

type Photo = { id: string; sort_order: number; src: string; caption: string };

function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)hs_csrf=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function api(path: string, opts?: RequestInit) {
  const isMutation = opts?.method && !['GET', 'HEAD', 'OPTIONS'].includes(opts.method);
  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string> ?? {}),
  };
  if (opts?.body && typeof opts.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  if (isMutation) {
    headers['X-CSRF-Token'] = getCsrfToken();
  }

  let res = await fetch(path, { ...opts, headers, credentials: 'same-origin' });
  let json: any = null;
  try { json = await res.json(); } catch {}

  if (res.status === 401) {
    const refreshed = await tryRefreshCookie();
    if (refreshed) {
      // Refresh rotates the CSRF token too — re-read it before retrying
      if (isMutation) headers['X-CSRF-Token'] = getCsrfToken();
      res = await fetch(path, { ...opts, headers, credentials: 'same-origin' });
      try { json = await res.json(); } catch {}
    } else {
      _onAuthFailure?.();
    }
  }

  return { ok: res.ok, status: res.status, json };
}

async function tryRefreshCookie(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── Drag-and-drop list ─────────────────────────────────────────────── */
function DraggablePhotoList({
  photos,
  onReorder,
  onEdit,
  onDelete,
}: {
  photos: Photo[];
  onReorder: (list: Photo[]) => void;
  onEdit: (p: Photo) => void;
  onDelete: (id: string) => void;
}) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  function onDragStart(i: number) { dragRef.current = i; setDraggingIdx(i); }
  function onDragEnter(i: number) { setOverIdx(i); }
  function onDragEnd() {
    if (dragRef.current !== null && overIdx !== null && dragRef.current !== overIdx) {
      const updated = [...photos];
      const [moved] = updated.splice(dragRef.current, 1);
      updated.splice(overIdx, 0, moved);
      onReorder(updated.map((p, i) => ({ ...p, sort_order: i + 1 })));
    }
    dragRef.current = null; setDraggingIdx(null); setOverIdx(null);
  }

  return (
    <>
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className="adm-row"
          draggable
          data-dragging={draggingIdx === i ? 'true' : 'false'}
          data-drag-over={overIdx === i && draggingIdx !== i ? 'true' : 'false'}
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={onDragEnd}
        >
          <span className="adm-drag-handle" title="Drag to reorder"><GripVertical size={14} /></span>
          <span className="adm-order-badge">{i + 1}</span>
          <div className="ga-row-thumb">
            <img src={photo.src} alt={photo.caption || 'Gallery photo'} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="adm-row-name">{photo.caption || <em style={{ opacity: .5 }}>No caption</em>}</p>
            <p className="adm-row-meta" style={{ wordBreak: 'break-all' }}>{photo.src}</p>
          </div>
          <div className="adm-row-actions">
            <button className="adm-icon-btn" aria-label="Edit" onClick={() => onEdit({ ...photo })}>
              <PencilLine size={14} />
            </button>
            <button className="adm-icon-btn delete" aria-label="Delete" onClick={() => onDelete(photo.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────── */
function Modal({ title, onClose, onSave, saveBusy, children }: {
  title: string; onClose: () => void; onSave: () => void;
  saveBusy: boolean; children: React.ReactNode;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="adm-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal" role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <span className="adm-modal-title">{title}</span>
          <button className="adm-icon-btn" aria-label="Close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
        <div className="adm-modal-footer">
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saveBusy}>
            <Save size={13} />{saveBusy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm dialog ─────────────────────────────────────────────────── */
function ConfirmDialog({ title, body, onConfirm, onCancel }: {
  title: string; body: string; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onCancel]);
  return (
    <div className="adm-confirm-backdrop" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="adm-confirm" role="alertdialog" aria-modal="true">
        <div className="adm-confirm-header">
          <div className="adm-confirm-icon"><AlertTriangle size={18} /></div>
          <p className="adm-confirm-title">{title}</p>
        </div>
        <p className="adm-confirm-body">{body}</p>
        <div className="adm-confirm-actions">
          <button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="adm-btn adm-btn-danger" onClick={onConfirm}><Trash2 size={13} />Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function GalleryAdmin() {
  const [hydrated, setHydrated] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [draft, setDraft] = useState<Partial<Photo> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [previewErr, setPreviewErr] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Confirm delete
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api('/api/admin/gallery').then(res => {
      if (res.ok) setKey('authenticated');
      setHydrated(true);
    }).catch(() => setHydrated(true));
    _onAuthFailure = () => setKey(null);
    return () => { _onAuthFailure = null; };
  }, []);

  async function load() {
    setLoading(true);
    const res = await api('/api/admin/gallery');
    setLoading(false);
    if (res.ok && Array.isArray(res.json?.rows)) {
      const sorted = [...res.json.rows].sort((a: Photo, b: Photo) => a.sort_order - b.sort_order);
      setPhotos(sorted);
    }
    else toast.error(res.json?.error ?? 'Failed to load');
  }

  useEffect(() => { if (key) load(); }, [key]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoggingIn(true); setLoginError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setLoggingIn(false);
      if (res.ok) {
        setKey('authenticated');
        setPassword('');
      } else {
        setLoginError('Wrong password. Please try again.');
      }
    } catch {
      setLoggingIn(false);
      setLoginError('Login failed. Please try again.');
    }
  }

  function openAdd() {
    setIsNew(true);
    setDraft({ src: '', caption: '', sort_order: photos.length + 1 });
    setPreviewErr(false);
  }

  function openEdit(photo: Photo) {
    setIsNew(false);
    setDraft({ ...photo });
    setPreviewErr(false);
  }

  async function save() {
    if (!key || !draft) return;
    if (!draft.src?.trim()) { toast.error('Image URL is required'); return; }
    setSaveBusy(true);
    try {
      const res = isNew
        ? await api('/api/admin/gallery', { method: 'POST', body: JSON.stringify(draft) })
        : await api('/api/admin/gallery', { method: 'PUT', body: JSON.stringify(draft) });
      if (!res.ok) throw new Error(res.json?.error ?? 'Save failed');
      toast.success(isNew ? 'Photo added' : 'Photo updated');
      setDraft(null);
      load();
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setSaveBusy(false); }
  }

  async function deletePhoto(id: string) {
    if (!key) return;
    const res = await api(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Photo removed'); setPhotos(ps => ps.filter(p => p.id !== id)); }
    else toast.error(res.json?.error ?? 'Delete failed');
    setConfirmId(null);
  }

  async function saveOrder(reordered: Photo[]) {
    if (!key) return;
    setPhotos(reordered);
    try {
      const res = await api('/api/admin/gallery/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: reordered }),
      });
      if (res.ok) toast.success('Order saved');
      else toast.error(res.json?.error ?? 'Failed to save order');
    } catch { toast.error('Failed to save order'); }
  }

  /* ── Login screen ─────────────────────────────────────────────────── */
  if (!hydrated) return null;
  if (!key) return (
    <div className="adm-login">
      <Toaster position="top-center" />
      <div className="adm-login-brand">
        <div className="adm-login-brand-inner">
          <div className="adm-login-wordmark"><span className="adm-login-hs">hs</span><span>handy<strong>solver</strong></span></div>
          <div className="adm-login-brand-copy">
            <p className="adm-login-tagline">Gallery<br />Manager</p>
            <p className="adm-login-brand-sub">Add, reorder and remove photos from the HandySolver gallery.</p>
          </div>
        </div>
      </div>
      <div className="adm-login-form-panel">
        <div className="adm-login-form-inner">
          <div className="adm-login-form-top">
            <p className="adm-login-eyebrow">Gallery admin</p>
            <h1 className="adm-login-title">Welcome back</h1>
            <p className="adm-login-sub">Enter your admin password to manage gallery photos.</p>
          </div>
          <form onSubmit={login} className="adm-login-form">
            <div className="adm-login-field">
              <label className="adm-label" htmlFor="adm-pw">Password</label>
              <div className="adm-login-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input id="adm-pw" type="password" className="adm-input adm-login-pw-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoFocus />
              </div>
            </div>
            {loginError && <p className="adm-login-error">{loginError}</p>}
            <button type="button" className="adm-login-forgot" onClick={() => setShowForgot(true)}>Forgot password?</button>
            <button type="submit" className="adm-btn adm-btn-primary adm-login-submit" disabled={loggingIn || !password}>
              {loggingIn ? 'Verifying…' : 'Sign in'}
              {!loggingIn && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </button>
          </form>
          <p className="adm-login-footer">HandySolver · Admin access only</p>
        </div>
      </div>
      {showForgot && (
        <div className="adm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}>
          <div className="adm-modal" role="dialog" aria-modal="true">
            <div className="adm-modal-head">
              <span className="adm-modal-title">Forgot password?</span>
              <button className="adm-icon-btn" aria-label="Close" onClick={() => setShowForgot(false)}><X size={14} /></button>
            </div>
            <div className="adm-modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#b4bfce', margin: '0 0 16px' }}>
                Contact the system administrator to reset your admin password.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="mailto:connect@handysolver.com" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#ffffff08', border: '1px solid #ffffff15', color: '#e2e8f2', textDecoration: 'none', fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  connect@handysolver.com
                </a>
                <a href="https://wa.me/919971815001" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#ffffff08', border: '1px solid #ffffff15', color: '#e2e8f2', textDecoration: 'none', fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +91 9971815001
                </a>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-primary" onClick={() => setShowForgot(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Dashboard ────────────────────────────────────────────────────── */
  return (
    <div className="adm-root">
      <Toaster position="top-center" />

      {/* Modals */}
      {draft && (
        <Modal
          title={isNew ? 'Add photo' : 'Edit photo'}
          onClose={() => setDraft(null)}
          onSave={save}
          saveBusy={saveBusy}
        >
          <div className="adm-field">
            <label className="adm-label">Image URL <span style={{ color: '#ff4d4d', fontSize: 11 }}>*</span></label>
            <input
              className="adm-input"
              type="url"
              value={draft.src ?? ''}
              onChange={e => { setDraft(d => ({ ...d, src: e.target.value })); setPreviewErr(false); }}
              placeholder="https://handysolver.com/assets/images/..."
              autoFocus
            />
            {draft.src && !previewErr && (
              <img
                className="ga-modal-preview"
                src={draft.src}
                alt="preview"
                onError={() => setPreviewErr(true)}
              />
            )}
            {previewErr && <p className="ga-modal-preview-err">Could not load image from this URL</p>}
          </div>
          <div className="adm-field">
            <label className="adm-label">Caption <span style={{ color: '#666', fontSize: 11 }}>(optional)</span></label>
            <input
              className="adm-input"
              type="text"
              value={draft.caption ?? ''}
              onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))}
              placeholder="e.g. Team outing 2025"
            />
          </div>
        </Modal>
      )}

      {confirmId && (
        <ConfirmDialog
          title="Remove photo?"
          body="This photo will be removed from the gallery. This cannot be undone."
          onConfirm={() => deletePhoto(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <a href="/admin" className="ga-back-link"><ArrowLeft size={14} /> Back to admin</a>
            <div className="adm-wordmark">Handy<span>Solver</span><i /></div>
            <p className="adm-header-sub">Manage gallery photos — add, reorder and remove.</p>
          </div>
          <button className="adm-logout" onClick={async () => {
            await fetch('/api/admin/auth/logout', {
              method: 'POST',
              credentials: 'same-origin',
            }).catch(() => {});
            setKey(null);
          }}>
            <LogOut size={13} /> Log out
          </button>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">
              Gallery Photos
              <span className="adm-count-badge">{photos.length}</span>
            </span>
            <button className="adm-add-btn" onClick={openAdd}>
              <Plus size={14} /> Add photo
            </button>
          </div>

          {loading ? (
            <div className="adm-empty"><div className="adm-spinner" /><p>Loading…</p></div>
          ) : photos.length === 0 ? (
            <div className="adm-empty">
              <ImageIcon size={36} strokeWidth={1.2} style={{ opacity: .3 }} />
              <p>No photos yet.</p>
              <p style={{ fontSize: 13, opacity: .5 }}>Click "Add photo" to get started.</p>
            </div>
          ) : (
            <div className="adm-list">
              <DraggablePhotoList
                photos={photos}
                onReorder={saveOrder}
                onEdit={openEdit}
                onDelete={id => setConfirmId(id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
