import type { Spell, Monster, Item, ClassData, Feat, Background, Race, Condition, Skill, Language } from './types/index.js';

export interface Store {
  spells: Map<string, Spell>;
  monsters: Map<string, Monster>;
  items: Map<string, Item>;
  classes: Map<string, ClassData>;
  feats: Map<string, Feat>;
  backgrounds: Map<string, Background>;
  races: Map<string, Race>;
  conditions: Map<string, Condition>;
  skills: Map<string, Skill>;
  languages: Map<string, Language>;
}

function createStore(): Store {
  return {
    spells: new Map(),
    monsters: new Map(),
    items: new Map(),
    classes: new Map(),
    feats: new Map(),
    backgrounds: new Map(),
    races: new Map(),
    conditions: new Map(),
    skills: new Map(),
    languages: new Map(),
  };
}

export const store: Store = createStore();

export function normalizeKey(name: string): string {
  return name.toLowerCase().trim();
}
