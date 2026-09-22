'use client';

import { SITE_URL } from '@/lib/site';

export type PublicJob = {
  id: string;
  title: string;
  intro: string;
  type: string;
  location: string;
  experience: string;
  salary: string;
  qualification: string;
  sections: Array<{ label: string; text: string }>;
};

const EMPLOYMENT_TYPE: Record<string, string> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Internship: 'INTERN',
  Contract: 'CONTRACTOR',
  Freelance: 'OTHER',
};

// Emits JobPosting schema for whatever roles are currently listed.
// Rendered client-side so it always matches the live board (Google
// processes JS-rendered structured data). Renders nothing when empty.
export default function JobPostingJsonLd({ jobs }: { jobs: PublicJob[] }) {
  if (jobs.length === 0) return null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': jobs.map((job) => {
      const description = [
        job.intro,
        ...job.sections.map((s) => `${s.label}: ${s.text}`),
        job.qualification ? `Qualification: ${job.qualification}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      const employmentType = EMPLOYMENT_TYPE[job.type];
      return {
        '@type': 'JobPosting',
        title: job.title,
        description,
        hiringOrganization: { '@type': 'Organization', name: 'HandySolver', sameAs: SITE_URL },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location || 'Gurugram, India',
            addressCountry: 'IN',
          },
        },
        ...(employmentType ? { employmentType } : {}),
        directApply: true,
      };
    }),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
