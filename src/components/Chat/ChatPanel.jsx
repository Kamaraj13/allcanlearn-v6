import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minus, Send, Wifi, WifiOff } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

const STORAGE_KEY = 'acl_chat_username';

function UsernameModal({ onSet }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const name = value.trim();
    if (!name) return;
    localStorage.setItem(STORAGE_KEY, name);
    onSet(name);
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(8,8,15,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      borderRadius: 'inherit',
      zIndex: 10,
      gap: '16px',
    }}>
      <div style={{ fontSize: '2rem' }}>💬</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Join the Chat</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Chat with other learners live</div>
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Pick a username..."
        maxLength={24}
        style={{
          width: '100%',
          background: 'var(--surface2)',
          border: '1px solid var(--border-h)',
          borderRadius: '10px',
          color: 'var(--text)',
          padding: '10px 14px',
          fontSize: '0.9375rem',
        }}
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          background: !value.trim() ? 'var(--surface3)' : 'var(--gradient)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.9375rem',
          cursor: value.trim() ? 'pointer' : 'not-allowed',
          border: 'none',
          transition: 'all 0.2s',
        }}
      >
        Join Chat
      </button>
    </div>
  );
}

function formatMsgTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, onlineCount, send, connected } = useChat(username || null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !connected) return;
    send(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen(!open); setMinimized(false); }}
        style={{
          position: 'fixed',
          bottom: '96px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--gradient)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && onlineCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--green)',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            border: '2px solid var(--bg)',
          }}>
            {onlineCount > 9 ? '9+' : onlineCount}
          </div>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '156px',
              right: '20px',
              width: '320px',
              height: minimized ? '52px' : '420px',
              background: 'var(--surface)',
              border: '1px solid var(--border-h)',
              borderRadius: '16px',
              zIndex: 199,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              transition: 'height 0.25s ease',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: minimized ? 'none' : '1px solid var(--border)',
              background: 'var(--surface2)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={16} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Live Chat</span>
                {connected
                  ? <Wifi size={12} color="var(--green)" />
                  : <WifiOff size={12} color="var(--muted)" />
                }
                {onlineCount > 0 && (
                  <span style={{
                    background: 'var(--green)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '99px',
                  }}>
                    {onlineCount} online
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setMinimized(!minimized)}
                  style={{ color: 'var(--muted)', padding: '4px', display: 'flex' }}
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{ color: 'var(--muted)', padding: '4px', display: 'flex' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Username prompt */}
                {!username && <UsernameModal onSet={setUsername} />}

                {/* Messages */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {messages.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: '0.8125rem',
                      marginTop: '40px',
                    }}>
                      No messages yet. Say hello! 👋
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isOwn    = msg.type === 'message' && msg.username === username;
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                      return (
                        <div key={i} style={{
                          textAlign: 'center',
                          fontSize: '0.7rem',
                          color: 'var(--muted)',
                          fontStyle: 'italic',
                          padding: '4px 0',
                        }}>
                          {msg.message}
                        </div>
                      );
                    }

                    return (
                      <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        gap: '2px',
                      }}>
                        {!isOwn && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', paddingLeft: '4px' }}>
                            {msg.username}
                          </span>
                        )}
                        <div style={{
                          maxWidth: '80%',
                          padding: '8px 12px',
                          borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: isOwn ? 'var(--gradient)' : 'var(--surface2)',
                          color: '#fff',
                          fontSize: '0.875rem',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}>
                          {msg.message}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', paddingLeft: isOwn ? 0 : '4px', paddingRight: isOwn ? '4px' : 0 }}>
                          {formatMsgTime(msg.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{
                  padding: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: '8px',
                  flexShrink: 0,
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={connected ? 'Type a message…' : 'Connecting…'}
                    disabled={!connected || !username}
                    maxLength={256}
                    style={{
                      flex: 1,
                      background: 'var(--surface2)',
                      border: '1px solid var(--border-h)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      padding: '8px 12px',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !connected || !username}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: input.trim() && connected ? 'var(--gradient)' : 'var(--surface3)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: 'none',
                      cursor: input.trim() && connected ? 'pointer' : 'not-allowed',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatPanel;
