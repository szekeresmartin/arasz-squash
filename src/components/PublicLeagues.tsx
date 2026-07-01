import React, { useState, useEffect, useMemo } from 'react';
import { Player, Match, Standing } from '../types';
import { Trophy, Calendar, Users, FileText, ArrowLeft, Star, MapPin, Eye, CheckCircle2, Send, Shield, Award, Orbit } from 'lucide-react';
import { calculateStandings } from '../data';
import SubmitResult from './SubmitResult';
import { getPublicLeagueDataCache, loadPublicLeagueData, type PublicLeagueData } from '../lib/public-leagues';
import { getMatchDisplayPlayerIds } from '../lib/match-order';
import type { SubmitMatchResultOutcome } from '../lib/result-submissions';

interface PublicLeaguesProps {
  onSubmitResult: (payload: {
    leagueId: string;
    player1Id: string;
    player2Id: string;
    finalScore: {
      player1Sets: number;
      player2Sets: number;
      sets: Array<{ player1: number; player2: number }>;
    };
    submitterName: string;
    comment?: string;
  }) => Promise<SubmitMatchResultOutcome>;
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
  selectedLeagueId: string | null;
  initialSubTab?: string;
  publicLeagueDataRevision: number;
}

const LEAGUE_TABS = [
  { id: 'tabella', name: 'Tabella', icon: Trophy },
  { id: 'eredmenyek', name: 'Eredmények', icon: FileText },
  { id: 'sorsolas', name: 'Sorsolás', icon: Calendar },
  { id: 'eredmeny_bekuldese', name: 'Eredmény beküldése', icon: Send },
  { id: 'jatekosok', name: 'Játékosok', icon: Users },
  { id: 'szabalyok', name: 'Szabályok', icon: Star },
] as const;

export default function PublicLeagues({
  onSubmitResult,
  setView,
  selectedLeagueId,
  initialSubTab = 'tabella',
  publicLeagueDataRevision,
}: PublicLeaguesProps) {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [publicData, setPublicData] = useState<PublicLeagueData | null>(getPublicLeagueDataCache());
  const [isLoading, setIsLoading] = useState(() => !getPublicLeagueDataCache());
  const [loadError, setLoadError] = useState<string | null>(null);

  // Az al-fület beállítjuk ha kívülről kapunk paramétert
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab, selectedLeagueId]);

  useEffect(() => {
    let cancelled = false;

    const loadLeagueData = async () => {
      if (!publicData) {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const data = await loadPublicLeagueData();
        if (cancelled) {
          return;
        }

        setPublicData(data);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt a ligaadatok betöltésekor.';
        if (!publicData) {
          setLoadError(message);
          setPublicData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadLeagueData();

    return () => {
      cancelled = true;
    };
  }, [publicLeagueDataRevision]);

  const players = publicData?.players ?? [];
  const leagues = publicData?.leagues ?? [];
  const matches = publicData?.matches ?? [];
  const results = publicData?.results ?? [];
  const standings = publicData?.standings ?? [];

  const navigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    if (selectedLeagueId) {
      setView('leagues', { leagueId: selectedLeagueId, subTab: tabId });
    }
  };

  const playerNameById = useMemo(() => new Map(players.map(player => [player.id, player.name])), [players]);
  const getPlayerName = (id: string) => playerNameById.get(id) || 'Ismeretlen';

  const currentLeague = useMemo(
    () => leagues.find(l => l.id === selectedLeagueId),
    [leagues, selectedLeagueId],
  );
  const leagueLetter = currentLeague?.id.split('-').pop()?.toUpperCase() || 'A';
  const isALeague = leagueLetter === 'A';
  const leagueRulesTitle = `${leagueLetter} liga szabályai`;
  const formatStandingName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) {
      return { mobile: fullName, desktop: fullName };
    }

    const [firstName, ...rest] = parts;
    const surname = rest.join(' ');
    return {
      mobile: `${firstName.charAt(0).toUpperCase()}. ${surname}`,
      desktop: fullName,
    };
  };

  const currentLeaguePlayers = useMemo(
    () => (currentLeague ? players.filter(player => player.leagueId === currentLeague.id) : []),
    [currentLeague, players],
  );

  const currentLeagueMatches = useMemo(
    () => (currentLeague ? matches.filter(match => match.leagueId === currentLeague.id && match.status !== 'Beküldve') : []),
    [currentLeague, matches],
  );
  const currentLeagueResults = useMemo(
    () => (currentLeague ? results.filter(result => result.leagueId === currentLeague.id) : []),
    [currentLeague, results],
  );
  const approvedLeagueResults = useMemo(
    () => currentLeagueResults.filter(result => result.status === 'approved'),
    [currentLeagueResults],
  );

  const standingsByLeagueId = useMemo(() => {
    const map = new Map<string, Standing[]>();
    standings.forEach((standing) => {
      if (!standing.leagueId) {
        return;
      }
      const leagueStandings = map.get(standing.leagueId) ?? [];
      leagueStandings.push(standing);
      map.set(standing.leagueId, leagueStandings);
    });
    return map;
  }, [standings]);

  const currentLeagueStandings: Standing[] = useMemo(
    () => currentLeague
      ? standingsByLeagueId.get(currentLeague.id) ?? calculateStandings(currentLeaguePlayers, currentLeagueMatches, currentLeagueResults).map((standing) => ({
          ...standing,
          leagueId: currentLeague.id,
        }))
      : [],
    [currentLeague, currentLeaguePlayers, currentLeagueMatches, currentLeagueResults, standingsByLeagueId],
  );
  const standingsByPlayerId = useMemo(() => new Map(currentLeagueStandings.map(standing => [standing.playerId, standing])), [currentLeagueStandings]);
  const currentLeagueMatchById = useMemo(
    () => new Map<string, Match>(currentLeagueMatches.map(match => [match.id, match] as const)),
    [currentLeagueMatches],
  );

  const roundsByNumber = useMemo(() => {
    const roundsMap = new Map<number, Match[]>();
    currentLeagueMatches.forEach((match) => {
      if (match.round <= 0) {
        return;
      }
      const roundMatches = roundsMap.get(match.round) ?? [];
      roundMatches.push(match);
      roundsMap.set(match.round, roundMatches);
    });
    return roundsMap;
  }, [currentLeagueMatches]);
  const roundNumbers = useMemo(() => [...roundsByNumber.keys()].sort((a, b) => a - b), [roundsByNumber]);

  const activePlayers = useMemo(
    () => (currentLeague
      ? currentLeague.playerIds
          .map(playerId => currentLeaguePlayers.find(player => player.id === playerId))
          .filter((player): player is Player => Boolean(player))
      : []),
    [currentLeague, currentLeaguePlayers],
  );
  const sortedApprovedLeagueResults = useMemo(
    () => approvedLeagueResults
      .slice()
      .sort((a, b) => (currentLeagueMatchById.get(a.matchId)?.round ?? 0) - (currentLeagueMatchById.get(b.matchId)?.round ?? 0)),
    [approvedLeagueResults, currentLeagueMatchById],
  );

  const matchRulesParagraphs = [
    'Minden mérkőzés 5 szettig tart.',
    'A mérkőzésekre a WSF (World Squash Federation) hivatalos szabályrendszere érvényes.',
    'Minden labdamenet pontot ér (PAR11 pontozás). Egy szett 11 pontig tart, azonban 10–10-es állásnál csak kétpontos különbséggel lehet megnyerni a szettet.',
  ];

  const ballRulesParagraphs = isALeague
    ? [
        'Az "A" ligában alapértelmezés szerint a 2 sárga pöttyös labdát kell használni.',
        'Ettől az alábbi esetekben lehet eltérni: ha mindkét játékos egyetért, akkor a mérkőzés piros pöttyös labdával is lejátszható.',
        'Az 50 év feletti játékosok jogosultak kérni, hogy a mérkőzés piros pöttyös labdával kerüljön lejátszásra.',
      ]
    : [
        `Az ${leagueLetter}-ligában alapértelmezés szerint az 1 piros pöttyös labdát kell használni.`,
        'Ettől az alábbi esetekben lehet eltérni: ha mindkét játékos egyetért, akkor a mérkőzés a választott labdatípussal játszható.',
    ];

  const retryLoadPublicData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await loadPublicLeagueData();
      setPublicData(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt a ligaadatok betöltésekor.';
      setLoadError(message);
      setPublicData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !publicData) {
    return (
      <div className="space-y-8 animate-fadeIn pb-16">
        <div>
          <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
            Ligaadatok betöltése
          </span>
          <h2 className="text-3xl font-display font-extrabold text-gray-900 mt-2">Squash Ligacsoportok</h2>
          <p className="text-sm text-gray-500 font-sans mt-1">
            A publikus ligaadatok a Supabase-ből töltődnek be.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 rounded bg-gray-100" />
            <div className="h-8 w-64 rounded bg-gray-100" />
            <div className="h-4 w-72 rounded bg-gray-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 pt-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="h-5 w-24 rounded bg-gray-100 mb-4" />
                  <div className="h-4 w-16 rounded bg-gray-100 mb-10" />
                  <div className="h-10 w-full rounded-xl bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError && !publicData) {
    return (
      <div className="space-y-8 animate-fadeIn pb-16">
        <div>
          <span className="bg-amber-100 text-amber-800 font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
            Ligaadatok hibája
          </span>
          <h2 className="text-3xl font-display font-extrabold text-gray-900 mt-2">Squash Ligacsoportok</h2>
          <p className="text-sm text-gray-500 font-sans mt-1">
            Nem sikerült betölteni a publikus ligaadatokat a Supabase-ből.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-xs">
          <h3 className="font-display font-bold text-lg text-amber-900">A ligaoldal jelenleg nem elérhető</h3>
          <p className="mt-2 text-sm text-amber-800">
            {loadError}
          </p>
          <button
            onClick={() => void retryLoadPublicData()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            Újrapróbálás
          </button>
        </div>
      </div>
    );
  }

  if (!selectedLeagueId || !currentLeague) {
    // ----------------------------------------------------
    // LIGÁK LISTÁZÁSA (Leagues Directory)
    // ----------------------------------------------------
    return (
      <div className="space-y-8 animate-fadeIn pb-16">
        <div>
          <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
            Válassz bajnokságot
          </span>
          <h2 className="text-3xl font-display font-extrabold text-gray-900 mt-2">Squash Ligacsoportok</h2>
          <p className="text-sm text-gray-500 font-sans mt-1">
            Előbb válassz ligát, utána nyílik meg a tabella, a sorsolás, az eredmények és az eredménybeküldés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {leagues.filter((league) => league.isActive).map((league) => {
            return (
              <div
                key={league.id}
                className="group bg-white rounded-2xl border border-gray-150 p-6 shadow-xs hover:border-brand-red hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                id={`league-card-${league.id}`}
              >
                {/* Visual badge top line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 group-hover:bg-brand-red transition-colors"></div>

                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-display font-bold text-xl text-gray-950 group-hover:text-brand-red transition-colors">
                      {league.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md">
                      {league.classLabel || 'Bajnokság'}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setView('leagues', { leagueId: league.id, subTab: 'tabella' })}
                    className="w-full bg-gray-50 group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                    id={`view-league-${league.id}`}
                  >
                    Megnézem
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LIGA RÉSZLETEZŐ OLDAL (Single League Detail view)
  // ----------------------------------------------------
  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* Vissza gomb és Csoport fejléc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('leagues')}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-xs transition-colors"
            id="back-to-leagues"
            title="Vissza a ligákhoz"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900">
                {currentLeague.name}
              </h1>
              <span className="text-xs font-mono bg-brand-red/10 text-brand-red font-bold px-2.5 py-0.5 rounded-md border border-brand-red/20">
                {currentLeague.classLabel || 'Bajnokság'}
              </span>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-md border border-emerald-150">
                Folyamatban
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1.5">{currentLeague.season}</p>
          </div>
        </div>

        {/* Eredmény beküldése gyors gomb - átirányítás a belső fülre */}
        <button
          onClick={() => navigateToTab('eredmeny_bekuldese')}
          className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-3.5 rounded-xl hover:bg-brand-maroon shadow-xs transition-all flex items-center justify-center gap-2"
          id="league-detail-submit"
        >
          <Send className="w-4 h-4" />
          Eredmény beküldése
        </button>
      </div>

      {/* Részletező Tab gombok */}
      <div className="flex overflow-x-auto pb-1 border-b border-gray-150 gap-2 scrollbar-none" id="league-tab-navigation">
        {LEAGUE_TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg ${
                isSelected
                  ? 'border-brand-red text-brand-red bg-brand-red/5 shadow-[inset_0_-1px_0_0_rgba(0,140,145,0.08)]'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              id={`tab-btn-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TABELLA (STANDINGS) */}
      {activeTab === 'tabella' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-6 shadow-xs animate-fadeIn" id="tabella-pane">
          <div className="mb-4">
            <h3 className="font-display font-bold text-lg text-gray-900">Aktuális Állás</h3>
            <p className="text-xs text-gray-500">A tabella az approved eredményekből számolódik újra.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-full sm:min-w-[920px] text-left table-fixed sm:table-auto" id="standings-table">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-gray-400 bg-gray-50">
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center w-11 sm:w-12">H</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-left">Játékos</th>
                  <th className="hidden sm:table-cell py-2 sm:py-3.5 px-2 sm:px-4 text-center w-14 sm:w-auto">M</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center w-14 sm:w-auto">Gy-V</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center hidden sm:table-cell">Nyert Szett</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center hidden sm:table-cell">Vesztett Szett</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center hidden md:table-cell">Szettkülönbség</th>
                  <th className="py-2 sm:py-3.5 px-2 sm:px-4 text-center w-14 sm:w-auto">P</th>
                  <th className="hidden sm:table-cell py-2 sm:py-3.5 px-2 sm:px-4 text-right w-20 sm:w-auto">F</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentLeagueStandings.map((standing, index) => {
                  const diff = standing.setDifference;

                  return (
                    <tr key={standing.playerId} className="hover:bg-gray-50/50 transition-colors text-[12px] sm:text-sm">
                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : index === 1
                            ? 'bg-gray-100 text-gray-800'
                            : index === 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-gray-500'
                        }`}>
                          {standing.position}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 font-semibold text-gray-900 min-w-0">
                        {(() => {
                          const displayName = formatStandingName(standing.playerName);
                          return (
                            <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
                              <span className="sm:hidden">{displayName.mobile}</span>
                              <span className="hidden sm:inline">{displayName.desktop}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td className="hidden sm:table-cell py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono font-semibold text-gray-700">
                        {standing.matchesPlayed}
                      </td>

                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono text-gray-600">
                        <span className="text-emerald-600 font-semibold">{standing.wins}</span>
                        <span className="text-gray-300 px-1">/</span>
                        <span className="text-red-500">{standing.losses}</span>
                      </td>

                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono text-gray-500 hidden sm:table-cell">
                        {standing.setsWon}
                      </td>

                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono text-gray-500 hidden sm:table-cell">
                        {standing.setsLost}
                      </td>

                      <td className={`py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono hidden md:table-cell font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>

                      <td className="py-2.5 sm:py-4 px-2 sm:px-4 text-center font-mono font-extrabold text-brand-red text-sm sm:text-base">
                        {standing.basePoints}
                      </td>

                      <td className="hidden sm:table-cell py-2.5 sm:py-4 px-2 sm:px-4">
                        <div className="flex justify-end gap-0.5 sm:gap-1">
                          {standing.form.length === 0 ? (
                            <span className="text-[10px] sm:text-xs text-gray-450 font-mono">-</span>
                          ) : (
                            standing.form.map((res, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold text-white ${
                                  res === 'W' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                title={res === 'W' ? 'Győzelem' : 'Vereség'}
                              >
                                {res}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between text-xs text-gray-400 font-mono gap-2">
            <span>Győzelem = 5 pont | Vereség: 2/3 = 3, 1/4 = 2, 0/5 = 1, játék nélkül = 0</span>
            <span>Azonos pontnál a győzelmek száma, a szettkülönbség, a megnyert szettek és az egymás elleni eredmény dönt, teljes egyezésnél pedig azonos a helyezés.</span>
          </div>
          {approvedLeagueResults.length === 0 && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Még nincs jóváhagyott eredmény ebben a ligában.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SORSOLÁS & FORDULÓK */}
      {activeTab === 'sorsolas' && (
        <div className="space-y-6 animate-fadeIn" id="sorsolas-pane">
          {roundNumbers.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-gray-450">
              Még nincs rögzített sorsolás a bajnoksághoz.
            </div>
          ) : (
            roundNumbers.map((roundNum) => {
              const roundMatches = roundsByNumber.get(roundNum) ?? [];
              return (
                <div key={roundNum} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex justify-between items-center">
                    <span className="font-display font-extrabold text-sm text-gray-800 uppercase tracking-wider">
                      {roundNum}. Forduló
                    </span>
                    <span className="text-xs text-gray-450 font-mono font-semibold">
                      {roundMatches.length} mérkőzés
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {roundMatches.map((match) => {
                      const isApproved = match.status === 'Jóváhagyva';
                      const isPlanned = match.status === 'Tervezett';
                      const score = match.submittedScore;
                      const [displayPlayer1Id, displayPlayer2Id] = getMatchDisplayPlayerIds(match);

                      return (
                        <div key={match.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-gray-50/20 transition-colors">
                          
                          {/* Mérkőzés alapinfók */}
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Státusz badge */}
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {isApproved ? 'Jóváhagyva' : 'Tervezett'}
                              </span>
                              
                              {match.round > 0 && (
                                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {match.round}. forduló
                                </span>
                              )}

                              {match.sourceCell && (
                                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {match.sourceCell}{match.reverseSourceCell ? ` / ${match.reverseSourceCell}` : ''}
                                </span>
                              )}
                            </div>

                            {/* Játékos nevek */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2">
                              <div className="sm:col-span-5 flex items-center gap-2">
                                <div className="h-6 w-1 bg-gray-300 rounded-xs"></div>
                                <span className={`text-base font-semibold ${isApproved && score && score.player1Sets > score.player2Sets ? 'text-brand-red font-bold' : 'text-gray-800'}`}>
                                  {getPlayerName(displayPlayer1Id)}
                                </span>
                              </div>
                              <div className="sm:col-span-2 text-center text-xs font-semibold text-gray-400 italic">vs</div>
                              <div className="sm:col-span-5 flex items-center gap-2 sm:justify-end">
                                <span className={`text-base font-semibold ${isApproved && score && score.player2Sets > score.player1Sets ? 'text-brand-red font-bold' : 'text-gray-800'}`}>
                                  {getPlayerName(displayPlayer2Id)}
                                </span>
                                <div className="hidden sm:block h-6 w-1 bg-gray-300 rounded-xs"></div>
                              </div>
                            </div>
                          </div>

                          {/* Végeredmény kijelzés és gombok */}
                          <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                            {isApproved && score ? (
                              <div className="flex items-center gap-3 w-full justify-between">
                                {/* Sets breakdown */}
                                {score.sets.length > 0 ? (
                                  <div className="flex gap-1.5">
                                    {score.sets.map((set, idx) => (
                                      <div key={idx} className="bg-gray-50 border border-gray-200 text-[10px] font-mono h-8 w-10 flex flex-col justify-center items-center rounded-sm">
                                        <span className={set.player1 > set.player2 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player1}</span>
                                        <span className={set.player2 > set.player1 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player2}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 font-mono">
                                    Eredmény rögzítve
                                  </div>
                                )}
                                {/* Final Score */}
                                <div className="bg-brand-red text-white text-lg font-mono font-bold px-4 py-2 rounded-xl h-10 w-16 flex items-center justify-center">
                                  {score.player1Sets}:{score.player2Sets}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded-sm">
                                  Tervezett
                                </span>
                                {isPlanned && (
                                  <button
                                    onClick={() => navigateToTab('eredmeny_bekuldese')}
                                    className="w-full md:w-auto bg-gray-100 hover:bg-brand-red hover:text-white text-gray-700 font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-gray-200 hover:border-brand-red transition-all cursor-pointer"
                                    id={`submit-result-btn-${match.id}`}
                                  >
                                    Eredmény beküldése
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: EREDMÉNYEK TÖMEGE (COMPLETED MATCHES) */}
      {activeTab === 'eredmenyek' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs animate-fadeIn animate-fadeIn" id="eredmenyek-pane">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">Lejátszott mérkőzések</h3>
              <p className="text-xs text-gray-500">Csak az approved eredmények jelennek meg.</p>
            </div>
          </div>

          <div className="space-y-4">
            {approvedLeagueResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic">
                Még nincs jóváhagyott eredmény ebben a ligában.
              </div>
            ) : (
              sortedApprovedLeagueResults
                .map((result) => {
                  const match = currentLeagueMatchById.get(result.matchId);
                  const p1Won = result.normalizedSetsWon > result.normalizedSetsLost;

                  return (
                    <div key={result.id} className="p-4 bg-gray-50/60 hover:bg-gray-50 border border-gray-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block mb-1">
                          {match && match.round > 0 ? `${match.round}. forduló` : 'Eredmény'} • {result.sourceSheet}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${p1Won ? 'font-bold text-gray-950' : 'text-gray-550'}`}>
                              {getPlayerName(result.player1Id)}
                            </span>
                            {p1Won && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${!p1Won ? 'font-bold text-gray-950' : 'text-gray-550'}`}>
                              {getPlayerName(result.player2Id)}
                            </span>
                            {!p1Won && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-150">
                        <div className="bg-gray-100 border text-gray-800 text-sm font-mono font-bold px-3.5 py-1.5 rounded-lg">
                          {result.normalizedSetsWon} : {result.normalizedSetsLost}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: JÁTÉKOSOK (PLAYERS IN THIS LEAGUE) */}
      {activeTab === 'jatekosok' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs animate-fadeIn" id="jatekosok-pane">
          <div className="mb-6">
            <h3 className="font-display font-bold text-lg text-gray-900">Résztvevő Játékosok</h3>
            <p className="text-xs text-gray-500">Ebben a ligacsoportban versenyző regisztrált fallabdázók köre.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activePlayers.map((player) => {
              const standing = standingsByPlayerId.get(player.id);
              return (
                <div key={player.id} className="border border-gray-200/80 rounded-xl p-4 bg-gray-50/20 hover:border-brand-red transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-red/10 text-brand-red p-2.5 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 pr-1">{player.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">
                          {player.sourceSheetName || currentLeague?.name || 'Liga játékos'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stat indicators if played */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-center font-mono">
                      <div className="bg-white py-1.5 rounded border border-gray-100">
                        <span className="text-[9px] uppercase text-gray-400 block">Győzelmek</span>
                        <span className="text-sm font-bold text-emerald-600">{standing ? standing.wins : 0} db</span>
                      </div>
                      <div className="bg-white py-1.5 rounded border border-gray-100">
                        <span className="text-[9px] uppercase text-gray-400 block">Összpont</span>
                        <span className="text-sm font-bold text-brand-red">{standing ? standing.basePoints : 0} pont</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2 text-[10px] font-mono text-gray-400 text-center uppercase">
                    Aktív versenyző
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SZABÁLYOK (RULES) */}
      {activeTab === 'szabalyok' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs animate-fadeIn" id="szabalyok-pane">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-brand-red text-white p-3 rounded-xl">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">{leagueRulesTitle}</h3>
              <p className="text-xs text-gray-400 font-mono">Arasz-Öntöde Squashliga Szervezőség</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-150 bg-gray-50/40 p-5 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-red/10 text-brand-red p-2.5 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-gray-950">Mérkőzésrend</h4>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {leagueLetter}-liga specifikus, letisztított szabályok.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-700 leading-relaxed">
                {matchRulesParagraphs.map((line) => (
                  <p key={line} className="leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-150 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 text-emerald-700 p-2.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-gray-950">Pontozási logika</h4>
                  <p className="text-xs text-gray-500">Az arányok alapján járó pontok.</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700 space-y-2">
                <p>Győzelem: 5 pont</p>
                <p>Vereség 2/3 szett: 3 pont</p>
                <p>Vereség 1/4 szett: 2 pont</p>
                <p>Vereség 0/5 szett: 1 pont</p>
                <p>Játék nélkül: 0 pont</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-150 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 text-amber-700 p-2.5">
                  <Orbit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-gray-950">Labdahasználat</h4>
                  <p className="text-xs text-gray-500">{leagueLetter}-liga labdaszabályai.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-700 leading-relaxed">
                {ballRulesParagraphs.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EREDMÉNY BEKÜLDÉSE (SUBMIT RESULT) */}
      {activeTab === 'eredmeny_bekuldese' && (
        <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-6 shadow-xs animate-fadeIn" id="eredmeny-bekuldese-pane">
          <SubmitResult
            players={players}
            leagues={leagues}
            matches={matches}
            onSubmitResult={onSubmitResult}
            setView={setView}
            preselectedLeagueId={currentLeague.id}
          />
        </div>
      )}

    </div>
  );
}
