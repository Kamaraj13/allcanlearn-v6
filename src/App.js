import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/UI/Toast';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import CreateEpisode from './pages/CreateEpisode';
import EpisodeDetail from './pages/EpisodeDetail';
import Games from './pages/Games';
import ChatPanel from './components/Chat/ChatPanel';
import FloatingGame from './components/Games/FloatingGame';
import SquirrelGuide from './components/Squirrel/SquirrelGuide';
import { useAudio } from './hooks/useAudio';
import { useEpisodes } from './hooks/useEpisodes';

function AppInner() {
  const audio = useAudio();
  const { episodes, refetch } = useEpisodes();

  const handleEpisodeCreated = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePlay = useCallback((episode) => {
    // Minimal: user will navigate to episode page to start playback
    // but we accept the callback from cards
  }, []);

  return (
    <>
      <Routes>
        <Route element={<Layout audio={audio} recentEpisodes={episodes.slice(0, 4)} />}>
          <Route
            path="/"
            element={<Home onPlay={handlePlay} />}
          />
          <Route
            path="/library"
            element={<Library onPlay={handlePlay} />}
          />
          <Route
            path="/create"
            element={<CreateEpisode onEpisodeCreated={handleEpisodeCreated} />}
          />
          <Route
            path="/episode/:id"
            element={<EpisodeDetail audio={audio} />}
          />
          <Route path="/games" element={<Games />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Home onPlay={handlePlay} />} />
        </Route>
      </Routes>

      {/* Floating panels — always available on every page */}
      <ChatPanel />
      <FloatingGame bottomOffset={20} />
      <SquirrelGuide />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
