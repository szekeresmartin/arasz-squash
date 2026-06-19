import React, { useState } from 'react';
import { Menu, X, Trophy, Shield, FileText, Home, LogOut } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'leagues' | 'rules' | 'admin';
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
  pendingSubmissionsCount: number;
}

export default function Header({ currentView, setView, pendingSubmissionsCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Kezdőlap', icon: Home, view: 'home' as const },
    { name: 'Bajnokságok', icon: Trophy, view: 'leagues' as const },
    { name: 'Szabályzat', icon: FileText, view: 'rules' as const },
  ];

  const handleNavClick = (view: 'home' | 'leagues' | 'rules' | 'admin') => {
    setView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Brand Zone */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="flex items-center gap-3 cursor-pointer group"
            id="brand-logo"
          >
            <div className="bg-brand-red text-white p-2.5 rounded-xl group-hover:bg-brand-maroon shadow-sm transition-colors duration-200">
              <Trophy className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-gray-900 uppercase block leading-none">
                Arasz-Öntöde
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#9C1C1C] uppercase font-extrabold mt-0.5 block">
                Squashliga
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Only Public View Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-red-50 text-brand-red'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  id={`nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Action Zone: Only visible if on Admin mode to log out */}
          <div className="hidden lg:flex items-center gap-3">
            {currentView === 'admin' ? (
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-brand-red text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-red-150 transition-all duration-200"
                id="header-logout-button"
              >
                <LogOut className="w-4 h-4" />
                Kilépés az Adminból
              </button>
            ) : null}
          </div>

          {/* Hamburger Menu Trigger (Mobile) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              id="mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-2 animate-fadeIn" id="mobile-navigation-panel">
          {navigationItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.view)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left font-sans text-sm font-bold ${
                  isActive ? 'bg-red-50 text-brand-red' : 'text-gray-600 hover:bg-gray-50'
                }`}
                id={`mobile-nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}

          {currentView === 'admin' && (
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => handleNavClick('home')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 hover:bg-red-100 text-brand-red rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-center"
                id="mobile-logout-button"
              >
                <LogOut className="w-4 h-4" />
                Kilépés az Adminból
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
