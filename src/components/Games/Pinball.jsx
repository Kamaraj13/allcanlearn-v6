import React, { useRef, useEffect, useState, useCallback } from 'react';

const W = 280;
const H = 360;
const BALL_R = 8;
const PADDLE_W = 70;
const PADDLE_H = 10;
const PADDLE_Y = H - 28;
const PADDLE_SPEED = 18;

function makeBumpers() {
  return [
    { x: 80,  y: 80,  r: 18, lit: false, timer: 0 },
    { x: 200, y: 80,  r: 18, lit: false, timer: 0 },
    { x: 60,  y: 170, r: 18, lit: false, timer: 0 },
    { x: 140, y: 140, r: 18, lit: false, timer: 0 },
    { x: 220, y: 170, r: 18, lit: false, timer: 0 },
    { x: 140, y: 240, r: 18, lit: false, timer: 0 },
  ];
}

export function Pinball() {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const rafRef    = useRef(null);
  const [score, setScore]   = useState(0);
  const [lives, setLives]   = useState(3);
  const [dead, setDead]     = useState(false);
  const [started, setStarted] = useState(false);

  const initState = useCallback(() => ({
    ball:    { x: W / 2, y: H / 2, vx: 3, vy: -4 },
    leftPaddle:  { x: 20,           y: PADDLE_Y, moving: null },
    rightPaddle: { x: W - 20 - PADDLE_W, y: PADDLE_Y, moving: null },
    bumpers: makeBumpers(),
    score: 0,
    lives: 3,
    running: true,
  }), []);

  const drawFrame = useCallback((ctx, s) => {
    // Background
    ctx.fillStyle = '#08080F';
    ctx.fillRect(0, 0, W, H);

    // Side walls glow
    ctx.strokeStyle = 'rgba(124,58,237,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Bumpers
    s.bumpers.forEach(b => {
      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      if (b.lit) {
        grd.addColorStop(0, 'rgba(236,72,153,0.9)');
        grd.addColorStop(1, 'rgba(124,58,237,0.2)');
      } else {
        grd.addColorStop(0, 'rgba(124,58,237,0.6)');
        grd.addColorStop(1, 'rgba(124,58,237,0.05)');
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      if (b.lit) {
        ctx.shadowColor = '#EC4899';
        ctx.shadowBlur  = 16;
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }
    });

    // Paddles
    const drawPaddle = (p) => {
      const grd = ctx.createLinearGradient(p.x, p.y, p.x + PADDLE_W, p.y + PADDLE_H);
      grd.addColorStop(0, '#7C3AED');
      grd.addColorStop(1, '#EC4899');
      ctx.fillStyle = grd;
      ctx.shadowColor = '#7C3AED';
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, PADDLE_W, PADDLE_H, 5);
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    drawPaddle(s.leftPaddle);
    drawPaddle(s.rightPaddle);

    // Ball
    const bg = ctx.createRadialGradient(s.ball.x, s.ball.y, 0, s.ball.x, s.ball.y, BALL_R);
    bg.addColorStop(0, '#fff');
    bg.addColorStop(1, 'rgba(200,180,255,0.7)');
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur  = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const update = useCallback((s) => {
    if (!s.running) return;
    const { ball, leftPaddle, rightPaddle, bumpers } = s;

    // Move paddles
    if (leftPaddle.moving === 'left')  leftPaddle.x = Math.max(0, leftPaddle.x - PADDLE_SPEED);
    if (leftPaddle.moving === 'right') leftPaddle.x = Math.min(W / 2 - PADDLE_W, leftPaddle.x + PADDLE_SPEED);
    if (rightPaddle.moving === 'left')  rightPaddle.x = Math.max(W / 2, rightPaddle.x - PADDLE_SPEED);
    if (rightPaddle.moving === 'right') rightPaddle.x = Math.min(W - PADDLE_W, rightPaddle.x + PADDLE_SPEED);

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounces
    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

    // Paddle collision
    const paddles = [leftPaddle, rightPaddle];
    for (const p of paddles) {
      if (
        ball.y + BALL_R > p.y &&
        ball.y - BALL_R < p.y + PADDLE_H &&
        ball.x > p.x &&
        ball.x < p.x + PADDLE_W &&
        ball.vy > 0
      ) {
        ball.vy = -(Math.abs(ball.vy) + 0.1);
        const offset = (ball.x - (p.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        ball.vx = offset * 5;
        // cap speed
        const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        if (speed > 10) { ball.vx = (ball.vx / speed) * 10; ball.vy = (ball.vy / speed) * 10; }
      }
    }

    // Bumper collisions
    bumpers.forEach(b => {
      const dx = ball.x - b.x;
      const dy = ball.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_R + b.r) {
        const nx = dx / dist;
        const ny = dy / dist;
        const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        ball.vx = nx * (speed + 1);
        ball.vy = ny * (speed + 1);
        // push out
        ball.x = b.x + nx * (BALL_R + b.r + 1);
        ball.y = b.y + ny * (BALL_R + b.r + 1);
        b.lit   = true;
        b.timer = 12;
        s.score += 10;
        setScore(s.score);
      }
      if (b.timer > 0) {
        b.timer--;
        if (b.timer === 0) b.lit = false;
      }
    });

    // Ball lost
    if (ball.y - BALL_R > H) {
      s.lives--;
      setLives(s.lives);
      if (s.lives <= 0) {
        s.running = false;
        setDead(true);
      } else {
        // reset ball
        ball.x = W / 2; ball.y = H / 2;
        ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
        ball.vy = -4;
      }
    }
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    if (!s) return;
    update(s);
    drawFrame(ctx, s);
    rafRef.current = requestAnimationFrame(loop);
  }, [update, drawFrame]);

  // Keyboard handling
  useEffect(() => {
    const down = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === 'ArrowLeft')  { s.leftPaddle.moving  = 'left';  e.preventDefault(); }
      if (e.key === 'ArrowRight') { s.rightPaddle.moving = 'right'; e.preventDefault(); }
      if (e.key === 'z' || e.key === 'Z') { s.leftPaddle.moving  = 'right'; }
      if (e.key === 'x' || e.key === 'X') { s.leftPaddle.moving  = 'left';  }
    };
    const up = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === 'ArrowLeft')  { if (s.leftPaddle.moving  === 'left')  s.leftPaddle.moving  = null; }
      if (e.key === 'ArrowRight') { if (s.rightPaddle.moving === 'right') s.rightPaddle.moving = null; }
      if (e.key === 'z' || e.key === 'Z') { if (s.leftPaddle.moving  === 'right') s.leftPaddle.moving  = null; }
      if (e.key === 'x' || e.key === 'X') { if (s.leftPaddle.moving  === 'left')  s.leftPaddle.moving  = null; }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const startGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const s = initState();
    stateRef.current = s;
    setScore(0); setLives(3); setDead(false); setStarted(true);
    rafRef.current = requestAnimationFrame(loop);
  }, [initState, loop]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Touch paddle controls
  const touchLeft  = (dir) => { if (stateRef.current) stateRef.current.leftPaddle.moving  = dir; };
  const touchRight = (dir) => { if (stateRef.current) stateRef.current.rightPaddle.moving = dir; };
  const stopLeft   = ()    => { if (stateRef.current) stateRef.current.leftPaddle.moving  = null; };
  const stopRight  = ()    => { if (stateRef.current) stateRef.current.rightPaddle.moving = null; };

  const btnStyle = (color = 'var(--accent)') => ({
    padding: '8px 14px',
    borderRadius: '8px',
    background: `${color}22`,
    border: `1px solid ${color}44`,
    color: color,
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
    }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: `${W}px` }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>SCORE </span>
          <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{score}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: i < lives ? '#EC4899' : 'var(--surface3)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            borderRadius: '12px',
            border: '1px solid var(--border-h)',
            display: 'block',
          }}
        />

        {/* Overlay: start or game over */}
        {(!started || dead) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8,8,15,0.85)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {dead && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💥</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Game Over</div>
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.5rem' }}>{score}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>points scored</div>
              </div>
            )}
            {!started && !dead && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎱</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Pinball</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px', lineHeight: 1.4, padding: '0 20px' }}>
                  Arrow keys or touch buttons to move paddles. Hit bumpers for +10pts!
                </div>
              </div>
            )}
            <button
              onClick={startGame}
              style={{
                padding: '10px 28px',
                borderRadius: '10px',
                background: 'var(--gradient)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              }}
            >
              {dead ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>

      {/* Touch controls */}
      {started && !dead && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: `${W}px`,
        }}>
          {/* Left paddle */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={btnStyle()}
              onMouseDown={() => touchLeft('left')} onMouseUp={stopLeft} onTouchStart={() => touchLeft('left')} onTouchEnd={stopLeft}
            >◀</button>
            <button
              style={btnStyle()}
              onMouseDown={() => touchLeft('right')} onMouseUp={stopLeft} onTouchStart={() => touchLeft('right')} onTouchEnd={stopLeft}
            >▶</button>
          </div>
          {/* Right paddle */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={btnStyle('var(--accent2)')}
              onMouseDown={() => touchRight('left')} onMouseUp={stopRight} onTouchStart={() => touchRight('left')} onTouchEnd={stopRight}
            >◀</button>
            <button
              style={btnStyle('var(--accent2)')}
              onMouseDown={() => touchRight('right')} onMouseUp={stopRight} onTouchStart={() => touchRight('right')} onTouchEnd={stopRight}
            >▶</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pinball;
