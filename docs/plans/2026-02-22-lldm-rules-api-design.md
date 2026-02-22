# LLDM Rules API — Design Document

**Date:** 2026-02-22
**Status:** Approved

---

## Overview

A standalone REST + MCP API service that exposes D&D 5e SRD 5.2 rules data, backed by the 5etools open-source dataset. Designed to be maintained independently and reused by the LLDM (LLM-driven Dungeon Master) application.

**Stack:** TypeScript · Node.js · Fastify
**Data source:** `5etools-v2.24.3/data/`
**Data loading:** In-memory at startup
**Interfaces:** REST (`/api/v1`) + MCP (stdio transport, same process)

---

## SRD 5.2 Filtering

An entry is included if **either** flag is present and true:

```ts
const isSrd52 = (entry: any): boolean =>
  entry.srd52 === true || entry.basicRules2024 === true;
```

At startup, the loader logs a warning for any entry where `basicRules2024 === true` but `srd52 !== true`, so these edge cases can be verified against the `SRD_CC_v5.2.1.pdf`.

---

## Project Structure

```
lldm-rules-api/
├── src/
│   ├── server.ts              # Fastify instance, plugin registration, startup
│   ├── loader.ts              # Reads 5etools JSON, filters SRD5.2, expands codes, feeds store
│   ├── store.ts               # In-memory typed repositories (Map<string, T> per resource type)
│   ├── expanders/             # Code → human-readable value functions (applied once at load time)
│   │   ├── index.ts           # Barrel export
│   │   ├── spellSchool.ts
│   │   ├── spellRange.ts
│   │   ├── spellDuration.ts
│   │   ├── spellMiscTags.ts
│   │   ├── spellAreaTags.ts
│   │   ├── spellAttackType.ts
│   │   ├── size.ts
│   │   ├── alignment.ts
│   │   ├── damageType.ts
│   │   ├── monsterLanguage.ts
│   │   ├── abilityScore.ts
│   │   ├── itemType.ts
│   │   ├── itemProperty.ts
│   │   ├── itemRecharge.ts
│   │   ├── itemMiscTags.ts
│   │   ├── featCategory.ts
│   │   ├── optFeatureType.ts
│   │   ├── attackType.ts
│   │   ├── armorWeapon.ts
│   │   └── inlineRenderer.ts  # Strips/resolves {@tag} inline strings to plain text
│   ├── types/                 # TypeScript interfaces mirroring 5etools schemas (post-expansion)
│   │   ├── spell.ts
│   │   ├── monster.ts
│   │   ├── item.ts
│   │   ├── class.ts
│   │   ├── feat.ts
│   │   ├── background.ts
│   │   ├── race.ts
│   │   ├── condition.ts
│   │   ├── skill.ts
│   │   └── language.ts
│   ├── services/              # Business logic — called by both REST plugins and MCP tools
│   │   ├── spells.ts          # searchSpells(), getSpell()
│   │   ├── monsters.ts        # searchMonsters(), getMonster()
│   │   ├── items.ts           # searchItems(), getItem()
│   │   ├── classes.ts         # getClasses(), getClass(), getSubclasses()
│   │   ├── feats.ts           # searchFeats(), getFeat()
│   │   ├── backgrounds.ts     # searchBackgrounds(), getBackground()
│   │   ├── races.ts           # searchRaces(), getRace()
│   │   ├── conditions.ts      # listConditions(), getCondition()
│   │   ├── skills.ts          # listSkills(), getSkill()
│   │   └── languages.ts       # listLanguages(), getLanguage()
│   ├── plugins/               # Fastify REST route handlers — thin wrappers over services
│   │   ├── spells.ts
│   │   ├── monsters.ts
│   │   ├── items.ts
│   │   ├── classes.ts
│   │   ├── feats.ts
│   │   ├── backgrounds.ts
│   │   ├── races.ts
│   │   ├── conditions.ts
│   │   ├── skills.ts
│   │   └── languages.ts
│   └── mcp/
│       ├── index.ts           # MCP server setup (stdio transport)
│       └── tools.ts           # Tool definitions with LLM-friendly descriptions
├── package.json
├── tsconfig.json
└── .env                       # PORT, DATA_PATH
```

### Data Flow

```
startup
  └─ loader.ts
       ├─ reads 5etools JSON files
       ├─ filters: srd52 === true || basicRules2024 === true
       ├─ expands all codes to human values (via expanders/)
       ├─ resolves {@tag} inline strings to plain text (via inlineRenderer)
       └─ populates store.ts

request (REST)                    request (MCP tool call)
  └─ plugin handler                  └─ mcp/tools.ts handler
       └─ calls service fn                └─ calls same service fn
            └─ reads from store                └─ reads from store
```

---

## REST API

**Base URL:** `/api/v1`

### Common Query Parameters (all list endpoints)

| Param | Type | Description |
|---|---|---|
| `name` | string | Case-insensitive substring search on name |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `source` | string | Filter by source book (e.g. `XPHB`, `XMM`) |

### List Response Shape

```json
{
  "total": 112,
  "page": 1,
  "limit": 20,
  "data": [ ... ]
}
```

### Error Shape

```json
{ "error": "Spell 'Fireball' not found" }
```

### Endpoints

| Method | Path | Type-specific filters |
|---|---|---|
| GET | `/spells` | `level`, `school`, `class` |
| GET | `/spells/:name` | — |
| GET | `/monsters` | `cr`, `type`, `size` |
| GET | `/monsters/:name` | — |
| GET | `/items` | `type`, `rarity`, `attunement` |
| GET | `/items/:name` | — |
| GET | `/classes` | — |
| GET | `/classes/:name` | — |
| GET | `/classes/:name/subclasses` | — |
| GET | `/feats` | `category` |
| GET | `/feats/:name` | — |
| GET | `/backgrounds` | — |
| GET | `/backgrounds/:name` | — |
| GET | `/races` | — |
| GET | `/races/:name` | — |
| GET | `/conditions` | — |
| GET | `/conditions/:name` | — |
| GET | `/skills` | — |
| GET | `/skills/:name` | — |
| GET | `/languages` | — |
| GET | `/languages/:name` | — |

### Example Detail Response (Spell)

```json
{
  "name": "Acid Splash",
  "source": "XPHB",
  "level": 0,
  "school": "Evocation",
  "castingTime": "1 Action",
  "range": "60 feet",
  "components": { "verbal": true, "somatic": true },
  "duration": "Instantaneous",
  "description": "You create an acidic bubble...",
  "higherLevels": "The damage increases by 1d6...",
  "damageTypes": ["Acid"],
  "savingThrow": ["Dexterity"],
  "areaTags": ["Multiple Targets"],
  "miscTags": ["Scaling Effects"],
  "srd52": true
}
```

---

## MCP Interface

**Transport:** stdio (DM app spawns the process)
**Future option:** HTTP SSE transport for remote use

### Tools

| Tool name | Description | Parameters |
|---|---|---|
| `search_spells` | Find spells by name, level, or school. Use when a player casts a spell or you need to look up a spell's effect. | `name?`, `level?`, `school?`, `class?` |
| `get_spell` | Get full details of a spell including casting time, range, components, and description. | `name` (required) |
| `search_monsters` | Find monsters by name, challenge rating, or creature type. Use when building encounters. | `name?`, `cr?`, `type?`, `size?` |
| `get_monster` | Get a monster's full stat block: AC, HP, speeds, ability scores, actions, and traits. | `name` (required) |
| `search_items` | Find weapons, armor, and magic items by name, type, or rarity. | `name?`, `type?`, `rarity?`, `attunement?` |
| `get_item` | Get full item description and mechanical properties. | `name` (required) |
| `get_class` | Get class features, hit die, proficiencies, and spell slot progression. | `name` (required) |
| `get_subclasses` | Get all subclasses for a given class. | `className` (required) |
| `search_feats` | Find feats by name or category (General, Origin, Epic Boon, Fighting Style). | `name?`, `category?` |
| `get_feat` | Get feat prerequisites and full description. | `name` (required) |
| `get_background` | Get background features, proficiencies, and starting equipment. | `name` (required) |
| `get_race` | Get racial traits and ability score improvements. | `name` (required) |
| `get_condition` | Look up what a condition does (Blinded, Poisoned, Stunned, etc). | `name` (required) |
| `list_conditions` | List all conditions — useful for quick reference. | — |
| `get_skill` | Look up which ability score a skill uses and what it covers. | `name` (required) |
| `list_skills` | List all skills with their governing ability scores. | — |

---

## Code Expansion Reference

All expansions are applied **once at load time** by `loader.ts`. Responses always contain human-readable values.

| Expander | Example |
|---|---|
| Spell school | `"V"` → `"Evocation"` |
| Spell range | `{type:"point", distance:{type:"feet",amount:60}}` → `"60 feet"` |
| Spell duration | `{type:"instant"}` → `"Instantaneous"` |
| Spell misc tags | `"HL"` → `"Healing"`, `"SCL"` → `"Scaling Effects"` (21 tags) |
| Spell area tags | `"ST"` → `"Single Target"`, `"N"` → `"Cone"` (12 tags) |
| Spell attack type | `"M"` → `"Melee"`, `"R"` → `"Ranged"` |
| Creature size | `"H"` → `"Huge"`, `"G"` → `"Gargantuan"` |
| Alignment | `["L","G"]` → `"Lawful Good"`, `"U"` → `"Unaligned"` |
| Damage types | `"B"` → `"Bludgeoning"`, `"F"` → `"Fire"` (13 types) |
| Monster languages | `"AB"` → `"Abyssal"`, `"C"` → `"Common"` (30 tags) |
| Ability scores | `"str"` → `"Strength"`, `"cha"` → `"Charisma"` |
| Item type | `"SCF"` → `"Spellcasting Focus"`, `"HA"` → `"Heavy Armor"` (35 types) |
| Item property | `"F"` → `"Finesse"`, `"V"` → `"Versatile"`, `"2H"` → `"Two-Handed"` (16 props) |
| Item recharge | `"dawn"` → `"Dawn"`, `"restShort"` → `"Short Rest"` (12 values) |
| Feat category | `"G"` → `"General"`, `"EB"` → `"Epic Boon"` (7 categories) |
| Optional feature type | `"EI"` → `"Eldritch Invocation"`, `"MM"` → `"Metamagic"` (21 types) |
| Attack type | `"MW"` → `"Melee Weapon Attack"`, `"RW"` → `"Ranged Weapon Attack"` |
| Armor/weapon class | `"l."` → `"light"`, `"h."` → `"heavy"`, `"s."` → `"simple"` |
| Inline tags | `{@damage 2d6}` → `"2d6"`, `{@hit 5}` → `"+5"`, `{@condition blinded}` → `"blinded"` |

---

## Key Decisions

- **In-memory store:** All SRD5.2 data is ~13MB total; fits easily in memory and provides sub-millisecond lookups.
- **Expand at load time:** Codes are resolved once during startup, not per request. Responses are always clean.
- **Service layer:** Business logic lives in `services/`, not in route handlers or MCP tool handlers. Both interfaces call the same functions.
- **Dual interface:** REST + MCP served from the same process, sharing the same in-memory store. No inter-process HTTP calls.
- **MCP transport:** stdio for local use (DM app spawns the API as a child process). Can be extended to HTTP SSE later.
- **`basicRules2024` edge cases:** Logged at startup if any entries have `basicRules2024: true` but `srd52 !== true` — verify against PDF.
