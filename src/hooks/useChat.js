import { useState, useEffect, useRef, useCallback } from 'react';

export function useChat(username) {
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!username) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'development' ? ':8000' : '';
    const url = `${protocol}://${host}${port}/ws/chat?username=${encodeURIComponent(username)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'online_users') {
          setOnlineCount(data.count || 0);
        } else if (data.type === 'message' || data.type === 'system') {
          setMessages(prev => [...prev.slice(-200), data]);
          if (data.type === 'message' && data.online_count !== undefined) {
            setOnlineCount(data.online_count);
          }
        } else if (data.type === 'history') {
          setMessages(data.messages || []);
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3s
      reconnectTimer.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [username]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && msg.trim()) {
      wsRef.current.send(msg.trim());
    }
  }, []);

  return { messages, onlineCount, send, connected };
}
