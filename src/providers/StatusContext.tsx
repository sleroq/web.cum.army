import React from 'react';

export interface WhepSession {
  id: string;
  currentLayer: string;
  sequenceNumber: number;
  timestamp: number;
  packetsWritten: number;
}

export interface StatusResult {
  streamKey: string;
  whepSessions: WhepSession[];
  videoStreams: VideoStream[];
}

export interface VideoStream {
  rid: string;
  packetsReceived: number;
  lastKeyFrameSeen: string;
}

export interface StatusProviderContextProps {
  streamStatus: StatusResult[] | undefined;
  refreshStatus: () => void;
}

export const StatusContext = React.createContext<StatusProviderContextProps>({
  streamStatus: undefined,
  refreshStatus: () => {},
});
