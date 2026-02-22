import { store, normalizeKey } from '../store.js';
import type { Skill } from '../types/index.js';

export function listSkills(): Skill[] {
  return [...store.skills.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSkill(name: string): Skill | undefined {
  return store.skills.get(normalizeKey(name));
}
