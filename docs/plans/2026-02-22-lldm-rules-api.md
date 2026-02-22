# LLDM Rules API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone Fastify REST + MCP API service that serves D&D 5e SRD 5.2 rules data loaded from 5etools JSON files into memory at startup.

**Architecture:** A single Node.js process exposes both a REST API (`/api/v1`) and an MCP server (stdio). Both interfaces share the same in-memory store populated at startup by filtering 5etools JSON for `srd52: true || basicRules2024: true` entries and expanding all short codes to human-readable values using lookup tables derived from 5etools' `parser.js`.

**Tech Stack:** TypeScript · Node.js · Fastify · @modelcontextprotocol/sdk · Vitest

**Project root:** `lldm-rules-api/` (sibling to `5etools-v2.24.3/` inside the LLDM workspace)

---

## Task 1: Scaffold the project

**Files:**
- Create: `lldm-rules-api/package.json`
- Create: `lldm-rules-api/tsconfig.json`
- Create: `lldm-rules-api/.env.example`
- Create: `lldm-rules-api/.gitignore`

**Step 1: Create the project directory and package.json**

```bash
mkdir lldm-rules-api && cd lldm-rules-api
```

Create `package.json`:
```json
{
  "name": "lldm-rules-api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "fastify": "^5.0.0",
    "@fastify/cors": "^10.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .env.example**

```
PORT=3000
DATA_PATH=../5etools-v2.24.3/data
```

Also copy it to `.env`.

**Step 4: Create .gitignore**

```
node_modules/
dist/
.env
```

**Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created with all deps.

**Step 6: Create src/ directory structure**

```bash
mkdir -p src/expanders src/types src/services src/plugins src/mcp
```

**Step 7: Commit**

```bash
git add lldm-rules-api/
git commit -m "feat: scaffold lldm-rules-api project"
```

---

## Task 2: Build all expanders

All lookup tables are derived directly from `5etools-v2.24.3/js/parser.js`.

**Files:**
- Create: `src/expanders/spellSchool.ts`
- Create: `src/expanders/spellRange.ts`
- Create: `src/expanders/spellDuration.ts`
- Create: `src/expanders/spellTags.ts`
- Create: `src/expanders/size.ts`
- Create: `src/expanders/alignment.ts`
- Create: `src/expanders/damageType.ts`
- Create: `src/expanders/monsterLanguage.ts`
- Create: `src/expanders/abilityScore.ts`
- Create: `src/expanders/itemType.ts`
- Create: `src/expanders/itemProperty.ts`
- Create: `src/expanders/itemRecharge.ts`
- Create: `src/expanders/featCategory.ts`
- Create: `src/expanders/attackType.ts`
- Create: `src/expanders/inlineRenderer.ts`
- Create: `src/expanders/index.ts`
- Test: `src/expanders/expanders.test.ts`

**Step 1: Write the failing tests**

Create `src/expanders/expanders.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  expandSpellSchool,
  expandSize,
  expandAlignment,
  expandDamageType,
  expandAbilityScore,
  expandItemType,
  expandItemProperty,
  expandFeatCategory,
  expandAttackType,
  renderInline,
} from './index.js';

describe('expandSpellSchool', () => {
  it('expands V to Evocation', () => expect(expandSpellSchool('V')).toBe('Evocation'));
  it('expands N to Necromancy', () => expect(expandSpellSchool('N')).toBe('Necromancy'));
  it('expands A to Abjuration', () => expect(expandSpellSchool('A')).toBe('Abjuration'));
  it('returns unknown codes as-is', () => expect(expandSpellSchool('Z')).toBe('Z'));
});

describe('expandSize', () => {
  it('expands H to Huge', () => expect(expandSize('H')).toBe('Huge'));
  it('expands M to Medium', () => expect(expandSize('M')).toBe('Medium'));
  it('expands T to Tiny', () => expect(expandSize('T')).toBe('Tiny'));
});

describe('expandAlignment', () => {
  it('expands array to string', () => expect(expandAlignment(['L', 'G'])).toBe('Lawful Good'));
  it('handles unaligned', () => expect(expandAlignment(['U'])).toBe('Unaligned'));
  it('handles any alignment', () => expect(expandAlignment(['A'])).toBe('Any Alignment'));
  it('handles NX', () => expect(expandAlignment(['NX'])).toBe('Neutral'));
});

describe('expandDamageType', () => {
  it('expands B to Bludgeoning', () => expect(expandDamageType('B')).toBe('Bludgeoning'));
  it('expands F to Fire', () => expect(expandDamageType('F')).toBe('Fire'));
});

describe('expandAbilityScore', () => {
  it('expands str to Strength', () => expect(expandAbilityScore('str')).toBe('Strength'));
  it('expands cha to Charisma', () => expect(expandAbilityScore('cha')).toBe('Charisma'));
});

describe('expandItemType', () => {
  it('expands SCF to Spellcasting Focus', () => expect(expandItemType('SCF')).toBe('Spellcasting Focus'));
  it('expands M to Melee Weapon', () => expect(expandItemType('M')).toBe('Melee Weapon'));
  it('expands HA to Heavy Armor', () => expect(expandItemType('HA')).toBe('Heavy Armor'));
});

describe('expandItemProperty', () => {
  it('expands F to Finesse', () => expect(expandItemProperty('F')).toBe('Finesse'));
  it('expands 2H to Two-Handed', () => expect(expandItemProperty('2H')).toBe('Two-Handed'));
});

describe('expandFeatCategory', () => {
  it('expands G to General', () => expect(expandFeatCategory('G')).toBe('General'));
  it('expands EB to Epic Boon', () => expect(expandFeatCategory('EB')).toBe('Epic Boon'));
});

describe('expandAttackType', () => {
  it('expands MW to Melee Weapon Attack', () => expect(expandAttackType('MW')).toBe('Melee Weapon Attack'));
});

describe('renderInline', () => {
  it('resolves {@damage 2d6} to 2d6', () => expect(renderInline('{@damage 2d6}')).toBe('2d6'));
  it('resolves {@hit 5} to +5', () => expect(renderInline('{@hit 5}')).toBe('+5'));
  it('resolves {@hit -1} to -1', () => expect(renderInline('{@hit -1}')).toBe('-1'));
  it('resolves {@condition blinded} to blinded', () => expect(renderInline('{@condition blinded}')).toBe('blinded'));
  it('resolves {@spell fireball|PHB} to Fireball', () => expect(renderInline('{@spell fireball|PHB}')).toBe('fireball'));
  it('resolves {@dc 15} to DC 15', () => expect(renderInline('{@dc 15}')).toBe('DC 15'));
  it('resolves {@b bold text} to bold text', () => expect(renderInline('{@b bold text}')).toBe('bold text'));
  it('resolves {@recharge 5} to (Recharge 5-6)', () => expect(renderInline('{@recharge 5}')).toBe('(Recharge 5–6)'));
  it('handles nested tags', () => {
    expect(renderInline('deals {@damage 2d6} {@damage B|fire} damage'))
      .toBe('deals 2d6 B fire damage');
  });
  it('passes through plain text unchanged', () => expect(renderInline('plain text')).toBe('plain text'));
});
```

**Step 2: Run tests to verify they fail**

```bash
cd lldm-rules-api && npx vitest run src/expanders/expanders.test.ts
```

Expected: FAIL — modules not found.

**Step 3: Implement spellSchool.ts**

```ts
const SCHOOL: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
  V: 'Evocation',
  P: 'Psionic',
};

export function expandSpellSchool(code: string): string {
  return SCHOOL[code] ?? code;
}
```

**Step 4: Implement size.ts**

```ts
const SIZE: Record<string, string> = {
  F: 'Fine',
  D: 'Diminutive',
  T: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  H: 'Huge',
  G: 'Gargantuan',
  C: 'Colossal',
  V: 'Varies',
};

export function expandSize(code: string): string {
  return SIZE[code] ?? code;
}
```

**Step 5: Implement alignment.ts**

```ts
const ALIGN: Record<string, string> = {
  L: 'Lawful',
  C: 'Chaotic',
  N: 'Neutral',
  NX: 'Neutral',
  NY: 'Neutral',
  G: 'Good',
  E: 'Evil',
  U: 'Unaligned',
  A: 'Any Alignment',
};

export function expandAlignment(codes: string[]): string {
  if (!codes || codes.length === 0) return 'Unaligned';
  const parts = codes.map(c => ALIGN[c] ?? c);
  // Deduplicate (NX and NY both map to Neutral)
  return [...new Set(parts)].join(' ');
}
```

**Step 6: Implement damageType.ts**

```ts
const DAMAGE: Record<string, string> = {
  A: 'Acid',
  B: 'Bludgeoning',
  C: 'Cold',
  F: 'Fire',
  O: 'Force',
  L: 'Lightning',
  N: 'Necrotic',
  P: 'Piercing',
  I: 'Poison',
  Y: 'Psychic',
  R: 'Radiant',
  S: 'Slashing',
  T: 'Thunder',
};

export function expandDamageType(code: string): string {
  return DAMAGE[code] ?? code;
}
```

**Step 7: Implement abilityScore.ts**

```ts
const ABILITY: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function expandAbilityScore(code: string): string {
  return ABILITY[code] ?? code;
}
```

**Step 8: Implement itemType.ts**

```ts
const ITEM_TYPE: Record<string, string> = {
  '$': 'Treasure',
  '$A': 'Art Object',
  '$C': 'Coinage',
  '$G': 'Gemstone',
  'A': 'Ammunition',
  'AF': 'Futuristic Ammunition',
  'AIR': 'Air Vehicle',
  'AT': 'Artisan Tool',
  'EXP': 'Explosive',
  'FD': 'Food and Drink',
  'G': 'Adventuring Gear',
  'GS': 'Gaming Set',
  'GV': 'Generic Variant',
  'HA': 'Heavy Armor',
  'IDG': 'Illegal Drug',
  'INS': 'Instrument',
  'LA': 'Light Armor',
  'M': 'Melee Weapon',
  'MA': 'Medium Armor',
  'MNT': 'Mount',
  'OTH': 'Other',
  'P': 'Potion',
  'R': 'Ranged Weapon',
  'RD': 'Rod',
  'RG': 'Ring',
  'S': 'Shield',
  'SC': 'Scroll',
  'SCF': 'Spellcasting Focus',
  'SHP': 'Water Vehicle',
  'SPC': 'Space Vehicle',
  'T': 'Tool',
  'TAH': 'Tack and Harness',
  'TB': 'Trade Bar',
  'TG': 'Trade Good',
  'VEH': 'Land Vehicle',
  'WD': 'Wand',
};

export function expandItemType(code: string): string {
  return ITEM_TYPE[code] ?? code;
}
```

**Step 9: Implement itemProperty.ts**

```ts
const ITEM_PROP: Record<string, string> = {
  '2H': 'Two-Handed',
  'A': 'Ammunition',
  'AF': 'Futuristic Ammunition',
  'BF': 'Burst Fire',
  'ER': 'Extended Reach',
  'F': 'Finesse',
  'H': 'Heavy',
  'L': 'Light',
  'LD': 'Loading',
  'OTH': 'Other',
  'R': 'Reach',
  'RLD': 'Reload',
  'S': 'Special',
  'T': 'Thrown',
  'V': 'Versatile',
  'Vst': 'Vestige of Divergence',
};

export function expandItemProperty(code: string): string {
  return ITEM_PROP[code] ?? code;
}
```

**Step 10: Implement itemRecharge.ts**

```ts
const RECHARGE: Record<string, string> = {
  round: 'Every Round',
  restShort: 'Short Rest',
  restLong: 'Long Rest',
  dawn: 'Dawn',
  dusk: 'Dusk',
  midnight: 'Midnight',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  decade: 'Decade',
  century: 'Century',
  special: 'Special',
};

export function expandItemRecharge(code: string): string {
  return RECHARGE[code] ?? code;
}
```

**Step 11: Implement featCategory.ts**

```ts
const FEAT_CAT: Record<string, string> = {
  D: 'Dragonmark',
  G: 'General',
  O: 'Origin',
  FS: 'Fighting Style',
  'FS:P': 'Fighting Style (Paladin)',
  'FS:R': 'Fighting Style (Ranger)',
  EB: 'Epic Boon',
};

export function expandFeatCategory(code: string): string {
  return FEAT_CAT[code] ?? code;
}
```

**Step 12: Implement attackType.ts**

```ts
const ATK: Record<string, string> = {
  MW: 'Melee Weapon Attack',
  RW: 'Ranged Weapon Attack',
  MS: 'Melee Spell Attack',
  RS: 'Ranged Spell Attack',
};

export function expandAttackType(code: string): string {
  return ATK[code] ?? code;
}
```

**Step 13: Implement monsterLanguage.ts**

```ts
const LANG: Record<string, string> = {
  AB: 'Abyssal', AQ: 'Aquan', AU: 'Auran', C: 'Common',
  CE: 'Celestial', CS: "Can't Speak Known Languages",
  CSL: 'Common Sign Language', D: 'Dwarvish', DR: 'Draconic',
  DS: 'Deep Speech', DU: 'Druidic', E: 'Elvish', G: 'Gnomish',
  GI: 'Giant', GO: 'Goblin', GTH: 'Gith', H: 'Halfling',
  I: 'Infernal', IG: 'Ignan', LF: 'Languages Known in Life',
  O: 'Orc', OTH: 'Other', P: 'Primordial', S: 'Sylvan',
  T: 'Terran', TC: "Thieves' Cant", TP: 'Telepathy',
  U: 'Undercommon', X: 'Any (Choose)', XX: 'All',
};

export function expandMonsterLanguage(code: string): string {
  return LANG[code] ?? code;
}
```

**Step 14: Implement spellRange.ts**

```ts
interface RawRange {
  type: string;
  distance?: { type: string; amount?: number };
}

export function expandSpellRange(range: RawRange): string {
  if (!range) return 'Unknown';
  switch (range.type) {
    case 'self': return 'Self';
    case 'touch': return 'Touch';
    case 'sight': return 'Sight';
    case 'unlimited': return 'Unlimited';
    case 'special': return 'Special';
    case 'plane': return 'Unlimited (same plane)';
    case 'point':
    case 'line':
    case 'cube':
    case 'cone':
    case 'emanation':
    case 'radius':
    case 'sphere':
    case 'hemisphere':
    case 'cylinder': {
      const dist = range.distance;
      if (!dist) return range.type;
      if (dist.type === 'self') return 'Self';
      if (dist.type === 'touch') return 'Touch';
      if (dist.type === 'sight') return 'Sight';
      if (dist.type === 'unlimited') return 'Unlimited';
      const unit = dist.amount === 1
        ? dist.type.replace(/s$/, '')
        : dist.type;
      return dist.amount !== undefined ? `${dist.amount} ${unit}` : dist.type;
    }
    default:
      return range.type;
  }
}
```

**Step 15: Implement spellDuration.ts**

```ts
interface RawDuration {
  type: string;
  duration?: { type: string; amount?: number };
  concentration?: boolean;
  ends?: string[];
}

export function expandSpellDuration(durations: RawDuration[]): string {
  if (!durations?.length) return 'Unknown';
  const d = durations[0];
  let base: string;
  switch (d.type) {
    case 'instant': base = 'Instantaneous'; break;
    case 'special': base = 'Special'; break;
    case 'permanent': base = 'Permanent'; break;
    case 'timed': {
      const amt = d.duration?.amount ?? 1;
      const unit = d.duration?.type ?? 'round';
      const unitStr = amt === 1 ? unit : `${unit}s`;
      base = `${amt} ${unitStr}`;
      break;
    }
    default: base = d.type;
  }
  if (d.concentration) base = `Concentration, up to ${base}`;
  return base;
}
```

**Step 16: Implement spellTags.ts**

```ts
const MISC_TAG: Record<string, string> = {
  HL: 'Healing', THP: 'Grants Temporary HP', SGT: 'Requires Sight',
  PRM: 'Permanent Effects', SCL: 'Scaling Effects', SCT: 'Scaling Targets',
  SMN: 'Summons Creature', MAC: 'Modifies AC', TP: 'Teleportation',
  FMV: 'Forced Movement', RO: 'Rollable Effects', LGTS: 'Creates Sunlight',
  LGT: 'Creates Light', UBA: 'Uses Bonus Action', PS: 'Plane Shifting',
  OBS: 'Obscures Vision', DFT: 'Difficult Terrain', AAD: 'Additional Attack Damage',
  OBJ: 'Affects Objects', ADV: 'Grants Advantage', PIR: 'Permanent If Repeated',
};

const AREA_TAG: Record<string, string> = {
  ST: 'Single Target', MT: 'Multiple Targets', C: 'Cube', N: 'Cone',
  Y: 'Cylinder', S: 'Sphere', R: 'Circle', Q: 'Square',
  L: 'Line', H: 'Hemisphere', W: 'Wall', E: 'Emanation',
};

export function expandMiscTag(code: string): string {
  return MISC_TAG[code] ?? code;
}

export function expandAreaTag(code: string): string {
  return AREA_TAG[code] ?? code;
}
```

**Step 17: Implement inlineRenderer.ts**

```ts
export function renderInline(text: string): string {
  if (!text || typeof text !== 'string') return text ?? '';
  // Iteratively resolve innermost tags first
  let prev = '';
  let result = text;
  while (prev !== result) {
    prev = result;
    result = result.replace(/\{@(\w+)([^{}]*)\}/g, (_, tag: string, content: string) => {
      return resolveTag(tag, content.trim());
    });
  }
  return result;
}

function resolveTag(tag: string, content: string): string {
  switch (tag) {
    // Formatting — strip markup, keep text
    case 'b': case 'bold': case 'i': case 'italic':
    case 'strike': case 'u': case 's': case 'sup':
    case 'note': case 'tip': case 'color': case 'highlight':
      return content.split('|')[0];

    // Dice and numbers
    case 'dice': case 'damage': case 'd20':
      return content.split('|')[0];

    case 'hit': {
      const n = parseInt(content, 10);
      return isNaN(n) ? content : (n >= 0 ? `+${n}` : `${n}`);
    }

    case 'dc':
      return `DC ${content}`;

    case 'recharge':
      return `(Recharge ${content}–6)`;

    case 'chance':
      return `${content} percent`;

    case 'scaledice': case 'scaledamage': {
      // format: "1d6|2d6|3d6" — take last part (max scaling)
      const parts = content.split('|');
      return parts[parts.length - 1];
    }

    // Entity references — "name|source" → name
    case 'condition': case 'spell': case 'item': case 'creature':
    case 'class': case 'feat': case 'background': case 'race':
    case 'sense': case 'skill': case 'action': case 'language':
    case 'variantrule': case 'table': case 'adventure': case 'book':
    case 'filter': case 'quickref': case 'charoption': case 'optfeature':
    case 'reward': case 'vehicle': case 'vehupgrade': case 'object':
    case 'trap': case 'hazard': case 'deity': case 'cult': case 'boon':
      return content.split('|')[0];

    // Attack notation
    case 'atk': {
      const map: Record<string, string> = {
        mw: 'Melee Weapon', rw: 'Ranged Weapon',
        ms: 'Melee Spell', rs: 'Ranged Spell',
        'mw,rw': 'Melee or Ranged Weapon',
        'mw,rs': 'Melee or Ranged Weapon/Spell',
        'ms,rs': 'Melee or Ranged Spell',
      };
      return (map[content.trim()] ?? content) + ' Attack:';
    }

    // Hit marker
    case 'h':
      return 'Hit:';

    // Coin types
    case 'coinssimple': case 'coinsimple':
      return content;

    default:
      return content.split('|')[0];
  }
}
```

**Step 18: Create index.ts barrel**

```ts
export { expandSpellSchool } from './spellSchool.js';
export { expandSpellRange } from './spellRange.js';
export { expandSpellDuration } from './spellDuration.js';
export { expandMiscTag, expandAreaTag } from './spellTags.js';
export { expandSize } from './size.js';
export { expandAlignment } from './alignment.js';
export { expandDamageType } from './damageType.js';
export { expandMonsterLanguage } from './monsterLanguage.js';
export { expandAbilityScore } from './abilityScore.js';
export { expandItemType } from './itemType.js';
export { expandItemProperty } from './itemProperty.js';
export { expandItemRecharge } from './itemRecharge.js';
export { expandFeatCategory } from './featCategory.js';
export { expandAttackType } from './attackType.js';
export { renderInline } from './inlineRenderer.js';
```

**Step 19: Run tests**

```bash
npx vitest run src/expanders/expanders.test.ts
```

Expected: All tests PASS.

**Step 20: Commit**

```bash
git add src/expanders/
git commit -m "feat: add all code expanders and inline tag renderer"
```

---

## Task 3: Define TypeScript types

These are the **post-expansion** shapes (what the API returns), not raw 5etools shapes.

**Files:**
- Create: `src/types/spell.ts`
- Create: `src/types/monster.ts`
- Create: `src/types/item.ts`
- Create: `src/types/class.ts`
- Create: `src/types/feat.ts`
- Create: `src/types/background.ts`
- Create: `src/types/race.ts`
- Create: `src/types/condition.ts`
- Create: `src/types/skill.ts`
- Create: `src/types/language.ts`
- Create: `src/types/index.ts`

**Step 1: Create spell.ts**

```ts
export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material?: string;
  royalty?: boolean;
}

export interface Spell {
  name: string;
  source: string;
  level: number;
  school: string;
  castingTime: string;
  castingTimeCondition?: string;
  range: string;
  components: SpellComponents;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  classes?: string[];
  damageTypes: string[];
  savingThrow: string[];
  areaTags: string[];
  miscTags: string[];
  srd52: boolean;
}
```

**Step 2: Create monster.ts**

```ts
export interface MonsterSpeed {
  walk?: number;
  fly?: number;
  swim?: number;
  burrow?: number;
  climb?: number;
  canHover?: boolean;
}

export interface MonsterAbilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterAction {
  name: string;
  description: string;
}

export interface Monster {
  name: string;
  source: string;
  size: string[];
  type: string;
  alignment: string;
  ac: number;
  acNote?: string;
  hp: number | string;
  hpFormula?: string;
  speed: MonsterSpeed;
  abilities: MonsterAbilities;
  savingThrows?: Record<string, number>;
  skills?: Record<string, number>;
  damageImmunities?: string[];
  damageResistances?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  senses: string[];
  passivePerception: number;
  languages: string[];
  cr: string;
  traits: MonsterAction[];
  actions: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: MonsterAction[];
  mythicActions?: MonsterAction[];
  srd52: boolean;
}
```

**Step 3: Create item.ts**

```ts
export interface Item {
  name: string;
  source: string;
  type: string;
  rarity: string;
  weight?: number;
  value?: string;
  attunement?: string;
  wondrous: boolean;
  properties: string[];
  damage?: string;
  damageType?: string;
  range?: string;
  ac?: number;
  bonusAttack?: string;
  bonusSpellAttack?: string;
  bonusSpellSaveDc?: string;
  bonusAc?: string;
  recharge?: string;
  charges?: number;
  description: string;
  srd52: boolean;
}
```

**Step 4: Create class.ts**

```ts
export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface Subclass {
  name: string;
  source: string;
  shortName: string;
  features: ClassFeature[];
}

export interface ClassData {
  name: string;
  source: string;
  hitDie: number;
  primaryAbility: string[];
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillChoices: string[];
  skillCount: number;
  features: ClassFeature[];
  subclasses: Subclass[];
  srd52: boolean;
}
```

**Step 5: Create feat.ts**

```ts
export interface Feat {
  name: string;
  source: string;
  category: string;
  prerequisite?: string;
  repeatable?: boolean;
  abilityBoost?: string[];
  description: string;
  srd52: boolean;
}
```

**Step 6: Create background.ts**

```ts
export interface Background {
  name: string;
  source: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  equipment: string;
  description: string;
  features: Array<{ name: string; description: string }>;
  srd52: boolean;
}
```

**Step 7: Create race.ts**

```ts
export interface Race {
  name: string;
  source: string;
  size: string[];
  speed: number;
  abilityBoosts?: string[];
  traits: Array<{ name: string; description: string }>;
  languages: string[];
  description: string;
  srd52: boolean;
}
```

**Step 8: Create condition.ts**

```ts
export interface Condition {
  name: string;
  source: string;
  description: string;
  effects: string[];
  srd52: boolean;
}
```

**Step 9: Create skill.ts**

```ts
export interface Skill {
  name: string;
  source: string;
  ability: string;
  description: string;
  srd52: boolean;
}
```

**Step 10: Create language.ts**

```ts
export interface Language {
  name: string;
  source: string;
  type: string;
  typicalSpeakers: string[];
  script?: string;
  description?: string;
  srd52: boolean;
}
```

**Step 11: Create index.ts barrel**

```ts
export type { Spell, SpellComponents } from './spell.js';
export type { Monster, MonsterSpeed, MonsterAbilities, MonsterAction } from './monster.js';
export type { Item } from './item.js';
export type { ClassData, ClassFeature, Subclass } from './class.js';
export type { Feat } from './feat.js';
export type { Background } from './background.js';
export type { Race } from './race.js';
export type { Condition } from './condition.js';
export type { Skill } from './skill.js';
export type { Language } from './language.js';
```

**Step 12: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for all SRD5.2 resources"
```

---

## Task 4: Build the store

**Files:**
- Create: `src/store.ts`

**Step 1: Create store.ts**

```ts
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

// Normalise a name for use as a Map key
export function normalizeKey(name: string): string {
  return name.toLowerCase().trim();
}
```

**Step 2: Commit**

```bash
git add src/store.ts
git commit -m "feat: add in-memory store"
```

---

## Task 5: Build the loader

This is the most complex task. The loader reads 5etools JSON, filters for SRD5.2 content, expands all codes, and populates the store.

**Files:**
- Create: `src/loader.ts`
- Test: `src/loader.test.ts`

**Step 1: Write loader tests**

Create `src/loader.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { loadData } from './loader.js';
import { store } from './store.js';

// These tests require the actual 5etools data directory.
// Set DATA_PATH in .env before running.
describe('loadData', () => {
  beforeAll(async () => {
    process.env.DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';
    await loadData(process.env.DATA_PATH);
  });

  it('loads spells into the store', () => {
    expect(store.spells.size).toBeGreaterThan(0);
  });

  it('all spells have srd52: true', () => {
    for (const spell of store.spells.values()) {
      expect(spell.srd52).toBe(true);
    }
  });

  it('spell schools are expanded', () => {
    const spells = [...store.spells.values()];
    const schools = new Set(spells.map(s => s.school));
    expect(schools.has('Evocation')).toBe(true);
    expect(schools.has('V')).toBe(false);
  });

  it('loads monsters', () => {
    expect(store.monsters.size).toBeGreaterThan(0);
  });

  it('monster sizes are expanded', () => {
    const monsters = [...store.monsters.values()];
    const sizes = monsters.flatMap(m => m.size);
    expect(sizes.some(s => s === 'Medium')).toBe(true);
    expect(sizes.some(s => s === 'M')).toBe(false);
  });

  it('loads items', () => {
    expect(store.items.size).toBeGreaterThan(0);
  });

  it('loads conditions', () => {
    expect(store.conditions.size).toBeGreaterThan(0);
  });

  it('Acid Splash is findable by lowercase key', () => {
    expect(store.spells.has('acid splash')).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/loader.test.ts
```

Expected: FAIL — loader.ts not found.

**Step 3: Implement loader.ts**

Create `src/loader.ts`. This is the most critical file — read carefully.

```ts
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { store, normalizeKey } from './store.js';
import type { Spell, Monster, Item, ClassData, Feat, Background, Race, Condition, Skill, Language, ClassFeature, Subclass, MonsterAction } from './types/index.js';
import {
  expandSpellSchool, expandSpellRange, expandSpellDuration,
  expandMiscTag, expandAreaTag, expandSize, expandAlignment,
  expandDamageType, expandMonsterLanguage, expandAbilityScore,
  expandItemType, expandItemProperty, expandItemRecharge,
  expandFeatCategory, renderInline,
} from './expanders/index.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function readJson(filePath: string): any {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function isSrd52(entry: any): boolean {
  return entry?.srd52 === true || entry?.basicRules2024 === true;
}

function warnEdgeCases(entries: any[], type: string): void {
  for (const e of entries) {
    if (e?.basicRules2024 === true && e?.srd52 !== true) {
      console.warn(`[loader] ${type} "${e.name}" has basicRules2024 but not srd52 — verify against SRD PDF`);
    }
  }
}

// Render a 5etools entries array to a plain string
function renderEntries(entries: any[]): string {
  if (!entries) return '';
  return entries.map(e => {
    if (typeof e === 'string') return renderInline(e);
    if (typeof e === 'object') {
      if (e.type === 'list') {
        return (e.items ?? []).map((i: any) =>
          typeof i === 'string' ? `• ${renderInline(i)}` : `• ${renderInline(i.name ?? '')}: ${renderEntries(i.entries ?? [])}`
        ).join('\n');
      }
      if (e.entries) {
        const heading = e.name ? `${e.name}: ` : '';
        return heading + renderEntries(e.entries);
      }
      if (e.entry) return renderInline(e.entry);
    }
    return '';
  }).filter(Boolean).join('\n');
}

function renderCastingTime(time: any[]): string {
  if (!time?.length) return 'Unknown';
  const t = time[0];
  return `${t.number} ${t.unit}${t.number !== 1 ? 's' : ''}`;
}

// ─── Spell loader ────────────────────────────────────────────────────────────

function loadSpells(dataPath: string): void {
  const indexPath = join(dataPath, 'spells', 'index.json');
  const index: Record<string, string> = readJson(indexPath) ?? {};

  const files = Object.values(index).map(f => join(dataPath, 'spells', f));
  // Also include any directly listed spell files not in index
  const allFiles = [...new Set(files)];

  for (const filePath of allFiles) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.spell) continue;

    const srd = data.spell.filter(isSrd52);
    warnEdgeCases(data.spell, 'spell');

    for (const raw of srd) {
      const spell: Spell = {
        name: raw.name,
        source: raw.source,
        level: raw.level,
        school: expandSpellSchool(raw.school),
        castingTime: renderCastingTime(raw.time),
        range: expandSpellRange(raw.range),
        components: {
          verbal: raw.components?.v === true,
          somatic: raw.components?.s === true,
          material: typeof raw.components?.m === 'string'
            ? raw.components.m
            : raw.components?.m?.text,
          royalty: raw.components?.r === true,
        },
        duration: expandSpellDuration(raw.duration),
        concentration: raw.duration?.some((d: any) => d.concentration) ?? false,
        ritual: raw.meta?.ritual === true,
        description: renderEntries(raw.entries ?? []),
        higherLevels: raw.entriesHigherLevel
          ? renderEntries(raw.entriesHigherLevel.flatMap((e: any) => e.entries ?? []))
          : undefined,
        classes: raw.classes?.fromClassList?.map((c: any) => c.name) ?? [],
        damageTypes: (raw.damageInflict ?? []).map(expandDamageType),
        savingThrow: (raw.savingThrow ?? []).map(
          (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        ),
        areaTags: (raw.areaTags ?? []).map(expandAreaTag),
        miscTags: (raw.miscTags ?? []).map(expandMiscTag),
        srd52: true,
      };
      store.spells.set(normalizeKey(spell.name), spell);
    }
  }
  console.log(`[loader] Loaded ${store.spells.size} SRD5.2 spells`);
}

// ─── Monster loader ──────────────────────────────────────────────────────────

function parseAc(ac: any[]): { ac: number; note?: string } {
  if (!ac?.length) return { ac: 10 };
  const first = ac[0];
  if (typeof first === 'number') return { ac: first };
  const note = first.from ? first.from.join(', ') : first.condition;
  return { ac: first.ac ?? 10, note };
}

function parseHp(hp: any): { hp: number | string; formula?: string } {
  if (!hp) return { hp: 0 };
  if (hp.special) return { hp: hp.special };
  return { hp: hp.average ?? 0, formula: hp.formula };
}

function parseActions(actions: any[]): MonsterAction[] {
  if (!actions) return [];
  return actions.map(a => ({
    name: a.name ?? '',
    description: renderEntries(a.entries ?? []),
  }));
}

function loadMonsters(dataPath: string): void {
  const indexPath = join(dataPath, 'bestiary', 'index.json');
  const index: Record<string, string> = readJson(indexPath) ?? {};

  for (const filePath of Object.values(index).map(f => join(dataPath, 'bestiary', f))) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.monster) continue;

    const srd = data.monster.filter(isSrd52);
    warnEdgeCases(data.monster, 'monster');

    for (const raw of srd) {
      const { ac, note: acNote } = parseAc(raw.ac);
      const { hp, formula: hpFormula } = parseHp(raw.hp);

      const monster: Monster = {
        name: raw.name,
        source: raw.source,
        size: (raw.size ?? []).map(expandSize),
        type: typeof raw.type === 'string' ? raw.type : raw.type?.type ?? 'unknown',
        alignment: expandAlignment(raw.alignment ?? []),
        ac,
        acNote,
        hp,
        hpFormula,
        speed: {
          walk: raw.speed?.walk ?? (typeof raw.speed === 'number' ? raw.speed : undefined),
          fly: raw.speed?.fly ?? (typeof raw.speed?.fly === 'object' ? raw.speed.fly.number : undefined),
          swim: raw.speed?.swim,
          burrow: raw.speed?.burrow,
          climb: raw.speed?.climb,
          canHover: raw.speed?.canHover,
        },
        abilities: {
          str: raw.str, dex: raw.dex, con: raw.con,
          int: raw.int, wis: raw.wis, cha: raw.cha,
        },
        savingThrows: raw.save
          ? Object.fromEntries(Object.entries(raw.save).map(([k, v]) => [expandAbilityScore(k), Number(v)]))
          : undefined,
        skills: raw.skill
          ? Object.fromEntries(Object.entries(raw.skill).map(([k, v]) => [k, Number(v)]))
          : undefined,
        damageImmunities: (raw.immune ?? []).map((d: any) =>
          typeof d === 'string' ? expandDamageType(d) : expandDamageType(d.immune ?? d)
        ),
        damageResistances: (raw.resist ?? []).map((d: any) =>
          typeof d === 'string' ? expandDamageType(d) : expandDamageType(d.resist ?? d)
        ),
        damageVulnerabilities: (raw.vulnerable ?? []).map((d: any) =>
          typeof d === 'string' ? expandDamageType(d) : d
        ),
        conditionImmunities: (raw.conditionImmune ?? []).map((c: any) =>
          typeof c === 'string' ? c : c.conditionImmune ?? c
        ),
        senses: raw.senses ?? [],
        passivePerception: raw.passive ?? 10,
        languages: (raw.languages ?? []).map((l: any) =>
          typeof l === 'string' ? expandMonsterLanguage(l) : l
        ),
        cr: typeof raw.cr === 'string' ? raw.cr : raw.cr?.cr ?? '0',
        traits: parseActions(raw.trait),
        actions: parseActions(raw.action),
        bonusActions: raw.bonus ? parseActions(raw.bonus) : undefined,
        reactions: raw.reaction ? parseActions(raw.reaction) : undefined,
        legendaryActions: raw.legendary ? parseActions(raw.legendary) : undefined,
        mythicActions: raw.mythic ? parseActions(raw.mythic) : undefined,
        srd52: true,
      };
      store.monsters.set(normalizeKey(monster.name), monster);
    }
  }
  console.log(`[loader] Loaded ${store.monsters.size} SRD5.2 monsters`);
}

// ─── Item loader ─────────────────────────────────────────────────────────────

function loadItems(dataPath: string): void {
  const files = ['items.json', 'items-base.json'];
  for (const filename of files) {
    const data = readJson(join(dataPath, filename));
    if (!data) continue;
    const entries: any[] = [...(data.item ?? []), ...(data.baseitem ?? [])];
    const srd = entries.filter(isSrd52);
    warnEdgeCases(entries, 'item');

    for (const raw of srd) {
      const item: Item = {
        name: raw.name,
        source: raw.source,
        type: raw.type ? expandItemType(raw.type) : 'Adventuring Gear',
        rarity: raw.rarity ?? 'none',
        weight: raw.weight,
        value: raw.value !== undefined ? `${raw.value} cp` : undefined,
        attunement: typeof raw.reqAttune === 'string' ? raw.reqAttune : raw.reqAttune === true ? 'required' : undefined,
        wondrous: raw.wondrous === true,
        properties: (raw.property ?? []).map(expandItemProperty),
        damage: raw.dmg1,
        damageType: raw.dmgType ? expandDamageType(raw.dmgType) : undefined,
        range: raw.range,
        ac: raw.ac,
        bonusAttack: raw.bonusWeapon,
        bonusSpellAttack: raw.bonusSpellAttack,
        bonusSpellSaveDc: raw.bonusSpellSaveDc,
        bonusAc: raw.bonusAc,
        recharge: raw.recharge ? expandItemRecharge(raw.recharge) : undefined,
        charges: raw.charges,
        description: renderEntries(raw.entries ?? []),
        srd52: true,
      };
      store.items.set(normalizeKey(item.name), item);
    }
  }
  console.log(`[loader] Loaded ${store.items.size} SRD5.2 items`);
}

// ─── Class loader ────────────────────────────────────────────────────────────

function loadClasses(dataPath: string): void {
  const indexPath = join(dataPath, 'class', 'index.json');
  const index: Record<string, string> = readJson(indexPath) ?? {};

  for (const filePath of Object.values(index).map(f => join(dataPath, 'class', f))) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.class) continue;

    for (const raw of data.class.filter(isSrd52)) {
      const features: ClassFeature[] = (data.classFeature ?? [])
        .filter((f: any) => f.className === raw.name && f.classSource === raw.source && isSrd52(f))
        .map((f: any) => ({
          name: f.name,
          level: f.level,
          description: renderEntries(f.entries ?? []),
        }));

      const subclasses: Subclass[] = (data.subclass ?? [])
        .filter((sc: any) => sc.className === raw.name && isSrd52(sc))
        .map((sc: any) => {
          const scFeatures: ClassFeature[] = (data.subclassFeature ?? [])
            .filter((f: any) => f.subclassShortName === sc.shortName && f.className === raw.name && isSrd52(f))
            .map((f: any) => ({
              name: f.name,
              level: f.level,
              description: renderEntries(f.entries ?? []),
            }));
          return {
            name: sc.name,
            source: sc.source,
            shortName: sc.shortName,
            features: scFeatures,
          };
        });

      const proficiencies = raw.startingProficiencies ?? {};
      const cls: ClassData = {
        name: raw.name,
        source: raw.source,
        hitDie: raw.hd?.faces ?? 8,
        primaryAbility: (raw.proficiency ?? []).map(expandAbilityScore),
        savingThrows: (raw.proficiency ?? []).map(expandAbilityScore),
        armorProficiencies: (proficiencies.armor ?? []).map((a: any) =>
          typeof a === 'string' ? a : a.proficiency ?? a
        ),
        weaponProficiencies: (proficiencies.weapons ?? []).map((w: any) =>
          typeof w === 'string' ? w : w.proficiency ?? w
        ),
        toolProficiencies: (proficiencies.tools ?? []).map((t: any) =>
          typeof t === 'string' ? t : t.proficiency ?? t
        ),
        skillChoices: proficiencies.skills?.[0]?.choose?.from ?? [],
        skillCount: proficiencies.skills?.[0]?.choose?.count ?? 0,
        features,
        subclasses,
        srd52: true,
      };
      store.classes.set(normalizeKey(cls.name), cls);
    }
  }
  console.log(`[loader] Loaded ${store.classes.size} SRD5.2 classes`);
}

// ─── Simple top-level loaders ─────────────────────────────────────────────────

function loadFeats(dataPath: string): void {
  const data = readJson(join(dataPath, 'feats.json'));
  if (!data?.feat) return;
  for (const raw of data.feat.filter(isSrd52)) {
    const feat: Feat = {
      name: raw.name,
      source: raw.source,
      category: raw.category ? expandFeatCategory(raw.category) : 'General',
      prerequisite: raw.prerequisite
        ? renderEntries(Array.isArray(raw.prerequisite) ? raw.prerequisite.map((p: any) => JSON.stringify(p)) : [raw.prerequisite])
        : undefined,
      repeatable: raw.repeatable === true,
      abilityBoost: raw.ability?.flatMap((a: any) => Object.keys(a).map(expandAbilityScore)),
      description: renderEntries(raw.entries ?? []),
      srd52: true,
    };
    store.feats.set(normalizeKey(feat.name), feat);
  }
  console.log(`[loader] Loaded ${store.feats.size} SRD5.2 feats`);
}

function loadBackgrounds(dataPath: string): void {
  const data = readJson(join(dataPath, 'backgrounds.json'));
  if (!data?.background) return;
  for (const raw of data.background.filter(isSrd52)) {
    const profs = raw.startingProficiencies ?? {};
    const bg: Background = {
      name: raw.name,
      source: raw.source,
      skillProficiencies: profs.skills ?? [],
      toolProficiencies: profs.tools ?? [],
      languages: profs.languageChoices ? ['any (your choice)'] : (profs.languages ?? []),
      equipment: raw.startingEquipment?.default?.join(', ') ?? '',
      description: renderEntries(raw.entries ?? []),
      features: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'entries' && e.name)
        .map((e: any) => ({ name: e.name, description: renderEntries(e.entries ?? []) })),
      srd52: true,
    };
    store.backgrounds.set(normalizeKey(bg.name), bg);
  }
  console.log(`[loader] Loaded ${store.backgrounds.size} SRD5.2 backgrounds`);
}

function loadRaces(dataPath: string): void {
  const data = readJson(join(dataPath, 'races.json'));
  if (!data?.race) return;
  for (const raw of data.race.filter(isSrd52)) {
    const race: Race = {
      name: raw.name,
      source: raw.source,
      size: (raw.size ?? ['M']).map(expandSize),
      speed: typeof raw.speed === 'number' ? raw.speed : raw.speed?.walk ?? 30,
      abilityBoosts: raw.ability?.flatMap((a: any) => Object.keys(a).map(expandAbilityScore)),
      traits: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'entries' && e.name)
        .map((e: any) => ({ name: e.name, description: renderEntries(e.entries ?? []) })),
      languages: raw.languageProficiencies?.flatMap((lp: any) => Object.keys(lp)) ?? [],
      description: renderEntries(raw.entries ?? []),
      srd52: true,
    };
    store.races.set(normalizeKey(race.name), race);
  }
  console.log(`[loader] Loaded ${store.races.size} SRD5.2 races`);
}

function loadConditions(dataPath: string): void {
  const data = readJson(join(dataPath, 'conditionsdiseases.json'));
  if (!data?.condition) return;
  for (const raw of data.condition.filter(isSrd52)) {
    const condition: Condition = {
      name: raw.name,
      source: raw.source,
      description: renderEntries(raw.entries ?? []),
      effects: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'list')
        .flatMap((e: any) => (e.items ?? []).map((i: any) =>
          typeof i === 'string' ? renderInline(i) : renderEntries(i.entries ?? [])
        )),
      srd52: true,
    };
    store.conditions.set(normalizeKey(condition.name), condition);
  }
  console.log(`[loader] Loaded ${store.conditions.size} SRD5.2 conditions`);
}

function loadSkills(dataPath: string): void {
  const data = readJson(join(dataPath, 'skills.json'));
  if (!data?.skill) return;
  for (const raw of data.skill.filter(isSrd52)) {
    const skill: Skill = {
      name: raw.name,
      source: raw.source,
      ability: expandAbilityScore(raw.ability),
      description: renderEntries(raw.entries ?? []),
      srd52: true,
    };
    store.skills.set(normalizeKey(skill.name), skill);
  }
  console.log(`[loader] Loaded ${store.skills.size} SRD5.2 skills`);
}

function loadLanguages(dataPath: string): void {
  const data = readJson(join(dataPath, 'languages.json'));
  if (!data?.language) return;
  for (const raw of data.language.filter(isSrd52)) {
    const lang: Language = {
      name: raw.name,
      source: raw.source,
      type: raw.type ?? 'standard',
      typicalSpeakers: raw.typicalSpeakers ?? [],
      script: raw.script,
      description: renderEntries(raw.entries ?? []),
      srd52: true,
    };
    store.languages.set(normalizeKey(lang.name), lang);
  }
  console.log(`[loader] Loaded ${store.languages.size} SRD5.2 languages`);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function loadData(dataPath: string): Promise<void> {
  const resolved = resolve(dataPath);
  console.log(`[loader] Loading SRD5.2 data from ${resolved}`);
  loadSpells(resolved);
  loadMonsters(resolved);
  loadItems(resolved);
  loadClasses(resolved);
  loadFeats(resolved);
  loadBackgrounds(resolved);
  loadRaces(resolved);
  loadConditions(resolved);
  loadSkills(resolved);
  loadLanguages(resolved);
  console.log('[loader] Done.');
}
```

**Step 4: Run tests**

```bash
npx vitest run src/loader.test.ts
```

Expected: All PASS. Review the console output for any SRD5.2 edge case warnings.

**Step 5: Commit**

```bash
git add src/loader.ts src/loader.test.ts
git commit -m "feat: add 5etools data loader with SRD5.2 filtering"
```

---

## Task 6: Build services

Services contain all query/filter logic. Both REST plugins and MCP tools call these.

**Files:**
- Create: `src/services/spells.ts`
- Create: `src/services/monsters.ts`
- Create: `src/services/items.ts`
- Create: `src/services/classes.ts`
- Create: `src/services/feats.ts`
- Create: `src/services/backgrounds.ts`
- Create: `src/services/races.ts`
- Create: `src/services/conditions.ts`
- Create: `src/services/skills.ts`
- Create: `src/services/languages.ts`
- Test: `src/services/services.test.ts`

**Step 1: Create shared pagination helper**

Create `src/services/paginate.ts`:
```ts
export interface PageParams {
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export function paginate<T>(items: T[], params: PageParams): PageResult<T> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const start = (page - 1) * limit;
  return {
    total: items.length,
    page,
    limit,
    data: items.slice(start, start + limit),
  };
}
```

**Step 2: Write service tests**

Create `src/services/services.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { store, normalizeKey } from '../store.js';
import type { Spell } from '../types/index.js';
import { searchSpells, getSpell } from './spells.js';
import { searchMonsters, getMonster } from './monsters.js';
import { searchItems, getItem } from './items.js';
import { getCondition, listConditions } from './conditions.js';

// Seed minimal test data into the store before running tests
beforeAll(() => {
  const spell: Spell = {
    name: 'Fireball', source: 'XPHB', level: 3, school: 'Evocation',
    castingTime: '1 Action', range: '150 feet',
    components: { verbal: true, somatic: true, material: 'A tiny ball of bat guano and sulfur' },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'A bright streak flashes from your pointing finger...',
    damageTypes: ['Fire'], savingThrow: ['Dexterity'],
    areaTags: ['Sphere'], miscTags: ['Scaling Effects'], srd52: true,
  };
  store.spells.set(normalizeKey('Fireball'), spell);

  const spell2: Spell = {
    ...spell, name: 'Ice Storm', level: 4, school: 'Evocation',
    damageTypes: ['Cold', 'Bludgeoning'],
  };
  store.spells.set(normalizeKey('Ice Storm'), spell2);

  const spell3: Spell = {
    ...spell, name: 'Cure Wounds', level: 1, school: 'Abjuration',
    damageTypes: [], miscTags: ['Healing'],
  };
  store.spells.set(normalizeKey('Cure Wounds'), spell3);
});

describe('searchSpells', () => {
  it('returns all spells when no filters', () => {
    const result = searchSpells({});
    expect(result.total).toBeGreaterThanOrEqual(3);
  });

  it('filters by name (case-insensitive)', () => {
    const result = searchSpells({ name: 'fire' });
    expect(result.data.every(s => s.name.toLowerCase().includes('fire'))).toBe(true);
  });

  it('filters by level', () => {
    const result = searchSpells({ level: 3 });
    expect(result.data.every(s => s.level === 3)).toBe(true);
  });

  it('filters by school', () => {
    const result = searchSpells({ school: 'Abjuration' });
    expect(result.data.every(s => s.school === 'Abjuration')).toBe(true);
  });

  it('paginates correctly', () => {
    const result = searchSpells({}, { page: 1, limit: 1 });
    expect(result.data.length).toBe(1);
    expect(result.limit).toBe(1);
  });
});

describe('getSpell', () => {
  it('returns a spell by name (case-insensitive)', () => {
    const spell = getSpell('fireball');
    expect(spell?.name).toBe('Fireball');
  });

  it('returns undefined for unknown spell', () => {
    expect(getSpell('nonexistent spell')).toBeUndefined();
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/services/services.test.ts
```

Expected: FAIL — service modules not found.

**Step 4: Implement spells service**

Create `src/services/spells.ts`:
```ts
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
```

**Step 5: Implement monsters service**

Create `src/services/monsters.ts`:
```ts
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
```

**Step 6: Implement items service**

Create `src/services/items.ts`:
```ts
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
```

**Step 7: Implement classes service**

Create `src/services/classes.ts`:
```ts
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
```

**Step 8: Implement remaining services**

Create `src/services/feats.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Feat } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export interface FeatFilters { name?: string; category?: string; source?: string; }

export function searchFeats(filters: FeatFilters, page?: PageParams): PageResult<Feat> {
  let results = [...store.feats.values()];
  if (filters.name) { const q = filters.name.toLowerCase(); results = results.filter(f => f.name.toLowerCase().includes(q)); }
  if (filters.category) { const q = filters.category.toLowerCase(); results = results.filter(f => f.category.toLowerCase().includes(q)); }
  if (filters.source) results = results.filter(f => f.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getFeat(name: string): Feat | undefined {
  return store.feats.get(normalizeKey(name));
}
```

Create `src/services/backgrounds.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Background } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export function searchBackgrounds(filters: { name?: string; source?: string }, page?: PageParams): PageResult<Background> {
  let results = [...store.backgrounds.values()];
  if (filters.name) { const q = filters.name.toLowerCase(); results = results.filter(b => b.name.toLowerCase().includes(q)); }
  if (filters.source) results = results.filter(b => b.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getBackground(name: string): Background | undefined {
  return store.backgrounds.get(normalizeKey(name));
}
```

Create `src/services/races.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Race } from '../types/index.js';
import { paginate, type PageParams, type PageResult } from './paginate.js';

export function searchRaces(filters: { name?: string; source?: string }, page?: PageParams): PageResult<Race> {
  let results = [...store.races.values()];
  if (filters.name) { const q = filters.name.toLowerCase(); results = results.filter(r => r.name.toLowerCase().includes(q)); }
  if (filters.source) results = results.filter(r => r.source === filters.source);
  results.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(results, page ?? {});
}

export function getRace(name: string): Race | undefined {
  return store.races.get(normalizeKey(name));
}
```

Create `src/services/conditions.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Condition } from '../types/index.js';

export function listConditions(): Condition[] {
  return [...store.conditions.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCondition(name: string): Condition | undefined {
  return store.conditions.get(normalizeKey(name));
}
```

Create `src/services/skills.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Skill } from '../types/index.js';

export function listSkills(): Skill[] {
  return [...store.skills.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSkill(name: string): Skill | undefined {
  return store.skills.get(normalizeKey(name));
}
```

Create `src/services/languages.ts`:
```ts
import { store, normalizeKey } from '../store.js';
import type { Language } from '../types/index.js';

export function listLanguages(): Language[] {
  return [...store.languages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getLanguage(name: string): Language | undefined {
  return store.languages.get(normalizeKey(name));
}
```

**Step 9: Run all service tests**

```bash
npx vitest run src/services/services.test.ts
```

Expected: All PASS.

**Step 10: Commit**

```bash
git add src/services/
git commit -m "feat: add services layer for all SRD5.2 resources"
```

---

## Task 7: Build REST plugins and server

**Files:**
- Create: `src/plugins/spells.ts`
- Create: `src/plugins/monsters.ts`
- Create: `src/plugins/items.ts`
- Create: `src/plugins/classes.ts`
- Create: `src/plugins/feats.ts`
- Create: `src/plugins/backgrounds.ts`
- Create: `src/plugins/races.ts`
- Create: `src/plugins/conditions.ts`
- Create: `src/plugins/skills.ts`
- Create: `src/plugins/languages.ts`
- Create: `src/server.ts`
- Test: `src/plugins/plugins.test.ts`

**Step 1: Write plugin integration tests**

Create `src/plugins/plugins.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import Fastify from 'fastify';
import { store, normalizeKey } from '../store.js';
import type { Spell, Condition } from '../types/index.js';
import spellsPlugin from './spells.js';
import conditionsPlugin from './conditions.js';

let app: ReturnType<typeof Fastify>;

beforeAll(async () => {
  // Seed store
  const spell: Spell = {
    name: 'Fireball', source: 'XPHB', level: 3, school: 'Evocation',
    castingTime: '1 Action', range: '150 feet',
    components: { verbal: true, somatic: true, material: 'bat guano' },
    duration: 'Instantaneous', concentration: false, ritual: false,
    description: 'Explodes in a fiery ball.', damageTypes: ['Fire'],
    savingThrow: ['Dexterity'], areaTags: ['Sphere'], miscTags: [], srd52: true,
  };
  store.spells.set(normalizeKey('Fireball'), spell);

  const condition: Condition = {
    name: 'Blinded', source: 'XPHB',
    description: 'A blinded creature cannot see.',
    effects: ["Can't see", 'Attack rolls against you have advantage'],
    srd52: true,
  };
  store.conditions.set(normalizeKey('Blinded'), condition);

  app = Fastify();
  await app.register(spellsPlugin, { prefix: '/api/v1' });
  await app.register(conditionsPlugin, { prefix: '/api/v1' });
  await app.ready();
});

describe('GET /api/v1/spells', () => {
  it('returns paginated spells', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('filters by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells?name=fire' });
    const body = JSON.parse(res.body);
    expect(body.data.every((s: Spell) => s.name.toLowerCase().includes('fire'))).toBe(true);
  });
});

describe('GET /api/v1/spells/:name', () => {
  it('returns a spell by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells/Fireball' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe('Fireball');
  });

  it('returns 404 for unknown spell', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/spells/Nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/conditions', () => {
  it('returns all conditions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/conditions' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run to verify tests fail**

```bash
npx vitest run src/plugins/plugins.test.ts
```

Expected: FAIL — plugin modules not found.

**Step 3: Implement spells plugin**

Create `src/plugins/spells.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchSpells, getSpell } from '../services/spells.js';

const spellsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/spells', async (req, reply) => {
    const { name, level, school, class: cls, source, page, limit } = req.query as any;
    return searchSpells(
      { name, level: level !== undefined ? Number(level) : undefined, school, class: cls, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/spells/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const spell = getSpell(name);
    if (!spell) return reply.status(404).send({ error: `Spell '${name}' not found` });
    return spell;
  });
};

export default spellsPlugin;
```

**Step 4: Implement remaining plugins** (same pattern)

Create `src/plugins/monsters.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchMonsters, getMonster } from '../services/monsters.js';

const monstersPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/monsters', async (req, reply) => {
    const { name, cr, type, size, source, page, limit } = req.query as any;
    return searchMonsters({ name, cr, type, size, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/monsters/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const monster = getMonster(name);
    if (!monster) return reply.status(404).send({ error: `Monster '${name}' not found` });
    return monster;
  });
};

export default monstersPlugin;
```

Create `src/plugins/items.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchItems, getItem } from '../services/items.js';

const itemsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/items', async (req, reply) => {
    const { name, type, rarity, attunement, source, page, limit } = req.query as any;
    return searchItems(
      { name, type, rarity, attunement: attunement === 'true', source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }
    );
  });

  fastify.get('/items/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const item = getItem(name);
    if (!item) return reply.status(404).send({ error: `Item '${name}' not found` });
    return item;
  });
};

export default itemsPlugin;
```

Create `src/plugins/classes.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { getClasses, getClass, getSubclasses } from '../services/classes.js';

const classesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/classes', async (req, reply) => {
    const { page, limit } = req.query as any;
    return getClasses({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/classes/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const cls = getClass(name);
    if (!cls) return reply.status(404).send({ error: `Class '${name}' not found` });
    return cls;
  });

  fastify.get('/classes/:name/subclasses', async (req, reply) => {
    const { name } = req.params as { name: string };
    return { data: getSubclasses(name) };
  });
};

export default classesPlugin;
```

Create `src/plugins/feats.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchFeats, getFeat } from '../services/feats.js';

const featsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/feats', async (req, reply) => {
    const { name, category, source, page, limit } = req.query as any;
    return searchFeats({ name, category, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/feats/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const feat = getFeat(name);
    if (!feat) return reply.status(404).send({ error: `Feat '${name}' not found` });
    return feat;
  });
};

export default featsPlugin;
```

Create `src/plugins/backgrounds.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchBackgrounds, getBackground } from '../services/backgrounds.js';

const backgroundsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/backgrounds', async (req, reply) => {
    const { name, source, page, limit } = req.query as any;
    return searchBackgrounds({ name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/backgrounds/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const bg = getBackground(name);
    if (!bg) return reply.status(404).send({ error: `Background '${name}' not found` });
    return bg;
  });
};

export default backgroundsPlugin;
```

Create `src/plugins/races.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { searchRaces, getRace } from '../services/races.js';

const racesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/races', async (req, reply) => {
    const { name, source, page, limit } = req.query as any;
    return searchRaces({ name, source },
      { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  });

  fastify.get('/races/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const race = getRace(name);
    if (!race) return reply.status(404).send({ error: `Race '${name}' not found` });
    return race;
  });
};

export default racesPlugin;
```

Create `src/plugins/conditions.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { listConditions, getCondition } from '../services/conditions.js';

const conditionsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/conditions', async () => ({
    total: listConditions().length,
    data: listConditions(),
  }));

  fastify.get('/conditions/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const condition = getCondition(name);
    if (!condition) return reply.status(404).send({ error: `Condition '${name}' not found` });
    return condition;
  });
};

export default conditionsPlugin;
```

Create `src/plugins/skills.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { listSkills, getSkill } from '../services/skills.js';

const skillsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/skills', async () => ({ total: listSkills().length, data: listSkills() }));

  fastify.get('/skills/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const skill = getSkill(name);
    if (!skill) return reply.status(404).send({ error: `Skill '${name}' not found` });
    return skill;
  });
};

export default skillsPlugin;
```

Create `src/plugins/languages.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { listLanguages, getLanguage } from '../services/languages.js';

const languagesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/languages', async () => ({ total: listLanguages().length, data: listLanguages() }));

  fastify.get('/languages/:name', async (req, reply) => {
    const { name } = req.params as { name: string };
    const lang = getLanguage(name);
    if (!lang) return reply.status(404).send({ error: `Language '${name}' not found` });
    return lang;
  });
};

export default languagesPlugin;
```

**Step 5: Run plugin tests**

```bash
npx vitest run src/plugins/plugins.test.ts
```

Expected: All PASS.

**Step 6: Create server.ts**

Create `src/server.ts`:
```ts
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadData } from './loader.js';
import spellsPlugin from './plugins/spells.js';
import monstersPlugin from './plugins/monsters.js';
import itemsPlugin from './plugins/items.js';
import classesPlugin from './plugins/classes.js';
import featsPlugin from './plugins/feats.js';
import backgroundsPlugin from './plugins/backgrounds.js';
import racesPlugin from './plugins/races.js';
import conditionsPlugin from './plugins/conditions.js';
import skillsPlugin from './plugins/skills.js';
import languagesPlugin from './plugins/languages.js';

const PORT = Number(process.env.PORT ?? 3000);
const DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';

async function start(): Promise<void> {
  // Load data before starting server
  await loadData(DATA_PATH);

  const app = Fastify({ logger: true });

  await app.register(cors);

  const prefix = '/api/v1';
  await app.register(spellsPlugin, { prefix });
  await app.register(monstersPlugin, { prefix });
  await app.register(itemsPlugin, { prefix });
  await app.register(classesPlugin, { prefix });
  await app.register(featsPlugin, { prefix });
  await app.register(backgroundsPlugin, { prefix });
  await app.register(racesPlugin, { prefix });
  await app.register(conditionsPlugin, { prefix });
  await app.register(skillsPlugin, { prefix });
  await app.register(languagesPlugin, { prefix });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.listen({ port: PORT, host: '0.0.0.0' });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Step 7: Run the server manually to verify**

```bash
npm run dev
```

Expected output:
```
[loader] Loading SRD5.2 data from .../5etools-v2.24.3/data
[loader] Loaded N SRD5.2 spells
[loader] Loaded N SRD5.2 monsters
...
[loader] Done.
Server listening at http://0.0.0.0:3000
```

Then test: `curl http://localhost:3000/api/v1/spells?limit=3`

**Step 8: Commit**

```bash
git add src/plugins/ src/server.ts
git commit -m "feat: add REST plugins and server entrypoint"
```

---

## Task 8: Build the MCP server

**Files:**
- Create: `src/mcp/tools.ts`
- Create: `src/mcp/index.ts`

**Step 1: Create tools.ts**

Create `src/mcp/tools.ts`:
```ts
import { z } from 'zod';
import { searchSpells, getSpell } from '../services/spells.js';
import { searchMonsters, getMonster } from '../services/monsters.js';
import { searchItems, getItem } from '../services/items.js';
import { getClasses, getClass, getSubclasses } from '../services/classes.js';
import { searchFeats, getFeat } from '../services/feats.js';
import { getBackground } from '../services/backgrounds.js';
import { getRace } from '../services/races.js';
import { getCondition, listConditions } from '../services/conditions.js';
import { getSkill, listSkills } from '../services/skills.js';

export const tools = [
  {
    name: 'search_spells',
    description: 'Find spells by name, level, or school. Use when a player casts a spell, asks about a spell, or you need to know a spell\'s effect, range, or components.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Partial spell name to search for' },
        level: { type: 'number', description: 'Spell level (0 for cantrips, 1-9)' },
        school: { type: 'string', description: 'School of magic (e.g. Evocation, Necromancy)' },
        class: { type: 'string', description: 'Class that can cast the spell (e.g. Wizard, Cleric)' },
      },
    },
    handler: (args: any) => searchSpells(args, { limit: 20 }),
  },
  {
    name: 'get_spell',
    description: 'Get complete details of a single spell including casting time, range, components, duration, and full description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Exact or approximate spell name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const spell = getSpell(args.name);
      if (!spell) return { error: `Spell '${args.name}' not found` };
      return spell;
    },
  },
  {
    name: 'search_monsters',
    description: 'Find monsters by name, challenge rating, or creature type. Use when populating encounters or looking up enemy statistics.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Partial monster name' },
        cr: { type: 'string', description: 'Challenge rating (e.g. "1", "1/2", "10")' },
        type: { type: 'string', description: 'Creature type (e.g. beast, undead, humanoid)' },
        size: { type: 'string', description: 'Creature size (e.g. Tiny, Medium, Huge)' },
      },
    },
    handler: (args: any) => searchMonsters(args, { limit: 20 }),
  },
  {
    name: 'get_monster',
    description: 'Get a monster\'s full stat block including AC, HP, speed, ability scores, actions, and special traits.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Monster name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const monster = getMonster(args.name);
      if (!monster) return { error: `Monster '${args.name}' not found` };
      return monster;
    },
  },
  {
    name: 'search_items',
    description: 'Find weapons, armor, and magic items by name, type, or rarity.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Partial item name' },
        type: { type: 'string', description: 'Item type (e.g. Melee Weapon, Heavy Armor, Potion)' },
        rarity: { type: 'string', description: 'Item rarity (common, uncommon, rare, very rare, legendary)' },
        attunement: { type: 'boolean', description: 'True to show only items requiring attunement' },
      },
    },
    handler: (args: any) => searchItems(args, { limit: 20 }),
  },
  {
    name: 'get_item',
    description: 'Get full item description, properties, damage, and mechanical effects.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Item name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const item = getItem(args.name);
      if (!item) return { error: `Item '${args.name}' not found` };
      return item;
    },
  },
  {
    name: 'get_class',
    description: 'Get class features, hit die, saving throws, proficiencies, and spell slot progression for a character class.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Class name (e.g. Wizard, Fighter, Cleric)' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const cls = getClass(args.name);
      if (!cls) return { error: `Class '${args.name}' not found` };
      return cls;
    },
  },
  {
    name: 'get_subclasses',
    description: 'Get all available subclasses for a given class.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        className: { type: 'string', description: 'Class name' },
      },
      required: ['className'],
    },
    handler: (args: any) => ({ data: getSubclasses(args.className) }),
  },
  {
    name: 'search_feats',
    description: 'Find feats by name or category. Use when a player levels up and wants to choose a feat.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Partial feat name' },
        category: { type: 'string', description: 'Feat category: General, Origin, Epic Boon, Fighting Style' },
      },
    },
    handler: (args: any) => searchFeats(args, { limit: 20 }),
  },
  {
    name: 'get_feat',
    description: 'Get a feat\'s prerequisites and full description of benefits.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Feat name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const feat = getFeat(args.name);
      if (!feat) return { error: `Feat '${args.name}' not found` };
      return feat;
    },
  },
  {
    name: 'get_background',
    description: 'Get a background\'s features, skill proficiencies, and starting equipment.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Background name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const bg = getBackground(args.name);
      if (!bg) return { error: `Background '${args.name}' not found` };
      return bg;
    },
  },
  {
    name: 'get_race',
    description: 'Get racial traits, movement speed, and ability bonuses for a species/race.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Race/species name' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const race = getRace(args.name);
      if (!race) return { error: `Race '${args.name}' not found` };
      return race;
    },
  },
  {
    name: 'get_condition',
    description: 'Look up what a condition does mechanically. Use when a creature becomes Blinded, Poisoned, Stunned, etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Condition name (e.g. Blinded, Grappled, Poisoned)' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const condition = getCondition(args.name);
      if (!condition) return { error: `Condition '${args.name}' not found` };
      return condition;
    },
  },
  {
    name: 'list_conditions',
    description: 'List all conditions. Use for quick reference when unsure of a condition name.',
    inputSchema: { type: 'object' as const, properties: {} },
    handler: () => ({ data: listConditions() }),
  },
  {
    name: 'get_skill',
    description: 'Look up which ability score a skill uses and what it covers.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Skill name (e.g. Perception, Stealth, Athletics)' },
      },
      required: ['name'],
    },
    handler: (args: any) => {
      const skill = getSkill(args.name);
      if (!skill) return { error: `Skill '${args.name}' not found` };
      return skill;
    },
  },
  {
    name: 'list_skills',
    description: 'List all skills with their governing ability scores.',
    inputSchema: { type: 'object' as const, properties: {} },
    handler: () => ({ data: listSkills() }),
  },
];
```

**Step 2: Create mcp/index.ts**

Create `src/mcp/index.ts`:
```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';

export function createMcpServer(): Server {
  const server = new Server(
    { name: 'lldm-rules-api', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    try {
      const result = tool.handler(request.params.arguments ?? {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[mcp] LLDM Rules API MCP server running on stdio');
}
```

**Step 3: Add MCP entrypoint script**

Add to `package.json` scripts:
```json
"mcp": "tsx src/mcp/index.ts"
```

Also add a standalone `src/mcp-server.ts` for running MCP independently from the REST server:
```ts
import 'dotenv/config';
import { loadData } from './loader.js';
import { startMcpServer } from './mcp/index.js';

const DATA_PATH = process.env.DATA_PATH ?? '../5etools-v2.24.3/data';

loadData(DATA_PATH).then(startMcpServer).catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Step 4: Wire MCP into the REST server (optional — for combined mode)**

In `src/server.ts`, after `await app.listen(...)`, add:
```ts
// Also start MCP on stdio if env flag is set
if (process.env.MCP_STDIO === 'true') {
  const { startMcpServer } = await import('./mcp/index.js');
  await startMcpServer();
}
```

**Step 5: Verify MCP manually**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npm run mcp
```

Expected: JSON response listing all 16 tools.

**Step 6: Commit**

```bash
git add src/mcp/
git commit -m "feat: add MCP server with all SRD5.2 tools"
```

---

## Task 9: Run full test suite and verify data loading

**Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

**Step 2: Start the server and smoke test**

```bash
npm run dev
```

In a second terminal:
```bash
# Health check
curl http://localhost:3000/health

# List spells (should return many)
curl "http://localhost:3000/api/v1/spells?limit=5"

# Get a specific spell
curl "http://localhost:3000/api/v1/spells/Fireball"

# Filter spells by level
curl "http://localhost:3000/api/v1/spells?level=0&limit=5"

# List monsters by CR
curl "http://localhost:3000/api/v1/monsters?cr=1&limit=5"

# Get a condition
curl "http://localhost:3000/api/v1/conditions/Blinded"

# List all skills
curl "http://localhost:3000/api/v1/skills"
```

**Step 3: Verify SRD5.2 completeness**

Check the startup logs. You should see counts for each resource type. If any count is 0, investigate:
- Check that the data file exists at `DATA_PATH`
- Check whether the entries in that file actually have `srd52: true` or `basicRules2024: true`
- Cross-reference with `SRD_CC_v5.2.1.pdf` if needed

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete LLDM Rules API v0.1.0"
```

---

## Notes for Implementation

- **Data path:** The `.env` file must point to `../5etools-v2.24.3/data` (relative to the `lldm-rules-api/` directory). Adjust if running from a different working directory.
- **SRD5.2 edge cases:** The loader logs warnings for `basicRules2024: true` entries without `srd52: true`. Review these against the PDF.
- **`{@tag}` renderer:** The `inlineRenderer.ts` handles the most common tags. If you find rendered descriptions containing `{@...}` that weren't resolved, add the tag pattern to `inlineRenderer.ts`.
- **MCP transport:** For the DM app, spawn `node dist/mcp-server.js` as a child process and communicate via stdin/stdout.
- **Item properties:** The `items.json` stores base weapon/armor properties under `property` as an array of shortcodes (e.g. `["F", "L"]`). These are expanded by `itemProperty.ts`.
