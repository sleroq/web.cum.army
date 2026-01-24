import { useState, useRef, useEffect, useCallback } from 'react';

export const useOverlayVisibility = () => {
  const [videoOverlayVisible, setVideoOverlayVisible] = useState<boolean>(false);
  const videoOverlayVisibleTimeoutRef = useRef<number | undefined>(undefined);

  const resetTimer = useCallback((isVisible: boolean) => {
    setVideoOverlayVisible(isVisible);

    if (videoOverlayVisibleTimeoutRef.current) {
      clearTimeout(videoOverlayVisibleTimeoutRef.current);
    }

    videoOverlayVisibleTimeoutRef.current = window.setTimeout(() => {
      setVideoOverlayVisible(false);
    }, 2500);
  }, []);

  const registerOverlayContainer = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      const handleMouseMove = () => resetTimer(true);
      const handleMouseEnter = () => resetTimer(true);
      const handleMouseLeave = () => resetTimer(false);
      const handleMouseUp = () => resetTimer(true);
      const handleTouchStart = () => resetTimer(true);

      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('touchstart', handleTouchStart, { passive: true });

      return () => {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('touchstart', handleTouchStart);
      };
    },
    [resetTimer]
  );

  useEffect(() => {
    return () => {
      if (videoOverlayVisibleTimeoutRef.current) {
        clearTimeout(videoOverlayVisibleTimeoutRef.current);
      }
    };
  }, []);

  return {
    videoOverlayVisible,
    registerOverlayContainer,
    resetTimer,
  };
};
