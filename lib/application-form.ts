// Shared definition of the job application form: the default layout, the shape
// the admin can edit, validation used by the public form, and a sanitiser used
// by the admin API. Safe to import from both client and server code.

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'dob' | 'file' | 'url' | 'date' | 'checkbox';

export type FormField = {
  id: string;
  builtin: boolean;
  type: FieldType;
  label: string;
  placeholder: string;
  help: string;
  required: boolean;
  visible: boolean;
  section: string;
  wide: boolean;
  options: string[];
};

export type FormSection = { id: string; title: string };
export type FormConfig = { sections: FormSection[]; fields: FormField[] };

// Types an admin can pick for a new field. Date of birth and the CV upload exist only as built-ins.
export const CUSTOM_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'Web link' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Tick box' },
];

// Built-in field id -> the field name the myhandydash recruiting API expects.
export const BUILTIN_API_KEYS: Record<string, string> = {
  firstName: 'fname', lastName: 'lname', email: 'email', phone: 'phone', location: 'location', gender: 'gender',
  dob: 'dob', experience: 'exp', currentSalary: 'current_ctc', expectedSalary: 'salary', hearAbout: 'hear',
};

// These two are needed by the recruiting system and the applications database,
// so they can't be hidden or made optional.
export const LOCKED_FIELDS = ['email', 'cv'];

const f = (id: string, type: FieldType, label: string, placeholder: string, section: string, wide = false, options: string[] = []): FormField =>
  ({ id, builtin: true, type, label, placeholder, help: '', required: true, visible: true, section, wide, options });

export const DEFAULT_FORM_CONFIG: FormConfig = {
  sections: [
    { id: 's1', title: 'About you' },
    { id: 's2', title: 'Your experience' },
    { id: 's3', title: 'Almost there' },
  ],
  fields: [
    f('firstName', 'text', 'First name', 'Your first name', 's1'),
    f('lastName', 'text', 'Last name', 'Your last name', 's1'),
    f('email', 'email', 'Email', 'name@email.com', 's1'),
    f('phone', 'tel', 'Phone number', '10-digit mobile number', 's1'),
    f('location', 'text', 'Current city', 'The city you live in', 's1'),
    f('gender', 'select', 'Gender', 'Choose one', 's1', false, ['Male', 'Female', 'Non-binary', 'Prefer not to say']),
    f('dob', 'dob', 'Date of birth', '', 's1', true),
    f('experience', 'number', 'Total experience (months)', 'Months. 0 if you’re a fresher', 's2', true),
    f('currentSalary', 'number', 'Current salary (₹ per month)', 'Amount per month', 's2'),
    f('expectedSalary', 'number', 'Expected salary (₹ per month)', 'Amount per month', 's2'),
    f('hearAbout', 'text', 'Where did you hear about us?', 'e.g. LinkedIn, a friend, our website', 's3', true),
    f('cv', 'file', 'CV', 'PDF, DOC or DOCX', 's3', true),
  ],
};

const BUILTIN_REQUIRED_MESSAGES: Record<string, string> = {
  firstName: 'Please add your first name.',
  lastName: 'Please add your last name.',
  email: 'That email address doesn’t look right.',
  phone: 'Please enter a phone number with 10 digits.',
  location: 'Please add the city you live in.',
  gender: 'Please choose an option for gender.',
  dob: 'Please choose your full date of birth.',
  experience: 'Add your total experience in months. Use 0 if you’re a fresher.',
  currentSalary: 'Add your current salary per month. Use 0 if you don’t have one.',
  expectedSalary: 'Add the salary you expect per month.',
  hearAbout: 'Tell us where you heard about us.',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The recruiting API accepts ASCII letters only (spaces allowed); apostrophes,
// hyphens, dots, digits and accents are all rejected. Catch it before sending.
const NAME = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

// Returns the message to show for the first problem with a field, or null.
export function validateField(field: FormField, value: string): string | null {
  const v = value.trim();
  const empty = v === '';
  if (empty) {
    if (!field.required) return null;
    if (field.type === 'checkbox') return `Please tick “${field.label}”.`;
    return BUILTIN_REQUIRED_MESSAGES[field.id] ?? `Please ${field.type === 'select' ? 'choose' : 'fill in'} “${field.label}”.`;
  }
  if ((field.id === 'firstName' || field.id === 'lastName') && !NAME.test(v)) {
    return 'Use letters only — no digits or symbols.';
  }
  switch (field.type) {
    case 'email':
      return EMAIL.test(v) ? null : 'That email address doesn’t look right.';
    case 'tel': {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15 ? null : 'Please enter a phone number with 10 to 15 digits.';
    }
    case 'number':
      return Number(v) >= 0 ? null : `“${field.label}” must be a number, 0 or more.`;
    case 'url':
      try { new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); return v.includes('.') ? null : `“${field.label}” doesn’t look like a link.`; }
      catch { return `“${field.label}” doesn’t look like a link.`; }
    default:
      return null;
  }
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const TYPES = new Set<string>([...CUSTOM_TYPES.map(t => t.value), 'dob', 'file']);

// Turns whatever the admin sent into a safe, complete config. Built-in fields
// always exist (missing ones are re-added) and keep their type; locked fields
// stay visible and required.
export function sanitizeConfig(input: unknown): FormConfig {
  const raw = (input && typeof input === 'object' ? input : {}) as { sections?: unknown; fields?: unknown };

  const sections: FormSection[] = [];
  const seenSections = new Set<string>();
  for (const s of Array.isArray(raw.sections) ? raw.sections.slice(0, 10) : []) {
    const id = clip((s as FormSection)?.id, 40);
    if (!ID.test(id) || seenSections.has(id)) continue;
    seenSections.add(id);
    sections.push({ id, title: clip((s as FormSection).title, 60) || 'Section' });
  }
  if (sections.length === 0) sections.push(...DEFAULT_FORM_CONFIG.sections);
  const firstSection = sections[0].id;

  const defaults = new Map(DEFAULT_FORM_CONFIG.fields.map(d => [d.id, d]));
  const fields: FormField[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(raw.fields) ? raw.fields.slice(0, 40) : []) {
    const r = item as Partial<FormField>;
    const id = clip(r?.id, 40);
    if (!ID.test(id) || seen.has(id)) continue;
    const base = defaults.get(id);
    const builtin = Boolean(base);
    const type = (base ? base.type : (TYPES.has(String(r.type)) && r.type !== 'dob' && r.type !== 'file' ? r.type : 'text')) as FieldType;
    const locked = LOCKED_FIELDS.includes(id);
    const options = type === 'select'
      ? (Array.isArray(r.options) ? r.options : []).map(o => clip(o, 80)).filter(Boolean).slice(0, 30)
      : [];
    seen.add(id);
    fields.push({
      id, builtin, type,
      label: clip(r.label, 120) || base?.label || 'Untitled question',
      placeholder: clip(r.placeholder, 120),
      help: clip(r.help, 200),
      required: locked ? true : Boolean(r.required),
      visible: locked ? true : r.visible !== false,
      section: seenSections.has(String(r.section)) ? String(r.section) : firstSection,
      wide: Boolean(r.wide) || type === 'textarea' || type === 'dob' || type === 'file',
      options: type === 'select' && options.length === 0 ? (base?.options ?? ['Option 1']) : options,
    });
  }
  for (const d of DEFAULT_FORM_CONFIG.fields) {
    if (!seen.has(d.id)) fields.push({ ...d, section: seenSections.has(d.section) ? d.section : firstSection });
  }
  return { sections, fields };
}
