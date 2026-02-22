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
  it('resolves {@recharge} (empty) to (Recharge 6)', () => expect(renderInline('{@recharge}')).toBe('(Recharge 6)'));
  it('passes through plain text unchanged', () => expect(renderInline('plain text')).toBe('plain text'));

  // Attack roll tags (2024 XMM format)
  it('{@atkr m} → Melee Attack Roll:', () => expect(renderInline('{@atkr m}')).toBe('Melee Attack Roll:'));
  it('{@atkr r} → Ranged Attack Roll:', () => expect(renderInline('{@atkr r}')).toBe('Ranged Attack Roll:'));
  it('{@atkr m,r} → Melee or Ranged Attack Roll:', () => expect(renderInline('{@atkr m,r}')).toBe('Melee or Ranged Attack Roll:'));

  // Single-letter atk codes (2024 format)
  it('{@atk m} → Melee Attack:', () => expect(renderInline('{@atk m}')).toBe('Melee Attack:'));
  it('{@atk m,r} → Melee or Ranged Attack:', () => expect(renderInline('{@atk m,r}')).toBe('Melee or Ranged Attack:'));
  // Legacy atk codes still work
  it('{@atk mw} → Melee Weapon Attack:', () => expect(renderInline('{@atk mw}')).toBe('Melee Weapon Attack:'));

  // Saving throw tags
  it('{@actSave con} → Constitution Saving Throw:', () => expect(renderInline('{@actSave con}')).toBe('Constitution Saving Throw:'));
  it('{@actSave wis} → Wisdom Saving Throw:', () => expect(renderInline('{@actSave wis}')).toBe('Wisdom Saving Throw:'));
  it('{@actSave str} → Strength Saving Throw:', () => expect(renderInline('{@actSave str}')).toBe('Strength Saving Throw:'));

  // Action result labels
  it('{@actSaveFail} → Failure:', () => expect(renderInline('{@actSaveFail}')).toBe('Failure:'));
  it('{@actSaveSuccess} → Success:', () => expect(renderInline('{@actSaveSuccess}')).toBe('Success:'));
  it('{@actSaveSuccessOrFail} → Failure or Success:', () => expect(renderInline('{@actSaveSuccessOrFail}')).toBe('Failure or Success:'));
  it('{@actTrigger} → Trigger:', () => expect(renderInline('{@actTrigger}')).toBe('Trigger:'));
  it('{@actResponse} → Response:', () => expect(renderInline('{@actResponse}')).toBe('Response:'));
  it('{@m} → Miss:', () => expect(renderInline('{@m}')).toBe('Miss:'));
  it('{@hom} → Hit or Miss:', () => expect(renderInline('{@hom}')).toBe('Hit or Miss:'));

  // Full Lich action string (end-to-end)
  it('expands full attack action', () =>
    expect(renderInline('{@atkr m,r} {@hit 12}, reach 5 ft. {@h}31 ({@damage 4d12 + 5}) Force damage.'))
      .toBe('Melee or Ranged Attack Roll: +12, reach 5 ft. Hit: 31 (4d12 + 5) Force damage.'));

  // Full save action string (end-to-end)
  it('expands full save action', () =>
    expect(renderInline('{@actSave con} {@dc 20}, all nearby. {@actSaveFail} 31 ({@damage 9d6}) Necrotic. {@actSaveSuccess} Half damage.'))
      .toBe('Constitution Saving Throw: DC 20, all nearby. Failure: 31 (9d6) Necrotic. Success: Half damage.'));
});
