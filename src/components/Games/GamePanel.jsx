import React, { useState } from 'react';
import { Hash, Circle } from 'lucide-react';
import TicTacToe from './TicTacToe';
import Pinball from './Pinball';

const TABS = [
  { id: 'tictactoe', label: 'Tic Tac Toe', icon: Hash },
  { id: 'pinball',   label: 'Pinball',     icon: Circle },
];

export function GamePanel() {
  const [active, setActive] = useState('tictactoe');

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: active === id ? 'var(--text)' : 'var(--muted)',
              background: active === id ? 'var(--surface3)' : 'transparent',
              borderBottom: active === id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              borderRadius: 0,
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {active === 'tictactoe' && <TicTacToe />}
        {active === 'pinball'   && <Pinball />}
      </div>
    </div>
  );
}

export default GamePanel;
