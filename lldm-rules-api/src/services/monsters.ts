import { store, normalizeKey } from '../store.js';
import type { Monster } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export interface MonsterFilters {
  name?: string;
  cr?: string;
  type?: string;
  size?: string;
  source?: string;
}

function crToNumber(cr: string): number {
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

export function searchMonsters(filters: MonsterFilters, page?: PageParams): PageResult<Monster> {
  let results = [...store.monsters.values()];

  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(m => m.name.toLowerCase().includes(q));
  }
  if (filters.cr !== undefined) {
    results = results.filter(m => m.cr === filters.cr);
  }
  if (filters.type) {
    const q = filters.type.toLowerCase();
    results = results.filter(m => m.type.toLowerCase().includes(q));
  }
  if (filters.size) {
    const q = filters.size.toLowerCase();
    results = results.filter(m => m.size.some(s => s.toLowerCase().includes(q)));
  }
  if (filters.source) {
    results = results.filter(m => m.source === filters.source);
  }

  results.sort((a, b) => crToNumber(a.cr) - crToNumber(b.cr) || a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getMonster(name: string): Monster | undefined {
  return store.monsters.get(normalizeKey(name));
}
