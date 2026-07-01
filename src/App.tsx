import React, { Suspense, lazy, useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PublicHome from './components/PublicHome';
import PublicLeagues from './components/PublicLeagues';
import SponsorBar from './components/SponsorBar';
import { Player, League, Match, MatchScore, Sponsor } from './types';
import {
  loadPublicLeagueData,
  getPublicLeagueDataCache,
  readPublicLeagueDataSnapshot,
  invalidatePublicLeagueDataCache,
  type PublicLeagueData,
} from './lib/public-leagues';
import { invalidateLatestPublicResultsCache } from './lib/public-results';
import {
  classifySubmissionError,
  approveMatchResultOnSupabase,
  resetMatchSubmissionOnSupabase,
  submitMatchResultToSupabase,
  submitCustomMatchResultToSupabase,
  type SubmitMatchResultOutcome,
} from './lib/result-submissions';
import {
  createLeague,
  updateLeague,
  deleteLeague,
  createPlayer,
  updatePlayer,
  deactivatePlayer,
  bulkInsertMatches,
  deleteCustomMatch,
  updateSubmittedScore,
  createSponsor,
  updateSponsor,
  classifyAdminDataError,
} from './lib/admin-data';
import { readStoredAdminSession, ensureFreshAdminSession, signOutAdmin, type AdminSession } from './lib/admin-auth';
import {
  getLeaguePath,
  resolveViewFromPath,
  type AppView,
  type LeagueTab,
} from './lib/routing';

const Rules = lazy(() => import('./components/Rules'));
const LeagueHistory = lazy(() => import('./components/LeagueHistory'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));

const EMPTY_PUBLIC_DATA: PublicLeagueData = {
  leagues: [],
  players: [],
  matches: [],
  results: [],
  standings: [],
  sponsors: [],
};

const isSyntheticCustomMatch = (match: Match) => match.submissionType === 'custom' || match.id.startsWith('m_sub_');

export default function App() {
  const [publicData, setPublicData] = useState<PublicLeagueData>(
    () => getPublicLeagueDataCache() ?? readPublicLeagueDataSnapshot() ?? EMPTY_PUBLIC_DATA,
  );
  const { leagues, players, matches, results, sponsors } = publicData;

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('tabella');
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>(
    () => (getPublicLeagueDataCache() ?? readPublicLeagueDataSnapshot() ? 'ready' : 'loading'),
  );
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [publicLeagueDataRevision, setPublicLeagueDataRevision] = useState(0);
  const [latestPublicResultsRevision, setLatestPublicResultsRevision] = useState(0);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => readStoredAdminSession());

  const refreshPublicLeagueData = () => {
    invalidatePublicLeagueDataCache();
    setPublicLeagueDataRevision(revision => revision + 1);
  };

  const refreshLatestPublicResults = () => {
    invalidateLatestPublicResultsCache();
    setLatestPublicResultsRevision(revision => revision + 1);
  };

  useEffect(() => {
    let cancelled = false;

    void loadPublicLeagueData()
      .then(data => {
        if (cancelled) {
          return;
        }

        setPublicData(data);
        setDataStatus('ready');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setDataStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [publicLeagueDataRevision]);

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

  const withAdminAccessToken = async (): Promise<string> => {
    if (!adminSession) {
      throw new Error('Nincs admin munkamenet, jelentkezz be újra.');
    }

    const freshSession = await ensureFreshAdminSession(adminSession);
    if (freshSession !== adminSession) {
      setAdminSession(freshSession);
    }

    return freshSession.accessToken;
  };

  const handleAddPlayer = async (player: Player, leagueId: string) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await createPlayer(accessToken, player, leagueId);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Játékos hozzáadása sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleUpdatePlayer = async (updated: Player) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await updatePlayer(accessToken, updated);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Játékos frissítése sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await deactivatePlayer(accessToken, id);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Játékos eltávolítása sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleAddLeague = async (payload: { name: string; rules: string; isActive: boolean; playerIds: string[] }) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await createLeague(accessToken, payload, payload.playerIds);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Liga létrehozása sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleUpdateLeague = async (updated: League) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await updateLeague(accessToken, updated);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Liga frissítése sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await deleteLeague(accessToken, leagueId);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Liga törlése sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleAddMatches = async (newMatches: Match[]) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await bulkInsertMatches(accessToken, newMatches);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Sorsolás mentése sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleUpdateMatchSubmission = async (matchId: string, finalScore: MatchScore) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await updateSubmittedScore(accessToken, matchId, finalScore);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Beküldött eredmény szerkesztése sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleSubmitResult = async (payload: {
    leagueId: string;
    player1Id: string;
    player2Id: string;
    finalScore: MatchScore;
    submitterName: string;
    comment?: string;
  }): Promise<SubmitMatchResultOutcome> => {
    const existingPlannedMatch = matches.find(match => {
      const sameLeague = match.leagueId === payload.leagueId;
      const sameOrder = match.player1Id === payload.player1Id && match.player2Id === payload.player2Id;
      const reverseOrder = match.player1Id === payload.player2Id && match.player2Id === payload.player1Id;
      return sameLeague && match.status === 'Tervezett' && (sameOrder || reverseOrder);
    });

    try {
      if (existingPlannedMatch) {
        await submitMatchResultToSupabase({
          matchId: existingPlannedMatch.id,
          finalScore: payload.finalScore,
          submitterName: payload.submitterName,
          comment: payload.comment,
          submittedPlayer1Id: payload.player1Id,
          submittedPlayer2Id: payload.player2Id,
        });
      } else {
        await submitCustomMatchResultToSupabase({
          leagueId: payload.leagueId,
          player1Id: payload.player1Id,
          player2Id: payload.player2Id,
          finalScore: payload.finalScore,
          submitterName: payload.submitterName,
          comment: payload.comment,
        });
      }
    } catch (error) {
      throw classifySubmissionError(error);
    }

    refreshPublicLeagueData();

    return {
      remoteAttempted: true,
      remoteSynced: true,
    };
  };

  const handleApproveMatch = async (matchId: string, finalScoreOverride?: MatchScore) => {
    setAdminActionError(null);
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    const approvedScore = finalScoreOverride || match.submittedScore;
    if (!approvedScore) {
      return;
    }

    try {
      await approveMatchResultOnSupabase({ matchId, finalScore: approvedScore });
      refreshPublicLeagueData();
      refreshLatestPublicResults();
    } catch (error) {
      setAdminActionError(`Admin jóváhagyás sikertelen: ${classifySubmissionError(error).message}`);
    }
  };

  const handleRejectMatch = async (matchId: string): Promise<void> => {
    setAdminActionError(null);
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    try {
      if (isSyntheticCustomMatch(match)) {
        const accessToken = await withAdminAccessToken();
        await deleteCustomMatch(accessToken, matchId);
      } else {
        await resetMatchSubmissionOnSupabase({ matchId });
      }

      refreshPublicLeagueData();
      refreshLatestPublicResults();
    } catch (error) {
      setAdminActionError(`Admin visszavonás sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleDeleteMatch = async (matchId: string): Promise<void> => {
    setAdminActionError(null);
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return;
    }

    try {
      if (isSyntheticCustomMatch(match)) {
        const accessToken = await withAdminAccessToken();
        await deleteCustomMatch(accessToken, matchId);
      } else {
        await resetMatchSubmissionOnSupabase({ matchId });
      }

      refreshPublicLeagueData();
      refreshLatestPublicResults();
    } catch (error) {
      setAdminActionError(`Admin törlés sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleAddSponsor = async (sponsor: Sponsor) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await createSponsor(accessToken, sponsor);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Szponzor hozzáadása sikertelen: ${classifyAdminDataError(error).message}`);
    }
  };

  const handleUpdateSponsor = async (updated: Sponsor) => {
    setAdminActionError(null);
    try {
      const accessToken = await withAdminAccessToken();
      await updateSponsor(accessToken, updated);
      refreshPublicLeagueData();
    } catch (error) {
      setAdminActionError(`Szponzor frissítése sikertelen: ${classifyAdminDataError(error).message}`);
    }
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
        {dataStatus === 'loading' && (
          <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Adatok betöltése folyamatban.
          </div>
        )}
        {dataStatus === 'error' && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Nem sikerült frissíteni az adatokat. A legutóbb betöltött állapot látható.
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

        {currentView === 'admin' && !adminSession && (
          <Suspense fallback={<div className="rounded-2xl border border-gray-150 bg-white px-6 py-10 text-sm text-gray-500">Betöltés...</div>}>
            <AdminLogin onAuthenticated={setAdminSession} />
          </Suspense>
        )}

        {currentView === 'admin' && adminSession && (
          <Suspense fallback={<div className="rounded-2xl border border-gray-150 bg-white px-6 py-10 text-sm text-gray-500">Admin felület betöltése...</div>}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-150 bg-white px-4 py-3 text-sm text-gray-600">
                <span>Bejelentkezve: <strong>{adminSession.email}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    signOutAdmin();
                    setAdminSession(null);
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Kijelentkezés
                </button>
              </div>
              {adminActionError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {adminActionError}
                </div>
              )}
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
                onDeleteLeague={handleDeleteLeague}
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
