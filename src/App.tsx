import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicHome from './components/PublicHome';
import PublicLeagues from './components/PublicLeagues';
import Rules from './components/Rules';
import AdminPanel from './components/AdminPanel';
import SponsorBar from './components/SponsorBar';
import { Player, League, Match, Sponsor, MatchScore } from './types';
import {
  DEFAULT_PLAYERS,
  DEFAULT_LEAGUES,
  DEFAULT_MATCHES,
  DEFAULT_SPONSORS,
  getLeagueBySlug,
  getLeagueSlug,
} from './data';

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

  const tabParamToState = (tab: string | null) => {
    if (tab === 'eredmeny-bekuldese') return 'eredmeny_bekuldese';
    if (tab === 'eredmenyek') return 'eredmenyek';
    if (tab === 'sorsolas') return 'sorsolas';
    if (tab === 'jatekosok') return 'jatekosok';
    if (tab === 'szabalyok') return 'szabalyok';
    return 'tabella';
  };

  const tabStateToParam = (tab: string) => {
    if (tab === 'eredmeny_bekuldese') return 'eredmeny-bekuldese';
    return tab;
  };

  const getLeaguePath = (leagueId: string, tab: string = 'tabella') => {
    return `/bajnoksag/${getLeagueSlug(leagueId)}?tab=${tabStateToParam(tab)}`;
  };

  // Útvonal-szinkronizáció beolvasása betöltéskor és lépkedésnél
  useEffect(() => {
    const syncViewFromLocation = () => {
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      const tab = tabParamToState(search.get('tab'));

      if (path === '/admin' || path === '/admin/login') {
        setCurrentView('admin');
        setSelectedLeagueId(null);
        setSelectedSubTab('tabella');
      } else if (path === '/rules' || path === '/szabalyzat') {
        setCurrentView('rules');
        setSelectedLeagueId(null);
        setSelectedSubTab('tabella');
      } else if (path === '/bajnoksag' || path === '/leagues' || path === '/bajnoksagok') {
        setCurrentView('leagues');
        setSelectedLeagueId(null);
        setSelectedSubTab(tab);
      } else if (path.startsWith('/bajnoksag/')) {
        const slug = path.split('/').filter(Boolean)[1];
        const leagueMeta = slug ? getLeagueBySlug(slug) : undefined;
        setCurrentView('leagues');
        setSelectedLeagueId(leagueMeta?.id || null);
        setSelectedSubTab(tab);
      } else if (path === '/') {
        setCurrentView('home');
        setSelectedLeagueId(null);
        setSelectedSubTab('tabella');
      } else {
        setCurrentView('home');
        setSelectedLeagueId(null);
        setSelectedSubTab('tabella');
      }
    };
    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    return () => {
      window.removeEventListener('popstate', syncViewFromLocation);
    };
  }, []);

  // Segédfüggvény külső navigáláshoz és fül átállításhoz
  const handleSetView = (
    view: 'home' | 'leagues' | 'rules' | 'admin', 
    extra?: { leagueId?: string; subTab?: string }
  ) => {
    setCurrentView(view);

    let path = '/';
    if (view === 'admin') {
      path = '/admin';
    } else if (view === 'rules') {
      path = '/rules';
      setSelectedLeagueId(null);
      setSelectedSubTab('tabella');
    } else if (view === 'leagues') {
      if (extra?.leagueId) {
        setSelectedLeagueId(extra.leagueId);
        setSelectedSubTab(extra.subTab || 'tabella');
        path = getLeaguePath(extra.leagueId, extra.subTab || 'tabella');
      } else {
        setSelectedLeagueId(null);
        setSelectedSubTab(extra?.subTab || 'tabella');
        path = '/bajnoksag';
      }
    } else {
      setSelectedLeagueId(null);
      setSelectedSubTab('tabella');
    }

    try {
      window.history.pushState({}, '', path);
    } catch {
      // fallback ha iframe-beli biztonság korlátozza
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

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-between" id="app-wrapper">
      
      {/* 1. Header Navigation */}
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
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
