import React, { Suspense, lazy, useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicHome from './components/PublicHome';
import PublicLeagues from './components/PublicLeagues';
import SponsorBar from './components/SponsorBar';
import { Player, League, Match, Sponsor, MatchScore, Result } from './types';
import {
  DEFAULT_PLAYERS,
  DEFAULT_LEAGUES,
  DEFAULT_MATCHES,
  DEFAULT_RESULTS,
  DEFAULT_SPONSORS,
  getLeagueBySlug,
  getLeagueSlug,
} from './data';

const Rules = lazy(() => import('./components/Rules'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [leagues, setLeagues] = useState<League[]>(DEFAULT_LEAGUES);
  const [matches, setMatches] = useState<Match[]>(DEFAULT_MATCHES);
  const [results] = useState<Result[]>(DEFAULT_RESULTS);
  const [sponsors, setSponsors] = useState<Sponsor[]>(DEFAULT_SPONSORS);

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
    setMatches(prev => [...prev, ...newMatches]);
  };

  const handleApproveMatch = (matchId: string, finalScoreOverride?: MatchScore) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'Jóváhagyva',
          submittedScore: finalScoreOverride || m.submittedScore
        };
      }
      return m;
    }));
  };

  const handleRejectMatch = (matchId: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
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
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main">
        {currentView === 'home' && (
          <PublicHome 
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
          results={results}
          setView={handleSetView}
          selectedLeagueId={selectedLeagueId}
          initialSubTab={selectedSubTab}
        />
      )}

        {currentView === 'rules' && (
          <Suspense fallback={<div className="rounded-2xl border border-gray-150 bg-white px-6 py-10 text-sm text-gray-500">Szabályzat betöltése...</div>}>
            <Rules />
          </Suspense>
        )}

        {currentView === 'admin' && (
          <Suspense fallback={<div className="rounded-2xl border border-gray-150 bg-white px-6 py-10 text-sm text-gray-500">Admin felület betöltése...</div>}>
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
          </Suspense>
        )}
      </main>

      <SponsorBar sponsors={sponsors} />

      <Footer setView={handleSetView} />

    </div>
  );
}
