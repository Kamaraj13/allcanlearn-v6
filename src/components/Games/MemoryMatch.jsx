import React, { useState, useEffect, useCallback } from 'react';

const EMOJIS = ['🎮','🕹️','👾','🚀','⭐','🌈','🎯','🔥','💎','🎸','🌙','🦊'];

function makeCards(pairs = 8) {
  const pool = EMOJIS.slice(0, pairs);
  const deck = [...pool, ...pool].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryMatch() {
  const [cards, setCards] = useState(() => makeCards(8));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const restart = () => {
    setCards(makeCards(8)); setSelected([]); setMoves(0);
    setLocked(false); setWon(false); setTime(0); setRunning(false);
  };

  const flip = useCallback((id) => {
    if (locked) return;
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card || card.flipped || card.matched) return prev;
      if (!running) setRunning(true);
      const next = prev.map(c => c.id === id ? { ...c, flipped: true } : c);
      setSelected(sel => {
        const newSel = [...sel, id];
        if (newSel.length === 2) {
          setMoves(m => m + 1);
          const [a, b] = newSel.map(sid => next.find(c => c.id === sid));
          if (a.emoji === b.emoji) {
            const matched = next.map(c => newSel.includes(c.id) ? { ...c, matched: true } : c);
            if (matched.every(c => c.matched)) { setWon(true); setRunning(false); }
            setCards(matched);
          } else {
            setLocked(true);
            setTimeout(() => {
              setCards(cur => cur.map(c => newSel.includes(c.id) && !c.matched ? { ...c, flipped: false } : c));
              setLocked(false);
            }, 900);
          }
          return [];
        }
        return newSel;
      });
      return next;
    });
  }, [locked, running]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 12, gap: 10, background: '#0d0d1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: 284, fontFamily: 'monospace' }}>
        <span style={{ color: '#a78bfa' }}>Moves: {moves}</span>
        <span style={{ color: '#f472b6' }}>⏱ {fmt(time)}</span>
        <button onClick={restart} style={{ background: '#7C3AED', border: 'none', color: '#fff', padding: '2px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace' }}>NEW</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 64px)', gap: 6 }}>
        {cards.map(card => {
          const isUp = card.flipped || card.matched;
          return (
            <div
              key={card.id}
              onClick={() => flip(card.id)}
              style={{
                width: 64, height: 64, borderRadius: 10, cursor: isUp ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                background: card.matched ? '#1a3d1a' : isUp ? '#1a1a3e' : '#2d1a5e',
                border: `2px solid ${card.matched ? '#34d399' : isUp ? '#7C3AED' : '#4a2d8e'}`,
                transition: 'all 0.2s',
                transform: isUp ? 'scale(1)' : 'scale(0.95)',
                boxShadow: card.matched ? '0 0 12px #34d39944' : 'none',
                userSelect: 'none',
              }}
            >
              {isUp ? card.emoji : '❓'}
            </div>
          );
        })}
      </div>

      {won && (
        <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
          <div style={{ color: '#34d399', fontWeight: 700, fontSize: '1rem' }}>🎉 Matched all in {moves} moves!</div>
          <div style={{ color: '#a78bfa', fontSize: '0.8rem' }}>Time: {fmt(time)}</div>
        </div>
      )}
    </div>
  );
}
