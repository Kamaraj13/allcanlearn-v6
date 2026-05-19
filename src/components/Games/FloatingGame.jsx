import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, X, Minus, GripHorizontal } from 'lucide-react';
import TicTacToe from './TicTacToe';
import Pinball from './Pinball';

const TABS = [
  { id: 'tictactoe', label: 'Tic Tac Toe', emoji: '⭕' },
  { id: 'pinball',   label: 'Pinball',     emoji: '🎱' },
];

export function FloatingGame({ bottomOffset = 20 }) {
  const [open,       setOpen]       = useState(false);
  const [minimized,  setMinimized]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('tictactoe');

  return (
    <>
      {/* Trigger pill */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen(o => !o); setMinimized(false); }}
        title="Games"
        style={{
          position:     'fixed',
          bottom:       bottomOffset,
          right:        '84px',
          width:        '52px',
          height:       '52px',
          borderRadius: '50%',
          background:   open ? 'var(--surface3)' : 'linear-gradient(135deg,#10B981,#0ea5e9)',
          color:        '#fff',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          zIndex:       200,
          boxShadow:    '0 4px 24px rgba(16,185,129,0.45)',
          cursor:       'pointer',
          border:       '1px solid var(--border)',
          transition:   'bottom 0.3s',
        }}
      >
        {open ? <X size={20} /> : <Gamepad2 size={22} />}
      </motion.button>

      {/* Draggable game window */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.9,  y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position:     'fixed',
              bottom:       '160px',
              right:        '84px',
              width:        '320px',
              background:   'var(--surface)',
              border:       '1px solid var(--border-h)',
              borderRadius: '16px',
              zIndex:       199,
              display:      'flex',
              flexDirection:'column',
              overflow:     'hidden',
              boxShadow:    '0 8px 48px rgba(0,0,0,0.6)',
              userSelect:   'none',
            }}
          >
            {/* Drag handle header */}
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '10px 14px',
                background:     'var(--surface2)',
                cursor:         'grab',
                borderBottom:   minimized ? 'none' : '1px solid var(--border)',
                flexShrink:     0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GripHorizontal size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                <Gamepad2 size={15} color="#10B981" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Games</span>
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
                  {/* Tab switcher */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          flex:         1,
                          padding:      '9px 8px',
                          fontSize:     '0.8rem',
                          fontWeight:   600,
                          color:        activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                          background:   activeTab === tab.id ? 'var(--surface3)' : 'transparent',
                          borderBottom: activeTab === tab.id ? '2px solid #10B981' : '2px solid transparent',
                          border:       'none',
                          cursor:       'pointer',
                          transition:   'all 0.15s',
                        }}
                      >
                        {tab.emoji} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Game */}
                  <div style={{ maxHeight: '380px', overflow: 'auto' }}>
                    {activeTab === 'tictactoe' && <TicTacToe />}
                    {activeTab === 'pinball'   && <Pinball />}
                  </div>
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
