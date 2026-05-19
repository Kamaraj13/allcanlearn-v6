import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, Minus, GripHorizontal, ChevronLeft } from 'lucide-react';
import TicTacToe    from './TicTacToe';
import Pinball      from './Pinball';
import Snake        from './Snake';
import Tetris       from './Tetris';
import Breakout     from './Breakout';
import SpaceInvaders from './SpaceInvaders';
import DinoRun      from './DinoRun';
import Pong         from './Pong';
import Game2048     from './Game2048';
import MemoryMatch  from './MemoryMatch';

const GAMES = [
  { id: 'snake',    label: 'Snake',          emoji: '🐍', component: Snake,         color: '#39ff14' },
  { id: 'tetris',   label: 'Tetris',          emoji: '🟦', component: Tetris,        color: '#7C3AED' },
  { id: 'breakout', label: 'Breakout',        emoji: '🧱', component: Breakout,      color: '#EC4899' },
  { id: 'invaders', label: 'Space Invaders',  emoji: '👾', component: SpaceInvaders, color: '#00aaff' },
  { id: 'dino',     label: 'Dino Run',        emoji: '🦕', component: DinoRun,       color: '#a78bfa' },
  { id: 'pong',     label: 'Pong',            emoji: '🏓', component: Pong,          color: '#f472b6' },
  { id: '2048',     label: '2048',            emoji: '🔢', component: Game2048,      color: '#fb923c' },
  { id: 'memory',   label: 'Memory Match',    emoji: '🃏', component: MemoryMatch,   color: '#34d399' },
  { id: 'tictactoe',label: 'Tic Tac Toe',    emoji: '⭕', component: TicTacToe,     color: '#f0f000' },
  { id: 'pinball',  label: 'Pinball',         emoji: '🎱', component: Pinball,       color: '#ff8800' },
];

export function FloatingGame({ bottomOffset = 20 }) {
  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeId,  setActiveId]  = useState(null); // null = picker

  const activeGame = GAMES.find(g => g.id === activeId);
  const GameComp   = activeGame?.component || null;

  return (
    <>
      {/* Trigger pill */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen(o => !o); setMinimized(false); }}
        title="Arcade"
        style={{
          position: 'fixed', bottom: bottomOffset, right: '84px',
          width: '52px', height: '52px', borderRadius: '50%',
          background: open ? 'var(--surface3)' : 'linear-gradient(135deg,#10B981,#0ea5e9)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, boxShadow: '0 4px 24px rgba(16,185,129,0.45)',
          cursor: 'pointer', border: '1px solid var(--border)', transition: 'bottom 0.3s',
        }}
      >
        {open ? <X size={20} /> : <Gamepad2 size={22} />}
      </motion.button>

      {/* Draggable game window */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag dragMomentum={false} dragElastic={0}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.9,  y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed', bottom: '160px', right: '84px',
              width: activeGame ? '340px' : '320px',
              background: 'var(--surface)', border: '1px solid var(--border-h)',
              borderRadius: '16px', zIndex: 199, display: 'flex',
              flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)', userSelect: 'none',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--surface2)', cursor: 'grab',
              borderBottom: minimized ? 'none' : '1px solid var(--border)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GripHorizontal size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                {activeGame && (
                  <button
                    onClick={e => { e.stopPropagation(); setActiveId(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Back to arcade"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <span style={{ fontSize: '1rem' }}>{activeGame ? activeGame.emoji : '🕹️'}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  {activeGame ? activeGame.label : 'Arcade'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={e => { e.stopPropagation(); setMinimized(m => !m); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <Minus size={15} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setOpen(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{    height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Game picker grid */}
                  {!activeGame && (
                    <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                      {GAMES.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setActiveId(g.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px',
                            background: 'var(--surface2)', border: `1px solid var(--border)`,
                            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.background = `${g.color}18`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)'; }}
                        >
                          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{g.emoji}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{g.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active game */}
                  {GameComp && (
                    <div style={{ maxHeight: '480px', overflowY: 'auto', overflowX: 'hidden' }}>
                      <GameComp />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingGame;
