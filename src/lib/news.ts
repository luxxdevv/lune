export interface NewsPost { date: string; tag: string; title: string; body: string }

export function validateNews(value: unknown): NewsPost[] {
  const items = Array.isArray(value) ? value : (value && typeof value === 'object' && 'posts' in value ? value.posts : null);
  if (!Array.isArray(items) || items.length > 100) throw new Error('Invalid news feed');
  return items.map(item => {
    if (!item || typeof item !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !Number.isFinite(Date.parse(item.date))) throw new Error('Invalid news date');
    for (const [field, limit] of [['tag', 50], ['title', 180], ['body', 6000]] as const) {
      if (typeof item[field] !== 'string' || !item[field].trim() || item[field].length > limit) throw new Error('Invalid news content');
    }
    return { date: item.date, tag: item.tag, title: item.title, body: item.body };
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
}

// Decode the published landing page's news string literals only; never execute
// downloaded JavaScript. A standalone /news.json feed takes precedence.
export function newsFromLandingBundle(source: string): NewsPost[] {
  const string = '"(?:[^"\\\\]|\\\\.)*"';
  const entry = new RegExp(`\\{\\s*date:\\s*(${string})\\s*,\\s*tag:\\s*(${string})\\s*,\\s*title:\\s*(${string})\\s*,\\s*body:\\s*(${string})\\s*\\}`, 'g');
  const posts = [...source.matchAll(entry)].map(match => ({ date: JSON.parse(match[1]), tag: JSON.parse(match[2]), title: JSON.parse(match[3]), body: JSON.parse(match[4]) }));
  if (!posts.length) throw new Error('Landing page news not found');
  return validateNews(posts);
}
