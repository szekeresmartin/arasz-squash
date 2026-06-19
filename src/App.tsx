import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicHome from './components/PublicHome';
import PublicLeagues from './components/PublicLeagues';
import Rules from './components/Rules';
import AdminPanel from './components/AdminPanel';
import SponsorBar from './components/SponsorBar';
import { Player, League, Match, Sponsor, MatchScore } from './types';
import { DEFAULT_PLAYERS, DEFAULT_LEAGUES, DEFAULT_MATCHES, DEFAULT_SPONSORS } from './data';

export default function App() {
  
  // ----------------------------------------------------
  // RESZONZÍV PERSISZTENCIA (REACTIVE STORAGE)
  // ----------------------------------------------------
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = localStorage.getItem('sq_players');
      return stored ? JSON.parse(stored) : DEFAULT_PLAYERS;
    } catch {
      return DEFAULT_PLAYERS;
    }
  });

  const [leagues, setLeagues] = useState<League[]>(() => {
    try {
      const stored = localStorage.getItem('sq_leagues');
      return stored ? JSON.parse(stored) : DEFAULT_LEAGUES;
    } catch {
      return DEFAULT_LEAGUES;
    }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const stored = localStorage.getItem('sq_matches');
      return stored ? JSON.parse(stored) : DEFAULT_MATCHES;
    } catch {
      return DEFAULT_MATCHES;
    }
  });

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const stored = localStorage.getItem('sq_sponsors');
      return stored ? JSON.parse(stored) : DEFAULT_SPONSORS;
    } catch {
      return DEFAULT_SPONSORS;
    }
  });

  // Háttér mentések localStorage-ba ha az állapotok módosulnak
  useEffect(() => {
    localStorage.setItem('sq_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('sq_leagues', JSON.stringify(leagues));
  }, [leagues]);

  useEffect(() => {
    localStorage.setItem('sq_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('sq_sponsors', JSON.stringify(sponsors));
  }, [sponsors]);

  // ----------------------------------------------------
  // NAVIGÁCIÓS ÁLLAPOTOK & ÚTVONALAK (ROUTING)
  // ----------------------------------------------------
  const [currentView, setCurrentView] = useState<'home' | 'leagues' | 'rules' | 'admin'>('home');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('tabella');

  // Útvonal-szinkronizáció beolvasása betöltéskor és lépkedésnél
  useEffect(() => {
    const syncViewFromLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path === '/admin/login' || hash === '#admin') {
        setCurrentView('admin');
      } else if (path === '/rules' || path === '/szabalyzat' || hash === '#rules') {
        setCurrentView('rules');
      } else if (path === '/leagues' || path === '/bajnoksagok' || hash === '#leagues') {
        setCurrentView('leagues');
      } else {
        setCurrentView('home');
      }
    };
    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    window.addEventListener('hashchange', syncViewFromLocation);
    return () => {
      window.removeEventListener('popstate', syncViewFromLocation);
      window.removeEventListener('hashchange', syncViewFromLocation);
    };
  }, []);

  // Segédfüggvény külső navigáláshoz és fül átállításhoz
  const handleSetView = (
    view: 'home' | 'leagues' | 'rules' | 'admin', 
    extra?: { leagueId?: string; subTab?: string }
  ) => {
    setCurrentView(view);

    // Virtuális URL útvonal frissítése böngészőben (try-catch párosítva az iframe védelem érdekében)
    let path = '/';
    if (view === 'admin') path = '/admin';
    else if (view === 'rules') path = '/rules';
    else if (view === 'leagues') path = '/leagues';

    try {
      window.history.pushState({}, '', path);
    } catch {
      // fallback ha iframe-beli biztonság korlátozza
    }

    if (view === 'leagues') {
      if (extra?.leagueId) {
        setSelectedLeagueId(extra.leagueId);
      } else if (!selectedLeagueId) {
        // Ha nincs kiválasztott liga és általánosan kattintanak rá, az első aktívat tesszük be
        setSelectedLeagueId(leagues[0]?.id || null);
      }
      if (extra?.subTab) {
        setSelectedSubTab(extra.subTab);
      }
    }
  };

  // ----------------------------------------------------
  // BEKÜLDÉSEK & JÓVÁHAGYÁSOK (DISPATCH HANDLERS)
  // ----------------------------------------------------
  const handleAddPlayer = (p: Player) => {
    setPlayers(prev => [p, ...prev]);
  };

  const handleUpdatePlayer = (updated: Player) => {
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    // Elemeltük a ligás regisztrációját is
    setLeagues(prev => prev.map(l => ({
      ...l,
      playerIds: l.playerIds.filter(pId => pId !== id)
    })));
  };

  const handleAddLeague = (l: League) => {
    setLeagues(prev => [...prev, l]);
  };

  const handleUpdateLeague = (updated: League) => {
    setLeagues(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleAddMatches = (newMatches: Match[]) => {
    // Sorsolás importálásakor hozzáfűzzük a tervezett meccseket
    setMatches(prev => [...prev, ...newMatches]);
  };

  // Eredmény beküldése
  const handleSubmitResult = (newSubmission: Match) => {
    setMatches(prev => {
      // Ha már van felvéve tervezett meccsként kártya az adatbázisban, lecseréljük a beküldöttre,
      // így megmarad a pozíciója, különben hozzáfűzzük.
      const matchExists = prev.some(m => m.id === newSubmission.id);
      if (matchExists) {
        return prev.map(m => m.id === newSubmission.id ? newSubmission : m);
      }
      return [newSubmission, ...prev];
    });
  };

  // Beküldött meccs jóváhagyása
  const handleApproveMatch = (matchId: string, finalScoreOverride?: MatchScore) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'Jóváhagyva',
          // Ha az admin szerkesztette elmentjük az új pontokat, egyébként marad a beküldött
          submittedScore: finalScoreOverride || m.submittedScore
        };
      }
      return m;
    }));
  };

  // Beküldött meccs elutasítása
  const handleRejectMatch = (matchId: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        // Visszaállítjuk tervezett státuszba és levesszük a beküldött részleteket
        return {
          ...m,
          status: 'Tervezett',
          submittedScore: undefined,
          submitterName: undefined,
          submitterContact: undefined,
          comment: undefined
        };
      }
      return m;
    }));
  };

  const handleAddSponsor = (s: Sponsor) => {
    setSponsors(prev => [...prev, s]);
  };

  const handleUpdateSponsor = (updated: Sponsor) => {
    setSponsors(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  // Függőben lévő meccsek száma az Admin jelvényhez
  const pendingCount = matches.filter(m => m.status === 'Beküldve').length;

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-between" id="app-wrapper">
      
      {/* 1. Header Navigation */}
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
        pendingSubmissionsCount={pendingCount} 
      />

      {/* 2. Main Workstation Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main">
        {currentView === 'home' && (
          <PublicHome 
            players={players} 
            leagues={leagues} 
            matches={matches} 
            setView={handleSetView} 
          />
        )}

        {currentView === 'leagues' && (
          <PublicLeagues
            players={players}
            leagues={leagues}
            matches={matches}
            setView={handleSetView}
            selectedLeagueId={selectedLeagueId}
            setSelectedLeagueId={setSelectedLeagueId}
            initialSubTab={selectedSubTab}
            onSubmitResult={handleSubmitResult}
          />
        )}

        {currentView === 'rules' && (
          <Rules setView={handleSetView} />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            players={players}
            leagues={leagues}
            matches={matches}
            sponsors={sponsors}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onAddLeague={handleAddLeague}
            onUpdateLeague={handleUpdateLeague}
            onAddMatches={handleAddMatches}
            onApproveMatch={handleApproveMatch}
            onRejectMatch={handleRejectMatch}
            onAddSponsor={handleAddSponsor}
            onUpdateSponsor={handleUpdateSponsor}
          />
        )}
      </main>

      {/* 3. Partner & Sponsors Horizontal bar */}
      <SponsorBar sponsors={sponsors} />

      {/* 4. Footer credits */}
      <Footer setView={handleSetView} />

    </div>
  );
}
