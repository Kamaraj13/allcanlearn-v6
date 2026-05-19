import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Hash, Circle } from 'lucide-react';
import TicTacToe from '../components/Games/TicTacToe';
import Pinball from '../components/Games/Pinball';

const TABS = [
  { id: 'tictactoe', label: 'Tic Tac Toe', icon: Hash,   emoji: '⭕' },
  { id: 'pinball',   label: 'Pinball',     icon: Circle, emoji: '🎱' },
];

export function Games() {
  const [active, setActive] = useState('tictactoe');

  return (
    <div style={{ minHeight: '100vh', padding: '48px 32px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '40px' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 14px', borderRadius: '999px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
          marginBottom: '16px', letterSpacing: '0.04em',
        }}>
          <Gamepad2 size={12} /> ARCADE
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Games</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Play while you listen — or just for fun.
        </p>
      </motion.div>

      {/* Tab switcher */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px',
              background: active === tab.id ? 'var(--gradient)' : 'var(--surface2)',
              border: `1px solid ${active === tab.id ? 'transparent' : 'var(--border)'}`,
              color: active === tab.id ? '#fff' : 'var(--muted)',
              fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: active === tab.id ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Game content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        {active === 'tictactoe' && <TicTacToe />}
        {active === 'pinball'   && <Pinball />}
      </motion.div>

    </div>
  );
}

export default Games;
