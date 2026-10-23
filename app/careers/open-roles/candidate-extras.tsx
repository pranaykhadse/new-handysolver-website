'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, RotateCw, Smile, Check, Coffee, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getSupabase } from '@/lib/supabase';

const nudges = [
  ['You’re more than', 'a PDF.', 'Your CV is a starting point. Your ideas, questions and experiences bring it to life.'],
  ['Small project.', 'Big you.', 'Think of something you enjoyed making or improving. What did you bring to it?'],
  ['Take a breath.', 'Be yourself.', 'Read the role, get curious, and give yourself a moment to decide.'],
];

// Job applications are saved by the myhandydash backend (its own database),
// not Supabase — same endpoint + field contract as the live applicant form.
const APPLICANT_SUBMIT_URL =
  process.env.NEXT_PUBLIC_APPLICANT_SUBMIT_URL ??
  'https://handysolver.myhandydash.com/api/web/v1/handy-recruiters/applicant-form-submit';

export function CandidateNudge() {
  const [index, setIndex] = useState(0);
  return <aside className="ce-nudge" aria-label="A little encouragement">
    <div className="ce-nudge-top"><span>A LITTLE NUDGE</span><Smile size={30} aria-hidden="true"/></div>
    <div className="ce-nudge-copy" aria-live="polite" key={index}><h2>{nudges[index][0]}<br/><em>{nudges[index][1]}</em></h2><p>{nudges[index][2]}</p></div>
    <div className="ce-nudge-bottom"><span aria-hidden="true">{nudges.map((_,i)=><i key={i} className={i===index?'is-current':''}/>)}</span><Button variant="ghost" onClick={()=>setIndex(i=>(i+1)%nudges.length)}>Another nudge <RotateCw size={14}/></Button></div>
  </aside>;
}

export function ApplyModal({ jobTitle, onClose }: { jobTitle: string; onClose: () => void }) {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', experience:'', expectedSalary:'', currentSalary:'', hearAbout:'', location:'', dob:'', gender:'' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'submitting'|'done'|'error'>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true });
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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMsg('');
    const problem = firstProblem();
    if (problem) {
      setServerMsg(problem.message);
      setStatus('error');
      focusField(problem.field);
      return;
    }
    // The API reads $_FILES['attachment'] unconditionally and only accepts
    // pdf/doc/docx (case-sensitive), so guard both client-side.
    if (!cvFile) {
      setServerMsg('Please attach your CV (PDF, DOC or DOCX).');
      setStatus('error');
      return;
    }
    const ext = cvFile.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setServerMsg('CV must be a PDF, DOC or DOCX file.');
      setStatus('error');
      return;
    }
    setStatus('submitting');
    // Multipart POST to myhandydash — field names must match
    // HandyRecruiterController::actionApplicantFormSubmit ($_POST/$_FILES).
    // No custom headers: multipart/form-data is CORS-safelisted, so no preflight.
    try {
      const fd = new FormData();
      fd.append('type', jobTitle);
      fd.append('fname', form.firstName);
      fd.append('lname', form.lastName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('exp', form.experience);
      fd.append('salary', form.expectedSalary);
      fd.append('current_ctc', form.currentSalary);
      fd.append('hear', form.hearAbout);
      fd.append('location', form.location);
      fd.append('dob', form.dob);
      fd.append('gender', form.gender);
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
          await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: jobTitle,
              fname: form.firstName,
              lname: form.lastName,
              email: form.email,
              phone: form.phone,
              exp: form.experience,
              salary: form.expectedSalary,
              current_ctc: form.currentSalary,
              hear: form.hearAbout,
              location: form.location,
              dob: form.dob,
              gender: form.gender,
              cv_filename: cvFile.name,
              cv_path: cvPath,
            }),
          }).catch(() => null);
        } catch {
          // Silent by design — myhandydash already saved the application.
        }
        setStatus('done');
      } else {
        setServerMsg(
          data && typeof data.message === 'string' && data.message
            ? data.message
            : 'Something went wrong. Please try again.'
        );
        setStatus('error');
      }
    } catch {
      setServerMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const [dobParts, setDobParts] = useState(() => {
    const [y = '', m = '', d = ''] = form.dob.split('-');
    return { y, m, d };
  });

  const updateDob = (next: { y: string; m: string; d: string }) => {
    const daysInMonth = next.y && next.m ? new Date(Number(next.y), Number(next.m), 0).getDate() : 31;
    const day = next.d && Number(next.d) > daysInMonth ? '' : next.d;
    const parts = { ...next, d: day };
    setDobParts(parts);
    setForm(f => ({ ...f, dob: parts.y && parts.m && parts.d ? `${parts.y}-${parts.m}-${parts.d}` : '' }));
  };

  const thisYear = new Date().getFullYear();
  const birthYears = Array.from({ length: 55 }, (_, i) => String(thisYear - 16 - i));
  const dayCount = dobParts.y && dobParts.m ? new Date(Number(dobParts.y), Number(dobParts.m), 0).getDate() : 31;

  // Returns the first problem with the form, or null. Fields are checked in the order they appear.
  const firstProblem = (): { field: string; message: string } | null => {
    const digits = form.phone.replace(/\D/g, '');
    const money = (value: string) => value.trim() !== '' && Number(value) >= 0;
    if (!form.firstName.trim()) return { field: 'am-firstName', message: 'Please add your first name.' };
    if (!form.lastName.trim()) return { field: 'am-lastName', message: 'Please add your last name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return { field: 'am-email', message: 'That email address doesn’t look right.' };
    if (digits.length < 10 || digits.length > 13) return { field: 'am-phone', message: 'Please enter a phone number with 10 digits.' };
    if (!money(form.experience)) return { field: 'am-experience', message: 'Add your total experience in months. Use 0 if you’re a fresher.' };
    if (!form.location.trim()) return { field: 'am-location', message: 'Please add the city you live in.' };
    if (!money(form.currentSalary)) return { field: 'am-currentSalary', message: 'Add your current salary per month. Use 0 if you don’t have one.' };
    if (!money(form.expectedSalary)) return { field: 'am-expectedSalary', message: 'Add the salary you expect per month.' };
    if (!form.dob) return { field: 'am-dob-day', message: 'Please choose your full date of birth.' };
    if (!form.gender) return { field: 'am-gender', message: 'Please choose an option for gender.' };
    if (!form.hearAbout.trim()) return { field: 'am-hearAbout', message: 'Tell us where you heard about us.' };
    return null;
  };

  const focusField = (id: string) => document.getElementById(id)?.focus();

  return createPortal(
    <div className="am-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()} role="dialog" aria-modal="true" aria-labelledby="am-title">
      <div className="am-card">
        <div className="am-header">
          <div>
            <p className="am-overline">Applying for</p>
            <h2 id="am-title">{jobTitle}</h2>
          </div>
          <button className="am-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {status === 'done' ? (
          <div className="am-done">
            <span className="am-done-icon"><Check size={28}/></span>
            <h3>Thanks{form.firstName.trim() ? `, ${form.firstName.trim()}` : ''}. We’ve got it.</h3>
            <p>{serverMsg || <>Your application for <strong>{jobTitle}</strong> is with the team. We’ll get back to you once we’ve had a look.</>}</p>
            <button className="am-submit" onClick={onClose}>Back to roles</button>
          </div>
        ) : (
          <form className="am-form" onSubmit={handleSubmit} noValidate>
            <div className="am-grid">
              <div className="am-field">
                <label htmlFor="am-firstName">First name</label>
                <input id="am-firstName" ref={firstRef} required autoComplete="given-name" value={form.firstName} onChange={set('firstName')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-lastName">Last name</label>
                <input id="am-lastName" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-email">Email</label>
                <input id="am-email" required type="email" autoComplete="email" value={form.email} onChange={set('email')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-phone">Phone number</label>
                <input id="am-phone" required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-experience">Total experience (months)</label>
                <input id="am-experience" required type="number" inputMode="numeric" min="0" placeholder="0 if you’re a fresher" value={form.experience} onChange={set('experience')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-location">Current city</label>
                <input id="am-location" required autoComplete="address-level2" value={form.location} onChange={set('location')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-currentSalary">Current salary (₹ per month)</label>
                <input id="am-currentSalary" required type="number" inputMode="numeric" min="0" value={form.currentSalary} onChange={set('currentSalary')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-expectedSalary">Expected salary (₹ per month)</label>
                <input id="am-expectedSalary" required type="number" inputMode="numeric" min="0" value={form.expectedSalary} onChange={set('expectedSalary')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-dob-day">Date of birth</label>
                <div className="am-dob">
                  <select id="am-dob-day" aria-label="Day" autoComplete="bday-day" value={dobParts.d} onChange={e => updateDob({ ...dobParts, d: e.target.value })}>
                    <option value="">Day</option>
                    {Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, '0')).map(day => <option key={day} value={day}>{Number(day)}</option>)}
                  </select>
                  <select id="am-dob-month" aria-label="Month" autoComplete="bday-month" value={dobParts.m} onChange={e => updateDob({ ...dobParts, m: e.target.value })}>
                    <option value="">Month</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((name, i) => <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>)}
                  </select>
                  <select id="am-dob-year" aria-label="Year" autoComplete="bday-year" value={dobParts.y} onChange={e => updateDob({ ...dobParts, y: e.target.value })}>
                    <option value="">Year</option>
                    {birthYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
              <div className="am-field">
                <label htmlFor="am-gender">Gender</label>
                <select id="am-gender" required value={form.gender} onChange={set('gender')}>
                  <option value="">Choose one</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div className="am-field">
                <label htmlFor="am-hearAbout">Where did you hear about us?</label>
                <input id="am-hearAbout" required value={form.hearAbout} onChange={set('hearAbout')}/>
              </div>
              <div className="am-field">
                <label htmlFor="am-cv">CV (PDF, DOC or DOCX)</label>
                <label className="am-file-label" htmlFor="am-cv">
                  <Upload size={14}/>
                  <span>{cvFile ? cvFile.name : 'Choose a file'}</span>
                  <input id="am-cv" required type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] ?? null)}/>
                </label>
              </div>
            </div>
            {status === 'error' && <p className="am-error" role="alert">{serverMsg || 'Something went wrong. Please try again.'}</p>}
            <div className="am-footer">
              <span>Every field is needed to send your application.</span>
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

export function ApplicationPrep() {
  const [checked, setChecked] = useState<boolean[]>([false,false,false]);
  const count = checked.filter(Boolean).length;
  return <div className="ce-prep">
    <div className="ce-prep-title"><Coffee size={19} aria-hidden="true"/><span>A moment before you jump in</span></div>
    <p>Optional. Just for you, not part of your application.</p>
    {['Read the role and what it involves','Have my CV ready','Think of one thing I’m proud of'].map((label,index)=><label className="ce-check" key={label}><Checkbox checked={checked[index]} onCheckedChange={value=>setChecked(items=>items.map((item,i)=>i===index?value===true:item))}/><span>{label}</span></label>)}
    <div className="ce-prep-status" aria-live="polite">{count===3?<><Check size={15}/>All set. Bring your own kind of handy.</>:<><ArrowUpRight size={15}/>{count} of 3 little things, done.</>}</div>
  </div>;
}
