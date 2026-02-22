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
  it('resolves {@spell fireball|PHB} to fireball', () => expect(renderInline('{@spell fireball|PHB}')).toBe('fireball'));
  it('resolves {@dc 15} to DC 15', () => expect(renderInline('{@dc 15}')).toBe('DC 15'));
  it('resolves {@b bold text} to bold text', () => expect(renderInline('{@b bold text}')).toBe('bold text'));
  it('resolves {@recharge 5} to (Recharge 5-6)', () => expect(renderInline('{@recharge 5}')).toBe('(Recharge 5–6)'));
  it('passes through plain text unchanged', () => expect(renderInline('plain text')).toBe('plain text'));
});
