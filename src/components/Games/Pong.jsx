import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 300, H = 280, PW = 8, PH = 52, BALL_S = 5, SPEED = 4;

export default function Pong() {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const [scores, setScores] = useState([0, 0]);
  const [status, setStatus] = useState('idle');
  const rafRef = useRef(null);
  const mouseY = useRef(H / 2);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = {
      ball: { x: W / 2, y: H / 2, vx: SPEED * (Math.random() > 0.5 ? 1 : -1), vy: (Math.random() * 4 - 2) },
      pLeft:  { y: H / 2 - PH / 2 },
      pRight: { y: H / 2 - PH / 2 },
      scores: [0, 0], running: true,
    };
    setScores([0, 0]); setStatus('running');

    const loop = () => {
      const s = state.current;
      if (!s.running) return;
      const cv = canvasRef.current; if (!cv) return;
      const ctx = cv.getContext('2d');

      // player paddle (left) follows mouse/touch
      s.pLeft.y = Math.max(0, Math.min(H - PH, mouseY.current - PH / 2));

      // AI paddle (right)
      const aiTarget = s.ball.y - PH / 2;
      s.pRight.y += (aiTarget - s.pRight.y) * 0.08;
      s.pRight.y = Math.max(0, Math.min(H - PH, s.pRight.y));

      // move ball
      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;

      // top/bottom bounce
      if (s.ball.y - BALL_S < 0) { s.ball.y = BALL_S; s.ball.vy = Math.abs(s.ball.vy); }
      if (s.ball.y + BALL_S > H) { s.ball.y = H - BALL_S; s.ball.vy = -Math.abs(s.ball.vy); }

      // left paddle
      if (s.ball.x - BALL_S < 20 + PW && s.ball.y > s.pLeft.y && s.ball.y < s.pLeft.y + PH && s.ball.vx < 0) {
        s.ball.vx = Math.abs(s.ball.vx) * 1.05;
        s.ball.vy += (s.ball.y - (s.pLeft.y + PH / 2)) * 0.15;
        s.ball.x = 20 + PW + BALL_S;
      }

      // right paddle
      if (s.ball.x + BALL_S > W - 20 - PW && s.ball.y > s.pRight.y && s.ball.y < s.pRight.y + PH && s.ball.vx > 0) {
        s.ball.vx = -Math.abs(s.ball.vx) * 1.05;
        s.ball.vy += (s.ball.y - (s.pRight.y + PH / 2)) * 0.15;
        s.ball.x = W - 20 - PW - BALL_S;
      }

      // cap speed
      const spd = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2);
      if (spd > 12) { s.ball.vx = s.ball.vx / spd * 12; s.ball.vy = s.ball.vy / spd * 12; }

      // score
      if (s.ball.x < 0) {
        s.scores[1]++; setScores([...s.scores]);
        s.ball = { x: W / 2, y: H / 2, vx: SPEED, vy: Math.random() * 4 - 2 };
        if (s.scores[1] >= 7) { s.running = false; setStatus('cpu'); return; }
      }
      if (s.ball.x > W) {
        s.scores[0]++; setScores([...s.scores]);
        s.ball = { x: W / 2, y: H / 2, vx: -SPEED, vy: Math.random() * 4 - 2 };
        if (s.scores[0] >= 7) { s.running = false; setStatus('win'); return; }
      }

      // draw
      ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, W, H);
      // centre line
      ctx.setLineDash([8, 8]); ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.setLineDash([]);
      // scores
      ctx.fillStyle = '#ffffff44'; ctx.font = 'bold 28px monospace';
      ctx.fillText(s.scores[0], W / 2 - 36, 34);
      ctx.fillText(s.scores[1], W / 2 + 16, 34);
      // paddles
      const gL = ctx.createLinearGradient(0, 0, PW, 0);
      gL.addColorStop(0, '#7C3AED'); gL.addColorStop(1, '#9d5bf0');
      ctx.fillStyle = gL; ctx.beginPath(); ctx.roundRect(20, s.pLeft.y, PW, PH, 4); ctx.fill();
      const gR = ctx.createLinearGradient(0, 0, PW, 0);
      gR.addColorStop(0, '#f0528c'); gR.addColorStop(1, '#EC4899');
      ctx.fillStyle = gR; ctx.beginPath(); ctx.roundRect(W - 20 - PW, s.pRight.y, PW, PH, 4); ctx.fill();
      // ball
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_S, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      // glow
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_S + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (cv) { const ctx = cv.getContext('2d'); ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, W, H); }
    const onMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      mouseY.current = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;
    };
    const onKey = (e) => {
      if (!state.current?.running) return;
      const s = state.current;
      if (e.key === 'ArrowUp')   mouseY.current = Math.max(0, mouseY.current - 20);
      if (e.key === 'ArrowDown') mouseY.current = Math.min(H, mouseY.current + 20);
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

  const moveUp   = () => { mouseY.current = Math.max(0, mouseY.current - 24); };
  const moveDown = () => { mouseY.current = Math.min(H, mouseY.current + 24); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#050510' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <span style={{ color: '#9d5bf0' }}>YOU: {scores[0]}</span>
        <button onClick={start} style={{ background: '#7C3AED', border: 'none', color: '#fff', padding: '2px 12px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
          {status === 'idle' ? 'START' : 'RESTART'}
        </button>
        <span style={{ color: '#EC4899' }}>CPU: {scores[1]}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #7C3AED', display: 'block', cursor: 'none' }} />
      {status === 'win' && <div style={{ color: '#00ee44', fontFamily: 'monospace', fontWeight: 700 }}>🏆 YOU WIN!</div>}
      {status === 'cpu' && <div style={{ color: '#EC4899', fontFamily: 'monospace', fontWeight: 700 }}>CPU WINS! Try again</div>}
      {status === 'idle' && <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.72rem' }}>Move mouse over canvas or use ↑↓ keys — first to 7 wins</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={moveUp}   style={{ flex: 1, padding: '8px 20px', background: '#111', border: '1px solid #7C3AED', color: '#9d5bf0', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>↑</button>
        <button onClick={moveDown} style={{ flex: 1, padding: '8px 20px', background: '#111', border: '1px solid #7C3AED', color: '#9d5bf0', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>↓</button>
      </div>
    </div>
  );
}
