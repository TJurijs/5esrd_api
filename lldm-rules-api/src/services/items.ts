import { store, normalizeKey } from '../store.js';
import type { Item } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export interface ItemFilters {
  name?: string;
  type?: string;
  rarity?: string;
  attunement?: boolean;
  source?: string;
}

export function searchItems(filters: ItemFilters, page?: PageParams): PageResult<Item> {
  let results = [...store.items.values()];

  if (filters.name) {
    const q = filters.name.toLowerCase();
    results = results.filter(i => i.name.toLowerCase().includes(q));
  }
  if (filters.type) {
    const q = filters.type.toLowerCase();
    results = results.filter(i => i.type.toLowerCase().includes(q));
  }
  if (filters.rarity) {
    results = results.filter(i => i.rarity === filters.rarity);
  }
  if (filters.attunement !== undefined) {
    results = results.filter(i => filters.attunement ? !!i.attunement : !i.attunement);
  }
  if (filters.source) {
    results = results.filter(i => i.source === filters.source);
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getItem(name: string): Item | undefined {
  return store.items.get(normalizeKey(name));
}
