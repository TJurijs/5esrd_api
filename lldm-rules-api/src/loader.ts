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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function renderEntries(entries: any[]): string {
  if (!entries) return '';
  return entries.map(e => {
    if (typeof e === 'string') return renderInline(e);
    if (typeof e === 'object' && e !== null) {
      if (e.type === 'list') {
        return (e.items ?? []).map((i: any) =>
          typeof i === 'string'
            ? `• ${renderInline(i)}`
            : `• ${renderInline(i.name ?? '')}: ${renderEntries(i.entries ?? [])}`
        ).join('\n');
      }
      if (e.type === 'table') {
        const header = (e.colLabels ?? []).join(' | ');
        const rows = (e.rows ?? []).map((r: any[]) =>
          r.map(cell => typeof cell === 'string' ? renderInline(cell) : String(cell?.value ?? cell ?? '')).join(' | ')
        ).join('\n');
        return header ? `${header}\n${rows}` : rows;
      }
      if (e.entries) {
        const heading = e.name ? `${e.name}: ` : '';
        return heading + renderEntries(e.entries);
      }
      if (e.entry) return renderInline(e.entry);
      if (e.items) return renderEntries(e.items);
    }
    return '';
  }).filter(Boolean).join('\n');
}

function renderCastingTime(time: any[]): string {
  if (!time?.length) return 'Unknown';
  const t = time[0];
  const base = `${t.number} ${t.unit}${t.number !== 1 ? 's' : ''}`;
  return t.condition ? `${base} (${t.condition})` : base;
}

// ─── Spell loader ─────────────────────────────────────────────────────────────

function loadSpells(dataPath: string): void {
  const indexPath = join(dataPath, 'spells', 'index.json');
  if (!existsSync(indexPath)) {
    console.warn('[loader] spells/index.json not found, skipping spells');
    return;
  }
  const index: Record<string, string> = readJson(indexPath) ?? {};
  const files = [...new Set(Object.values(index))].map(f => join(dataPath, 'spells', f));

  for (const filePath of files) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.spell) continue;

    warnEdgeCases(data.spell, 'spell');
    for (const raw of data.spell.filter(isSrd52)) {
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
        concentration: Array.isArray(raw.duration) && raw.duration.some((d: any) => d.concentration === true),
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

// ─── Monster loader ───────────────────────────────────────────────────────────

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

function parseSpeed(speed: any): import('./types/monster.js').MonsterSpeed {
  if (typeof speed === 'number') return { walk: speed };
  if (!speed || typeof speed !== 'object') return {};
  return {
    walk: typeof speed.walk === 'number' ? speed.walk : speed.walk?.number,
    fly: typeof speed.fly === 'number' ? speed.fly : speed.fly?.number,
    swim: typeof speed.swim === 'number' ? speed.swim : speed.swim?.number,
    burrow: typeof speed.burrow === 'number' ? speed.burrow : speed.burrow?.number,
    climb: typeof speed.climb === 'number' ? speed.climb : speed.climb?.number,
    canHover: speed.canHover === true,
  };
}

function loadMonsters(dataPath: string): void {
  const indexPath = join(dataPath, 'bestiary', 'index.json');
  if (!existsSync(indexPath)) {
    console.warn('[loader] bestiary/index.json not found, skipping monsters');
    return;
  }
  const index: Record<string, string> = readJson(indexPath) ?? {};
  const files = [...new Set(Object.values(index))].map(f => join(dataPath, 'bestiary', f));

  for (const filePath of files) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.monster) continue;

    warnEdgeCases(data.monster, 'monster');
    for (const raw of data.monster.filter(isSrd52)) {
      const { ac, note: acNote } = parseAc(raw.ac);
      const { hp, formula: hpFormula } = parseHp(raw.hp);

      const expandDmgList = (list: any[]): string[] =>
        (list ?? []).flatMap((d: any) => {
          if (typeof d === 'string') return [expandDamageType(d)];
          if (d.special) return [d.special];
          if (Array.isArray(d)) return d.map((x: string) => expandDamageType(x));
          return [];
        });

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
        speed: parseSpeed(raw.speed),
        abilities: {
          str: raw.str ?? 10, dex: raw.dex ?? 10, con: raw.con ?? 10,
          int: raw.int ?? 10, wis: raw.wis ?? 10, cha: raw.cha ?? 10,
        },
        savingThrows: raw.save
          ? Object.fromEntries(
              Object.entries(raw.save).map(([k, v]) => [expandAbilityScore(k), Number(v)])
            )
          : undefined,
        skills: raw.skill
          ? Object.fromEntries(Object.entries(raw.skill).map(([k, v]) => [k, Number(v)]))
          : undefined,
        damageImmunities: expandDmgList(raw.immune ?? []),
        damageResistances: expandDmgList(raw.resist ?? []),
        damageVulnerabilities: expandDmgList(raw.vulnerable ?? []),
        conditionImmunities: (raw.conditionImmune ?? []).map((c: any) =>
          typeof c === 'string' ? c : c.conditionImmune ?? JSON.stringify(c)
        ),
        senses: raw.senses ?? [],
        passivePerception: raw.passive ?? 10,
        languages: (raw.languages ?? []).map((l: any) =>
          typeof l === 'string' ? expandMonsterLanguage(l) : JSON.stringify(l)
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

// ─── Item loader ──────────────────────────────────────────────────────────────

function loadItems(dataPath: string): void {
  for (const filename of ['items.json', 'items-base.json']) {
    const data = readJson(join(dataPath, filename));
    if (!data) continue;
    const entries: any[] = [...(data.item ?? []), ...(data.baseitem ?? [])];
    warnEdgeCases(entries, 'item');

    for (const raw of entries.filter(isSrd52)) {
      // Skip if already loaded (avoid duplicates between items.json and items-base.json)
      if (store.items.has(normalizeKey(raw.name))) continue;

      const item: Item = {
        name: raw.name,
        source: raw.source,
        type: raw.type ? expandItemType(raw.type) : 'Adventuring Gear',
        rarity: raw.rarity ?? 'none',
        weight: raw.weight,
        value: raw.value !== undefined ? `${raw.value} cp` : undefined,
        attunement: typeof raw.reqAttune === 'string'
          ? raw.reqAttune
          : raw.reqAttune === true ? 'required' : undefined,
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

// ─── Class loader ─────────────────────────────────────────────────────────────

function loadClasses(dataPath: string): void {
  const indexPath = join(dataPath, 'class', 'index.json');
  if (!existsSync(indexPath)) {
    console.warn('[loader] class/index.json not found, skipping classes');
    return;
  }
  const index: Record<string, string> = readJson(indexPath) ?? {};
  const files = [...new Set(Object.values(index))].map(f => join(dataPath, 'class', f));

  for (const filePath of files) {
    if (!existsSync(filePath)) continue;
    const data = readJson(filePath);
    if (!data?.class) continue;

    warnEdgeCases(data.class, 'class');
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
            .filter((f: any) =>
              f.subclassShortName === sc.shortName &&
              f.className === raw.name &&
              isSrd52(f)
            )
            .map((f: any) => ({
              name: f.name,
              level: f.level,
              description: renderEntries(f.entries ?? []),
            }));
          return {
            name: sc.name,
            source: sc.source,
            shortName: sc.shortName ?? sc.name,
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
          typeof a === 'string' ? a : a.proficiency ?? JSON.stringify(a)
        ),
        weaponProficiencies: (proficiencies.weapons ?? []).map((w: any) =>
          typeof w === 'string' ? w : w.proficiency ?? JSON.stringify(w)
        ),
        toolProficiencies: (proficiencies.tools ?? []).map((t: any) =>
          typeof t === 'string' ? t : t.proficiency ?? JSON.stringify(t)
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
  warnEdgeCases(data.feat, 'feat');
  for (const raw of data.feat.filter(isSrd52)) {
    const feat: Feat = {
      name: raw.name,
      source: raw.source,
      category: raw.category ? expandFeatCategory(raw.category) : 'General',
      prerequisite: raw.prerequisite
        ? renderEntries(
            Array.isArray(raw.prerequisite)
              ? raw.prerequisite.map((p: any) =>
                  typeof p === 'string' ? p : JSON.stringify(p)
                )
              : [JSON.stringify(raw.prerequisite)]
          )
        : undefined,
      repeatable: raw.repeatable === true,
      abilityBoost: raw.ability
        ? Object.keys(raw.ability[0] ?? {}).map(expandAbilityScore)
        : undefined,
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
  warnEdgeCases(data.background, 'background');
  for (const raw of data.background.filter(isSrd52)) {
    const profs = raw.startingProficiencies ?? {};
    const bg: Background = {
      name: raw.name,
      source: raw.source,
      skillProficiencies: profs.skills ?? [],
      toolProficiencies: profs.tools ?? [],
      languages: profs.languageChoices
        ? ['any (your choice)']
        : (profs.languages ?? []),
      equipment: Array.isArray(raw.startingEquipment?.default)
        ? raw.startingEquipment.default.map((e: any) =>
            typeof e === 'string' ? renderInline(e) : JSON.stringify(e)
          ).join(', ')
        : '',
      description: renderEntries(raw.entries ?? []),
      features: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'entries' && e.name)
        .map((e: any) => ({
          name: e.name,
          description: renderEntries(e.entries ?? []),
        })),
      srd52: true,
    };
    store.backgrounds.set(normalizeKey(bg.name), bg);
  }
  console.log(`[loader] Loaded ${store.backgrounds.size} SRD5.2 backgrounds`);
}

function loadRaces(dataPath: string): void {
  const data = readJson(join(dataPath, 'races.json'));
  if (!data?.race) return;
  warnEdgeCases(data.race, 'race');
  for (const raw of data.race.filter(isSrd52)) {
    const race: Race = {
      name: raw.name,
      source: raw.source,
      size: (Array.isArray(raw.size) ? raw.size : [raw.size ?? 'M']).map(expandSize),
      speed: typeof raw.speed === 'number' ? raw.speed : raw.speed?.walk ?? 30,
      abilityBoosts: raw.ability
        ? Object.keys(raw.ability[0] ?? {}).map(expandAbilityScore)
        : undefined,
      traits: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'entries' && e.name)
        .map((e: any) => ({
          name: e.name,
          description: renderEntries(e.entries ?? []),
        })),
      languages: (raw.languageProficiencies ?? [])
        .flatMap((lp: any) => Object.keys(lp).filter(k => lp[k] === true || lp[k] === 'true')),
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
  warnEdgeCases(data.condition, 'condition');
  for (const raw of data.condition.filter(isSrd52)) {
    const condition: Condition = {
      name: raw.name,
      source: raw.source,
      description: renderEntries(raw.entries ?? []),
      effects: (raw.entries ?? [])
        .filter((e: any) => e?.type === 'list')
        .flatMap((e: any) =>
          (e.items ?? []).map((i: any) =>
            typeof i === 'string' ? renderInline(i) : renderEntries(i.entries ?? [])
          )
        ),
      srd52: true,
    };
    store.conditions.set(normalizeKey(condition.name), condition);
  }
  console.log(`[loader] Loaded ${store.conditions.size} SRD5.2 conditions`);
}

function loadSkills(dataPath: string): void {
  const data = readJson(join(dataPath, 'skills.json'));
  if (!data?.skill) return;
  warnEdgeCases(data.skill, 'skill');
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
  warnEdgeCases(data.language, 'language');
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

// ─── Main entry ───────────────────────────────────────────────────────────────

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
