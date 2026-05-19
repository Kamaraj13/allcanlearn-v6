import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 300, H = 200, GROUND = 160, DINO_W = 28, DINO_H = 36, GRAVITY = 0.6, JUMP_V = -12;

export default function DinoRun() {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('idle');
  const rafRef = useRef(null);

  const jump = useCallback(() => {
    const s = state.current;
    if (s && s.running && s.dino.vy === 0 && s.dino.onGround) {
      s.dino.vy = JUMP_V;
      s.dino.onGround = false;
    }
  }, []);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = {
      dino: { x: 40, y: GROUND - DINO_H, vy: 0, onGround: true },
      obstacles: [], speed: 4, score: 0, tick: 0, nextObs: 80, running: true, frame: 0,
    };
    setScore(0); setStatus('running');

    const loop = () => {
      const s = state.current;
      if (!s.running) return;
      const cv = canvasRef.current; if (!cv) return;
      const ctx = cv.getContext('2d');
      s.tick++;

      // dino physics
      s.dino.vy += GRAVITY;
      s.dino.y += s.dino.vy;
      if (s.dino.y >= GROUND - DINO_H) { s.dino.y = GROUND - DINO_H; s.dino.vy = 0; s.dino.onGround = true; }

      // speed up
      s.speed = 4 + s.score * 0.002;

      // obstacles
      s.nextObs--;
      if (s.nextObs <= 0) {
        const h = 24 + Math.random() * 28;
        s.obstacles.push({ x: W + 10, w: 16 + Math.random() * 12, h, y: GROUND - h });
        s.nextObs = 60 + Math.random() * 80;
      }
      s.obstacles.forEach(o => o.x -= s.speed);
      s.obstacles = s.obstacles.filter(o => o.x + o.w > 0);

      // score
      s.score++;
      if (s.tick % 6 === 0) setScore(Math.floor(s.score / 6));

      // collision
      const d = s.dino;
      for (const o of s.obstacles) {
        if (d.x + 4 < o.x + o.w && d.x + DINO_W - 4 > o.x && d.y + 4 < o.y + o.h && d.y + DINO_H - 4 > o.y) {
          s.running = false; setStatus('dead'); setScore(Math.floor(s.score / 6)); return;
        }
      }

      // draw sky
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#1a1a2e'); sky.addColorStop(1, '#16213e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // stars
      ctx.fillStyle = '#ffffff44';
      for (let i = 0; i < 20; i++) ctx.fillRect(((i * 73 + s.tick * 0.1) % W + W) % W, (i * 37) % (GROUND - 20), 1.5, 1.5);

      // ground
      ctx.fillStyle = '#4a3728'; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#6b5344'; ctx.fillRect(0, GROUND, W, 4);
      // ground dots
      ctx.fillStyle = '#3a2718';
      for (let i = 0; i < 8; i++) ctx.fillRect(((i * 47 + s.tick * s.speed * 0.5) % W + W) % W, GROUND + 8, 20, 3);

      // obstacles (cacti)
      ctx.fillStyle = '#2d7a2d';
      s.obstacles.forEach(o => {
        ctx.fillRect(o.x + o.w * 0.3, o.y, o.w * 0.4, o.h);
        ctx.fillRect(o.x, o.y + o.h * 0.3, o.w, o.h * 0.25);
        ctx.fillRect(o.x + o.w * 0.15, o.y + o.h * 0.2, o.w * 0.25, o.h * 0.15);
        ctx.fillRect(o.x + o.w * 0.6, o.y + o.h * 0.25, o.w * 0.25, o.h * 0.15);
      });

      // dino (pixel art style)
      const legFrame = s.dino.onGround ? (Math.floor(s.tick / 6) % 2) : 0;
      ctx.fillStyle = '#7C3AED';
      ctx.fillRect(d.x + 4, d.y, DINO_W - 8, DINO_H - 8);  // body
      ctx.fillRect(d.x + DINO_W - 8, d.y + 4, 10, 8);       // head
      ctx.fillStyle = '#EC4899'; ctx.fillRect(d.x + DINO_W - 4, d.y + 6, 3, 3); // eye
      ctx.fillStyle = '#5b21b6';
      if (legFrame === 0) { ctx.fillRect(d.x + 6, d.y + DINO_H - 10, 8, 10); ctx.fillRect(d.x + 16, d.y + DINO_H - 6, 8, 6); }
      else { ctx.fillRect(d.x + 6, d.y + DINO_H - 6, 8, 6); ctx.fillRect(d.x + 16, d.y + DINO_H - 10, 8, 10); }
      // tail
      ctx.fillStyle = '#7C3AED'; ctx.fillRect(d.x, d.y + 8, 6, 12);

      // score
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
      ctx.fillText(`${Math.floor(s.score / 6)}`, W - 60, 18);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (cv) { const ctx = cv.getContext('2d'); ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); }
    const onKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [jump]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#1a1a2e' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span>SCORE: {score}</span>
        <button onClick={start} style={{ background: '#7C3AED', border: 'none', color: '#fff', padding: '2px 12px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {status === 'idle' ? 'START' : 'RESTART'}
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #7C3AED', display: 'block', borderRadius: 4 }} />
      {status === 'dead' && <div style={{ color: '#EC4899', fontFamily: 'monospace', fontWeight: 700 }}>OUCH! Score: {score}</div>}
      <button onClick={jump} style={{ width: W, padding: 10, background: '#7C3AED', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
        JUMP 🦕 (Space / ↑)
      </button>
    </div>
  );
}
