import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 300, H = 320, PW = 40, PH = 8, BULLET_SPEED = 7, ALIEN_ROWS = 4, ALIEN_COLS = 8;

function makeAliens() {
  const aliens = [];
  for (let r = 0; r < ALIEN_ROWS; r++)
    for (let c = 0; c < ALIEN_COLS; c++)
      aliens.push({ x: 20 + c * 32, y: 30 + r * 28, alive: true, row: r });
  return aliens;
}

function drawAlien(ctx, x, y, row) {
  const colors = ['#ff2255','#ff8800','#ffee00','#00aaff'];
  ctx.fillStyle = colors[row % colors.length];
  // body
  ctx.fillRect(x + 4, y + 4, 16, 12);
  // eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 6, y + 7, 3, 3);
  ctx.fillRect(x + 15, y + 7, 3, 3);
  // antennae
  ctx.fillStyle = colors[row % colors.length];
  ctx.fillRect(x + 5, y + 1, 2, 4);
  ctx.fillRect(x + 17, y + 1, 2, 4);
  // legs
  ctx.fillRect(x + 3, y + 15, 3, 4);
  ctx.fillRect(x + 18, y + 15, 3, 4);
}

export default function SpaceInvaders() {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState('idle');
  const rafRef = useRef(null);
  const keys = useRef({});

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = {
      player: { x: W / 2 - PW / 2, y: H - 24 },
      bullets: [], alienBullets: [],
      aliens: makeAliens(),
      alienDir: 1, alienSpeed: 0.4, alienTick: 0,
      score: 0, lives: 3, running: true,
    };
    setScore(0); setLives(3); setStatus('running');

    const loop = () => {
      const s = state.current;
      if (!s.running) return;
      const cv = canvasRef.current; if (!cv) return;
      const ctx = cv.getContext('2d');

      // player move
      if (keys.current['ArrowLeft'])  s.player.x = Math.max(0, s.player.x - 3.5);
      if (keys.current['ArrowRight']) s.player.x = Math.min(W - PW, s.player.x + 3.5);

      // move bullets
      s.bullets = s.bullets.filter(b => b.y > 0);
      s.bullets.forEach(b => b.y -= BULLET_SPEED);
      s.alienBullets = s.alienBullets.filter(b => b.y < H);
      s.alienBullets.forEach(b => b.y += 3);

      // move aliens
      s.alienTick++;
      const liveAliens = s.aliens.filter(a => a.alive);
      if (liveAliens.length === 0) { s.running = false; setStatus('won'); return; }
      const speed = s.alienSpeed + (1 - liveAliens.length / (ALIEN_ROWS * ALIEN_COLS)) * 1.5;
      if (s.alienTick % Math.max(2, Math.floor(12 / speed)) === 0) {
        const minX = Math.min(...liveAliens.map(a => a.x));
        const maxX = Math.max(...liveAliens.map(a => a.x + 24));
        if ((s.alienDir > 0 && maxX >= W - 4) || (s.alienDir < 0 && minX <= 4)) {
          s.aliens.forEach(a => { if (a.alive) a.y += 14; });
          s.alienDir *= -1;
        } else {
          s.aliens.forEach(a => { if (a.alive) a.x += s.alienDir * 8; });
        }
      }

      // alien shoot
      if (Math.random() < 0.008 && liveAliens.length > 0) {
        const shooter = liveAliens[Math.floor(Math.random() * liveAliens.length)];
        s.alienBullets.push({ x: shooter.x + 12, y: shooter.y + 20 });
      }

      // bullet-alien collision
      s.bullets.forEach(b => {
        s.aliens.forEach(a => {
          if (a.alive && b.x > a.x && b.x < a.x + 24 && b.y > a.y && b.y < a.y + 20) {
            a.alive = false; b.y = -100; s.score += 10 * (4 - a.row);
            setScore(s.score);
          }
        });
      });

      // alien bullet hit player
      s.alienBullets.forEach(b => {
        if (b.x > s.player.x && b.x < s.player.x + PW && b.y > s.player.y && b.y < s.player.y + PH) {
          b.y = H + 10; s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) { s.running = false; setStatus('dead'); return; }
        }
      });

      // aliens reach bottom
      if (liveAliens.some(a => a.y + 20 >= s.player.y)) { s.running = false; setStatus('dead'); return; }

      // draw
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      // stars
      ctx.fillStyle = '#ffffff22';
      for (let i = 0; i < 30; i++) ctx.fillRect(((i * 97 + 13) % W), ((i * 113 + 7) % H), 1, 1);
      // aliens
      s.aliens.forEach(a => { if (a.alive) drawAlien(ctx, a.x, a.y, a.row); });
      // player
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(s.player.x, s.player.y, PW, PH);
      ctx.beginPath(); ctx.moveTo(s.player.x + PW/2, s.player.y - 10);
      ctx.lineTo(s.player.x + PW/2 - 8, s.player.y); ctx.lineTo(s.player.x + PW/2 + 8, s.player.y);
      ctx.fillStyle = '#00aaff'; ctx.fill();
      // bullets
      ctx.fillStyle = '#ffee00';
      s.bullets.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 10));
      ctx.fillStyle = '#ff2255';
      s.alienBullets.forEach(b => ctx.fillRect(b.x - 1, b.y, 3, 8));
      // lives
      ctx.fillStyle = '#00aaff'; ctx.font = '11px monospace';
      ctx.fillText('♥'.repeat(s.lives), 4, 14);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (cv) { const ctx = cv.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    const onDown = (e) => {
      keys.current[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (state.current?.running) {
          state.current.bullets.push({ x: state.current.player.x + PW / 2, y: state.current.player.y });
        }
      }
    };
    const onUp = (e) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const fire = () => {
    if (state.current?.running)
      state.current.bullets.push({ x: state.current.player.x + PW / 2, y: state.current.player.y });
  };
  const moveLeft  = () => { if (state.current?.running) state.current.player.x = Math.max(0, state.current.player.x - 20); };
  const moveRight = () => { if (state.current?.running) state.current.player.x = Math.min(W - PW, state.current.player.x + 20); };

  const btnS = { background: '#001133', border: '1px solid #00aaff', color: '#00aaff', borderRadius: 6, cursor: 'pointer', padding: '6px 12px', fontWeight: 700 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#000' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, color: '#fff', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span style={{ color: '#ffee00' }}>SCORE: {score}</span>
        <span style={{ color: '#ff2255' }}>{'♥'.repeat(lives)}</span>
        <button onClick={start} style={{ background: '#00aaff', border: 'none', color: '#000', padding: '2px 10px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {status === 'idle' ? 'START' : 'RESTART'}
        </button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #00aaff', display: 'block' }} />
      {status === 'dead' && <div style={{ color: '#ff2255', fontFamily: 'monospace', fontWeight: 700 }}>GAME OVER — {score} pts</div>}
      {status === 'won'  && <div style={{ color: '#00ee44', fontFamily: 'monospace', fontWeight: 700 }}>EARTH SAVED! 🛸 {score} pts</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={moveLeft}  style={btnS}>◀</button>
        <button onClick={fire}      style={{ ...btnS, background: '#ffee00', borderColor: '#ffee00', color: '#000', padding: '6px 20px' }}>🔫 FIRE</button>
        <button onClick={moveRight} style={btnS}>▶</button>
      </div>
    </div>
  );
}
