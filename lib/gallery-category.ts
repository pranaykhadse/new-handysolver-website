const LABELS: Record<string, string> = {
  birthday: 'Birthdays',
  diwali: 'Diwali',
  sports: 'Sports',
  farewell: 'Farewells',
  starbucks: 'Celebrating success',
  'rock-n-roll': 'Rock n roll',
  other: 'More moments',
};

export function categoryOf(src: string): string {
  const m = src.match(/\/(?:images|object\/public\/gallery)\/([^/]+)\/[^/]+$/);
  return m ? m[1].toLowerCase() : 'other';
}

export function labelOf(key: string): string {
  return LABELS[key] ?? key.replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
}

export function groupByCategory<T extends { src: string }>(items: T[]): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = [];
  items.forEach(item => {
    const key = categoryOf(item.src);
    const group = groups.find(g => g.key === key);
    if (group) group.items.push(item); else groups.push({ key, items: [item] });
  });
  return groups.sort((a, b) => Number(a.key === 'other') - Number(b.key === 'other'));
}
