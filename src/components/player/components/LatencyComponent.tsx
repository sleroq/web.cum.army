import React from 'react';
import { SignalIcon } from '@heroicons/react/16/solid';
import Tooltip from '../../shared/Tooltip';

interface LatencyComponentProps {
  latency: number;
}

const LatencyComponent = ({ latency }: LatencyComponentProps) => {
  if (latency <= 0) return null;

  const getLatencyColor = (ms: number) => {
    if (ms < 150) return 'text-white';
    if (ms < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Tooltip text="Estimated Latency">
      <div
        className={`flex flex-row items-center gap-1 text-xs font-medium whitespace-nowrap ${getLatencyColor(latency)}`}
      >
        <SignalIcon className="size-3.5!" />
        <span>{Math.round(latency)}ms</span>
      </div>
    </Tooltip>
  );
};

export default LatencyComponent;
