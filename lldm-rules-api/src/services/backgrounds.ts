import { store, normalizeKey } from '../store.js';
import type { Background } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export function searchBackgrounds(
  filters: { name?: string; source?: string },
  page?: PageParams
): PageResult<Background> {
  let results = [...store.backgrounds.values()];
  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(b => b.name.toLowerCase().includes(q));
  }
  if (filters.source) results = results.filter(b => b.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getBackground(name: string): Background | undefined {
  return store.backgrounds.get(normalizeKey(name));
}
