import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Users, CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { generateEpisode } from '../services/api';
import { useToast } from '../components/UI/Toast';

const STEPS = [
  { id: 'assemble',  label: 'Assembling panel',      icon: Users },
  { id: 'dialogue', label: 'Writing dialogue',        icon: Mic },
  { id: 'voices',   label: 'Synthesising voices',     icon: Sparkles },
  { id: 'done',     label: 'Done!',                   icon: CheckCircle },
];

const EXAMPLES = [
  'Why does inflation happen and who does it hurt most?',
  'How does the human brain form memories?',
  'What would a Universal Basic Income actually look like?',
  'Is nuclear energy the answer to climate change?',
  'How do social media algorithms shape our beliefs?',
];

const CHARACTERS = [
  { name: 'The Expert',      role: 'Deep domain knowledge', color: '#7C3AED', emoji: '🧑‍🎓' },
  { name: 'The Skeptic',     role: 'Questions everything',  color: '#EC4899', emoji: '🤨' },
  { name: 'The Optimist',    role: 'Bright-side thinker',   color: '#10B981', emoji: '😊' },
  { name: 'The Pragmatist',  role: 'Practical solutions',   color: '#F59E0B', emoji: '🛠️' },
];

function CharacterCard({ char, topic, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        textAlign: 'center',
        transition: 'border-color 0.2s',
        flex: '1 1 140px',
        minWidth: '130px',
      }}
      whileHover={{ borderColor: char.color, scale: 1.02 }}
    >
      {/* Avatar circle */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: `${char.color}22`,
        border: `2px solid ${char.color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
      }}>
        {char.emoji}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{char.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{char.role}</div>
      </div>
      {topic && (
        <div style={{
          fontSize: '0.7rem',
          color: char.color,
          background: `${char.color}15`,
          padding: '3px 8px',
          borderRadius: '999px',
          fontWeight: 600,
        }}>
          Ready
        </div>
      )}
    </motion.div>
  );
}

function StepIndicator({ step, currentStep }) {
  const Icon = step.icon;
  const isDone    = STEPS.indexOf(step) < STEPS.indexOf(STEPS.find(s => s.id === currentStep));
  const isCurrent = step.id === currentStep;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0',
      opacity: isDone || isCurrent ? 1 : 0.3,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: isDone
          ? 'rgba(16,185,129,0.2)'
          : isCurrent
            ? 'rgba(124,58,237,0.2)'
            : 'var(--surface3)',
        border: `2px solid ${isDone ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.3s',
      }}>
        {isCurrent && !isDone
          ? <Loader size={14} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
          : <Icon size={14} color={isDone ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--muted)'} />
        }
      </div>
      <span style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: isDone ? 'var(--green)' : isCurrent ? 'var(--text)' : 'var(--muted)',
        transition: 'color 0.3s',
      }}>
        {step.label}
      </span>
    </div>
  );
}

export function CreateEpisode({ onEpisodeCreated }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const textareaRef = useRef(null);

  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex(i => (i + 1) % EXAMPLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Auto-fill topic from URL
  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      textareaRef.current?.focus();
      return;
    }
    setGenerating(true);
    setCurrentStep(STEPS[0].id);
    setProgress(0);

    // Simulate step progression
    const stepDurations = [8000, 20000, 25000, 2000]; // rough ms per step
    const totalDuration = stepDurations.reduce((a, b) => a + b, 0);

    const stepTimers = STEPS.map((step, i) => {
      const delay = stepDurations.slice(0, i).reduce((a, b) => a + b, 0);
      return setTimeout(() => {
        setCurrentStep(step.id);
      }, delay);
    });

    // Progress bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const e = Date.now() - startTime;
      setProgress(Math.min(95, (e / totalDuration) * 100));
    }, 200);

    try {
      const data = await generateEpisode(topic.trim());
      clearInterval(progressInterval);
      stepTimers.forEach(clearTimeout);
      setCurrentStep('done');
      setProgress(100);

      setTimeout(() => {
        setGenerating(false);
        if (data?.episode_id || data?.id) {
          const id = data.episode_id || data.id;
          onEpisodeCreated?.();
          navigate(`/episode/${id}`);
        } else {
          // Try to get newest episode
          onEpisodeCreated?.();
          navigate('/library');
        }
        toast.success('Episode created successfully!');
      }, 1200);
    } catch (err) {
      clearInterval(progressInterval);
      stepTimers.forEach(clearTimeout);
      setGenerating(false);
      setCurrentStep(null);
      setProgress(0);
      toast.error('Failed to generate episode. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '48px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '680px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
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
            marginBottom: '16px',
            letterSpacing: '0.04em',
          }}>
            <Sparkles size={12} />
            AI PODCAST GENERATOR
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>
            Create a New Episode
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Enter any topic and 4 AI experts will discuss it in depth — with real voices.
          </p>
        </motion.div>

        {/* Step 1: Topic input */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-h)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fff',
            }}>1</div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Choose a Topic</span>
          </div>

          <textarea
            ref={textareaRef}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={generating}
            rows={4}
            placeholder={EXAMPLES[exampleIndex]}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border-h)',
              borderRadius: '12px',
              color: 'var(--text)',
              padding: '16px',
              fontSize: '1rem',
              lineHeight: 1.6,
              resize: 'vertical',
              minHeight: '100px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = 'var(--glow)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-h)'; e.target.style.boxShadow = 'none'; }}
          />

          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '8px' }}>
            Be specific for better results. You can ask a question or state a topic.
          </div>
        </motion.div>

        {/* Step 2: Panel preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-h)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--surface3)',
              border: '2px solid var(--border-h)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--muted)',
            }}>2</div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Your AI Panel</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {CHARACTERS.map((char, i) => (
              <CharacterCard
                key={char.name}
                char={char}
                topic={topic.trim()}
                delay={i * 0.06}
              />
            ))}
          </div>

          {topic.trim() && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(124,58,237,0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(124,58,237,0.2)',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Topic matched!</span>{' '}
              These 4 experts will discuss "<em style={{ color: 'var(--text)' }}>{topic.trim()}</em>" from their unique perspectives.
            </div>
          )}
        </motion.div>

        {/* Generate button */}
        {!generating && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={topic.trim() ? { scale: 1.02 } : {}}
            whileTap={topic.trim() ? { scale: 0.98 } : {}}
            onClick={handleGenerate}
            disabled={!topic.trim()}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '14px',
              background: topic.trim() ? 'var(--gradient)' : 'var(--surface2)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.0625rem',
              border: 'none',
              cursor: topic.trim() ? 'pointer' : 'not-allowed',
              opacity: topic.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: topic.trim() ? '0 4px 24px rgba(124,58,237,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Sparkles size={20} />
            Generate Episode
            <ArrowRight size={18} />
          </motion.button>
        )}

        {/* Generating state */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-h)',
                borderRadius: '20px',
                padding: '32px',
                overflow: 'hidden',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: '8px',
                }}>
                  Creating your episode…
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--surface3)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '100%',
                      background: 'var(--gradient)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px' }}>
                  {Math.round(progress)}%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {STEPS.map(step => (
                  <StepIndicator key={step.id} step={step} currentStep={currentStep} />
                ))}
              </div>

              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                background: 'rgba(124,58,237,0.08)',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                color: 'var(--muted)',
              }}>
                This usually takes 2–3 minutes. Hang tight — we're crafting something great for you!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          /* padding handled inline */
        }
      `}</style>
    </div>
  );
}

export default CreateEpisode;
