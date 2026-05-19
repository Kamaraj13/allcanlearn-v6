import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function aiMove(board) {
  const empty = board.map((v,i) => v ? null : i).filter(i => i !== null);
  if (!empty.length) return -1;

  // Win if possible
  for (const i of empty) {
    const b = [...board]; b[i] = 'O';
    if (checkWinner(b)?.winner === 'O') return i;
  }
  // Block
  for (const i of empty) {
    const b = [...board]; b[i] = 'X';
    if (checkWinner(b)?.winner === 'X') return i;
  }
  // Centre
  if (empty.includes(4)) return 4;
  // Corner
  const corners = [0,2,6,8].filter(c => empty.includes(c));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Random
  return empty[Math.floor(Math.random() * empty.length)];
}

export function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [score, setScore] = useState({ X: 0, O: 0, D: 0 });
  const [winResult, setWinResult] = useState(null);

  const handleClick = useCallback((i) => {
    if (board[i] || winResult || !xTurn) return;

    const b1 = [...board];
    b1[i] = 'X';
    const r1 = checkWinner(b1);

    if (r1) {
      setBoard(b1);
      setWinResult(r1);
      setScore(s => ({
        ...s,
        [r1.winner === 'draw' ? 'D' : r1.winner]: s[r1.winner === 'draw' ? 'D' : r1.winner] + 1,
      }));
      return;
    }

    setXTurn(false);

    // AI move
    setTimeout(() => {
      const ai = aiMove(b1);
      if (ai === -1) return;
      const b2 = [...b1];
      b2[ai] = 'O';
      const r2 = checkWinner(b2);
      setBoard(b2);
      if (r2) {
        setWinResult(r2);
        setScore(s => ({
          ...s,
          [r2.winner === 'draw' ? 'D' : r2.winner]: s[r2.winner === 'draw' ? 'D' : r2.winner] + 1,
        }));
      } else {
        setXTurn(true);
      }
    }, 320);
  }, [board, winResult, xTurn]);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setXTurn(true);
    setWinResult(null);
  }, []);

  const statusText = winResult
    ? winResult.winner === 'draw'
      ? "It's a draw!"
      : winResult.winner === 'X'
        ? 'You win! 🎉'
        : 'AI wins!'
    : xTurn ? 'Your turn (X)' : 'AI thinking…';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
    }}>
      {/* Score */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {[['You (X)', score.X, '#7C3AED'], ['Draw', score.D, 'var(--muted)'], ['AI (O)', score.O, '#EC4899']].map(([label, val, color]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: winResult
          ? winResult.winner === 'X' ? 'var(--green)' : winResult.winner === 'O' ? '#EF4444' : 'var(--muted)'
          : 'var(--text)',
        minHeight: '20px',
      }}>
        {statusText}
      </div>

      {/* Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        width: '240px',
      }}>
        {board.map((cell, i) => {
          const isWinCell = winResult?.line?.includes(i);
          return (
            <motion.button
              key={i}
              whileHover={!cell && !winResult ? { scale: 1.04 } : {}}
              whileTap={!cell && !winResult ? { scale: 0.96 } : {}}
              onClick={() => handleClick(i)}
              animate={isWinCell ? {
                scale: [1, 1.15, 0.95, 1.08],
                transition: { duration: 0.5 }
              } : {}}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '10px',
                background: isWinCell
                  ? cell === 'X'
                    ? 'rgba(124,58,237,0.35)'
                    : 'rgba(236,72,153,0.35)'
                  : 'var(--surface2)',
                border: `2px solid ${isWinCell ? (cell === 'X' ? 'var(--accent)' : 'var(--accent2)') : 'var(--border)'}`,
                fontSize: '1.75rem',
                fontWeight: 800,
                color: cell === 'X' ? 'var(--accent)' : cell === 'O' ? 'var(--accent2)' : 'transparent',
                cursor: cell || winResult ? 'default' : 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--surface2)',
          color: 'var(--muted)',
          border: '1px solid var(--border)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--muted)'; }}
      >
        <RotateCcw size={14} />
        New Game
      </button>
    </div>
  );
}

export default TicTacToe;
