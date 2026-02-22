import { store, normalizeKey } from '../store.js';
import type { Condition } from '../types/index.js';

export function listConditions(): Condition[] {
  return [...store.conditions.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCondition(name: string): Condition | undefined {
  return store.conditions.get(normalizeKey(name));
}
