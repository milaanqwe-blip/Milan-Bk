import { sound } from './audio';
import {
  buildDynamicQuestPool,
  CLASS_DEFINITIONS,
  CRAFT_RECIPES,
  createInitialCollectibles,
  ELDER_JUNGLE_MIN_LEVEL,
  ELEMENT_META,
  ELEMENTAL_BALANCE_PROFILES,
  getElementalMatchupMultiplier,
  getMaxExpForLevel,
  getZoneAt,
  getZoneLabel,
  INITIAL_LANDMARKS,
  JUNGLE_CAMP_POS,
  MATERIALS,
  MERCHANT_ITEMS,
  MONSTER_ARCHETYPES,
  OUTER_DANGER_MAX_X,
  RANK_REWARD_TIERS,
  RIVAL_ADVENTURERS,
  SAFE_JUNGLE_BOUNDS,
  SAFE_ZONE_MAX_LEVEL,
  SPAWN_POINTS,
  STARTING_AGILITY,
  STARTING_SILVER,
  STARTING_STRENGTH,
  VILLAGE_BOUNDS,
  VILLAGE_NPCS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './data';
import {
  ClassId,
  DynamicQuest,
  ElementType,
  EquipSlot,
  EscortCompanion,
  ExplorationLandmark,
  FloatingText,
  GameScreen,
  GroundEffect,
  HudSnapshot,
  Item,
  MageAffinityCount,
  MaterialId,
  MonsterInstance,
  NpcEntity,
  Particle,
  PlayerConfig,
  ProjectileInstance,
  QuestProgress,
  RankEntry,
  SkillSlotInfo,
  SpawnPoint,
  SummonInstance,
  WorldCollectible,
} from './types';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mouseX: number; // screen coords
  mouseY: number;
  mouseDown: boolean;
}

export class GameEngine {
  public screen: GameScreen = 'TITLE';
  public camera = { x: 520, y: 1180, shake: 0 };
  public hitstopTimer = 0;
  public worldTime = 0;

  public playerConfig: PlayerConfig = {
    name: 'Adventurer',
    classId: 'warrior',
    mageElements: ['fire'],
  };

  public player = {
    x: 520,
    y: 1180,
    vx: 0,
    vy: 0,
    radius: 17,
    facing: 0,
    level: 1,
    exp: 0,
    maxExp: getMaxExpForLevel(1),
    hp: 240,
    maxHp: 240,
    mp: 90,
    maxMp: 90,
    silver: STARTING_SILVER,
    baseStrength: STARTING_STRENGTH,
    baseAgility: STARTING_AGILITY,
    potionsCount: 2,
    dashTimer: 0,
    dashVx: 0,
    dashVy: 0,
    invulnTimer: 0,
    earthShieldTimer: 0,
    windBuffTimer: 0,
    hitFlashTimer: 0,
    swingAnimTimer: 0,
    mageCycleIdx: 0,
    squash: 1,
  };

  public cooldowns = {
    LMB: 0,
    Q: 0,
    E: 0,
    R: 0,
    SHIFT: 0,
  };

  public equipped: Partial<Record<EquipSlot, Item>> = {};
  public inventory: Item[] = [];
  public materials: Record<MaterialId, number> = {
    slime_gel: 0,
    thorn_pelt: 0,
    ember_bark: 0,
    runic_shard: 0,
    elder_scale: 0,
  };

  public quest: QuestProgress = {
    trainingStep: 0,
    dummyBasicHits: 0,
    dummySkillHits: 0,
    visitedMerchant: false,
    safeBossDefeated: 0,
    elderBossDefeated: 0,
  };

  public activeQuests: DynamicQuest[] = [];
  public availableQuests: DynamicQuest[] = [];
  public completedQuestTemplates = new Set<string>();
  public completedQuestCount = 0;
  public escort: EscortCompanion | null = null;

  public collectibles: WorldCollectible[] = [];
  public landmarks: ExplorationLandmark[] = [];
  public monsters: MonsterInstance[] = [];
  public summons: SummonInstance[] = [];
  public projectiles: ProjectileInstance[] = [];
  public groundEffects: GroundEffect[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public spawnPoints: SpawnPoint[] = [];

  public kills = 0;
  public bossKills = 0;
  public bonusScore = 0;
  public claimedRankRewards: number[] = [];
  public notifications: Array<{ id: string; text: string; tone: 'info' | 'reward' | 'danger' | 'level' }> = [];

  private uidSeq = 1;
  private lastDangerAlertTime = -10;
  private safeCapNotified = false;
  private lastZone = 'SAFE_VILLAGE';
  private snapshotCallback: ((snap: HudSnapshot) => void) | null = null;
  private snapshotTimer = 0;

  public input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
  };

  private viewport = { width: 1280, height: 720 };

  constructor() {
    this.initWorldEntities();
  }

  public setSnapshotListener(cb: (snap: HudSnapshot) => void) {
    this.snapshotCallback = cb;
    cb(this.getSnapshot());
  }

  public setViewport(width: number, height: number) {
    this.viewport.width = Math.max(320, width);
    this.viewport.height = Math.max(240, height);
  }

  private nextUid(prefix: string): string {
    return `${prefix}_${this.uidSeq++}`;
  }

  public startNewGame(config: PlayerConfig) {
    this.playerConfig = {
      name: config.name.trim() || 'Adventurer',
      classId: config.classId,
      mageElements:
        config.classId === 'mage'
          ? (config.mageElements.length > 0 ? config.mageElements.slice(0, 3) : ['fire'])
          : [],
    };

    const classDef = CLASS_DEFINITIONS[this.playerConfig.classId];
    this.player = {
      x: 520,
      y: 1180,
      vx: 0,
      vy: 0,
      radius: 17,
      facing: 0,
      level: 1,
      exp: 0,
      maxExp: getMaxExpForLevel(1),
      hp: classDef.baseHp,
      maxHp: classDef.baseHp,
      mp: classDef.baseMp,
      maxMp: classDef.baseMp,
      silver: STARTING_SILVER,
      baseStrength: STARTING_STRENGTH,
      baseAgility: STARTING_AGILITY,
      potionsCount: 2,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      invulnTimer: 0,
      earthShieldTimer: 0,
      windBuffTimer: 0,
      hitFlashTimer: 0,
      swingAnimTimer: 0,
      mageCycleIdx: 0,
      squash: 1,
    };

    this.cooldowns = { LMB: 0, Q: 0, E: 0, R: 0, SHIFT: 0 };
    this.equipped = {};
    this.inventory = [];
    this.materials = {
      slime_gel: 0,
      thorn_pelt: 0,
      ember_bark: 0,
      runic_shard: 0,
      elder_scale: 0,
    };
    this.quest = {
      trainingStep: 0,
      dummyBasicHits: 0,
      dummySkillHits: 0,
      visitedMerchant: false,
      safeBossDefeated: 0,
      elderBossDefeated: 0,
    };
    this.activeQuests = [];
    this.completedQuestTemplates.clear();
    this.completedQuestCount = 0;
    this.escort = null;
    this.kills = 0;
    this.bossKills = 0;
    this.bonusScore = 0;
    this.claimedRankRewards = [];
    this.notifications = [];
    this.safeCapNotified = false;
    this.lastZone = 'SAFE_VILLAGE';

    this.initWorldEntities();
    this.refreshAvailableQuests();
    this.recalcDerivedStats(true);

    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.screen = 'PLAYING';
    this.pushNotification(
      `Welcome to Havenbrook Village, ${this.playerConfig.name}. Complete Basic Training with Master Gareth!`,
      'info'
    );
    this.emitSnapshot();
  }

  private initWorldEntities() {
    this.monsters = [];
    this.summons = [];
    this.projectiles = [];
    this.groundEffects = [];
    this.particles = [];
    this.floatingTexts = [];

    // 3 Training Dummies in Safe Village
    const dummyCoords = [
      { x: 720, y: 1030 },
      { x: 750, y: 1120 },
      { x: 720, y: 1210 },
    ];
    dummyCoords.forEach((c, i) => {
      this.monsters.push({
        uid: `dummy_${i}`,
        archetypeId: 'training_dummy',
        name: 'Training Dummy',
        level: 1,
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        hp: 99999,
        maxHp: 99999,
        damage: 0,
        speed: 0,
        radius: 20,
        expReward: 0,
        silverReward: 0,
        scoreReward: 0,
        isBoss: false,
        isDummy: true,
        zone: 'SAFE_VILLAGE',
        element: 'physical',
        color: '#a87d4b',
        accentColor: '#d97706',
        homeX: c.x,
        homeY: c.y,
        attackTimer: 0,
        attackCooldown: 99,
        attackRange: 0,
        windupTimer: 0,
        windupDuration: 0,
        windupTargetX: c.x,
        windupTargetY: c.y,
        windupType: 'melee',
        hitFlashTimer: 0,
        slowTimer: 0,
        burnTimer: 0,
        burnDps: 0,
        stunTimer: 0,
        markedTimer: 0,
        spawnAnimTimer: 0,
        squash: 1,
        facing: Math.PI,
      });
    });

    this.spawnPoints = SPAWN_POINTS.map((sp) => ({ ...sp, respawnTimer: 0.2 }));
    // Pre-populate Safe Jungle and Wilds so world feels immediately alive even on Title Screen
    for (const sp of this.spawnPoints) {
      const count = sp.isBossSpawn ? 1 : Math.max(2, sp.maxAlive - 1);
      for (let i = 0; i < count; i++) {
        this.spawnMonsterAtPoint(sp);
      }
    }

    this.collectibles = createInitialCollectibles();
    this.landmarks = INITIAL_LANDMARKS.map((l) => ({ ...l, discovered: false }));
    this.refreshAvailableQuests();
  }

  public refreshAvailableQuests() {
    const activeTemplates = new Set(this.activeQuests.map((q) => q.templateId));
    // Keep non-completed or allow rotating back after completion if needed
    const pool = buildDynamicQuestPool(this.player.level, activeTemplates);
    this.availableQuests = pool;
  }

  public getMageTier(): MageAffinityCount | null {
    if (this.playerConfig.classId !== 'mage') return null;
    const len = this.playerConfig.mageElements.length;
    if (len <= 1) return 1;
    if (len === 2) return 2;
    return 3;
  }

  public getDerivedStats() {
    const classDef = CLASS_DEFINITIONS[this.playerConfig.classId];
    const eqItems = Object.values(this.equipped).filter(Boolean) as Item[];
    const bonusStr = eqItems.reduce((s, it) => s + (it.bonusStrength || 0), 0);
    const bonusAgi = eqItems.reduce((s, it) => s + (it.bonusAgility || 0), 0);
    const bonusHp = eqItems.reduce((s, it) => s + (it.bonusHp || 0), 0);
    const bonusDef = eqItems.reduce((s, it) => s + (it.bonusDefense || 0), 0);
    const bonusPow = eqItems.reduce((s, it) => s + (it.bonusPower || 0), 0);

    const totalStrength = this.player.baseStrength + bonusStr;
    const totalAgility = this.player.baseAgility + bonusAgi;
    const maxHp = classDef.baseHp + (this.player.level - 1) * classDef.hpPerLevel + bonusHp;
    const maxMp = classDef.baseMp + (this.player.level - 1) * classDef.mpPerLevel;
    const earthShieldBonus = this.player.earthShieldTimer > 0 ? 18 : 0;
    const defense = Math.round(bonusDef + totalStrength * 0.14 + earthShieldBonus);

    const mageTier = this.getMageTier();
    const mageProfile = mageTier ? ELEMENTAL_BALANCE_PROFILES[mageTier] : null;
    const potencyMult = mageProfile ? mageProfile.potencyMultiplier : 1.0;

    let baseDamage = 0;
    if (this.playerConfig.classId === 'warrior') {
      baseDamage = 24 + (totalStrength - 50) * 1.15 + (totalAgility - 50) * 0.35 + bonusPow * 1.25;
    } else if (this.playerConfig.classId === 'archer') {
      baseDamage = 22 + (totalAgility - 50) * 1.18 + (totalStrength - 50) * 0.35 + bonusPow * 1.25;
    } else if (this.playerConfig.classId === 'mage') {
      const hybrid = ((totalStrength - 50) + (totalAgility - 50)) * 0.65;
      baseDamage = (23 + hybrid + bonusPow * 1.35) * potencyMult;
    } else {
      const hybrid = ((totalStrength - 50) + (totalAgility - 50)) * 0.62;
      baseDamage = 20 + hybrid + bonusPow * 1.25;
    }

    const critChance = Math.min(0.45, 0.08 + (totalAgility - 50) * 0.0028);
    const moveSpeed =
      188 + classDef.moveSpeedBonus + Math.min(75, (totalAgility - 50) * 0.7) + (this.player.windBuffTimer > 0 ? 48 : 0);

    return {
      totalStrength,
      totalAgility,
      maxHp,
      maxMp,
      defense,
      baseDamage: Math.round(baseDamage),
      critChance,
      moveSpeed,
      powerRating: Math.round(baseDamage + defense * 1.3 + this.player.level * 12),
    };
  }

  private recalcDerivedStats(healFull = false) {
    const prevMaxHp = this.player.maxHp;
    const prevMaxMp = this.player.maxMp;
    const stats = this.getDerivedStats();
    this.player.maxHp = stats.maxHp;
    this.player.maxMp = stats.maxMp;
    if (healFull) {
      this.player.hp = stats.maxHp;
      this.player.mp = stats.maxMp;
    } else {
      if (stats.maxHp > prevMaxHp) this.player.hp += stats.maxHp - prevMaxHp;
      if (stats.maxMp > prevMaxMp) this.player.mp += stats.maxMp - prevMaxMp;
      this.player.hp = Math.min(this.player.hp, stats.maxHp);
      this.player.mp = Math.min(this.player.mp, stats.maxMp);
    }
  }

  public getSkillInfos(): SkillSlotInfo[] {
    const cid = this.playerConfig.classId;
    const mageTier = this.getMageTier();
    const cdMult = mageTier ? ELEMENTAL_BALANCE_PROFILES[mageTier].cooldownMultiplier : 1;

    if (cid === 'warrior') {
      return [
        {
          key: 'LMB',
          name: 'Cleave Strike',
          description: 'Wide heavy blade arc knocking enemies back.',
          manaCost: 0,
          cooldown: 0.42,
          remainingCooldown: this.cooldowns.LMB,
          element: 'physical',
        },
        {
          key: 'Q',
          name: 'Whirlwind',
          description: 'Spinning steel vortex slicing all nearby monsters.',
          manaCost: 18,
          cooldown: 4.5,
          remainingCooldown: this.cooldowns.Q,
          element: 'physical',
        },
        {
          key: 'E',
          name: 'Bastion Charge',
          description: 'Shield lunge stunning enemies on impact.',
          manaCost: 20,
          cooldown: 6.0,
          remainingCooldown: this.cooldowns.E,
          element: 'physical',
        },
        {
          key: 'R',
          name: 'Titan Shatter',
          description: 'Crushing ground slam creating an AoE shockwave.',
          manaCost: 34,
          cooldown: 10.0,
          remainingCooldown: this.cooldowns.R,
          element: 'physical',
        },
        {
          key: 'SHIFT',
          name: 'Combat Dash',
          description: 'Quick evasive step with brief invulnerability.',
          manaCost: 0,
          cooldown: 2.6,
          remainingCooldown: this.cooldowns.SHIFT,
        },
      ];
    }

    if (cid === 'archer') {
      return [
        {
          key: 'LMB',
          name: 'Quick Shot',
          description: 'Rapid piercing arrow with Agility critical bonus.',
          manaCost: 0,
          cooldown: 0.34,
          remainingCooldown: this.cooldowns.LMB,
          element: 'physical',
        },
        {
          key: 'Q',
          name: 'Volley Fan',
          description: 'Launches 5 spread arrows in a wide cone.',
          manaCost: 18,
          cooldown: 4.2,
          remainingCooldown: this.cooldowns.Q,
          element: 'physical',
        },
        {
          key: 'E',
          name: 'Evasive Vault',
          description: 'Leaps backward while firing a slowing frost trap arrow.',
          manaCost: 22,
          cooldown: 5.5,
          remainingCooldown: this.cooldowns.E,
          element: 'water',
        },
        {
          key: 'R',
          name: 'Rain of Arrows',
          description: 'Arrow barrage raining over the cursor zone.',
          manaCost: 36,
          cooldown: 9.5,
          remainingCooldown: this.cooldowns.R,
          element: 'physical',
        },
        {
          key: 'SHIFT',
          name: 'Agile Roll',
          description: 'Fast ranger tumble avoiding incoming telegraphs.',
          manaCost: 0,
          cooldown: 2.3,
          remainingCooldown: this.cooldowns.SHIFT,
        },
      ];
    }

    if (cid === 'mage') {
      const els = this.playerConfig.mageElements;
      const e1 = els[0] || 'fire';
      const e2 = els[1] || e1;
      const e3 = els[2] || e2;
      const activeLmbEl = els[this.player.mageCycleIdx % els.length] || e1;

      const qSkill = ELEMENT_META[e1];
      const eSkill =
        els.length >= 2
          ? ELEMENT_META[e2]
          : {
              skillName: `${qSkill.name} Surge`,
              skillDesc: `Empowered 3-bolt fan of ${qSkill.name}.`,
            };
      const rSkill =
        els.length === 1
          ? {
              skillName: `${qSkill.name} Cataclysm`,
              skillDesc: `Massive focused ${qSkill.name} storm.`,
              el: e1,
            }
          : els.length === 2
          ? {
              skillName: 'Dual Resonance',
              skillDesc: `Unleashes ${ELEMENT_META[e1].name} & ${ELEMENT_META[e2].name} together for +28% Resonance.`,
              el: e2,
            }
          : {
              skillName: ELEMENT_META[e3].skillName,
              skillDesc: ELEMENT_META[e3].skillDesc,
              el: e3,
            };

      return [
        {
          key: 'LMB',
          name: `${ELEMENT_META[activeLmbEl].name} Bolt`,
          description:
            els.length > 1
              ? 'Cycles through your attuned elements to trigger Resonance.'
              : `Focused ${ELEMENT_META[activeLmbEl].name} projectile.`,
          manaCost: 0,
          cooldown: Number((0.4 * cdMult).toFixed(2)),
          remainingCooldown: this.cooldowns.LMB,
          element: activeLmbEl,
        },
        {
          key: 'Q',
          name: qSkill.skillName,
          description: qSkill.skillDesc,
          manaCost: 22,
          cooldown: Number((4.5 * cdMult).toFixed(1)),
          remainingCooldown: this.cooldowns.Q,
          element: e1,
        },
        {
          key: 'E',
          name: eSkill.skillName,
          description: eSkill.skillDesc,
          manaCost: 26,
          cooldown: Number((5.8 * cdMult).toFixed(1)),
          remainingCooldown: this.cooldowns.E,
          element: e2,
        },
        {
          key: 'R',
          name: rSkill.skillName,
          description: rSkill.skillDesc,
          manaCost: 42,
          cooldown: Number((9.5 * cdMult).toFixed(1)),
          remainingCooldown: this.cooldowns.R,
          element: rSkill.el,
        },
        {
          key: 'SHIFT',
          name: 'Arcane Blink',
          description: 'Quick elemental step dodging danger.',
          manaCost: 0,
          cooldown: 2.5,
          remainingCooldown: this.cooldowns.SHIFT,
        },
      ];
    }

    // Necromancer / Summoner
    return [
      {
        key: 'LMB',
        name: 'Soul Bolt',
        description: 'Cursed bolt marking foes for summons and leeching HP.',
        manaCost: 0,
        cooldown: 0.42,
        remainingCooldown: this.cooldowns.LMB,
        element: 'necrotic',
      },
      {
        key: 'Q',
        name: 'Raise Skeleton',
        description: 'Summons an undead Skeleton Vanguard to fight beside you.',
        manaCost: 24,
        cooldown: 4.5,
        remainingCooldown: this.cooldowns.Q,
        element: 'necrotic',
      },
      {
        key: 'E',
        name: 'Wraith Nova',
        description: 'Spectral burst slowing foes & cursing the zone.',
        manaCost: 28,
        cooldown: 6.2,
        remainingCooldown: this.cooldowns.E,
        element: 'necrotic',
      },
      {
        key: 'R',
        name: 'Dread Knight',
        description: 'Summons an armored Dread Knight champion & frenzies minions.',
        manaCost: 48,
        cooldown: 12.0,
        remainingCooldown: this.cooldowns.R,
        element: 'necrotic',
      },
      {
        key: 'SHIFT',
        name: 'Shadow Step',
          description: 'Phases briefly through danger.',
          manaCost: 0,
          cooldown: 2.5,
          remainingCooldown: this.cooldowns.SHIFT,
      },
    ];
  }

  public getMaxSummons(): number {
    if (this.playerConfig.classId !== 'necromancer') return 0;
    return Math.min(5, 2 + Math.floor(this.player.level / 3));
  }

  public getCombatScore(): number {
    const stats = this.getDerivedStats();
    return (
      this.player.level * 180 +
      this.kills * 22 +
      this.bossKills * 350 +
      this.completedQuestCount * 140 +
      this.bonusScore +
      Math.round(stats.powerRating * 1.5)
    );
  }

  public getRankings(): { rankings: RankEntry[]; playerRank: number } {
    const score = this.getCombatScore();
    const cid = this.playerConfig.classId;
    const classDef = CLASS_DEFINITIONS[cid];
    const elSuffix =
      cid === 'mage'
        ? ` (${this.playerConfig.mageElements.map((e) => ELEMENT_META[e].name).join(' · ')})`
        : ` · ${classDef.rarity}`;

    const list: RankEntry[] = [
      ...RIVAL_ADVENTURERS.map((r) => ({ ...r, isPlayer: false })),
      {
        id: 'player',
        name: this.playerConfig.name,
        classLabel: `${classDef.name}${elSuffix}`,
        level: this.player.level,
        score,
        isPlayer: true,
      },
    ].sort((a, b) => b.score - a.score);

    const idx = list.findIndex((r) => r.isPlayer);
    return { rankings: list, playerRank: idx >= 0 ? idx + 1 : list.length };
  }

  public getUnclaimedRankRewards(): typeof RANK_REWARD_TIERS {
    const { playerRank } = this.getRankings();
    return RANK_REWARD_TIERS.filter(
      (tier) => playerRank <= tier.rankThreshold && !this.claimedRankRewards.includes(tier.rankThreshold)
    );
  }

  public claimRankReward(rankThreshold: number) {
    const tier = RANK_REWARD_TIERS.find((t) => t.rankThreshold === rankThreshold);
    if (!tier || this.claimedRankRewards.includes(rankThreshold)) return;
    const { playerRank } = this.getRankings();
    if (playerRank > rankThreshold) return;

    this.claimedRankRewards.push(rankThreshold);
    const clonedItem: Item = { ...tier.item };
    this.inventory.push(clonedItem);
    this.equipItem(clonedItem.id);
    sound.playQuestComplete();
    this.pushNotification(`Rank Reward Claimed & Equipped: ${clonedItem.name}!`, 'reward');
    this.emitSnapshot();
  }

  public buyMerchantItem(itemId: string): { ok: boolean; message: string } {
    const item = MERCHANT_ITEMS.find((i) => i.id === itemId);
    if (!item) return { ok: false, message: 'Item not found.' };
    if (this.player.silver < item.priceSilver) {
      return { ok: false, message: `Need ${item.priceSilver} Silver Coins.` };
    }
    if (item.allowedClasses && !item.allowedClasses.includes(this.playerConfig.classId)) {
      return { ok: false, message: `Only usable by ${item.allowedClasses.join(', ')}.` };
    }

    this.player.silver -= item.priceSilver;
    sound.playCoin();

    if (item.slot === 'consumable') {
      this.player.potionsCount += 1;
      this.pushNotification(`Bought ${item.name} (-${item.priceSilver} Silver)`, 'info');
      this.emitSnapshot();
      return { ok: true, message: `Purchased ${item.name}.` };
    }

    const owned = this.inventory.some((i) => i.id === item.id) ||
      Object.values(this.equipped).some((i) => i?.id === item.id);
    const copy: Item = {
      ...item,
      id: owned ? `${item.id}_${Date.now()}` : item.id,
    };
    this.inventory.push(copy);
    this.equipItem(copy.id);
    this.pushNotification(`Purchased & Equipped ${item.name} (-${item.priceSilver} Silver)`, 'reward');
    this.emitSnapshot();
    return { ok: true, message: `Purchased & equipped ${item.name}!` };
  }

  public craftItem(recipeId: string): { ok: boolean; message: string } {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return { ok: false, message: 'Recipe not found.' };
    if (this.player.silver < recipe.silverCost) {
      return { ok: false, message: `Need ${recipe.silverCost} Silver Coins.` };
    }
    for (const [mat, qty] of Object.entries(recipe.materials)) {
      if ((this.materials[mat as MaterialId] || 0) < (qty || 0)) {
        return { ok: false, message: `Insufficient ${MATERIALS[mat as MaterialId].name}.` };
      }
    }

    this.player.silver -= recipe.silverCost;
    for (const [mat, qty] of Object.entries(recipe.materials)) {
      this.materials[mat as MaterialId] -= qty || 0;
    }

    const crafted: Item = {
      ...recipe.resultItem,
      id: `${recipe.resultItem.id}_${this.uidSeq++}`,
    };
    this.inventory.push(crafted);
    this.equipItem(crafted.id);
    sound.playQuestComplete();
    this.pushNotification(`Forged & Equipped ${crafted.name}!`, 'reward');
    this.emitSnapshot();
    return { ok: true, message: `Forged ${crafted.name}!` };
  }

  public equipItem(itemId: string) {
    const item = this.inventory.find((i) => i.id === itemId);
    if (!item || item.slot === 'consumable') return;
    if (item.allowedClasses && !item.allowedClasses.includes(this.playerConfig.classId)) return;

    this.equipped[item.slot] = item;
    this.recalcDerivedStats(false);
    this.emitSnapshot();
  }

  public usePotion() {
    if (this.player.potionsCount <= 0) {
      this.pushNotification('No Healing Tonics left! Buy at Village Merchant for 5 Silver.', 'info');
      this.emitSnapshot();
      return;
    }
    if (this.player.hp >= this.player.maxHp && this.player.mp >= this.player.maxMp) return;
    this.player.potionsCount -= 1;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 140);
    this.player.mp = Math.min(this.player.maxMp, this.player.mp + 75);
    this.spawnFloatingText(this.player.x, this.player.y - 24, '+140 HP · +75 MP', '#4ade80', 1.05);
    this.spawnParticles(this.player.x, this.player.y, '#4ade80', 14, 90);
    sound.playCoin();
    this.emitSnapshot();
  }

  public acceptDynamicQuest(questUid: string) {
    if (this.activeQuests.length >= 3) {
      this.pushNotification('Quest Log full (max 3 active contracts). Claim or abandon one first.', 'info');
      this.emitSnapshot();
      return;
    }
    const q = this.availableQuests.find((x) => x.uid === questUid);
    if (!q) return;

    if (q.kind === 'escort' && this.escort) {
      this.pushNotification('Finish your current Escort mission before starting another escort!', 'info');
      this.emitSnapshot();
      return;
    }

    const activeCopy: DynamicQuest = { ...q, status: 'active' };
    this.activeQuests.push(activeCopy);
    this.availableQuests = this.availableQuests.filter((x) => x.uid !== questUid);

    if (activeCopy.kind === 'escort' && activeCopy.escortConfig) {
      this.escort = {
        questUid: activeCopy.uid,
        name: activeCopy.escortConfig.companionName,
        x: activeCopy.escortConfig.startX,
        y: activeCopy.escortConfig.startY,
        hp: 360 + this.player.level * 45,
        maxHp: 360 + this.player.level * 45,
        destX: activeCopy.escortConfig.destX,
        destY: activeCopy.escortConfig.destY,
        destLabel: activeCopy.escortConfig.destLabel,
        speed: 140,
        radius: 16,
        hitFlashTimer: 0,
        ambushTimer: 5.5,
        facing: 0,
      };
      this.pushNotification(
        `Escort Started: Guide ${activeCopy.escortConfig.companionName} to ${activeCopy.escortConfig.destLabel}!`,
        'info'
      );
    } else {
      this.pushNotification(`Accepted Contract: ${activeCopy.title}`, 'info');
    }

    // Check if exploration landmark already discovered
    if (activeCopy.kind === 'exploration' && activeCopy.targetIds) {
      const done = this.landmarks.filter(
        (lm) => activeCopy.targetIds!.includes(lm.id) && lm.discovered
      ).length;
      if (done > 0) {
        activeCopy.progress = Math.min(activeCopy.required, done);
        if (activeCopy.progress >= activeCopy.required) {
          activeCopy.status = 'ready_to_claim';
        }
      }
    }

    this.emitSnapshot();
  }

  public abandonDynamicQuest(questUid: string) {
    const q = this.activeQuests.find((x) => x.uid === questUid);
    if (!q) return;
    if (this.escort && this.escort.questUid === questUid) {
      this.escort = null;
    }
    this.activeQuests = this.activeQuests.filter((x) => x.uid !== questUid);
    this.refreshAvailableQuests();
    this.emitSnapshot();
  }

  public claimDynamicQuest(questUid: string) {
    const q = this.activeQuests.find((x) => x.uid === questUid);
    if (!q || q.status !== 'ready_to_claim') return;

    this.activeQuests = this.activeQuests.filter((x) => x.uid !== questUid);
    this.completedQuestTemplates.add(q.templateId);
    this.completedQuestCount += 1;

    this.player.silver += q.reward.silver;
    this.bonusScore += q.reward.score;

    if (q.reward.materials) {
      for (const [mat, amt] of Object.entries(q.reward.materials)) {
        this.materials[mat as MaterialId] = (this.materials[mat as MaterialId] || 0) + (amt || 0);
      }
    }
    if (q.reward.gearReward) {
      const gear: Item = { ...q.reward.gearReward, id: `${q.reward.gearReward.id}_${this.uidSeq++}` };
      this.inventory.push(gear);
      this.pushNotification(`Quest Bonus Gear Received: ${gear.name}!`, 'reward');
    }

    this.grantExp(q.reward.exp);
    sound.playQuestComplete();
    this.pushNotification(
      `Contract Completed: ${q.title} (+${q.reward.exp.toLocaleString()} EXP, +${q.reward.silver} Silver)`,
      'reward'
    );
    this.refreshAvailableQuests();
    this.emitSnapshot();
  }

  public markVisitedMerchant() {
    if (!this.quest.visitedMerchant) {
      this.quest.visitedMerchant = true;
      if (this.quest.trainingStep === 2) {
        this.quest.trainingStep = 3;
        this.pushNotification('Training Step Ready! Speak with Master Gareth or click Complete Training.', 'info');
      }
      this.emitSnapshot();
    }
  }

  public completeTraining() {
    if (this.quest.trainingStep >= 4) return;
    this.quest.trainingStep = 4;
    this.bonusScore += 120;
    this.player.silver += 5;
    this.grantExp(1000);
    sound.playQuestComplete();
    this.pushNotification(
      'Basic Training Complete! +1,000 EXP & +5 Silver. Enter the Safe Zone Jungle to hunt Lv 1–4 monsters!',
      'reward'
    );
    this.emitSnapshot();
  }

  public respawnInVillage() {
    this.player.x = 520;
    this.player.y = 1180;
    this.player.vx = 0;
    this.player.vy = 0;
    this.recalcDerivedStats(true);
    this.screen = 'PLAYING';
    this.pushNotification('Restored safely at Havenbrook Sanctuary Fountain.', 'info');
    this.emitSnapshot();
  }

  public update(dt: number) {
    this.worldTime += dt;

    if (this.screen === 'TITLE') {
      // Gentle atmospheric camera pan across Safe Village -> Safe Jungle edge
      this.camera.x = 880 + Math.sin(this.worldTime * 0.22) * 320;
      this.camera.y = 1180 + Math.cos(this.worldTime * 0.17) * 140;
      this.updateAmbientMonsters(dt);
      this.updateParticlesAndTexts(dt);
      return;
    }

    if (this.screen !== 'PLAYING') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.camera.shake = Math.max(0, this.camera.shake - dt * 18);
      return;
    }

    // Cooldowns & buffs
    for (const k of ['LMB', 'Q', 'E', 'R', 'SHIFT'] as const) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }
    this.player.invulnTimer = Math.max(0, this.player.invulnTimer - dt);
    this.player.earthShieldTimer = Math.max(0, this.player.earthShieldTimer - dt);
    this.player.windBuffTimer = Math.max(0, this.player.windBuffTimer - dt);
    this.player.hitFlashTimer = Math.max(0, this.player.hitFlashTimer - dt);
    this.player.swingAnimTimer = Math.max(0, this.player.swingAnimTimer - dt);
    this.player.squash += (1 - this.player.squash) * Math.min(1, dt * 14);

    // Passive MP & Village Regeneration
    const currentZone = getZoneAt(this.player.x, this.player.y);
    const derived = this.getDerivedStats();
    this.player.maxHp = derived.maxHp;
    this.player.maxMp = derived.maxMp;

    const mpRegen = currentZone === 'SAFE_VILLAGE' ? 18 : 6.5;
    this.player.mp = Math.min(this.player.maxMp, this.player.mp + mpRegen * dt);

    const healerNpc = VILLAGE_NPCS.find((n) => n.role === 'healer');
    if (
      currentZone === 'SAFE_VILLAGE' ||
      (healerNpc && Math.hypot(this.player.x - healerNpc.x, this.player.y - healerNpc.y) < 110)
    ) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (healerNpc ? 35 : 14) * dt);
    }

    // Zone Transition Alerts
    if (currentZone !== this.lastZone) {
      this.lastZone = currentZone;
      if (currentZone === 'OUTER_DANGER' && this.player.level < ELDER_JUNGLE_MIN_LEVEL) {
        if (this.worldTime - this.lastDangerAlertTime > 4) {
          this.lastDangerAlertTime = this.worldTime;
          sound.playDangerAlert();
          this.pushNotification(
            'DANGER! Below Lv 5 outside Safe Zone — Lv 6–7 beasts deal lethal damage!',
            'danger'
          );
        }
      } else if (currentZone === 'SAFE_JUNGLE') {
        this.pushNotification('Entered Emerald Thicket (Safe Jungle · Monsters Lv 1–4, Boss Lv 5).', 'info');
      } else if (currentZone === 'ELDER_JUNGLE') {
        this.pushNotification('Entered Elder Wilds (Lv 5+ Jungle · Level past Lv 7!).', 'level');
      }
    }

    // Movement & Aim
    this.updatePlayerMovement(dt, derived.moveSpeed);
    const worldMouseX = this.camera.x - this.viewport.width / 2 + this.input.mouseX;
    const worldMouseY = this.camera.y - this.viewport.height / 2 + this.input.mouseY;
    this.player.facing = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);

    if (this.input.mouseDown && this.cooldowns.LMB <= 0) {
      this.triggerSkill('LMB', worldMouseX, worldMouseY);
    }

    // Update world spawns, collectibles, landmarks, escort, summons, projectiles, monsters
    this.updateSpawners(dt);
    this.updateCollectiblesAndLandmarks(dt);
    this.updateEscort(dt);
    this.updateSummons(dt);
    this.updateGroundEffects(dt);
    this.updateProjectiles(dt);
    this.updateMonsters(dt, derived.defense);
    this.updateParticlesAndTexts(dt);

    // Smooth camera follow + shake decay
    this.camera.x += (this.player.x - this.camera.x) * Math.min(1, dt * 8.5);
    this.camera.y += (this.player.y - this.camera.y) * Math.min(1, dt * 8.5);
    this.camera.shake = Math.max(0, this.camera.shake - dt * 20);

    // Snapshot cadence (~14 Hz)
    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 0.07) {
      this.snapshotTimer = 0;
      this.emitSnapshot();
    }
  }

  private updatePlayerMovement(dt: number, moveSpeed: number) {
    if (this.player.dashTimer > 0) {
      this.player.dashTimer -= dt;
      this.player.x += this.player.dashVx * dt;
      this.player.y += this.player.dashVy * dt;
    } else {
      let dx = 0;
      let dy = 0;
      if (this.input.left) dx -= 1;
      if (this.input.right) dx += 1;
      if (this.input.up) dy -= 1;
      if (this.input.down) dy += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }
      this.player.vx = dx * moveSpeed;
      this.player.vy = dy * moveSpeed;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
    }

    // World bounds clamp
    this.player.x = Math.max(80, Math.min(WORLD_WIDTH - 80, this.player.x));
    this.player.y = Math.max(120, Math.min(WORLD_HEIGHT - 120, this.player.y));

    // Elder Wilds Gate check (Lv 5+ required to cross x = 2580!)
    if (this.player.x > OUTER_DANGER_MAX_X - 18 && this.player.level < ELDER_JUNGLE_MIN_LEVEL) {
      this.player.x = OUTER_DANGER_MAX_X - 18;
      if (this.worldTime - this.lastDangerAlertTime > 2.2) {
        this.lastDangerAlertTime = this.worldTime;
        sound.playDangerAlert();
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 34,
          'Elder Gate Sealed (Lv 5+ Required)',
          '#f87171',
          1.1
        );
        this.pushNotification('Elder Wilds Jungle requires Level 5+. Hunt in Safe Jungle first!', 'danger');
      }
    }
  }

  public triggerSkill(key: 'LMB' | 'Q' | 'E' | 'R' | 'SHIFT', targetX?: number, targetY?: number) {
    if (this.screen !== 'PLAYING') return;
    if (this.cooldowns[key] > 0) return;

    const skills = this.getSkillInfos();
    const skillInfo = skills.find((s) => s.key === key);
    if (!skillInfo) return;

    if (this.player.mp < skillInfo.manaCost) {
      this.spawnFloatingText(this.player.x, this.player.y - 24, 'Low Mana', '#38bdf8', 0.9);
      return;
    }

    const tx = targetX ?? this.camera.x - this.viewport.width / 2 + this.input.mouseX;
    const ty = targetY ?? this.camera.y - this.viewport.height / 2 + this.input.mouseY;
    const aim = Math.atan2(ty - this.player.y, tx - this.player.x);
    this.player.facing = aim;

    if (key === 'SHIFT') {
      this.cooldowns.SHIFT = skillInfo.cooldown;
      let dx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      let dy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
      if (dx === 0 && dy === 0) {
        dx = Math.cos(aim);
        dy = Math.sin(aim);
      } else {
        const l = Math.hypot(dx, dy);
        dx /= l;
        dy /= l;
      }
      this.player.dashTimer = 0.18;
      this.player.invulnTimer = 0.24;
      this.player.dashVx = dx * 580;
      this.player.dashVy = dy * 580;
      this.spawnParticles(this.player.x, this.player.y, '#cbd5e1', 10, 95);
      sound.playElement('wind');
      return;
    }

    this.player.mp -= skillInfo.manaCost;
    this.cooldowns[key] = skillInfo.cooldown;
    this.player.squash = 1.18;

    const stats = this.getDerivedStats();
    const cid = this.playerConfig.classId;

    if (cid === 'warrior') {
      this.castWarriorSkill(key, aim, stats.baseDamage);
    } else if (cid === 'archer') {
      this.castArcherSkill(key, aim, tx, ty, stats.baseDamage);
    } else if (cid === 'mage') {
      this.castMageSkill(key, aim, tx, ty, stats.baseDamage);
    } else {
      this.castNecromancerSkill(key, aim, tx, ty, stats.baseDamage);
    }

    this.emitSnapshot();
  }

  private castWarriorSkill(key: 'LMB' | 'Q' | 'E' | 'R', aim: number, baseDmg: number) {
    if (key === 'LMB') {
      this.player.swingAnimTimer = 0.22;
      sound.playSlash();
      this.spawnParticles(
        this.player.x + Math.cos(aim) * 44,
        this.player.y + Math.sin(aim) * 44,
        '#fde68a',
        8,
        85
      );
      this.hitMonstersInCone(aim, 96, Math.PI * 0.78, baseDmg, 'physical', false, 24);
    } else if (key === 'Q') {
      sound.playSlash();
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'whirlwind',
        x: this.player.x,
        y: this.player.y,
        radius: 105,
        timer: 0,
        duration: 0.9,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 0.72),
        color: '#f59e0b',
        element: 'physical',
        fromPlayer: true,
      });
    } else if (key === 'E') {
      sound.playHit(true);
      this.player.dashTimer = 0.2;
      this.player.invulnTimer = 0.3;
      this.player.dashVx = Math.cos(aim) * 560;
      this.player.dashVy = Math.sin(aim) * 560;
      this.hitMonstersInCone(aim, 118, Math.PI * 0.9, Math.round(baseDmg * 1.45), 'physical', true, 30, 1.4);
      this.spawnParticles(this.player.x, this.player.y, '#fbbf24', 16, 140);
    } else if (key === 'R') {
      sound.playHit(true);
      this.camera.shake = 7;
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'earth_spikes',
        x: this.player.x + Math.cos(aim) * 45,
        y: this.player.y + Math.sin(aim) * 45,
        radius: 145,
        timer: 0,
        duration: 0.65,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 2.25),
        color: '#f59e0b',
        element: 'physical',
        fromPlayer: true,
      });
    }
  }

  private castArcherSkill(
    key: 'LMB' | 'Q' | 'E' | 'R',
    aim: number,
    tx: number,
    ty: number,
    baseDmg: number
  ) {
    if (key === 'LMB') {
      sound.playBow();
      this.spawnProjectile({
        fromPlayer: true,
        x: this.player.x + Math.cos(aim) * 18,
        y: this.player.y + Math.sin(aim) * 18,
        vx: Math.cos(aim) * 620,
        vy: Math.sin(aim) * 620,
        radius: 6,
        damage: baseDmg,
        life: 0.78,
        pierce: 1,
        element: 'physical',
        color: '#a7f3d0',
        kind: 'arrow',
      });
    } else if (key === 'Q') {
      sound.playBow();
      for (let i = -2; i <= 2; i++) {
        const ang = aim + i * 0.14;
        this.spawnProjectile({
          fromPlayer: true,
          x: this.player.x + Math.cos(ang) * 18,
          y: this.player.y + Math.sin(ang) * 18,
          vx: Math.cos(ang) * 580,
          vy: Math.sin(ang) * 580,
          radius: 6,
          damage: Math.round(baseDmg * 0.74),
          life: 0.72,
          pierce: 1,
          element: 'physical',
          color: '#34d399',
          kind: 'arrow',
        });
      }
    } else if (key === 'E') {
      sound.playBow();
      this.player.dashTimer = 0.18;
      this.player.invulnTimer = 0.25;
      this.player.dashVx = -Math.cos(aim) * 480;
      this.player.dashVy = -Math.sin(aim) * 480;
      this.spawnProjectile({
        fromPlayer: true,
        x: this.player.x + Math.cos(aim) * 18,
        y: this.player.y + Math.sin(aim) * 18,
        vx: Math.cos(aim) * 640,
        vy: Math.sin(aim) * 640,
        radius: 9,
        damage: Math.round(baseDmg * 1.25),
        life: 0.85,
        pierce: 2,
        element: 'water',
        color: '#38bdf8',
        kind: 'arrow',
        applySlow: 2.6,
      });
    } else if (key === 'R') {
      sound.playBow();
      const dist = Math.min(340, Math.hypot(tx - this.player.x, ty - this.player.y));
      const gx = this.player.x + Math.cos(aim) * dist;
      const gy = this.player.y + Math.sin(aim) * dist;
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'rain_arrows',
        x: gx,
        y: gy,
        radius: 135,
        timer: 0,
        duration: 2.4,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 0.62),
        color: '#34d399',
        element: 'physical',
        fromPlayer: true,
      });
    }
  }

  private castMageSkill(
    key: 'LMB' | 'Q' | 'E' | 'R',
    aim: number,
    tx: number,
    ty: number,
    baseDmg: number
  ) {
    const els = this.playerConfig.mageElements;
    const e1 = els[0] || 'fire';
    const e2 = els[1] || e1;
    const e3 = els[2] || e2;

    if (key === 'LMB') {
      const el = els[this.player.mageCycleIdx % els.length] || e1;
      this.player.mageCycleIdx += 1;
      this.fireMageElementBolt(el, aim, baseDmg);
    } else if (key === 'Q') {
      this.fireMageSignature(e1, aim, tx, ty, baseDmg);
    } else if (key === 'E') {
      if (els.length >= 2) {
        this.fireMageSignature(e2, aim, tx, ty, baseDmg);
      } else {
        // Mono-element secondary spread burst
        sound.playElement(e1);
        for (let i = -1; i <= 1; i++) {
          this.fireMageElementBolt(e1, aim + i * 0.16, Math.round(baseDmg * 0.78));
        }
      }
    } else if (key === 'R') {
      if (els.length === 2) {
        // Dual Resonance Ultimate: hits with both elements simultaneously
        this.fireMageSignature(e1, aim - 0.08, tx, ty, Math.round(baseDmg * 0.95));
        this.fireMageSignature(e2, aim + 0.08, tx, ty, Math.round(baseDmg * 0.95));
      } else if (els.length === 3) {
        this.fireMageSignature(e3, aim, tx, ty, Math.round(baseDmg * 1.3));
      } else {
        // Mono-element focused Cataclysm
        this.fireMageSignature(e1, aim, tx, ty, Math.round(baseDmg * 1.45));
      }
    }
  }

  private fireMageElementBolt(el: ElementType, aim: number, dmg: number) {
    sound.playElement(el);
    const meta = ELEMENT_META[el];
    this.spawnProjectile({
      fromPlayer: true,
      x: this.player.x + Math.cos(aim) * 20,
      y: this.player.y + Math.sin(aim) * 20,
      vx: Math.cos(aim) * (el === 'lightning' ? 760 : 520),
      vy: Math.sin(aim) * (el === 'lightning' ? 760 : 520),
      radius: el === 'earth' ? 11 : 8,
      damage: dmg,
      life: 0.85,
      pierce: el === 'wind' ? 3 : 1,
      element: el,
      color: meta.color,
      kind: el === 'earth' ? 'boulder' : el === 'wind' ? 'blade' : 'bolt',
      applySlow: el === 'water' ? 2.2 : undefined,
      applyBurn: el === 'fire' ? Math.round(dmg * 0.32) : undefined,
      applyStun: el === 'earth' ? 0.6 : undefined,
      aoeRadius: el === 'fire' ? 46 : undefined,
    });
  }

  private fireMageSignature(
    el: ElementType,
    aim: number,
    tx: number,
    ty: number,
    baseDmg: number
  ) {
    sound.playElement(el);
    const meta = ELEMENT_META[el];
    const dist = Math.min(310, Math.hypot(tx - this.player.x, ty - this.player.y));
    const gx = this.player.x + Math.cos(aim) * dist;
    const gy = this.player.y + Math.sin(aim) * dist;

    if (el === 'water') {
      this.spawnProjectile({
        fromPlayer: true,
        x: this.player.x + Math.cos(aim) * 22,
        y: this.player.y + Math.sin(aim) * 22,
        vx: Math.cos(aim) * 440,
        vy: Math.sin(aim) * 440,
        radius: 26,
        damage: Math.round(baseDmg * 1.45),
        life: 0.9,
        pierce: 6,
        element: 'water',
        color: meta.color,
        kind: 'wave',
        applySlow: 3.0,
      });
    } else if (el === 'fire') {
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'fire_nova',
        x: gx,
        y: gy,
        radius: 118,
        timer: 0,
        duration: 1.5,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 0.72),
        color: meta.color,
        element: 'fire',
        fromPlayer: true,
      });
    } else if (el === 'lightning') {
      // High-speed arc projectile + chain jump
      this.spawnProjectile({
        fromPlayer: true,
        x: this.player.x + Math.cos(aim) * 20,
        y: this.player.y + Math.sin(aim) * 20,
        vx: Math.cos(aim) * 820,
        vy: Math.sin(aim) * 820,
        radius: 12,
        damage: Math.round(baseDmg * 1.55),
        life: 0.7,
        pierce: 4,
        element: 'lightning',
        color: meta.color,
        kind: 'bolt',
        aoeRadius: 85,
      });
    } else if (el === 'wind') {
      this.player.windBuffTimer = 3.2;
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'cyclone',
        x: gx,
        y: gy,
        radius: 132,
        timer: 0,
        duration: 2.2,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 0.55),
        color: meta.color,
        element: 'wind',
        fromPlayer: true,
      });
    } else if (el === 'earth') {
      this.player.earthShieldTimer = 4.0;
      this.camera.shake = 5;
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'earth_spikes',
        x: gx,
        y: gy,
        radius: 115,
        timer: 0,
        duration: 0.7,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 1.65),
        color: meta.color,
        element: 'earth',
        fromPlayer: true,
      });
    }
  }

  private castNecromancerSkill(
    key: 'LMB' | 'Q' | 'E' | 'R',
    aim: number,
    tx: number,
    ty: number,
    baseDmg: number
  ) {
    if (key === 'LMB') {
      sound.playElement('necrotic');
      this.spawnProjectile({
        fromPlayer: true,
        x: this.player.x + Math.cos(aim) * 18,
        y: this.player.y + Math.sin(aim) * 18,
        vx: Math.cos(aim) * 530,
        vy: Math.sin(aim) * 530,
        radius: 9,
        damage: baseDmg,
        life: 0.85,
        pierce: 1,
        element: 'necrotic',
        color: '#c084fc',
        kind: 'bolt',
        applyMark: true,
      });
    } else if (key === 'Q') {
      sound.playElement('necrotic');
      const maxSum = this.getMaxSummons();
      const skeletons = this.summons.filter((s) => s.kind === 'skeleton');
      if (skeletons.length >= maxSum) {
        // Refresh oldest skeleton & heal all summons
        skeletons[0].lifeTimer = skeletons[0].maxLife;
        skeletons[0].hp = skeletons[0].maxHp;
        this.spawnParticles(skeletons[0].x, skeletons[0].y, '#c084fc', 14, 90);
      } else {
        const sx = this.player.x + Math.cos(aim) * 48;
        const sy = this.player.y + Math.sin(aim) * 48;
        this.summons.push({
          uid: this.nextUid('sum'),
          kind: 'skeleton',
          name: 'Skeleton Vanguard',
          x: sx,
          y: sy,
          vx: 0,
          vy: 0,
          hp: 150 + this.player.level * 28,
          maxHp: 150 + this.player.level * 28,
          damage: Math.round(baseDmg * 0.72),
          speed: 175,
          radius: 14,
          attackTimer: 0,
          lifeTimer: 34,
          maxLife: 34,
          facing: aim,
          hitFlashTimer: 0,
        });
        this.spawnParticles(sx, sy, '#c084fc', 16, 110);
      }
    } else if (key === 'E') {
      sound.playElement('necrotic');
      const dist = Math.min(280, Math.hypot(tx - this.player.x, ty - this.player.y));
      const gx = this.player.x + Math.cos(aim) * dist;
      const gy = this.player.y + Math.sin(aim) * dist;
      this.groundEffects.push({
        uid: this.nextUid('ge'),
        kind: 'fire_nova',
        x: gx,
        y: gy,
        radius: 120,
        timer: 0,
        duration: 1.4,
        tickTimer: 0,
        damagePerTick: Math.round(baseDmg * 0.75),
        color: '#a855f7',
        element: 'necrotic',
        fromPlayer: true,
      });
    } else if (key === 'R') {
      sound.playQuestComplete();
      this.summons = this.summons.filter((s) => s.kind !== 'dread_knight');
      const sx = this.player.x + Math.cos(aim) * 56;
      const sy = this.player.y + Math.sin(aim) * 56;
      this.summons.push({
        uid: this.nextUid('sum'),
        kind: 'dread_knight',
        name: 'Dread Knight',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        hp: 420 + this.player.level * 70,
        maxHp: 420 + this.player.level * 70,
        damage: Math.round(baseDmg * 1.45),
        speed: 185,
        radius: 21,
        attackTimer: 0,
        lifeTimer: 26,
        maxLife: 26,
        facing: aim,
        hitFlashTimer: 0,
      });
      this.spawnParticles(sx, sy, '#e879f9', 24, 150);
    }
  }

  private spawnProjectile(
    cfg: Omit<ProjectileInstance, 'uid' | 'maxLife' | 'hitIds'>
  ) {
    this.projectiles.push({
      ...cfg,
      uid: this.nextUid('prj'),
      maxLife: cfg.life,
      hitIds: new Set<string>(),
    });
  }

  private hitMonstersInCone(
    aim: number,
    range: number,
    coneWidth: number,
    dmg: number,
    element: ElementType | 'physical' | 'necrotic',
    isSkill: boolean,
    knockback = 18,
    stunSec = 0
  ) {
    for (const m of [...this.monsters]) {
      const dx = m.x - this.player.x;
      const dy = m.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + m.radius) continue;
      const ang = Math.atan2(dy, dx);
      const diff = Math.abs(Math.atan2(Math.sin(ang - aim), Math.cos(ang - aim)));
      if (diff <= coneWidth * 0.5 || dist < 34) {
        this.damageMonster(m, dmg, element, isSkill, knockback, aim);
        if (stunSec > 0 && !m.isDummy) m.stunTimer = Math.max(m.stunTimer, stunSec);
      }
    }
  }

  private damageMonster(
    m: MonsterInstance,
    rawDmg: number,
    element: ElementType | 'physical' | 'necrotic',
    isSkill: boolean,
    knockback = 12,
    hitAngle = 0
  ) {
    const stats = this.getDerivedStats();
    const isCrit = Math.random() < stats.critChance;
    let dmg = rawDmg * (isCrit ? 1.55 : 1.0);

    // Elemental Matchup & 2-Element Resonance
    const matchup = getElementalMatchupMultiplier(element, m.element);
    dmg *= matchup.mult;

    // Elemental Resonance Check for Mage (if target already has a different elemental status)
    let resonanceTriggered = false;
    if (this.playerConfig.classId === 'mage' && element !== 'physical' && element !== 'necrotic') {
      const hasOther =
        (element !== 'fire' && m.burnTimer > 0) ||
        (element !== 'water' && m.slowTimer > 0) ||
        (element !== 'earth' && m.stunTimer > 0);
      if (hasOther) {
        dmg *= 1.28;
        resonanceTriggered = true;
      }
    }

    if (m.markedTimer > 0) {
      dmg *= 1.15;
    }

    const finalDmg = Math.max(1, Math.round(dmg));
    m.hitFlashTimer = 0.12;
    m.squash = 1.24;

    if (!m.isDummy) {
      m.hp -= finalDmg;
      if (knockback > 0 && !m.isBoss) {
        m.x += Math.cos(hitAngle) * knockback;
        m.y += Math.sin(hitAngle) * knockback;
      }
    } else {
      // Training dummy tracking!
      if (this.quest.trainingStep === 0 && !isSkill) {
        this.quest.dummyBasicHits += 1;
        if (this.quest.dummyBasicHits >= 3) {
          this.quest.trainingStep = 1;
          this.pushNotification('Great strikes! Now cast a Class Skill [Q, E, or R] on the Training Dummy.', 'info');
        }
      } else if (this.quest.trainingStep === 1 && isSkill) {
        this.quest.dummySkillHits += 1;
        if (this.quest.dummySkillHits >= 2) {
          this.quest.trainingStep = 2;
          this.pushNotification('Well done! Speak with Merchant Lyra [F] to inspect 5-Silver gear.', 'info');
        }
      }
    }

    const color =
      resonanceTriggered
        ? '#f0abfc'
        : isCrit
        ? '#fde047'
        : element !== 'physical' && element !== 'necrotic'
        ? ELEMENT_META[element].color
        : '#f8fafc';

    const label = resonanceTriggered
      ? `${finalDmg}! Resonance`
      : matchup.label === 'Advantage'
      ? `${finalDmg}! Weak`
      : isCrit
      ? `${finalDmg}!`
      : `${finalDmg}`;

    this.spawnFloatingText(m.x, m.y - m.radius - 8, label, color, isCrit || resonanceTriggered ? 1.18 : 0.95);
    this.spawnParticles(m.x, m.y, color, isCrit ? 12 : 6, 95);

    if (isCrit || m.isBoss) {
      this.hitstopTimer = 0.032;
      this.camera.shake = Math.max(this.camera.shake, isCrit ? 3.5 : 2);
    }

    sound.playHit(isCrit);

    // Necromancer LMB soul leech
    if (this.playerConfig.classId === 'necromancer' && !isSkill && !m.isDummy) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
    }

    if (!m.isDummy && m.hp <= 0) {
      this.onMonsterKilled(m);
    }
  }

  private onMonsterKilled(m: MonsterInstance) {
    this.monsters = this.monsters.filter((x) => x.uid !== m.uid);
    this.kills += 1;
    if (m.isBoss) {
      this.bossKills += 1;
      if (m.archetypeId === 'moss_behemoth') this.quest.safeBossDefeated += 1;
      if (m.archetypeId === 'abyssal_wyvern') this.quest.elderBossDefeated += 1;
      this.hitstopTimer = 0.065;
      this.camera.shake = 10;
    }

    this.player.silver += m.silverReward;
    this.bonusScore += m.scoreReward;

    // Crafting material drop (48% chance on normal monsters, 100% on boss)
    if (m.dropMaterial && (m.isBoss || Math.random() < 0.48)) {
      const qty = m.isBoss ? 2 : 1;
      this.materials[m.dropMaterial] = (this.materials[m.dropMaterial] || 0) + qty;
      this.spawnFloatingText(
        m.x,
        m.y - 34,
        `+${qty} ${MATERIALS[m.dropMaterial].name}`,
        MATERIALS[m.dropMaterial].color,
        0.95
      );
    }

    // Check Eradication Quests
    for (const q of this.activeQuests) {
      if (q.status === 'active' && q.kind === 'eradication') {
        if (!q.targetIds || q.targetIds.includes(m.archetypeId)) {
          q.progress = Math.min(q.required, q.progress + 1);
          if (q.progress >= q.required) {
            q.status = 'ready_to_claim';
            sound.playQuestComplete();
            this.pushNotification(`Quest Ready to Claim: ${q.title}!`, 'reward');
          }
        }
      }
    }

    this.spawnParticles(m.x, m.y, m.accentColor, m.isBoss ? 36 : 16, m.isBoss ? 180 : 115);
    this.spawnFloatingText(m.x, m.y - 16, `+${m.expReward.toLocaleString()} EXP · +${m.silverReward} Silver`, '#fde047', 1.0);
    this.grantExp(m.expReward);
  }

  public grantExp(amount: number) {
    const currentZone = getZoneAt(this.player.x, this.player.y);
    const inSafeZone = currentZone === 'SAFE_VILLAGE' || currentZone === 'SAFE_JUNGLE';

    if (inSafeZone && this.player.level >= SAFE_ZONE_MAX_LEVEL) {
      if (!this.safeCapNotified) {
        this.safeCapNotified = true;
        this.pushNotification(
          'Safe Zone Max Level (Lv 7) reached! Cross the Elder Gate (Lv 5+) into the Elder Wilds to level further.',
          'info'
        );
      }
      return;
    }

    this.player.exp += amount;
    while (this.player.exp >= this.player.maxExp) {
      if (inSafeZone && this.player.level >= SAFE_ZONE_MAX_LEVEL) {
        this.player.exp = 0;
        break;
      }

      this.player.exp -= this.player.maxExp;
      this.player.level += 1;
      this.player.maxExp = getMaxExpForLevel(this.player.level);

      const classDef = CLASS_DEFINITIONS[this.playerConfig.classId];
      const mageTier = this.getMageTier();
      const growthMult = mageTier ? ELEMENTAL_BALANCE_PROFILES[mageTier].statGrowthMultiplier : 1.0;

      this.player.baseStrength += Math.round(classDef.strGrowth * growthMult);
      this.player.baseAgility += Math.round(classDef.agiGrowth * growthMult);

      this.recalcDerivedStats(true);
      sound.playLevelUp();
      this.spawnParticles(this.player.x, this.player.y, '#fbbf24', 28, 160);
      this.spawnFloatingText(this.player.x, this.player.y - 38, `LEVEL UP! Lv ${this.player.level}`, '#fbbf24', 1.35);

      if (this.player.level === ELDER_JUNGLE_MIN_LEVEL) {
        this.pushNotification(
          'Level 5 Reached! The Elder Wilds Jungle Gate is now unlocked to the far east!',
          'level'
        );
      } else {
        this.pushNotification(`Reached Level ${this.player.level}! Stats & Max HP increased.`, 'level');
      }

      if (inSafeZone && this.player.level >= SAFE_ZONE_MAX_LEVEL) {
        this.player.exp = 0;
        this.safeCapNotified = true;
        this.pushNotification(
          'Safe Zone Cap (Lv 7) reached! Enter the Elder Wilds Jungle to keep leveling.',
          'info'
        );
        break;
      }
    }

    // Check newly unlocked Rank Rewards
    const unclaimed = this.getUnclaimedRankRewards();
    if (unclaimed.length > 0) {
      const top = unclaimed[unclaimed.length - 1];
      this.pushNotification(
        `Hall of Valor Rank Reward Unlocked: ${top.item.name}! Open Ranking [L] to claim.`,
        'reward'
      );
    }
  }

  private updateSpawners(dt: number) {
    for (const sp of this.spawnPoints) {
      const aliveHere = this.monsters.filter(
        (m) => !m.isDummy && Math.hypot(m.homeX - sp.x, m.homeY - sp.y) < 160
      ).length;

      if (aliveHere < sp.maxAlive) {
        sp.respawnTimer -= dt;
        if (sp.respawnTimer <= 0) {
          sp.respawnTimer = sp.respawnDelay;
          this.spawnMonsterAtPoint(sp);
        }
      }
    }
  }

  private spawnMonsterAtPoint(sp: SpawnPoint) {
    const archId = sp.archetypeIds[Math.floor(Math.random() * sp.archetypeIds.length)];
    const arch = MONSTER_ARCHETYPES[archId];
    if (!arch) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = sp.isBossSpawn ? 0 : 30 + Math.random() * 70;
    const sx = sp.x + Math.cos(angle) * dist;
    const sy = sp.y + Math.sin(angle) * dist;

    this.groundEffects.push({
      uid: this.nextUid('ge'),
      kind: 'summon_rune',
      x: sx,
      y: sy,
      radius: arch.radius + 14,
      timer: 0,
      duration: 0.75,
      tickTimer: 0,
      damagePerTick: 0,
      color: arch.accentColor,
      fromPlayer: false,
    });

    this.monsters.push({
      uid: this.nextUid('mon'),
      archetypeId: arch.id,
      name: arch.name,
      level: arch.level,
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      hp: arch.maxHp,
      maxHp: arch.maxHp,
      damage: arch.damage,
      speed: arch.speed,
      radius: arch.radius,
      expReward: arch.expReward,
      silverReward: arch.silverReward,
      scoreReward: arch.scoreReward,
      isBoss: arch.isBoss,
      isDummy: false,
      zone: arch.zone,
      element: arch.element,
      color: arch.color,
      accentColor: arch.accentColor,
      homeX: sx,
      homeY: sy,
      attackTimer: 0.6,
      attackCooldown: arch.attackCooldown,
      attackRange: arch.attackRange,
      windupTimer: 0,
      windupDuration: 0,
      windupTargetX: sx,
      windupTargetY: sy,
      windupType: 'melee',
      hitFlashTimer: 0,
      slowTimer: 0,
      burnTimer: 0,
      burnDps: 0,
      stunTimer: 0,
      markedTimer: 0,
      spawnAnimTimer: 0.55,
      squash: 1,
      facing: Math.random() * Math.PI * 2,
      dropMaterial: arch.dropMaterial,
    });
  }

  private updateAmbientMonsters(dt: number) {
    for (const m of this.monsters) {
      if (m.isDummy) continue;
      m.spawnAnimTimer = Math.max(0, m.spawnAnimTimer - dt);
      const wanderX = m.homeX + Math.cos(this.worldTime * 0.7 + m.homeY) * 35;
      const wanderY = m.homeY + Math.sin(this.worldTime * 0.6 + m.homeX) * 35;
      m.x += (wanderX - m.x) * dt * 0.8;
      m.y += (wanderY - m.y) * dt * 0.8;
    }
  }

  private updateCollectiblesAndLandmarks(dt: number) {
    for (const col of this.collectibles) {
      if (!col.active) {
        col.respawnTimer -= dt;
        if (col.respawnTimer <= 0) col.active = true;
        continue;
      }

      if (Math.hypot(this.player.x - col.x, this.player.y - col.y) <= this.player.radius + 20) {
        col.active = false;
        col.respawnTimer = 18;
        sound.playCoin();
        this.spawnParticles(col.x, col.y, col.color, 14, 95);
        this.spawnFloatingText(col.x, col.y - 18, `Collected ${col.name}`, col.color, 0.98);

        // Also award crafting material or silver
        if (col.itemKey === 'sunleaf_herb') {
          this.materials.slime_gel += 1;
        } else if (col.itemKey === 'runic_fragment') {
          this.materials.runic_shard += 1;
        } else {
          this.materials.elder_scale += 1;
        }

        for (const q of this.activeQuests) {
          if (q.status === 'active' && q.kind === 'collection') {
            if (!q.targetIds || q.targetIds.includes(col.itemKey)) {
              q.progress = Math.min(q.required, q.progress + 1);
              if (q.progress >= q.required) {
                q.status = 'ready_to_claim';
                sound.playQuestComplete();
                this.pushNotification(`Collection Quest Ready: ${q.title}!`, 'reward');
              }
            }
          }
        }
      }
    }

    for (const lm of this.landmarks) {
      if (Math.hypot(this.player.x - lm.x, this.player.y - lm.y) <= lm.radius) {
        if (!lm.discovered) {
          lm.discovered = true;
          sound.playQuestComplete();
          this.spawnParticles(lm.x, lm.y, '#fde047', 22, 130);
          this.spawnFloatingText(lm.x, lm.y - 30, `Discovered: ${lm.name}!`, '#fde047', 1.15);
          this.pushNotification(`Landmark Surveyed: ${lm.name}`, 'reward');
        }

        for (const q of this.activeQuests) {
          if (q.status === 'active' && q.kind === 'exploration') {
            if (!q.targetIds || q.targetIds.includes(lm.id)) {
              const count = this.landmarks.filter(
                (x) => (!q.targetIds || q.targetIds.includes(x.id)) && x.discovered
              ).length;
              q.progress = Math.min(q.required, count);
              if (q.progress >= q.required) {
                q.status = 'ready_to_claim';
                sound.playQuestComplete();
                this.pushNotification(`Exploration Quest Ready: ${q.title}!`, 'reward');
              }
            }
          }
        }
      }
    }
  }

  private updateEscort(dt: number) {
    if (!this.escort) return;
    const e = this.escort;
    e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);

    const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);
    const distToDest = Math.hypot(e.destX - e.x, e.destY - e.y);

    if (distToDest <= 55) {
      const q = this.activeQuests.find((x) => x.uid === e.questUid);
      if (q) {
        q.progress = q.required;
        q.status = 'ready_to_claim';
        sound.playQuestComplete();
        this.pushNotification(`Escort Succeeded! ${e.name} reached ${e.destLabel}. Claim your reward!`, 'reward');
      }
      this.escort = null;
      return;
    }

    // Companion moves steadily toward destination while player stays within 260px
    if (distToPlayer < 260) {
      const ang = Math.atan2(e.destY - e.y, e.destX - e.x);
      e.facing = ang;
      e.x += Math.cos(ang) * e.speed * 0.55 * dt;
      e.y += Math.sin(ang) * e.speed * 0.55 * dt;
    }

    // Periodic ambush along route
    e.ambushTimer -= dt;
    if (e.ambushTimer <= 0) {
      e.ambushTimer = 11.5;
      const zone = getZoneAt(e.x, e.y);
      const archId =
        zone === 'OUTER_DANGER' || zone === 'ELDER_JUNGLE' ? 'outskirt_panther' : 'thorn_wolf';
      const arch = MONSTER_ARCHETYPES[archId];
      if (arch) {
        const ang = Math.random() * Math.PI * 2;
        const mx = e.x + Math.cos(ang) * 165;
        const my = e.y + Math.sin(ang) * 165;
        this.monsters.push({
          uid: this.nextUid('amb'),
          archetypeId: arch.id,
          name: `Ambush ${arch.name}`,
          level: arch.level,
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          hp: Math.round(arch.maxHp * 0.8),
          maxHp: Math.round(arch.maxHp * 0.8),
          damage: Math.round(arch.damage * 0.85),
          speed: arch.speed,
          radius: arch.radius,
          expReward: arch.expReward,
          silverReward: arch.silverReward,
          scoreReward: arch.scoreReward,
          isBoss: false,
          isDummy: false,
          zone,
          element: arch.element,
          color: arch.color,
          accentColor: arch.accentColor,
          homeX: mx,
          homeY: my,
          attackTimer: 0.8,
          attackCooldown: arch.attackCooldown,
          attackRange: arch.attackRange,
          windupTimer: 0,
          windupDuration: 0,
          windupTargetX: mx,
          windupTargetY: my,
          windupType: 'melee',
          hitFlashTimer: 0,
          slowTimer: 0,
          burnTimer: 0,
          burnDps: 0,
          stunTimer: 0,
          markedTimer: 0,
          spawnAnimTimer: 0.5,
          squash: 1,
          facing: 0,
          dropMaterial: arch.dropMaterial,
        });
        this.spawnFloatingText(e.x, e.y - 30, 'Ambush!', '#f87171', 1.05);
      }
    }

    if (e.hp <= 0) {
      const q = this.activeQuests.find((x) => x.uid === e.questUid);
      if (q) {
        this.activeQuests = this.activeQuests.filter((x) => x.uid !== q.uid);
        this.refreshAvailableQuests();
      }
      this.pushNotification(`Escort Failed: ${e.name} fell in combat. Re-accept contract to retry.`, 'danger');
      this.escort = null;
    }
  }

  private updateSummons(dt: number) {
    for (const s of [...this.summons]) {
      s.lifeTimer -= dt;
      s.attackTimer = Math.max(0, s.attackTimer - dt);
      s.hitFlashTimer = Math.max(0, s.hitFlashTimer - dt);
      if (s.lifeTimer <= 0 || s.hp <= 0) {
        this.summons = this.summons.filter((x) => x.uid !== s.uid);
        this.spawnParticles(s.x, s.y, '#a855f7', 10, 80);
        continue;
      }

      // Find nearest non-dummy monster (prioritize marked monsters!)
      let target: MonsterInstance | null = null;
      let bestScore = Infinity;
      for (const m of this.monsters) {
        if (m.isDummy) continue;
        const d = Math.hypot(m.x - s.x, m.y - s.y);
        if (d > 420) continue;
        const score = m.markedTimer > 0 ? d * 0.45 : d;
        if (score < bestScore) {
          bestScore = score;
          target = m;
        }
      }

      if (target) {
        const ang = Math.atan2(target.y - s.y, target.x - s.x);
        s.facing = ang;
        const dist = Math.hypot(target.x - s.x, target.y - s.y);
        if (dist > target.radius + s.radius + 14) {
          s.x += Math.cos(ang) * s.speed * dt;
          s.y += Math.sin(ang) * s.speed * dt;
        } else if (s.attackTimer <= 0) {
          s.attackTimer = s.kind === 'dread_knight' ? 0.85 : 1.05;
          this.damageMonster(target, s.damage, 'necrotic', true, 10, ang);
        }
      } else {
        // Orbit near player
        const followDist = Math.hypot(this.player.x - s.x, this.player.y - s.y);
        if (followDist > 70) {
          const ang = Math.atan2(this.player.y - s.y, this.player.x - s.x);
          s.facing = ang;
          s.x += Math.cos(ang) * s.speed * dt;
          s.y += Math.sin(ang) * s.speed * dt;
        }
      }
    }
  }

  private updateGroundEffects(dt: number) {
    for (const ge of [...this.groundEffects]) {
      ge.timer += dt;
      ge.tickTimer -= dt;
      if (ge.timer >= ge.duration) {
        this.groundEffects = this.groundEffects.filter((x) => x.uid !== ge.uid);
        continue;
      }

      if (ge.kind === 'whirlwind') {
        ge.x = this.player.x;
        ge.y = this.player.y;
      }

      if (ge.fromPlayer && ge.tickTimer <= 0 && ge.damagePerTick > 0) {
        ge.tickTimer = ge.kind === 'earth_spikes' ? 0.8 : 0.35;
        for (const m of [...this.monsters]) {
          const d = Math.hypot(m.x - ge.x, m.y - ge.y);
          if (d <= ge.radius + m.radius) {
            if (ge.kind === 'cyclone' && !m.isDummy && !m.isBoss) {
              // Pull enemies toward vortex center
              const pullAng = Math.atan2(ge.y - m.y, ge.x - m.x);
              m.x += Math.cos(pullAng) * 26;
              m.y += Math.sin(pullAng) * 26;
            }
            if (ge.kind === 'earth_spikes' && !m.isDummy) {
              m.stunTimer = Math.max(m.stunTimer, 1.1);
            }
            if (ge.element === 'fire' && !m.isDummy) {
              m.burnTimer = 2.6;
              m.burnDps = Math.max(m.burnDps, Math.round(ge.damagePerTick * 0.45));
            }
            this.damageMonster(m, ge.damagePerTick, ge.element || 'physical', true, 6, 0);
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (const p of [...this.projectiles]) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life <= 0 || p.x < 0 || p.x > WORLD_WIDTH || p.y < 0 || p.y > WORLD_HEIGHT) {
        this.projectiles = this.projectiles.filter((x) => x.uid !== p.uid);
        continue;
      }

      if (p.fromPlayer) {
        for (const m of [...this.monsters]) {
          if (p.hitIds.has(m.uid)) continue;
          if (Math.hypot(m.x - p.x, m.y - p.y) <= m.radius + p.radius) {
            p.hitIds.add(m.uid);
            const ang = Math.atan2(p.vy, p.vx);
            if (!m.isDummy) {
              if (p.applySlow) m.slowTimer = Math.max(m.slowTimer, p.applySlow);
              if (p.applyBurn) {
                m.burnTimer = 2.8;
                m.burnDps = Math.max(m.burnDps, p.applyBurn);
              }
              if (p.applyStun) m.stunTimer = Math.max(m.stunTimer, p.applyStun);
              if (p.applyMark) m.markedTimer = 4.5;
            }
            this.damageMonster(m, p.damage, p.element, p.kind !== 'arrow' && p.kind !== 'bolt', 14, ang);

            if (p.aoeRadius && p.aoeRadius > 0) {
              for (const near of [...this.monsters]) {
                if (near.uid !== m.uid && !near.isDummy && Math.hypot(near.x - m.x, near.y - m.y) <= p.aoeRadius) {
                  this.damageMonster(near, Math.round(p.damage * 0.65), p.element, true, 6, ang);
                }
              }
            }

            p.pierce -= 1;
            if (p.pierce <= 0) {
              this.projectiles = this.projectiles.filter((x) => x.uid !== p.uid);
              break;
            }
          }
        }
      } else {
        // Enemy projectile hitting player or escort
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) <= this.player.radius + p.radius) {
          this.damagePlayer(p.damage, p.element);
          this.projectiles = this.projectiles.filter((x) => x.uid !== p.uid);
        } else if (
          this.escort &&
          Math.hypot(this.escort.x - p.x, this.escort.y - p.y) <= this.escort.radius + p.radius
        ) {
          this.escort.hp -= Math.round(p.damage * 0.7);
          this.escort.hitFlashTimer = 0.14;
          this.projectiles = this.projectiles.filter((x) => x.uid !== p.uid);
        }
      }
    }
  }

  private updateMonsters(dt: number, playerDefense: number) {
    for (const m of [...this.monsters]) {
      m.spawnAnimTimer = Math.max(0, m.spawnAnimTimer - dt);
      m.hitFlashTimer = Math.max(0, m.hitFlashTimer - dt);
      m.slowTimer = Math.max(0, m.slowTimer - dt);
      m.stunTimer = Math.max(0, m.stunTimer - dt);
      m.markedTimer = Math.max(0, m.markedTimer - dt);
      m.squash += (1 - m.squash) * Math.min(1, dt * 12);

      if (m.isDummy) continue;

      if (m.burnTimer > 0) {
        m.burnTimer -= dt;
        const prevFloor = Math.floor((m.burnTimer + dt) * 2);
        const curFloor = Math.floor(m.burnTimer * 2);
        if (curFloor < prevFloor && m.burnDps > 0) {
          m.hp -= m.burnDps;
          this.spawnFloatingText(m.x, m.y - m.radius, `${m.burnDps}`, '#fb923c', 0.82);
          if (m.hp <= 0) {
            this.onMonsterKilled(m);
            continue;
          }
        }
      }

      if (m.stunTimer > 0) continue;

      // Active windup telegraph
      if (m.windupTimer > 0) {
        m.windupTimer -= dt;
        if (m.windupTimer <= 0) {
          this.executeMonsterAttack(m, playerDefense);
        }
        continue;
      }

      m.attackTimer = Math.max(0, m.attackTimer - dt);

      // Select target: player or escort or summon
      const playerZone = getZoneAt(this.player.x, this.player.y);
      const inCamp =
        Math.hypot(this.player.x - JUNGLE_CAMP_POS.x, this.player.y - JUNGLE_CAMP_POS.y) <
        JUNGLE_CAMP_POS.radius;
      const canTargetPlayer = playerZone !== 'SAFE_VILLAGE' && !inCamp;

      let targetX = m.homeX;
      let targetY = m.homeY;
      let targetKind: 'player' | 'escort' | 'summon' | 'home' = 'home';

      const distToPlayer = Math.hypot(this.player.x - m.x, this.player.y - m.y);
      if (canTargetPlayer && distToPlayer <= (m.isBoss ? 440 : 340)) {
        targetX = this.player.x;
        targetY = this.player.y;
        targetKind = 'player';
      } else if (this.escort && Math.hypot(this.escort.x - m.x, this.escort.y - m.y) <= 280) {
        targetX = this.escort.x;
        targetY = this.escort.y;
        targetKind = 'escort';
      } else {
        // Check nearest summon
        for (const s of this.summons) {
          if (Math.hypot(s.x - m.x, s.y - m.y) <= 240) {
            targetX = s.x;
            targetY = s.y;
            targetKind = 'summon';
            break;
          }
        }
      }

      const distToTarget = Math.hypot(targetX - m.x, targetY - m.y);
      const spd = m.speed * (m.slowTimer > 0 ? 0.55 : 1.0);

      if (targetKind === 'home') {
        if (distToTarget > 12) {
          const ang = Math.atan2(targetY - m.y, targetX - m.x);
          m.facing = ang;
          m.x += Math.cos(ang) * spd * 0.7 * dt;
          m.y += Math.sin(ang) * spd * 0.7 * dt;
        }
        continue;
      }

      const ang = Math.atan2(targetY - m.y, targetX - m.x);
      m.facing = ang;

      if (distToTarget > m.attackRange) {
        const nextX = m.x + Math.cos(ang) * spd * dt;
        // Never allow Safe Jungle monsters to step inside Havenbrook Village or Jungle Camp
        if (nextX > VILLAGE_BOUNDS.maxX + 22) {
          m.x = nextX;
        }
        m.y += Math.sin(ang) * spd * dt;
      } else if (m.attackTimer <= 0) {
        m.attackTimer = m.attackCooldown;
        m.windupDuration = m.isBoss ? 0.75 : 0.35;
        m.windupTimer = m.windupDuration;
        m.windupTargetX = targetX;
        m.windupTargetY = targetY;
        m.windupType = m.isBoss ? 'slam' : m.attackRange > 100 ? 'bolt' : 'melee';
        if (m.isBoss) {
          this.groundEffects.push({
            uid: this.nextUid('ge'),
            kind: 'boss_telegraph',
            x: targetX,
            y: targetY,
            radius: 105,
            timer: 0,
            duration: m.windupDuration,
            tickTimer: 99,
            damagePerTick: 0,
            color: '#ef4444',
            fromPlayer: false,
          });
        }
      }
    }
  }

  private executeMonsterAttack(m: MonsterInstance, _playerDefense: number) {
    if (m.windupType === 'bolt') {
      const ang = Math.atan2(m.windupTargetY - m.y, m.windupTargetX - m.x);
      this.spawnProjectile({
        fromPlayer: false,
        x: m.x + Math.cos(ang) * m.radius,
        y: m.y + Math.sin(ang) * m.radius,
        vx: Math.cos(ang) * 320,
        vy: Math.sin(ang) * 320,
        radius: 8,
        damage: m.damage,
        life: 1.3,
        pierce: 1,
        element: m.element,
        color: m.accentColor,
        kind: 'enemy_orb',
      });
      return;
    }

    if (m.windupType === 'slam') {
      this.camera.shake = Math.max(this.camera.shake, 7);
      this.spawnParticles(m.windupTargetX, m.windupTargetY, '#ef4444', 22, 150);
      if (Math.hypot(this.player.x - m.windupTargetX, this.player.y - m.windupTargetY) <= 108) {
        this.damagePlayer(Math.round(m.damage * 1.2), m.element);
      }
      return;
    }

    // Melee strike
    if (Math.hypot(this.player.x - m.x, this.player.y - m.y) <= m.attackRange + this.player.radius + 16) {
      this.damagePlayer(m.damage, m.element);
    } else if (
      this.escort &&
      Math.hypot(this.escort.x - m.x, this.escort.y - m.y) <= m.attackRange + this.escort.radius + 16
    ) {
      this.escort.hp -= Math.round(m.damage * 0.65);
      this.escort.hitFlashTimer = 0.14;
    } else {
      for (const s of this.summons) {
        if (Math.hypot(s.x - m.x, s.y - m.y) <= m.attackRange + s.radius + 16) {
          s.hp -= m.damage;
          s.hitFlashTimer = 0.14;
          break;
        }
      }
    }
  }

  private damagePlayer(rawDmg: number, _element: string) {
    if (this.player.invulnTimer > 0) return;

    const derived = this.getDerivedStats();
    const zone = getZoneAt(this.player.x, this.player.y);
    // Explicit under-level danger outside Safe Zone (< Lv 5)
    const dangerMult =
      (zone === 'OUTER_DANGER' || zone === 'ELDER_JUNGLE') &&
      this.player.level < ELDER_JUNGLE_MIN_LEVEL
        ? 1.75
        : 1.0;

    const mitigated = Math.max(4, Math.round(rawDmg * dangerMult - derived.defense * 0.45));
    this.player.hp = Math.max(0, this.player.hp - mitigated);
    this.player.hitFlashTimer = 0.16;
    this.player.squash = 0.85;
    this.camera.shake = Math.max(this.camera.shake, 4.5);

    this.spawnFloatingText(this.player.x, this.player.y - 26, `-${mitigated}`, '#f87171', 1.0);

    if (this.player.hp <= 0) {
      this.screen = 'DEFEATED';
      sound.playDangerAlert();
      this.emitSnapshot();
    }
  }

  private updateParticlesAndTexts(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.35 + Math.random() * 0.75) * speed;
      const life = 0.25 + Math.random() * 0.35;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 2.5 + Math.random() * 3.5,
        life,
        maxLife: life,
        color,
        alpha: 1,
      });
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, scale = 1) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 14,
      y,
      vy: -38,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
      scale,
    });
  }

  public pushNotification(text: string, tone: 'info' | 'reward' | 'danger' | 'level') {
    this.notifications.unshift({ id: this.nextUid('not'), text, tone });
    if (this.notifications.length > 4) this.notifications.length = 4;
  }

  public getNearbyNpc(): NpcEntity | null {
    let best: NpcEntity | null = null;
    let bestD = 88;
    for (const npc of VILLAGE_NPCS) {
      const d = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      if (d < bestD) {
        bestD = d;
        best = npc;
      }
    }
    return best;
  }

  public getSnapshot(): HudSnapshot {
    const classDef = CLASS_DEFINITIONS[this.playerConfig.classId];
    const derived = this.getDerivedStats();
    const zone = getZoneAt(this.player.x, this.player.y);
    const { rankings, playerRank } = this.getRankings();

    // Find nearby boss
    let activeBoss: HudSnapshot['activeBoss'] = null;
    for (const m of this.monsters) {
      if (m.isBoss && Math.hypot(m.x - this.player.x, m.y - this.player.y) < 520) {
        activeBoss = { name: m.name, level: m.level, hp: Math.max(0, Math.round(m.hp)), maxHp: m.maxHp };
        break;
      }
    }

    return {
      screen: this.screen,
      playerName: this.playerConfig.name,
      classId: this.playerConfig.classId,
      className: classDef.name,
      rarity: classDef.rarity,
      mageElements: [...this.playerConfig.mageElements],
      mageTier: this.getMageTier(),
      level: this.player.level,
      exp: Math.round(this.player.exp),
      maxExp: this.player.maxExp,
      hp: Math.max(0, Math.round(this.player.hp)),
      maxHp: this.player.maxHp,
      mp: Math.max(0, Math.round(this.player.mp)),
      maxMp: this.player.maxMp,
      silver: this.player.silver,
      baseStrength: this.player.baseStrength,
      baseAgility: this.player.baseAgility,
      totalStrength: derived.totalStrength,
      totalAgility: derived.totalAgility,
      defense: derived.defense,
      powerRating: derived.powerRating,
      zone,
      zoneLabel: getZoneLabel(zone),
      dangerWarning:
        (zone === 'OUTER_DANGER' || zone === 'ELDER_JUNGLE') &&
        this.player.level < ELDER_JUNGLE_MIN_LEVEL,
      safeCapReached:
        (zone === 'SAFE_VILLAGE' || zone === 'SAFE_JUNGLE') &&
        this.player.level >= SAFE_ZONE_MAX_LEVEL,
      elderGateUnlocked: this.player.level >= ELDER_JUNGLE_MIN_LEVEL,
      quest: { ...this.quest },
      activeQuests: this.activeQuests.map((q) => ({ ...q })),
      availableQuests: this.availableQuests.map((q) => ({ ...q })),
      completedQuestCount: this.completedQuestCount,
      escort: this.escort ? { ...this.escort } : null,
      materials: { ...this.materials },
      skills: this.getSkillInfos(),
      potionsCount: this.player.potionsCount,
      equipped: { ...this.equipped },
      inventory: [...this.inventory],
      combatScore: this.getCombatScore(),
      playerRank,
      rankings,
      claimedRankRewards: [...this.claimedRankRewards],
      unclaimedRankRewards: this.getUnclaimedRankRewards(),
      nearbyNpc: this.getNearbyNpc(),
      activeBoss,
      summonCount: this.summons.length,
      maxSummons: this.getMaxSummons(),
      kills: this.kills,
      bossKills: this.bossKills,
      notifications: [...this.notifications],
      playerPos: { x: this.player.x, y: this.player.y },
      worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      minimapMonsters: this.monsters
        .filter((m) => !m.isDummy)
        .map((m) => ({ x: m.x, y: m.y, isBoss: m.isBoss, zone: m.zone })),
      muted: sound.muted,
    };
  }

  public emitSnapshot() {
    if (this.snapshotCallback) {
      this.snapshotCallback(this.getSnapshot());
    }
  }
}
