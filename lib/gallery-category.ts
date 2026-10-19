const LABELS: Record<string, string> = {
  birthday: 'Birthdays',
  diwali: 'Diwali',
  sports: 'Sports',
  farewell: 'Farewells',
  starbucks: 'Celebrating success',
  'rock-n-roll': 'Rock n roll',
  other: 'More moments',
};

export type FolderMeta = { slug: string; label: string };
type Categorised = { src: string; category?: string | null };

// A photo's folder: the one an admin moved it to, otherwise the folder in its image URL.
export function categoryOf(src: string, category?: string | null): string {
  if (category) return category;
  const m = src.match(/\/(?:images|object\/public\/gallery)\/([^/]+)\/[^/]+$/);
  return m ? m[1].toLowerCase() : 'other';
}

export function labelOf(key: string, folders: FolderMeta[] = []): string {
  const custom = folders.find(f => f.slug === key);
  if (custom) return custom.label;
  return LABELS[key] ?? key.replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
}

export function slugifyFolder(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

export function groupByCategory<T extends Categorised>(items: T[], folders: FolderMeta[] = [], includeEmpty = false): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = [];
  items.forEach(item => {
    const key = categoryOf(item.src, item.category);
    const group = groups.find(g => g.key === key);
    if (group) group.items.push(item); else groups.push({ key, items: [item] });
  });
  if (includeEmpty) {
    folders.forEach(f => { if (!groups.some(g => g.key === f.slug)) groups.push({ key: f.slug, items: [] }); });
  }
  return groups.sort((a, b) => Number(a.key === 'other') - Number(b.key === 'other'));
}
