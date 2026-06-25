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
  normalizeSponsors,
  getLeagueBySlug,
  getLeagueSlug,
} from './data';

const Rules = lazy(() => import('./components/Rules'));
const LeagueHistory = lazy(() => import('./components/LeagueHistory'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

const APP_STORAGE_KEY = 'arasz-squash-state-v1';
const TEST_LEAGUE_ID = 'league-e';
const TEST_PLAYER_1_ID = 'player-league-e-7-szekeres-martin';
const TEST_PLAYER_2_ID = 'player-league-e-6-kov-cs-zsolt';

type PersistedAppState = {
  players: Player[];
  leagues: League[];
  matches: Match[];
  results: Result[];
  sponsors: Sponsor[];
};

function loadPersistedAppState(): PersistedAppState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { version?: number; state?: PersistedAppState } | PersistedAppState;
    if ('version' in parsed) {
      return parsed.version === 1 ? parsed.state ?? null : null;
    }

    return parsed as PersistedAppState;
  } catch {
    return null;
  }
}

function removeTestResultArtifacts(state: PersistedAppState): PersistedAppState {
  const matches = state.matches.filter((match) => {
    const pairMatches =
      match.leagueId === TEST_LEAGUE_ID &&
      (
        (match.player1Id === TEST_PLAYER_1_ID && match.player2Id === TEST_PLAYER_2_ID) ||
        (match.player1Id === TEST_PLAYER_2_ID && match.player2Id === TEST_PLAYER_1_ID)
      );

    if (!pairMatches || !match.submittedScore) {
      return true;
    }

    const is5to0 =
      (match.submittedScore.player1Sets === 5 && match.submittedScore.player2Sets === 0) ||
      (match.submittedScore.player1Sets === 0 && match.submittedScore.player2Sets === 5);

    if (!is5to0) {
      return true;
    }

    return false;
  });

  const results = state.results.filter((result) => {
    const pairMatches =
      result.leagueId === TEST_LEAGUE_ID &&
      (
        (result.player1Id === TEST_PLAYER_1_ID && result.player2Id === TEST_PLAYER_2_ID) ||
        (result.player1Id === TEST_PLAYER_2_ID && result.player2Id === TEST_PLAYER_1_ID)
      );

    if (!pairMatches) {
      return true;
    }

    const is5to0 =
      (result.normalizedSetsWon === 5 && result.normalizedSetsLost === 0) ||
      (result.normalizedSetsWon === 0 && result.normalizedSetsLost === 5);

    return !is5to0;
  });

  return {
    ...state,
    matches,
    results,
  };
}

export default function App() {
  const persistedState = loadPersistedAppState();
  const cleanedPersistedState = persistedState ? removeTestResultArtifacts(persistedState) : null;

  const [players, setPlayers] = useState<Player[]>(cleanedPersistedState?.players ?? DEFAULT_PLAYERS);
  const [leagues, setLeagues] = useState<League[]>(cleanedPersistedState?.leagues ?? DEFAULT_LEAGUES);
  const [matches, setMatches] = useState<Match[]>(cleanedPersistedState?.matches ?? DEFAULT_MATCHES);
  const [results, setResults] = useState<Result[]>(cleanedPersistedState?.results ?? DEFAULT_RESULTS);
  const [sponsors, setSponsors] = useState<Sponsor[]>(normalizeSponsors(cleanedPersistedState?.sponsors ?? DEFAULT_SPONSORS));

  const [currentView, setCurrentView] = useState<'home' | 'leagues' | 'rules' | 'history' | 'admin'>('home');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('tabella');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const state: PersistedAppState = {
      players,
      leagues,
      matches,
      results,
      sponsors,
    };

    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
      version: 1,
      state,
    }));
  }, [players, leagues, matches, results, sponsors]);

  useEffect(() => {
    if (typeof window === 'undefined' || !persistedState || !cleanedPersistedState) {
      return;
    }

    if (persistedState.matches.length !== cleanedPersistedState.matches.length || persistedState.results.length !== cleanedPersistedState.results.length) {
      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({
        version: 1,
        state: cleanedPersistedState,
      }));
    }
  }, [persistedState, cleanedPersistedState]);

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
      } else if (path === '/ligatortenet' || path === '/liga-tortenet' || path === '/dijazottak') {
        setCurrentView('history');
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
    view: 'home' | 'leagues' | 'rules' | 'history' | 'admin', 
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
    } else if (view === 'history') {
      path = '/ligatortenet';
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

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  const handleUpdateMatchSubmission = (matchId: string, finalScore: MatchScore) => {
    const nowIso = new Date().toISOString();
    setMatches(prev => prev.map(match => {
      if (match.id !== matchId) {
        return match;
      }

      return {
        ...match,
        status: 'Beküldve',
        submittedScore: finalScore,
        submittedAt: nowIso,
      };
    }));
  };

  const normalizeSubmittedScore = (score: MatchScore): MatchScore => {
    if (score.player1Sets === score.player2Sets) {
      return score;
    }

    if (score.player1Sets > score.player2Sets) {
      return {
        ...score,
        player1Sets: 3,
      };
    }

    return {
      ...score,
      player2Sets: 3,
    };
  };

  const buildApprovedResult = (match: Match, score: MatchScore): Result => {
    const nowIso = new Date().toISOString();

    return {
      id: match.resultId || `r_${match.id}`,
      leagueId: match.leagueId,
      matchId: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      sourceSheet: match.submissionType === 'custom' ? 'Kézi beküldés' : 'Webes beküldés',
      sourceCells: match.sourceCell ? [match.sourceCell] : [],
      rawHomeToken: `${score.player1Sets}:${score.player2Sets}`,
      rawAwayToken: undefined,
      normalizedSetsWon: score.player1Sets,
      normalizedSetsLost: score.player2Sets,
      kind: 'score',
      status: 'approved',
      playedOnCourt: true,
      isForfeit: false,
      importedAt: nowIso,
    };
  };

  const handleSubmitResult = (payload: {
    leagueId: string;
    player1Id: string;
    player2Id: string;
    finalScore: MatchScore;
    submitterName: string;
    comment?: string;
  }) => {
    const nowIso = new Date().toISOString();
    const normalizedScore = normalizeSubmittedScore(payload.finalScore);
    const existingPlannedMatch = matches.find(match => {
      const sameLeague = match.leagueId === payload.leagueId;
      const sameOrder = match.player1Id === payload.player1Id && match.player2Id === payload.player2Id;
      const reverseOrder = match.player1Id === payload.player2Id && match.player2Id === payload.player1Id;
      return sameLeague && match.status === 'Tervezett' && (sameOrder || reverseOrder);
    });

    if (existingPlannedMatch) {
      setMatches(prev => prev.map(match => {
        if (match.id !== existingPlannedMatch.id) {
          return match;
        }

        return {
          ...match,
          status: 'Beküldve',
          submittedScore: normalizedScore,
          submitterName: payload.submitterName,
          comment: payload.comment,
          submittedAt: nowIso,
          submissionType: 'planned',
        };
      }));
      return;
    }

    setMatches(prev => [
      {
        id: `m_sub_${Date.now()}`,
        leagueId: payload.leagueId,
        round: 0,
        player1Id: payload.player1Id,
        player2Id: payload.player2Id,
        status: 'Beküldve',
        submittedScore: normalizedScore,
        submitterName: payload.submitterName,
        comment: payload.comment,
        submittedAt: nowIso,
        submissionType: 'custom',
      },
      ...prev,
    ]);
  };

  const handleApproveMatch = (matchId: string, finalScoreOverride?: MatchScore) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    const approvedScore = finalScoreOverride || match.submittedScore;
    if (!approvedScore) {
      return;
    }

    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) {
        return m;
      }

      return {
        ...m,
        status: 'Jóváhagyva',
        submittedScore: approvedScore,
      };
    }));

    setResults(prev => {
      if (prev.some(result => result.matchId === matchId)) {
        return prev;
      }

      return [buildApprovedResult({ ...match, submittedScore: approvedScore, status: 'Jóváhagyva' }, approvedScore), ...prev];
    });
  };

  const handleRejectMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    if (match.submissionType === 'custom') {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      return;
    }

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          status: 'Tervezett',
          submittedScore: undefined,
          submitterName: undefined,
          submitterContact: undefined,
          comment: undefined,
          submittedAt: undefined,
          submissionType: undefined,
        };
      }
      return m;
    }));
  };

  const handleDeleteMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    setResults(prev => prev.filter(result => result.matchId !== matchId));

    if (match.submissionType === 'custom' || match.status === 'Jóváhagyva') {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      return;
    }

    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) {
        return m;
      }

      return {
        ...m,
        status: 'Tervezett',
        submittedScore: undefined,
        submitterName: undefined,
        submitterContact: undefined,
        comment: undefined,
        submittedAt: undefined,
        submissionType: undefined,
      };
    }));
  };

  const handleAddSponsor = (s: Sponsor) => {
    setSponsors(prev => [...prev, s]);
  };

  const handleUpdateSponsor = (updated: Sponsor) => {
    setSponsors(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  return (
    <div
      className="min-h-dvh bg-brand-light flex flex-col"
      id="app-wrapper"
    >
      <Header 
        currentView={currentView} 
        setView={handleSetView} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-10 sm:pb-12" id="app-main">
        {currentView === 'home' && (
          <PublicHome 
            players={players}
            leagues={leagues} 
            matches={matches} 
            results={results}
            setView={handleSetView} 
          />
        )}

        {currentView === 'leagues' && (
          <PublicLeagues
          players={players}
          leagues={leagues}
          matches={matches}
          results={results}
          onSubmitResult={handleSubmitResult}
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

        {currentView === 'history' && (
          <Suspense fallback={<div className="rounded-2xl border border-gray-150 bg-white px-6 py-10 text-sm text-gray-500">Liga története betöltése...</div>}>
            <LeagueHistory />
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
              onUpdateMatchSubmission={handleUpdateMatchSubmission}
              onRejectMatch={handleRejectMatch}
              onDeleteMatch={handleDeleteMatch}
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
