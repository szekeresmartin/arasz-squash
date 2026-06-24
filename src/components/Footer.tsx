import React from 'react';
import { Trophy, FileText } from 'lucide-react';

interface FooterProps {
  setView: (view: 'home' | 'leagues' | 'rules', extra?: { leagueId?: string; subTab?: string }) => void;
}

export default function Footer({ setView }: FooterProps) {
  return (
    <footer
      className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800"
      id="app-footer"
      style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-red text-white p-2 rounded-lg">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white uppercase">
                Arasz-Öntöde Squashliga
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm font-sans">
              A megye legmodernebb, legpörgősebb amatőr fallabda bajnoksága. Csatlakozz hozzánk, játssz sportszerűen és küzdj meg a bajnoki címért!
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-mono font-bold tracking-wider uppercase text-white">Navigáció</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => setView('home')} 
                  className="hover:text-white transition-colors text-gray-400 hover:underline text-left cursor-pointer"
                >
                  Kezdőlap
                </button>
              </li>
              <li>
              <button 
                  onClick={() => setView('leagues', { subTab: 'tabella' })} 
                  className="hover:text-white transition-colors text-gray-400 hover:underline text-left cursor-pointer"
                >
                  Bajnokságok
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setView('rules')} 
                  className="hover:text-white transition-colors text-gray-400 hover:underline text-left cursor-pointer"
                >
                  Szabályzat
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider line */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-gray-500">
          <p>© {new Date().getFullYear()} Arasz-Öntöde Squashliga. Minden jog fenntartva.</p>
        </div>
      </div>
    </footer>
  );
}
