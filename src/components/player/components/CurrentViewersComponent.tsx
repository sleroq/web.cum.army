import React, { useContext, useEffect, useMemo } from 'react';
import { UsersIcon } from '@heroicons/react/20/solid';
import { StatusContext } from '../../../providers/StatusContext';

interface CurrentViewersComponentProps {
  streamKey: string;
}

const CurrentViewersComponent = ({ streamKey }: CurrentViewersComponentProps) => {
  const { streamStatus, refreshStatus } = useContext(StatusContext);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const currentViewersCount = useMemo(() => {
    if (!streamKey || !streamStatus) {
      return 0;
    }

    const sessions = streamStatus.filter((session) => session.streamKey === streamKey);

    return sessions.length !== 0 ? sessions[0].whepSessions.length : 0;
  }, [streamKey, streamStatus]);

  return (
    <div className={'flex flex-row items-center gap-1'}>
      <UsersIcon className={'size-4'} />
      {currentViewersCount}
    </div>
  );
};

export default CurrentViewersComponent;
