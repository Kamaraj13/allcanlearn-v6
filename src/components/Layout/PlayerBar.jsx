import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { topicGradientCss } from '../../services/api';
import Badge from '../UI/Badge';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar({ audio }) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    seek,
    hasNext,
    hasPrev,
    tracks,
    currentIndex,
    volume,
    setVolume,
  } = audio;

  const progressRef = useRef(null);
  const [dragging] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevVol = useRef(1);

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    seek(Math.max(0, Math.min(100, pct)));
  };

  const toggleMute = () => {
    if (muted) {
      setVolume(prevVol.current);
      setMuted(false);
    } else {
      prevVol.current = volume;
      setVolume(0);
      setMuted(true);
    }
  };

  const show = !!currentTrack;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--player-h)',
            background: 'rgba(17,15,30,0.97)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid var(--border)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '24px',
          }}
        >
          {/* Left: episode info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '28%',
            minWidth: 0,
          }}>
            {/* Thumbnail */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: topicGradientCss(currentTrack?.topic || ''),
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              {currentTrack?.topic?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentTrack?.speaker || currentTrack?.title || 'Speaking...'}
              </div>
              {currentTrack?.topic && (
                <Badge topic={currentTrack.topic} style={{ marginTop: '2px' }}>
                  {currentTrack.topic.length > 18
                    ? currentTrack.topic.slice(0, 18) + '…'
                    : currentTrack.topic}
                </Badge>
              )}
            </div>
          </div>

          {/* Center: controls + progress */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
          }}>
            {/* Playback buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={prev}
                disabled={!hasPrev}
                style={{
                  color: hasPrev ? 'var(--text)' : 'var(--muted)',
                  opacity: hasPrev ? 1 : 0.4,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <SkipBack size={20} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s, background 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isPlaying
                  ? <Pause size={18} fill="#000" />
                  : <Play  size={18} fill="#000" style={{ marginLeft: '2px' }} />
                }
              </button>

              <button
                onClick={next}
                disabled={!hasNext}
                style={{
                  color: hasNext ? 'var(--text)' : 'var(--muted)',
                  opacity: hasNext ? 1 : 0.4,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '480px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', width: '32px', textAlign: 'right' }}>
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                style={{
                  flex: 1,
                  height: '4px',
                  background: 'var(--surface3)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${progress}%`,
                  background: '#fff',
                  borderRadius: '2px',
                  transition: dragging ? 'none' : 'width 0.1s linear',
                }} />
                {/* Thumb */}
                <div style={{
                  position: 'absolute',
                  left: `${progress}%`,
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }} className="progress-thumb" />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', width: '32px' }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: speaker + track index + volume */}
          <div style={{
            width: '22%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}>
            {tracks.length > 1 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                {currentIndex + 1} / {tracks.length}
              </span>
            )}

            <button
              onClick={toggleMute}
              style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
            >
              {muted || volume === 0
                ? <VolumeX size={18} />
                : <Volume2 size={18} />
              }
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
              style={{
                width: '72px',
                accentColor: 'var(--accent)',
                cursor: 'pointer',
              }}
            />
          </div>

          <style>{`
            div:hover .progress-thumb { opacity: 1; }
            @media (max-width: 640px) {
              .player-right { display: none; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PlayerBar;
