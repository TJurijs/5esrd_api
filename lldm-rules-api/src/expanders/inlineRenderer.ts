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

    case 'recharge':
      return `(Recharge ${content}–6)`;

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

    case 'h':
      return 'Hit:';

    case 'coinssimple': case 'coinsimple':
      return content;

    default:
      return content.split('|')[0];
  }
}
