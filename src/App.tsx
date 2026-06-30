import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
} from './data';
import {
  hydratePersistedAppState,
  savePersistedAppState,
  type PersistedAppState,
} from './lib/app-state';
import {
  classifySubmissionError,
  approveMatchResultOnSupabase,
  resetMatchSubmissionOnSupabase,
  submitMatchResultToSupabase,
  type SubmitMatchResultOutcome,
} from './lib/result-submissions';
import { invalidatePublicLeagueDataCache } from './lib/public-leagues';
import { invalidateLatestPublicResultsCache } from './lib/public-results';
import {
  getLeaguePath,
  resolveViewFromPath,
  type AppView,
  type LeagueTab,
} from './lib/routing';

const Rules = lazy(() => import('./components/Rules'));
const LeagueHistory = lazy(() => import('./components/LeagueHistory'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const TEST_LEAGUE_ID = 'league-e';
const TEST_PLAYER_1_ID = 'player-league-e-7-szekeres-martin';
const TEST_PLAYER_2_ID = 'player-league-e-6-kov-cs-zsolt';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [leagues, setLeagues] = useState<League[]>(DEFAULT_LEAGUES);
  const [matches, setMatches] = useState<Match[]>(DEFAULT_MATCHES);
  const [results, setResults] = useState<Result[]>(DEFAULT_RESULTS);
  const [sponsors, setSponsors] = useState<Sponsor[]>(normalizeSponsors(DEFAULT_SPONSORS));

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('tabella');
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'ready' | 'offline'>('syncing');
  const [hasCompletedInitialHydration, setHasCompletedInitialHydration] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [publicLeagueDataRevision, setPublicLeagueDataRevision] = useState(0);
  const [latestPublicResultsRevision, setLatestPublicResultsRevision] = useState(0);
  const skipNextAutosaveRef = useRef(true);
  const userMutatedBeforeHydrationRef = useRef(false);

  const applyPersistedState = (persistedState: PersistedAppState) => {
    setPlayers(persistedState.players);
    setLeagues(persistedState.leagues);
    setMatches(persistedState.matches);
    setResults(persistedState.results);
    setSponsors(normalizeSponsors(persistedState.sponsors));
  };

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const hydrated = await hydratePersistedAppState();
      if (cancelled) {
        return;
      }

      if (!userMutatedBeforeHydrationRef.current && hydrated.state) {
        applyPersistedState(hydrated.state);
      }

      setSyncStatus(hydrated.source === 'remote' || hydrated.source === 'empty' ? 'ready' : 'offline');
      setHasCompletedInitialHydration(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPublicLeagueData = () => {
    invalidatePublicLeagueDataCache();
    setPublicLeagueDataRevision(revision => revision + 1);
  };

  const refreshLatestPublicResults = () => {
    invalidateLatestPublicResultsCache();
    setLatestPublicResultsRevision(revision => revision + 1);
  };

  useEffect(() => {
    if (!hasCompletedInitialHydration) {
      return;
    }

    const state: PersistedAppState = {
      players,
      leagues,
      matches,
      results,
      sponsors,
    };

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      void savePersistedAppState(state);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [players, leagues, matches, results, sponsors, hasCompletedInitialHydration]);

  useEffect(() => {
    const syncViewFromLocation = () => {
      const path = window.location.pathname;
      const { view, selectedLeagueId: leagueId, selectedSubTab: subTab } = resolveViewFromPath(path, window.location.search);
      setCurrentView(view);
      setSelectedLeagueId(leagueId);
      setSelectedSubTab(subTab);
    };
    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    return () => {
      window.removeEventListener('popstate', syncViewFromLocation);
    };
  }, []);

  const handleSetView = (
    view: AppView,
    extra?: { leagueId?: string; subTab?: LeagueTab }
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
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setPlayers(prev => [p, ...prev]);
  };

  const handleUpdatePlayer = (updated: Player) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeletePlayer = (id: string) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setPlayers(prev => prev.filter(p => p.id !== id));
    // Elemeltük a ligás regisztrációját is
    setLeagues(prev => prev.map(l => ({
      ...l,
      playerIds: l.playerIds.filter(pId => pId !== id)
    })));
  };

  const handleAddLeague = (l: League) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setLeagues(prev => [...prev, l]);
  };

  const handleUpdateLeague = (updated: League) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setLeagues(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleAddMatches = (newMatches: Match[]) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setMatches(prev => [...prev, ...newMatches]);
  };

  const handleUpdateMatchSubmission = (matchId: string, finalScore: MatchScore) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
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
    // A beküldött eredmény már a végeredmény, ezt változatlanul kell
    // tárolni. A validáció felül ellenőrzi, hogy pontosan 5 szett legyen.
    return score;
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

  const createSyntheticCustomMatchId = (leagueId: string, player1Id: string, player2Id: string) => {
    const league = leagues.find(item => item.id === leagueId);
    const player1Name = players.find(player => player.id === player1Id)?.name ?? player1Id;
    const player2Name = players.find(player => player.id === player2Id)?.name ?? player2Id;
    const player1Index = league?.playerIds.findIndex(id => id === player1Id);
    const player2Index = league?.playerIds.findIndex(id => id === player2Id);
    const slug = [leagueId, (player1Index ?? -1) + 1, (player2Index ?? -1) + 1, player1Name, player2Name]
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `m_sub_${slug}`;
  };

  const isSyntheticCustomMatch = (match: Match) => match.submissionType === 'custom' || match.id.startsWith('m_sub_');

  const resetSubmittedMatch = async (match: Match) => {
    await resetMatchSubmissionOnSupabase({ matchId: match.id });
  };

  const handleSubmitResult = async (payload: {
    leagueId: string;
    player1Id: string;
    player2Id: string;
    finalScore: MatchScore;
    submitterName: string;
    comment?: string;
  }): Promise<SubmitMatchResultOutcome> => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    const normalizedScore = normalizeSubmittedScore(payload.finalScore);
    const existingPlannedMatch = matches.find(match => {
      const sameLeague = match.leagueId === payload.leagueId;
      const sameOrder = match.player1Id === payload.player1Id && match.player2Id === payload.player2Id;
      const reverseOrder = match.player1Id === payload.player2Id && match.player2Id === payload.player1Id;
      return sameLeague && match.status === 'Tervezett' && (sameOrder || reverseOrder);
    });

    if (existingPlannedMatch) {
      try {
        await submitMatchResultToSupabase({
          matchId: existingPlannedMatch.id,
          finalScore: normalizedScore,
          submitterName: payload.submitterName,
          comment: payload.comment,
        });
      } catch (error) {
        const submissionError = classifySubmissionError(error);
        if (submissionError.code !== 'config' && submissionError.code !== 'network') {
          throw submissionError;
        }

        setMatches(prev => prev.map(match => {
          if (match.id !== existingPlannedMatch.id) {
            return match;
          }

          return {
            ...match,
            status: 'Beküldve',
            submittedScore: normalizedScore,
            submitterName: payload.submitterName,
            submitterContact: undefined,
            comment: payload.comment,
            submittedAt: new Date().toISOString(),
            submissionType: 'planned',
          };
        }));

        return {
          remoteAttempted: true,
          remoteSynced: false,
          remoteError: submissionError.message,
        };
      }

      setMatches(prev => prev.map(match => {
        if (match.id !== existingPlannedMatch.id) {
          return match;
        }

        return {
          ...match,
          status: 'Beküldve',
          submittedScore: normalizedScore,
          submitterName: payload.submitterName,
          submitterContact: undefined,
          comment: payload.comment,
          submittedAt: new Date().toISOString(),
          submissionType: 'planned',
        };
      }));
      refreshPublicLeagueData();

      return {
        remoteAttempted: true,
        remoteSynced: true,
      };
    }

    const existingCustomSubmission = matches.find(match => {
      const sameLeague = match.leagueId === payload.leagueId;
      const sameOrder = match.player1Id === payload.player1Id && match.player2Id === payload.player2Id;
      const reverseOrder = match.player1Id === payload.player2Id && match.player2Id === payload.player1Id;
      return sameLeague && match.status === 'Beküldve' && match.submissionType === 'custom' && (sameOrder || reverseOrder);
    });

    if (existingCustomSubmission) {
      const nowIso = new Date().toISOString();
      setMatches(prev => prev.map(match => {
        if (match.id !== existingCustomSubmission.id) {
          return match;
        }

        return {
          ...match,
          submittedScore: normalizedScore,
          submitterName: payload.submitterName,
          submitterContact: undefined,
          comment: payload.comment,
          submittedAt: nowIso,
        };
      }));
      refreshPublicLeagueData();

      return {
        remoteAttempted: false,
        remoteSynced: true,
      };
    }

    setMatches(prev => [
      {
        id: createSyntheticCustomMatchId(payload.leagueId, payload.player1Id, payload.player2Id),
        leagueId: payload.leagueId,
        round: 0,
        player1Id: payload.player1Id,
        player2Id: payload.player2Id,
        status: 'Beküldve',
        submittedScore: normalizedScore,
        submitterName: payload.submitterName,
        submitterContact: undefined,
        comment: payload.comment,
        submittedAt: new Date().toISOString(),
        submissionType: 'custom',
      },
      ...prev,
    ]);
    refreshPublicLeagueData();

    return {
      remoteAttempted: false,
      remoteSynced: true,
    };
  };

  const handleApproveMatch = async (matchId: string, finalScoreOverride?: MatchScore) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    const approvedScore = finalScoreOverride || match.submittedScore;
    if (!approvedScore) {
      return;
    }

    try {
      await approveMatchResultOnSupabase({
        matchId,
        finalScore: approvedScore,
      });
    } catch (error) {
      const approvalError = classifySubmissionError(error);
      if (approvalError.code !== 'config' && approvalError.code !== 'network') {
        setAdminActionError(`Admin jóváhagyás sikertelen: ${approvalError.message}`);
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
      setAdminActionError(`Admin jóváhagyás: a Supabase jóváhagyás nem sikerült, a helyi állapot frissült. ${approvalError.message}`);
      return;
    }

    refreshPublicLeagueData();
    refreshLatestPublicResults();

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

  const handleRejectMatch = async (matchId: string): Promise<void> => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setAdminActionError(null);
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    const applyLocalReject = () => {
      if (isSyntheticCustomMatch(match)) {
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
            approvedAt: undefined,
            approvedBy: undefined,
            resultId: undefined,
            submissionType: undefined,
          };
        }
        return m;
      }));
    };

    if (isSyntheticCustomMatch(match)) {
      applyLocalReject();
      return;
    }

    try {
      await resetSubmittedMatch(match);
      refreshPublicLeagueData();
      refreshLatestPublicResults();
      applyLocalReject();
    } catch (error) {
      const resetError = classifySubmissionError(error);
      if (resetError.code === 'config' || resetError.code === 'network') {
        applyLocalReject();
        setAdminActionError(`Admin visszavonás: a Supabase reset nem sikerült, a helyi állapot frissült. ${resetError.message}`);
        return;
      }

      setAdminActionError(`Admin visszavonás sikertelen: ${resetError.message}`);
    }
  };

  const handleDeleteMatch = async (matchId: string): Promise<void> => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setAdminActionError(null);
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    const applyLocalDelete = () => {
      setResults(prev => prev.filter(result => result.matchId !== matchId));

      if (isSyntheticCustomMatch(match)) {
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
          approvedAt: undefined,
          approvedBy: undefined,
          resultId: undefined,
          submissionType: undefined,
        };
      }));
    };

    if (isSyntheticCustomMatch(match)) {
      applyLocalDelete();
      return;
    }

    try {
      await resetSubmittedMatch(match);
      refreshPublicLeagueData();
      refreshLatestPublicResults();
      applyLocalDelete();
    } catch (error) {
      const resetError = classifySubmissionError(error);
      if (resetError.code === 'config' || resetError.code === 'network') {
        applyLocalDelete();
        setAdminActionError(`Admin törlés: a Supabase reset nem sikerült, a helyi állapot frissült. ${resetError.message}`);
        return;
      }

      setAdminActionError(`Admin törlés sikertelen: ${resetError.message}`);
    }
  };

  const handleAddSponsor = (s: Sponsor) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
    setSponsors(prev => [...prev, s]);
  };

  const handleUpdateSponsor = (updated: Sponsor) => {
    if (!hasCompletedInitialHydration) userMutatedBeforeHydrationRef.current = true;
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
        {!hasCompletedInitialHydration && (
          <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Háttérszinkronizálás folyamatban.
          </div>
        )}
        {syncStatus === 'offline' && hasCompletedInitialHydration && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Helyi mentés aktív. A Supabase-szinkron később újra elérhető lehet.
          </div>
        )}

        {currentView === 'home' && (
          <PublicHome 
            players={players}
            leagues={leagues} 
            matches={matches} 
            results={results}
            setView={handleSetView}
            publicResultsRevision={latestPublicResultsRevision}
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
            publicLeagueDataRevision={publicLeagueDataRevision}
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
            <div className="space-y-4">
              {adminActionError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {adminActionError}
                </div>
              )}
              <AdminPanel
                players={players}
                leagues={leagues}
                matches={matches}
                approvalMatches={matches}
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
            </div>
          </Suspense>
        )}
      </main>

      <SponsorBar sponsors={sponsors} />

      <Footer setView={handleSetView} />

    </div>
  );
}
