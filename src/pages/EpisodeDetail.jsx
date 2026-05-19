import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Play, Pause, Calendar,
  Users, Zap, Volume2
} from 'lucide-react';
import { useEpisode } from '../hooks/useEpisodes';
import { topicGradientCss } from '../services/api';
import Badge from '../components/UI/Badge';
import { Skeleton } from '../components/UI/Skeleton';
import GamePanel from '../components/Games/GamePanel';

const SPEAKER_COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B'];
const SPEAKER_EMOJIS = ['🧑‍🎓', '🤨', '😊', '🛠️'];
const SPEAKER_ROLES  = ['Expert', 'Skeptic', 'Optimist', 'Pragmatist'];

function SpeakerCard({ name, index }) {
  const color = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
  const emoji = SPEAKER_EMOJIS[index % SPEAKER_EMOJIS.length];
  const role  = SPEAKER_ROLES[index % SPEAKER_ROLES.length];

  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: '1 1 160px',
      minWidth: '150px',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: `${color}22`,
        border: `2px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>
          {name}
        </div>
        <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{role}</div>
      </div>
    </div>
  );
}

function TurnCard({ turn, index, isActive, isPlaying, onClick }) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      onClick={() => onClick?.(index)}
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px',
        borderRadius: '12px',
        background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
        cursor: turn.tts ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
      whileHover={turn.tts ? { background: isActive ? 'rgba(124,58,237,0.15)' : 'var(--surface2)' } : {}}
    >
      {/* Speaker avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: `${SPEAKER_COLORS[index % SPEAKER_COLORS.length]}22`,
        border: `2px solid ${SPEAKER_COLORS[index % SPEAKER_COLORS.length]}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        flexShrink: 0,
        marginTop: '2px',
      }}>
        {SPEAKER_EMOJIS[index % SPEAKER_EMOJIS.length]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Speaker name + controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}>
          <span style={{
            fontWeight: 700,
            fontSize: '0.875rem',
            color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
          }}>
            {turn.speaker}
          </span>
          {turn.tts && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              color: isActive && isPlaying ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600,
            }}>
              {isActive && isPlaying
                ? <><Volume2 size={12} style={{ animation: 'pulse 1s ease infinite' }} /> Playing</>
                : turn.tts ? <><Play size={10} /> Play</> : null
              }
            </div>
          )}
        </div>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text)',
          lineHeight: 1.65,
          margin: 0,
          opacity: 0.9,
        }}>
          {turn.message}
        </p>
      </div>
    </motion.div>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return ''; }
}

export function EpisodeDetail({ audio }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { episode, loading, error } = useEpisode(id);
  const activeRef = useRef(null);

  // Load tracks when episode is ready
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!episode?.turns || !audio) return;
    const tracks = episode.turns
      .filter(t => t.tts)
      .map(t => ({
        src: `/tts_output/${t.tts}`,
        speaker: t.speaker,
        topic: episode.topic,
        title: `${t.speaker}: ${t.message?.slice(0, 40)}…`,
      }));
    if (tracks.length > 0) {
      audio.loadTracks(tracks, 0);
    }
  }, [episode]); // audio is stable ref, episode drives the change

  // Scroll active turn into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [audio?.currentIndex]);

  // Get unique speakers
  const speakers = episode?.turns
    ? [...new Set(episode.turns.map(t => t.speaker))]
    : [];

  // Get turns that have TTS (to map index to audio track index)
  const ttsIndices = episode?.turns
    ?.map((t, i) => t.tts ? i : null)
    .filter(i => i !== null) || [];

  const handleTurnClick = (turnIndex) => {
    if (!audio || !episode) return;
    const audioIndex = ttsIndices.indexOf(turnIndex);
    if (audioIndex >= 0) {
      audio.jumpTo(audioIndex);
    }
  };

  const isActiveAudioTurn = (turnIndex) => {
    if (!audio?.currentTrack) return false;
    const audioIndex = ttsIndices.indexOf(turnIndex);
    return audioIndex === audio.currentIndex;
  };

  if (loading) return (
    <div style={{ padding: '40px 48px' }}>
      <Skeleton height="32px" width="200px" style={{ marginBottom: '32px' }} />
      <Skeleton height="60px" style={{ marginBottom: '20px' }} />
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {[1,2,3,4].map(i => <Skeleton key={i} height="80px" style={{ flex: 1 }} />)}
      </div>
      {[1,2,3,4,5].map(i => <Skeleton key={i} height="100px" style={{ marginBottom: '12px' }} />)}
    </div>
  );

  if (error || !episode) return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
      <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '8px' }}>
        Episode not found
      </div>
      <button
        onClick={() => navigate('/library')}
        style={{
          color: 'var(--accent)',
          fontWeight: 600,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          fontSize: '0.9375rem',
        }}
      >
        Go to Library
      </button>
    </div>
  );

  const downloadEpisode = () => {
    const text = episode.turns?.map(t => `${t.speaker}: ${t.message}`).join('\n\n') || '';
    const blob = new Blob([`${episode.topic}\n\n${text}`], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${episode.topic?.slice(0,40) || 'episode'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top gradient banner */}
      <div style={{
        height: '6px',
        background: topicGradientCss(episode.topic, 90),
      }} />

      <div style={{ padding: '32px 48px 80px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--muted)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '28px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Two column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '36px',
          alignItems: 'start',
        }}
        className="episode-grid"
        >
          {/* ── Left column ─────────────────────────── */}
          <div>
            {/* Episode header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '28px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* Thumbnail */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '16px',
                  background: topicGradientCss(episode.topic),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.3)',
                  flexShrink: 0,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {episode.topic?.charAt(0)?.toUpperCase() || 'E'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Badge topic={episode.topic} style={{ marginBottom: '10px' }}>
                    AI Roundtable
                  </Badge>
                  <h1 style={{
                    fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
                    fontWeight: 900,
                    lineHeight: 1.2,
                    marginBottom: '12px',
                    letterSpacing: '-0.02em',
                  }}>
                    {episode.topic || 'Untitled Episode'}
                  </h1>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {episode.timestamp && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                        <Calendar size={13} />
                        {formatDate(episode.timestamp)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                      <Users size={13} />
                      {speakers.length || 4} speakers
                    </div>
                    {episode.turns_count && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                        <Zap size={13} />
                        {episode.turns_count} turns
                      </div>
                    )}
                    <button
                      onClick={downloadEpisode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--muted)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                    >
                      <Download size={13} />
                      Transcript
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Speaker cards */}
            {speakers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '32px' }}
              >
                <h2 style={{ fontWeight: 700, marginBottom: '14px', color: 'var(--muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                  Your AI Panel
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {speakers.map((name, i) => (
                    <SpeakerCard key={name} name={name} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Play button */}
            {audio && episode.turns?.some(t => t.tts) && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => audio.isPlaying ? audio.pause() : audio.play()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'var(--gradient)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {audio.isPlaying
                    ? <><Pause size={18} fill="#fff" /> Pause</>
                    : <><Play  size={18} fill="#fff" style={{ marginLeft: '2px' }} /> Play Episode</>
                  }
                </button>
              </div>
            )}

            {/* Transcript */}
            <div>
              <h2 style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                marginBottom: '16px',
              }}>
                Transcript
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(episode.turns || []).map((turn, i) => {
                  const isActive = isActiveAudioTurn(i);
                  return (
                    <div key={i} ref={isActive ? activeRef : null}>
                      <TurnCard
                        turn={turn}
                        index={i}
                        isActive={isActive}
                        isPlaying={audio?.isPlaying}
                        onClick={() => handleTurnClick(i)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right column (sticky) ────────────────── */}
          <div style={{
            position: 'sticky',
            top: '24px',
          }}>
            <h2 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              marginBottom: '12px',
            }}>
              Take a Break
            </h2>
            <GamePanel />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .episode-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default EpisodeDetail;
