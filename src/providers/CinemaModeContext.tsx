import { createContext, useContext, Dispatch, SetStateAction } from 'react';

export interface CinemaModeProviderContextProps {
  cinemaMode: boolean;
  setCinemaMode: Dispatch<SetStateAction<boolean>>;
  toggleCinemaMode: () => void;
}

export const CinemaModeContext = createContext<CinemaModeProviderContextProps | undefined>(
  undefined
);

export const useCinemaMode = () => {
  const context = useContext(CinemaModeContext);
  if (!context) {
    throw new Error('useCinemaMode must be used within a CinemaModeProvider');
  }
  return context;
};
