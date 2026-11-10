export type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'DEFEATED';

export type ClassId = 'warrior' | 'archer' | 'mage' | 'necromancer';

export type ClassRarity = 'Common' | 'Rare' | 'Legendary';

export type ElementType = 'water' | 'fire' | 'lightning' | 'wind' | 'earth';

export type MageAffinityCount = 1 | 2 | 3;

export type ZoneId =
  | 'SAFE_VILLAGE'
  | 'SAFE_JUNGLE'
  | 'OUTER_DANGER'
  | 'ELDER_JUNGLE';

export type EquipSlot = 'weapon' | 'armor' | 'helm';

export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Mythic' | 'Legendary';

export type MaterialId =
  | 'slime_gel'
  | 'thorn_pelt'
  | 'ember_bark'
  | 'runic_shard'
  | 'elder_scale';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  color: string;
  description: string;
}

export interface CraftRecipe {
  id: string;
  resultItem: Item;
  silverCost: number;
  materials: Partial<Record<MaterialId, number>>;
}

export interface Item {
  id: string;
  name: string;
  slot: EquipSlot | 'consumable';
  rarity: ItemRarity;
  priceSilver: number;
  description: string;
  allowedClasses?: ClassId[];
  bonusStrength?: number;
  bonusAgility?: number;
  bonusHp?: number;
  bonusDefense?: number;
  bonusPower?: number;
  healHp?: number;
  healMp?: number;
  source?: 'merchant' | 'rank_reward' | 'boss_drop' | 'starter' | 'quest_reward' | 'crafted';
  minRankRequired?: number;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  title: string;
  rarity: ClassRarity;
  rollWeight: number;
  description: string;
  baseHp: number;
  baseMp: number;
  hpPerLevel: number;
  mpPerLevel: number;
  strGrowth: number;
  agiGrowth: number;
  attackRange: number;
  moveSpeedBonus: number;
  accentHex: string;
}

export interface ElementalBalanceProfile {
  tier: MageAffinityCount;
  label: string;
  potencyMultiplier: number;
  cooldownMultiplier: number;
  statGrowthMultiplier: number;
  summary: string;
}

export interface SkillSlotInfo {
  key: 'LMB' | 'Q' | 'E' | 'R' | 'SHIFT';
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  remainingCooldown: number;
  element?: ElementType | 'physical' | 'necrotic';
}

export type QuestKind = 'eradication' | 'collection' | 'escort' | 'exploration';
export type QuestDifficulty = 'Standard' | 'Veteran' | 'Elite' | 'Apex';
export type QuestGiverRegion = 'village' | 'jungle';

export interface QuestReward {
  exp: number;
  silver: number;
  score: number;
  materials?: Partial<Record<MaterialId, number>>;
  gearReward?: Item;
}

export interface DynamicQuest {
  uid: string;
  templateId: string;
  title: string;
  description: string;
  kind: QuestKind;
  difficulty: QuestDifficulty;
  giverRegion: QuestGiverRegion;
  giverName: string;
  recommendedLevel: number;
  targetZone: ZoneId;
  targetIds?: string[]; // monster archetype IDs or collectible/waypoint IDs
  objectiveLabel: string;
  progress: number;
  required: number;
  status: 'available' | 'active' | 'ready_to_claim' | 'completed' | 'failed';
  reward: QuestReward;
  escortConfig?: {
    companionName: string;
    startX: number;
    startY: number;
    destX: number;
    destY: number;
    destLabel: string;
  };
}

export interface WorldCollectible {
  uid: string;
  kind: 'herb' | 'relic' | 'material';
  itemKey: string; // e.g., 'sunleaf_herb', 'runestone_fragment', or MaterialId
  name: string;
  x: number;
  y: number;
  color: string;
  respawnTimer: number;
  active: boolean;
}

export interface ExplorationLandmark {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  zone: ZoneId;
  discovered: boolean;
}

export interface EscortCompanion {
  questUid: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  destX: number;
  destY: number;
  destLabel: string;
  speed: number;
  radius: number;
  hitFlashTimer: number;
  ambushTimer: number;
  facing: number;
}

export interface QuestProgress {
  trainingStep: 0 | 1 | 2 | 3 | 4;
  dummyBasicHits: number;
  dummySkillHits: number;
  visitedMerchant: boolean;
  safeBossDefeated: number;
  elderBossDefeated: number;
}

export interface RankEntry {
  id: string;
  name: string;
  classLabel: string;
  level: number;
  score: number;
  isPlayer: boolean;
}

export interface RankRewardTier {
  rankThreshold: number;
  title: string;
  item: Item;
}

export interface NpcEntity {
  id: string;
  name: string;
  role: 'trainer' | 'merchant' | 'ranking' | 'healer' | 'gatekeeper' | 'quest_village' | 'quest_jungle';
  x: number;
  y: number;
  radius: number;
  promptText: string;
}

export interface MonsterArchetype {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  expReward: number;
  silverReward: number;
  scoreReward: number;
  isBoss: boolean;
  zone: 'SAFE_JUNGLE' | 'OUTER_DANGER' | 'ELDER_JUNGLE';
  element: ElementType | 'physical' | 'necrotic';
  color: string;
  accentColor: string;
  attackCooldown: number;
  aggroRange: number;
  attackRange: number;
  dropMaterial?: MaterialId;
}

export interface MonsterInstance {
  uid: string;
  archetypeId: string;
  name: string;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  expReward: number;
  silverReward: number;
  scoreReward: number;
  isBoss: boolean;
  isDummy: boolean;
  zone: ZoneId;
  element: ElementType | 'physical' | 'necrotic';
  color: string;
  accentColor: string;
  homeX: number;
  homeY: number;
  attackTimer: number;
  attackCooldown: number;
  attackRange: number;
  windupTimer: number;
  windupDuration: number;
  windupTargetX: number;
  windupTargetY: number;
  windupType: 'melee' | 'slam' | 'bolt' | 'charge';
  hitFlashTimer: number;
  slowTimer: number;
  burnTimer: number;
  burnDps: number;
  stunTimer: number;
  markedTimer: number;
  spawnAnimTimer: number;
  squash: number;
  facing: number;
  dropMaterial?: MaterialId;
}

export interface SummonInstance {
  uid: string;
  kind: 'skeleton' | 'wraith' | 'dread_knight';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  attackTimer: number;
  lifeTimer: number;
  maxLife: number;
  facing: number;
  hitFlashTimer: number;
}

export interface ProjectileInstance {
  uid: string;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  pierce: number;
  hitIds: Set<string>;
  element: ElementType | 'physical' | 'necrotic';
  color: string;
  kind: 'arrow' | 'bolt' | 'wave' | 'blade' | 'boulder' | 'enemy_orb';
  applySlow?: number;
  applyBurn?: number;
  applyStun?: number;
  applyMark?: boolean;
  aoeRadius?: number;
}

export interface GroundEffect {
  uid: string;
  kind: 'rain_arrows' | 'whirlwind' | 'cyclone' | 'earth_spikes' | 'fire_nova' | 'summon_rune' | 'boss_telegraph';
  x: number;
  y: number;
  radius: number;
  timer: number;
  duration: number;
  tickTimer: number;
  damagePerTick: number;
  color: string;
  element?: ElementType | 'physical' | 'necrotic';
  fromPlayer: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface SpawnPoint {
  id: string;
  x: number;
  y: number;
  zone: 'SAFE_JUNGLE' | 'OUTER_DANGER' | 'ELDER_JUNGLE';
  archetypeIds: string[];
  maxAlive: number;
  respawnDelay: number;
  respawnTimer: number;
  isBossSpawn?: boolean;
}

export interface PlayerConfig {
  name: string;
  classId: ClassId;
  mageElements: ElementType[];
}

export interface HudSnapshot {
  screen: GameScreen;
  playerName: string;
  classId: ClassId;
  className: string;
  rarity: ClassRarity;
  mageElements: ElementType[];
  mageTier: MageAffinityCount | null;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  silver: number;
  baseStrength: number;
  baseAgility: number;
  totalStrength: number;
  totalAgility: number;
  defense: number;
  powerRating: number;
  zone: ZoneId;
  zoneLabel: string;
  dangerWarning: boolean;
  safeCapReached: boolean;
  elderGateUnlocked: boolean;
  quest: QuestProgress;
  activeQuests: DynamicQuest[];
  availableQuests: DynamicQuest[];
  completedQuestCount: number;
  escort: EscortCompanion | null;
  materials: Record<MaterialId, number>;
  skills: SkillSlotInfo[];
  potionsCount: number;
  equipped: Partial<Record<EquipSlot, Item>>;
  inventory: Item[];
  combatScore: number;
  playerRank: number;
  rankings: RankEntry[];
  claimedRankRewards: number[];
  unclaimedRankRewards: RankRewardTier[];
  nearbyNpc: NpcEntity | null;
  activeBoss: { name: string; level: number; hp: number; maxHp: number } | null;
  summonCount: number;
  maxSummons: number;
  kills: number;
  bossKills: number;
  notifications: Array<{ id: string; text: string; tone: 'info' | 'reward' | 'danger' | 'level' }>;
  playerPos: { x: number; y: number };
  worldSize: { width: number; height: number };
  minimapMonsters: Array<{ x: number; y: number; isBoss: boolean; zone: ZoneId }>;
  muted: boolean;
}
