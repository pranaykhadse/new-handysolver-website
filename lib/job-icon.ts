// Picks an icon for a role from its title when no icon was chosen in the admin.
export function guessJobIcon(title: string): string {
  const t = title.toLowerCase();
  if (/\b(test|tester|testing|qa|quality)\b/.test(t)) return 'search';
  if (/\b(design|designer|designers|ux|ui|graphic|creative)\b/.test(t)) return 'image';
  if (/\b(hr|human resources?|recruit\w*|people)\b/.test(t)) return 'users';
  if (/\b(developer|engineer|programmer|software|php|react|full stack|devops)\b/.test(t)) return 'code';
  return 'briefcase-business';
}
