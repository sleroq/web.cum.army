import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom'
import React from 'react';
import {CinemaModeContext} from "../../providers/CinemaModeProvider";

const RootWrapper = () => {
  const { cinemaMode } = useContext(CinemaModeContext);
  const navbarEnabled = !cinemaMode;
  
  return (
    <div>
      {navbarEnabled && (
        <nav className="bg-[#1e1e1e] border-b border-white/10 mt-0 fixed w-full z-100 top-0">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8 h-12 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-white">
              <img
                src="/assets/images/icon.png"
                alt="Web Cum Streaming"
                width={32}
                height={32}
                className="rounded"
              />
				  <span className="font-bold leading-tight text-2xl">Web Cum Streaming</span>
				</Link>
			</div>
		</nav>
      )}

      <main className={`${navbarEnabled && "pt-12 md:pt-12"}`}>
        <Outlet />
      </main>

      <footer className="mx-auto px-2 container py-6">
        <ul className="flex items-center justify-center mt-3 text-sm:mt-0 space-x-4">
          <li>
            <a href="https://github.com/Glimesh/broadcast-box" className="hover:underline">GitHub</a>
          </li>
          <li>
            <a href="https://pion.ly" className="hover:underline">Pion</a>
          </li>
          <li>
            <a href="https://glimesh.tv" className="hover:underline">Glimesh</a>
          </li>
        </ul>
      </footer>

    </div>
  )
}

export default RootWrapper
