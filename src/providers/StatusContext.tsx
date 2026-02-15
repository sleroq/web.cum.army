import React from 'react';

export interface StatusResult {
  streamKey: string;
  motd: string;
  viewers: number;
  isOnline: boolean;
  streamStart: string;
}

export interface StatusProviderContextProps {
  streamStatus: StatusResult[] | undefined;
  refreshStatus: () => void;
}

export const StatusContext = React.createContext<StatusProviderContextProps>({
  streamStatus: undefined,
  refreshStatus: () => {},
});
