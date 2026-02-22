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
