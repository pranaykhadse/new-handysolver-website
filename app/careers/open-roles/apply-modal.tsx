'use client';

import { useState, useRef, useEffect, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Upload, User, UserRound, Mail, Phone, MapPin, Briefcase, IndianRupee, Megaphone, FileText, Link2, Calendar, Type, Hash, AlignLeft } from 'lucide-react';
import { jobIconFor } from '@/lib/job-icons';
import { getSupabase } from '@/lib/supabase';
import { BUILTIN_API_KEYS, DEFAULT_FORM_CONFIG, fieldMaxLength, validateField, type FormConfig, type FormField } from '@/lib/application-form';

// Job applications are saved by the myhandydash backend (its own database),
// not Supabase — same endpoint + field contract as the live applicant form.
const APPLICANT_SUBMIT_URL =
  process.env.NEXT_PUBLIC_APPLICANT_SUBMIT_URL ??
  'https://handysolver.myhandydash.com/api/web/v1/handy-recruiters/applicant-form-submit';
const MAX_CV_BYTES = 10 * 1024 * 1024;

// The form layout comes from the admin. Fetched once per page load and shared,
// so starting the fetch early (see prefetchApplicationForm) avoids any wait.
let cachedConfig: FormConfig | null = null;
let inflight: Promise<FormConfig> | null = null;

export function prefetchApplicationForm(): Promise<FormConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  inflight ??= fetch('/api/application-form')
    .then(async r => {
      const data = r.ok ? await r.json() : null;
      if (!data?.config?.fields) throw new Error('bad config');
      cachedConfig = data.config as FormConfig;
      return cachedConfig;
    })
    .catch(() => DEFAULT_FORM_CONFIG)
    .finally(() => { inflight = null; });
  return inflight;
}

type IconType = ComponentType<{ size?: number | string; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
const BUILTIN_ICONS: Record<string, IconType> = {
  firstName: User, lastName: User, email: Mail, phone: Phone, location: MapPin, gender: UserRound,
  experience: Briefcase, currentSalary: IndianRupee, expectedSalary: IndianRupee, hearAbout: Megaphone,
};
const TYPE_ICONS: Record<string, IconType> = {
  text: Type, email: Mail, tel: Phone, number: Hash, url: Link2, date: Calendar, select: AlignLeft, textarea: AlignLeft,
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The recruiting API reports per-field errors under `details`, keyed by its own
// column names. Map them back to the form fields so the real reason is shown.
const SERVER_FIELD_IDS: Record<string, string> = {
  name: 'firstName', first_name: 'firstName', last_name: 'lastName',
  mobile: 'phone', phone: 'phone', email: 'email', location: 'location',
  gender: 'gender', dob: 'dob', exp: 'experience', experience: 'experience',
  salary: 'expectedSalary', expected_ctc: 'expectedSalary', current_ctc: 'currentSalary', hear: 'hearAbout',
};

export function ApplyModal({ jobTitle, onClose }: { jobTitle: string; onClose: () => void }) {
  const [config, setConfig] = useState<FormConfig | null>(cachedConfig);
  const [values, setValues] = useState<Record<string, string>>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'submitting'|'done'|'error'>('idle');
  const [serverMsg, setServerMsg] = useState('');
  // Keyed by DOM id (e.g. am-lastName, am-dob-day) so every field can show its own error.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dobParts, setDobParts] = useState({ y: '', m: '', d: '' });
  const overlayRef = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    let live = true;
    if (!config) prefetchApplicationForm().then(c => { if (live) setConfig(c); });
    return () => { live = false; };
  }, [config]);

  useEffect(() => {
    if (!config || focused.current) return;
    focused.current = true;
    overlayRef.current?.querySelector<HTMLElement>('.am-form input:not([type=file]), .am-form select, .am-form textarea')?.focus({ preventScroll: true });
  }, [config]);

  useEffect(() => {
    const scrollY = window.scrollY;
    // Pin the overlay exactly below the sticky navbar (measured live, not guessed)
    const updateTop = () => {
      const nav = document.querySelector('.hn-shell');
      const h = nav ? Math.ceil(nav.getBoundingClientRect().height) : 89;
      overlayRef.current?.style.setProperty('--am-top', `${h}px`);
    };
    updateTop();
    const nav = document.querySelector('.hn-shell');
    const ro = nav ? new ResizeObserver(updateTop) : null;
    if (nav && ro) ro.observe(nav);
    // Freeze the background at current scroll position
    document.body.style.overflow = 'hidden';
    // Remove will-change:transform from page wrapper so position:fixed uses the viewport
    const main = document.querySelector<HTMLElement>('main.hp-wrap');
    const prevWillChange = main?.style.willChange ?? '';
    const prevTransform = main?.style.transform ?? '';
    if (main) { main.style.willChange = 'auto'; main.style.transform = 'none'; }
    return () => {
      ro?.disconnect();
      document.body.style.overflow = '';
      if (main) { main.style.willChange = prevWillChange; main.style.transform = prevTransform; }
      window.scrollTo(0, scrollY);
    };
  }, []);

  const visible = (config?.fields ?? []).filter(field => field.visible);
  const sections = (config?.sections ?? [])
    .map(section => ({ ...section, fields: visible.filter(field => field.section === section.id) }))
    .filter(section => section.fields.length > 0);
  const requiredFields = visible.filter(field => field.required);
  const isFilled = (field: FormField) => field.type === 'file' ? Boolean(cvFile) : (values[field.id] ?? '').trim() !== '';
  const filled = requiredFields.filter(isFilled).length;

  const val = (id: string) => values[id] ?? '';
  const clearError = (...ids: string[]) => setFieldErrors(errors => {
    const next = { ...errors };
    for (const id of ids) delete next[id];
    return next;
  });
  const setVal = (id: string, value: string) => {
    clearError(`am-${id}`, 'am-dob-day');
    setServerMsg('');
    if (status === 'error') setStatus('idle');
    setValues(v => ({ ...v, [id]: value }));
  };

  const updateDob = (id: string, next: { y: string; m: string; d: string }) => {
    const daysInMonth = next.y && next.m ? new Date(Number(next.y), Number(next.m), 0).getDate() : 31;
    const parts = { ...next, d: next.d && Number(next.d) > daysInMonth ? '' : next.d };
    setDobParts(parts);
    setVal(id, parts.y && parts.m && parts.d ? `${parts.y}-${parts.m}-${parts.d}` : '');
  };

  const thisYear = new Date().getFullYear();
  const birthYears = Array.from({ length: 63 }, (_, i) => String(thisYear - 18 - i));
  const dayCount = dobParts.y && dobParts.m ? new Date(Number(dobParts.y), Number(dobParts.m), 0).getDate() : 31;
  const RoleIcon = jobIconFor(null, jobTitle);

  // Every problem with the form, in the order fields appear on screen.
  const collectProblems = (): { field: string; message: string }[] => {
    const problems: { field: string; message: string }[] = [];
    for (const section of sections) {
      for (const field of section.fields) {
        const id = field.type === 'dob' ? 'am-dob-day' : `am-${field.id}`;
        if (field.type === 'file') {
          if (!cvFile) { if (field.required) problems.push({ field: id, message: 'Please attach your CV (PDF, DOC or DOCX).' }); continue; }
          const ext = cvFile.name.split('.').pop()?.toLowerCase() ?? '';
          if (!['pdf', 'doc', 'docx'].includes(ext)) { problems.push({ field: id, message: 'CV must be a PDF, DOC or DOCX file.' }); continue; }
          if (cvFile.size > MAX_CV_BYTES) { problems.push({ field: id, message: 'Your CV must be 10 MB or smaller.' }); continue; }
          continue;
        }
        const message = validateField(field, val(field.id));
        if (message) problems.push({ field: id, message });
      }
    }
    return problems;
  };

  // Turns the API's `details` errors into a message + the field to focus.
  const serverProblem = (data: { details?: unknown } | null): { field: string; message: string } | null => {
    const details = data?.details;
    if (!details || typeof details !== 'object') return null;
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      const text = Array.isArray(value)
        ? value.find((item): item is string => typeof item === 'string')
        : typeof value === 'string' ? value : '';
      if (!text) continue;
      const field = visible.find(item => item.id === SERVER_FIELD_IDS[key]);
      if (!field) return { field: '', message: text };
      return { field: field.type === 'dob' ? 'am-dob-day' : `am-${field.id}`, message: `${field.label}: ${text}` };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMsg('');
    const problems = collectProblems();
    if (problems.length) {
      setFieldErrors(Object.fromEntries(problems.map(problem => [problem.field, problem.message])));
      setServerMsg(problems[0].message);
      setStatus('error');
      document.getElementById(problems[0].field)?.focus();
      return;
    }
    // collectProblems covers this; kept as a type guard for the upload below.
    if (!cvFile) return;
    const ext = cvFile.name.split('.').pop()?.toLowerCase() ?? '';
    setStatus('submitting');
    // Fields the admin hid are sent empty (numbers as 0, which the recruiting
    // system expects), so its fixed contract still holds.
    const NUMERIC_KEYS = new Set(['exp', 'salary', 'current_ctc']);
    const core: Record<string, string> = {};
    for (const [id, apiKey] of Object.entries(BUILTIN_API_KEYS)) {
      const field = visible.find(item => item.id === id);
      const value = field ? val(id).trim() : '';
      core[apiKey] = value === '' && NUMERIC_KEYS.has(apiKey) ? '0' : value;
    }
    const extra = visible
      .filter(field => !field.builtin)
      .map(field => ({ label: field.label, value: val(field.id).trim() }))
      .filter(item => item.value !== '');

    // Multipart POST to myhandydash — field names must match
    // HandyRecruiterController::actionApplicantFormSubmit ($_POST/$_FILES).
    // No custom headers: multipart/form-data is CORS-safelisted, so no preflight.
    try {
      const fd = new FormData();
      fd.append('type', jobTitle);
      for (const [key, value] of Object.entries(core)) fd.append(key, value);
      fd.append('attachment', cvFile, cvFile.name);
      const res = await fetch(APPLICANT_SUBMIT_URL, { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);
      // NOTE: the API answers HTTP 200 even on validation failure —
      // success is data.status === 1, not res.ok.
      if (res.ok && data && Number(data.status) === 1) {
        setServerMsg(typeof data.message === 'string' ? data.message : '');
        // Silent mirror to Supabase (own database): back up the CV file to
        // private storage, then save the row with its path. Best-effort by
        // design — any failure here must never reach the applicant.
        try {
          let cvPath = '';
          try {
            const cvName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: upError } = await getSupabase().storage
              .from('application-cvs')
              .upload(cvName, cvFile, { contentType: cvFile.type || undefined, upsert: false });
            if (!upError) cvPath = cvName;
          } catch {
            // Storage unavailable (bucket/policy missing) — row still saves.
          }
          const mirror: Record<string, string> = {};
          for (const [id, apiKey] of Object.entries(BUILTIN_API_KEYS)) mirror[apiKey] = visible.some(item => item.id === id) ? val(id).trim() : '';
          await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: jobTitle, ...mirror, cv_filename: cvFile.name, cv_path: cvPath, extra }),
          }).catch(() => null);
        } catch {
          // Silent by design — myhandydash already saved the application.
        }
        setStatus('done');
      } else {
        const detail = serverProblem(data);
        setServerMsg(
          detail?.message
          || (data && typeof data.message === 'string' && data.message
            ? data.message
            : 'Something went wrong. Please try again.')
        );
        if (detail?.field) setFieldErrors({ [detail.field]: detail.message });
        setStatus('error');
      }
    } catch {
      setServerMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const invalid = (id: string) => (fieldErrors[id] ? true : undefined);
  const star = (field: FormField) => field.required ? <> <span className="am-star" aria-hidden="true">*</span></> : null;

  const renderField = (field: FormField) => {
    const id = `am-${field.id}`;
    const Icon = BUILTIN_ICONS[field.id] ?? TYPE_ICONS[field.type];
    const common = { id, 'aria-invalid': invalid(id), required: field.required, placeholder: field.placeholder || undefined, maxLength: fieldMaxLength(field) };
    let control: React.ReactNode;

    switch (field.type) {
      case 'dob':
        control = (
          <div className="am-dob" role="group" aria-label={field.label}>
            <select id="am-dob-day" aria-label="Day" aria-invalid={invalid('am-dob-day')} autoComplete="bday-day" value={dobParts.d} onChange={e => updateDob(field.id, { ...dobParts, d: e.target.value })}>
              <option value="">Day</option>
              {Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, '0')).map(day => <option key={day} value={day}>{Number(day)}</option>)}
            </select>
            <select id="am-dob-month" aria-label="Month" aria-invalid={invalid('am-dob-day')} autoComplete="bday-month" value={dobParts.m} onChange={e => updateDob(field.id, { ...dobParts, m: e.target.value })}>
              <option value="">Month</option>
              {MONTHS.map((name, i) => <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>)}
            </select>
            <select id="am-dob-year" aria-label="Year" aria-invalid={invalid('am-dob-day')} autoComplete="bday-year" value={dobParts.y} onChange={e => updateDob(field.id, { ...dobParts, y: e.target.value })}>
              <option value="">Year</option>
              {birthYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        );
        break;
      case 'file':
        control = (
          <label className="am-file-label" htmlFor={id} data-filled={cvFile ? 'true' : 'false'}>
            {cvFile ? <FileText size={18}/> : <Upload size={18}/>}
            <span className="am-file-text">
              <strong>{cvFile ? cvFile.name : 'Choose your CV'}</strong>
              <small>{cvFile ? 'Click to choose a different file' : (field.placeholder || 'PDF, DOC or DOCX')}</small>
            </span>
            <input id={id} required type="file" accept=".pdf,.doc,.docx" onChange={e => { setCvFile(e.target.files?.[0] ?? null); clearError('am-cv'); setServerMsg(''); if (status === 'error') setStatus('idle'); }}/>
          </label>
        );
        break;
      case 'select':
        control = (
          <div className="am-control">{Icon && <Icon size={16} className="am-icon" aria-hidden="true"/>}
            <select id={id} aria-invalid={invalid(id)} required={field.required} value={val(field.id)} onChange={e => setVal(field.id, e.target.value)}>
              <option value="">{field.placeholder || 'Choose one'}</option>
              {field.options.map(option => <option key={option}>{option}</option>)}
            </select>
          </div>
        );
        break;
      case 'textarea':
        control = <textarea {...common} rows={4} value={val(field.id)} onChange={e => setVal(field.id, e.target.value)}/>;
        break;
      case 'checkbox':
        control = (
          <label className="am-check" htmlFor={id}>
            <input id={id} type="checkbox" aria-invalid={invalid(id)} checked={val(field.id) === 'yes'} onChange={e => setVal(field.id, e.target.checked ? 'yes' : '')}/>
            <span>{field.placeholder || field.label}</span>
          </label>
        );
        break;
      default: {
        const numeric = field.type === 'number';
        control = (
          <div className="am-control">{Icon && <Icon size={16} className="am-icon" aria-hidden="true"/>}
            <input {...common} type={field.type === 'date' ? 'date' : field.type} inputMode={numeric ? 'numeric' : undefined} min={numeric ? '0' : undefined}
              autoComplete={({ firstName: 'given-name', lastName: 'family-name', email: 'email', phone: 'tel', location: 'address-level2' } as Record<string, string>)[field.id]}
              value={val(field.id)} onChange={e => setVal(field.id, e.target.value)}/>
          </div>
        );
      }
    }

    return (
      <div className={`am-field${field.wide ? ' am-wide' : ''}`} key={field.id}>
        <label htmlFor={field.type === 'dob' ? 'am-dob-day' : id}>{field.label}{star(field)}</label>
        {control}
        {(fieldErrors[field.type === 'dob' ? 'am-dob-day' : id]) && (
          <small className="am-help am-field-error" role="alert">{fieldErrors[field.type === 'dob' ? 'am-dob-day' : id]}</small>
        )}
        {field.help && <small className="am-help">{field.help}</small>}
      </div>
    );
  };

  return createPortal(
    <div className="am-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()} role="dialog" aria-modal="true" aria-labelledby="am-title">
      <div className="am-card">
        <div className="am-header">
          {RoleIcon && <span className="am-role-icon" aria-hidden="true"><RoleIcon size={22}/></span>}
          <div className="am-header-text">
            <p className="am-overline">Applying for</p>
            <h2 id="am-title">{jobTitle}</h2>
          </div>
          <button className="am-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
          <div className="am-progress" role="progressbar" aria-label="Form progress" aria-valuemin={0} aria-valuemax={requiredFields.length} aria-valuenow={filled}>
            <span style={{ width: `${requiredFields.length ? (filled / requiredFields.length) * 100 : 0}%` }}/>
          </div>
        </div>

        {status === 'done' ? (
          <div className="am-done">
            <span className="am-done-icon"><Check size={28}/></span>
            <h3>Thanks{val('firstName').trim() ? `, ${val('firstName').trim()}` : ''}. We’ve got it.</h3>
            <p>{serverMsg || <>Your application for <strong>{jobTitle}</strong> is with the team. We’ll get back to you once we’ve had a look.</>}</p>
            <button className="am-submit" onClick={onClose}>Back to roles</button>
          </div>
        ) : !config ? (
          <div className="am-form"><div className="am-body"><p className="am-loading" aria-busy="true">Getting the form ready…</p></div></div>
        ) : (
          <form className="am-form" onSubmit={handleSubmit} noValidate>
            <div className="am-body">
              {requiredFields.length > 0 && <p className="am-legend"><span className="am-star" aria-hidden="true">*</span> marks a required field</p>}
              {sections.map(section => (
                <section className="am-section" key={section.id} aria-labelledby={`am-sec-${section.id}`}>
                  <h3 id={`am-sec-${section.id}`} className="am-section-title">{section.title}</h3>
                  <div className="am-grid">{section.fields.map(renderField)}</div>
                </section>
              ))}
            </div>

            <div className="am-footer">
              {status === 'error'
                ? <p className="am-error" role="alert">{
                    Object.keys(fieldErrors).length > 1
                      ? 'Please fix the highlighted fields.'
                      : (serverMsg || 'Something went wrong. Please try again.')
                  }</p>
                : <p className="am-note">{requiredFields.length > 0 ? <><span className="am-star" aria-hidden="true">*</span> Required &middot; {filled} of {requiredFields.length} done</> : 'Everything here is optional'}</p>}
              <button type="submit" className="am-submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : 'Send application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
