import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/* ── Page messages ──────────────────────────────────────── */
const PAGE_CONFIG = {
  '/': {
    messages: [
      "Hi! I'm Nutty! 🐿️ Type any topic to create an AI podcast!",
      "Click '+ Create Episode' to get started!",
      "4 AI experts will debate any topic you pick!",
      "Try something wild like 'Did aliens build the pyramids?' 🛸",
    ],
    targetX: 0.55, // fraction of window width
  },
  '/create': {
    messages: [
      "✨ Type any topic up there and hit Generate!",
      "Try 'Why did Rome fall?' or 'Is AI dangerous?'",
      "You'll hear the first speaker in about 10 seconds!",
      "4 different AI voices will debate your topic!",
    ],
    targetX: 0.5,
  },
  '/library': {
    messages: [
      "📚 All your podcasts live here!",
      "Click any episode to listen to the full conversation.",
      "Episodes are saved forever — come back anytime!",
    ],
    targetX: 0.45,
  },
  '/games': {
    messages: [
      "🎮 Classic games to play while you listen!",
      "Snake, Tetris, Space Invaders, Pong... all free!",
      "Try Dino Run — tap the button to jump! 🦕",
      "90s arcade vibes 🕹️",
    ],
    targetX: 0.6,
  },
};

function getConfig(pathname) {
  if (pathname.startsWith('/episode')) return {
    messages: [
      "🎧 Hit Play to hear the full episode!",
      "Click any line in the transcript to jump to it!",
      "You can drag the chat and game panels anywhere!",
    ],
    targetX: 0.5,
  };
  return PAGE_CONFIG[pathname] || PAGE_CONFIG['/'];
}

/* ── Squirrel SVG ───────────────────────────────────────── */
function SquirrelSVG({ running, talking, facingLeft, happy }) {
  const legAngle = running ? 18 : 0;

  return (
    <svg
      width="64" height="80"
      viewBox="0 0 64 80"
      style={{ display: 'block', overflow: 'visible', transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' }}
    >
      {/* Shadow */}
      <ellipse cx="32" cy="79" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />

      {/* Tail — big fluffy behind body */}
      <motion.g
        animate={{ rotate: running ? [-8, 8, -8] : happy ? [-15, 15, -15] : [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: running ? 0.25 : happy ? 0.3 : 1.8, ease: 'easeInOut' }}
        style={{ originX: '48px', originY: '52px' }}
      >
        <path
          d="M 48 52 Q 72 38 68 18 Q 64 4 50 10 Q 62 22 54 48 Z"
          fill="#7B3F00"
        />
        <path
          d="M 48 52 Q 68 40 64 22 Q 58 8 50 14 Q 60 26 52 50 Z"
          fill="#A0522D"
        />
        {/* Fluffy tip */}
        <ellipse cx="60" cy="14" rx="8" ry="6" fill="#C4722A" transform="rotate(-20, 60, 14)" />
        <ellipse cx="60" cy="14" rx="5" ry="4" fill="#D4904A" transform="rotate(-20, 60, 14)" />
      </motion.g>

      {/* Body */}
      <ellipse cx="30" cy="56" rx="17" ry="20" fill="#C4822A" />
      {/* Belly */}
      <ellipse cx="30" cy="58" rx="10" ry="14" fill="#E8B87A" />

      {/* Arms */}
      <motion.g
        animate={{ rotate: running ? [-20, 20, -20] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 0.25, ease: 'easeInOut' }}
        style={{ originX: '14px', originY: '50px' }}
      >
        <ellipse cx="14" cy="54" rx="6" ry="10" fill="#B07020" transform="rotate(-15, 14, 54)" />
      </motion.g>
      <motion.g
        animate={{ rotate: running ? [20, -20, 20] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 0.25, ease: 'easeInOut' }}
        style={{ originX: '46px', originY: '50px' }}
      >
        <ellipse cx="46" cy="54" rx="6" ry="10" fill="#B07020" transform="rotate(15, 46, 54)" />
      </motion.g>

      {/* Legs */}
      <motion.g
        animate={{ rotate: running ? [-legAngle, legAngle, -legAngle] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 0.25, ease: 'easeInOut' }}
        style={{ originX: '22px', originY: '70px' }}
      >
        <rect x="18" y="70" width="9" height="14" rx="4.5" fill="#9B6010" />
      </motion.g>
      <motion.g
        animate={{ rotate: running ? [legAngle, -legAngle, legAngle] : [0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 0.25, ease: 'easeInOut' }}
        style={{ originX: '35px', originY: '70px' }}
      >
        <rect x="31" y="70" width="9" height="14" rx="4.5" fill="#9B6010" />
      </motion.g>

      {/* Head */}
      <ellipse cx="30" cy="24" rx="18" ry="18" fill="#C4822A" />

      {/* Ears */}
      <ellipse cx="15" cy="10" rx="7" ry="9" fill="#A06020" />
      <ellipse cx="15" cy="10" rx="4" ry="6" fill="#F4A0A0" />
      <ellipse cx="45" cy="10" rx="7" ry="9" fill="#A06020" />
      <ellipse cx="45" cy="10" rx="4" ry="6" fill="#F4A0A0" />

      {/* Cheek pouches */}
      <ellipse cx="14" cy="28" rx="7" ry="6" fill="#D4923A" />
      <ellipse cx="46" cy="28" rx="7" ry="6" fill="#D4923A" />

      {/* Eyes */}
      <motion.g
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ repeat: Infinity, duration: 3.5, times: [0, 0.45, 0.5, 0.55, 1] }}
      >
        <circle cx="23" cy="22" r="5" fill="#1a0800" />
        <circle cx="37" cy="22" r="5" fill="#1a0800" />
        <circle cx="24.5" cy="20.5" r="1.8" fill="white" />
        <circle cx="38.5" cy="20.5" r="1.8" fill="white" />
      </motion.g>

      {/* Nose */}
      <ellipse cx="30" cy="30" rx="3.5" ry="2.5" fill="#ff8888" />

      {/* Mouth */}
      <motion.path
        d={talking
          ? "M 25 34 Q 30 39 35 34"
          : happy
          ? "M 24 34 Q 30 40 36 34"
          : "M 26 34 Q 30 37 34 34"
        }
        stroke="#7B3000"
        strokeWidth="1.5"
        fill={talking ? "#ff6666" : "none"}
        strokeLinecap="round"
        animate={talking ? { d: ["M 25 34 Q 30 39 35 34", "M 25 34 Q 30 36 35 34", "M 25 34 Q 30 39 35 34"] } : {}}
        transition={{ repeat: Infinity, duration: 0.3 }}
      />

      {/* Happy stars when clicked */}
      {happy && (
        <>
          <motion.text x="2" y="8" fontSize="10" animate={{ y: [-2, -12], opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>⭐</motion.text>
          <motion.text x="50" y="8" fontSize="10" animate={{ y: [-2, -14], opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}>✨</motion.text>
        </>
      )}
    </svg>
  );
}

/* ── Speech Bubble ──────────────────────────────────────── */
function SpeechBubble({ message, facingLeft }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      style={{
        position: 'absolute',
        bottom: '88px',
        left: facingLeft ? 'auto' : '-10px',
        right: facingLeft ? '-10px' : 'auto',
        width: '200px',
        background: '#fff',
        borderRadius: '14px',
        padding: '10px 12px',
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#1a0a00',
        lineHeight: 1.45,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        border: '2px solid #C4822A',
        zIndex: 9999,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {message}
      {/* Tail of bubble */}
      <div style={{
        position: 'absolute',
        bottom: '-10px',
        left: facingLeft ? 'auto' : '24px',
        right: facingLeft ? '24px' : 'auto',
        width: 0, height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '10px solid #C4822A',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-7px',
        left: facingLeft ? 'auto' : '25px',
        right: facingLeft ? '25px' : 'auto',
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '8px solid #fff',
      }} />
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function SquirrelGuide() {
  const location = useLocation();
  const [x, setX] = useState(window.innerWidth * 0.55);
  const [running, setRunning] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [talking, setTalking] = useState(false);
  const [happy, setHappy] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const msgTimer = useRef(null);
  const runTimer = useRef(null);
  const prevX = useRef(x);

  // Bottom offset — sits above player bar if audio is playing
  const bottomY = 100;

  const runTo = useCallback((targetX, config) => {
    const clamped = Math.max(80, Math.min(window.innerWidth - 160, targetX));
    const diff = clamped - prevX.current;
    if (Math.abs(diff) < 40) return;

    setFacingLeft(diff < 0);
    setRunning(true);
    setShowBubble(false);
    setMsgIndex(0);

    clearTimeout(runTimer.current);
    const duration = Math.min(2000, Math.max(600, Math.abs(diff) * 2));
    runTimer.current = setTimeout(() => {
      setRunning(false);
      setTalking(true);
      setShowBubble(true);
      prevX.current = clamped;
      setTimeout(() => setTalking(false), 3000);
    }, duration);

    setX(clamped);
  }, []);

  // React to route changes
  useEffect(() => {
    const config = getConfig(location.pathname);
    const targetX = config.targetX * window.innerWidth;
    setMsgIndex(0);
    setTimeout(() => runTo(targetX, config), 300);
  }, [location.pathname, runTo]);

  // Cycle messages while on same page
  useEffect(() => {
    if (dismissed) return;
    const config = getConfig(location.pathname);
    msgTimer.current = setInterval(() => {
      setMsgIndex(i => {
        const next = (i + 1) % config.messages.length;
        setShowBubble(false);
        setTimeout(() => setShowBubble(true), 300);
        return next;
      });
    }, 5000);
    return () => clearInterval(msgTimer.current);
  }, [location.pathname, dismissed]);

  // Idle wander
  useEffect(() => {
    if (dismissed) return;
    const wander = setInterval(() => {
      if (running) return;
      const drift = (Math.random() - 0.5) * 120;
      const nx = Math.max(80, Math.min(window.innerWidth - 160, prevX.current + drift));
      setFacingLeft(drift < 0);
      setRunning(true);
      setShowBubble(false);
      setTimeout(() => {
        setRunning(false);
        setShowBubble(true);
        prevX.current = nx;
      }, 800);
      setX(nx);
    }, 8000);
    return () => clearInterval(wander);
  }, [running, dismissed]);

  const handleClick = () => {
    setHappy(true);
    setTalking(true);
    setShowBubble(true);
    setTimeout(() => { setHappy(false); setTalking(false); }, 2000);
  };

  if (dismissed) return null;

  const config = getConfig(location.pathname);
  const message = config.messages[msgIndex % config.messages.length];

  return (
    <motion.div
      animate={{ x }}
      transition={{ type: 'tween', duration: running ? 0.8 : 0.4, ease: running ? 'linear' : 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: bottomY,
        left: 0,
        width: 64,
        zIndex: 198,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      {/* Idle bounce */}
      <motion.div
        animate={running
          ? { y: [0, -6, 0, -6, 0] }
          : { y: [0, -3, 0] }
        }
        transition={{ repeat: Infinity, duration: running ? 0.25 : 2, ease: 'easeInOut' }}
        style={{ position: 'relative' }}
      >
        {/* Speech bubble */}
        <AnimatePresence>
          {showBubble && !running && (
            <SpeechBubble message={message} facingLeft={facingLeft} />
          )}
        </AnimatePresence>

        <SquirrelSVG running={running} talking={talking} facingLeft={facingLeft} happy={happy} />

        {/* Dismiss button */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 18, height: 18, borderRadius: '50%',
            background: '#333', color: '#fff', border: 'none',
            fontSize: '10px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
          onClick={e => { e.stopPropagation(); setDismissed(true); }}
          title="Dismiss Nutty"
        >
          ×
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
