import { useState, useEffect, useCallback, useRef } from 'react';
import { getEpisodes, getEpisode } from '../services/api';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let episodesCache = null;
let cacheTime = 0;
const episodeDetailCache = {};

export function useEpisodes() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && episodesCache && now - cacheTime < CACHE_TTL) {
      setEpisodes(episodesCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEpisodes();
      episodesCache = data.episodes || [];
      cacheTime = Date.now();
      setEpisodes(episodesCache);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { episodes, loading, error, refetch: () => fetch(true) };
}

export function useEpisode(id) {
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const prevId = useRef(null);

  useEffect(() => {
    if (!id) return;
    if (prevId.current === id && episodeDetailCache[id]) {
      setEpisode(episodeDetailCache[id]);
      setLoading(false);
      return;
    }
    prevId.current = id;
    setLoading(true);
    setError(null);
    getEpisode(id)
      .then(data => {
        episodeDetailCache[id] = data;
        setEpisode(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { episode, loading, error };
}
