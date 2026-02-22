export function renderInline(text: string): string {
  if (!text || typeof text !== 'string') return text ?? '';
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
    case 'b': case 'bold': case 'i': case 'italic':
    case 'strike': case 'u': case 's': case 'sup':
    case 'note': case 'tip': case 'color': case 'highlight':
      return content.split('|')[0];

    case 'dice': case 'damage': case 'd20':
      return content.split('|')[0];

    case 'hit': {
      const n = parseInt(content, 10);
      return isNaN(n) ? content : (n >= 0 ? `+${n}` : `${n}`);
    }

    case 'dc':
      return `DC ${content}`;

    case 'recharge': {
      if (!content) return '(Recharge 6)';
      const rn = parseInt(content, 10);
      return isNaN(rn) ? `(Recharge ${content})` : rn < 6 ? `(Recharge ${rn}–6)` : `(Recharge ${rn})`;
    }

    case 'chance':
      return `${content} percent`;

    case 'scaledice': case 'scaledamage': {
      const parts = content.split('|');
      return parts[parts.length - 1];
    }

    case 'condition': case 'spell': case 'item': case 'creature':
    case 'class': case 'feat': case 'background': case 'race':
    case 'sense': case 'skill': case 'action': case 'language':
    case 'variantrule': case 'table': case 'adventure': case 'book':
    case 'filter': case 'quickref': case 'charoption': case 'optfeature':
    case 'reward': case 'vehicle': case 'vehupgrade': case 'object':
    case 'trap': case 'hazard': case 'deity': case 'cult': case 'boon':
      return content.split('|')[0];

    case 'atkr': {
      // 2024 XMM format — single-letter type codes, comma-separated → "Melee or Ranged Attack Roll:"
      const ATKR_TYPE: Record<string, string> = { m: 'Melee', r: 'Ranged', g: 'Magical', a: 'Area' };
      const atkrParts = content.split(',').map(p => ATKR_TYPE[p.trim()] ?? p.trim());
      return atkrParts.join(' or ') + ' Attack Roll:';
    }

    case 'atk': {
      // Legacy compound codes
      const legacyMap: Record<string, string> = {
        mw: 'Melee Weapon', rw: 'Ranged Weapon',
        ms: 'Melee Spell', rs: 'Ranged Spell',
        'mw,rw': 'Melee or Ranged Weapon',
        'mw,rs': 'Melee or Ranged Weapon/Spell',
        'ms,rs': 'Melee or Ranged Spell',
      };
      if (legacyMap[content.trim()]) return legacyMap[content.trim()] + ' Attack:';
      // 2024 single-letter codes (m, r, m,r, g, a …)
      const ATK_TYPE: Record<string, string> = { m: 'Melee', r: 'Ranged', g: 'Magical', a: 'Area' };
      const atkParts = content.split(',').map(p => ATK_TYPE[p.trim()] ?? p.trim());
      return atkParts.join(' or ') + ' Attack:';
    }

    case 'actSave': {
      const ABILITY: Record<string, string> = {
        str: 'Strength', dex: 'Dexterity', con: 'Constitution',
        int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
      };
      return (ABILITY[content.trim().toLowerCase()] ?? content.trim()) + ' Saving Throw:';
    }

    case 'actSaveFail':          return 'Failure:';
    case 'actSaveSuccess':       return 'Success:';
    case 'actSaveSuccessOrFail': return 'Failure or Success:';
    case 'actTrigger':           return 'Trigger:';
    case 'actResponse':          return 'Response:';
    case 'm':                    return 'Miss:';
    case 'hom':                  return 'Hit or Miss:';

    case 'h':
      return 'Hit: ';

    case 'coinssimple': case 'coinsimple':
      return content;

    default:
      return content.split('|')[0];
  }
}
