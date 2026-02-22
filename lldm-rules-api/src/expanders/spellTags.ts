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
