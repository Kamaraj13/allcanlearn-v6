import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 300, H = 300, CELL = 15, COLS = W / CELL, ROWS = H / CELL;

function randFood(snake) {
  let pos;
  do { pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

export default function Snake() {
  const canvasRef = useRef(null);
  const state = useRef({
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: { x: 5, y: 5 }, score: 0, running: false, dead: false,
  });
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | running | dead
  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const s = state.current;
    ctx.fillStyle = '#001100'; ctx.fillRect(0, 0, W, H);
    // grid dots
    ctx.fillStyle = '#002200';
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++)
      ctx.fillRect(x * CELL + 7, y * CELL + 7, 1, 1);
    // food pulse handled by color
    ctx.fillStyle = '#ff2255';
    ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4);
    // snake
    s.snake.forEach((seg, i) => {
      const g = i === 0 ? '#39ff14' : `hsl(${130 - i * 2},100%,${40 - i * 0.5}%)`;
      ctx.fillStyle = g;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  const loop = useCallback((ts) => {
    const s = state.current;
    if (!s.running) return;
    const speed = Math.max(60, 130 - s.score * 3);
    if (ts - lastRef.current > speed) {
      lastRef.current = ts;
      s.dir = s.nextDir;
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        s.running = false; s.dead = true; setStatus('dead'); draw(); return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score++; setScore(s.score); s.food = randFood(s.snake);
      } else { s.snake.pop(); }
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = {
      snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: { x: 5, y: 5 }, score: 0, running: true, dead: false,
    };
    setScore(0); setStatus('running'); lastRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const steer = useCallback((label) => {
    const d = state.current.dir;
    if (label === '↑' && d.y !== 1)  state.current.nextDir = { x: 0, y: -1 };
    if (label === '↓' && d.y !== -1) state.current.nextDir = { x: 0, y: 1 };
    if (label === '←' && d.x !== 1)  state.current.nextDir = { x: -1, y: 0 };
    if (label === '→' && d.x !== -1) state.current.nextDir = { x: 1, y: 0 };
  }, []);

  useEffect(() => {
    draw();
    const onKey = (e) => {
      const map = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
      if (map[e.key]) { e.preventDefault(); steer(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw, steer]);

  const btnStyle = { background: '#002200', border: '1px solid #39ff14', color: '#39ff14', borderRadius: 6, cursor: 'pointer', fontSize: '1.1rem', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#001100' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, color: '#39ff14', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span>SCORE: {score}</span>
        <button onClick={start} style={{ background: '#39ff14', border: 'none', color: '#001100', padding: '2px 12px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {status === 'idle' ? 'START' : 'RESTART'}
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #39ff14', display: 'block' }} />
      {status === 'dead' && <div style={{ color: '#ff2255', fontFamily: 'monospace', fontWeight: 700 }}>GAME OVER — Score: {score}</div>}
      {status === 'idle' && <div style={{ color: '#39ff14', fontFamily: 'monospace', fontSize: '0.72rem', opacity: 0.7 }}>Arrow keys or D-pad below</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,36px)', gridTemplateRows: 'repeat(3,36px)', gap: 3 }}>
        {['', '↑', '', '←', '·', '→', '', '↓', ''].map((l, i) =>
          l && l !== '·' ? <button key={i} onClick={() => steer(l)} style={btnStyle}>{l}</button>
            : <div key={i} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff1433', fontSize: '0.7rem' }}>{l}</div>
        )}
      </div>
    </div>
  );
}
