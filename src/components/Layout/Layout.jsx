import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export function Layout({ audio, recentEpisodes }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar — fixed on desktop */}
      <Sidebar
        recentEpisodes={recentEpisodes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div style={{
        flex: 1,
        marginLeft: 'var(--sidebar-w)',
        minHeight: '100vh',
        paddingBottom: audio?.currentTrack ? 'var(--player-h)' : '0',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="layout-main"
      >
        {/* Mobile header */}
        <div
          style={{
            display: 'none',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
            gap: '12px',
            position: 'sticky',
            top: 0,
            background: 'rgba(8,8,15,0.9)',
            backdropFilter: 'blur(16px)',
            zIndex: 30,
          }}
          className="mobile-header"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: 'var(--text)', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={22} />
          </button>
          <div style={{
            fontWeight: 800,
            fontSize: '1rem',
            background: 'var(--gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AllCanLearn
          </div>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ flex: 1 }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Player bar */}
      {audio && <PlayerBar audio={audio} />}

      <style>{`
        @media (max-width: 768px) {
          .layout-main {
            margin-left: 0 !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .sidebar-root {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar-root.open-mobile {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
