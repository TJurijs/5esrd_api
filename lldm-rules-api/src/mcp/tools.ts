import { searchSpells, getSpell } from '../services/spells.js';
import { searchMonsters, getMonster } from '../services/monsters.js';
import { searchItems, getItem } from '../services/items.js';
import { getClasses, getClass, getSubclasses } from '../services/classes.js';
import { searchFeats, getFeat } from '../services/feats.js';
import { getBackground } from '../services/backgrounds.js';
import { getRace } from '../services/races.js';
import { getCondition, listConditions } from '../services/conditions.js';
import { getSkill, listSkills } from '../services/skills.js';

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
  handler: (args: Record<string, any>) => unknown;
}

export const tools: ToolDef[] = [
  {
    name: 'search_spells',
    description: "Find spells by name, level, or school. Use when a player casts a spell, asks about a spell, or you need to know a spell's effect, range, or components.",
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Partial spell name to search for' },
        level: { type: 'number', description: 'Spell level (0 for cantrips, 1-9)' },
        school: { type: 'string', description: 'School of magic (e.g. Evocation, Necromancy)' },
        class: { type: 'string', description: 'Class that can cast the spell (e.g. Wizard, Cleric)' },
      },
    },
    handler: (args) => searchSpells(args, { limit: 20 }),
  },
  {
    name: 'get_spell',
    description: 'Get complete details of a single spell including casting time, range, components, duration, and full description.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Spell name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const spell = getSpell(args.name);
      return spell ?? { error: `Spell '${args.name}' not found` };
    },
  },
  {
    name: 'search_monsters',
    description: 'Find monsters by name, challenge rating, or creature type. Use when populating encounters or looking up enemy statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Partial monster name' },
        cr: { type: 'string', description: 'Challenge rating (e.g. "1", "1/2", "10")' },
        type: { type: 'string', description: 'Creature type (e.g. beast, undead, humanoid)' },
        size: { type: 'string', description: 'Creature size (e.g. Tiny, Medium, Huge)' },
      },
    },
    handler: (args) => searchMonsters(args, { limit: 20 }),
  },
  {
    name: 'get_monster',
    description: "Get a monster's full stat block including AC, HP, speed, ability scores, actions, and special traits.",
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Monster name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const monster = getMonster(args.name);
      return monster ?? { error: `Monster '${args.name}' not found` };
    },
  },
  {
    name: 'search_items',
    description: 'Find weapons, armor, and magic items by name, type, or rarity.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Partial item name' },
        type: { type: 'string', description: 'Item type (e.g. Melee Weapon, Heavy Armor, Potion)' },
        rarity: { type: 'string', description: 'Item rarity (common, uncommon, rare, very rare, legendary)' },
        attunement: { type: 'boolean', description: 'True to show only items requiring attunement' },
      },
    },
    handler: (args) => searchItems(args, { limit: 20 }),
  },
  {
    name: 'get_item',
    description: 'Get full item description, properties, damage, and mechanical effects.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const item = getItem(args.name);
      return item ?? { error: `Item '${args.name}' not found` };
    },
  },
  {
    name: 'get_class',
    description: 'Get class features, hit die, saving throws, proficiencies, and spell slot progression for a character class.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Class name (e.g. Wizard, Fighter, Cleric)' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const cls = getClass(args.name);
      return cls ?? { error: `Class '${args.name}' not found` };
    },
  },
  {
    name: 'get_subclasses',
    description: 'Get all available subclasses for a given class.',
    inputSchema: {
      type: 'object',
      properties: {
        className: { type: 'string', description: 'Class name' },
      },
      required: ['className'],
    },
    handler: (args) => ({ data: getSubclasses(args.className) }),
  },
  {
    name: 'list_classes',
    description: 'List all available character classes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: () => getClasses({ limit: 100 }),
  },
  {
    name: 'search_feats',
    description: 'Find feats by name or category. Use when a player levels up and wants to choose a feat.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Partial feat name' },
        category: { type: 'string', description: 'Feat category: General, Origin, Epic Boon, Fighting Style' },
      },
    },
    handler: (args) => searchFeats(args, { limit: 20 }),
  },
  {
    name: 'get_feat',
    description: "Get a feat's prerequisites and full description of benefits.",
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Feat name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const feat = getFeat(args.name);
      return feat ?? { error: `Feat '${args.name}' not found` };
    },
  },
  {
    name: 'get_background',
    description: "Get a background's features, skill proficiencies, and starting equipment.",
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Background name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const bg = getBackground(args.name);
      return bg ?? { error: `Background '${args.name}' not found` };
    },
  },
  {
    name: 'get_race',
    description: 'Get racial traits, movement speed, and ability bonuses for a species/race.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Race/species name' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const race = getRace(args.name);
      return race ?? { error: `Race '${args.name}' not found` };
    },
  },
  {
    name: 'get_condition',
    description: 'Look up what a condition does mechanically. Use when a creature becomes Blinded, Poisoned, Stunned, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Condition name (e.g. Blinded, Grappled, Poisoned)' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const condition = getCondition(args.name);
      return condition ?? { error: `Condition '${args.name}' not found` };
    },
  },
  {
    name: 'list_conditions',
    description: 'List all conditions. Use for quick reference when unsure of a condition name.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ data: listConditions() }),
  },
  {
    name: 'get_skill',
    description: 'Look up which ability score a skill uses and what it covers.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Skill name (e.g. Perception, Stealth, Athletics)' },
      },
      required: ['name'],
    },
    handler: (args) => {
      const skill = getSkill(args.name);
      return skill ?? { error: `Skill '${args.name}' not found` };
    },
  },
  {
    name: 'list_skills',
    description: 'List all skills with their governing ability scores.',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ data: listSkills() }),
  },
];
