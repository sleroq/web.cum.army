import { Link, Outlet } from 'react-router-dom';
import React, { useContext } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useSettings } from '../../providers/SettingsContext';
import SettingsModal from '../shared/SettingsModal';
import { SITE_NAME } from '../../config/site';
import { CinemaModeContext } from '../../providers/CinemaModeProvider';

const RootWrapper = () => {
  const { setSettingsOpen } = useSettings();
  const cinemaContext = useContext(CinemaModeContext);
  const cinemaMode = cinemaContext?.cinemaMode || false;

  return (
    <div className="min-h-screen flex flex-col">
      {!cinemaMode && (
        <nav className="bg-surface border-b border-border mt-0 fixed w-full z-100 top-0">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8 h-12 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-foreground">
              <img
                src="/assets/images/icon.png"
                alt={SITE_NAME}
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-bold leading-tight text-2xl">{SITE_NAME}</span>
            </Link>

            <button
              onClick={() => setSettingsOpen(true)}
              className="ml-auto p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-foreground/10"
              aria-label="Settings"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
          </div>
        </nav>
      )}

      <SettingsModal />

      <main className={`${!cinemaMode ? 'pt-12 md:pt-12' : ''} grow`}>
        <Outlet />
      </main>

      {!cinemaMode && (
        <footer className="mx-auto px-2 container py-6">
          <ul className="flex items-center justify-center mt-3 sm:mt-0 space-x-4">
            <li>
              <a href="https://cum.army" className="hover:underline">
                Contact
              </a>
            </li>
            <li>
              <a href="https://github.com/sleroq/web.cum.army" className="hover:underline">
                Github
              </a>
            </li>
          </ul>
        </footer>
      )}
    </div>
  );
};

export default RootWrapper;
