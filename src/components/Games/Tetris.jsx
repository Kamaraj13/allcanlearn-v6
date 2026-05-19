import React, { useEffect, useRef, useState, useCallback } from 'react';

const COLS = 10, ROWS = 20, CELL = 24;
const W = COLS * CELL, H = ROWS * CELL;

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00f0f0' },           // I
  { shape: [[1,1],[1,1]], color: '#f0f000' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },      // T
  { shape: [[1,0],[1,0],[1,1]], color: '#f0a000' },    // L
  { shape: [[0,1],[0,1],[1,1]], color: '#0000f0' },    // J
  { shape: [[0,1,1],[1,1,0]], color: '#00f000' },      // S
  { shape: [[1,1,0],[0,1,1]], color: '#f00000' },      // Z
];

function randPiece() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { shape: p.shape.map(r => [...r]), color: p.color, x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
}

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c]));
}

function collides(board, piece, dx = 0, dy = 0, shape = null) {
  const s = shape || piece.shape;
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) {
        const nx = piece.x + c + dx, ny = piece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return true;
      }
  return false;
}

function merge(board, piece) {
  const b = board.map(r => [...r]);
  piece.shape.forEach((row, r) => row.forEach((v, c) => {
    if (v) b[piece.y + r][piece.x + c] = piece.color;
  }));
  return b;
}

function clearLines(board) {
  const kept = board.filter(row => row.some(v => !v));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  return { board: [...empty, ...kept], lines: cleared };
}

function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }

export default function Tetris() {
  const canvasRef = useRef(null);
  const state = useRef({ board: emptyBoard(), piece: null, next: randPiece(), running: false, score: 0, lines: 0, level: 1 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [status, setStatus] = useState('idle');
  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    const s = state.current;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = '#111133'; ctx.lineWidth = 0.5;
    for (let r = 0; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }
    for (let c = 0; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
    // board
    s.board.forEach((row, r) => row.forEach((col, c) => {
      if (col) { ctx.fillStyle = col; ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4); }
    }));
    // ghost piece
    if (s.piece) {
      let drop = 0;
      while (!collides(s.board, s.piece, 0, drop + 1)) drop++;
      s.piece.shape.forEach((row, r) => row.forEach((v, c) => {
        if (v) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r + drop) * CELL + 1, CELL - 2, CELL - 2); }
      }));
      // active piece
      s.piece.shape.forEach((row, r) => row.forEach((v, c) => {
        if (v) { ctx.fillStyle = s.piece.color; ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r) * CELL + 1, CELL - 2, CELL - 2); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r) * CELL + 1, CELL - 2, 4); }
      }));
    }
  }, []);

  const lock = useCallback(() => {
    const s = state.current;
    const merged = merge(s.board, s.piece);
    const { board, lines: cleared } = clearLines(merged);
    const pts = [0, 100, 300, 500, 800][cleared] || 0;
    s.board = board; s.score += pts * s.level; s.lines += cleared;
    s.level = Math.floor(s.lines / 10) + 1;
    setScore(s.score); setLines(s.lines);
    s.piece = s.next; s.next = randPiece();
    if (collides(board, s.piece)) { s.running = false; setStatus('dead'); }
  }, []);

  const loop = useCallback((ts) => {
    const s = state.current; if (!s.running) return;
    const speed = Math.max(80, 500 - s.level * 40);
    if (ts - lastRef.current > speed) {
      lastRef.current = ts;
      if (!collides(s.board, s.piece, 0, 1)) { s.piece.y++; }
      else { lock(); }
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, lock]);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    state.current = { board: emptyBoard(), piece: randPiece(), next: randPiece(), running: true, score: 0, lines: 0, level: 1 };
    setScore(0); setLines(0); setStatus('running'); lastRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    draw();
    const onKey = (e) => {
      const s = state.current; if (!s.running || !s.piece) return;
      if (e.key === 'ArrowLeft'  && !collides(s.board, s.piece, -1, 0)) { s.piece.x--; draw(); }
      if (e.key === 'ArrowRight' && !collides(s.board, s.piece,  1, 0)) { s.piece.x++; draw(); }
      if (e.key === 'ArrowDown'  && !collides(s.board, s.piece,  0, 1)) { s.piece.y++; draw(); }
      if (e.key === 'ArrowUp') {
        const rot = rotate(s.piece.shape);
        if (!collides(s.board, s.piece, 0, 0, rot)) { s.piece.shape = rot; draw(); }
      }
      if (e.key === ' ') {
        while (!collides(s.board, s.piece, 0, 1)) s.piece.y++;
        lock(); draw(); e.preventDefault();
      }
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw, lock]);

  const act = (action) => {
    const s = state.current; if (!s.running || !s.piece) return;
    if (action === 'L' && !collides(s.board, s.piece, -1, 0)) { s.piece.x--; draw(); }
    if (action === 'R' && !collides(s.board, s.piece,  1, 0)) { s.piece.x++; draw(); }
    if (action === 'D' && !collides(s.board, s.piece,  0, 1)) { s.piece.y++; draw(); }
    if (action === 'ROT') { const rot = rotate(s.piece.shape); if (!collides(s.board, s.piece, 0, 0, rot)) { s.piece.shape = rot; draw(); } }
    if (action === 'DROP') { while (!collides(s.board, s.piece, 0, 1)) s.piece.y++; lock(); draw(); }
  };

  const btn = (label, action, flex = 1) => (
    <button onClick={() => act(action)} style={{ flex, padding: '6px 0', background: '#111133', border: '1px solid #333', color: '#aaf', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 8, background: '#0a0a1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: W, color: '#aaf', fontFamily: 'monospace', fontSize: '0.78rem' }}>
        <span>SCORE: {score}</span><span>LINES: {lines}</span>
        <button onClick={start} style={{ background: '#7C3AED', border: 'none', color: '#fff', padding: '2px 10px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>{status === 'idle' ? 'START' : 'NEW'}</button>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #7C3AED', display: 'block' }} />
      {status === 'dead' && <div style={{ color: '#f00', fontFamily: 'monospace', fontWeight: 700 }}>GAME OVER — {score} pts</div>}
      <div style={{ display: 'flex', gap: 4, width: W }}>
        {btn('←', 'L')} {btn('↺', 'ROT')} {btn('↓', 'D')} {btn('→', 'R')}
      </div>
      <button onClick={() => act('DROP')} style={{ width: W, padding: '6px', background: '#7C3AED', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>DROP (Space)</button>
    </div>
  );
}
