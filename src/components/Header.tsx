import React, { useState } from 'react';
import { Menu, X, Trophy, FileText, Home, Award } from 'lucide-react';

const brandLogoSrc = new URL('../../data/aos_logo.png', import.meta.url).href;
const ontodeFeliratSrc = new URL('../../data/sponsors/ontode_felirat.png', import.meta.url).href;

interface HeaderProps {
  currentView: 'home' | 'leagues' | 'rules' | 'history' | 'admin';
  setView: (view: 'home' | 'leagues' | 'rules' | 'history' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
}

export default function Header({ currentView, setView }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Kezdőlap', icon: Home, view: 'home' as const },
    { name: 'Bajnokságok', icon: Trophy, view: 'leagues' as const },
    { name: 'Liga története', icon: Award, view: 'history' as const },
    { name: 'Szabályzat', icon: FileText, view: 'rules' as const },
  ];

  const handleNavClick = (view: 'home' | 'leagues' | 'rules' | 'history' | 'admin') => {
    setView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 gap-3">
          
          {/* Logo Brand Zone */}
          <button
            type="button"
            onClick={() => handleNavClick('home')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            id="brand-logo"
            aria-label="Vissza a kezdőlapra"
          >
            <img
              src={brandLogoSrc}
              alt="Arasz-Öntöde Squashliga"
              className="h-12 sm:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <img
              src={ontodeFeliratSrc}
              alt="Öntöde"
              className="h-9 sm:h-14 w-auto object-contain translate-y-[1px] transition-transform duration-200 group-hover:scale-[1.01]"
            />
          </button>

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
                      ? 'bg-brand-red/10 text-brand-red'
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

          {/* Hamburger Menu Trigger (Mobile) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              id="mobile-menu-trigger"
              aria-label={mobileMenuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-panel"
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
                  isActive ? 'bg-brand-red/10 text-brand-red' : 'text-gray-600 hover:bg-gray-50'
                }`}
                id={`mobile-nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}

        </div>
      )}
    </header>
  );
}
