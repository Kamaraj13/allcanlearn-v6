import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Users, ArrowRight, Volume2, CheckCircle } from 'lucide-react';
import { useToast } from '../components/UI/Toast';

const EXAMPLES = [
  'Why does inflation happen and who does it hurt most?',
  'How does the human brain form memories?',
  'What would a Universal Basic Income actually look like?',
  'Is nuclear energy the answer to climate change?',
  'How do social media algorithms shape our beliefs?',
  'Why do we dream, and what do dreams mean?',
  'How will AI change the job market in 10 years?',
];

const PANEL = [
  { name: 'The Expert',      emoji: '🧑‍🎓', color: '#7C3AED', role: 'Facts & research' },
  { name: 'The Skeptic',     emoji: '🤨',   color: '#EC4899', role: 'Questions everything' },
  { name: 'The Optimist',    emoji: '😊',   color: '#10B981', role: 'Bright-side thinker' },
  { name: 'The Pragmatist',  emoji: '🛠️',   color: '#F59E0B', role: 'Real-world focus' },
];

const SPEAKER_COLORS = {
  'The Expert':     '#7C3AED',
  'The Skeptic':    '#EC4899',
  'The Optimist':   '#10B981',
  'The Pragmatist': '#F59E0B',
};

export function CreateEpisode({ onEpisodeCreated }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const textareaRef = useRef(null);
  const readerRef = useRef(null);       // holds the SSE reader so we can cancel
  const audioRef = useRef(new Audio()); // local audio for streaming playback
  const turnQueueRef = useRef([]);      // audio URLs queued for playback
  const playingRef = useRef(false);

  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [generating, setGenerating] = useState(false);
  const [streamTurns, setStreamTurns] = useState([]);   // turns received so far
  const [totalExpected] = useState(32);                 // 8 rounds × 4 speakers
  const [episodeId, setEpisodeId] = useState(null);
  const [done, setDone] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);

  // Rotate placeholder
  useEffect(() => {
    const id = setInterval(() => setExampleIndex(i => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(id);
  }, []);

  // Auto-fill from URL
  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  // Audio queue player — plays each track as it arrives, auto-advances
  const playNext = useCallback(() => {
    if (turnQueueRef.current.length === 0) {
      playingRef.current = false;
      return;
    }
    const { url, speaker } = turnQueueRef.current.shift();
    setCurrentSpeaker(speaker);
    playingRef.current = true;
    const audio = audioRef.current;
    audio.src = url;
    audio.onended = playNext;
    audio.onerror = playNext;  // skip broken files
    audio.play().catch(playNext);
  }, []);

  const queueAudio = useCallback((url, speaker) => {
    turnQueueRef.current.push({ url, speaker });
    if (!playingRef.current) playNext();
  }, [playNext]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      if (readerRef.current) readerRef.current.cancel();
    };
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) { textareaRef.current?.focus(); return; }

    setGenerating(true);
    setStreamTurns([]);
    setEpisodeId(null);
    setDone(false);
    setCurrentSpeaker(null);
    turnQueueRef.current = [];
    playingRef.current = false;

    try {
      const response = await fetch(
        `/generate/stream?topic=${encodeURIComponent(topic.trim())}`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();  // keep any incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'turn') {
              setStreamTurns(prev => [...prev, event]);
              if (event.audio_url) queueAudio(event.audio_url, event.speaker);
            }

            if (event.type === 'done') {
              setEpisodeId(event.episode_id);
              setDone(true);
              onEpisodeCreated?.();
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      toast.error('Generation failed — please try again.');
      setGenerating(false);
    }
  };

  const handleGoToEpisode = () => {
    audioRef.current.pause();
    navigate(`/episode/${episodeId}`);
  };

  const progress = Math.round((streamTurns.length / totalExpected) * 100);

  return (
    <div style={{ minHeight: '100vh', padding: 'clamp(20px,5vw,48px) clamp(12px,4vw,24px)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '700px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
            marginBottom: '16px', letterSpacing: '0.04em',
          }}>
            <Sparkles size={12} /> AI PODCAST GENERATOR
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Create a New Episode</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Enter any topic. 4 AI experts debate it — you hear audio within 10 seconds.
          </p>
        </motion.div>

        {/* Topic input — hide when generating */}
        <AnimatePresence>
          {!generating && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-h)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>1</div>
                <span style={{ fontWeight: 700 }}>Choose a Topic</span>
              </div>

              <textarea
                ref={textareaRef}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                rows={3}
                placeholder={EXAMPLES[exampleIndex]}
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border-h)',
                  borderRadius: '12px', color: 'var(--text)', padding: '16px',
                  fontSize: '1rem', lineHeight: 1.6, resize: 'vertical', minHeight: '90px',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-h)'; }}
              />
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '8px' }}>
                Tip: Cmd+Enter to generate
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel preview — always visible */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border-h)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>Your Panel</span>
            {currentSpeaker && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: SPEAKER_COLORS[currentSpeaker] || 'var(--accent)' }}>
                <Volume2 size={14} /> {currentSpeaker} is speaking
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {PANEL.map(p => (
              <motion.div
                key={p.name}
                animate={{ borderColor: currentSpeaker === p.name ? p.color : 'transparent', scale: currentSpeaker === p.name ? 1.04 : 1 }}
                style={{
                  flex: '1 1 130px', minWidth: '120px', padding: '14px',
                  background: 'var(--surface2)', border: `2px solid ${currentSpeaker === p.name ? p.color : 'var(--border)'}`,
                  borderRadius: '14px', textAlign: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{p.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>{p.role}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Generate button */}
        {!generating && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            whileHover={topic.trim() ? { scale: 1.02 } : {}}
            whileTap={topic.trim() ? { scale: 0.98 } : {}}
            onClick={handleGenerate}
            disabled={!topic.trim()}
            style={{
              width: '100%', padding: '18px', borderRadius: '14px',
              background: topic.trim() ? 'var(--gradient)' : 'var(--surface2)',
              color: '#fff', fontWeight: 800, fontSize: '1.0625rem',
              border: 'none', cursor: topic.trim() ? 'pointer' : 'not-allowed',
              opacity: topic.trim() ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: topic.trim() ? '0 4px 24px rgba(124,58,237,0.4)' : 'none',
            }}
          >
            <Sparkles size={20} /> Generate Episode <ArrowRight size={18} />
          </motion.button>
        )}

        {/* Live stream view */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-h)', borderRadius: '20px', padding: '28px', marginTop: '16px' }}
            >
              {/* Progress bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {done ? '✅ Episode ready!' : streamTurns.length === 0 ? 'Starting up…' : `${streamTurns.length} turns generated`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                    style={{ height: '100%', background: 'var(--gradient)', borderRadius: '3px' }}
                  />
                </div>
                {streamTurns.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px' }}>
                    ⏳ First audio arrives in ~10 seconds…
                  </div>
                )}
                {streamTurns.length > 0 && !done && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '8px' }}>
                    🎧 Playing live — more turns loading in the background
                  </div>
                )}
              </div>

              {/* Live transcript */}
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AnimatePresence>
                  {streamTurns.map((turn, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--surface2)',
                        borderRadius: '12px',
                        borderLeft: `3px solid ${SPEAKER_COLORS[turn.speaker] || 'var(--accent)'}`,
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: SPEAKER_COLORS[turn.speaker] || 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {turn.speaker}
                        {turn.audio_url && <Volume2 size={11} />}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>{turn.message}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Done — go to episode */}
              {done && episodeId && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={handleGoToEpisode}
                  style={{
                    marginTop: '20px', width: '100%', padding: '16px',
                    borderRadius: '12px', background: 'var(--gradient)',
                    color: '#fff', fontWeight: 800, fontSize: '1rem',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
                  }}
                >
                  <CheckCircle size={18} /> Open Full Episode
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default CreateEpisode;
