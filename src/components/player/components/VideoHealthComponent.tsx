import React, { useRef, useState } from 'react';
import Tooltip from '../../shared/Tooltip';

interface VideoHealthComponentProps {
  fps: number;
  dropped: number;
}

const VideoHealthComponent = ({ fps, dropped }: VideoHealthComponentProps) => {
  const [maxFps, setMaxFps] = useState(fps);
  const lowFpsStartTimeRef = useRef<number | null>(null);

  React.useEffect(() => {
    if (fps > maxFps) {
      setMaxFps(fps);
      lowFpsStartTimeRef.current = null;
    } else if (fps < maxFps * 0.8 && fps > 0) {
      if (!lowFpsStartTimeRef.current) {
        lowFpsStartTimeRef.current = Date.now();
      } else if (Date.now() - lowFpsStartTimeRef.current > 5000) {
        setMaxFps(fps);
        lowFpsStartTimeRef.current = null;
      }
    } else {
      lowFpsStartTimeRef.current = null;
    }
  }, [fps, maxFps]);

  if (fps <= 0) return null;

  const getFpsColor = () => {
    // Guess target FPS based on max seen
    let targetFps = 30;
    if (maxFps > 55) {
      targetFps = 60;
    } else if (maxFps > 49) {
      targetFps = 50;
    } else if (maxFps > 45) {
      targetFps = 48;
    }

    if (fps >= targetFps * 0.9) return 'text-white';
    if (fps >= targetFps * 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Tooltip text="Video Health (FPS / Dropped Frames)">
      <div className="flex flex-row items-center gap-2 text-xs font-medium whitespace-nowrap">
        <div className={`flex flex-row items-center gap-1 ${getFpsColor()}`}>
          <span>{Math.round(fps)} FPS</span>
        </div>
        {dropped > 0 && (
          <div className="text-red-400 animate-pulse">
            <span>Dropped: {dropped}</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default VideoHealthComponent;
