import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ELEMENT_META } from '../game/data';
import { HudSnapshot } from '../game/types';
import { ClassEmblem } from './Icons';

interface GameHUDProps {
  snap: HudSnapshot;
  onOpenModal: (modal: 'quests' | 'character' | 'ranking' | 'merchant' | 'trainer') => void;
  onToggleMute: () => void;
  onPause: () => void;
  onUsePotion: () => void;
  onTriggerSkill: (key: 'LMB' | 'Q' | 'E' | 'R' | 'SHIFT') => void;
  onClaimQuest: (uid: string) => void;
  onInteractNpc: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  snap,
  onOpenModal,
  onToggleMute,
  onPause,
  onUsePotion,
  onTriggerSkill,
  onClaimQuest,
  onInteractNpc,
}) => {
  const hpPct = Math.max(0, Math.min(100, (snap.hp / Math.max(1, snap.maxHp)) * 100));
  const mpPct = Math.max(0, Math.min(100, (snap.mp / Math.max(1, snap.maxMp)) * 100));
  const expPct = Math.max(0, Math.min(100, (snap.exp / Math.max(1, snap.maxExp)) * 100));

  const readyQuest = snap.activeQuests.find((q) => q.status === 'ready_to_claim');

  const trainingLine = (() => {
    const t = snap.quest;
    if (t.trainingStep === 0) return `Training: Basic Attack Training Dummy (${t.dummyBasicHits}/3)`;
    if (t.trainingStep === 1) return `Training: Cast Q/E/R Skill on Dummy (${t.dummySkillHits}/2)`;
    if (t.trainingStep === 2) return `Training: Speak with Merchant Lyra [F] in Village`;
    if (t.trainingStep === 3) return `Training Complete: Speak with Master Gareth [F]`;
    return null;
  })();

  const zoneTextColor =
    snap.zone === 'SAFE_VILLAGE'
      ? 'text-emerald-300'
      : snap.zone === 'SAFE_JUNGLE'
      ? 'text-lime-300'
      : snap.zone === 'OUTER_DANGER'
      ? 'text-rose-300'
      : 'text-purple-300';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5">
      {/* Top Row: Hero Cluster · Zone/Boss/Quest Banner · Utility Actions */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Hero Status */}
        <div className="pointer-events-auto bg-[#0c120f]/92 border border-stone-700/75 rounded-lg p-3 w-72 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-400 shrink-0">
                <ClassEmblem classId={snap.classId} size={20} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-100 truncate">
                  {snap.playerName} · Lv {snap.level}
                </div>
                <div className="text-[11px] text-stone-400 truncate">
                  {snap.className} · {snap.rarity}
                  {snap.classId === 'mage' &&
                    ` (${snap.mageElements.map((e) => ELEMENT_META[e].name).join('/')})`}
                </div>
              </div>
            </div>
            <div className="text-xs font-mono-num font-semibold text-amber-300 whitespace-nowrap shrink-0">
              {snap.silver} Silver
            </div>
          </div>

          {/* HP / MP / EXP Bars */}
          <div className="mt-2.5 space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] font-mono-num text-stone-300">
                <span>HP</span>
                <span>
                  {snap.hp} / {snap.maxHp}
                </span>
              </div>
              <div className="h-2 bg-stone-900 rounded-sm overflow-hidden mt-0.5">
                <div
                  className="h-full bg-rose-500 transition-[width] duration-100"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono-num text-stone-300">
                <span>Mana</span>
                <span>
                  {snap.mp} / {snap.maxMp}
                </span>
              </div>
              <div className="h-1.5 bg-stone-900 rounded-sm overflow-hidden mt-0.5">
                <div
                  className="h-full bg-sky-500 transition-[width] duration-100"
                  style={{ width: `${mpPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono-num text-stone-400">
                <span>EXP</span>
                <span>
                  {snap.safeCapReached
                    ? 'Safe Cap (Lv 7)'
                    : `${snap.exp.toLocaleString()} / ${snap.maxExp.toLocaleString()}`}
                </span>
              </div>
              <div className="h-1.5 bg-stone-900 rounded-sm overflow-hidden mt-0.5">
                <div
                  className="h-full bg-amber-400 transition-[width] duration-150"
                  style={{ width: `${snap.safeCapReached ? 100 : expPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono-num text-stone-300">
            <span>STR {snap.totalStrength}</span>
            <span>AGI {snap.totalAgility}</span>
            <span>DEF {snap.defense}</span>
            <span>Rank #{snap.playerRank}</span>
          </div>
        </div>

        {/* Top-Center: Zone Status, Danger Warning, Boss Bar, Compact Quest Tracker */}
        <div className="flex flex-col items-center gap-2 max-w-md w-full">
          <div className="bg-[#0c120f]/90 border border-stone-700/75 rounded-lg px-4 py-1.5 text-center shadow-md">
            <div className={`text-xs font-semibold tracking-wide ${zoneTextColor}`}>
              {snap.zoneLabel}
            </div>
            {trainingLine ? (
              <div className="text-[11px] text-amber-200 mt-0.5">{trainingLine}</div>
            ) : snap.activeQuests.length > 0 ? (
              <div className="text-[11px] text-stone-300 mt-0.5">
                {snap.activeQuests[0].title} ({snap.activeQuests[0].progress}/{snap.activeQuests[0].required})
              </div>
            ) : (
              <div className="text-[11px] text-stone-400 mt-0.5">
                Speak with Quartermaster Vael or Ranger Kael for Contracts [J]
              </div>
            )}
          </div>

          {snap.dangerWarning && (
            <div className="bg-rose-950/95 border border-rose-500/80 text-rose-100 text-xs font-semibold px-4 py-1.5 rounded-md shadow-lg">
              DANGER ZONE: Below Level 5 — Outer Wilds monsters deal 1.75x lethal damage!
            </div>
          )}

          {readyQuest && (
            <button
              type="button"
              onClick={() => onClaimQuest(readyQuest.uid)}
              className="pointer-events-auto bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold px-4 py-1.5 rounded-md shadow-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Claim Quest Reward: {readyQuest.title}
            </button>
          )}

          {snap.activeBoss && (
            <div className="w-80 bg-[#0c120f]/92 border border-amber-500/60 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex justify-between text-xs font-semibold text-amber-300">
                <span>
                  Lv {snap.activeBoss.level} {snap.activeBoss.name}
                </span>
                <span className="font-mono-num">
                  {snap.activeBoss.hp} / {snap.activeBoss.maxHp}
                </span>
              </div>
              <div className="h-2 bg-stone-900 rounded-sm overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-500 transition-[width] duration-100"
                  style={{
                    width: `${Math.max(
                      0,
                      (snap.activeBoss.hp / Math.max(1, snap.activeBoss.maxHp)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Clean Single-Line Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenModal('quests')}
            className="px-3 py-2 text-xs font-medium text-stone-100 bg-[#0c120f]/92 hover:bg-stone-800 border border-stone-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Quests [J] ({snap.activeQuests.length})
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('character')}
            className="px-3 py-2 text-xs font-medium text-stone-100 bg-[#0c120f]/92 hover:bg-stone-800 border border-stone-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Gear [C]
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('ranking')}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              snap.unclaimedRankRewards.length > 0
                ? 'bg-amber-400 text-stone-950 border-amber-300 font-semibold'
                : 'text-stone-100 bg-[#0c120f]/92 hover:bg-stone-800 border-stone-700/80'
            }`}
          >
            {snap.unclaimedRankRewards.length > 0
              ? `Ranks [L] (${snap.unclaimedRankRewards.length} Reward)`
              : 'Ranks [L]'}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={snap.muted ? 'Unmute audio' : 'Mute audio'}
            className="p-2 text-stone-200 bg-[#0c120f]/92 hover:bg-stone-800 border border-stone-700/80 rounded-lg transition-colors cursor-pointer"
          >
            {snap.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 text-xs font-medium text-stone-200 bg-[#0c120f]/92 hover:bg-stone-800 border border-stone-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Pause [Esc]
          </button>
        </div>
      </div>

      {/* Bottom Row: Notices + Interaction Prompt · Skill Action Bar · Tactical Minimap */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Escort Status, Nearby NPC Interact & Event Feed */}
        <div className="w-76 space-y-2">
          {snap.escort && (
            <div className="bg-[#0c120f]/92 border border-amber-400/60 rounded-lg p-2.5 text-xs">
              <div className="flex justify-between font-semibold text-amber-200">
                <span>Escort: {snap.escort.name}</span>
                <span className="font-mono-num">
                  {Math.max(0, Math.round(snap.escort.hp))} / {snap.escort.maxHp}
                </span>
              </div>
              <div className="text-[11px] text-stone-300 mt-0.5">
                Destination: {snap.escort.destLabel}
              </div>
              <div className="h-1.5 bg-stone-900 rounded-sm overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-400"
                  style={{
                    width: `${Math.max(
                      0,
                      (snap.escort.hp / Math.max(1, snap.escort.maxHp)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {snap.classId === 'necromancer' && (
            <div className="text-xs font-mono-num text-purple-300 bg-[#0c120f]/88 border border-purple-500/40 rounded-md px-3 py-1.5 inline-block">
              Undead Summons: {snap.summonCount} / {snap.maxSummons}
            </div>
          )}

          {snap.nearbyNpc && (
            <button
              type="button"
              onClick={onInteractNpc}
              className="pointer-events-auto w-full text-left bg-amber-400/95 hover:bg-amber-300 text-stone-950 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg transition-colors cursor-pointer"
            >
              {snap.nearbyNpc.promptText}
            </button>
          )}

          <div className="space-y-1">
            {snap.notifications.slice(0, 2).map((n) => (
              <div
                key={n.id}
                className={`text-[11px] px-2.5 py-1 rounded bg-[#0c120f]/88 border ${
                  n.tone === 'danger'
                    ? 'border-rose-500/60 text-rose-200'
                    : n.tone === 'reward' || n.tone === 'level'
                    ? 'border-amber-500/50 text-amber-200'
                    : 'border-stone-700/70 text-stone-300'
                }`}
              >
                {n.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Center: Compact Action Bar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#0c120f]/92 border border-stone-700/80 rounded-xl px-3 py-2 shadow-xl">
          {snap.skills.map((s) => {
            const onCd = s.remainingCooldown > 0.05;
            const elColor =
              s.element && s.element !== 'physical' && s.element !== 'necrotic'
                ? ELEMENT_META[s.element].color
                : s.element === 'necrotic'
                ? '#c084fc'
                : '#fbbf24';
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onTriggerSkill(s.key)}
                title={`${s.name} — ${s.description}`}
                className="relative w-16 h-14 rounded-lg bg-[#161f1b] hover:bg-[#1f2b25] border border-stone-700 flex flex-col items-center justify-center px-1 transition-colors cursor-pointer"
              >
                <span
                  className="text-[10px] font-mono-num font-bold"
                  style={{ color: elColor }}
                >
                  {s.key}
                </span>
                <span className="text-[10px] text-stone-200 font-medium truncate max-w-full mt-0.5">
                  {s.name}
                </span>
                {s.manaCost > 0 && (
                  <span className="text-[9px] font-mono-num text-sky-300">{s.manaCost} MP</span>
                )}
                {onCd && (
                  <div className="absolute inset-0 bg-stone-950/80 rounded-lg flex items-center justify-center font-mono-num text-xs font-bold text-amber-300">
                    {s.remainingCooldown.toFixed(1)}s
                  </div>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onUsePotion}
            title="Drink Healing Tonic [H] (+140 HP, +75 MP)"
            className="w-16 h-14 rounded-lg bg-[#161f1b] hover:bg-[#1f2b25] border border-emerald-700/60 flex flex-col items-center justify-center px-1 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-mono-num font-bold text-emerald-300">H</span>
            <span className="text-[10px] text-stone-200 font-medium">Tonic</span>
            <span className="text-[10px] font-mono-num text-emerald-400">
              x{snap.potionsCount}
            </span>
          </button>
        </div>

        {/* Bottom-Right: Tactical Minimap */}
        <div className="bg-[#0c120f]/92 border border-stone-700/80 rounded-lg p-2 shadow-lg">
          <div className="flex justify-between text-[10px] text-stone-400 mb-1 font-mono-num">
            <span>Village · Safe · Outskirts · Wilds</span>
          </div>
          <svg
            width="160"
            height="112"
            viewBox={`0 0 ${snap.worldSize.width} ${snap.worldSize.height}`}
            className="bg-[#121c16] rounded border border-stone-800 block"
          >
            {/* Village */}
            <rect x="100" y="560" width="880" height="1280" fill="#2b261e" />
            {/* Safe Jungle */}
            <rect x="980" y="260" width="1200" height="1880" fill="#183325" />
            {/* Perilous Outskirts */}
            <rect x="2180" y="140" width="400" height="2120" fill="#2a1c2e" />
            {/* Elder Wilds */}
            <rect x="2580" y="140" width="740" height="2120" fill="#1d132b" />
            {/* Ranger Camp */}
            <circle cx="1380" cy="1200" r="85" fill="#fbbf24" fillOpacity="0.28" />
            {/* Monsters & Bosses */}
            {snap.minimapMonsters.map((m, idx) => (
              <circle
                key={idx}
                cx={m.x}
                cy={m.y}
                r={m.isBoss ? 68 : 28}
                fill={m.isBoss ? '#f59e0b' : '#ef4444'}
              />
            ))}
            {/* Escort Marker */}
            {snap.escort && (
              <>
                <circle cx={snap.escort.x} cy={snap.escort.y} r="55" fill="#fde047" />
                <circle
                  cx={snap.escort.destX}
                  cy={snap.escort.destY}
                  r="70"
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="22"
                />
              </>
            )}
            {/* Player Dot */}
            <circle
              cx={snap.playerPos.x}
              cy={snap.playerPos.y}
              r="65"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="22"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
