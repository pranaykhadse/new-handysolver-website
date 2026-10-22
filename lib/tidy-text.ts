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
