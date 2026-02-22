import { store, normalizeKey } from '../store.js';
import type { Spell } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export interface SpellFilters {
  name?: string;
  level?: number;
  school?: string;
  class?: string;
  source?: string;
}

export function searchSpells(filters: SpellFilters, page?: PageParams): PageResult<Spell> {
  let results = [...store.spells.values()];

  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(s => s.name.toLowerCase().includes(q));
  }
  if (filters.level !== undefined) {
    results = results.filter(s => s.level === filters.level);
  }
  if (filters.school) {
    const q = filters.school.toLowerCase();
    results = results.filter(s => s.school.toLowerCase().includes(q));
  }
  if (filters.class) {
    const q = filters.class.toLowerCase();
    results = results.filter(s => s.classes?.some(c => c.toLowerCase().includes(q)));
  }
  if (filters.source) {
    results = results.filter(s => s.source === filters.source);
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getSpell(name: string): Spell | undefined {
  return store.spells.get(normalizeKey(name));
}
