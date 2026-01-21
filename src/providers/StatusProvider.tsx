import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusContext, StatusResult, StatusProviderContextProps } from './StatusContext';

interface StatusProviderProps {
  children: React.ReactNode;
}

class FetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const apiPath = import.meta.env.VITE_API_PATH;
const fetchStatus = (
  onSuccess?: (statusResults: StatusResult[]) => void,
  onError?: (error: FetchError) => void
) =>
  fetch(`${apiPath}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((result) => {
      if (result.status === 503) {
        throw new FetchError('Status API disabled', result.status);
      }
      if (!result.ok) {
        throw new FetchError('Unknown error when calling status', result.status);
      }

      return result.json();
    })
    .then((result: StatusResult[]) => onSuccess?.(result))
    .catch((err: FetchError) => onError?.(err));

export function StatusProvider(props: StatusProviderProps) {
  const [isStatusActive, setIsStatusActive] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<StatusResult[] | undefined>(undefined);
  const intervalCountRef = useRef<number>(5000);

  const fetchStatusResultHandler = useCallback((result: StatusResult[]) => {
    setStreamStatus(result);
  }, []);

  const fetchStatusErrorHandler = useCallback((error: FetchError) => {
    console.error('StatusProviderError', error.status, error.message);
    console.error(`Don't worry about status errors. This does not affect the stream.`);

    if (error.status === 503) {
      setIsStatusActive(false);
      setStreamStatus(undefined);
    }
  }, []);

  useEffect(() => {
    fetchStatus(
      (result) => {
        setStreamStatus(result);
        setIsStatusActive(true);
      },
      (error) => {
        if (error.status === 503) {
          setIsStatusActive(false);
          setStreamStatus(undefined);
        }

        console.error('StatusProviderError', error.status, error.message);
      }
    ).catch((err) => console.error('StatusProviderError', err));
  }, []);

  useEffect(() => {
    if (!isStatusActive) {
      return;
    }

    const intervalHandler = async () => {
      await fetchStatus(fetchStatusResultHandler, fetchStatusErrorHandler);
    };

    const interval = setInterval(intervalHandler, intervalCountRef.current);
    return () => clearInterval(interval);
  }, [isStatusActive, fetchStatusResultHandler, fetchStatusErrorHandler]);

  const refreshStatus = useCallback(async () => {
    await fetchStatus(fetchStatusResultHandler, fetchStatusErrorHandler);
  }, [fetchStatusResultHandler, fetchStatusErrorHandler]);

  const state = useMemo<StatusProviderContextProps>(
    () => ({
      streamStatus: streamStatus,
      refreshStatus: refreshStatus,
    }),
    [streamStatus, refreshStatus]
  );

  return <StatusContext.Provider value={state}>{props.children}</StatusContext.Provider>;
}
