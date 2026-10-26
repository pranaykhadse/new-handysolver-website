const COMPANY_SUFFIXES: Record<string, string> = { pvt: 'Pvt', ltd: 'Ltd', llp: 'LLP', llc: 'LLC', inc: 'Inc', corp: 'Corp', co: 'Co' };
const NAME_PARTICLES = new Set(['van', 'von', 'de', 'der', 'da', 'di', 'la', 'le', 'bin', 'al']);

// Fixes casing typed in by hand: "Kss interior India pvt Ltd" becomes "KSS Interior India Pvt Ltd".
export function tidyName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      const core = word.replace(/[^A-Za-z]/g, '');
      const suffix = COMPANY_SUFFIXES[core.toLowerCase()];
      if (suffix) return word.replace(core, suffix);
      if (!/^[A-Z]?[a-z]+$/.test(core)) return word;
      if (index > 0 && NAME_PARTICLES.has(core.toLowerCase())) return word;
      if (core.length <= 4 && !/[aeiouy]/i.test(core)) return word.replace(core, core.toUpperCase());
      return word.replace(core, core.charAt(0).toUpperCase() + core.slice(1));
    })
    .join(' ');
}

// Older entries were saved with a stand-in attribution that reads like a placeholder, so it is not shown.
export function tidyLabel(raw: string): string {
  const label = raw.trim();
  return /^client testimonial\b/i.test(label) ? '' : label;
}

// Typed-in text often has straight apostrophes; the rest of the site uses curly ones.
export function curlyApostrophes(raw: string): string {
  return raw.replace(/([A-Za-z])'([A-Za-z])/g, '$1\u2019$2');
}

// Job posts are typed in by hand in the admin or the recruitment portal. These are the known wording slips,
// corrected as the posts are shown so the careers page reads cleanly whichever source supplies them.
const JOB_TEXT_FIXES: [RegExp, string][] = [
  [/full-time talented PHP Developers/g, 'talented full-time PHP developers'],
  [/we are eagerly waiting to meet with you/g, 'we are eager to meet you'],
  [/\bOOPs\b/g, 'OOP'],
  [/Javascript, Jquery,? and Ajax/g, 'JavaScript, jQuery and AJAX'],
  [/best practises/g, 'best practices'],
  [/PHP Frameworks/g, 'PHP frameworks'],
  [/Team Leads/g, 'team leads'],
  [/mixing LLM brains with real engineering/g, 'that mix LLMs with real engineering'],
  [/(Bachelor.s\/Master.s in CS or) related\./g, '$1 a related field.'],
  [/Manage and ensure delivery is as per the proposed plan and mock-ups and that too before time\./g, 'Ensure delivery follows the proposed plan and mock-ups, ahead of schedule.'],
  [/Good with the research and development part\./g, 'Good at research and development.'],
  [/prototypes - days/g, 'prototypes — days'],
  [/around our products; static posts/g, 'around our products: static posts'],
  [/what Handysolver is cooking and coming back for more/g, 'what Handysolver is cooking, and keep them coming back for more'],
  [/(\d)-(\d+ years)/g, '$1–$2'],
];

export function tidyJobText(raw: string): string {
  return curlyApostrophes(JOB_TEXT_FIXES.reduce((text, [pattern, fix]) => text.replace(pattern, fix), raw));
}
