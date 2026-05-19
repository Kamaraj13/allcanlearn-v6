import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ChevronLeft } from 'lucide-react';
import TicTacToe     from '../components/Games/TicTacToe';
import Pinball       from '../components/Games/Pinball';
import Snake         from '../components/Games/Snake';
import Tetris        from '../components/Games/Tetris';
import Breakout      from '../components/Games/Breakout';
import SpaceInvaders from '../components/Games/SpaceInvaders';
import DinoRun       from '../components/Games/DinoRun';
import Pong          from '../components/Games/Pong';
import Game2048      from '../components/Games/Game2048';
import MemoryMatch   from '../components/Games/MemoryMatch';

const GAMES = [
  { id: 'snake',    label: 'Snake',         emoji: '🐍', component: Snake,         color: '#39ff14', desc: 'Eat, grow, survive' },
  { id: 'tetris',   label: 'Tetris',         emoji: '🟦', component: Tetris,        color: '#7C3AED', desc: 'Stack the blocks' },
  { id: 'breakout', label: 'Breakout',       emoji: '🧱', component: Breakout,      color: '#EC4899', desc: 'Smash the bricks' },
  { id: 'invaders', label: 'Space Invaders', emoji: '👾', component: SpaceInvaders, color: '#00aaff', desc: 'Defend Earth' },
  { id: 'dino',     label: 'Dino Run',       emoji: '🦕', component: DinoRun,       color: '#a78bfa', desc: 'Jump the cacti' },
  { id: 'pong',     label: 'Pong',           emoji: '🏓', component: Pong,          color: '#f472b6', desc: 'vs the CPU' },
  { id: '2048',     label: '2048',           emoji: '🔢', component: Game2048,      color: '#fb923c', desc: 'Merge to 2048' },
  { id: 'memory',   label: 'Memory Match',   emoji: '🃏', component: MemoryMatch,   color: '#34d399', desc: 'Flip & match' },
  { id: 'tictactoe',label: 'Tic Tac Toe',   emoji: '⭕', component: TicTacToe,     color: '#f0f000', desc: 'Three in a row' },
  { id: 'pinball',  label: 'Pinball',        emoji: '🎱', component: Pinball,       color: '#ff8800', desc: 'Keep it up' },
];

export function Games() {
  const [activeId, setActiveId] = useState(null);
  const activeGame = GAMES.find(g => g.id === activeId);
  const GameComp   = activeGame?.component || null;

  return (
    <div style={{ minHeight: '100vh', padding: '48px 32px', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '36px' }}>
        {activeGame ? (
          <button
            onClick={() => setActiveId(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, marginBottom: 16 }}
          >
            <ChevronLeft size={16} /> Back to Arcade
          </button>
        ) : null}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '999px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '16px', letterSpacing: '0.04em' }}>
          <Gamepad2 size={12} /> ARCADE — {GAMES.length} GAMES
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>
          {activeGame ? `${activeGame.emoji} ${activeGame.label}` : 'Games'}
        </h1>
        {!activeGame && <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>1990s classics — play while you listen.</p>}
      </motion.div>

      {/* Game picker */}
      {!activeGame && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '14px' }}
        >
          {GAMES.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setActiveId(g.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                padding: '16px', borderRadius: '14px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.boxShadow = `0 4px 20px ${g.color}33`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: '2.2rem' }}>{g.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{g.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>{g.desc}</div>
              </div>
              <div style={{ width: '100%', height: '3px', borderRadius: '99px', background: `${g.color}55`, marginTop: 4 }}>
                <div style={{ width: '40%', height: '100%', borderRadius: '99px', background: g.color }} />
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Active game */}
      {GameComp && (
        <motion.div
          key={activeId}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', display: 'inline-block' }}
        >
          <GameComp />
        </motion.div>
      )}
    </div>
  );
}

export default Games;
