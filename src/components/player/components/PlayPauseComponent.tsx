import React, { useEffect, useState } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/16/solid';

interface PlayPauseComponentProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const PlayPauseComponent = (props: PlayPauseComponentProps) => {
  const [isPaused, setIsPaused] = useState<boolean>(true);

  useEffect(() => {
    const video = props.videoRef.current;
    if (!video) {
      return;
    }

    const playingHandler = () => setIsPaused(false);
    const pauseHandler = () => setIsPaused(true);

    video.addEventListener('playing', playingHandler);
    video.addEventListener('pause', pauseHandler);

    // Sync initial state
    setIsPaused(video.paused);

    return () => {
      video.removeEventListener('playing', playingHandler);
      video.removeEventListener('pause', pauseHandler);
    };
  }, [props.videoRef]);

  const togglePlay = () => {
    const video = props.videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => console.error('VideoError', err));
    } else {
      video.pause();
    }
  };

  if (isPaused) {
    return <PlayIcon onClick={togglePlay} />;
  }
  return <PauseIcon onClick={togglePlay} />;
};

export default PlayPauseComponent;
