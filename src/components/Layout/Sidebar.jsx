import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Library, Plus, Gamepad2, Clock, X } from 'lucide-react';
import { topicGradientCss } from '../../services/api';

const navItems = [
  { to: '/',        label: 'Home',           icon: Home },
  { to: '/library', label: 'My Library',     icon: Library },
  { to: '/create',  label: 'Create Episode', icon: Plus,     accent: true },
  { to: '/games',   label: 'Games',          icon: Gamepad2 },
];

export function Sidebar({ recentEpisodes = [], isOpen, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="mobile-overlay active"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: 0 }}
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="sidebar-root"
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div
            onClick={() => { navigate('/'); onClose?.(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '4px',
            }}
          >
            {/* Gradient logo icon */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '18px',
              fontWeight: 900,
              color: '#fff',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            }}>
              A
            </div>
            <div>
              <div style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}>
                AllCanLearn
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: 'var(--muted)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}>
                AI Roundtable
              </div>
            </div>
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '16px',
            color: 'var(--muted)',
            display: 'none',
          }}
          className="sidebar-close"
        >
          <X size={20} />
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ to, label, icon: Icon, accent }) => {
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isActive ? '#fff' : 'var(--muted)',
                  background: isActive ? 'var(--surface3)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      color={accent && !isActive ? 'var(--accent)' : 'inherit'}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Recently Played */}
        {recentEpisodes.length > 0 && (
          <div style={{ padding: '0 12px 16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 4px',
              marginBottom: '8px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                <Clock size={12} />
                Recently Played
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentEpisodes.slice(0, 4).map((ep, i) => (
                <NavLink
                  key={ep.id || i}
                  to={`/episode/${ep.id}`}
                  onClick={onClose}
                  style={{ textDecoration: 'none' }}
                >
                  {({ isActive }) => (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 8px',
                        borderRadius: '8px',
                        background: isActive ? 'var(--surface3)' : 'transparent',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Mini thumbnail */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: topicGradientCss(ep.topic),
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                      }}>
                        {ep.topic?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {ep.topic || `Episode ${i + 1}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                          {ep.turns_count || '?'} turns
                        </div>
                      </div>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </motion.aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-root {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar-root.open {
            transform: translateX(0);
          }
          .sidebar-close {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}

export default Sidebar;
