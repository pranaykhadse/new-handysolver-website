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

  return createPortal(
    <div className="am-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()} role="dialog" aria-modal="true" aria-labelledby="am-title">
      <div className="am-card">
        <div className="am-header">
          <div>
            <p className="am-overline">APPLICATION</p>
            <h2 id="am-title">Apply for <em>{jobTitle}</em></h2>
          </div>
          <button className="am-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {status === 'done' ? (
          <div className="am-done">
            <span className="am-done-icon"><Check size={28}/></span>
            <h3>Application sent!</h3>
            <p>{serverMsg || <>We&apos;ve received your application for <strong>{jobTitle}</strong>. Our team will be in touch soon.</>}</p>
            <button className="am-submit" onClick={onClose}>Back to roles</button>
          </div>
        ) : (
          <form className="am-form" onSubmit={handleSubmit} noValidate>
            <div className="am-grid">
              <div className="am-field">
                <label>First Name<span>*</span></label>
                <input ref={firstRef} required value={form.firstName} onChange={set('firstName')} placeholder="Abhishek"/>
              </div>
              <div className="am-field">
                <label>Last Name<span>*</span></label>
                <input required value={form.lastName} onChange={set('lastName')} placeholder="Sharma"/>
              </div>
              <div className="am-field">
                <label>Email Address<span>*</span></label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"/>
              </div>
              <div className="am-field">
                <label>Contact Number<span>*</span></label>
                <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210"/>
              </div>
              <div className="am-field">
                <label>Experience (in months)<span>*</span></label>
                <input required type="number" min="0" value={form.experience} onChange={set('experience')} placeholder="12"/>
              </div>
              <div className="am-field">
                <label>Expected Salary (INR/month)<span>*</span></label>
                <input required type="number" min="0" value={form.expectedSalary} onChange={set('expectedSalary')} placeholder="50000"/>
              </div>
              <div className="am-field">
                <label>Current Salary (INR/month)<span>*</span></label>
                <input required type="number" min="0" value={form.currentSalary} onChange={set('currentSalary')} placeholder="40000"/>
              </div>
              <div className="am-field">
                <label>How did you hear about us?<span>*</span></label>
                <input required value={form.hearAbout} onChange={set('hearAbout')} placeholder="LinkedIn, friend, etc."/>
              </div>
              <div className="am-field">
                <label>Current Location<span>*</span></label>
                <input required value={form.location} onChange={set('location')} placeholder="Gurugram, India"/>
              </div>
              <div className="am-field">
                <label>Date of Birth<span>*</span></label>
                <input required type="date" value={form.dob} onChange={set('dob')}/>
              </div>
              <div className="am-field">
                <label>Gender<span>*</span></label>
                <select required value={form.gender} onChange={set('gender')}>
                  <option value="">Select…</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div className="am-field">
                <label>Upload your CV<span>*</span></label>
                <label className="am-file-label">
                  <Upload size={14}/>
                  <span>{cvFile ? cvFile.name : 'Choose file…'}</span>
                  <input required type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] ?? null)}/>
                </label>
              </div>
            </div>
            {status === 'error' && <p className="am-error">{serverMsg || 'Something went wrong. Please try again.'}</p>}
            <div className="am-footer">
              <span>Fields marked <span className="am-req">*</span> are required</span>
              <button type="submit" className="am-submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : <>Apply <ArrowUpRight size={16}/></>}
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
