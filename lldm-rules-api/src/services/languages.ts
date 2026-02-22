import { store, normalizeKey } from '../store.js';
import type { Language } from '../types/index.js';

export function listLanguages(): Language[] {
  return [...store.languages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getLanguage(name: string): Language | undefined {
  return store.languages.get(normalizeKey(name));
}
