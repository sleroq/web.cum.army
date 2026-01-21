import React, { useState } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/16/solid';

interface VolumeComponentProps {
  isMuted: boolean;
  onStateChanged: (isMuted: boolean) => void;
  onVolumeChanged: (value: number) => void;
}

const VolumeComponent = ({ isMuted, onStateChanged, onVolumeChanged }: VolumeComponentProps) => {
  const [showSlider, setShowSlider] = useState<boolean>(false);

  const onVolumeChange = (newValue: number) => {
    if (isMuted && newValue !== 0) {
      onStateChanged(false);
    }
    if (!isMuted && newValue === 0) {
      onStateChanged(true);
    }

    onVolumeChanged(newValue / 100);
  };

  return (
    <div
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      className="flex justify-start max-w-42 gap-2 items-center"
    >
      {isMuted && <SpeakerXMarkIcon onClick={() => onStateChanged(!isMuted)} />}
      {!isMuted && <SpeakerWaveIcon onClick={() => onStateChanged(!isMuted)} />}
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
