'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ChevronUp, ChevronsDownUp, ChevronsUpDown, GripVertical, Lock, PencilLine, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { CUSTOM_TYPES, DEFAULT_FORM_CONFIG, LOCKED_FIELDS, type FormConfig, type FormField, type FormSection } from '@/lib/application-form';

type Api = (route: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json: any }>;

const SETUP_SQL = `create table if not exists application_form_config (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz default now()
);
alter table application_form_config enable row level security;
alter table job_applications add column if not exists extra jsonb;`;

const typeLabel = (field: FormField) =>
  field.type === 'dob' ? 'Date of birth' : field.type === 'file' ? 'File upload' : CUSTOM_TYPES.find(t => t.value === field.type)?.label ?? field.type;

const uid = () => Math.random().toString(36).slice(2, 8);

export default function FormBuilder({ api }: { api: Api }) {
  const [config, setConfig] = useState<FormConfig>(DEFAULT_FORM_CONFIG);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: 'field' | 'section'; id: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const toggleSection = (id: string) => setCollapsed(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]));

  useEffect(() => {
    let live = true;
    api('/api/admin/application-form').then(res => {
      if (!live) return;
      setLoading(false);
      if (res.ok && res.json?.config) {
        setConfig(res.json.config);
        setSaved(JSON.stringify(res.json.config));
        setNeedsSetup(Boolean(res.json.needsSetup));
      } else toast.error('Could not load the form layout');
    });
    return () => { live = false; };
  }, [api]);

  const dirty = JSON.stringify(config) !== saved;
  const patchField = (id: string, patch: Partial<FormField>) =>
    setConfig(c => ({ ...c, fields: c.fields.map(f => (f.id === id ? { ...f, ...patch } : f)) }));
  const patchSection = (id: string, patch: Partial<FormSection>) =>
    setConfig(c => ({ ...c, sections: c.sections.map(s => (s.id === id ? { ...s, ...patch } : s)) }));

  // Drop a field before another one (it joins that field's section), or a section before another.
  const dropOn = (targetId: string) => {
    if (!drag || drag.id === targetId) return;
    setConfig(c => {
      if (drag.kind === 'section') {
        const from = c.sections.findIndex(s => s.id === drag.id), to = c.sections.findIndex(s => s.id === targetId);
        if (from < 0 || to < 0) return c;
        const next = [...c.sections];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return { ...c, sections: next };
      }
      const moved = c.fields.find(f => f.id === drag.id);
      if (!moved) return c;
      if (c.sections.some(sec => sec.id === targetId)) return { ...c, fields: [...c.fields.filter(f => f.id !== drag.id), { ...moved, section: targetId }] };
      const target = c.fields.find(f => f.id === targetId);
      if (!target) return c;
      const rest = c.fields.filter(f => f.id !== drag.id);
      rest.splice(rest.findIndex(f => f.id === targetId), 0, { ...moved, section: target.section });
      return { ...c, fields: rest };
    });
  };

  // Arrow buttons: for touch screens, where dragging isn't available.
  const nudgeField = (id: string, dir: -1 | 1) => setConfig(c => {
    const field = c.fields.find(f => f.id === id);
    if (!field) return c;
    const mates = c.fields.filter(f => f.section === field.section);
    const other = mates[mates.findIndex(f => f.id === id) + dir];
    if (!other) return c;
    const next = [...c.fields];
    const a = next.findIndex(f => f.id === id), b = next.findIndex(f => f.id === other.id);
    [next[a], next[b]] = [next[b], next[a]];
    return { ...c, fields: next };
  });
  const nudgeSection = (id: string, dir: -1 | 1) => setConfig(c => {
    const at = c.sections.findIndex(s => s.id === id), to = at + dir;
    if (to < 0 || to >= c.sections.length) return c;
    const next = [...c.sections];
    [next[at], next[to]] = [next[to], next[at]];
    return { ...c, sections: next };
  });

  const addSection = () => setConfig(c => ({ ...c, sections: [...c.sections, { id: `s_${uid()}`, title: 'New section' }] }));

  const removeSection = (id: string) => setConfig(c => {
    if (c.sections.length < 2) return c;
    const fallback = c.sections.find(s => s.id !== id)!.id;
    return { sections: c.sections.filter(s => s.id !== id), fields: c.fields.map(f => (f.section === id ? { ...f, section: fallback } : f)) };
  });

  const addField = (section: string) => {
    const id = `c_${uid()}`;
    setConfig(c => ({ ...c, fields: [...c.fields, { id, builtin: false, type: 'text', label: 'New question', placeholder: '', help: '', required: false, visible: true, section, wide: false, options: [] }] }));
    setOpenId(id);
  };

  const removeField = (id: string) => setConfig(c => ({ ...c, fields: c.fields.filter(f => f.id !== id) }));

  const save = async () => {
    setSaving(true);
    const res = await api('/api/admin/application-form', { method: 'PUT', body: JSON.stringify({ config }) });
    setSaving(false);
    if (res.ok) {
      const next = res.json?.config ?? config;
      setConfig(next);
      setSaved(JSON.stringify(next));
      setNeedsSetup(false);
      toast.success('Form saved. It goes live on the site within about 20 seconds.');
    } else {
      const msg = String(res.json?.error ?? '');
      if (/application_form_config|42P01|PGRST205/.test(msg)) { setNeedsSetup(true); toast.error('Run the setup SQL below first, then save again.'); }
      else toast.error(msg || 'Could not save the form');
    }
  };

  const reset = () => { setConfig(DEFAULT_FORM_CONFIG); setOpenId(null); toast('Original layout restored. Click Save to apply it.'); };

  if (loading) return <p className="adm-loading">Loading...</p>;

  const visibleCount = config.fields.filter(f => f.visible).length;
  const requiredCount = config.fields.filter(f => f.visible && f.required).length;
  const dragProps = (kind: 'field' | 'section', id: string) => ({
    draggable: true,
    'data-dragging': drag?.id === id ? 'true' : 'false',
    'data-drag-over': over === id && drag?.id !== id && (drag?.kind === kind || (kind === 'section' && drag?.kind === 'field')) ? 'true' : 'false',
    onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setDrag({ kind, id }); },
    onDragEnter: () => (drag?.kind === kind || (kind === 'section' && drag?.kind === 'field')) && setOver(id),
    onDragOver: (e: React.DragEvent) => { if (drag?.kind === kind || (kind === 'section' && drag?.kind === 'field')) e.preventDefault(); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dropOn(id); setDrag(null); setOver(null); },
    onDragEnd: () => { setDrag(null); setOver(null); },
  });

  return (
    <div className="fb">
      {needsSetup && (
        <div className="fb-notice">
          <strong>One-time setup needed</strong>
          <p>Saving needs a small table in Supabase. Open the SQL editor for your Handysolver project, run this once, then come back and save.</p>
          <pre>{SETUP_SQL}</pre>
          <button className="adm-btn adm-btn-ghost" onClick={() => navigator.clipboard?.writeText(SETUP_SQL).then(() => toast.success('SQL copied'))}>Copy SQL</button>
        </div>
      )}

      <div className="fb-toolbar">
        <p className="fb-summary">Drag to reorder questions on the Open roles apply form. {visibleCount} shown, {requiredCount} required{dirty ? ' · unsaved changes' : ''}.</p>
        <div className="fb-bar-actions">
          <button className="adm-btn adm-btn-ghost" onClick={() => setCollapsed(collapsed.length === config.sections.length ? [] : config.sections.map(x => x.id))} title="Collapse or expand all sections">{collapsed.length === config.sections.length ? <><ChevronsUpDown size={13} /> Expand all</> : <><ChevronsDownUp size={13} /> Collapse all</>}</button>
          <button className="adm-add-btn" onClick={addSection}><Plus size={13} /> Add section</button>
          <button className="adm-btn adm-btn-ghost" onClick={reset} title="Restore the original layout"><RotateCcw size={13} /> Reset</button>
          <button className="adm-btn adm-btn-primary" onClick={save} disabled={!dirty || saving}><Save size={13} /> {saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {config.sections.map((section, si) => {
        const fields = config.fields.filter(f => f.section === section.id);
        const isOpen = !collapsed.includes(section.id) && drag?.kind !== 'section';
        return (
          <div className="fb-group" key={section.id}>
            <div className="adm-row fb-section-row" {...dragProps('section', section.id)}>
              <span className="adm-drag-handle" title="Drag to reorder section"><GripVertical size={14} /></span>
              <button className="adm-icon-btn" aria-label={isOpen ? 'Collapse section' : 'Expand section'} aria-expanded={isOpen} title={isOpen ? 'Collapse' : 'Expand'} onClick={() => toggleSection(section.id)}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <span className="adm-order-badge">{si + 1}</span>
              <input className="adm-input fb-section-input" value={section.title} maxLength={60} aria-label="Section heading" onChange={e => patchSection(section.id, { title: e.target.value })} onDragStart={e => e.preventDefault()} draggable={false} />
              <span className="fb-count">{fields.length} {fields.length === 1 ? 'question' : 'questions'}</span>
              <div className="adm-row-actions">
                <span className="fb-arrows">
                  <button className="adm-icon-btn" aria-label="Move section up" disabled={si === 0} onClick={() => nudgeSection(section.id, -1)}><ArrowUp size={14} /></button>
                  <button className="adm-icon-btn" aria-label="Move section down" disabled={si === config.sections.length - 1} onClick={() => nudgeSection(section.id, 1)}><ArrowDown size={14} /></button>
                </span>
                <button className="adm-icon-btn delete" aria-label="Delete section" title={config.sections.length < 2 ? 'The form needs at least one section' : 'Delete section (its questions move to another section)'} disabled={config.sections.length < 2} onClick={() => removeSection(section.id)}><Trash2 size={14} /></button>
              </div>
            </div>

            {isOpen && <div className="fb-fields">
              {fields.length === 0 && <p className="adm-empty">No questions in this section, so it won’t show on the form.</p>}
              {fields.map((field, fi) => {
                const locked = LOCKED_FIELDS.includes(field.id);
                const open = openId === field.id;
                return (
                  <div className="fb-item" key={field.id}>
                    <div className="adm-row" {...dragProps('field', field.id)} style={field.visible ? undefined : { opacity: 0.6 }}>
                      <span className="adm-drag-handle" title="Drag to reorder"><GripVertical size={14} /></span>
                      <span className="adm-order-badge">{fi + 1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="adm-row-name">{field.label}</p>
                        <p className="adm-row-meta">{typeLabel(field)}{field.builtin ? '' : ' · your question'}{field.wide ? ' · full row' : ''}</p>
                      </div>
                      <label className="adm-toggle" title={locked ? 'Always required' : field.required ? 'Required — click to make optional' : 'Optional — click to make required'}>
                        <input type="checkbox" checked={field.required} disabled={locked || !field.visible} onChange={e => patchField(field.id, { required: e.target.checked })} />
                        <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
                        <span className="adm-toggle-label" style={{ minWidth: 52, fontSize: 10 }}>{field.required ? 'Required' : 'Optional'}</span>
                      </label>
                      <label className="adm-toggle" title={locked ? 'Always shown' : field.visible ? 'Shown on the form — click to hide' : 'Hidden from the form — click to show'}>
                        <input type="checkbox" checked={field.visible} disabled={locked} onChange={e => patchField(field.id, { visible: e.target.checked })} />
                        <span className="adm-toggle-track"><span className="adm-toggle-thumb" /></span>
                        <span className="adm-toggle-label" style={{ minWidth: 36, fontSize: 10 }}>{locked ? <Lock size={10} /> : field.visible ? 'Show' : 'Hide'}</span>
                      </label>
                      <div className="adm-row-actions">
                        <span className="fb-arrows">
                          <button className="adm-icon-btn" aria-label={`Move ${field.label} up`} disabled={fi === 0} onClick={() => nudgeField(field.id, -1)}><ArrowUp size={14} /></button>
                          <button className="adm-icon-btn" aria-label={`Move ${field.label} down`} disabled={fi === fields.length - 1} onClick={() => nudgeField(field.id, 1)}><ArrowDown size={14} /></button>
                        </span>
                        <button className="adm-icon-btn" aria-label={`Edit ${field.label}`} aria-expanded={open} title="Edit question" onClick={() => setOpenId(open ? null : field.id)}>{open ? <ChevronUp size={14} /> : <PencilLine size={14} />}</button>
                        {!field.builtin && <button className="adm-icon-btn delete" aria-label={`Delete ${field.label}`} title="Delete question" onClick={() => removeField(field.id)}><Trash2 size={14} /></button>}
                      </div>
                    </div>

                    {open && (
                      <div className="fb-edit">
                        <div className="adm-field"><label className="adm-label">Label</label>
                          <input className="adm-input" value={field.label} maxLength={120} onChange={e => patchField(field.id, { label: e.target.value })} /></div>
                        {field.type !== 'dob' && (
                          <div className="adm-field"><label className="adm-label">{field.type === 'checkbox' ? 'Text next to the tick box' : 'Placeholder'}</label>
                            <input className="adm-input" value={field.placeholder} maxLength={120} onChange={e => patchField(field.id, { placeholder: e.target.value })} /></div>
                        )}
                        <div className="adm-field"><label className="adm-label">Help text (small note under the field)</label>
                          <input className="adm-input" value={field.help} maxLength={200} onChange={e => patchField(field.id, { help: e.target.value })} /></div>
                        {field.type === 'select' && (
                          <div className="adm-field"><label className="adm-label">Dropdown options (one per line)</label>
                            <textarea className="adm-textarea" rows={Math.min(8, Math.max(3, field.options.length + 1))} defaultValue={field.options.join('\n')}
                              onChange={e => patchField(field.id, { options: e.target.value.split('\n').map(o => o.trim()).filter(Boolean).slice(0, 30) })} /></div>
                        )}
                        <div className="fb-edit-grid">
                          {!field.builtin && (
                            <div className="adm-field"><label className="adm-label">Type</label>
                              <select className="adm-select" value={field.type} onChange={e => patchField(field.id, { type: e.target.value as FormField['type'], options: e.target.value === 'select' && field.options.length === 0 ? ['Option 1', 'Option 2'] : field.options, wide: e.target.value === 'textarea' ? true : field.wide })}>
                                {CUSTOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select></div>
                          )}
                          <div className="adm-field"><label className="adm-label">Section</label>
                            <select className="adm-select" value={field.section} onChange={e => patchField(field.id, { section: e.target.value })}>
                              {config.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select></div>
                          <div className="adm-field"><label className="adm-label">Width</label>
                            <select className="adm-select" value={field.wide ? 'full' : 'half'} disabled={field.type === 'textarea' || field.type === 'dob' || field.type === 'file'} onChange={e => patchField(field.id, { wide: e.target.value === 'full' })}>
                              <option value="half">Half (two per row)</option>
                              <option value="full">Full row</option>
                            </select></div>
                        </div>
                        {field.builtin && <p className="adm-empty">Built-in question: it feeds the recruiting system, so its type is fixed.{field.id === 'cv' && ' The CV is always required.'}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
              <button className="adm-add-btn fb-add" onClick={() => addField(section.id)}><Plus size={13} /> Add question</button>
            </div>}
          </div>
        );
      })}

      <p className="adm-empty">Hidden built-in questions are sent to the recruiting system empty (numbers as 0). Answers to your own questions are saved with the application here in the admin.</p>
    </div>
  );
}
