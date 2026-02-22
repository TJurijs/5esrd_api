import { store, normalizeKey } from '../store.js';
import type { Feat } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export interface FeatFilters {
  name?: string;
  category?: string;
  source?: string;
}

export function searchFeats(filters: FeatFilters, page?: PageParams): PageResult<Feat> {
  let results = [...store.feats.values()];
  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(f => f.name.toLowerCase().includes(q));
  }
  if (filters.category) {
    const q = filters.category.toLowerCase();
    results = results.filter(f => f.category.toLowerCase().includes(q));
  }
  if (filters.source) results = results.filter(f => f.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getFeat(name: string): Feat | undefined {
  return store.feats.get(normalizeKey(name));
}
