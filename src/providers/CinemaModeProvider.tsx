import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface CinemaModeProviderContextProps {
  cinemaMode: boolean;
  setCinemaMode: Dispatch<SetStateAction<boolean>>;
  toggleCinemaMode: () => void;
}

export const CinemaModeContext = React.createContext<CinemaModeProviderContextProps | undefined>(
  undefined
);

interface CinemaModeProviderProps {
  children: React.ReactNode;
}

export function CinemaModeProvider(props: CinemaModeProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cinemaModeInUrl = searchParams.get('cinemaMode') === 'true';
  const [cinemaMode, setCinemaMode] = useState(
    () => cinemaModeInUrl || localStorage.getItem('cinema-mode') === 'true'
  );

  const state = useMemo<CinemaModeProviderContextProps>(
    () => ({
      cinemaMode: cinemaMode,
      setCinemaMode: setCinemaMode,
      toggleCinemaMode: () => setCinemaMode((prev) => !prev),
    }),
    [cinemaMode]
  );

  useEffect(() => {
    localStorage.setItem('cinema-mode', cinemaMode ? 'true' : 'false');

    const newParams = new URLSearchParams(searchParams);
    if (cinemaMode) {
      newParams.set('cinemaMode', 'true');
    } else {
      newParams.delete('cinemaMode');
    }

    // Only update if the param actually changed to avoid unnecessary navigation
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [cinemaMode, searchParams, setSearchParams]);
  return <CinemaModeContext.Provider value={state}>{props.children}</CinemaModeContext.Provider>;
}
