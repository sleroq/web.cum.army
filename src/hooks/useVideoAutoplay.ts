import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVideoAutoplayOptions {
  preferSound?: boolean;
  maxRetries?: number;
  retryDelays?: number[];
}

export const useVideoAutoplay = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseVideoAutoplayOptions = {}
) => {
  const { preferSound = true, maxRetries = 3, retryDelays = [0, 500, 1500] } = options;

  const [showPlayButton, setShowPlayButton] = useState(false);
  const retryCountRef = useRef(0);
  const currentRetryTimeoutRef = useRef<number | undefined>(undefined);

  const attemptPlay = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    if (!video) return false;

    // Clear any existing retry timeout
    if (currentRetryTimeoutRef.current) {
      clearTimeout(currentRetryTimeoutRef.current);
    }

    // If already playing, just update state
    if (!video.paused) {
      setShowPlayButton(false);
      return true;
    }

    try {
      // Try with preferred sound setting
      video.muted = !preferSound;
      await video.play();

      // Wait a bit to ensure it actually starts playing
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!video.paused) {
        setShowPlayButton(false);
        retryCountRef.current = 0;
        return true;
      }
    } catch {
      // If we prefer sound and this is our first attempt, try muted
      if (preferSound && retryCountRef.current === 0) {
        retryCountRef.current++;
        video.muted = true;
        try {
          await video.play();
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!video.paused) {
            setShowPlayButton(false);
            return true;
          }
        } catch {
          // Fall through to retry logic
        }
      }

      // If we've exhausted retries, show the play button
      if (retryCountRef.current >= maxRetries - 1) {
        setShowPlayButton(true);
        return false;
      }

      // Schedule a retry
      if (retryCountRef.current < retryDelays.length) {
        const delay = retryDelays[retryCountRef.current];
        currentRetryTimeoutRef.current = window.setTimeout(() => {
          retryCountRef.current++;
          // Call the actual function recursively
          (async () => {
            const video = videoRef.current;
            if (!video) return;

            try {
              video.muted = !preferSound;
              await video.play();
              await new Promise((resolve) => setTimeout(resolve, 100));

              if (!video.paused) {
                setShowPlayButton(false);
                retryCountRef.current = 0;
              }
            } catch {
              if (retryCountRef.current >= maxRetries - 1) {
                setShowPlayButton(true);
              }
            }
          })();
        }, delay);
      }

      return false;
    }

    return false;
  }, [preferSound, maxRetries, retryDelays, videoRef]);

  const handlePlayButtonClick = useCallback(async () => {
    const success = await attemptPlay();
    if (success) {
      setShowPlayButton(false);
    }
  }, [attemptPlay]);

  // Monitor video element state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updatePlayingState = () => {
      if (!video.paused) {
        setShowPlayButton(false);
      }
    };

    const handleCanPlay = () => {
      if (retryCountRef.current === 0) {
        attemptPlay();
      }
    };

    video.addEventListener('playing', updatePlayingState);
    video.addEventListener('pause', updatePlayingState);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('playing', updatePlayingState);
      video.removeEventListener('pause', updatePlayingState);
      video.removeEventListener('canplay', handleCanPlay);

      if (currentRetryTimeoutRef.current) {
        clearTimeout(currentRetryTimeoutRef.current);
      }
    };
  }, [videoRef, attemptPlay]);

  // Reset state when video source changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setShowPlayButton(false);
      retryCountRef.current = 0;
    };

    video.addEventListener('loadstart', handleLoadStart);
    return () => video.removeEventListener('loadstart', handleLoadStart);
  }, [videoRef]);

  return {
    showPlayButton,
    attemptPlay,
    handlePlayButtonClick,
  };
};
