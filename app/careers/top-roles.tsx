'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, MapPin } from 'lucide-react';

type Job = { id: string; title: string; intro: string; type: string; location: string; experience: string };

export default function TopRoles() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/open-roles', { signal: controller.signal, cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (!Array.isArray(data.jobs)) throw new Error();
        setJobs(data.jobs.slice(0, 3));
        setState(data.jobs.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('empty'); });
    return () => controller.abort();
  }, []);

  if (state === 'loading') return (
    <div className="tr-loading" aria-busy="true">
      {[1, 2, 3].map(i => <div key={i} className="tr-skeleton" aria-hidden="true"/>)}
    </div>
  );

  if (state === 'empty') return null;

  return (
    <div className="tr-list">
      {jobs.map((job, i) => (
        <a key={job.id} className="tr-card" href="/careers/open-roles">
          <span className="tr-num">{String(i + 1).padStart(2, '0')}</span>
          <div className="tr-body">
            <strong>{job.title}</strong>
            {job.intro && <p>{job.intro}</p>}
            <span className="tr-tags">
              {job.type && <span><BriefcaseBusiness size={11}/>{job.type}</span>}
              {job.location && <span><MapPin size={11}/>{job.location}</span>}
              {job.experience && <span>{job.experience}</span>}
            </span>
          </div>
          <ArrowUpRight size={18} className="tr-arrow"/>
        </a>
      ))}
    </div>
  );
}
