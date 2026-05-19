import React, { useState, useCallback, useEffect, useRef } from 'react';

const SIZE = 4;
const COLORS = {
  0: ['#1a1a2e', '#333'],
  2: ['#3b1f5e', '#a78bfa'], 4: ['#1e3a5f', '#60a5fa'],
  8: ['#1a4731', '#34d399'], 16: ['#4a1d1d', '#f87171'],
  32: ['#4a2d0a', '#fb923c'], 64: ['#4a0a2d', '#f472b6'],
  128: ['#2d4a0a', '#a3e635'], 256: ['#0a2d4a', '#38bdf8'],
  512: ['#3d0a4a', '#c084fc'], 1024: ['#4a0a0a', '#fca5a5'],
  2048: ['#0a4a0a', '#86efac'],
};

function emptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

function addRandom(grid) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) empty.push([r, c]);
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const g = grid.map(row => [...row]);
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

function slideRow(row) {
  let nums = row.filter(v => v); let score = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) { nums[i] *= 2; score += nums[i]; nums.splice(i + 1, 1); }
  }
  while (nums.length < SIZE) nums.push(0);
  return { row: nums, score };
}

function move(grid, dir) {
  let g = grid.map(r => [...r]);
  let totalScore = 0;
  if (dir === 'L') {
    g = g.map(row => { const { row: r, score } = slideRow(row); totalScore += score; return r; });
  } else if (dir === 'R') {
    g = g.map(row => { const { row: r, score } = slideRow([...row].reverse()); totalScore += score; return r.reverse(); });
  } else if (dir === 'U') {
    for (let c = 0; c < SIZE; c++) {
      const col = g.map(r => r[c]);
      const { row: r, score } = slideRow(col); totalScore += score;
      r.forEach((v, ri) => g[ri][c] = v);
    }
  } else if (dir === 'D') {
    for (let c = 0; c < SIZE; c++) {
      const col = g.map(r => r[c]).reverse();
      const { row: r, score } = slideRow(col); totalScore += score;
      r.reverse().forEach((v, ri) => g[ri][c] = v);
    }
  }
  return { grid: g, score: totalScore };
}

function canMove(grid) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!grid[r][c]) return true;
    if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
    if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
  }
  return false;
}

function gridsEqual(a, b) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

export default function Game2048() {
  const [grid, setGrid] = useState(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState('playing');

  const doMove = useCallback((dir) => {
    setGrid(prev => {
      if (status === 'lost') return prev;
      const { grid: next, score: pts } = move(prev, dir);
      if (gridsEqual(prev, next)) return prev;
      const withNew = addRandom(next);
      setScore(s => { const ns = s + pts; setBest(b => Math.max(b, ns)); return ns; });
      if (!canMove(withNew)) setStatus('lost');
      if (withNew.flat().includes(2048)) setStatus('won');
      return withNew;
    });
  }, [status]);

  const restart = () => {
    setGrid(addRandom(addRandom(emptyGrid())));
    setScore(0); setStatus('playing');
  };

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doMove]);

  // Swipe support
  const touchStart = useRef(null);
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'R' : 'L');
    else doMove(dy > 0 ? 'D' : 'U');
    touchStart.current = null;
  };
  const btnS = (dir) => ({
    padding: '8px 16px', background: '#1a1a2e', border: '1px solid #7C3AED',
    color: '#a78bfa', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
    onClick: () => doMove(dir),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 10, background: '#0d0d1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 280, fontFamily: 'monospace' }}>
        <div>
          <div style={{ color: '#888', fontSize: '0.65rem' }}>SCORE</div>
          <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>{score}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#888', fontSize: '0.65rem' }}>BEST</div>
          <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '1.1rem' }}>{best}</div>
        </div>
        <button onClick={restart} style={{ alignSelf: 'center', background: '#7C3AED', border: 'none', color: '#fff', padding: '4px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}>NEW</button>
      </div>

      <div
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 64px)`, gap: 6, background: '#1a0a3e', padding: 8, borderRadius: 12, border: '2px solid #7C3AED' }}
      >
        {grid.flat().map((val, i) => {
          const [bg, fg] = COLORS[Math.min(val, 2048)] || COLORS[2048];
          return (
            <div key={i} style={{
              width: 64, height: 64, borderRadius: 8, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: val >= 1000 ? '0.9rem' : val >= 100 ? '1.1rem' : '1.4rem',
              color: val ? fg : '#333', fontFamily: 'monospace',
              transition: 'background 0.1s',
            }}>
              {val || ''}
            </div>
          );
        })}
      </div>

      {status === 'won'  && <div style={{ color: '#86efac', fontFamily: 'monospace', fontWeight: 700 }}>🎉 YOU REACHED 2048!</div>}
      {status === 'lost' && <div style={{ color: '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>No more moves! Score: {score}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,44px)', gridTemplateRows: 'repeat(3,44px)', gap: 4 }}>
        {['', 'U', '', 'L', '', 'R', '', 'D', ''].map((d, i) =>
          d ? <button key={i} onClick={() => doMove(d)} style={{ background: '#1a1a2e', border: '1px solid #7C3AED', color: '#a78bfa', borderRadius: 8, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>
            {d === 'U' ? '↑' : d === 'D' ? '↓' : d === 'L' ? '←' : '→'}
          </button>
          : <div key={i} />
        )}
      </div>
    </div>
  );
}
