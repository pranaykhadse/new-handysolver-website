import { getSupabase, isSupabaseConfigured, type DbJobPost } from "@/lib/supabase";

const origin = 'https://handysolver.myhandydash.com';
type RecordData = Record<string, unknown>;
const on = (value: unknown) => value === true || value === 1 || value === '1';
const plain = (value: unknown) => typeof value === 'string' ? value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').trim().slice(0, 15000) : '';

function shapeDbJob(j: DbJobPost) {
  const f = j.field_flags ?? {};
  const show = (key: string) => f[key] !== false; // default visible
  const sections: { label: string; text: string }[] = [];
  if (show('show_requirements') && j.requirements?.trim()) sections.push({ label: 'Requirement(s)', text: j.requirements });
  if (show('show_role') && j.role?.trim()) sections.push({ label: 'Role and Responsibilities', text: j.role });
  if (show('show_skills') && j.skills?.trim()) sections.push({ label: 'Skills Required', text: j.skills });
  if (show('show_good_to_have') && j.good_to_have?.trim()) sections.push({ label: 'Good to Have', text: j.good_to_have });
  const expOk = j.exp_min != null && j.exp_max != null;
  const exp = (show('show_experience') && expOk) ? `${j.exp_min} to ${j.exp_max} years` : '';
  return {
    id: j.id, title: j.title,
    intro: show('show_intro') ? (j.intro ?? '') : '',
    icon: j.icon ?? '',
    type: show('show_job_type') ? (j.job_type ?? '') : '',
    location: show('show_location') ? (j.location ?? '') : '',
    experience: exp,
    salary: show('show_salary') ? (j.salary ?? '') : '',
    qualification: show('show_qualification') ? (j.qualification ?? '') : '',
    sections,
  };
}

export async function GET() {
  // Try Supabase-managed jobs first
  if (isSupabaseConfigured()) {
    try {
      // Check if ANY jobs exist in Supabase (active or inactive)
      const { data: all, error: countErr } = await getSupabase()
        .from('job_posts')
        .select('id')
        .limit(1);
      if (!countErr && Array.isArray(all) && all.length > 0) {
        // Supabase is managing jobs — only return active ones
        const { data, error } = await getSupabase()
          .from('job_posts')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (!error) {
          const jobs = (Array.isArray(data) ? data as DbJobPost[] : []).map(shapeDbJob);
          return Response.json({ jobs, source: 'supabase', checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
        }
      }
    } catch {}
  }

  // Fall back to external recruitment portal
  try {
    const [jobsResponse, settingsResponse] = await Promise.all([
      fetch(`${origin}/api/web/v1/handy-recruiters/get-active-jobs`, { signal: AbortSignal.timeout(20000), cache: 'no-store' }),
      fetch(`${origin}/backend/web/handy-form-settings/default/get-form-fields?tableName=handyrecruiter_job_post`, { signal: AbortSignal.timeout(20000), cache: 'no-store' }),
    ]);
    if (!jobsResponse.ok || !settingsResponse.ok) throw new Error('Feed unavailable');
    const payload = await jobsResponse.json();
    const settings = await settingsResponse.json();
    if (!Array.isArray(payload.data) || !Array.isArray(settings.data)) throw new Error('Unexpected feed');
    const sections = [['Required','required','isRequired'],['Role and Responsibility','role','isRole'],['Key Skills','skills','isSkills'],['Good to have','goodtohave','isGoodtohave']];
    const jobs = payload.data.filter((j: RecordData) => on(j.isActive) && on(j.isPost) && plain(j.post))
      .sort((a: RecordData,b: RecordData) => Number(a.position)-Number(b.position))
      .map((j: RecordData) => ({
        id: String(j.id), title: plain(j.post), intro: on(j.isIntro) ? plain(j.intro) : '',
        type: on(j.isType) ? plain(j.type) : '', location: on(j.isLocation) ? plain(j.location) : '',
        experience: on(j.isExperience) && Number.isFinite(Number(j.min)) && Number.isFinite(Number(j.max)) ? `${j.min} to ${j.max} years` : '',
        salary: on(j.isSalary) ? plain(j.salary) : '', qualification: on(j.isQualification) ? plain(j.qualification) : '',
        sections: sections.flatMap(([label,key,flag]) => {
          const field = settings.data.find((s: RecordData) => s.attribute_label === label);
          return on(j[flag]) && field && on(field.is_shown) && plain(j[key]) ? [{label: plain(field.label_rename) || label, text: plain(j[key])}] : [];
        }),
      }));
    return Response.json({ jobs, source: 'external', checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: "We couldn't load the latest openings. Please try again or visit our recruitment portal." }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
