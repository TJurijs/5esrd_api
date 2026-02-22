import { store, normalizeKey } from '../store.js';
import type { ClassData, Subclass } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export function getClasses(page?: PageParams): PageResult<ClassData> {
  const results = [...store.classes.values()].sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getClass(name: string): ClassData | undefined {
  return store.classes.get(normalizeKey(name));
}

export function getSubclasses(className: string): Subclass[] {
  return store.classes.get(normalizeKey(className))?.subclasses ?? [];
}
