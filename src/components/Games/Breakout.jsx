import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 300, H = 320, PAD_W = 60, PAD_H = 8, BALL_R = 6;
const BRICK_COLS = 8, BRICK_ROWS = 5, BRICK_W = 34, BRICK_H = 14, BRICK_PAD = 2;
const BRICK_OFF_X = 4, BRICK_OFF_Y = 30;
const COLORS = ['#ff2255','#ff8800','#ffee00','#00ee44','#00aaff'];

function makeBricks() {
  return Array.from({ length: BRICK_ROWS }, (_, r) =>
    Array.from({ length: BRICK_COLS }, (_, c) => ({
      x: BRICK_OFF_X + c * (BRICK_W + BRICK_PAD),
      y: BRICK_OFF_Y + r * (BRICK_H + BRICK_PAD),
      alive: true,
      color: COLORS[r],
    }))
  );
}

export default function Breakout() {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('idle');
  const rafRef = useRef(null);

  const reset = useCallback((keepBricks = false) => {
    const s = state.current;
    s.ball = { x: W / 2, y: H - 60, vx: 3, vy: -4 };
    s.pad = { x: W / 2 - PAD_W / 2 };
    if (!keepBricks) { s.bricks = makeBricks(); s.score = 0; s.lives = 3; setScore(0); setLives(3); }
  }, []);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = { ball: null, pad: null, bricks: null, score: 0, lives: 3, running: true };
    reset(false);
    setStatus('running');
    const loop = () => {
      const s = state.current;
      if (!s.running) return;
      const cv = canvasRef.current; if (!cv) return;
      const ctx = cv.getContext('2d');

      // move ball
      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;

      // walls
      if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.vx *= -1; }
      if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.vx *= -1; }
      if (s.ball.y - BALL_R < 0) { s.ball.y = BALL_R; s.ball.vy *= -1; }

      // lost
      if (s.ball.y + BALL_R > H) {
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { s.running = false; setStatus('dead'); return; }
        reset(true);
      }

      // paddle collision
      const px = s.pad.x;
      if (s.ball.y + BALL_R >= H - 40 && s.ball.y + BALL_R <= H - 40 + PAD_H &&
        s.ball.x >= px && s.ball.x <= px + PAD_W) {
        s.ball.vy = -Math.abs(s.ball.vy);
        s.ball.vx += ((s.ball.x - (px + PAD_W / 2)) / (PAD_W / 2)) * 2;
      }

      // brick collisions
      let won = true;
      s.bricks.forEach(row => row.forEach(b => {
        if (!b.alive) return;
        won = false;
        if (s.ball.x + BALL_R > b.x && s.ball.x - BALL_R < b.x + BRICK_W &&
          s.ball.y + BALL_R > b.y && s.ball.y - BALL_R < b.y + BRICK_H) {
          b.alive = false;
          s.score += 10;
          setScore(s.score);
          s.ball.vy *= -1;
        }
      }));
      if (won) { s.running = false; setStatus('won'); return; }

      // draw
      ctx.fillStyle = '#020212'; ctx.fillRect(0, 0, W, H);
      // bricks
      s.bricks.forEach(row => row.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x, b.y, BRICK_W, 3);
      }));
      // paddle
      const grad = ctx.createLinearGradient(s.pad.x, 0, s.pad.x + PAD_W, 0);
      grad.addColorStop(0, '#7C3AED'); grad.addColorStop(1, '#EC4899');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(s.pad.x, H - 40, PAD_W, PAD_H, 4); ctx.fill();
      // ball
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      // lives
      ctx.fillStyle = '#EC4899'; ctx.font = '12px monospace';
      ctx.fillText('♥'.repeat(s.lives), 4, 16);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [reset]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (cv) { const ctx = cv.getContext('2d'); ctx.fillStyle = '#020212'; ctx.fillRect(0, 0, W, H); }
    const onMove = (e) => {
      if (!state.current?.running) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
      state.current.pad.x = Math.max(0, Math.min(W - PAD_W, x - PAD_W / 2));
    };
    const onKey = (e) => {
      if (!state.current?.running) return;
      if (e.key === 'ArrowLeft')  state.current.pad.x = Math.max(0, state.current.pad.x - 18);
      if (e.key === 'ArrowRight') state.current.pad.x = Math.min(W - PAD_W, state.current.pad.x + 18);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('keydown', onKey);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#020212' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span>SCORE: {score}</span>
        <span>{'♥'.repeat(lives)}</span>
        <button onClick={start} style={{ background: '#EC4899', border: 'none', color: '#fff', padding: '2px 10px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {status === 'idle' ? 'START' : 'RESTART'}
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #7C3AED', display: 'block', cursor: 'none' }} />
      {status === 'dead' && <div style={{ color: '#ff2255', fontFamily: 'monospace', fontWeight: 700 }}>GAME OVER — {score} pts</div>}
      {status === 'won'  && <div style={{ color: '#00ee44', fontFamily: 'monospace', fontWeight: 700 }}>YOU WIN! 🎉 {score} pts</div>}
      {status === 'idle' && <div style={{ color: '#888', fontFamily: 'monospace', fontSize: '0.72rem' }}>Move mouse over canvas to control paddle</div>}
    </div>
  );
}
