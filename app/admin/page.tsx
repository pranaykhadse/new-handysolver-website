'use client';

import './admin.css';
import './gallery/gallery-admin.css';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Plus, Trash2, PencilLine, LogOut, Save, X, GripVertical, Check, AlertTriangle,
  BellRing, Boxes, ShoppingBag, Building2, HardHat, Factory, FolderOpen, FolderInput, FolderPlus, Download, Eye, EyeOff, ChevronRight, ChevronLeft, Maximize2, Upload,
  HeartPulse, BriefcaseBusiness, Hotel, Users, Image as ImageIcon, ChevronDown, ChevronUp, CodeXml, Search as SearchIcon,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { categoryOf, groupByCategory, labelOf, slugifyFolder, type FolderMeta } from '@/lib/gallery-category';
import FormBuilder from './form-builder';
import { ALLOWED_IMAGE_LABEL, IMAGE_ACCEPT, checkImageFile } from '@/lib/upload-types';

let _onAuthFailure: (() => void) | null = null;

const ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  'bell-ring': BellRing, 'boxes': Boxes, 'shopping-bag': ShoppingBag,
  'building-2': Building2, 'hard-hat': HardHat, 'factory': Factory,
  'heart-pulse': HeartPulse, 'briefcase-business': BriefcaseBusiness,
  'hotel': Hotel, 'users': Users,
  'code': CodeXml, 'image': ImageIcon, 'search': SearchIcon,
};
const CASE_ICONS = ['bell-ring', 'boxes', 'shopping-bag', 'building-2', 'hard-hat', 'factory', 'heart-pulse', 'briefcase-business', 'hotel', 'users'];
const JOB_ICONS = ['code', 'image', 'search', 'briefcase-business', 'users', ...CASE_ICONS.filter(i => i !== 'briefcase-business' && i !== 'users')];

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];

function OptionPicker({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="adm-input"
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
        onClick={() => setOpen(o => !o)}
      >
        {value
          ? <span style={{ color: '#e2e8f2', flex: 1 }}>{value}</span>
          : <span style={{ color: '#3d4d5e', flex: 1 }}>{placeholder ?? 'Select'}</span>
        }
        <span style={{ color: '#7d8da2', fontSize: 10, flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999, background: '#111926', border: '1px solid #ffffff20', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 20px 50px #000a' }}>
          {options.map(opt => {
            const active = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 7, background: active ? '#ff976418' : 'transparent', border: active ? '1px solid #ff976450' : '1px solid transparent', color: active ? '#ff9764' : '#b4bfce', cursor: 'pointer', fontSize: 13, fontFamily: 'Arial,sans-serif', transition: 'background 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#ffffff08'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ flex: 1 }}>{opt}</span>
                {active && <Check size={13} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconPicker({ value, onChange, icons = CASE_ICONS }: { value: string; onChange: (v: string) => void; icons?: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  const SelectedIcon = value ? ICON_MAP[value] : null;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="adm-input adm-icon-trigger" onClick={() => setOpen(o => !o)}>
        {SelectedIcon
          ? <><span className="adm-icon-chip"><SelectedIcon size={14} /></span><span className="adm-icon-trigger-label">{value}</span></>
          : <span className="adm-icon-trigger-placeholder">Select Icon</span>
        }
        <span className="adm-icon-trigger-arrow">▾</span>
      </button>
      {open && (
        <div className="adm-icon-dropdown">
          {icons.map(icon => {
            const Icon = ICON_MAP[icon];
            const active = value === icon;
            return (
              <button key={icon} type="button" className={`adm-icon-option${active ? ' adm-icon-option--active' : ''}`}
                onClick={() => { onChange(icon); setOpen(false); }}>
                <span className="adm-icon-option-chip"><Icon size={14} /></span>
                <span className="adm-icon-option-label">{icon}</span>
                {active && <Check size={12} className="adm-icon-option-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Tab = 'case-studies' | 'testimonials' | 'team' | 'jobs' | 'applications' | 'gallery' | 'apply-form';
type Photo = { id: string; sort_order: number; src: string; caption: string; category?: string | null; is_active?: boolean };
type Row = Record<string, unknown>;

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)hs_csrf=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function api(route: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: any }> {
  const isMutation = init?.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method);
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  // Set Content-Type only for JSON bodies
  if (init?.body && typeof init.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  if (isMutation) {
    headers['X-CSRF-Token'] = getCsrfToken();
  }

  let res = await fetch(route, { ...init, headers, credentials: 'same-origin' });
  let json: any = null;
  try { json = await res.json(); } catch {}

  // On 401: session expired — try refresh once, then show login
  if (res.status === 401) {
    const refreshed = await tryRefreshCookie();
    if (refreshed) {
      // Refresh rotates the CSRF token too — re-read it before retrying
      if (isMutation) headers['X-CSRF-Token'] = getCsrfToken();
      res = await fetch(route, { ...init, headers, credentials: 'same-origin' });
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      {children}
    </div>
  );
}

function Field2({ children }: { children: React.ReactNode }) {
  return <div className="adm-field-2">{children}</div>;
}

function FieldToggle({ label, flagKey, flags, onToggle, children }: {
  label: string; flagKey: string; flags: Record<string, boolean>;
  onToggle: (key: string, val: boolean) => void; children: React.ReactNode;
}) {
  const visible = flags[flagKey] !== false;
  return (
    <div className="adm-field">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="adm-label" style={{ marginBottom: 0 }}>{label}</label>
        <label className="adm-toggle" title={visible ? 'Visible on the careers page — click to hide' : 'Hidden from the careers page — click to show'}>
          <input type="checkbox" checked={visible} onChange={(e) => onToggle(flagKey, e.target.checked)} />
          <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
          <span className="adm-toggle-label" style={{ minWidth: 36, fontSize: 10 }}>{visible ? 'Show' : 'Hide'}</span>
        </label>
      </div>
      <div style={{ opacity: visible ? 1 : 0.35, transition: 'opacity 0.2s' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Drag-and-drop list ── */
function DraggableList({
  rows,
  onReorder,
  onEdit,
  onDelete,
  onToggleActive,
  showIcon,
  metaField,
}: {
  rows: Row[];
  onReorder: (reordered: Row[]) => void;
  onEdit: (row: Row) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  showIcon?: boolean;
  metaField?: string;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragItem.current = index;
    setDraggingIndex(index);
  }

  function handleDragEnter(index: number) {
    setOverIndex(index);
  }

  function handleDragEnd() {
    if (dragItem.current !== null && overIndex !== null && dragItem.current !== overIndex) {
      const updated = [...rows];
      const [moved] = updated.splice(dragItem.current, 1);
      updated.splice(overIndex, 0, moved);
      const reordered = updated.map((r, i) => ({ ...r, sort_order: i + 1 }));
      onReorder(reordered);
    }
    dragItem.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }

  return (
    <>
      {rows.map((row, index) => (
        <div
          key={String(row.id)}
          className="adm-row"
          draggable
          data-dragging={draggingIndex === index ? 'true' : 'false'}
          data-drag-over={overIndex === index && draggingIndex !== index ? 'true' : 'false'}
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnd={handleDragEnd}
        >
          <span className="adm-drag-handle" title="Drag to reorder">
            <GripVertical size={14} />
          </span>
          <span className="adm-order-badge">{index + 1}</span>
          {showIcon && (() => { const Icon = row.icon ? ICON_MAP[String(row.icon)] : null; return Icon ? <span className="adm-row-icon"><Icon size={14} /></span> : null; })()}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="adm-row-name">{String(row.title ?? row.name ?? row.id)}</p>
            <p className="adm-row-meta">
              {metaField ? (row[metaField] ? String(row[metaField]) : '') : String(row.id)}
              {row.job_type ? ' · ' + String(row.job_type) : ''}
            </p>
          </div>
          {onToggleActive && (
            <label className="adm-toggle" title={row.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
              <input
                type="checkbox"
                checked={Boolean(row.is_active)}
                onChange={(e) => onToggleActive(String(row.id), e.target.checked)}
              />
              <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
              <span className="adm-toggle-label">{row.is_active ? 'Active' : 'Inactive'}</span>
            </label>
          )}
          <div className="adm-row-actions">
            <button className="adm-icon-btn" aria-label="Edit" onClick={() => onEdit({ ...row })}>
              <PencilLine size={14} />
            </button>
            <button className="adm-icon-btn delete" aria-label="Delete" onClick={() => onDelete(String(row.id))}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Gallery upload helpers ── */
async function shrinkImage(input: File): Promise<File> {
  let file = input;
  if (/^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    const { default: heic2any } = await import('heic2any');
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const blob = Array.isArray(out) ? out[0] : out;
    file = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  }
  const canResize = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!canResize || file.size < 2.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}

async function uploadGalleryFile(file: File, folder: string, bucket = 'gallery'): Promise<string> {
  const form = new FormData();
  form.append('file', await shrinkImage(file));
  form.append('bucket', bucket);
  form.append('folder', folder);
  const res = await fetch('/api/admin/upload', {
    method: 'POST', body: form, credentials: 'same-origin',
    headers: { 'X-CSRF-Token': getCsrfToken() },
  });
  let json: any = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || !json?.url) {
    throw new Error(json?.error ?? (res.status === 413 ? 'File is too large' : `Upload failed (${res.status})`));
  }
  return json.url as string;
}

/* ── Photo lightbox (click to maximize, arrows to browse) ── */
function PhotoLightbox({ items, index, onClose, onNav }: { items: Photo[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  const photo = items[index];
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNav((index - 1 + items.length) % items.length);
      else if (e.key === 'ArrowRight') onNav((index + 1) % items.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onNav]);
  if (!photo) return null;
  return (
    <div className="ga-lightbox" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={onClose}>
      <button type="button" className="ga-lb-btn ga-lb-close" aria-label="Close" onClick={onClose}><X size={20} /></button>
      {items.length > 1 && <button type="button" className="ga-lb-btn ga-lb-prev" aria-label="Previous photo" onClick={e => { e.stopPropagation(); onNav((index - 1 + items.length) % items.length); }}><ChevronLeft size={26} /></button>}
      <figure className="ga-lb-figure" onClick={e => e.stopPropagation()}>
        <img src={photo.src} alt={photo.caption || 'Gallery photo'} />
        <figcaption>{photo.caption || 'No caption'} <small>{index + 1} / {items.length}</small></figcaption>
      </figure>
      {items.length > 1 && <button type="button" className="ga-lb-btn ga-lb-next" aria-label="Next photo" onClick={e => { e.stopPropagation(); onNav((index + 1) % items.length); }}><ChevronRight size={26} /></button>}
    </div>
  );
}

/* ── One-time database setup notice for gallery folders ── */
const GALLERY_SETUP_SQL = `alter table public.gallery_photos add column if not exists category text;
alter table public.gallery_photos add column if not exists is_active boolean not null default true;

create table if not exists public.gallery_folders (
  slug text primary key,
  label text not null,
  created_at timestamptz not null default now()
);
alter table public.gallery_folders add column if not exists sort_order integer not null default 0;
alter table public.gallery_folders enable row level security;

drop policy if exists "Public read access" on public.gallery_folders;
create policy "Public read access" on public.gallery_folders for select to anon using (true);
drop policy if exists "Public insert access" on public.gallery_folders;
create policy "Public insert access" on public.gallery_folders for insert to anon with check (true);
drop policy if exists "Public update access" on public.gallery_folders;
create policy "Public update access" on public.gallery_folders for update to anon using (true) with check (true);
drop policy if exists "Public delete access" on public.gallery_folders;
create policy "Public delete access" on public.gallery_folders for delete to anon using (true);`;

function GallerySetupNotice({ onRecheck }: { onRecheck: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(GALLERY_SETUP_SQL); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { toast.error('Could not copy. Select the text and copy it manually.'); }
  }
  return (
    <div className="ga-setup" role="status">
      <div className="ga-setup-head">
        <AlertTriangle size={16} />
        <strong>One-time database update needed for folders, folder order and hiding photos</strong>
      </div>
      <ol>
        <li>Open your Supabase project, then <b>SQL Editor</b> in the left menu, then <b>New query</b>.</li>
        <li>Paste the SQL below and click <b>Run</b>. It only adds things, so nothing existing is changed or deleted.</li>
        <li>Come back here and click <b>I ran it, check again</b>.</li>
      </ol>
      <pre className="ga-setup-sql">{GALLERY_SETUP_SQL}</pre>
      <div className="ga-setup-actions">
        <button type="button" className="adm-btn adm-btn-outline" onClick={copy}>{copied ? 'Copied' : 'Copy SQL'}</button>
        <button type="button" className="adm-btn adm-btn-primary" onClick={onRecheck}>I ran it, check again</button>
      </div>
      <p className="ga-setup-note">It is safe to run more than once. Importing from your computer, reordering photos and the lightbox work without this step.</p>
    </div>
  );
}

/* ── Gallery folders: parent folder -> category folders -> photos ── */
function DraggablePhotoList({
  photos, folders, onReorder, onEdit, onDelete, openKey, onOpenKey, onMove, onCreateFolder, onDeleteFolder, onImportFiles, onImportLinks, importing, onReorderFolders, onRenameFolder, onSetActive,
}: {
  onReorderFolders: (keys: string[]) => Promise<void>;
  onRenameFolder: (slug: string, label: string) => Promise<boolean>;
  onSetActive: (ids: string[], active: boolean) => Promise<void>;
  photos: Photo[]; folders: FolderMeta[];
  onReorder: (list: Photo[]) => void; onEdit: (p: Photo) => void; onDelete: (id: string) => void;
  openKey: string | null; onOpenKey: (k: string | null) => void;
  onMove: (ids: string[], target: string) => Promise<void>;
  onCreateFolder: (label: string) => Promise<string | null>;
  onDeleteFolder: (slug: string) => void;
  onImportFiles: (files: ArrayLike<File>) => Promise<void>;
  onImportLinks: (urls: string[]) => Promise<void>;
  importing: string | null;
}) {
  const setOpenKey = onOpenKey;
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<'computer' | 'folders' | 'link'>('computer');
  const [importLinks, setImportLinks] = useState('');
  const [importFrom, setImportFrom] = useState<string>('');
  const [importSel, setImportSel] = useState<string[]>([]);
  const [importBusy, setImportBusy] = useState(false);
  const [dropping, setDropping] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [lightIdx, setLightIdx] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [moveIds, setMoveIds] = useState<string[] | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [dialogBusy, setDialogBusy] = useState(false);
  const groups = groupByCategory(photos, folders, true);
  const open = groups.find(g => g.key === openKey) ?? null;
  const NEW = '__new__';
  const [folderDragKey, setFolderDragKey] = useState<string | null>(null);
  const [folderOverKey, setFolderOverKey] = useState<string | null>(null);
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  function moveFolder(key: string, delta: number) {
    const keys = groups.map(g => g.key);
    const from = keys.indexOf(key);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= keys.length) return;
    keys.splice(to, 0, keys.splice(from, 1)[0]);
    onReorderFolders(keys);
  }

  function onFolderDragEnd() {
    if (folderDragKey && folderOverKey && folderDragKey !== folderOverKey) {
      const keys = groups.map(g => g.key);
      const from = keys.indexOf(folderDragKey);
      const to = keys.indexOf(folderOverKey);
      if (from >= 0 && to >= 0) { keys.splice(to, 0, keys.splice(from, 1)[0]); onReorderFolders(keys); }
    }
    setFolderDragKey(null); setFolderOverKey(null);
  }

  function openRename(key: string) { setRenameKey(key); setRenameName(labelOf(key, folders)); }

  async function confirmRename() {
    if (!renameKey) return;
    setDialogBusy(true);
    const ok = await onRenameFolder(renameKey, renameName);
    setDialogBusy(false);
    if (ok) setRenameKey(null);
  }

  useEffect(() => { setSelected([]); setImportOpen(false); }, [openKey]);

  const importSources = groups.filter(g => g.key !== open?.key && g.items.length > 0);
  const importSource = importSources.find(g => g.key === importFrom) ?? importSources[0] ?? null;

  function openImport() {
    setImportTab('computer');
    setImportFrom(importSources[0]?.key ?? '');
    setImportSel([]);
    setImportOpen(true);
  }

  async function importFromComputer(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    setImportBusy(true);
    await onImportFiles(files);
    setImportBusy(false);
    if (importFileRef.current) importFileRef.current.value = '';
    setImportOpen(false);
  }

  async function importFromLinks() {
    const urls = importLinks.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setImportBusy(true);
    await onImportLinks(urls);
    setImportBusy(false);
    setImportLinks('');
    setImportOpen(false);
  }

  async function importFromFolder() {
    if (!open || importSel.length === 0) return;
    setImportBusy(true);
    await onMove(importSel, open.key);
    setImportBusy(false);
    setImportOpen(false);
  }

  function toggle(id: string) { setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); }

  function openMove(ids: string[]) {
    setMoveIds(ids);
    setMoveTarget(groups.find(g => g.key !== open?.key)?.key ?? NEW);
    setNewName('');
  }

  async function confirmMove() {
    if (!moveIds) return;
    setDialogBusy(true);
    let target = moveTarget;
    if (target === NEW) {
      const slug = await onCreateFolder(newName);
      if (!slug) { setDialogBusy(false); return; }
      target = slug;
    }
    await onMove(moveIds, target);
    setDialogBusy(false);
    setMoveIds(null);
    setSelected([]);
  }

  async function confirmNewFolder() {
    setDialogBusy(true);
    const slug = await onCreateFolder(newName);
    setDialogBusy(false);
    if (slug) { setNewFolderOpen(false); setNewName(''); setOpenKey(slug); }
  }

  function onDragEnd() {
    if (open && dragId && overId && dragId !== overId) {
      const slots = photos.map((p, i) => (categoryOf(p.src, p.category) === open.key ? i : -1)).filter(i => i >= 0);
      const inGroup = slots.map(i => photos[i]);
      const [moved] = inGroup.splice(inGroup.findIndex(p => p.id === dragId), 1);
      inGroup.splice(inGroup.findIndex(p => p.id === overId), 0, moved);
      const next = [...photos];
      slots.forEach((slot, n) => { next[slot] = inGroup[n]; });
      onReorder(next.map((p, i) => ({ ...p, sort_order: i + 1 })));
    }
    setDragId(null); setOverId(null);
  }

  return (
    <div className="ga-folders">
      <nav className="ga-crumbs" aria-label="Gallery folders">
        <button type="button" className="ga-crumb" onClick={() => setOpenKey(null)} data-current={open ? 'false' : 'true'}>
          <FolderOpen size={15} /> Gallery <small>{photos.length}</small>
        </button>
        {open && (<><ChevronRight size={14} className="ga-crumb-sep" /><span className="ga-crumb" data-current="true">{labelOf(open.key, folders)} <small>{open.items.length}</small></span>
          <button type="button" className="adm-icon-btn" aria-label="Rename this folder" title="Rename folder" onClick={() => openRename(open.key)}><PencilLine size={14} /></button></>)}
        {open && (
          <button type="button" className="ga-import-btn" onClick={openImport} disabled={importing !== null}>
            <Download size={14} /> {importing ?? 'Import photos'}
          </button>
        )}
      </nav>

      {open && selected.length > 0 && (
        <div className="ga-selbar" role="toolbar" aria-label="Selected photos">
          <strong>{selected.length} selected</strong>
          <button type="button" className="ga-selbtn" onClick={() => setSelected(open.items.map(p => p.id))}>Select all</button>
          <button type="button" className="ga-selbtn ga-selbtn-primary" onClick={() => openMove(selected)}><FolderInput size={14} /> Move to folder</button>
          <button type="button" className="ga-selbtn" onClick={() => { onSetActive(selected, false); setSelected([]); }}><EyeOff size={14} /> Hide on website</button>
          <button type="button" className="ga-selbtn" onClick={() => { onSetActive(selected, true); setSelected([]); }}><Eye size={14} /> Show on website</button>
          <button type="button" className="ga-selbtn" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {!open ? (
        <div className="ga-folder-grid">
          {groups.map((group, gi) => {
            const custom = group.items.length === 0 && folders.some(f => f.slug === group.key);
            const hidden = group.items.filter(p => p.is_active === false).length;
            const name = labelOf(group.key, folders);
            return (
              <div key={group.key} className="ga-folder-wrap" draggable
                data-dragging={folderDragKey === group.key ? 'true' : 'false'}
                data-drag-over={folderOverKey === group.key && folderDragKey !== group.key ? 'true' : 'false'}
                onDragStart={() => setFolderDragKey(group.key)}
                onDragEnter={() => { if (folderDragKey) setFolderOverKey(group.key); }}
                onDragOver={e => e.preventDefault()} onDragEnd={onFolderDragEnd}
              >
                <button type="button" className="ga-folder" onClick={() => setOpenKey(group.key)}>
                  <span className="ga-folder-tab" aria-hidden="true" />
                  <span className="ga-folder-body">
                    <span className="ga-folder-thumbs" aria-hidden="true">
                      {group.items.slice(0, 3).map(p => <img key={p.id} src={p.src} alt="" loading="lazy" draggable={false} />)}
                      {group.items.length === 0 && <span className="ga-folder-empty">Empty folder</span>}
                    </span>
                    <span className="ga-folder-name">{name}</span>
                    <span className="ga-folder-count">{group.items.length} {group.items.length === 1 ? 'photo' : 'photos'}{hidden > 0 ? ` · ${hidden} hidden` : ''}</span>
                  </span>
                </button>
                <div className="ga-folder-tools">
                  <button type="button" className="adm-icon-btn" aria-label={`Move ${name} earlier`} title="Move earlier" disabled={gi === 0} onClick={() => moveFolder(group.key, -1)}><ChevronLeft size={14} /></button>
                  <button type="button" className="adm-icon-btn" aria-label={`Move ${name} later`} title="Move later" disabled={gi === groups.length - 1} onClick={() => moveFolder(group.key, 1)}><ChevronRight size={14} /></button>
                  <button type="button" className="adm-icon-btn" aria-label={`Rename folder ${name}`} title="Rename folder" onClick={() => openRename(group.key)}><PencilLine size={14} /></button>
                  {custom && <button type="button" className="adm-icon-btn delete" aria-label={`Delete folder ${name}`} title="Delete empty folder" onClick={() => onDeleteFolder(group.key)}><Trash2 size={14} /></button>}
                </div>
              </div>
            );
          })}
          <div className="ga-folder-wrap">
            <button type="button" className="ga-folder ga-folder-new" onClick={() => { setNewName(''); setNewFolderOpen(true); }}>
              <span className="ga-folder-body"><FolderPlus size={26} /><span className="ga-folder-name">New folder</span></span>
            </button>
          </div>
        </div>
      ) : open.items.length === 0 ? (
        <p className="adm-empty">This folder is empty. Click Import photos to add some.</p>
      ) : (
        <div className="ga-photo-grid">
          {open.items.map((photo, i) => (
            <figure key={photo.id} className="ga-tile" draggable
              data-dragging={dragId === photo.id ? 'true' : 'false'}
              data-drag-over={overId === photo.id && dragId !== photo.id ? 'true' : 'false'}
              data-selected={selected.includes(photo.id) ? 'true' : 'false'}
              data-inactive={photo.is_active === false ? 'true' : 'false'}
              onDragStart={() => setDragId(photo.id)}
              onDragEnter={() => { if (dragId) setOverId(photo.id); }}
              onDragOver={e => e.preventDefault()} onDragEnd={onDragEnd}
            >
              <img src={photo.src} alt={photo.caption || 'Gallery photo'} loading="lazy" draggable={false} onClick={() => setLightIdx(i)} style={{ cursor: 'zoom-in' }} />
              <label className="ga-tile-check" title="Select photo">
                <input type="checkbox" checked={selected.includes(photo.id)} onChange={() => toggle(photo.id)} aria-label={`Select ${photo.caption || 'photo'}`} />
              </label>
              {photo.is_active === false && <span className="ga-tile-badge">Hidden</span>}
              <figcaption>{photo.caption || <em>No caption</em>}</figcaption>
              <div className="ga-tile-actions">
                <button className="adm-icon-btn" aria-label={photo.is_active === false ? 'Show on website' : 'Hide from website'} title={photo.is_active === false ? 'Inactive: click to show on the website' : 'Active: click to hide from the website'} onClick={() => onSetActive([photo.id], photo.is_active === false)}>{photo.is_active === false ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button className="adm-icon-btn" aria-label="Move to another folder" title="Move to another folder" onClick={() => openMove([photo.id])}><FolderInput size={14} /></button>
                <button className="adm-icon-btn" aria-label="Maximize" onClick={() => setLightIdx(i)}><Maximize2 size={14} /></button>
                <button className="adm-icon-btn" aria-label="Edit" onClick={() => onEdit({ ...photo })}><PencilLine size={14} /></button>
                <button className="adm-icon-btn delete" aria-label="Delete" onClick={() => onDelete(photo.id)}><Trash2 size={14} /></button>
              </div>
            </figure>
          ))}
        </div>
      )}
      {open && lightIdx !== null && (
        <PhotoLightbox items={open.items} index={Math.min(lightIdx, open.items.length - 1)} onClose={() => setLightIdx(null)} onNav={setLightIdx} />
      )}

      {moveIds && (
        <div className="ga-dialog-backdrop" onClick={() => !dialogBusy && setMoveIds(null)}>
          <div className="ga-dialog" role="dialog" aria-modal="true" aria-label="Move photos" onClick={e => e.stopPropagation()}>
            <h3>Move {moveIds.length} {moveIds.length === 1 ? 'photo' : 'photos'} to</h3>
            <div className="ga-dialog-list">
              {groups.filter(g => g.key !== open?.key).map(g => (
                <label key={g.key} className="ga-dialog-opt">
                  <input type="radio" name="move-target" checked={moveTarget === g.key} onChange={() => setMoveTarget(g.key)} />
                  <span>{labelOf(g.key, folders)}</span><small>{g.items.length}</small>
                </label>
              ))}
              <label className="ga-dialog-opt">
                <input type="radio" name="move-target" checked={moveTarget === NEW} onChange={() => setMoveTarget(NEW)} />
                <span><FolderPlus size={14} /> New folder</span>
              </label>
              {moveTarget === NEW && (
                <input className="adm-input" autoFocus value={newName} maxLength={60} placeholder="Folder name, e.g. Team outing 2026" onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmMove(); }} />
              )}
            </div>
            <div className="ga-dialog-actions">
              <button type="button" className="adm-btn adm-btn-outline" disabled={dialogBusy} onClick={() => setMoveIds(null)}>Cancel</button>
              <button type="button" className="adm-btn adm-btn-primary" disabled={dialogBusy || (moveTarget === NEW && !newName.trim())} onClick={confirmMove}>{dialogBusy ? 'Moving...' : 'Move'}</button>
            </div>
          </div>
        </div>
      )}

      {importOpen && open && (
        <div className="ga-dialog-backdrop" onClick={() => !importBusy && setImportOpen(false)}>
          <div className="ga-dialog ga-dialog-wide" role="dialog" aria-modal="true" aria-label="Import photos" onClick={e => e.stopPropagation()}>
            <h3>Import photos into &ldquo;{labelOf(open.key, folders)}&rdquo;</h3>
            <div className="ga-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={importTab === 'computer'} className="ga-tab" onClick={() => setImportTab('computer')}>From your computer</button>
              <button type="button" role="tab" aria-selected={importTab === 'folders'} className="ga-tab" onClick={() => setImportTab('folders')}>From other folders</button>
              <button type="button" role="tab" aria-selected={importTab === 'link'} className="ga-tab" onClick={() => setImportTab('link')}>From a link</button>
            </div>

            {importTab === 'computer' ? (
              <>
                <input ref={importFileRef} type="file" accept={IMAGE_ACCEPT} multiple style={{ display: 'none' }} onChange={e => importFromComputer(e.target.files)} />
                <div
                  className="ga-dropzone" data-active={dropping ? 'true' : 'false'} role="button" tabIndex={0}
                  onClick={() => !importBusy && importFileRef.current?.click()}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !importBusy) { e.preventDefault(); importFileRef.current?.click(); } }}
                  onDragOver={e => { e.preventDefault(); setDropping(true); }}
                  onDragLeave={() => setDropping(false)}
                  onDrop={e => { e.preventDefault(); setDropping(false); if (!importBusy) importFromComputer(e.dataTransfer.files); }}
                >
                  <Upload size={26} />
                  <strong>{importing ?? 'Drop photos here, or click to choose'}</strong>
                  <span>You can select many photos at once.</span>
                </div>
                <p className="ga-upload-hint">Allowed image types: {ALLOWED_IMAGE_LABEL}. Other file types are rejected.</p>
              </>
            ) : importTab === 'link' ? (
              <>
                <label className="ga-import-from" style={{ display: 'block' }}>
                  <span style={{ display: 'block', marginBottom: 8 }}>Paste one image link per line</span>
                  <textarea className="adm-input" rows={6} value={importLinks} onChange={e => setImportLinks(e.target.value)} placeholder={'https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg'} style={{ width: '100%', resize: 'vertical' }} />
                </label>
                <p className="ga-upload-hint">The photos stay hosted at those links; they are not copied to your storage. Only http and https links are accepted.</p>
              </>
            ) : importSources.length === 0 ? (
              <p className="adm-empty">There are no photos in other folders to import.</p>
            ) : (
              <>
                <label className="ga-import-from">
                  <span>Import from</span>
                  <select className="adm-input" value={importSource?.key ?? ''} onChange={e => { setImportFrom(e.target.value); setImportSel([]); }}>
                    {importSources.map(g => <option key={g.key} value={g.key}>{labelOf(g.key, folders)} ({g.items.length})</option>)}
                  </select>
                </label>
                <div className="ga-import-bar">
                  <button type="button" className="ga-selbtn" onClick={() => setImportSel(importSource ? importSource.items.map(p => p.id) : [])}>Select all</button>
                  <button type="button" className="ga-selbtn" onClick={() => setImportSel([])}>Clear</button>
                  <small>{importSel.length} selected</small>
                </div>
                <div className="ga-import-grid">
                  {importSource?.items.map(p => (
                    <label key={p.id} className="ga-import-item" data-selected={importSel.includes(p.id) ? 'true' : 'false'}>
                      <img src={p.src} alt={p.caption || 'Gallery photo'} loading="lazy" />
                      <input type="checkbox" checked={importSel.includes(p.id)} onChange={() => setImportSel(s => (s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id]))} aria-label={`Select ${p.caption || 'photo'}`} />
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="ga-dialog-actions">
              <button type="button" className="adm-btn adm-btn-outline" disabled={importBusy} onClick={() => setImportOpen(false)}>{importTab === 'computer' ? 'Close' : 'Cancel'}</button>
              {importTab === 'link' && (
                <button type="button" className="adm-btn adm-btn-primary" disabled={importBusy || !importLinks.trim()} onClick={importFromLinks}>
                  {importBusy ? 'Adding...' : 'Add photos'}
                </button>
              )}
              {importTab === 'folders' && importSources.length > 0 && (
                <button type="button" className="adm-btn adm-btn-primary" disabled={importBusy || importSel.length === 0} onClick={importFromFolder}>
                  {importBusy ? 'Importing...' : `Import ${importSel.length || ''} ${importSel.length === 1 ? 'photo' : 'photos'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {renameKey && (
        <div className="ga-dialog-backdrop" onClick={() => !dialogBusy && setRenameKey(null)}>
          <div className="ga-dialog" role="dialog" aria-modal="true" aria-label="Rename folder" onClick={e => e.stopPropagation()}>
            <h3>Rename folder</h3>
            <input className="adm-input" autoFocus value={renameName} maxLength={60} onChange={e => setRenameName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && renameName.trim()) confirmRename(); }} />
            <p className="ga-upload-hint">This is the name shown on the website and in the admin.</p>
            <div className="ga-dialog-actions">
              <button type="button" className="adm-btn adm-btn-outline" disabled={dialogBusy} onClick={() => setRenameKey(null)}>Cancel</button>
              <button type="button" className="adm-btn adm-btn-primary" disabled={dialogBusy || !renameName.trim()} onClick={confirmRename}>{dialogBusy ? 'Saving...' : 'Save name'}</button>
            </div>
          </div>
        </div>
      )}

      {newFolderOpen && (
        <div className="ga-dialog-backdrop" onClick={() => !dialogBusy && setNewFolderOpen(false)}>
          <div className="ga-dialog" role="dialog" aria-modal="true" aria-label="New folder" onClick={e => e.stopPropagation()}>
            <h3>New folder</h3>
            <input className="adm-input" autoFocus value={newName} maxLength={60} placeholder="Folder name, e.g. Team outing 2026" onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) confirmNewFolder(); }} />
            <div className="ga-dialog-actions">
              <button type="button" className="adm-btn adm-btn-outline" disabled={dialogBusy} onClick={() => setNewFolderOpen(false)}>Cancel</button>
              <button type="button" className="adm-btn adm-btn-primary" disabled={dialogBusy || !newName.trim()} onClick={confirmNewFolder}>{dialogBusy ? 'Creating...' : 'Create folder'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Team photo preview (click to enlarge) ── */
function PhotoPreview({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src} alt="Preview"
        onClick={() => setOpen(true)}
        style={{ marginTop: 10, width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--adm-border)', cursor: 'zoom-in' }}
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={src} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 40px #000a' }} />
        </div>
      )}
    </>
  );
}

/* ── Photo upload (team photos, testimonial avatars) ── */
function TeamPhotoUpload({ onUrl, bucket = 'team-photos' }: { onUrl: (url: string) => void; bucket?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = await checkImageFile(file);
    if (problem) {
      toast.error(problem);
      if (ref.current) ref.current.value = '';
      return;
    }
    setBusy(true);
    try {
      onUrl(await uploadGalleryFile(file, '', bucket));
      toast.success('Photo uploaded');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={handleFile} />
      <button
        type="button"
        className="adm-btn adm-btn-outline"
        style={{ whiteSpace: 'nowrap', minWidth: 110 }}
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        {busy ? 'Uploading…' : '⬆ Upload photo'}
      </button>
    </>
  );
}

/* ── Modal form ── */
function Modal({
  title,
  onClose,
  children,
  onSave,
  saveBusy,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  onSave: () => void;
  saveBusy: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="adm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal" role="dialog" aria-modal="true">
        <div className="adm-modal-head">
          <span className="adm-modal-title">{title}</span>
          <button className="adm-icon-btn" aria-label="Close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
        <div className="adm-modal-footer">
          <button className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={onSave} disabled={saveBusy}>
            <Save size={13} /> {saveBusy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  confirmIcon,
}: {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="adm-confirm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="adm-confirm" role="alertdialog" aria-modal="true">
        <div className="adm-confirm-header">
          <div className="adm-confirm-icon"><AlertTriangle size={18} /></div>
          <p className="adm-confirm-title">{title}</p>
        </div>
        <p className="adm-confirm-body">{body}</p>
        <div className="adm-confirm-actions">
          <button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="adm-btn adm-btn-danger" onClick={onConfirm}>
            {confirmIcon ?? <Trash2 size={13} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [hydrated, setHydrated] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<Tab>('case-studies');
  const [rows, setRows] = useState<Record<Tab, Row[]>>({ 'case-studies': [], testimonials: [], team: [], jobs: [], applications: [], gallery: [], 'apply-form': [] });
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Row | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Gallery-specific state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  // Job-applications state (read-only mirror of website applications)
  const [applications, setApplications] = useState<Row[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [appDraft, setAppDraft] = useState<Row | null>(null);
  const [appSaveBusy, setAppSaveBusy] = useState(false);
  const [appConfirmId, setAppConfirmId] = useState<string | null>(null);
  const [galDraft, setGalDraft] = useState<Partial<Photo> | null>(null);
  const [galIsNew, setGalIsNew] = useState(false);
  const [galSaveBusy, setGalSaveBusy] = useState(false);
  const [galConfirmId, setGalConfirmId] = useState<string | null>(null);
  const [galPreviewErr, setGalPreviewErr] = useState(false);
  const [galFolder, setGalFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderMeta[]>([]);
  const [galNeedsSetup, setGalNeedsSetup] = useState(false);
  const [galUploading, setGalUploading] = useState<string | null>(null);
  const galFilesRef = useRef<HTMLInputElement>(null);
  const galSingleRef = useRef<HTMLInputElement>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [magicMsg, setMagicMsg] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('adm-theme') as 'light' | 'dark') || 'light';
    return 'light';
  });

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('adm-theme', next);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setDraft(null);
    setExpandedApp(null);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', t);
    window.history.replaceState({}, '', url.toString());
    if (t === 'gallery') { loadPhotos(); } else if (t === 'applications') { loadApplications(); } else if (t !== 'apply-form') { reload(t as Exclude<Tab, 'gallery' | 'applications' | 'apply-form'>); }
  }

  async function loadPhotos() {
    setPhotosLoading(true);
    const res = await api('/api/admin/gallery');
    setPhotosLoading(false);
    if (res.ok && Array.isArray(res.json?.rows)) {
      setPhotos([...res.json.rows].sort((a: Photo, b: Photo) => a.sort_order - b.sort_order));
    }
    const fres = await api('/api/admin/gallery/folders');
    if (fres.ok && Array.isArray(fres.json?.rows)) setFolders(fres.json.rows);
    const rows = Array.isArray(res.json?.rows) ? res.json.rows : [];
    const frows = Array.isArray(fres.json?.rows) ? fres.json.rows : [];
    setGalNeedsSetup(
      !fres.ok
      || (rows.length > 0 && (!('category' in rows[0]) || !('is_active' in rows[0])))
      || (frows.length > 0 && !('sort_order' in frows[0]))
    );
  }

  async function appSave() {
    if (!appDraft) return;
    setAppSaveBusy(true);
    const res = await api('/api/admin/applications', { method: 'PUT', body: JSON.stringify(appDraft) });
    setAppSaveBusy(false);
    if (!res.ok) { toast.error(res.json?.error ?? 'Could not save the changes'); return; }
    setApplications(list => list.map(a => (String(a.id) === String(appDraft.id) ? { ...a, ...appDraft } : a)));
    setAppDraft(null);
    toast.success('Application updated');
  }

  async function appDelete(id: string) {
    const res = await api(`/api/admin/applications?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setAppConfirmId(null);
    if (!res.ok) { toast.error(res.json?.error ?? 'Could not delete the application'); return; }
    setApplications(list => list.filter(a => String(a.id) !== id));
    if (expandedApp === id) setExpandedApp(null);
    toast.success(res.json?.cvRemoved === false ? 'Application deleted. The resume file could not be removed, so delete it from Supabase Storage.' : 'Application deleted');
  }

  async function loadApplications() {
    setAppsLoading(true);
    const res = await api('/api/admin/applications');
    setAppsLoading(false);
    if (res.ok && Array.isArray(res.json?.rows)) {
      setApplications(res.json.rows);
    }
  }

  async function galSave() {
    if (!key || !galDraft) return;
    if (!galDraft.src?.trim()) { toast.error('Image URL is required'); return; }
    setGalSaveBusy(true);
    try {
      const res = galIsNew
        ? await api('/api/admin/gallery', { method: 'POST', body: JSON.stringify({ ...galDraft, id: galDraft.id ?? newPhotoId(0) }) })
        : await api('/api/admin/gallery', { method: 'PUT', body: JSON.stringify(galDraft) });
      if (!res.ok) throw new Error(res.json?.error ?? 'Save failed');
      toast.success(galIsNew ? 'Photo added' : 'Photo updated');
      setGalDraft(null);
      loadPhotos();
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setGalSaveBusy(false); }
  }

  function newPhotoId(_n: number) { return crypto.randomUUID(); }

  async function galUploadMany(files: ArrayLike<File> | null) {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);
    const checks = await Promise.all(picked.map(checkImageFile));
    const list = picked.filter((_, i) => !checks[i]);
    const problems = checks.filter((c): c is string => c !== null);
    if (problems.length > 0) {
      toast.error(`Skipped ${problems.length} ${problems.length === 1 ? 'file' : 'files'}. ${problems[0]}${problems.length > 1 ? ` (and ${problems.length - 1} more)` : ''}`);
    }
    if (list.length === 0) { if (galFilesRef.current) galFilesRef.current.value = ''; return; }
    const folder = galFolder ?? 'other';
    let added = 0;
    let order = photos.reduce((m, p) => Math.max(m, p.sort_order), 0);
    for (let i = 0; i < list.length; i++) {
      setGalUploading(`Uploading ${i + 1} of ${list.length}...`);
      try {
        const src = await uploadGalleryFile(list[i], folder);
        const caption = list[i].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        const res = await api('/api/admin/gallery', { method: 'POST', body: JSON.stringify({ id: newPhotoId(i), src, caption, sort_order: ++order }) });
        if (!res.ok) throw new Error(res.json?.error ?? 'Save failed');
        added++;
      } catch (err: unknown) { toast.error(`${list[i].name}: ${(err as Error).message}`); }
    }
    setGalUploading(null);
    if (galFilesRef.current) galFilesRef.current.value = '';
    if (added > 0) toast.success(added === 1 ? 'Photo uploaded' : `${added} photos uploaded`);
    loadPhotos();
  }

  async function galImportLinks(urls: string[]) {
    const valid: string[] = [];
    const bad: string[] = [];
    urls.forEach(u => {
      try { const p = new URL(u); (p.protocol === 'http:' || p.protocol === 'https:' ? valid : bad).push(u); } catch { bad.push(u); }
    });
    if (bad.length > 0) toast.error(`Skipped ${bad.length} invalid ${bad.length === 1 ? 'link' : 'links'}: ${bad[0]}${bad.length > 1 ? ` (and ${bad.length - 1} more)` : ''}`);
    let order = photos.reduce((m, p) => Math.max(m, p.sort_order), 0);
    let added = 0;
    for (let i = 0; i < valid.length; i++) {
      const rawName = valid[i].split('?')[0].split('/').pop() ?? '';
      let decoded = rawName;
      try { decoded = decodeURIComponent(rawName); } catch { /* keep the raw name */ }
      const name = decoded.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      const res = await api('/api/admin/gallery', { method: 'POST', body: JSON.stringify({ id: newPhotoId(i), src: valid[i], caption: name, sort_order: ++order, ...(galFolder ? { category: galFolder } : {}) }) });
      if (res.ok) added++; else toast.error(`${valid[i]}: ${res.json?.error ?? 'Save failed'}`);
    }
    if (added > 0) toast.success(added === 1 ? 'Photo added' : `${added} photos added`);
    loadPhotos();
  }

  async function galPersistFolders(keys: string[], rename?: { slug: string; label: string }): Promise<boolean> {
    const metas = keys.map((k, i) => ({ slug: k, label: rename && rename.slug === k ? rename.label : labelOf(k, folders), sort_order: i + 1 }));
    const previous = folders;
    setFolders(metas);
    const res = await api('/api/admin/gallery/folders', { method: 'PUT', body: JSON.stringify({ folders: metas }) });
    if (res.ok) return true;
    setFolders(previous);
    const msg = String(res.json?.error ?? '');
    if (/sort_order|schema cache|gallery_folders|does not exist/i.test(msg)) {
      setGalNeedsSetup(true);
      toast.error('This needs a one-time database update. See the notice on this page.');
    } else toast.error(msg || 'Could not save the folders');
    return false;
  }

  async function galReorderFolders(keys: string[]) {
    if (await galPersistFolders(keys)) toast.success('Folder order saved');
  }

  async function galRenameFolder(slug: string, label: string): Promise<boolean> {
    const name = label.trim();
    if (!name) { toast.error('Enter a folder name'); return false; }
    const keys = groupByCategory(photos, folders, true).map(g => g.key);
    if (!(await galPersistFolders(keys, { slug, label: name }))) return false;
    toast.success(`Renamed to "${name}"`);
    return true;
  }

  async function galSetActive(ids: string[], active: boolean) {
    const changing = photos.filter(p => ids.includes(p.id)).map(p => ({ ...p, is_active: active }));
    setPhotos(ps => ps.map(p => (ids.includes(p.id) ? { ...p, is_active: active } : p)));
    const results = await Promise.all(changing.map(p => api('/api/admin/gallery', { method: 'PUT', body: JSON.stringify(p) })));
    const failed = results.find(r => !r.ok);
    if (failed) {
      const msg = String(failed.json?.error ?? '');
      if (/is_active|schema cache/i.test(msg)) { setGalNeedsSetup(true); toast.error('Hiding photos needs a one-time database update. See the notice on this page.'); }
      else toast.error(msg || 'Could not update the photos');
      loadPhotos();
    } else {
      const n = changing.length;
      toast.success(active ? `${n} ${n === 1 ? 'photo is' : 'photos are'} now shown on the website` : `${n} ${n === 1 ? 'photo is' : 'photos are'} now hidden from the website`);
    }
  }

  async function galMove(ids: string[], target: string) {
    const label = labelOf(target, folders);
    const moving = photos.filter(p => ids.includes(p.id)).map(p => ({ ...p, category: target }));
    setPhotos(ps => ps.map(p => (ids.includes(p.id) ? { ...p, category: target } : p)));
    const results = await Promise.all(moving.map(p => api('/api/admin/gallery', { method: 'PUT', body: JSON.stringify(p) })));
    const failed = results.find(r => !r.ok);
    if (failed) {
      const msg = String(failed.json?.error ?? '');
      if (/category|schema cache/i.test(msg)) { setGalNeedsSetup(true); toast.error('Moving photos needs a one-time database update. See the notice on this page.'); }
      else toast.error(msg || 'Could not move the photos');
      loadPhotos();
    } else {
      toast.success(`Moved ${moving.length} ${moving.length === 1 ? 'photo' : 'photos'} to ${label}`);
    }
  }

  async function galCreateFolder(label: string): Promise<string | null> {
    const name = label.trim();
    const slug = slugifyFolder(name);
    if (!name || !slug) { toast.error('Enter a folder name (letters or numbers)'); return null; }
    const existing = groupByCategory(photos, folders, true).some(g => g.key === slug) || folders.some(f => f.slug === slug);
    if (existing) { toast.message('That folder already exists, using it'); return slug; }
    const res = await api('/api/admin/gallery/folders', { method: 'POST', body: JSON.stringify({ slug, label: name }) });
    if (!res.ok) {
      const msg = String(res.json?.error ?? '');
      if (/gallery_folders|schema cache|does not exist/i.test(msg)) { setGalNeedsSetup(true); toast.error('Creating folders needs a one-time database update. See the notice on this page.'); }
      else toast.error(msg || 'Could not create the folder');
      return null;
    }
    setFolders(fs => [...fs, { slug, label: name }]);
    toast.success(`Folder "${name}" created`);
    return slug;
  }

  async function galDeleteFolder(slug: string) {
    const res = await api(`/api/admin/gallery/folders?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (res.ok) { setFolders(fs => fs.filter(f => f.slug !== slug)); toast.success('Folder deleted'); }
    else toast.error(res.json?.error ?? 'Could not delete the folder');
  }

  async function galUploadSingle(file: File | undefined) {
    if (!file) return;
    const problem = await checkImageFile(file);
    if (problem) {
      toast.error(problem);
      if (galSingleRef.current) galSingleRef.current.value = '';
      return;
    }
    setGalUploading('Uploading...');
    try {
      const url = await uploadGalleryFile(file, galFolder ?? 'other');
      setGalDraft(d => ({ ...d, src: url }));
      setGalPreviewErr(false);
      toast.success('Photo uploaded');
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setGalUploading(null); if (galSingleRef.current) galSingleRef.current.value = ''; }
  }

  async function galDelete(id: string) {
    if (!key) return;
    const res = await api(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Photo removed'); setPhotos(ps => ps.filter(p => p.id !== id)); }
    else toast.error(res.json?.error ?? 'Delete failed');
    setGalConfirmId(null);
  }

  async function galSaveOrder(reordered: Photo[]) {
    setPhotos(reordered);
    const results = await Promise.all(
      reordered.map(p => api('/api/admin/gallery', {
        method: 'PUT',
        body: JSON.stringify(p),
      }))
    );
    if (results.every(r => r.ok)) {
      toast.success('Order saved');
    } else {
      toast.error('Failed to save order');
      loadPhotos();
    }
  }

  const route = useMemo<Record<Tab, string>>(() => ({
    'case-studies': '/api/admin/case-studies',
    testimonials: '/api/admin/testimonials',
    team: '/api/admin/team',
    jobs: '/api/admin/jobs',
    applications: '/api/admin/applications',
    // These two tabs have their own screens and never go through the row list.
    gallery: '',
    'apply-form': '',
  }), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedTab = params.get('tab');
    if (storedTab && (['case-studies', 'testimonials', 'team', 'jobs', 'applications', 'apply-form', 'gallery'] as Tab[]).includes(storedTab as Tab)) {
      setTab(storedTab as Tab);
    }
    const magic = params.get('magic');
    if (magic === 'expired') setMagicMsg('That reset link has expired. Please request a new one.');
    else if (magic === 'invalid') setMagicMsg('That reset link is invalid or already used.');
    else if (magic === 'error') setMagicMsg('Something went wrong. Please try again.');
    if (magic) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('magic');
      window.history.replaceState({}, '', clean.toString());
    }
    const reset = params.get('reset');
    if (reset) {
      setResetToken(reset);
      const clean = new URL(window.location.href);
      clean.searchParams.delete('reset');
      window.history.replaceState({}, '', '/login');
    }
    api('/api/admin/case-studies').then(res => {
      if (res.ok) {
        setKey('authenticated');
      } else {
        // Not authenticated on initial load — save where the user wanted to go
        const href = window.location.href;
        if (!href.includes('/login')) {
          sessionStorage.setItem('hs-admin-return', href);
        }
        window.history.replaceState({}, '', '/login');
      }
      setHydrated(true);
    }).catch(() => {
      window.history.replaceState({}, '', '/login');
      setHydrated(true);
    });
    _onAuthFailure = () => {
      sessionStorage.setItem('hs-admin-return', window.location.href);
      window.history.replaceState({}, '', '/login');
      setKey(null);
    };
    return () => { _onAuthFailure = null; };
  }, []);

  useEffect(() => {
    if (!key) return;
    if (tab === 'gallery') loadPhotos();
    else if (tab === 'applications') loadApplications();
    else if (tab !== 'apply-form') reload(tab);
  }, [key]);

  async function reload(which: Tab) {
    if (!key || !route[which]) return;
    setLoading(true);
    const res = await api(route[which]);
    setLoading(false);
    if (res.ok && Array.isArray(res.json?.rows)) {
      const sorted = [...res.json.rows].sort((a: Row, b: Row) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
      setRows((r) => ({ ...r, [which]: sorted }));
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetPw !== resetPwConfirm) { setResetError('Passwords do not match.'); return; }
    if (resetPw.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    setResetBusy(true);
    setResetError('');
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: resetPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetDone(true);
        setResetToken(null);
      } else {
        setResetError(data.error ?? 'Something went wrong.');
      }
    } catch {
      setResetError('Network error. Please try again.');
    }
    setResetBusy(false);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const domPw = (document.getElementById('adm-pw') as HTMLInputElement)?.value || password;
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: domPw, rememberMe: keepSignedIn }),
      });
      setLoggingIn(false);
      if (res.ok) {
        setKey('authenticated');
        setPassword('');
        setConfirmLogout(false);
        toast.success('Welcome back');
        const returnUrl = sessionStorage.getItem('hs-admin-return');
        if (returnUrl && !returnUrl.includes('/login')) {
          sessionStorage.removeItem('hs-admin-return');
          window.history.replaceState({}, '', returnUrl);
          const params = new URLSearchParams(new URL(returnUrl).search);
          const t = params.get('tab') as Tab | null;
          if (t && (['case-studies', 'testimonials', 'team', 'jobs', 'gallery'] as Tab[]).includes(t)) {
            setTab(t);
          }
        } else {
          sessionStorage.removeItem('hs-admin-return');
          window.history.replaceState({}, '', '/admin');
        }
      } else {
        setLoginError(res.status === 401 ? 'That password is not recognised.' : (await res.json().catch(() => ({}))).error || 'Login failed. Please try again.');
      }
    } catch {
      setLoggingIn(false);
      setLoginError('Login failed. Please try again.');
    }
  }

  async function save() {
    if (!key || !draft) return;
    setSaveBusy(true);
    const body: Row = { ...draft, sort_order: Number(draft.sort_order ?? 1) };
    if (!body.id) {
      const titleField = tab === 'case-studies' ? 'title' : tab === 'jobs' ? 'title' : 'name';
      body.id = slug(String(draft[titleField] ?? ''));
    }
    // is_active only exists on job_posts — strip it from other tabs to avoid schema errors
    if (tab !== 'jobs') delete body.is_active;
    const res = await api(route[tab], { method: 'PUT', body: JSON.stringify(body) });
    setSaveBusy(false);
    if (res.ok) {
      toast.success('Saved');
      setDraft(null);
      reload(tab);
    } else {
      toast.error(res.json?.error ?? 'Save failed (check the write SQL was run)');
    }
  }

  async function remove(id: string) {
    if (!key) return;
    setConfirmId(id);
  }

  async function confirmDelete() {
    if (!key || !confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    const res = await api(`${route[tab]}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); reload(tab); }
    else toast.error(res.json?.error ?? 'Delete failed');
  }

  async function toggleActive(id: string, active: boolean) {
    if (!key) return;
    const row = rows[tab].find((r) => String(r.id) === id);
    if (!row) return;
    setRows((r) => ({ ...r, [tab]: r[tab].map((x) => String(x.id) === id ? { ...x, is_active: active } : x) }));
    const res = await api(route[tab], { method: 'PUT', body: JSON.stringify({ ...row, is_active: active }) });
    if (res.ok) {
      toast.success(active ? 'Job activated' : 'Job deactivated');
      reload(tab);
    } else {
      toast.error(res.json?.error ?? 'Update failed');
      reload(tab);
    }
  }

  async function saveReorder(reordered: Row[]) {
    if (!key) return;
    setRows((r) => ({ ...r, [tab]: reordered }));
    for (const row of reordered) {
      await api(route[tab], { method: 'PUT', body: JSON.stringify({ ...row, sort_order: Number(row.sort_order) }) });
    }
    toast.success('Order saved');
  }

  function set<K extends string>(field: K, value: unknown) {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
  }

  if (!hydrated) return null;

  if (!key) {
    return (<>
      <div className="adm-login">
        <Toaster position="top-center" />
        {/* Brand panel */}
        <div className="adm-login-brand">
          <div className="adm-login-brand-inner">
            <div className="adm-login-wordmark">
              <span className="adm-login-hs">hs</span>
              <span>handy<strong>solver</strong></span>
            </div>
            <div className="adm-login-brand-copy">
              <p className="adm-login-tagline">Content<br />Control<br />Centre</p>
              <p className="adm-login-brand-sub">Manage your case studies, testimonials, team and job posts in one place.</p>
            </div>
            <div className="adm-login-brand-items">
              {['Case studies', 'Testimonials', 'Team members', 'Job posts'].map((item) => (
                <div key={item} className="adm-login-brand-item">
                  <span className="adm-login-brand-dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Form panel */}
        <div className="adm-login-form-panel">
          <div className="adm-login-form-inner">
            {resetToken ? (
              /* ── Reset password form ── */
              <>
                <div className="adm-login-form-top">
                  <p className="adm-login-eyebrow">Content admin</p>
                  <h1 className="adm-login-title">Set new password</h1>
                  <p className="adm-login-sub">Choose a strong password for your admin account.</p>
                </div>
                <form onSubmit={submitReset} className="adm-login-form">
                  <div className="adm-login-field">
                    <label className="adm-label" htmlFor="adm-reset-pw">New password</label>
                    <div className="adm-login-input-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input id="adm-reset-pw" type={showPw ? 'text' : 'password'} className="adm-input adm-login-pw-input" value={resetPw} onChange={e => setResetPw(e.target.value)} placeholder="At least 8 characters" autoFocus />
                      <button type="button" className="adm-pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                        {showPw ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>
                  <div className="adm-login-field">
                    <label className="adm-label" htmlFor="adm-reset-pw2">Confirm password</label>
                    <div className="adm-login-input-wrap">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input id="adm-reset-pw2" type={showPw ? 'text' : 'password'} className="adm-input adm-login-pw-input" value={resetPwConfirm} onChange={e => setResetPwConfirm(e.target.value)} placeholder="Repeat password" />
                    </div>
                  </div>
                  {resetError && <p className="adm-login-error">{resetError}</p>}
                  <button type="submit" className="adm-btn adm-btn-primary adm-login-submit" disabled={resetBusy}>
                    {resetBusy ? 'Saving…' : 'Save new password'}
                    {!resetBusy && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                  </button>
                </form>
              </>
            ) : resetDone ? (
              /* ── Reset success ── */
              <>
                <div className="adm-login-form-top">
                  <p className="adm-login-eyebrow">Content admin</p>
                  <h1 className="adm-login-title">Password updated</h1>
                  <p className="adm-login-sub">Your new password has been saved. You can now sign in.</p>
                </div>
                <button className="adm-btn adm-btn-primary adm-login-submit" onClick={() => setResetDone(false)}>
                  Sign in
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </>
            ) : (
              /* ── Login form ── */
              <>
            <div className="adm-login-form-top">
              <p className="adm-login-eyebrow">Content admin</p>
              <h1 className="adm-login-title">Welcome back</h1>
              <p className="adm-login-sub">Enter your admin password to access the dashboard.</p>
            </div>
            {magicMsg && (
              <div className="adm-login-magic-err">{magicMsg}</div>
            )}
            <form onSubmit={login} className="adm-login-form">
              <div className="adm-login-field">
                <label className="adm-label" htmlFor="adm-email">Email</label>
                <div className="adm-login-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input id="adm-email" type="email" className="adm-input adm-login-pw-input" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@handysolver.com" autoFocus required />
                </div>
              </div>
              <div className="adm-login-field">
                <label className="adm-label" htmlFor="adm-pw">Password</label>
                <div className="adm-login-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input id="adm-pw" type={showPw ? 'text' : 'password'} className="adm-input adm-login-pw-input" value={password} onChange={(e) => setPassword(e.target.value)} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} placeholder="Enter password" />
                  <button type="button" className="adm-pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              {loginError && <p className="adm-login-error">{loginError}</p>}
              <div className="adm-login-row">
                <label className="adm-login-remember">
                  <input type="checkbox" checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} />
                  <span>Keep me signed in</span>
                </label>
                <button type="button" className="adm-login-forgot" onClick={() => { setShowForgot(true); setForgotSent(false); setForgotError(''); setForgotEmail(''); }}>Forgot password?</button>
              </div>
              <button type="submit" className="adm-btn adm-btn-primary adm-login-submit" disabled={loggingIn}>
                {loggingIn ? 'Verifying…' : 'Sign in'}
                {!loggingIn && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
              </button>
            </form>
            <p className="adm-login-footer">HandySolver · Admin access only</p>
              </>
            )}
          </div>
        </div>
      </div>
      {showForgot && (
        <div className="adm-forgot-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(false); }}>
          <div className="adm-forgot-box" role="dialog" aria-modal="true">
            <div className="adm-forgot-head">
              <div>
                <p className="adm-forgot-eyebrow">Admin access</p>
                <h2 className="adm-forgot-title">{forgotSent ? 'Check your email' : 'Forgot password?'}</h2>
              </div>
              <button className="adm-forgot-close" aria-label="Close" onClick={() => setShowForgot(false)}><X size={16} /></button>
            </div>
            {forgotSent ? (
              <div className="adm-forgot-sent">
                <div className="adm-forgot-sent-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <p className="adm-forgot-sent-text">We've sent a password reset link to <strong>{forgotEmail}</strong>. Click the link in the email to set a new password — it expires in 15 minutes.</p>
                <p className="adm-forgot-sent-sub">Didn't get it? Check your spam folder or <button type="button" className="adm-forgot-resend" onClick={() => setForgotSent(false)}>try again</button>.</p>
              </div>
            ) : (
              <form className="adm-forgot-form" onSubmit={async (e) => {
                e.preventDefault();
                setForgotSending(true);
                setForgotError('');
                try {
                  const res = await fetch('/api/admin/auth/magic-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: forgotEmail }),
                  });
                  const data = await res.json();
                  if (res.ok && data.ok) {
                    setForgotSent(true);
                  } else {
                    setForgotError(data.error ?? 'That email is not registered as the admin email.');
                  }
                } catch {
                  setForgotError('Failed to send. Please try again.');
                } finally {
                  setForgotSending(false);
                }
              }}>
                <p className="adm-forgot-sub">Enter the admin email address and we'll send you a password reset link.</p>
                <div className="adm-forgot-field">
                  <label className="adm-forgot-label">Email address</label>
                  <div className="adm-forgot-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input type="email" className="adm-forgot-input" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="connect@handysolver.com" autoFocus required />
                  </div>
                </div>
                {forgotError && <p className="adm-forgot-error">{forgotError}</p>}
                <div className="adm-forgot-actions">
                  <button type="button" className="adm-forgot-cancel" onClick={() => setShowForgot(false)}>Cancel</button>
                  <button type="submit" className="adm-forgot-submit" disabled={forgotSending || !forgotEmail}>
                    {forgotSending ? 'Sending…' : 'Send reset link'}
                    {!forgotSending && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>);
  }

  const TAB_LABELS: Record<Tab, string> = {
    'case-studies': 'Case studies',
    testimonials: 'Testimonials',
    team: 'Team members',
    jobs: 'Job posts',
    applications: 'Job applications',
    'apply-form': 'Application form',
    gallery: 'Gallery photos',
  };

  const currentRows = tab !== 'gallery' && tab !== 'applications' && tab !== 'apply-form' ? rows[tab] : [];

  return (
    <div className="adm-root" data-theme={theme}>
      <Toaster
        position="top-center"
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <div className="adm-wordmark">Handy<span>Solver</span><i /></div>
            <p className="adm-header-sub">Manage case studies, testimonials, team members, job posts and job applications.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="adm-theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
              {theme === 'light'
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              }
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            <button className="adm-logout" onClick={() => setConfirmLogout(true)}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <div className="adm-tabs">
          {(['case-studies', 'testimonials', 'team', 'jobs', 'applications', 'apply-form', 'gallery'] as Tab[]).map((t) => (
            <button
              key={t}
              className="adm-tab"
              data-active={tab === t ? 'true' : 'false'}
              onClick={() => switchTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">
              {TAB_LABELS[tab]}
              <span className="adm-count-badge">{tab === 'apply-form' ? null : tab === 'gallery' ? photos.length : tab === 'applications' ? applications.length : currentRows.length}</span>
            </span>
            {tab === 'gallery' || tab === 'applications' || tab === 'apply-form' ? null : (
              <button className="adm-add-btn" onClick={() => setDraft({ sort_order: currentRows.length + 1, is_active: true })}>
                <Plus size={13} /> Add new
              </button>
            )}
          </div>
          <div className="adm-card-body">
            {tab === 'apply-form' ? (
              <FormBuilder api={api} />
            ) : tab === 'gallery' ? (
              photosLoading ? <p className="adm-loading">Loading...</p>
              : (
                <div className="adm-list">
                  {photos.length === 0 && (
                    <div className="adm-empty">
                      <ImageIcon size={36} strokeWidth={1.2} style={{ opacity: .3 }} />
                      <p>No photos yet. Create a folder, open it, then click Import photos.</p>
                    </div>
                  )}
                  {galNeedsSetup && <GallerySetupNotice onRecheck={loadPhotos} />}
                  <DraggablePhotoList
                    photos={photos}
                    folders={folders}
                    onImportFiles={galUploadMany}
                    onImportLinks={galImportLinks}
                    onReorderFolders={galReorderFolders}
                    onRenameFolder={galRenameFolder}
                    onSetActive={galSetActive}
                    importing={galUploading}
                    onMove={galMove}
                    onCreateFolder={galCreateFolder}
                    onDeleteFolder={galDeleteFolder}
                    onReorder={galSaveOrder}
                    onEdit={(p) => { setGalIsNew(false); setGalDraft({ ...p }); setGalPreviewErr(false); }}
                    onDelete={id => setGalConfirmId(id)}
                    openKey={galFolder}
                    onOpenKey={setGalFolder}
                  />
                </div>
              )
            ) : tab === 'applications' ? (
              appsLoading ? <p className="adm-loading">Loading...</p>
              : applications.length === 0 ? (
                <p className="adm-empty">No applications yet. New website applications will appear here.</p>
              ) : (
                <div className="adm-list">
                  {applications.map((a) => {
                    const id = String(a.id);
                    const open = expandedApp === id;
                    const name = `${String(a.fname ?? '').trim()} ${String(a.lname ?? '').trim()}`.trim() || String(a.email ?? '') || 'Application';
                    const d = new Date(String(a.created_at ?? ''));
                    const date = isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                    const submitted = isNaN(d.getTime()) ? '' : d.toLocaleString();
                    const meta = [String(a.type ?? ''), String(a.email ?? ''), String(a.phone ?? ''), date].filter(Boolean).join(' · ');
                    const exp = String(a.exp ?? '').trim();
                    const details = [
                      ['Applied for', String(a.type ?? '')],
                      ['Full name', name],
                      ['Email', String(a.email ?? '')],
                      ['Phone', String(a.phone ?? '')],
                      ['Location', String(a.location ?? '')],
                      ['Experience', exp ? `${exp} months` : ''],
                      ['Expected salary', String(a.salary ?? '')],
                      ['Current CTC', String(a.current_ctc ?? '')],
                      ['Heard via', String(a.hear ?? '')],
                      ['Date of birth', String(a.dob ?? '')],
                      ['Gender', String(a.gender ?? '')],
                      ['CV file', String(a.cv_filename ?? '')],
                      ['Submitted', submitted],
                      ...(Array.isArray(a.extra) ? (a.extra as { label?: string; value?: string }[]).map((item): [string, string] => [String(item.label ?? ''), String(item.value ?? '')]) : []),
                    ].filter((pair): pair is [string, string] => Boolean(pair[1]));
                    const cvUrl = String(a.cv_url ?? '');
                    return (
                      <div key={id} className="adm-row adm-app-row" onClick={() => setExpandedApp(open ? null : id)}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="adm-row-name">{name}</p>
                          <p className="adm-row-meta">{meta}</p>
                          {open && (
                            <div className="adm-app-details">
                              {details.map(([label, value]) => (
                                <div key={label} className="adm-app-detail"><span>{label}</span>{value}</div>
                              ))}
                              <div className="adm-app-resume">
                                {cvUrl ? (
                                  <a className="adm-resume-btn" href={cvUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>View resume</a>
                                ) : (
                                  <span className="adm-resume-missing">Resume file not stored (submitted before file backup was enabled).</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="adm-row-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="adm-icon-btn" aria-label={`Edit ${name}`} title="Edit application" onClick={() => setAppDraft({ ...a })}><PencilLine size={14} /></button>
                          <button className="adm-icon-btn delete" aria-label={`Delete ${name}`} title="Delete application" onClick={() => setAppConfirmId(id)}><Trash2 size={14} /></button>
                        </div>
                        <span className="adm-app-expand">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <>
                {loading && <p className="adm-loading">Loading...</p>}
                {!loading && currentRows.length === 0 && (
                  <p className="adm-empty">No rows yet. Click Add new to get started.</p>
                )}
                <DraggableList
                  rows={currentRows}
                  onReorder={saveReorder}
                  onEdit={(row) => setDraft(row)}
                  onDelete={remove}
                  onToggleActive={tab === 'jobs' ? toggleActive : undefined}
                  showIcon={tab === 'jobs'}
                  metaField={tab === 'team' ? 'surname' : undefined}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {confirmId && (
        <ConfirmDialog
          title="Delete this item?"
          body="This action cannot be undone. The item will be permanently removed."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="Sign out?"
          body="You'll need to enter your password again to access the admin panel."
          confirmLabel="Sign out"
          confirmIcon={<LogOut size={13} />}
          onConfirm={async () => {
            sessionStorage.setItem('hs-admin-return', window.location.href);
            await fetch('/api/admin/auth/logout', {
              method: 'POST',
              credentials: 'same-origin',
            }).catch(() => {});
            window.history.replaceState({}, '', '/login');
            setKey(null);
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {galDraft && (
        <Modal title={galIsNew ? 'Add photo' : 'Edit photo'} onClose={() => setGalDraft(null)} onSave={galSave} saveBusy={galSaveBusy}>
          <div className="adm-field">
            <label className="adm-label">Image URL <span style={{ color: '#ff4d4d', fontSize: 11 }}>*</span></label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="adm-input" style={{ flex: 1 }} type="url" value={galDraft.src ?? ''} autoFocus
                onChange={e => { setGalDraft(d => ({ ...d, src: e.target.value })); setGalPreviewErr(false); }}
                placeholder="https://handysolver.com/assets/images/..." />
              <input ref={galSingleRef} type="file" accept={IMAGE_ACCEPT} style={{ display: 'none' }} onChange={e => galUploadSingle(e.target.files?.[0])} />
              <button type="button" className="adm-btn adm-btn-outline" style={{ whiteSpace: 'nowrap' }} disabled={galUploading !== null} onClick={() => galSingleRef.current?.click()}>
                {galUploading ?? 'Upload photo'}
              </button>
            </div>
            <p className="ga-upload-hint">Allowed image types: {ALLOWED_IMAGE_LABEL}. Other file types can&apos;t be selected.</p>
            {galDraft.src && !galPreviewErr && (
              <img className="ga-modal-preview" src={galDraft.src} alt="preview" onError={() => setGalPreviewErr(true)} />
            )}
            {galPreviewErr && <p className="ga-modal-preview-err">Could not load image from this URL</p>}
          </div>
          <div className="adm-field">
            <label className="adm-label">Caption <span style={{ color: '#666', fontSize: 11 }}>(optional)</span></label>
            <input className="adm-input" type="text" value={galDraft.caption ?? ''}
              onChange={e => setGalDraft(d => ({ ...d, caption: e.target.value }))}
              placeholder="e.g. Team outing 2025" />
          </div>
        </Modal>
      )}

      {appDraft && (
        <Modal title="Edit application" onClose={() => setAppDraft(null)} onSave={appSave} saveBusy={appSaveBusy}>
          {([
            [['fname', 'First name'], ['lname', 'Last name']],
            [['email', 'Email'], ['phone', 'Phone']],
            [['type', 'Applied for'], ['location', 'Location']],
            [['exp', 'Experience (months)'], ['salary', 'Expected salary']],
            [['current_ctc', 'Current CTC'], ['hear', 'Heard via']],
            [['dob', 'Date of birth'], ['gender', 'Gender']],
          ] as [string, string][][]).map((pair, i) => (
            <Field2 key={i}>
              {pair.map(([key, label]) => (
                <Field key={key} label={label}>
                  <input className="adm-input" value={String(appDraft[key] ?? '')} onChange={(e) => setAppDraft(d => (d ? { ...d, [key]: e.target.value } : d))} maxLength={200} />
                </Field>
              ))}
            </Field2>
          ))}
          <p className="ga-upload-hint">The resume file and the submission time can&apos;t be edited.</p>
        </Modal>
      )}

      {appConfirmId && (
        <ConfirmDialog
          title="Delete this application?"
          body="The application and its stored resume will be permanently deleted. This cannot be undone."
          onConfirm={() => appDelete(appConfirmId)}
          onCancel={() => setAppConfirmId(null)}
        />
      )}

      {galConfirmId && (
        <ConfirmDialog
          title="Remove photo?"
          body="This photo will be removed from the gallery. This cannot be undone."
          onConfirm={() => galDelete(galConfirmId)}
          onCancel={() => setGalConfirmId(null)}
        />
      )}

      {draft && (
        <Modal
          title={draft.id ? 'Edit item' : 'Add new item'}
          onClose={() => setDraft(null)}
          onSave={save}
          saveBusy={saveBusy}
        >
          {tab === 'case-studies' && (
            <>
              <Field2>
                <Field label="Icon">
                  <IconPicker value={String(draft.icon ?? '')} onChange={(v) => set('icon', v)} />
                </Field>
                <Field label="Sort order">
                  <input type="number" className="adm-input" value={Number(draft.sort_order ?? 1)} onChange={(e) => set('sort_order', e.target.value)} min={1} />
                </Field>
              </Field2>
              <Field label="Label (industry)">
                <input className="adm-input" value={String(draft.label ?? '')} onChange={(e) => set('label', e.target.value)} />
              </Field>
              <Field label="Metric">
                <input className="adm-input" value={String(draft.metric ?? '')} onChange={(e) => set('metric', e.target.value)} />
              </Field>
              <Field label="Title">
                <input className="adm-input" value={String(draft.title ?? '')} onChange={(e) => set('title', e.target.value)} />
              </Field>
              <Field label="Before">
                <textarea className="adm-textarea" rows={3} value={String(draft.before_text ?? '')} onChange={(e) => set('before_text', e.target.value)} />
              </Field>
              <Field label="What changed">
                <textarea className="adm-textarea" rows={3} value={String(draft.changed ?? '')} onChange={(e) => set('changed', e.target.value)} />
              </Field>
              <Field label="Result">
                <textarea className="adm-textarea" rows={3} value={String(draft.result ?? '')} onChange={(e) => set('result', e.target.value)} />
              </Field>
              <Field label="Tags (comma separated)">
                <input className="adm-input" value={Array.isArray(draft.tags) ? draft.tags.join(', ') : String(draft.tags ?? '')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} />
              </Field>
            </>
          )}
          {tab === 'testimonials' && (
            <>
              <Field2>
                <Field label="Name">
                  <input className="adm-input" value={String(draft.name ?? '')} onChange={(e) => { set('name', e.target.value); set('initials', String(e.target.value).split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase()); }} />
                </Field>
                <Field label="Initials">
                  <input className="adm-input" value={String(draft.initials ?? '')} onChange={(e) => set('initials', e.target.value)} />
                </Field>
              </Field2>
              <Field2>
                <Field label="Label / role">
                  <input className="adm-input" value={String(draft.label ?? '')} onChange={(e) => set('label', e.target.value)} />
                </Field>
                <Field label="Sort order">
                  <input type="number" className="adm-input" value={Number(draft.sort_order ?? 1)} onChange={(e) => set('sort_order', e.target.value)} min={1} />
                </Field>
              </Field2>
              <Field label="Quote">
                <textarea className="adm-textarea" rows={3} value={String(draft.quote ?? '')} onChange={(e) => set('quote', e.target.value)} />
              </Field>
              <Field label="Avatar photo">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="adm-input" style={{ flex: 1 }} value={String(draft.avatar_url ?? '')} onChange={(e) => set('avatar_url', e.target.value || null)} placeholder="https://..." />
                  <TeamPhotoUpload bucket="testimonial-avatars" onUrl={(url) => set('avatar_url', url)} />
                </div>
                <p className="ga-upload-hint">Allowed image types: {ALLOWED_IMAGE_LABEL}. Other file types can&apos;t be selected.</p>
                {Boolean(draft.avatar_url) && (
                  <PhotoPreview src={String(draft.avatar_url)} />
                )}
              </Field>
              <Field label="Video URL">
                <input className="adm-input" value={String(draft.video_url ?? '')} onChange={(e) => set('video_url', e.target.value || null)} placeholder="YouTube, Vimeo or .mp4" />
              </Field>
              <Field2>
                <Field label="Source URL">
                  <input className="adm-input" value={String(draft.source ?? '')} onChange={(e) => set('source', e.target.value)} />
                </Field>
                <Field label="Source label">
                  <input className="adm-input" value={String(draft.source_label ?? '')} onChange={(e) => set('source_label', e.target.value)} />
                </Field>
              </Field2>
            </>
          )}
          {tab === 'team' && (
            <>
              <Field2>
                <Field label="Name">
                  <input className="adm-input" value={String(draft.name ?? '')} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="Surname">
                  <input className="adm-input" value={String(draft.surname ?? '')} onChange={(e) => set('surname', e.target.value)} />
                </Field>
              </Field2>
              <Field label="Sort order">
                <input type="number" className="adm-input" value={Number(draft.sort_order ?? 1)} onChange={(e) => set('sort_order', e.target.value)} min={1} style={{ maxWidth: 120 }} />
              </Field>
              <Field label="Photo URL">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="adm-input" style={{ flex: 1 }} value={String(draft.photo_url ?? '')} onChange={(e) => set('photo_url', e.target.value)} placeholder="https://..." />
                  <TeamPhotoUpload onUrl={(url) => set('photo_url', url)} />
                </div>
                <p className="ga-upload-hint">Allowed image types: {ALLOWED_IMAGE_LABEL}. Other file types can&apos;t be selected.</p>
                {Boolean(draft.photo_url) && (
                  <PhotoPreview src={String(draft.photo_url)} />
                )}
              </Field>
            </>
          )}
          {tab === 'jobs' && (() => {
            const flags = (draft.field_flags as Record<string, boolean>) ?? {};
            function setFlag(key: string, val: boolean) {
              set('field_flags', { ...flags, [key]: val });
            }
            return (
              <>
                <Field2>
                  <Field label="Job Post Name *">
                    <input className="adm-input" value={String(draft.title ?? '')} onChange={(e) => set('title', e.target.value)} placeholder="e.g. AI and Web Developer Intern" />
                  </Field>
                  <Field label="Job Position (sort order)">
                    <input type="number" className="adm-input" value={Number(draft.sort_order ?? 1)} onChange={(e) => set('sort_order', e.target.value)} min={1} />
                  </Field>
                </Field2>
                <Field label="Icon">
                  <IconPicker value={String(draft.icon ?? '')} onChange={(v) => set('icon', v)} icons={JOB_ICONS} />
                </Field>
                <FieldToggle label="Introduction" flagKey="show_intro" flags={flags} onToggle={setFlag}>
                  <textarea className="adm-textarea" rows={3} value={String(draft.intro ?? '')} onChange={(e) => set('intro', e.target.value)} placeholder="An Ideal Candidate Is Someone..." />
                </FieldToggle>
                <FieldToggle label="Role and Responsibilities" flagKey="show_role" flags={flags} onToggle={setFlag}>
                  <textarea className="adm-textarea" rows={4} value={String(draft.role ?? '')} onChange={(e) => set('role', e.target.value)} placeholder="Your Job Role Will Include..." />
                </FieldToggle>
                <FieldToggle label="Requirement(s)" flagKey="show_requirements" flags={flags} onToggle={setFlag}>
                  <textarea className="adm-textarea" rows={4} value={String(draft.requirements ?? '')} onChange={(e) => set('requirements', e.target.value)} placeholder="Required" />
                </FieldToggle>
                <FieldToggle label="Good to Have" flagKey="show_good_to_have" flags={flags} onToggle={setFlag}>
                  <textarea className="adm-textarea" rows={3} value={String(draft.good_to_have ?? '')} onChange={(e) => set('good_to_have', e.target.value)} placeholder="Good To Have..." />
                </FieldToggle>
                <FieldToggle label="Skills Required" flagKey="show_skills" flags={flags} onToggle={setFlag}>
                  <textarea className="adm-textarea" rows={3} value={String(draft.skills ?? '')} onChange={(e) => set('skills', e.target.value)} placeholder="List Out Required Skill Set..." />
                </FieldToggle>
                <FieldToggle label="Experience" flagKey="show_experience" flags={flags} onToggle={setFlag}>
                  <div className="adm-field-2">
                    <Field label="Min (years)">
                      <input type="number" className="adm-input" value={(draft.exp_min as number | undefined) ?? ''} onChange={(e) => set('exp_min', e.target.value ? Number(e.target.value) : null)} placeholder="Min" />
                    </Field>
                    <Field label="Max (years)">
                      <input type="number" className="adm-input" value={(draft.exp_max as number | undefined) ?? ''} onChange={(e) => set('exp_max', e.target.value ? Number(e.target.value) : null)} placeholder="Max" />
                    </Field>
                  </div>
                </FieldToggle>
                <FieldToggle label="Qualifications" flagKey="show_qualification" flags={flags} onToggle={setFlag}>
                  <input className="adm-input" value={String(draft.qualification ?? '')} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. B.Tech / BCA" />
                </FieldToggle>
                <FieldToggle label="Salary Range" flagKey="show_salary" flags={flags} onToggle={setFlag}>
                  <input className="adm-input" value={String(draft.salary ?? '')} onChange={(e) => set('salary', e.target.value)} placeholder="e.g. 4-6 LPA" />
                </FieldToggle>
                <FieldToggle label="Job Location" flagKey="show_location" flags={flags} onToggle={setFlag}>
                  <input className="adm-input" value={String(draft.location ?? '')} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Gurugram / Remote" />
                </FieldToggle>
                <FieldToggle label="Job Type" flagKey="show_job_type" flags={flags} onToggle={setFlag}>
                  <OptionPicker value={String(draft.job_type ?? '')} onChange={(v) => set('job_type', v)} options={JOB_TYPES} placeholder="Select job type" />
                </FieldToggle>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
