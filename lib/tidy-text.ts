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
  [/Redux, Webpacks, React Hooks, Routers, Lazy, Loading,/g, 'Redux, Webpack, React Hooks, Routers, Lazy Loading,'],
  [/Knowledge of REST API\./g, 'Knowledge of REST APIs.'],
  [/Knowledge with practical experience of PWA and SSR frameworks/g, 'Knowledge and practical experience of PWAs and SSR frameworks'],
  [/Self-motivated and a keen learner with a passion for his\/her work alongside committing to quality and timely delivery of solutions is desired\./g, 'Self-motivated, keen learner with a passion for their work and a commitment to quality and timely delivery of solutions.'],
  [/Test Driven Development/g, 'Test-Driven Development'],
  [/along with Responsive design frameworks/g, 'along with responsive design frameworks'],
  [/Bachelor.s degree, incase of Masters.s, specialisation in HR will be preferred\./g, 'Bachelor’s degree. For a Master’s degree, specialisation in HR is preferred.'],
  [/knack of understanding a candidate.s natural flair and potential and map them accordingly with the right/g, 'knack for understanding a candidate’s natural flair and potential, and matching them with the right'],
  [/organisation and accordingly draft job descriptions, can be different from the usual market roles at times\./g, 'organisation and draft job descriptions accordingly; these can differ from the usual market roles at times.'],
  [/post the position there accordingly, also maintain the post and interact, screen\./g, 'post the position there accordingly, and also maintain the post, interact with applicants and screen them.'],
  [/herself\/himself/g, 'themselves'],
  [/actionable goals for self\./g, 'actionable goals for themselves.'],
  [/ensuring team members are following protocols/g, 'ensuring team members follow protocols'],
  [/Has a go-getter spirit\./g, 'A go-getter spirit.'],
  [/Take follow-up and convert leads into clients\./g, 'Follow up on leads and convert them into clients.'],
  [/Travel for client meets\./g, 'Travel for client meetings.'],
  [/Prepare and keep up-to-date all required accounts\./g, 'Prepare and keep all required accounts up to date.'],
  [/theme and context based designing we are looking for you!/g, 'theme- and context-based design, we are looking for you!'],
  [/(loaders|flyers) etc\./g, '$1, etc.'],
  [/animations\/GIFs$/gm, 'animations/GIFs.'],
  [/Design mood board and colour palette/g, 'Design mood boards and colour palettes'],
  [/Figma\/ Sketch/g, 'Figma/Sketch'],
  [/Cross-Browser\/ Multiple Devices Testing/g, 'Cross-Browser/Multiple-Device Testing'],
  [/Experience with Automated Testing/g, 'Experience with automated testing'],
  [/Create Scenarios, Test Cases, Acceptance Criteria, Bug reports and adherence to the Software Requirement Specifications\./g, 'Create scenarios, test cases, acceptance criteria and bug reports, and ensure adherence to the Software Requirement Specifications.'],
  [/POSTMAN/g, 'Postman'],
  [/and familiar with Jenkins/g, 'and familiarity with Jenkins'],
  [/MySQL Queries/g, 'MySQL queries'],
  [/(\d)-(\d+ years)/g, '$1–$2'],
];

export function tidyJobText(raw: string): string {
  return curlyApostrophes(JOB_TEXT_FIXES.reduce((text, [pattern, fix]) => text.replace(pattern, fix), raw));
}
