import {
  CLASS_DEFINITIONS,
  ELDER_JUNGLE_MIN_LEVEL,
  ELEMENT_META,
  JUNGLE_CAMP_POS,
  OUTER_DANGER_MAX_X,
  SAFE_JUNGLE_BOUNDS,
  VILLAGE_BOUNDS,
  VILLAGE_NPCS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './data';
import { GameEngine } from './engine';
import { MonsterInstance, NpcEntity } from './types';

interface TreeProp {
  x: number;
  y: number;
  r: number;
  hue: string;
  shade: string;
}

const DECOR_TREES: TreeProp[] = (() => {
  const list: TreeProp[] = [];
  // Deterministic decorative forest trees avoiding paths and buildings
  for (let i = 0; i < 165; i++) {
    const seed1 = Math.sin(i * 12.9898) * 43758.5453;
    const seed2 = Math.sin(i * 78.233) * 43758.5453;
    const rx = seed1 - Math.floor(seed1);
    const ry = seed2 - Math.floor(seed2);
    const x = 140 + rx * (WORLD_WIDTH - 240);
    const y = 140 + ry * (WORLD_HEIGHT - 240);

    // Keep out of main village plaza and roads
    if (
      x > VILLAGE_BOUNDS.minX + 60 &&
      x < VILLAGE_BOUNDS.maxX - 40 &&
      y > VILLAGE_BOUNDS.minY + 120 &&
      y < VILLAGE_BOUNDS.maxY - 120
    ) {
      continue;
    }
    // Keep main horizontal road & camp clear
    if (Math.abs(y - 1200) < 120) continue;
    if (Math.hypot(x - JUNGLE_CAMP_POS.x, y - JUNGLE_CAMP_POS.y) < 165) continue;
    if (Math.hypot(x - 1920, y - 1200) < 150) continue;
    if (Math.hypot(x - 3120, y - 1200) < 160) continue;

    const isOuter = x > SAFE_JUNGLE_BOUNDS.maxX;
    list.push({
      x,
      y,
      r: 26 + (i % 4) * 7,
      hue: isOuter ? '#2c1e3d' : '#1b4332',
      shade: isOuter ? '#191026' : '#0f291e',
    });
  }
  return list;
})();

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const shakeX =
    engine.camera.shake > 0 ? (Math.random() - 0.5) * engine.camera.shake * 2 : 0;
  const shakeY =
    engine.camera.shake > 0 ? (Math.random() - 0.5) * engine.camera.shake * 2 : 0;

  const camLeft = engine.camera.x - width / 2 + shakeX;
  const camTop = engine.camera.y - height / 2 + shakeY;

  ctx.translate(-camLeft, -camTop);

  // 1. Biome Ground Regions
  drawWorldTerrain(ctx, engine, camLeft, camTop, width, height);

  // 2. Village Structures & Zone Boundaries
  drawVillageAndLandmarks(ctx, engine);

  // 3. Collectibles (Herbs & Relics)
  drawCollectibles(ctx, engine);

  // 4. Ground Effects (Telegraphs, Summon Runes, Storms)
  drawGroundEffects(ctx, engine);

  // 5. NPCs & Escort Companion
  for (const npc of VILLAGE_NPCS) {
    drawNpc(ctx, npc, engine.worldTime, engine.player.level);
  }
  if (engine.escort) {
    drawEscort(ctx, engine);
  }

  // 6. Summons & Monsters & Player (Y-sorted for clean depth)
  const drawables: Array<{ y: number; fn: () => void }> = [];
  for (const m of engine.monsters) {
    drawables.push({
      y: m.y,
      fn: () => drawMonster(ctx, m, engine.worldTime),
    });
  }
  for (const s of engine.summons) {
    drawables.push({
      y: s.y,
      fn: () => drawSummon(ctx, s, engine.worldTime),
    });
  }
  if (engine.screen !== 'TITLE') {
    drawables.push({
      y: engine.player.y,
      fn: () => drawPlayer(ctx, engine),
    });
  }
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.fn();

  // 7. Projectiles
  drawProjectiles(ctx, engine);

  // 8. Decorative Forest Trees (semi-transparent canopy when player walks near)
  for (const tree of DECOR_TREES) {
    if (
      tree.x < camLeft - 80 ||
      tree.x > camLeft + width + 80 ||
      tree.y < camTop - 80 ||
      tree.y > camTop + height + 80
    ) {
      continue;
    }
    const nearPlayer = Math.hypot(tree.x - engine.player.x, tree.y - engine.player.y) < tree.r + 32;
    drawTree(ctx, tree, nearPlayer, engine.worldTime);
  }

  // 9. Particles & Floating Combat Text
  for (const p of engine.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const ft of engine.floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(13 * ft.scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(10, 14, 12, 0.85)';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawWorldTerrain(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  camLeft: number,
  camTop: number,
  width: number,
  height: number
) {
  // Base Jungle Floor
  ctx.fillStyle = '#132018';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Outer Danger & Elder Wilds Biome Tint
  const outerGrad = ctx.createLinearGradient(SAFE_JUNGLE_BOUNDS.maxX - 80, 0, WORLD_WIDTH, 0);
  outerGrad.addColorStop(0, '#132018');
  outerGrad.addColorStop(0.18, '#1e1627');
  outerGrad.addColorStop(1, '#160f1e');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(SAFE_JUNGLE_BOUNDS.maxX - 80, 0, WORLD_WIDTH - SAFE_JUNGLE_BOUNDS.maxX + 80, WORLD_HEIGHT);

  // Safe Village Courtyard Ground
  ctx.fillStyle = '#25211a';
  ctx.beginPath();
  ctx.roundRect(
    VILLAGE_BOUNDS.minX,
    VILLAGE_BOUNDS.minY,
    VILLAGE_BOUNDS.maxX - VILLAGE_BOUNDS.minX,
    VILLAGE_BOUNDS.maxY - VILLAGE_BOUNDS.minY,
    24
  );
  ctx.fill();

  // Cobblestone tile accents in village
  ctx.strokeStyle = 'rgba(214, 195, 160, 0.06)';
  ctx.lineWidth = 1;
  const startTileX = Math.max(VILLAGE_BOUNDS.minX, Math.floor(camLeft / 64) * 64);
  const endTileX = Math.min(VILLAGE_BOUNDS.maxX, camLeft + width + 64);
  const startTileY = Math.max(VILLAGE_BOUNDS.minY, Math.floor(camTop / 64) * 64);
  const endTileY = Math.min(VILLAGE_BOUNDS.maxY, camTop + height + 64);
  for (let tx = startTileX; tx < endTileX; tx += 64) {
    for (let ty = startTileY; ty < endTileY; ty += 64) {
      ctx.strokeRect(tx + 4, ty + 4, 56, 56);
    }
  }

  // Main Frontier Dirt Road leading East through Safe Jungle -> Elder Gate -> Boss
  ctx.fillStyle = '#2f2920';
  ctx.fillRect(VILLAGE_BOUNDS.minX + 60, 1152, 2980, 96);
  ctx.fillStyle = '#262119';
  ctx.fillRect(420, 940, 68, 460);

  // Ranger Kael Safe Campfire Clearing inside Safe Jungle
  ctx.fillStyle = '#2a281d';
  ctx.beginPath();
  ctx.arc(JUNGLE_CAMP_POS.x, JUNGLE_CAMP_POS.y, JUNGLE_CAMP_POS.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Campfire glow
  const firePulse = 18 + Math.sin(engine.worldTime * 8) * 3;
  const campGlow = ctx.createRadialGradient(
    JUNGLE_CAMP_POS.x - 42,
    JUNGLE_CAMP_POS.y + 12,
    2,
    JUNGLE_CAMP_POS.x - 42,
    JUNGLE_CAMP_POS.y + 12,
    firePulse * 2.8
  );
  campGlow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
  campGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = campGlow;
  ctx.beginPath();
  ctx.arc(JUNGLE_CAMP_POS.x - 42, JUNGLE_CAMP_POS.y + 12, firePulse * 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(JUNGLE_CAMP_POS.x - 42, JUNGLE_CAMP_POS.y + 12, 8, 0, Math.PI * 2);
  ctx.fill();

  // Subtle dappled moss patches across jungle
  for (let i = 0; i < 42; i++) {
    const px = 1040 + ((i * 239) % 2100);
    const py = 240 + ((i * 419) % 1920);
    if (px > camLeft + width + 100 || px < camLeft - 100) continue;
    ctx.fillStyle = px > SAFE_JUNGLE_BOUNDS.maxX ? 'rgba(139, 92, 246, 0.07)' : 'rgba(34, 197, 94, 0.06)';
    ctx.beginPath();
    ctx.arc(px, py, 44 + (i % 3) * 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVillageAndLandmarks(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  // Village Stone Wall Perimeter & Sanctuary Ward Line (x = 980)
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(VILLAGE_BOUNDS.maxX, VILLAGE_BOUNDS.minY);
  ctx.lineTo(VILLAGE_BOUNDS.maxX, VILLAGE_BOUNDS.maxY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Training Yard Ring
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(690, 1120, 125, 145, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Merchant Lyra Canopy Stall
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.roundRect(365, 868, 110, 44, 6);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(365, 882, 110, 10);
  ctx.fillStyle = '#d6d3d1';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOCAL MERCHANT · 5 SILVER+', 420, 860);

  // Sanctuary Fountain
  const r1 = 36 + Math.sin(engine.worldTime * 3) * 4;
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(260, 1180, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(260, 1180, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(260, 1180, r1 * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Safe Zone Outer Boundary at x = 2180 (Danger below Lv 5!)
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)';
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(SAFE_JUNGLE_BOUNDS.maxX, 140);
  ctx.lineTo(SAFE_JUNGLE_BOUNDS.maxX, WORLD_HEIGHT - 140);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fca5a5';
  ctx.font = '700 12px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAFE ZONE BOUNDARY · DANGER BELOW LV 5', SAFE_JUNGLE_BOUNDS.maxX, 1125);

  // Elder Wilds Gate at x = 2580 (Locked until Lv 5)
  const unlocked = engine.player.level >= ELDER_JUNGLE_MIN_LEVEL;
  ctx.strokeStyle = unlocked ? '#34d399' : '#ef4444';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(OUTER_DANGER_MAX_X, 140);
  ctx.lineTo(OUTER_DANGER_MAX_X, WORLD_HEIGHT - 140);
  ctx.stroke();

  // Gate Pillars at road
  ctx.fillStyle = '#334155';
  ctx.fillRect(OUTER_DANGER_MAX_X - 18, 1105, 36, 42);
  ctx.fillRect(OUTER_DANGER_MAX_X - 18, 1255, 36, 42);
  ctx.fillStyle = unlocked ? '#34d399' : '#f87171';
  ctx.font = '700 13px "Cinzel", serif';
  ctx.fillText(
    unlocked ? 'ELDER WILDS GATE (OPEN)' : 'ELDER WILDS GATE (LV 5+ REQUIRED)',
    OUTER_DANGER_MAX_X,
    1090
  );

  // Exploration Landmarks
  for (const lm of engine.landmarks) {
    ctx.save();
    ctx.strokeStyle = lm.discovered ? 'rgba(250, 204, 21, 0.65)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lm.x, lm.y, lm.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = lm.discovered ? '#fde047' : '#7dd3fc';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lm.discovered ? `${lm.name} (Surveyed)` : `${lm.name}`, lm.x, lm.y - lm.radius * 0.72);
    ctx.restore();
  }

  // Escort Destination Marker if active
  if (engine.escort) {
    const pulse = 36 + Math.sin(engine.worldTime * 5) * 6;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(engine.escort.destX, engine.escort.destY, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ESCORT TARGET: ${engine.escort.destLabel}`, engine.escort.destX, engine.escort.destY - 46);
  }
}

function drawCollectibles(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const col of engine.collectibles) {
    if (!col.active) continue;
    const bob = Math.sin(engine.worldTime * 4 + col.x) * 3;
    ctx.save();
    ctx.fillStyle = col.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(col.x, col.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    if (col.kind === 'herb') {
      ctx.arc(col.x, col.y + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ecfccb';
      ctx.beginPath();
      ctx.arc(col.x - 3, col.y + bob - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(col.x, col.y + bob - 10);
      ctx.lineTo(col.x + 8, col.y + bob);
      ctx.lineTo(col.x, col.y + bob + 10);
      ctx.lineTo(col.x - 8, col.y + bob);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.name, col.x, col.y - 16);
    ctx.restore();
  }
}

function drawGroundEffects(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const ge of engine.groundEffects) {
    const p = ge.timer / ge.duration;
    ctx.save();
    if (ge.kind === 'boss_telegraph') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
      ctx.beginPath();
      ctx.arc(ge.x, ge.y, ge.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ge.x, ge.y, ge.radius * p, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ge.kind === 'summon_rune') {
      ctx.strokeStyle = ge.color;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ge.x, ge.y, ge.radius * (0.5 + p * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    } else if (ge.kind === 'whirlwind' || ge.kind === 'cyclone') {
      ctx.strokeStyle = ge.color;
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 3;
      const rot = engine.worldTime * 11;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(ge.x, ge.y, ge.radius * (0.45 + i * 0.24), rot + i, rot + i + Math.PI * 1.3);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = ge.color;
      ctx.globalAlpha = 0.22 * (1 - p * 0.4);
      ctx.beginPath();
      ctx.arc(ge.x, ge.y, ge.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8 * (1 - p);
      ctx.strokeStyle = ge.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawNpc(ctx: CanvasRenderingContext2D, npc: NpcEntity, time: number, playerLv: number) {
  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 14, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const colorMap: Record<NpcEntity['role'], string> = {
    trainer: '#f59e0b',
    merchant: '#10b981',
    ranking: '#eab308',
    healer: '#38bdf8',
    gatekeeper: playerLv >= ELDER_JUNGLE_MIN_LEVEL ? '#34d399' : '#ef4444',
    quest_village: '#60a5fa',
    quest_jungle: '#4ade80',
  };

  if (npc.role === 'ranking') {
    // Stone Obelisk
    ctx.fillStyle = '#475569';
    ctx.fillRect(npc.x - 14, npc.y - 26, 28, 42);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - 16, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (npc.role !== 'healer') {
    ctx.fillStyle = colorMap[npc.role];
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Quest Exclamation indicator above quest NPCs
  if (npc.role === 'quest_village' || npc.role === 'quest_jungle' || npc.role === 'trainer') {
    const bob = Math.sin(time * 4.5) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 15px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', npc.x, npc.y - 24 + bob);
  }

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, npc.x, npc.y + 30);
  ctx.restore();
}

function drawEscort(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const e = engine.escort!;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + 13, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = e.hitFlashTimer > 0 ? '#ffffff' : '#fcd34d';
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Overhead HP bar
  const bw = 46;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(e.x - bw / 2, e.y - 28, bw, 6);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(e.x - bw / 2 + 1, e.y - 27, (bw - 2) * Math.max(0, e.hp / e.maxHp), 4);

  ctx.fillStyle = '#fef08a';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(e.name, e.x, e.y - 34);
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const p = engine.player;
  const cid = engine.playerConfig.classId;
  const classDef = CLASS_DEFINITIONS[cid];
  const { playerRank } = engine.getRankings();

  ctx.save();
  ctx.translate(p.x, p.y);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top Rank Golden Aura if Top 3
  if (playerRank <= 3) {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + Math.sin(engine.worldTime * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Earth Shield aura
  if (p.earthShieldTimer > 0) {
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.scale(p.squash, 2 - p.squash);

  // Body / Cloak
  ctx.fillStyle = p.hitFlashTimer > 0 ? '#ffffff' : classDef.accentHex;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Class Weapon / Sight Orientation
  ctx.save();
  ctx.rotate(p.facing + (p.swingAnimTimer > 0 ? (0.11 - p.swingAnimTimer) * 9 : 0));
  if (cid === 'warrior') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(14, -3, 24, 6);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(12, -8, 4, 16);
  } else if (cid === 'archer') {
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(10, 0, 14, -1.1, 1.1);
    ctx.stroke();
  } else if (cid === 'mage') {
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(26, 2);
    ctx.stroke();
    const firstEl = engine.playerConfig.mageElements[0] || 'fire';
    ctx.fillStyle = ELEMENT_META[firstEl].color;
    ctx.beginPath();
    ctx.arc(28, 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Necromancer Bone Scythe
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(27, 2);
    ctx.stroke();
    ctx.strokeStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(26, 8, 9, -Math.PI * 0.7, 0.2);
    ctx.stroke();
  }
  ctx.restore();

  // Mage orbiting element orbs (1, 2, or 3 elements)
  if (cid === 'mage') {
    engine.playerConfig.mageElements.forEach((el, idx) => {
      const ang = engine.worldTime * 3 + (idx * Math.PI * 2) / engine.playerConfig.mageElements.length;
      const ox = Math.cos(ang) * 26;
      const oy = Math.sin(ang) * 26;
      ctx.fillStyle = ELEMENT_META[el].color;
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();

  // Crown if Rank #1 or Sovereign Helm equipped
  if (playerRank === 1 || engine.equipped.helm?.rarity === 'Legendary') {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y - 20);
    ctx.lineTo(p.x - 5, p.y - 28);
    ctx.lineTo(p.x, p.y - 22);
    ctx.lineTo(p.x + 5, p.y - 28);
    ctx.lineTo(p.x + 8, p.y - 20);
    ctx.closePath();
    ctx.fill();
  }

  // Name & Level Plate
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Lv ${p.level} ${engine.playerConfig.name}`, p.x, p.y - 28);
}

function drawSummon(ctx: CanvasRenderingContext2D, s: { x: number; y: number; radius: number; kind: string; hp: number; maxHp: number; hitFlashTimer: number }, _time: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 10, s.radius, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = s.hitFlashTimer > 0 ? '#ffffff' : s.kind === 'dread_knight' ? '#7e22ce' : '#cbd5e1';
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.stroke();

  const bw = 32;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(s.x - bw / 2, s.y - s.radius - 10, bw, 4);
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(s.x - bw / 2, s.y - s.radius - 10, bw * Math.max(0, s.hp / s.maxHp), 4);
  ctx.restore();
}

function drawMonster(ctx: CanvasRenderingContext2D, m: MonsterInstance, time: number) {
  ctx.save();
  ctx.translate(m.x, m.y);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, m.radius * 0.72, m.radius * 0.9, m.radius * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  const scaleSpawn = m.spawnAnimTimer > 0 ? 1 - m.spawnAnimTimer * 0.8 : 1;
  ctx.scale(scaleSpawn * m.squash, scaleSpawn * (2 - m.squash));

  if (m.isDummy) {
    // Straw Training Dummy
    ctx.fillStyle = m.hitFlashTimer > 0 ? '#ffffff' : '#b45309';
    ctx.fillRect(-10, -18, 20, 32);
    ctx.fillRect(-20, -8, 40, 8);
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(0, -16, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Boss Ring
    if (m.isBoss) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 7 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = m.hitFlashTimer > 0 ? '#ffffff' : m.color;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = m.accentColor;
    ctx.lineWidth = m.isBoss ? 3.5 : 2;
    ctx.stroke();

    // Eyes facing direction
    const ex = Math.cos(m.facing) * (m.radius * 0.35);
    const ey = Math.sin(m.facing) * (m.radius * 0.35);
    ctx.fillStyle = m.isBoss ? '#fef08a' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(ex - 4, ey - 2, 2.6, 0, Math.PI * 2);
    ctx.arc(ex + 4, ey + 2, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Status Badges (Burn, Slow, Stun, Mark)
    if (m.burnTimer > 0) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (m.slowTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (m.markedTimer > 0) {
      ctx.fillStyle = '#e879f9';
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✕', 0, -m.radius - 18);
    }
  }

  ctx.restore();

  // HP Bar & Level Label
  if (!m.isDummy) {
    const bw = m.isBoss ? 74 : 42;
    ctx.fillStyle = 'rgba(15, 20, 18, 0.86)';
    ctx.fillRect(m.x - bw / 2, m.y - m.radius - 13, bw, 5);
    ctx.fillStyle = m.isBoss ? '#f59e0b' : '#ef4444';
    ctx.fillRect(m.x - bw / 2 + 1, m.y - m.radius - 12, (bw - 2) * Math.max(0, m.hp / m.maxHp), 3);

    ctx.fillStyle = m.isBoss ? '#fde047' : '#e2e8f0';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv ${m.level} ${m.name}`, m.x, m.y - m.radius - 17);
  } else {
    ctx.fillStyle = '#fde68a';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Training Dummy', m.x, m.y - 30);
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const p of engine.projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const ang = Math.atan2(p.vy, p.vx);
    ctx.rotate(ang);
    ctx.fillStyle = p.color;

    if (p.kind === 'arrow') {
      ctx.fillRect(-10, -1.5, 20, 3);
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(7, -4);
      ctx.lineTo(7, 4);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === 'wave') {
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, -1.1, 1.1);
      ctx.lineWidth = 6;
      ctx.strokeStyle = p.color;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(-4, 0, p.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  tree: TreeProp,
  faded: boolean,
  time: number
) {
  ctx.save();
  ctx.globalAlpha = faded ? 0.36 : 0.94;
  const sway = Math.sin(time * 1.4 + tree.x * 0.02) * 2.5;

  // Trunk shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(tree.x + 4, tree.y + 10, tree.r * 0.75, tree.r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer foliage
  ctx.fillStyle = tree.shade;
  ctx.beginPath();
  ctx.arc(tree.x + sway, tree.y, tree.r, 0, Math.PI * 2);
  ctx.fill();

  // Inner canopy highlight
  ctx.fillStyle = tree.hue;
  ctx.beginPath();
  ctx.arc(tree.x - 4 + sway, tree.y - 5, tree.r * 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
