'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react';
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

  // Move a field up/down among the fields of its own section.
  const moveField = (id: string, dir: -1 | 1) => setConfig(c => {
    const field = c.fields.find(f => f.id === id);
    if (!field) return c;
    const mates = c.fields.filter(f => f.section === field.section);
    const at = mates.findIndex(f => f.id === id);
    const other = mates[at + dir];
    if (!other) return c;
    const next = [...c.fields];
    const a = next.findIndex(f => f.id === id), b = next.findIndex(f => f.id === other.id);
    [next[a], next[b]] = [next[b], next[a]];
    return { ...c, fields: next };
  });

  const moveSection = (id: string, dir: -1 | 1) => setConfig(c => {
    const at = c.sections.findIndex(s => s.id === id);
    const to = at + dir;
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

  const reset = () => { setConfig(DEFAULT_FORM_CONFIG); setOpenId(null); toast('Default layout restored. Click Save to apply it.'); };

  if (loading) return <p className="adm-loading">Loading...</p>;

  const visibleCount = config.fields.filter(f => f.visible).length;
  const requiredCount = config.fields.filter(f => f.visible && f.required).length;

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

      <div className="fb-intro">
        <h3>Design the apply form</h3>
        <p>This is the form people fill in when they apply for a role. Each row below is one question. Use the arrows to change the order, tick <b>Required</b> to make it compulsory, and switch a question to <b>Hidden</b> to take it off the form.</p>
      </div>

      <div className="fb-bar">
        <p className="fb-summary"><b>{visibleCount}</b> questions on the form · <b>{requiredCount}</b> required{dirty ? ' · you have unsaved changes' : ''}</p>
        <div className="fb-bar-actions">
          <button className="adm-btn adm-btn-ghost" onClick={reset} title="Restore the original layout"><RotateCcw size={13} /> Reset to original</button>
          <button className="adm-btn adm-btn-primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : dirty ? 'Save changes' : 'All saved'}</button>
        </div>
      </div>

      {config.sections.map((section, si) => {
        const fields = config.fields.filter(f => f.section === section.id);
        return (
          <section className="fb-section" key={section.id}>
            <div className="fb-section-head">
              <span className="fb-step">{si + 1}</span>
              <div className="fb-section-name"><label>Section heading</label>
                <input className="adm-input fb-section-title" value={section.title} maxLength={60} aria-label="Section heading" onChange={e => patchSection(section.id, { title: e.target.value })} /></div>
              <div className="fb-icons" aria-label="Section actions">
                <button className="adm-icon-btn" aria-label="Move section up" title="Move section up" disabled={si === 0} onClick={() => moveSection(section.id, -1)}><ArrowUp size={14} /></button>
                <button className="adm-icon-btn" aria-label="Move section down" title="Move section down" disabled={si === config.sections.length - 1} onClick={() => moveSection(section.id, 1)}><ArrowDown size={14} /></button>
                <button className="adm-icon-btn delete" aria-label="Delete section" title={config.sections.length < 2 ? 'The form needs at least one section' : 'Delete section (its questions move to another section)'} disabled={config.sections.length < 2} onClick={() => removeSection(section.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            {fields.length > 0 && <div className="fb-cols" aria-hidden="true"><span>Order</span><span>Question</span><span>Required</span><span>On form</span><span /></div>}

            {fields.length === 0 && <p className="fb-empty">No fields in this section. It won’t show on the form.</p>}
            {fields.map((field, fi) => {
              const locked = LOCKED_FIELDS.includes(field.id);
              const open = openId === field.id;
              return (
                <div className="fb-field" key={field.id} data-hidden={field.visible ? 'false' : 'true'}>
                  <div className="fb-field-row">
                    <div className="fb-icons">
                      <button className="adm-icon-btn" aria-label={`Move ${field.label} up`} title="Move up" disabled={fi === 0} onClick={() => moveField(field.id, -1)}><ArrowUp size={14} /></button>
                      <button className="adm-icon-btn" aria-label={`Move ${field.label} down`} title="Move down" disabled={fi === fields.length - 1} onClick={() => moveField(field.id, 1)}><ArrowDown size={14} /></button>
                    </div>
                    <div className="fb-field-main">
                      <strong>{field.label}</strong>
                      <span><i className="fb-badge">{typeLabel(field)}</i>{!field.builtin && <i className="fb-badge fb-badge-custom">Your question</i>}{field.wide && <i className="fb-badge">Full row</i>}</span>
                    </div>
                    <label className="fb-check" title={locked ? 'Always required' : undefined}>
                      <input type="checkbox" checked={field.required} disabled={locked || !field.visible} onChange={e => patchField(field.id, { required: e.target.checked })} />
                      <span className="fb-mobile-label">Required</span>
                    </label>
                    {locked
                      ? <span className="fb-switch" data-on="true" data-locked="true" title="This question is always shown"><Lock size={12} /> Always on</span>
                      : <button className="fb-switch" data-on={field.visible ? 'true' : 'false'} role="switch" aria-checked={field.visible}
                          aria-label={`Show ${field.label} on the form`} onClick={() => patchField(field.id, { visible: !field.visible })}>
                          <i />{field.visible ? 'Shown' : 'Hidden'}
                        </button>}
                    <button className="fb-editbtn" onClick={() => setOpenId(open ? null : field.id)} aria-expanded={open}>{open ? 'Close' : 'Edit'} {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
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
                      <div className="adm-field-2">
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
                      {field.builtin
                        ? <p className="fb-hint">Built-in field: it feeds the recruiting system, so its type is fixed.{field.id === 'cv' && ' The CV is always required.'}</p>
                        : <button className="adm-btn adm-btn-danger" onClick={() => removeField(field.id)}><Trash2 size={13} /> Delete this question</button>}
                    </div>
                  )}
                </div>
              );
            })}
            <button className="fb-add" onClick={() => addField(section.id)}><Plus size={13} /> Add a question</button>
          </section>
        );
      })}

      <button className="adm-btn adm-btn-ghost" onClick={addSection}><Plus size={13} /> Add section</button>
      <p className="fb-hint">Hidden built-in fields are sent to the recruiting system empty (numbers as 0). Answers to your own questions are saved with the application here in the admin.</p>
    </div>
  );
}
