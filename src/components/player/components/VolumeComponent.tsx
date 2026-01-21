import React, { useEffect, useState } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/16/solid';

interface VolumeComponentProps {
  isMuted: boolean;
  onStateChanged: (isMuted: boolean) => void;
  onVolumeChanged: (value: number) => void;
}

const VolumeComponent = ({ isMuted: propIsMuted, onStateChanged, onVolumeChanged }: VolumeComponentProps) => {
  const [isMuted, setIsMuted] = useState<boolean>(propIsMuted);
  const [showSlider, setShowSlider] = useState<boolean>(false);

  useEffect(() => {
    onStateChanged(isMuted);
  }, [isMuted, onStateChanged]);

  const onVolumeChange = (newValue: number) => {
    if (isMuted && newValue !== 0) {
      setIsMuted(false);
    }
    if (!isMuted && newValue === 0) {
      setIsMuted(true);
    }

    onVolumeChanged(newValue / 100);
  };

  return (
    <div
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      className="flex justify-start max-w-42 gap-2 items-center"
    >
      {isMuted && <SpeakerXMarkIcon className="w-5" onClick={() => setIsMuted((prev) => !prev)} />}
      {!isMuted && <SpeakerWaveIcon className="w-5" onClick={() => setIsMuted((prev) => !prev)} />}
      <input
        id="default-range"
        type="range"
        max={100}
        defaultValue={20}
        onChange={(event) => onVolumeChange(parseInt(event.target.value))}
        className={`
					${
            !showSlider &&
            `
						invisible
					`
          } 
				w-18 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700`}
      />
    </div>
  );
};
export default VolumeComponent;
