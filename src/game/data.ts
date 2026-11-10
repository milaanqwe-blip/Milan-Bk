import {
  ClassDefinition,
  ClassId,
  CraftRecipe,
  DynamicQuest,
  ElementalBalanceProfile,
  ElementType,
  ExplorationLandmark,
  Item,
  MageAffinityCount,
  MaterialDef,
  MaterialId,
  MonsterArchetype,
  NpcEntity,
  QuestDifficulty,
  QuestGiverRegion,
  RankEntry,
  RankRewardTier,
  SpawnPoint,
  WorldCollectible,
  ZoneId,
} from './types';

export const WORLD_WIDTH = 3400;
export const WORLD_HEIGHT = 2400;

export const VILLAGE_BOUNDS = { minX: 100, maxX: 980, minY: 560, maxY: 1840 };
export const SAFE_JUNGLE_BOUNDS = { minX: 980, maxX: 2180, minY: 260, maxY: 2140 };
export const OUTER_DANGER_MAX_X = 2580;

export const JUNGLE_CAMP_POS = { x: 1380, y: 1200, radius: 115 };

export const STARTING_STRENGTH = 50;
export const STARTING_AGILITY = 50;
export const STARTING_SILVER = 20;
export const BASE_EXP_LEVEL_1 = 2000;
export const SAFE_ZONE_MAX_LEVEL = 7;
export const ELDER_JUNGLE_MIN_LEVEL = 5;

export function getMaxExpForLevel(level: number): number {
  return BASE_EXP_LEVEL_1 * Math.pow(2, Math.max(0, level - 1));
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  slime_gel: {
    id: 'slime_gel',
    name: 'Condensed Slime Gel',
    color: '#4ade80',
    description: 'Alchemical resin harvested from Safe Jungle slimes and boars.',
  },
  thorn_pelt: {
    id: 'thorn_pelt',
    name: 'Thornwolf Pelt',
    color: '#94a3b8',
    description: 'Tough briar-laced hide gathered from Thorn Wolves and Weavers.',
  },
  ember_bark: {
    id: 'ember_bark',
    name: 'Cinder Heartwood',
    color: '#fb923c',
    description: 'Warm, resinous bark dropped by Lv 4 Cinder Saplings and Behemoths.',
  },
  runic_shard: {
    id: 'runic_shard',
    name: 'Ward Runic Shard',
    color: '#38bdf8',
    description: 'Luminous crystal fragments recovered from exploration sites & Outskirts.',
  },
  elder_scale: {
    id: 'elder_scale',
    name: 'Elder Wyvern Scale',
    color: '#c084fc',
    description: 'Apex scale shed by Lv 8–10 Elder Wilds predators.',
  },
};

export const CLASS_DEFINITIONS: Record<ClassId, ClassDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    title: 'Vanguard Blade',
    rarity: 'Common',
    rollWeight: 38,
    description:
      'Frontline bruiser wielding greatsword and shield. High Strength scaling, sweeping melee arcs, and bastion stun slams.',
    baseHp: 240,
    baseMp: 90,
    hpPerLevel: 44,
    mpPerLevel: 10,
    strGrowth: 8,
    agiGrowth: 4,
    attackRange: 92,
    moveSpeedBonus: 0,
    accentHex: '#d97706',
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    title: 'Wildwood Ranger',
    rarity: 'Common',
    rollWeight: 32,
    description:
      'High-agility marksman firing piercing arrows, cone volleys, evasive vaults, and skyward arrow barrages.',
    baseHp: 195,
    baseMp: 110,
    hpPerLevel: 32,
    mpPerLevel: 14,
    strGrowth: 4,
    agiGrowth: 9,
    attackRange: 380,
    moveSpeedBonus: 24,
    accentHex: '#10b981',
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    title: 'Elemental Arcanist',
    rarity: 'Rare',
    rollWeight: 22,
    description:
      'Rare wielder of 1, 2, or 3 primal elements (Water, Fire, Lightning, Wind, Earth) balanced via potency vs. tactical coverage.',
    baseHp: 180,
    baseMp: 165,
    hpPerLevel: 28,
    mpPerLevel: 24,
    strGrowth: 5,
    agiGrowth: 6,
    attackRange: 350,
    moveSpeedBonus: 10,
    accentHex: '#38bdf8',
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    title: 'Sovereign Summoner',
    rarity: 'Legendary',
    rollWeight: 8,
    description:
      'Legendary summoner commanding Skeleton Vanguards, Spectral Wraiths, and a Dread Knight alongside soul-marking curses.',
    baseHp: 205,
    baseMp: 175,
    hpPerLevel: 34,
    mpPerLevel: 22,
    strGrowth: 6,
    agiGrowth: 6,
    attackRange: 330,
    moveSpeedBonus: 12,
    accentHex: '#a855f7',
  },
};

export interface ElementMeta {
  id: ElementType;
  name: string;
  color: string;
  glow: string;
  strongAgainst: ElementType;
  weakAgainst: ElementType;
  effectText: string;
  skillName: string;
  skillDesc: string;
}

export const ELEMENT_META: Record<ElementType, ElementMeta> = {
  water: {
    id: 'water',
    name: 'Water',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    strongAgainst: 'fire',
    weakAgainst: 'lightning',
    effectText: 'Chills & slows enemies by 40%',
    skillName: 'Tidal Surge',
    skillDesc: 'Launches a crashing frost wave that knocks back and slows enemies.',
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.35)',
    strongAgainst: 'wind',
    weakAgainst: 'water',
    effectText: 'Ignites targets for lingering Burn damage',
    skillName: 'Pyre Nova',
    skillDesc: 'Detonates searing embers around the target zone, inflicting Burn.',
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.35)',
    strongAgainst: 'water',
    weakAgainst: 'earth',
    effectText: 'High-speed chains leaping across foes',
    skillName: 'Arc Tempest',
    skillDesc: 'Strikes with a high-velocity bolt that arcs across nearby monsters.',
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.35)',
    strongAgainst: 'earth',
    weakAgainst: 'fire',
    effectText: 'Piercing gales & inward vortex pull',
    skillName: 'Cyclone Pull',
    skillDesc: 'Conjures a slicing tempest that draws monsters toward its center.',
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    color: '#b45309',
    glow: 'rgba(217, 119, 6, 0.35)',
    strongAgainst: 'lightning',
    weakAgainst: 'wind',
    effectText: 'Crushing stone impact & brief stun',
    skillName: 'Seismic Spire',
    skillDesc: 'Erupts jagged stone pillars that stun targets and bolster Defense.',
  },
};

export const ELEMENTAL_BALANCE_PROFILES: Record<MageAffinityCount, ElementalBalanceProfile> = {
  1: {
    tier: 1,
    label: 'Mono-Element Specialist',
    potencyMultiplier: 1.32,
    cooldownMultiplier: 0.82,
    statGrowthMultiplier: 1.15,
    summary: '+32% spell potency, -18% cooldowns, +15% stat growth for focused mastery.',
  },
  2: {
    tier: 2,
    label: 'Dual-Element Weaver',
    potencyMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    statGrowthMultiplier: 1.0,
    summary: 'Balanced 1.00x potency & cooldowns; alternating elements triggers +28% Resonance.',
  },
  3: {
    tier: 3,
    label: 'Tri-Aspect Archmage',
    potencyMultiplier: 0.8,
    cooldownMultiplier: 1.12,
    statGrowthMultiplier: 0.94,
    summary: '0.80x spell potency & +12% cooldowns balanced by broad counter-element coverage.',
  },
};

export function getElementalMatchupMultiplier(
  attackEl: ElementType | 'physical' | 'necrotic',
  defenderEl: ElementType | 'physical' | 'necrotic'
): { mult: number; label: 'Advantage' | 'Resist' | null } {
  if (
    attackEl === 'physical' ||
    attackEl === 'necrotic' ||
    defenderEl === 'physical' ||
    defenderEl === 'necrotic'
  ) {
    return { mult: 1.0, label: null };
  }
  const meta = ELEMENT_META[attackEl];
  if (meta.strongAgainst === defenderEl) return { mult: 1.25, label: 'Advantage' };
  if (meta.weakAgainst === defenderEl) return { mult: 0.85, label: 'Resist' };
  return { mult: 1.0, label: null };
}

export const MERCHANT_ITEMS: Item[] = [
  {
    id: 'wpn_iron_blade',
    name: 'Recruit Iron Blade',
    slot: 'weapon',
    rarity: 'Common',
    priceSilver: 5,
    allowedClasses: ['warrior'],
    bonusStrength: 12,
    bonusPower: 8,
    description: 'Forged in Havenbrook. Balanced edge for Safe Jungle hunts.',
    source: 'merchant',
  },
  {
    id: 'wpn_ash_bow',
    name: 'Ashwood Shortbow',
    slot: 'weapon',
    rarity: 'Common',
    priceSilver: 5,
    allowedClasses: ['archer'],
    bonusAgility: 12,
    bonusPower: 8,
    description: 'Supple frontier bow tuned for crisp arrow velocity.',
    source: 'merchant',
  },
  {
    id: 'wpn_oak_focus',
    name: 'Runed Oak Wand',
    slot: 'weapon',
    rarity: 'Common',
    priceSilver: 5,
    allowedClasses: ['mage'],
    bonusStrength: 6,
    bonusAgility: 6,
    bonusPower: 10,
    description: 'Etched channeling focus ideal for novice elementalists.',
    source: 'merchant',
  },
  {
    id: 'wpn_bone_fetish',
    name: 'Graveyard Scythe',
    slot: 'weapon',
    rarity: 'Common',
    priceSilver: 5,
    allowedClasses: ['necromancer'],
    bonusStrength: 7,
    bonusAgility: 7,
    bonusPower: 10,
    description: 'Carved ashwood reaper empowering summoned minions.',
    source: 'merchant',
  },
  {
    id: 'arm_scout_jerkin',
    name: 'Frontier Leather Jerkin',
    slot: 'armor',
    rarity: 'Common',
    priceSilver: 5,
    bonusHp: 45,
    bonusDefense: 6,
    bonusAgility: 4,
    description: 'Sturdy stitched hide sold by village outfitters for 5 Silver.',
    source: 'merchant',
  },
  {
    id: 'hlm_ward_hood',
    name: 'Traveler Hood',
    slot: 'helm',
    rarity: 'Common',
    priceSilver: 5,
    bonusHp: 25,
    bonusDefense: 4,
    bonusStrength: 3,
    bonusAgility: 3,
    description: 'Simple cloth-and-leather cowl offering reliable protection.',
    source: 'merchant',
  },
  {
    id: 'cons_healing_tonic',
    name: 'Village Healing Tonic',
    slot: 'consumable',
    rarity: 'Common',
    priceSilver: 5,
    healHp: 140,
    healMp: 75,
    description: 'Restores 140 HP and 75 Mana immediately when pressed [H].',
    source: 'merchant',
  },
  {
    id: 'wpn_tempered_halberd',
    name: 'Warden Steel Greatsword',
    slot: 'weapon',
    rarity: 'Uncommon',
    priceSilver: 15,
    allowedClasses: ['warrior'],
    bonusStrength: 24,
    bonusPower: 18,
    description: 'Heavy tempered steel built to cleave Lv 4–5 threats.',
    source: 'merchant',
  },
  {
    id: 'wpn_yew_longbow',
    name: 'Canopy Yew Longbow',
    slot: 'weapon',
    rarity: 'Uncommon',
    priceSilver: 15,
    allowedClasses: ['archer'],
    bonusAgility: 24,
    bonusPower: 18,
    description: 'High-draw ranger bow with razor-feathered broadheads.',
    source: 'merchant',
  },
  {
    id: 'wpn_prismatic_staff',
    name: 'Prismatic Conduit Staff',
    slot: 'weapon',
    rarity: 'Uncommon',
    priceSilver: 15,
    allowedClasses: ['mage'],
    bonusStrength: 12,
    bonusAgility: 12,
    bonusPower: 22,
    description: 'Stabilizes single and multi-elemental spell weaving.',
    source: 'merchant',
  },
  {
    id: 'wpn_ossuary_rod',
    name: 'Ossuary Soul Scepter',
    slot: 'weapon',
    rarity: 'Uncommon',
    priceSilver: 15,
    allowedClasses: ['necromancer'],
    bonusStrength: 13,
    bonusAgility: 13,
    bonusPower: 22,
    description: 'Channels deeper soul essence into undead vanguard strikes.',
    source: 'merchant',
  },
  {
    id: 'arm_ironwood_brigandine',
    name: 'Ironwood Brigandine',
    slot: 'armor',
    rarity: 'Uncommon',
    priceSilver: 18,
    bonusHp: 95,
    bonusDefense: 14,
    bonusStrength: 8,
    bonusAgility: 6,
    description: 'Layered bark-iron plates built for crossing the Lv 5 Ward Gate.',
    source: 'merchant',
  },
  {
    id: 'wpn_elder_relic',
    name: 'Elderbane Masterwork Armament',
    slot: 'weapon',
    rarity: 'Rare',
    priceSilver: 35,
    bonusStrength: 28,
    bonusAgility: 28,
    bonusPower: 38,
    description: 'Adaptive masterwork weapon usable by any awakened class in the Elder Wilds.',
    source: 'merchant',
  },
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_thornhide_mantle',
    silverCost: 6,
    materials: { slime_gel: 2, thorn_pelt: 2 },
    resultItem: {
      id: 'craft_arm_thornhide',
      name: 'Thornhide Mantle',
      slot: 'armor',
      rarity: 'Uncommon',
      priceSilver: 0,
      bonusHp: 85,
      bonusDefense: 12,
      bonusAgility: 10,
      bonusStrength: 6,
      description: 'Crafted from Slime Gel & Thornwolf Pelts. Resilient Safe Jungle armor.',
      source: 'crafted',
    },
  },
  {
    id: 'craft_ember_helm',
    silverCost: 10,
    materials: { ember_bark: 2, runic_shard: 2 },
    resultItem: {
      id: 'craft_hlm_ember',
      name: 'Cinder-Runed Visor',
      slot: 'helm',
      rarity: 'Rare',
      priceSilver: 0,
      bonusHp: 70,
      bonusDefense: 11,
      bonusStrength: 14,
      bonusAgility: 14,
      bonusPower: 12,
      description: 'Forged with Cinder Heartwood & Ward Runic Shards for Lv 5+ expeditions.',
      source: 'crafted',
    },
  },
  {
    id: 'craft_runic_blade',
    silverCost: 14,
    materials: { ember_bark: 2, runic_shard: 3 },
    resultItem: {
      id: 'craft_wpn_runic',
      name: 'Runebound Frontier Armament',
      slot: 'weapon',
      rarity: 'Rare',
      priceSilver: 0,
      bonusStrength: 22,
      bonusAgility: 22,
      bonusPower: 30,
      description: 'Versatile runic weapon attuned to all classes and elemental conduits.',
      source: 'crafted',
    },
  },
  {
    id: 'craft_elder_regalia',
    silverCost: 22,
    materials: { runic_shard: 3, elder_scale: 3 },
    resultItem: {
      id: 'craft_arm_elder_regalia',
      name: 'Elder Scale Warplate',
      slot: 'armor',
      rarity: 'Epic',
      priceSilver: 0,
      bonusHp: 175,
      bonusDefense: 24,
      bonusStrength: 20,
      bonusAgility: 20,
      bonusPower: 16,
      description: 'Forged from Apex Elder Wyvern Scales to endure Lv 8–10 Wilds combat.',
      source: 'crafted',
    },
  },
];

export const RANK_REWARD_TIERS: RankRewardTier[] = [
  {
    rankThreshold: 10,
    title: 'Top 10 · Bronze Vanguard',
    item: {
      id: 'rank_arm_warden_pauldrons',
      name: "Warden's Engraved Hauberk",
      slot: 'armor',
      rarity: 'Rare',
      priceSilver: 0,
      bonusHp: 110,
      bonusDefense: 16,
      bonusAgility: 14,
      bonusStrength: 10,
      description: 'Rare armor bestowed upon adventurers reaching Top 10 on the Hall of Valor.',
      source: 'rank_reward',
      minRankRequired: 10,
    },
  },
  {
    rankThreshold: 5,
    title: 'Top 5 · Silver Sentinel',
    item: {
      id: 'rank_hlm_duskweave_crest',
      name: 'Duskweave Sentinel Helm',
      slot: 'helm',
      rarity: 'Epic',
      priceSilver: 0,
      bonusHp: 90,
      bonusDefense: 15,
      bonusAgility: 18,
      bonusStrength: 18,
      bonusPower: 14,
      description: 'Rare helm forged from moonlight alloy for Top 5 ranked champions.',
      source: 'rank_reward',
      minRankRequired: 5,
    },
  },
  {
    rankThreshold: 3,
    title: 'Top 3 · Gold Ascendant',
    item: {
      id: 'rank_arm_sunfire_cuirass',
      name: 'Sunfire Ascendant Cuirass',
      slot: 'armor',
      rarity: 'Mythic',
      priceSilver: 0,
      bonusHp: 185,
      bonusDefense: 26,
      bonusAgility: 24,
      bonusStrength: 24,
      bonusPower: 20,
      description: 'Radiant warplate awarded exclusively to the Top 3 protectors of Sylvan Ward.',
      source: 'rank_reward',
      minRankRequired: 3,
    },
  },
  {
    rankThreshold: 1,
    title: 'Rank #1 · Grand Sovereign',
    item: {
      id: 'rank_hlm_sovereign_crown',
      name: 'Sovereign Aegis Crown',
      slot: 'helm',
      rarity: 'Legendary',
      priceSilver: 0,
      bonusHp: 160,
      bonusDefense: 24,
      bonusAgility: 32,
      bonusStrength: 32,
      bonusPower: 34,
      description: 'Legendary crown of the #1 adventurer. Grants immense power and golden aura.',
      source: 'rank_reward',
      minRankRequired: 1,
    },
  },
];

export const RIVAL_ADVENTURERS: Omit<RankEntry, 'isPlayer'>[] = [
  { id: 'npc_1', name: 'Valerius Voss', classLabel: 'Necromancer · Legendary', level: 11, score: 6200 },
  { id: 'npc_2', name: 'Seraphina Vale', classLabel: 'Mage (Fire · Wind)', level: 10, score: 4800 },
  { id: 'npc_3', name: 'Kaelen Thorne', classLabel: 'Warrior · Vanguard', level: 9, score: 3700 },
  { id: 'npc_4', name: 'Lyris Moonbow', classLabel: 'Archer · Ranger', level: 8, score: 2900 },
  { id: 'npc_5', name: 'Orin Ashveil', classLabel: 'Mage (Lightning)', level: 7, score: 2150 },
  { id: 'npc_6', name: 'Bram Ironoak', classLabel: 'Warrior · Vanguard', level: 6, score: 1550 },
  { id: 'npc_7', name: 'Talia Storm', classLabel: 'Mage (Water · Earth · Wind)', level: 5, score: 1050 },
  { id: 'npc_8', name: 'Rowan Swift', classLabel: 'Archer · Ranger', level: 4, score: 680 },
  { id: 'npc_9', name: 'Corin Marsh', classLabel: 'Warrior · Vanguard', level: 3, score: 380 },
  { id: 'npc_10', name: 'Mira Flint', classLabel: 'Archer · Ranger', level: 2, score: 190 },
  { id: 'npc_11', name: 'Alden Brook', classLabel: 'Warrior · Recruit', level: 1, score: 60 },
];

export const VILLAGE_NPCS: NpcEntity[] = [
  {
    id: 'npc_trainer',
    name: 'Master Gareth',
    role: 'trainer',
    x: 610,
    y: 1100,
    radius: 26,
    promptText: 'Press [F] to speak with Master Gareth (Training)',
  },
  {
    id: 'npc_quest_village',
    name: 'Quartermaster Vael',
    role: 'quest_village',
    x: 780,
    y: 1320,
    radius: 26,
    promptText: 'Press [F] for Village Contract Board (Quests)',
  },
  {
    id: 'npc_merchant',
    name: 'Merchant Lyra',
    role: 'merchant',
    x: 420,
    y: 940,
    radius: 26,
    promptText: 'Press [F] to open Merchant & Field Forge (5 Silver Gear)',
  },
  {
    id: 'npc_ranking',
    name: 'Hall of Valor',
    role: 'ranking',
    x: 420,
    y: 1380,
    radius: 30,
    promptText: 'Press [F] to inspect Rankings & Rare Armor Rewards',
  },
  {
    id: 'npc_healer',
    name: 'Sanctuary Fountain',
    role: 'healer',
    x: 260,
    y: 1180,
    radius: 34,
    promptText: 'Sanctuary Fountain restores HP & Mana nearby',
  },
  {
    id: 'npc_quest_jungle',
    name: 'Ranger Kael',
    role: 'quest_jungle',
    x: JUNGLE_CAMP_POS.x,
    y: JUNGLE_CAMP_POS.y,
    radius: 26,
    promptText: 'Press [F] for Jungle Outpost Quests & Escorts',
  },
  {
    id: 'npc_gatekeeper',
    name: 'Elder Gate Warden',
    role: 'gatekeeper',
    x: 2540,
    y: 1200,
    radius: 28,
    promptText: 'Elder Wilds Gate — Level 5+ Required to Enter',
  },
];

export const MONSTER_ARCHETYPES: Record<string, MonsterArchetype> = {
  moss_slime: {
    id: 'moss_slime',
    name: 'Moss Slime',
    level: 1,
    maxHp: 95,
    damage: 8,
    speed: 68,
    radius: 18,
    expReward: 550,
    silverReward: 2,
    scoreReward: 35,
    isBoss: false,
    zone: 'SAFE_JUNGLE',
    element: 'water',
    color: '#4ade80',
    accentColor: '#15803d',
    attackCooldown: 1.5,
    aggroRange: 250,
    attackRange: 38,
    dropMaterial: 'slime_gel',
  },
  young_boar: {
    id: 'young_boar',
    name: 'Bristle Boar',
    level: 1,
    maxHp: 115,
    damage: 11,
    speed: 88,
    radius: 20,
    expReward: 650,
    silverReward: 2,
    scoreReward: 40,
    isBoss: false,
    zone: 'SAFE_JUNGLE',
    element: 'earth',
    color: '#a16207',
    accentColor: '#713f12',
    attackCooldown: 1.4,
    aggroRange: 260,
    attackRange: 42,
    dropMaterial: 'slime_gel',
  },
  thorn_wolf: {
    id: 'thorn_wolf',
    name: 'Thorn Wolf',
    level: 2,
    maxHp: 175,
    damage: 16,
    speed: 118,
    radius: 21,
    expReward: 1150,
    silverReward: 3,
    scoreReward: 70,
    isBoss: false,
    zone: 'SAFE_JUNGLE',
    element: 'wind',
    color: '#64748b',
    accentColor: '#34d399',
    attackCooldown: 1.2,
    aggroRange: 310,
    attackRange: 44,
    dropMaterial: 'thorn_pelt',
  },
  bramble_spider: {
    id: 'bramble_spider',
    name: 'Bramble Weaver',
    level: 3,
    maxHp: 260,
    damage: 22,
    speed: 102,
    radius: 23,
    expReward: 2200,
    silverReward: 4,
    scoreReward: 115,
    isBoss: false,
    zone: 'SAFE_JUNGLE',
    element: 'lightning',
    color: '#475569',
    accentColor: '#facc15',
    attackCooldown: 1.4,
    aggroRange: 330,
    attackRange: 170,
    dropMaterial: 'thorn_pelt',
  },
  ember_treant: {
    id: 'ember_treant',
    name: 'Cinder Sapling',
    level: 4,
    maxHp: 390,
    damage: 29,
    speed: 82,
    radius: 26,
    expReward: 4200,
    silverReward: 6,
    scoreReward: 185,
    isBoss: false,
    zone: 'SAFE_JUNGLE',
    element: 'fire',
    color: '#7c2d12',
    accentColor: '#f97316',
    attackCooldown: 1.5,
    aggroRange: 320,
    attackRange: 54,
    dropMaterial: 'ember_bark',
  },
  moss_behemoth: {
    id: 'moss_behemoth',
    name: 'Moss Behemoth',
    level: 5,
    maxHp: 1450,
    damage: 44,
    speed: 78,
    radius: 44,
    expReward: 14500,
    silverReward: 16,
    scoreReward: 550,
    isBoss: true,
    zone: 'SAFE_JUNGLE',
    element: 'earth',
    color: '#166534',
    accentColor: '#eab308',
    attackCooldown: 1.9,
    aggroRange: 380,
    attackRange: 80,
    dropMaterial: 'ember_bark',
  },
  outskirt_panther: {
    id: 'outskirt_panther',
    name: 'Shadow Stalker',
    level: 6,
    maxHp: 680,
    damage: 56,
    speed: 146,
    radius: 24,
    expReward: 9500,
    silverReward: 9,
    scoreReward: 320,
    isBoss: false,
    zone: 'OUTER_DANGER',
    element: 'wind',
    color: '#312e81',
    accentColor: '#a855f7',
    attackCooldown: 1.15,
    aggroRange: 380,
    attackRange: 50,
    dropMaterial: 'runic_shard',
  },
  outskirt_basilisk: {
    id: 'outskirt_basilisk',
    name: 'Venom Basilisk',
    level: 7,
    maxHp: 920,
    damage: 68,
    speed: 112,
    radius: 27,
    expReward: 16500,
    silverReward: 11,
    scoreReward: 420,
    isBoss: false,
    zone: 'OUTER_DANGER',
    element: 'water',
    color: '#0f766e',
    accentColor: '#2dd4bf',
    attackCooldown: 1.35,
    aggroRange: 360,
    attackRange: 210,
    dropMaterial: 'runic_shard',
  },
  elder_drake: {
    id: 'elder_drake',
    name: 'Stormclaw Drake',
    level: 8,
    maxHp: 1380,
    damage: 82,
    speed: 124,
    radius: 29,
    expReward: 29000,
    silverReward: 15,
    scoreReward: 620,
    isBoss: false,
    zone: 'ELDER_JUNGLE',
    element: 'lightning',
    color: '#1e3a8a',
    accentColor: '#fde047',
    attackCooldown: 1.3,
    aggroRange: 390,
    attackRange: 220,
    dropMaterial: 'elder_scale',
  },
  elder_oni: {
    id: 'elder_oni',
    name: 'Crimson Sentinel',
    level: 9,
    maxHp: 1950,
    damage: 98,
    speed: 108,
    radius: 32,
    expReward: 52000,
    silverReward: 20,
    scoreReward: 850,
    isBoss: false,
    zone: 'ELDER_JUNGLE',
    element: 'fire',
    color: '#7f1d1d',
    accentColor: '#fb923c',
    attackCooldown: 1.4,
    aggroRange: 390,
    attackRange: 64,
    dropMaterial: 'elder_scale',
  },
  abyssal_wyvern: {
    id: 'abyssal_wyvern',
    name: 'Apex Abyssal Wyvern',
    level: 10,
    maxHp: 5600,
    damage: 135,
    speed: 102,
    radius: 52,
    expReward: 145000,
    silverReward: 45,
    scoreReward: 1850,
    isBoss: true,
    zone: 'ELDER_JUNGLE',
    element: 'necrotic',
    color: '#4c1d95',
    accentColor: '#f43f5e',
    attackCooldown: 1.7,
    aggroRange: 440,
    attackRange: 105,
    dropMaterial: 'elder_scale',
  },
};

export const SPAWN_POINTS: SpawnPoint[] = [
  {
    id: 'sp_safe_1',
    x: 1160,
    y: 860,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['moss_slime', 'young_boar'],
    maxAlive: 4,
    respawnDelay: 4.5,
    respawnTimer: 0.5,
  },
  {
    id: 'sp_safe_2',
    x: 1160,
    y: 1540,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['moss_slime', 'young_boar'],
    maxAlive: 4,
    respawnDelay: 4.5,
    respawnTimer: 0.5,
  },
  {
    id: 'sp_safe_3',
    x: 1520,
    y: 620,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['thorn_wolf', 'bramble_spider'],
    maxAlive: 4,
    respawnDelay: 5.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_safe_4',
    x: 1540,
    y: 1780,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['thorn_wolf', 'bramble_spider'],
    maxAlive: 4,
    respawnDelay: 5.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_safe_5',
    x: 1920,
    y: 680,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['bramble_spider', 'ember_treant'],
    maxAlive: 4,
    respawnDelay: 5.5,
    respawnTimer: 1.2,
  },
  {
    id: 'sp_safe_6',
    x: 1920,
    y: 1720,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['ember_treant'],
    maxAlive: 3,
    respawnDelay: 6.0,
    respawnTimer: 1.5,
  },
  {
    id: 'sp_safe_boss',
    x: 1920,
    y: 1200,
    zone: 'SAFE_JUNGLE',
    archetypeIds: ['moss_behemoth'],
    maxAlive: 1,
    respawnDelay: 22.0,
    respawnTimer: 2.0,
    isBossSpawn: true,
  },
  {
    id: 'sp_outer_1',
    x: 2360,
    y: 780,
    zone: 'OUTER_DANGER',
    archetypeIds: ['outskirt_panther', 'outskirt_basilisk'],
    maxAlive: 3,
    respawnDelay: 6.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_outer_2',
    x: 2360,
    y: 1620,
    zone: 'OUTER_DANGER',
    archetypeIds: ['outskirt_panther', 'outskirt_basilisk'],
    maxAlive: 3,
    respawnDelay: 6.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_elder_1',
    x: 2820,
    y: 760,
    zone: 'ELDER_JUNGLE',
    archetypeIds: ['elder_drake', 'elder_oni'],
    maxAlive: 4,
    respawnDelay: 6.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_elder_2',
    x: 2850,
    y: 1660,
    zone: 'ELDER_JUNGLE',
    archetypeIds: ['elder_drake', 'elder_oni'],
    maxAlive: 4,
    respawnDelay: 6.0,
    respawnTimer: 1.0,
  },
  {
    id: 'sp_elder_boss',
    x: 3120,
    y: 1200,
    zone: 'ELDER_JUNGLE',
    archetypeIds: ['abyssal_wyvern'],
    maxAlive: 1,
    respawnDelay: 28.0,
    respawnTimer: 2.5,
    isBossSpawn: true,
  },
];

export const INITIAL_LANDMARKS: ExplorationLandmark[] = [
  {
    id: 'lm_moss_altar',
    name: 'Emerald Altar',
    x: 1740,
    y: 1020,
    radius: 75,
    zone: 'SAFE_JUNGLE',
    discovered: false,
  },
  {
    id: 'lm_spider_hollow',
    name: 'Spider Canopy Hollow',
    x: 1580,
    y: 1860,
    radius: 75,
    zone: 'SAFE_JUNGLE',
    discovered: false,
  },
  {
    id: 'lm_outskirt_watchtower',
    name: 'Outskirts Ruined Watchtower',
    x: 2340,
    y: 1200,
    radius: 80,
    zone: 'OUTER_DANGER',
    discovered: false,
  },
  {
    id: 'lm_elder_ridge',
    name: 'Stormclaw Ridge',
    x: 2840,
    y: 660,
    radius: 80,
    zone: 'ELDER_JUNGLE',
    discovered: false,
  },
  {
    id: 'lm_wyvern_perch',
    name: 'Abyssal Perch',
    x: 3120,
    y: 1200,
    radius: 90,
    zone: 'ELDER_JUNGLE',
    discovered: false,
  },
];

export function createInitialCollectibles(): WorldCollectible[] {
  const nodes: Array<{
    uid: string;
    kind: 'herb' | 'relic';
    itemKey: string;
    name: string;
    x: number;
    y: number;
    color: string;
  }> = [
    { uid: 'col_h1', kind: 'herb', itemKey: 'sunleaf_herb', name: 'Sunleaf Herb', x: 1120, y: 1180, color: '#86efac' },
    { uid: 'col_h2', kind: 'herb', itemKey: 'sunleaf_herb', name: 'Sunleaf Herb', x: 1280, y: 920, color: '#86efac' },
    { uid: 'col_h3', kind: 'herb', itemKey: 'sunleaf_herb', name: 'Sunleaf Herb', x: 1310, y: 1490, color: '#86efac' },
    { uid: 'col_h4', kind: 'herb', itemKey: 'sunleaf_herb', name: 'Sunleaf Herb', x: 1540, y: 820, color: '#86efac' },
    { uid: 'col_h5', kind: 'herb', itemKey: 'sunleaf_herb', name: 'Sunleaf Herb', x: 1620, y: 1580, color: '#86efac' },
    { uid: 'col_r1', kind: 'relic', itemKey: 'runic_fragment', name: 'Runic Relic', x: 1820, y: 540, color: '#38bdf8' },
    { uid: 'col_r2', kind: 'relic', itemKey: 'runic_fragment', name: 'Runic Relic', x: 1890, y: 1820, color: '#38bdf8' },
    { uid: 'col_r3', kind: 'relic', itemKey: 'runic_fragment', name: 'Runic Relic', x: 2350, y: 960, color: '#38bdf8' },
    { uid: 'col_r4', kind: 'relic', itemKey: 'runic_fragment', name: 'Runic Relic', x: 2370, y: 1480, color: '#38bdf8' },
    { uid: 'col_r5', kind: 'relic', itemKey: 'elder_amber', name: 'Elder Amber', x: 2790, y: 980, color: '#c084fc' },
    { uid: 'col_r6', kind: 'relic', itemKey: 'elder_amber', name: 'Elder Amber', x: 2940, y: 1480, color: '#c084fc' },
  ];

  return nodes.map((n) => ({
    ...n,
    respawnTimer: 0,
    active: true,
  }));
}

interface QuestBlueprint {
  templateId: string;
  minLevel: number;
  maxLevel: number;
  kind: DynamicQuest['kind'];
  difficulty: QuestDifficulty;
  giverRegion: QuestGiverRegion;
  giverName: string;
  targetZone: ZoneId;
  title: string;
  description: string;
  objectiveLabel: string;
  required: number;
  targetIds?: string[];
  escortConfig?: DynamicQuest['escortConfig'];
  bonusGear?: Item;
}

const QUEST_BLUEPRINTS: QuestBlueprint[] = [
  // Safe Village Quests (Lv 1–7)
  {
    templateId: 'q_vil_slime_cull',
    minLevel: 1,
    maxLevel: 3,
    kind: 'eradication',
    difficulty: 'Standard',
    giverRegion: 'village',
    giverName: 'Quartermaster Vael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Clear the Village Perimeter',
    description:
      'Moss Slimes and Bristle Boars have crept near the eastern cobblestone gate. Cull their numbers before dusk.',
    objectiveLabel: 'Defeat Lv 1 Slimes or Boars',
    required: 4,
    targetIds: ['moss_slime', 'young_boar'],
  },
  {
    templateId: 'q_vil_sunleaf_collect',
    minLevel: 1,
    maxLevel: 5,
    kind: 'collection',
    difficulty: 'Standard',
    giverRegion: 'village',
    giverName: 'Quartermaster Vael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Apothecary Sunleaf Harvest',
    description:
      'Forage glowing Sunleaf Herbs growing along the Emerald Thicket floor to replenish Havenbrook healing tonics.',
    objectiveLabel: 'Collect Sunleaf Herbs in Safe Jungle',
    required: 3,
    targetIds: ['sunleaf_herb'],
  },
  {
    templateId: 'q_vil_escort_toben',
    minLevel: 2,
    maxLevel: 6,
    kind: 'escort',
    difficulty: 'Veteran',
    giverRegion: 'village',
    giverName: 'Quartermaster Vael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Supply Escort to Jungle Outpost',
    description:
      'Escort Courier Toben safely from Havenbrook Plaza through the Safe Jungle to Ranger Kael’s campfire outpost.',
    objectiveLabel: 'Escort Courier Toben to Jungle Outpost',
    required: 1,
    escortConfig: {
      companionName: 'Courier Toben',
      startX: 820,
      startY: 1240,
      destX: JUNGLE_CAMP_POS.x,
      destY: JUNGLE_CAMP_POS.y,
      destLabel: 'Jungle Outpost Camp',
    },
    bonusGear: {
      id: 'qst_arm_courier_cloak',
      name: 'Outrider Ward Cloak',
      slot: 'armor',
      rarity: 'Uncommon',
      priceSilver: 0,
      bonusHp: 75,
      bonusDefense: 10,
      bonusAgility: 10,
      description: 'Sturdy scout mantle gifted for safely escorting Courier Toben.',
      source: 'quest_reward',
    },
  },
  {
    templateId: 'q_vil_wolf_hunt',
    minLevel: 2,
    maxLevel: 6,
    kind: 'eradication',
    difficulty: 'Veteran',
    giverRegion: 'village',
    giverName: 'Quartermaster Vael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Thorn Wolf Pack Cull',
    description:
      'Thorn Wolves and Bramble Weavers have begun prowling the inner thicket groves. Thin out the packs.',
    objectiveLabel: 'Defeat Thorn Wolves or Bramble Weavers',
    required: 5,
    targetIds: ['thorn_wolf', 'bramble_spider'],
  },
  {
    templateId: 'q_vil_survey_altars',
    minLevel: 3,
    maxLevel: 7,
    kind: 'exploration',
    difficulty: 'Veteran',
    giverRegion: 'village',
    giverName: 'Quartermaster Vael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Survey the Ancient Grove Shrines',
    description:
      'Explore deep inside the Emerald Thicket to map both the Emerald Altar and Spider Canopy Hollow.',
    objectiveLabel: 'Discover Safe Jungle Landmarks',
    required: 2,
    targetIds: ['lm_moss_altar', 'lm_spider_hollow'],
  },
  // Jungle Outpost Quests (Ranger Kael inside Safe Jungle + Frontier)
  {
    templateId: 'q_jng_relic_gather',
    minLevel: 3,
    maxLevel: 8,
    kind: 'collection',
    difficulty: 'Veteran',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Recover Fallen Runic Relics',
    description:
      'Ancient Runic Relics shimmer around the outer thicket groves and Perilous Outskirts. Gather them for ward reinforcement.',
    objectiveLabel: 'Collect Runic Relics',
    required: 3,
    targetIds: ['runic_fragment'],
  },
  {
    templateId: 'q_jng_cinder_purge',
    minLevel: 4,
    maxLevel: 7,
    kind: 'eradication',
    difficulty: 'Elite',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Quench the Cinder Saplings',
    description:
      'Lv 4 Cinder Saplings threaten to ignite the eastern canopy. Purge them and salvage their heartwood.',
    objectiveLabel: 'Defeat Lv 4 Cinder Saplings',
    required: 4,
    targetIds: ['ember_treant'],
  },
  {
    templateId: 'q_jng_moss_behemoth',
    minLevel: 4,
    maxLevel: 8,
    kind: 'eradication',
    difficulty: 'Elite',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'SAFE_JUNGLE',
    title: 'Topple the Moss Behemoth',
    description:
      'Slay the Lv 5 Safe Jungle Boss guarding the central shrine to prove readiness for the Elder Wilds.',
    objectiveLabel: 'Defeat Lv 5 Moss Behemoth',
    required: 1,
    targetIds: ['moss_behemoth'],
    bonusGear: {
      id: 'qst_hlm_behemoth_crest',
      name: 'Mossbark Guardian Helm',
      slot: 'helm',
      rarity: 'Rare',
      priceSilver: 0,
      bonusHp: 85,
      bonusDefense: 12,
      bonusStrength: 12,
      bonusAgility: 12,
      description: 'Carved from the vanquished Moss Behemoth crest.',
      source: 'quest_reward',
    },
  },
  {
    templateId: 'q_jng_escort_rowan',
    minLevel: 5,
    maxLevel: 12,
    kind: 'escort',
    difficulty: 'Elite',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'OUTER_DANGER',
    title: 'Escort Scholar Rowan to Elder Gate',
    description:
      'Accompany Cartographer Rowan from the Jungle Outpost across the Perilous Outskirts to the Lv 5+ Elder Gate.',
    objectiveLabel: 'Escort Scholar Rowan to Elder Gate',
    required: 1,
    escortConfig: {
      companionName: 'Scholar Rowan',
      startX: JUNGLE_CAMP_POS.x + 70,
      startY: JUNGLE_CAMP_POS.y,
      destX: 2510,
      destY: 1200,
      destLabel: 'Elder Wilds Gate',
    },
  },
  {
    templateId: 'q_jng_elder_recon',
    minLevel: 5,
    maxLevel: 15,
    kind: 'exploration',
    difficulty: 'Apex',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'ELDER_JUNGLE',
    title: 'Chart the Elder Wilds Frontier',
    description:
      'For Lv 5+ veterans: cross the Elder Gate and chart the Outskirts Watchtower, Stormclaw Ridge, and Abyssal Perch.',
    objectiveLabel: 'Survey Frontier & Elder Landmarks',
    required: 2,
    targetIds: ['lm_outskirt_watchtower', 'lm_elder_ridge', 'lm_wyvern_perch'],
  },
  {
    templateId: 'q_jng_elder_amber',
    minLevel: 5,
    maxLevel: 15,
    kind: 'collection',
    difficulty: 'Apex',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'ELDER_JUNGLE',
    title: 'Harvest Elder Amber Cores',
    description:
      'Retrieve crystalline Elder Amber shards deep within the Lv 5+ Elder Wilds canopy.',
    objectiveLabel: 'Collect Elder Amber in Elder Wilds',
    required: 2,
    targetIds: ['elder_amber'],
  },
  {
    templateId: 'q_jng_elder_hunt',
    minLevel: 6,
    maxLevel: 20,
    kind: 'eradication',
    difficulty: 'Apex',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'ELDER_JUNGLE',
    title: 'Hunt the Elder Predators',
    description:
      'Defeat Stormclaw Drakes and Crimson Sentinels roaming the Lv 5+ Elder Wilds to surpass Level 7.',
    objectiveLabel: 'Defeat Elder Drakes or Sentinels',
    required: 4,
    targetIds: ['elder_drake', 'elder_oni'],
  },
  {
    templateId: 'q_jng_wyvern_slay',
    minLevel: 7,
    maxLevel: 25,
    kind: 'eradication',
    difficulty: 'Apex',
    giverRegion: 'jungle',
    giverName: 'Ranger Kael',
    targetZone: 'ELDER_JUNGLE',
    title: 'Apex Bounty: Abyssal Wyvern',
    description:
      'Vanquish the Lv 10 Apex Abyssal Wyvern perched at the easternmost sanctuary.',
    objectiveLabel: 'Defeat Lv 10 Abyssal Wyvern',
    required: 1,
    targetIds: ['abyssal_wyvern'],
    bonusGear: {
      id: 'qst_wpn_wyvern_fang',
      name: 'Abyssal Wyvernfang Relic',
      slot: 'weapon',
      rarity: 'Epic',
      priceSilver: 0,
      bonusStrength: 34,
      bonusAgility: 34,
      bonusPower: 46,
      description: 'Apex weapon forged from the Abyssal Wyvern’s fang.',
      source: 'quest_reward',
    },
  },
];

function computeScaledReward(
  bp: QuestBlueprint,
  playerLevel: number
): DynamicQuest['reward'] {
  const diffMult =
    bp.difficulty === 'Standard'
      ? 1.0
      : bp.difficulty === 'Veteran'
      ? 1.35
      : bp.difficulty === 'Elite'
      ? 1.8
      : 2.35;

  const effectiveLevel = Math.max(playerLevel, bp.minLevel);
  const lvlExp = getMaxExpForLevel(effectiveLevel);
  const expFrac =
    bp.difficulty === 'Standard'
      ? 0.28
      : bp.difficulty === 'Veteran'
      ? 0.36
      : bp.difficulty === 'Elite'
      ? 0.48
      : 0.62;

  const exp = Math.round((lvlExp * expFrac) / 50) * 50;
  const silver = Math.round((4 + effectiveLevel * 2.5) * diffMult);
  const score = Math.round(75 * effectiveLevel * diffMult);

  const materials: Partial<Record<MaterialId, number>> = {};
  if (effectiveLevel <= 2) {
    materials.slime_gel = 2;
  } else if (effectiveLevel <= 4) {
    materials.thorn_pelt = 2;
    if (bp.difficulty !== 'Standard') materials.slime_gel = 1;
  } else if (effectiveLevel <= 6) {
    materials.ember_bark = 2;
    materials.runic_shard = bp.difficulty === 'Elite' || bp.difficulty === 'Apex' ? 2 : 1;
  } else {
    materials.runic_shard = 2;
    materials.elder_scale = 2;
  }

  return {
    exp,
    silver,
    score,
    materials,
    gearReward: bp.bonusGear,
  };
}

let questSeq = 1;

export function buildDynamicQuestPool(
  playerLevel: number,
  excludeTemplateIds: Set<string>
): DynamicQuest[] {
  const eligible = QUEST_BLUEPRINTS.filter(
    (bp) =>
      !excludeTemplateIds.has(bp.templateId) &&
      playerLevel >= Math.max(1, bp.minLevel - 1) &&
      playerLevel <= bp.maxLevel + 2
  );

  const fallback = eligible.length >= 4
    ? eligible
    : QUEST_BLUEPRINTS.filter((bp) => !excludeTemplateIds.has(bp.templateId));

  // Ensure variety: pick from village & jungle and across kinds
  const villagePicks = fallback.filter((b) => b.giverRegion === 'village').slice(0, 3);
  const junglePicks = fallback.filter((b) => b.giverRegion === 'jungle').slice(0, 4);
  const combined = [...villagePicks, ...junglePicks];

  return combined.map((bp) => ({
    uid: `dq_${bp.templateId}_${questSeq++}`,
    templateId: bp.templateId,
    title: bp.title,
    description: bp.description,
    kind: bp.kind,
    difficulty: bp.difficulty,
    giverRegion: bp.giverRegion,
    giverName: bp.giverName,
    recommendedLevel: Math.max(bp.minLevel, Math.min(playerLevel + 1, bp.maxLevel)),
    targetZone: bp.targetZone,
    targetIds: bp.targetIds,
    objectiveLabel: bp.objectiveLabel,
    progress: 0,
    required: bp.required,
    status: 'available',
    reward: computeScaledReward(bp, playerLevel),
    escortConfig: bp.escortConfig,
  }));
}

export function getZoneAt(x: number, y: number): ZoneId {
  if (
    x >= VILLAGE_BOUNDS.minX &&
    x <= VILLAGE_BOUNDS.maxX &&
    y >= VILLAGE_BOUNDS.minY &&
    y <= VILLAGE_BOUNDS.maxY
  ) {
    return 'SAFE_VILLAGE';
  }
  if (x <= SAFE_JUNGLE_BOUNDS.maxX) {
    return 'SAFE_JUNGLE';
  }
  if (x <= OUTER_DANGER_MAX_X) {
    return 'OUTER_DANGER';
  }
  return 'ELDER_JUNGLE';
}

export function getZoneLabel(zone: ZoneId): string {
  switch (zone) {
    case 'SAFE_VILLAGE':
      return 'Havenbrook Village · Safe Zone';
    case 'SAFE_JUNGLE':
      return 'Emerald Thicket · Safe Jungle (Max Lv 7)';
    case 'OUTER_DANGER':
      return 'Perilous Outskirts · Danger Below Lv 5';
    case 'ELDER_JUNGLE':
      return 'Elder Wilds · Lv 5+ Apex Jungle';
  }
}

export function rollRandomDestiny(): {
  classId: ClassId;
  mageElements: ElementType[];
} {
  const classes = Object.values(CLASS_DEFINITIONS);
  const totalWeight = classes.reduce((s, c) => s + c.rollWeight, 0);
  let r = Math.random() * totalWeight;
  let picked: ClassId = 'warrior';
  for (const c of classes) {
    r -= c.rollWeight;
    if (r <= 0) {
      picked = c.id;
      break;
    }
  }

  const allEls: ElementType[] = ['water', 'fire', 'lightning', 'wind', 'earth'];
  const shuffled = [...allEls].sort(() => Math.random() - 0.5);
  const tierRoll = Math.random();
  const count = tierRoll < 0.45 ? 1 : tierRoll < 0.8 ? 2 : 3;

  return {
    classId: picked,
    mageElements: shuffled.slice(0, count),
  };
}
