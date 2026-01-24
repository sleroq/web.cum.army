import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePlayerInteractionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  pauseOnClick: boolean;
}

export const usePlayerInteraction = ({ videoRef, pauseOnClick }: UsePlayerInteractionProps) => {
  const [activeAction, setActiveAction] = useState<'play' | 'pause' | null>(null);
  const actionTimeoutRef = useRef<number | undefined>(undefined);
  const clickTimeoutRef = useRef<number | undefined>(undefined);
  const lastClickTimeRef = useRef(0);
  const clickDelay = 250;

  const handleVideoPlayerClick = useCallback(() => {
    if (!pauseOnClick) return;

    lastClickTimeRef.current = Date.now();

    clickTimeoutRef.current = window.setTimeout(() => {
      const timeSinceLastClick = Date.now() - lastClickTimeRef.current;
      if (timeSinceLastClick >= clickDelay && timeSinceLastClick - clickDelay < 5000) {
        if (videoRef.current?.paused) {
          videoRef.current.play().catch((err) => console.error('VideoError', err));
        } else {
          videoRef.current?.pause();
        }
      }
    }, clickDelay);
  }, [pauseOnClick, videoRef]);

  const handleVideoPlayerDoubleClick = useCallback(() => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    lastClickTimeRef.current = 0;
    videoRef.current
      ?.requestFullscreen()
      .catch((err) => console.error('VideoPlayer_RequestFullscreen', err));
  }, [videoRef]);

  const handlePlayPause = useCallback((e: Event) => {
    const type = e.type === 'play' ? 'play' : 'pause';
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    setActiveAction(type);
    actionTimeoutRef.current = window.setTimeout(() => setActiveAction(null), 500);
  }, []);

  // Attach play/pause listeners to video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.addEventListener('play', handlePlayPause);
    videoEl.addEventListener('pause', handlePlayPause);

    return () => {
      videoEl.removeEventListener('play', handlePlayPause);
      videoEl.removeEventListener('pause', handlePlayPause);
    };
  }, [videoRef, handlePlayPause]);

  return {
    activeAction,
    handleVideoPlayerClick,
    handleVideoPlayerDoubleClick,
  };
};
