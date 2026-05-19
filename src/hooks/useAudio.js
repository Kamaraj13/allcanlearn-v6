import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudio() {
  const audioRef = useRef(new Audio());
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0-100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  // Wire up audio events
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      // auto-advance
      setCurrentIndex(prev => {
        const next = prev + 1;
        return next; // loadTrack effect handles actual advancement
      });
    };
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  // When currentIndex changes, load & play next track (if we have tracks)
  useEffect(() => {
    if (!tracks.length) return;
    const clampedIndex = Math.min(currentIndex, tracks.length - 1);
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
      return;
    }
    const track = tracks[clampedIndex];
    if (!track?.src) return;

    const audio = audioRef.current;
    audio.src = track.src;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [currentIndex, tracks]);

  // Volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const loadTracks = useCallback((newTracks, startIndex = 0) => {
    setTracks(newTracks);
    setCurrentIndex(startIndex);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const play = useCallback(() => {
    audioRef.current.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, tracks.length - 1));
  }, [tracks.length]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const jumpTo = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const seek = useCallback((pct) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }, []);

  const setVol = useCallback((v) => {
    setVolume(Math.max(0, Math.min(1, v)));
  }, []);

  const currentTrack = tracks[currentIndex] || null;

  return {
    tracks,
    currentIndex,
    currentTrack,
    isPlaying,
    progress,
    duration,
    currentTime,
    volume,
    loadTracks,
    play,
    pause,
    togglePlay,
    next,
    prev,
    jumpTo,
    seek,
    setVolume: setVol,
    hasNext: currentIndex < tracks.length - 1,
    hasPrev: currentIndex > 0,
  };
}
