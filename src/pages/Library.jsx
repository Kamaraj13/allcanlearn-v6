import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Play, Library as LibraryIcon, Zap, Users, Clock } from 'lucide-react';
import { useEpisodes } from '../hooks/useEpisodes';
import { topicGradientCss } from '../services/api';
import { EpisodeCardSkeleton } from '../components/UI/Skeleton';

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function EpisodeGridCard({ episode, onPlay }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/episode/${episode.id}`)}
      style={{
        background: 'var(--surface2)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${hovered ? 'var(--border-h)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: topicGradientCss(episode.topic),
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <span style={{
          fontSize: '4rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.22)',
          userSelect: 'none',
        }}>
          {episode.topic?.charAt(0)?.toUpperCase() || 'E'}
        </span>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={e => { e.stopPropagation(); onPlay?.(episode); }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <Play size={22} fill="#000" color="#000" style={{ marginLeft: '3px' }} />
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.9375rem',
          lineHeight: 1.3,
          marginBottom: '10px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {episode.topic || 'Untitled'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.75rem' }}>
            <Users size={12} /><span>4 speakers</span>
          </div>
          {episode.turns_count && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.75rem' }}>
              <Zap size={12} /><span>{episode.turns_count} turns</span>
            </div>
          )}
          {episode.timestamp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '0.75rem' }}>
              <Clock size={12} /><span>{formatDate(episode.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Library({ onPlay }) {
  const navigate = useNavigate();
  const { episodes, loading, error, refetch } = useEpisodes();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Get unique "categories" from episode topics (simplified)
  const filters = useMemo(() => {
    const cats = new Set(['All']);
    episodes.forEach(ep => {
      const t = ep.topic?.toLowerCase() || '';
      if (t.includes('finance') || t.includes('money') || t.includes('crypto')) cats.add('Finance');
      else if (t.includes('tech') || t.includes('ai') || t.includes('software')) cats.add('Technology');
      else if (t.includes('health') || t.includes('mental') || t.includes('wellness')) cats.add('Health');
      else if (t.includes('space') || t.includes('science')) cats.add('Science');
      else if (t.includes('climate') || t.includes('energy')) cats.add('Climate');
      else if (t.includes('sport') || t.includes('fitness')) cats.add('Sports');
      else cats.add('Other');
    });
    return [...cats];
  }, [episodes]);

  const filtered = useMemo(() => {
    let list = episodes;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(ep => ep.topic?.toLowerCase().includes(q));
    }

    if (activeFilter !== 'All') {
      list = list.filter(ep => {
        const t = ep.topic?.toLowerCase() || '';
        switch (activeFilter) {
          case 'Finance':    return t.includes('finance') || t.includes('money') || t.includes('crypto');
          case 'Technology': return t.includes('tech') || t.includes('ai') || t.includes('software');
          case 'Health':     return t.includes('health') || t.includes('mental') || t.includes('wellness');
          case 'Science':    return t.includes('space') || t.includes('science');
          case 'Climate':    return t.includes('climate') || t.includes('energy');
          case 'Sports':     return t.includes('sport') || t.includes('fitness');
          default:           return true;
        }
      });
    }

    return list;
  }, [episodes, search, activeFilter]);

  return (
    <div style={{ padding: 'clamp(20px,5vw,40px) clamp(12px,5vw,48px) 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}>
          <LibraryIcon size={24} color="var(--accent)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>My Library</h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ marginBottom: '28px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search episodes…"
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text)',
              fontSize: '0.875rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s',
                background: activeFilter === f ? 'var(--gradient)' : 'var(--surface2)',
                color: activeFilter === f ? '#fff' : 'var(--muted)',
                boxShadow: activeFilter === f ? '0 2px 12px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <EpisodeCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>Failed to load episodes</div>
          <button
            onClick={refetch}
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              fontSize: '0.9375rem',
            }}
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--muted)',
        }}>
          {episodes.length === 0 ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎙️</div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)', marginBottom: '8px' }}>
                No episodes yet
              </div>
              <div style={{ marginBottom: '24px' }}>Create your first AI podcast episode!</div>
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: '12px 28px',
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
                Create Episode
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>No results for "{search}"</div>
              <div style={{ fontSize: '0.875rem' }}>Try a different search term</div>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}
        >
          {filtered.map((ep, i) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <EpisodeGridCard episode={ep} onPlay={onPlay} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <style>{`
        @media (max-width: 768px) {
          /* handled inline */
        }
      `}</style>
    </div>
  );
}

export default Library;
