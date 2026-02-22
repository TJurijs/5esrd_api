import { store, normalizeKey } from '../store.js';
import type { Race } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export function searchRaces(
  filters: { name?: string; source?: string },
  page?: PageParams
): PageResult<Race> {
  let results = [...store.races.values()];
  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(r => r.name.toLowerCase().includes(q));
  }
  if (filters.source) results = results.filter(r => r.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getRace(name: string): Race | undefined {
  return store.races.get(normalizeKey(name));
}
