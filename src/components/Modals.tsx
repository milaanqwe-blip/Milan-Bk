import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  CRAFT_RECIPES,
  ELEMENT_META,
  ELEMENTAL_BALANCE_PROFILES,
  MATERIALS,
  MERCHANT_ITEMS,
  RANK_REWARD_TIERS,
} from '../game/data';
import { HudSnapshot, Item, MaterialId } from '../game/types';

export type ActiveModalType =
  | null
  | 'quests'
  | 'merchant'
  | 'trainer'
  | 'character'
  | 'ranking';

interface ModalsProps {
  modal: ActiveModalType;
  snap: HudSnapshot;
  onClose: () => void;
  onBuyItem: (id: string) => { ok: boolean; message: string };
  onCraftItem: (id: string) => { ok: boolean; message: string };
  onEquipItem: (id: string) => void;
  onAcceptQuest: (uid: string) => void;
  onAbandonQuest: (uid: string) => void;
  onClaimQuest: (uid: string) => void;
  onRefreshQuests: () => void;
  onClaimRankReward: (threshold: number) => void;
  onCompleteTraining: () => void;
  onResume: () => void;
  onRespawnVillage: () => void;
  onReturnTitle: () => void;
}

const rarityTextClass = (rarity: Item['rarity']) => {
  switch (rarity) {
    case 'Legendary':
      return 'text-amber-300';
    case 'Mythic':
      return 'text-rose-300';
    case 'Epic':
      return 'text-purple-300';
    case 'Rare':
      return 'text-sky-300';
    case 'Uncommon':
      return 'text-emerald-300';
    default:
      return 'text-stone-300';
  }
};

export const Modals: React.FC<ModalsProps> = ({
  modal,
  snap,
  onClose,
  onBuyItem,
  onCraftItem,
  onEquipItem,
  onAcceptQuest,
  onAbandonQuest,
  onClaimQuest,
  onRefreshQuests,
  onClaimRankReward,
  onCompleteTraining,
  onResume,
  onRespawnVillage,
  onReturnTitle,
}) => {
  const [merchantTab, setMerchantTab] = useState<'shop' | 'forge'>('shop');
  const [questFilter, setQuestFilter] = useState<'all' | 'village' | 'jungle'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (snap.screen === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-sm bg-[#111915] border border-stone-700 rounded-xl p-6 space-y-4 shadow-2xl">
          <h2 className="font-display text-xl font-bold text-amber-300">Game Paused</h2>
          <p className="text-sm text-stone-300">
            {snap.playerName} · Lv {snap.level} {snap.className} · {snap.silver} Silver
          </p>
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 px-4 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              Resume Adventure
            </button>
            <button
              type="button"
              onClick={() => {
                onRespawnVillage();
                onResume();
              }}
              className="w-full py-2.5 px-4 text-sm font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              Return to Safe Village
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 px-4 text-sm font-medium text-stone-400 hover:text-stone-200 bg-[#151e19] border border-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              Exit to Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (snap.screen === 'DEFEATED') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md bg-[#161112] border border-rose-500/50 rounded-xl p-6 space-y-4 shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-rose-400">Fallen in the Wilds</h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            {snap.zone === 'OUTER_DANGER' && snap.level < 5
              ? 'You ventured outside the Safe Zone below Level 5. Hunt inside the Safe Jungle until Level 5+ and buy 5-Silver armor in Havenbrook first.'
              : 'Your strength gave out, but the Sanctuary Fountain can restore you in Havenbrook Village with all gear, Silver, and EXP intact.'}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onRespawnVillage}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              Recover in Safe Village
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="py-2.5 px-4 text-sm font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              New Hero
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!modal) return null;

  const filteredAvailableQuests = snap.availableQuests.filter((q) =>
    questFilter === 'all' ? true : q.giverRegion === questFilter
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/72 p-4">
      <div className="w-full max-w-4xl max-h-[86vh] flex flex-col bg-[#101714] border border-stone-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="font-display text-lg font-bold text-amber-300">
              {modal === 'quests' && 'Dynamic Contracts & Quests'}
              {modal === 'merchant' && 'Merchant Lyra & Field Forge'}
              {modal === 'trainer' && 'Master Gareth · Basic Training'}
              {modal === 'character' && 'Adventurer Stats & Gear'}
              {modal === 'ranking' && 'Hall of Valor · Rankings & Armor Rewards'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-mono-num">
              Lv {snap.level} {snap.className} · {snap.silver} Silver Coins · Rank #{snap.playerRank}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              onClose();
            }}
            aria-label="Close modal"
            className="p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {feedback && (
            <div className="text-xs text-amber-200 bg-amber-950/50 border border-amber-500/40 rounded-lg px-4 py-2.5">
              {feedback}
            </div>
          )}

          {/* QUESTS MODAL */}
          {modal === 'quests' && (
            <div className="space-y-6">
              {/* Active Contracts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-100">
                    Active Contracts ({snap.activeQuests.length} / 3)
                  </h3>
                  <button
                    type="button"
                    onClick={onRefreshQuests}
                    className="px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-md transition-colors cursor-pointer"
                  >
                    Refresh Contracts
                  </button>
                </div>

                {snap.activeQuests.length === 0 ? (
                  <p className="text-xs text-stone-400 py-2">
                    No active contracts yet. Accept eradication, collection, escort, or exploration tasks below.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {snap.activeQuests.map((q) => (
                      <div
                        key={q.uid}
                        className="p-4 rounded-lg bg-[#151e1a] border border-stone-700/80 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs text-amber-300 font-medium">
                            {q.kind.toUpperCase().slice(0, 1) + q.kind.slice(1)} · {q.difficulty} · {q.giverName}
                          </div>
                          <div className="text-sm font-semibold text-stone-100 mt-1">{q.title}</div>
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">{q.description}</p>
                          <div className="mt-2.5 text-xs font-mono-num text-stone-200">
                            {q.objectiveLabel}: {q.progress} / {q.required}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                          <span className="text-[11px] font-mono-num text-stone-300">
                            +{q.reward.exp.toLocaleString()} EXP · +{q.reward.silver} Silver
                          </span>
                          <div className="flex items-center gap-2">
                            {q.status === 'ready_to_claim' ? (
                              <button
                                type="button"
                                onClick={() => onClaimQuest(q.uid)}
                                className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-md cursor-pointer"
                              >
                                Claim Reward
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAbandonQuest(q.uid)}
                                className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-rose-300 bg-stone-900 rounded-md cursor-pointer"
                              >
                                Abandon
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Contracts Board */}
              <div className="space-y-3 pt-4 border-t border-stone-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-100">
                    Available Contracts (Scaled to Level {snap.level})
                  </h3>
                  <div className="flex items-center gap-1 p-1 bg-[#151e1a] rounded-lg border border-stone-800">
                    {(['all', 'village', 'jungle'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setQuestFilter(f)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          questFilter === f
                            ? 'bg-amber-400 text-stone-950'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {f === 'all' ? 'All Regions' : f === 'village' ? 'Safe Village' : 'Jungle Outpost'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAvailableQuests.map((q) => (
                    <div
                      key={q.uid}
                      className="p-4 rounded-lg bg-[#141c18] border border-stone-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>
                            {q.kind === 'eradication' && 'Monster Eradication'}
                            {q.kind === 'collection' && 'Item Collection'}
                            {q.kind === 'escort' && 'Escort Mission'}
                            {q.kind === 'exploration' && 'Exploration Task'}
                            {' · '}
                            {q.difficulty}
                          </span>
                          <span className="font-mono-num">Rec. Lv {q.recommendedLevel}</span>
                        </div>
                        <div className="text-sm font-semibold text-stone-100 mt-1">{q.title}</div>
                        <p className="text-xs text-stone-400 mt-1 leading-relaxed">{q.description}</p>
                        <div className="mt-2 text-xs text-stone-300">
                          Giver: {q.giverName} ({q.giverRegion === 'village' ? 'Havenbrook' : 'Emerald Thicket'})
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-mono-num text-amber-200">
                          +{q.reward.exp.toLocaleString()} EXP · +{q.reward.silver} Silver
                          {q.reward.gearReward ? ` · +${q.reward.gearReward.name}` : ''}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAcceptQuest(q.uid)}
                          disabled={snap.activeQuests.length >= 3}
                          className="px-3.5 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-700 disabled:text-stone-400 rounded-md whitespace-nowrap cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MERCHANT & FORGE MODAL */}
          {modal === 'merchant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-[#151e1a] rounded-lg border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setMerchantTab('shop')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      merchantTab === 'shop' ? 'bg-amber-400 text-stone-950' : 'text-stone-300'
                    }`}
                  >
                    Merchant Wares (5+ Silver)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerchantTab('forge')}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                      merchantTab === 'forge' ? 'bg-amber-400 text-stone-950' : 'text-stone-300'
                    }`}
                  >
                    Field Forge (Crafting)
                  </button>
                </div>

                <div className="text-xs font-mono-num text-amber-300">
                  Your Balance: {snap.silver} Silver Coins
                </div>
              </div>

              {merchantTab === 'shop' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MERCHANT_ITEMS.map((item) => {
                    const classOk =
                      !item.allowedClasses || item.allowedClasses.includes(snap.classId);
                    const canAfford = snap.silver >= item.priceSilver;
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg bg-[#151e1a] border border-stone-800 flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-semibold ${rarityTextClass(item.rarity)}`}>
                              {item.name}
                            </span>
                            <span className="text-xs font-mono-num text-amber-300">
                              {item.priceSilver} Silver
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            {item.slot.toUpperCase().slice(0, 1) + item.slot.slice(1)} · {item.rarity}
                            {item.allowedClasses ? ` · ${item.allowedClasses.join(', ')}` : ' · All Classes'}
                          </div>
                          <p className="text-xs text-stone-300 mt-1.5">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                          <div className="text-[11px] font-mono-num text-emerald-300">
                            {[
                              item.bonusPower ? `+${item.bonusPower} PWR` : '',
                              item.bonusStrength ? `+${item.bonusStrength} STR` : '',
                              item.bonusAgility ? `+${item.bonusAgility} AGI` : '',
                              item.bonusHp ? `+${item.bonusHp} HP` : '',
                              item.bonusDefense ? `+${item.bonusDefense} DEF` : '',
                              item.healHp ? `Heal +${item.healHp} HP` : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                          <button
                            type="button"
                            disabled={!classOk || !canAfford}
                            onClick={() => {
                              const res = onBuyItem(item.id);
                              setFeedback(res.message);
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-800 disabled:text-stone-500 rounded-md whitespace-nowrap cursor-pointer"
                          >
                            {!classOk ? 'Wrong Class' : `Buy (${item.priceSilver} Silver)`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-[#151e1a] border border-stone-800 text-xs font-mono-num">
                    {(Object.keys(MATERIALS) as MaterialId[]).map((mid) => (
                      <span key={mid} style={{ color: MATERIALS[mid].color }}>
                        {MATERIALS[mid].name}: {snap.materials[mid] || 0}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CRAFT_RECIPES.map((rec) => {
                      const hasSilver = snap.silver >= rec.silverCost;
                      const hasMats = Object.entries(rec.materials).every(
                        ([k, v]) => (snap.materials[k as MaterialId] || 0) >= (v || 0)
                      );
                      return (
                        <div
                          key={rec.id}
                          className="p-4 rounded-lg bg-[#151e1a] border border-stone-800 flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-semibold ${rarityTextClass(
                                  rec.resultItem.rarity
                                )}`}
                              >
                                {rec.resultItem.name}
                              </span>
                              <span className="text-xs font-mono-num text-amber-300">
                                {rec.silverCost} Silver
                              </span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">{rec.resultItem.description}</p>
                            <div className="mt-2 text-xs font-mono-num text-stone-300">
                              Needs:{' '}
                              {Object.entries(rec.materials)
                                .map(([k, v]) => `${v}x ${MATERIALS[k as MaterialId].name}`)
                                .join(' · ')}
                            </div>
                          </div>
                          <div className="flex justify-end pt-2 border-t border-stone-800">
                            <button
                              type="button"
                              disabled={!hasSilver || !hasMats}
                              onClick={() => {
                                const res = onCraftItem(rec.id);
                                setFeedback(res.message);
                              }}
                              className="px-4 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-800 disabled:text-stone-500 rounded-md cursor-pointer"
                            >
                              Forge & Equip
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRAINER MODAL */}
          {modal === 'trainer' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-300 leading-relaxed">
                Welcome to Havenbrook Training Yard. Every adventurer begins at Level 1 with Strength 50, Agility 50, and 20 Silver Coins. Master your strikes before venturing into the Safe Zone Jungle (up to Lv 7) and later the Lv 5+ Elder Wilds.
              </p>

              <div className="space-y-2 text-xs bg-[#151e1a] border border-stone-800 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className={snap.quest.dummyBasicHits >= 3 ? 'text-emerald-300' : 'text-stone-200'}>
                    1. Land 3 Basic Attacks [Click / Space] on a Training Dummy
                  </span>
                  <span className="font-mono-num">{Math.min(3, snap.quest.dummyBasicHits)} / 3</span>
                </div>
                <div className="flex justify-between">
                  <span className={snap.quest.dummySkillHits >= 2 ? 'text-emerald-300' : 'text-stone-200'}>
                    2. Cast 2 Class Abilities [Q / E / R] on a Training Dummy
                  </span>
                  <span className="font-mono-num">{Math.min(2, snap.quest.dummySkillHits)} / 2</span>
                </div>
                <div className="flex justify-between">
                  <span className={snap.quest.visitedMerchant ? 'text-emerald-300' : 'text-stone-200'}>
                    3. Visit Merchant Lyra to inspect 5-Silver starter gear
                  </span>
                  <span>{snap.quest.visitedMerchant ? 'Done' : 'Pending'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono-num text-amber-300">
                  Graduation Reward: +1,000 EXP · +5 Silver Coins
                </span>
                {snap.quest.trainingStep >= 4 ? (
                  <span className="text-xs font-semibold text-emerald-300">Training Completed</span>
                ) : (
                  <button
                    type="button"
                    disabled={snap.quest.trainingStep < 3}
                    onClick={onCompleteTraining}
                    className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-800 disabled:text-stone-500 rounded-lg cursor-pointer"
                  >
                    {snap.quest.trainingStep < 3 ? 'Complete Steps 1–3 First' : 'Complete Training'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CHARACTER & GEAR MODAL */}
          {modal === 'character' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-num">
                <div className="p-3 bg-[#151e1a] border border-stone-800 rounded-lg">
                  <div className="text-stone-400">Strength</div>
                  <div className="text-lg font-bold text-stone-100 mt-0.5">
                    {snap.totalStrength}{' '}
                    <span className="text-xs font-normal text-stone-400">
                      (Base {snap.baseStrength})
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-[#151e1a] border border-stone-800 rounded-lg">
                  <div className="text-stone-400">Agility</div>
                  <div className="text-lg font-bold text-stone-100 mt-0.5">
                    {snap.totalAgility}{' '}
                    <span className="text-xs font-normal text-stone-400">
                      (Base {snap.baseAgility})
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-[#151e1a] border border-stone-800 rounded-lg">
                  <div className="text-stone-400">Defense / Power</div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">
                    {snap.defense} / {snap.powerRating}
                  </div>
                </div>
                <div className="p-3 bg-[#151e1a] border border-stone-800 rounded-lg">
                  <div className="text-stone-400">Next Level EXP</div>
                  <div className="text-sm font-bold text-stone-100 mt-1">
                    {snap.exp.toLocaleString()} / {snap.maxExp.toLocaleString()}
                  </div>
                </div>
              </div>

              {snap.mageTier && (
                <div className="p-4 rounded-lg bg-[#151e1a] border border-sky-500/30 space-y-2">
                  <div className="text-xs font-semibold text-sky-300">
                    Elemental Balance Profile · {ELEMENTAL_BALANCE_PROFILES[snap.mageTier].label}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {snap.mageElements.map((el) => (
                      <span key={el} style={{ color: ELEMENT_META[el].color }} className="font-medium">
                        {ELEMENT_META[el].name} ({ELEMENT_META[el].effectText})
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-stone-300">
                    {ELEMENTAL_BALANCE_PROFILES[snap.mageTier].summary}
                  </p>
                  <div className="text-[11px] text-stone-400">
                    Cycle Matchups (+25% / -15%): Fire beats Wind · Wind beats Earth · Earth beats Lightning · Lightning beats Water · Water beats Fire.
                  </div>
                </div>
              )}

              {/* Equipped Slots */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['weapon', 'armor', 'helm'] as const).map((slot) => {
                  const eq = snap.equipped[slot];
                  return (
                    <div key={slot} className="p-3.5 rounded-lg bg-[#151e1a] border border-stone-800">
                      <div className="text-[11px] text-stone-400">
                        Equipped {slot.toUpperCase().slice(0, 1) + slot.slice(1)}
                      </div>
                      {eq ? (
                        <div className="mt-1">
                          <div className={`text-sm font-semibold ${rarityTextClass(eq.rarity)}`}>
                            {eq.name}
                          </div>
                          <div className="text-[11px] text-stone-300 mt-0.5">{eq.description}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-stone-500 mt-1">Empty Slot</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Inventory */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-stone-100">
                  Gear Inventory ({snap.inventory.length})
                </h3>
                {snap.inventory.length === 0 ? (
                  <p className="text-xs text-stone-400">
                    Visit Merchant Lyra in Havenbrook Village (5 Silver Coins) or climb the Hall of Valor Rankings for rare armor!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {snap.inventory.map((item) => {
                      const isEquipped =
                        item.slot !== 'consumable' && snap.equipped[item.slot]?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg bg-[#141c18] border border-stone-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className={`text-xs font-semibold ${rarityTextClass(item.rarity)}`}>
                              {item.name}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              {item.slot} · {item.rarity}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isEquipped}
                            onClick={() => onEquipItem(item.id)}
                            className="px-3 py-1 text-xs font-medium bg-stone-800 hover:bg-stone-700 disabled:bg-emerald-950/60 disabled:text-emerald-300 text-stone-200 rounded cursor-pointer"
                          >
                            {isEquipped ? 'Equipped' : 'Equip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RANKING & RARE ARMOR REWARDS MODAL */}
          {modal === 'ranking' && (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-stone-100">
                  Top Rank Rare Armor Rewards (Your Rank: #{snap.playerRank})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {RANK_REWARD_TIERS.map((tier) => {
                    const unlocked = snap.playerRank <= tier.rankThreshold;
                    const claimed = snap.claimedRankRewards.includes(tier.rankThreshold);
                    return (
                      <div
                        key={tier.rankThreshold}
                        className="p-3.5 rounded-lg bg-[#151e1a] border border-stone-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs text-amber-300 font-medium">{tier.title}</div>
                          <div className={`text-sm font-semibold ${rarityTextClass(tier.item.rarity)}`}>
                            {tier.item.name}
                          </div>
                          <div className="text-[11px] font-mono-num text-stone-400 mt-0.5">
                            +{tier.item.bonusHp} HP · +{tier.item.bonusDefense} DEF · +{tier.item.bonusStrength} STR · +{tier.item.bonusAgility} AGI
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!unlocked || claimed}
                          onClick={() => onClaimRankReward(tier.rankThreshold)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
                            claimed
                              ? 'bg-emerald-950/60 text-emerald-300'
                              : unlocked
                              ? 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {claimed ? 'Claimed' : unlocked ? 'Claim & Equip' : `Reach Top ${tier.rankThreshold}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-stone-100">Hall of Valor Standings</h3>
                <div className="border border-stone-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151e1a] text-stone-400">
                      <tr>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Adventurer</th>
                        <th className="py-2.5 px-3">Class & Affinity</th>
                        <th className="py-2.5 px-3 text-right">Level</th>
                        <th className="py-2.5 px-3 text-right">Combat Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80 font-mono-num">
                      {snap.rankings.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className={
                            entry.isPlayer ? 'bg-amber-500/12 text-amber-200 font-semibold' : 'text-stone-300'
                          }
                        >
                          <td className="py-2 px-3">#{idx + 1}</td>
                          <td className="py-2 px-3 font-sans">{entry.name}</td>
                          <td className="py-2 px-3 font-sans text-stone-400">{entry.classLabel}</td>
                          <td className="py-2 px-3 text-right">Lv {entry.level}</td>
                          <td className="py-2 px-3 text-right">{entry.score.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
