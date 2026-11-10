import React, { useEffect, useState } from 'react';
import {
  CLASS_DEFINITIONS,
  ELEMENT_META,
  ELEMENTAL_BALANCE_PROFILES,
  rollRandomDestiny,
  STARTING_AGILITY,
  STARTING_SILVER,
  STARTING_STRENGTH,
} from '../game/data';
import { ClassId, ElementType, MageAffinityCount, PlayerConfig } from '../game/types';
import { ClassEmblem, ElementEmblem, TitleLockupSvg } from './Icons';

interface TitleScreenProps {
  onStart: (config: PlayerConfig) => void;
}

const ALL_CLASSES: ClassId[] = ['warrior', 'archer', 'mage', 'necromancer'];
const ALL_ELEMENTS: ElementType[] = ['water', 'fire', 'lightning', 'wind', 'earth'];

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('Kael');
  const [classId, setClassId] = useState<ClassId>('warrior');
  const [mageElements, setMageElements] = useState<ElementType[]>(['fire']);
  const [fateFlash, setFateFlash] = useState<string | null>(null);

  const selectedClass = CLASS_DEFINITIONS[classId];
  const mageTier = (Math.min(3, Math.max(1, mageElements.length)) as MageAffinityCount);
  const balanceProfile = ELEMENTAL_BALANCE_PROFILES[mageTier];

  const handleToggleElement = (el: ElementType) => {
    setMageElements((prev) => {
      if (prev.includes(el)) {
        if (prev.length === 1) return prev; // Keep at least 1 element
        return prev.filter((x) => x !== el);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), el];
      }
      return [...prev, el];
    });
  };

  const handleFateRoll = () => {
    const rolled = rollRandomDestiny();
    setClassId(rolled.classId);
    setMageElements(rolled.mageElements);
    const def = CLASS_DEFINITIONS[rolled.classId];
    setFateFlash(`Summoned ${def.name} (${def.rarity})`);
  };

  const handleStart = () => {
    onStart({
      name: name.trim() || 'Adventurer',
      classId,
      mageElements: classId === 'mage' ? mageElements : [],
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rarityColor = (r: string) =>
    r === 'Legendary'
      ? 'text-purple-300'
      : r === 'Rare'
      ? 'text-sky-300'
      : 'text-stone-300';

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-between px-6 py-6 bg-gradient-to-b from-[#0a100d]/70 via-[#0a100d]/55 to-[#0a100d]/85">
      {/* Top Negative Space + Title Lockup */}
      <div className="flex flex-col items-center pt-2 text-center">
        <TitleLockupSvg />
        <p className="mt-1 text-sm text-stone-300 tracking-wide">
          Safe Village Training · Elemental Balance · Safe Jungle (Max Lv 7) · Elder Wilds (Lv 5+)
        </p>
      </div>

      {/* Main Character Awakening Console */}
      <div className="w-full max-w-4xl bg-[#101714]/92 border border-amber-500/25 rounded-xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div className="flex items-center gap-3">
            <label htmlFor="hero-name" className="text-xs font-medium text-stone-400">
              Adventurer Name
            </label>
            <input
              id="hero-name"
              type="text"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-1.5 text-sm text-stone-100 bg-[#18221d] border border-stone-700 rounded-md focus:outline-none focus:border-amber-400 w-44"
              placeholder="Adventurer"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-300 font-mono-num">
            <span>Lv 1 · 2,000 EXP</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Strength {STARTING_STRENGTH}</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Agility {STARTING_AGILITY}</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="text-amber-300">{STARTING_SILVER} Silver</span>
          </div>

          <button
            type="button"
            onClick={handleFateRoll}
            className="px-4 py-2 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {fateFlash ? `Fate Roll · ${fateFlash}` : 'Fate Summon (Random Rarity)'}
          </button>
        </div>

        {/* 4 Class Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {ALL_CLASSES.map((cid) => {
            const def = CLASS_DEFINITIONS[cid];
            const active = cid === classId;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => {
                  setClassId(cid);
                  setFateFlash(null);
                }}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1a2620] border-amber-400/80 text-stone-100'
                    : 'bg-[#141c18] border-stone-800 hover:border-stone-600 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-display text-sm font-semibold">
                    <ClassEmblem classId={cid} size={18} />
                    {def.name}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <span className={`font-medium ${rarityColor(def.rarity)}`}>{def.rarity}</span>
                  <span aria-hidden="true" className="text-stone-600">·</span>
                  <span className="text-stone-400 truncate">{def.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Class Detail & Mage Elemental Affinity Configurator */}
        <div className="mt-4 pt-4 border-t border-stone-800/80 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className={`font-semibold ${rarityColor(selectedClass.rarity)}`}>
                {selectedClass.rarity} Class
              </span>
              <span aria-hidden="true">·</span>
              <span>Base HP {selectedClass.baseHp}</span>
              <span aria-hidden="true">·</span>
              <span>Mana {selectedClass.baseMp}</span>
            </div>
            <p className="text-sm text-stone-200 leading-relaxed">
              {selectedClass.description}
            </p>
          </div>

          <div className="lg:col-span-6">
            {classId === 'mage' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-300">
                    Elemental Affinities ({mageElements.length} of 3 max)
                  </span>
                  <span className="text-stone-400">{balanceProfile.label}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALL_ELEMENTS.map((el) => {
                    const meta = ELEMENT_META[el];
                    const selected = mageElements.includes(el);
                    return (
                      <button
                        key={el}
                        type="button"
                        onClick={() => handleToggleElement(el)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selected
                            ? 'bg-stone-800 border-amber-400 text-stone-100'
                            : 'bg-[#151e1a] border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <span style={{ color: meta.color }}>
                          <ElementEmblem element={el} size={14} />
                        </span>
                        {meta.name}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-stone-300 leading-snug">
                  Balance Rule: {balanceProfile.summary}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-stone-300">
                <div className="font-semibold text-amber-300">Frontier Journey Overview</div>
                <p className="text-stone-400 leading-relaxed">
                  Begin in Havenbrook Safe Village for basic training and 5-Silver merchant gear. Hunt Lv 1–4 monsters & the Lv 5 Moss Behemoth inside the Safe Jungle (up to Lv 7), then enter the Lv 5+ Elder Wilds to surpass Lv 7 and claim Top Rank armor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Single Dominant Primary CTA */}
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={handleStart}
            className="px-7 py-3 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-amber-500/15"
          >
            Enter Havenbrook Village
          </button>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="text-xs text-stone-300/90 tracking-wide text-center">
        WASD Move · Click or Space Attack · Q E R Skills · Shift Dash · F Interact · J Quests · C Gear · L Rankings · Esc Pause
      </div>
    </div>
  );
};
