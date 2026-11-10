import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { ActiveModalType, Modals } from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { sound } from './game/audio';
import { GameEngine } from './game/engine';
import { renderGame } from './game/renderer';
import { HudSnapshot, PlayerConfig } from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  const [snap, setSnap] = useState<HudSnapshot>(() => engineRef.current!.getSnapshot());
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const activeModalRef = useRef<ActiveModalType>(null);

  useEffect(() => {
    activeModalRef.current = activeModal;
    // Clear held inputs whenever opening a modal
    if (activeModal && engineRef.current) {
      const inp = engineRef.current.input;
      inp.up = false;
      inp.down = false;
      inp.left = false;
      inp.right = false;
      inp.mouseDown = false;
    }
  }, [activeModal]);

  const handleInteractNpc = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const npc = engine.getNearbyNpc();
    if (!npc) return;

    if (npc.role === 'merchant') {
      engine.markVisitedMerchant();
      setActiveModal('merchant');
    } else if (npc.role === 'trainer') {
      setActiveModal('trainer');
    } else if (npc.role === 'ranking') {
      setActiveModal('ranking');
    } else if (npc.role === 'quest_village' || npc.role === 'quest_jungle') {
      setActiveModal('quests');
    } else if (npc.role === 'healer') {
      engine.player.hp = engine.player.maxHp;
      engine.player.mp = engine.player.maxMp;
      sound.playCoin();
      engine.pushNotification('Sanctuary Fountain restored full HP & Mana!', 'info');
      engine.emitSnapshot();
    } else if (npc.role === 'gatekeeper') {
      engine.pushNotification(
        engine.player.level >= 5
          ? 'Elder Gate Warden: You are Lv 5+ — the Elder Wilds await beyond the gate!'
          : 'Elder Gate Warden: Reach Level 5 inside the Safe Jungle to unlock the Elder Wilds!',
        engine.player.level >= 5 ? 'info' : 'danger'
      );
      engine.emitSnapshot();
    }
  }, []);

  // Main 60fps Game Loop & Canvas Sizing
  useEffect(() => {
    const engine = engineRef.current!;
    engine.setSnapshotListener(setSnap);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setViewport(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      // Pause world combat ticks only when game screen is PAUSED or DEFEATED (or modal open in village)
      if (!activeModalRef.current || engine.screen === 'TITLE') {
        engine.update(dt);
      }
      renderGame(ctx, engine, window.innerWidth, window.innerHeight);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Keyboard & Blur Input Handling
  useEffect(() => {
    const engine = engineRef.current!;

    const clearHeld = () => {
      engine.input.up = false;
      engine.input.down = false;
      engine.input.left = false;
      engine.input.right = false;
      engine.input.mouseDown = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (engine.screen === 'TITLE') return;

      const key = e.key.toLowerCase();

      if (key === 'escape') {
        e.preventDefault();
        if (activeModalRef.current) {
          setActiveModal(null);
        } else if (engine.screen === 'PLAYING') {
          clearHeld();
          engine.screen = 'PAUSED';
          engine.emitSnapshot();
        } else if (engine.screen === 'PAUSED') {
          engine.screen = 'PLAYING';
          engine.emitSnapshot();
        }
        return;
      }

      if (engine.screen !== 'PLAYING') return;

      if (key === 'j') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'quests' ? null : 'quests'));
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'character' ? null : 'character'));
        return;
      }
      if (key === 'l') {
        e.preventDefault();
        setActiveModal((prev) => (prev === 'ranking' ? null : 'ranking'));
        return;
      }

      if (activeModalRef.current) return;

      if (key === 'w' || key === 'arrowup') engine.input.up = true;
      else if (key === 's' || key === 'arrowdown') engine.input.down = true;
      else if (key === 'a' || key === 'arrowleft') engine.input.left = true;
      else if (key === 'd' || key === 'arrowright') engine.input.right = true;
      else if (key === ' ') {
        e.preventDefault();
        engine.triggerSkill('LMB');
      } else if (key === 'q') engine.triggerSkill('Q');
      else if (key === 'e') engine.triggerSkill('E');
      else if (key === 'r') engine.triggerSkill('R');
      else if (key === 'shift') engine.triggerSkill('SHIFT');
      else if (key === 'h') engine.usePotion();
      else if (key === 'f') handleInteractNpc();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') engine.input.up = false;
      else if (key === 's' || key === 'arrowdown') engine.input.down = false;
      else if (key === 'a' || key === 'arrowleft') engine.input.left = false;
      else if (key === 'd' || key === 'arrowright') engine.input.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [handleInteractNpc]);

  const handleStartGame = (config: PlayerConfig) => {
    setActiveModal(null);
    engineRef.current?.startNewGame(config);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d1310]">
      {/* Isolated 60fps Canvas Container */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onMouseMove={(e) => {
          if (!engineRef.current) return;
          engineRef.current.input.mouseX = e.clientX;
          engineRef.current.input.mouseY = e.clientY;
        }}
        onMouseDown={(e) => {
          if (!engineRef.current || activeModal || snap.screen !== 'PLAYING') return;
          if (e.button === 0) {
            engineRef.current.input.mouseX = e.clientX;
            engineRef.current.input.mouseY = e.clientY;
            engineRef.current.input.mouseDown = true;
            engineRef.current.triggerSkill('LMB');
          }
        }}
        onMouseUp={() => {
          if (engineRef.current) engineRef.current.input.mouseDown = false;
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {snap.screen === 'TITLE' && <TitleScreen onStart={handleStartGame} />}

      {snap.screen !== 'TITLE' && (
        <GameHUD
          snap={snap}
          onOpenModal={(m) => {
            if (m === 'merchant') engineRef.current?.markVisitedMerchant();
            setActiveModal(m);
          }}
          onToggleMute={() => {
            sound.toggleMute();
            engineRef.current?.emitSnapshot();
          }}
          onPause={() => {
            if (engineRef.current) {
              engineRef.current.screen = 'PAUSED';
              engineRef.current.emitSnapshot();
            }
          }}
          onUsePotion={() => engineRef.current?.usePotion()}
          onTriggerSkill={(k) => engineRef.current?.triggerSkill(k)}
          onClaimQuest={(uid) => engineRef.current?.claimDynamicQuest(uid)}
          onInteractNpc={handleInteractNpc}
        />
      )}

      <Modals
        modal={activeModal}
        snap={snap}
        onClose={() => setActiveModal(null)}
        onBuyItem={(id) => engineRef.current!.buyMerchantItem(id)}
        onCraftItem={(id) => engineRef.current!.craftItem(id)}
        onEquipItem={(id) => engineRef.current?.equipItem(id)}
        onAcceptQuest={(uid) => engineRef.current?.acceptDynamicQuest(uid)}
        onAbandonQuest={(uid) => engineRef.current?.abandonDynamicQuest(uid)}
        onClaimQuest={(uid) => engineRef.current?.claimDynamicQuest(uid)}
        onRefreshQuests={() => {
          engineRef.current?.refreshAvailableQuests();
          engineRef.current?.emitSnapshot();
        }}
        onClaimRankReward={(threshold) => engineRef.current?.claimRankReward(threshold)}
        onCompleteTraining={() => engineRef.current?.completeTraining()}
        onResume={() => {
          if (engineRef.current) {
            engineRef.current.screen = 'PLAYING';
            engineRef.current.emitSnapshot();
          }
        }}
        onRespawnVillage={() => {
          setActiveModal(null);
          engineRef.current?.respawnInVillage();
        }}
        onReturnTitle={() => {
          setActiveModal(null);
          if (engineRef.current) {
            engineRef.current.screen = 'TITLE';
            engineRef.current.emitSnapshot();
          }
        }}
      />
    </div>
  );
}
