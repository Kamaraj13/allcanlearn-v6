import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Play, Zap, Users, Clock } from 'lucide-react';
import { useEpisodes } from '../hooks/useEpisodes';
import { getPopularTopics, topicGradientCss } from '../services/api';
import { EpisodeCardSkeleton } from '../components/UI/Skeleton';

const QUICK_TOPICS = [
  { label: 'AI & Future',    emoji: '🤖', topic: 'Artificial Intelligence and the Future' },
  { label: 'Climate',        emoji: '🌍', topic: 'Climate Change' },
  { label: 'Finance',        emoji: '💰', topic: 'Personal Finance' },
  { label: 'Psychology',     emoji: '🧠', topic: 'Psychology and Human Behaviour' },
  { label: 'Space',          emoji: '🚀', topic: 'Space Exploration' },
  { label: 'Energy',         emoji: '⚡', topic: 'Renewable Energy' },
  { label: 'Health',         emoji: '💊', topic: 'Health and Wellness' },
  { label: 'Crypto',         emoji: '🪙', topic: 'Cryptocurrency' },
];

function EpisodeCard({ episode, onPlay }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => navigate(`/episode/${episode.id}`);

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleClick}
      style={{
        minWidth: '200px',
        maxWidth: '220px',
        background: 'var(--surface2)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border)',
        transition: 'border-color 0.2s',
        flexShrink: 0,
        borderColor: hovered ? 'var(--border-h)' : 'var(--border)',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%',
        height: '160px',
        background: topicGradientCss(episode.topic),
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Letter */}
        <span style={{
          fontSize: '3.5rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.25)',
          userSelect: 'none',
          letterSpacing: '-0.04em',
        }}>
          {episode.topic?.charAt(0)?.toUpperCase() || 'E'}
        </span>

        {/* Play button overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => { e.stopPropagation(); onPlay?.(episode); }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <Play size={20} fill="#000" color="#000" style={{ marginLeft: '3px' }} />
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.9rem',
          lineHeight: 1.3,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          color: 'var(--text)',
        }}>
          {episode.topic || 'Untitled Episode'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.72rem' }}>
            <Users size={11} />
            <span>4 speakers</span>
          </div>
          {episode.turns_count && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.72rem' }}>
              <Zap size={11} />
              <span>{episode.turns_count} turns</span>
            </div>
          )}
          {episode.timestamp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.72rem' }}>
              <Clock size={11} />
              <span>{formatDate(episode.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CategoryCard({ category }) {
  const navigate = useNavigate();

  const handleTopicClick = (topic) => {
    navigate(`/create?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid var(--border)',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-h)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '14px',
      }}>
        <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{category.name}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {category.topics.slice(0, 5).map(topic => (
          <button
            key={topic}
            onClick={() => handleTopicClick(topic)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'var(--surface3)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Home({ onPlay }) {
  const navigate = useNavigate();
  const { episodes, loading } = useEpisodes();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getPopularTopics()
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/create?topic=${encodeURIComponent(search.trim())}`);
  };

  const handleQuickTopic = (topic) => {
    navigate(`/create?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────────── */}
      <div style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 80% 30%, rgba(236,72,153,0.15) 0%, transparent 60%),
          var(--bg)
        `,
        padding: '72px 48px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated orb */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'heroGradient 8s ease infinite',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'relative', maxWidth: '720px' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: '24px',
            letterSpacing: '0.04em',
          }}>
            <Zap size={12} />
            AI-POWERED LEARNING
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}>
            What do you want to{' '}
            <span style={{
              background: 'var(--gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              learn today?
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--muted)',
            marginBottom: '36px',
            lineHeight: 1.6,
            maxWidth: '520px',
          }}>
            4 AI experts will discuss any topic, deeply — as a rich podcast you can listen to, learn from, and quiz yourself on.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch}>
            <div style={{
              display: 'flex',
              gap: '12px',
              maxWidth: '600px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                flex: 1,
                minWidth: '240px',
                position: 'relative',
              }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder='Type any topic… e.g. "Why does inflation happen?"'
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border-h)',
                    borderRadius: '12px',
                    color: 'var(--text)',
                    fontSize: '0.9375rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = 'var(--glow)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-h)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  background: 'var(--gradient)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                Generate
              </motion.button>
            </div>
          </form>

          {/* Quick topics */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '20px',
          }}>
            {QUICK_TOPICS.map(({ label, emoji, topic }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickTopic(topic)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border-h)',
                  color: 'var(--muted)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'var(--surface3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border-h)'; e.currentTarget.style.background = 'var(--surface2)'; }}
              >
                <span>{emoji}</span>
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div style={{ padding: '0 48px 80px' }}>
        {/* Recently Generated */}
        <section style={{ marginBottom: '56px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Recently Generated</h2>
            <button
              onClick={() => navigate('/library')}
              style={{
                color: 'var(--muted)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              See all
            </button>
          </div>

          <div className="scroll-rail">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <EpisodeCardSkeleton key={i} />)
              : episodes.length === 0
                ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                    No episodes yet.{' '}
                    <button
                      onClick={() => navigate('/create')}
                      style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      Create your first one!
                    </button>
                  </div>
                )
                : episodes.slice(0, 12).map(ep => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    onPlay={onPlay}
                  />
                ))
            }
          </div>
        </section>

        {/* Popular Topics */}
        {categories.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '20px' }}>
              Popular Topics
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {categories.map(cat => (
                <CategoryCard key={cat.name} category={cat} />
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-section { padding: 48px 20px 40px !important; }
        }
        @keyframes heroGradient {
          0%,100% { transform: translateX(-50%) scale(1); }
          50%      { transform: translateX(-50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export default Home;
