import React, { useState, useEffect } from 'react';
import { Player, League, Match, Standing } from '../types';
import { Trophy, Calendar, Users, FileText, ArrowLeft, RefreshCw, Star, MapPin, Eye, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { calculateStandings } from '../data';
import SubmitResult from './SubmitResult';

interface PublicLeaguesProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
  selectedLeagueId: string | null;
  setSelectedLeagueId: (id: string | null) => void;
  initialSubTab?: string;
  onSubmitResult: (newSubmission: Match) => void;
}

export default function PublicLeagues({
  players,
  leagues,
  matches,
  setView,
  selectedLeagueId,
  setSelectedLeagueId,
  initialSubTab = 'tabella',
  onSubmitResult
}: PublicLeaguesProps) {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  // Az al-fület beállítjuk ha kívülről kapunk paramétert
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab, selectedLeagueId]);

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Ismeretlen';
  };

  const getCompletedMatchesCount = (leagueId: string) => {
    return matches.filter(m => m.leagueId === leagueId && m.status === 'Jóváhagyva').length;
  };

  const currentLeague = leagues.find(l => l.id === selectedLeagueId);

  // Tabella lekérése
  const standings: Standing[] = currentLeague
    ? calculateStandings(currentLeague.id, matches, players, currentLeague.playerIds)
    : [];

  // Csoportosított meccsek a sorsoláshoz
  const currentLeagueMatches = currentLeague
    ? matches.filter(m => m.leagueId === currentLeague.id)
    : [];

  const completedMatches = currentLeagueMatches.filter(m => m.status === 'Jóváhagyva');

  // Fordulók szerinti csoportosítás
  const roundsMap: Record<number, Match[]> = {};
  currentLeagueMatches.forEach(m => {
    if (!roundsMap[m.round]) {
      roundsMap[m.round] = [];
    }
    roundsMap[m.round].push(m);
  });
  const roundNumbers = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);

  // Játékosok lekérése a kiválasztott ligában
  const activePlayers = currentLeague
    ? players.filter(p => currentLeague.playerIds.includes(p.id))
    : [];

  if (!selectedLeagueId || !currentLeague) {
    // ----------------------------------------------------
    // LIGÁK LISTÁZÁSA (Leagues Directory)
    // ----------------------------------------------------
    return (
      <div className="space-y-8 animate-fadeIn pb-16">
        <div>
          <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
            Aktív bajnokságok
          </span>
          <h2 className="text-3xl font-display font-extrabold text-gray-900 mt-2">Squash Ligacsoportok</h2>
          <p className="text-sm text-gray-500 font-sans mt-1">
            Válaszd ki az alábbi ligákat a részletes tabellákhoz, eredményekhez és sorsolásokhoz.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => {
            const leaguePlayersCount = league.playerIds.length;
            const matchesCount = getCompletedMatchesCount(league.id);
            const totalMatchesInLeague = matches.filter(m => m.leagueId === league.id).length;

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
                      AKTÍV
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 font-mono mt-1">{league.season}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6 py-4 border-y border-gray-100">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-mono text-gray-400">Játékosok</p>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{leaguePlayersCount} fő</span>
                      </div>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 pl-4">
                      <p className="text-[10px] uppercase font-mono text-gray-400">Meccsek (L/Ö)</p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{matchesCount} / {totalMatchesInLeague}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      setSelectedLeagueId(league.id);
                      setActiveTab('tabella');
                    }}
                    className="w-full bg-gray-50 group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                    id={`view-league-${league.id}`}
                  >
                    Megnézem az adatokat
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
            onClick={() => setSelectedLeagueId(null)}
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
              <span className="text-xs font-mono bg-red-50 text-brand-red font-bold px-2.5 py-0.5 rounded-md border border-red-100">
                {selectedLeagueId === 'l1' ? '1. osztály' :
                 selectedLeagueId === 'l2' ? '2. osztály' :
                 selectedLeagueId === 'l3' ? '3. osztály' :
                 selectedLeagueId === 'l4' ? '4. osztály' :
                 selectedLeagueId === 'l5' ? '5. osztály' : 'Bajnokság'}
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
          onClick={() => setActiveTab('eredmeny_bekuldese')}
          className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-3.5 rounded-xl hover:bg-brand-maroon shadow-xs transition-all flex items-center justify-center gap-2"
          id="league-detail-submit"
        >
          <Send className="w-4 h-4" />
          Eredmény beküldése
        </button>
      </div>

      {/* Részletező Tab gombok */}
      <div className="flex overflow-x-auto pb-1 border-b border-gray-150 gap-2 scrollbar-none" id="league-tab-navigation">
        {[
          { id: 'tabella', name: 'Tabella', icon: Trophy },
          { id: 'eredmenyek', name: 'Eredmények', icon: FileText },
          { id: 'sorsolas', name: 'Sorsolás', icon: Calendar },
          { id: 'eredmeny_bekuldese', name: 'Eredmény beküldése', icon: Send },
          { id: 'jatekosok', name: 'Játékosok', icon: Users },
          { id: 'szabalyok', name: 'Szabályok', icon: Star },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg ${
                isSelected
                  ? 'border-brand-red text-brand-red bg-red-50/20'
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
            <p className="text-xs text-gray-500">Mérkőzések lezárása (admin jóváhagyás) után számolt dinamikus rangsor.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left" id="standings-table">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-mono font-bold uppercase tracking-wider text-gray-400 bg-gray-50">
                  <th className="py-3.5 px-4 text-center w-12">Hely</th>
                  <th className="py-3.5 px-4">Játékos</th>
                  <th className="py-3.5 px-4 text-center">Meccsek</th>
                  <th className="py-3.5 px-4 text-center">Gy - V</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">Nyert Szett</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">Vesztett Szett</th>
                  <th className="py-3.5 px-4 text-center hidden md:table-cell">Szettkülönbség</th>
                  <th className="py-3.5 px-4 text-center">Pont</th>
                  <th className="py-3.5 px-4 text-right">Forma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-sm py-12 text-gray-400 font-sans">
                      Nincsenek még jóváhagyott mérkőzések ebben a ligában. A tabella jelenleg üres.
                    </td>
                  </tr>
                ) : (
                  standings.map((standing, index) => {
                    const diff = standing.setsWon - standing.setsLost;
                    return (
                      <tr key={standing.playerId} className="hover:bg-gray-50/50 transition-colors text-sm">
                        
                        {/* Helyezés */}
                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : index === 1
                              ? 'bg-gray-100 text-gray-800'
                              : index === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-gray-500'
                          }`}>
                            {index + 1}
                          </span>
                        </td>

                        {/* Játékosnév */}
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {standing.playerName}
                        </td>

                        {/* Lejátszott meccsek */}
                        <td className="py-4 px-4 text-center font-mono font-semibold text-gray-700">
                          {standing.matchesPlayed}
                        </td>

                        {/* Győzelem / Vereség */}
                        <td className="py-4 px-4 text-center font-mono text-gray-600">
                          <span className="text-emerald-600 font-semibold">{standing.wins}</span>
                          <span className="text-gray-300 px-1">/</span>
                          <span className="text-red-500">{standing.losses}</span>
                        </td>

                        {/* Nyert szettek */}
                        <td className="py-4 px-4 text-center font-mono text-gray-500 hidden sm:table-cell">
                          {standing.setsWon}
                        </td>

                        {/* Vesztett szettek */}
                        <td className="py-4 px-4 text-center font-mono text-gray-500 hidden sm:table-cell">
                          {standing.setsLost}
                        </td>

                        {/* Szett különbség */}
                        <td className={`py-4 px-4 text-center font-mono hidden md:table-cell font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>

                        {/* Összpont */}
                        <td className="py-4 px-4 text-center font-mono font-extrabold text-brand-red text-base">
                          {standing.points}
                        </td>

                        {/* Utolsó meccsek formája (W-W-L-W) */}
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-1">
                            {standing.form.length === 0 ? (
                              <span className="text-xs text-gray-450 font-mono">-</span>
                            ) : (
                              standing.form.map((res, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-mono font-bold text-white ${
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
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between text-xs text-gray-400 font-mono gap-2">
            <span>Győzelem = 3 pont | Vereség = 0 pont</span>
            <span>Azonos pontnál a győzelmek száma, majd a szettkülönbség dönt.</span>
          </div>
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
              const roundMatches = roundsMap[roundNum];
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
                      const isPending = match.status === 'Beküldve';
                      const isRejected = match.status === 'Elutasítva';

                      return (
                        <div key={match.id} className="p-6 flex flex-col md:flex-row justify-between gap-6 hover:bg-gray-50/20 transition-colors">
                          
                          {/* Mérkőzés alapinfók */}
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Státusz badge */}
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {match.status}
                              </span>
                              
                              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {match.date}
                              </span>
                              
                              {match.court && (
                                <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {match.court}
                                </span>
                              )}
                            </div>

                            {/* Játékos nevek */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2">
                              <div className="sm:col-span-5 flex items-center gap-2">
                                <div className="h-6 w-1 bg-gray-300 rounded-xs"></div>
                                <span className={`text-base font-semibold ${isApproved && match.submittedScore!.player1Sets > match.submittedScore!.player2Sets ? 'text-brand-red font-bold' : 'text-gray-800'}`}>
                                  {getPlayerName(match.player1Id)}
                                </span>
                              </div>
                              <div className="sm:col-span-2 text-center text-xs font-semibold text-gray-400 italic">vs</div>
                              <div className="sm:col-span-5 flex items-center gap-2 sm:justify-end">
                                <span className={`text-base font-semibold ${isApproved && match.submittedScore!.player2Sets > match.submittedScore!.player1Sets ? 'text-brand-red font-bold' : 'text-gray-800'}`}>
                                  {getPlayerName(match.player2Id)}
                                </span>
                                <div className="hidden sm:block h-6 w-1 bg-gray-300 rounded-xs"></div>
                              </div>
                            </div>
                          </div>

                          {/* Végeredmény kijelzés és gombok */}
                          <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                            {isApproved && match.submittedScore ? (
                              <div className="flex items-center gap-3 w-full justify-between">
                                {/* Sets breakdown */}
                                <div className="flex gap-1.5">
                                  {match.submittedScore.sets.map((set, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 text-[10px] font-mono h-8 w-10 flex flex-col justify-center items-center rounded-sm">
                                      <span className={set.player1 > set.player2 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player1}</span>
                                      <span className={set.player2 > set.player1 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player2}</span>
                                    </div>
                                  ))}
                                </div>
                                {/* Final Score */}
                                <div className="bg-brand-red text-white text-lg font-mono font-bold px-4 py-2 rounded-xl h-10 w-16 flex items-center justify-center">
                                  {match.submittedScore.player1Sets}:{match.submittedScore.player2Sets}
                                </div>
                              </div>
                            ) : isPending ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[11px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">
                                  Eredmény beküldve, ellenőrzésre vár
                                </span>
                                <span className="text-[10px] text-gray-400 text-right">Beküldő: {match.submitterName}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveTab('eredmeny_bekuldese')}
                                className="w-full md:w-auto bg-gray-100 hover:bg-brand-red hover:text-white text-gray-700 font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg border border-gray-200 hover:border-brand-red transition-all cursor-pointer"
                                id={`submit-result-btn-${match.id}`}
                              >
                                Eredmény beküldése
                              </button>
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
              <p className="text-xs text-gray-500">A tavaszi szezonban sikeresen lezárt és jóváhagyott mérkőzések listája.</p>
            </div>
            <div className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md">
              Összesen: <span className="font-bold text-brand-red">{completedMatches.length} db</span> lejátszva
            </div>
          </div>

          <div className="space-y-4">
            {completedMatches.length === 0 ? (
              <div className="text-center py-12 text-gray-405 italic">
                Nincsenek befejezett és lezárt mérkőzések ebben a bajnokságban még.
              </div>
            ) : (
              [...completedMatches]
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((match) => (
                  <div key={match.id} className="p-4 bg-gray-50/60 hover:bg-gray-50 border border-gray-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block mb-1">
                        Forduló {match.round} • {match.date} {match.court ? `• ${match.court}` : ''}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${match.submittedScore!.player1Sets > match.submittedScore!.player2Sets ? 'font-bold text-gray-950' : 'text-gray-550'}`}>
                            {getPlayerName(match.player1Id)}
                          </span>
                          {match.submittedScore!.player1Sets > match.submittedScore!.player2Sets && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${match.submittedScore!.player2Sets > match.submittedScore!.player1Sets ? 'font-bold text-gray-950' : 'text-gray-550'}`}>
                            {getPlayerName(match.player2Id)}
                          </span>
                          {match.submittedScore!.player2Sets > match.submittedScore!.player1Sets && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-150">
                      <div className="flex gap-1">
                        {match.submittedScore?.sets.map((set, i) => (
                          <div key={i} className="bg-white border border-gray-200 text-[10px] font-mono h-8 w-10 flex flex-col justify-center items-center rounded-sm">
                            <span className={set.player1 > set.player2 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player1}</span>
                            <span className={set.player2 > set.player1 ? 'text-gray-900 font-bold' : 'text-gray-400'}>{set.player2}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-gray-100 border text-gray-800 text-sm font-mono font-bold px-3.5 py-1.5 rounded-lg">
                        {match.submittedScore?.player1Sets} : {match.submittedScore?.player2Sets}
                      </div>
                    </div>
                  </div>
                ))
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
              const standing = standings.find(s => s.playerId === player.id);
              return (
                <div key={player.id} className="border border-gray-200/80 rounded-xl p-4 bg-gray-50/20 hover:border-brand-red transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-brand-red p-2.5 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 pr-1">{player.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">Tagság: {player.joinDate}</span>
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
                        <span className="text-sm font-bold text-brand-red">{standing ? standing.points : 0} pont</span>
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
              <h3 className="font-display font-bold text-lg text-gray-900">A Ligacsoport Helyi Szabályzata</h3>
              <p className="text-xs text-gray-400 font-mono">Arasz-Öntöde Squashliga Szervezőség</p>
            </div>
          </div>

          <div className="prose prose-sm text-gray-750 font-sans leading-relaxed space-y-4">
            <p className="font-semibold text-gray-900">
              {currentLeague.rules}
            </p>
            
            <div className="bg-red-50/50 rounded-xl p-4 border border-red-50 text-xs text-slate-700 space-y-2 mt-6">
              <h5 className="font-mono font-bold uppercase tracking-wider text-brand-red flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Mérkőzés-bejelentési protokoll
              </h5>
              <p>
                1. Minden lejátszott mérkőzés után legalább az egyik fél köteles beküldeni az eredményeket a webhely "Eredmény Beküldése" fülén keresztül.
              </p>
              <p>
                2. A beküldött pontszámokat (szettenként ellenőrizve) az adminisztrátorok 24 órán belül felülvizsgálják és jóváhagyják.
              </p>
              <p>
                3. Vita esetén az admin felületen megadott bejelentői adatokat használjuk a felek megkeresésére. Kérjük, pontos adatokat adjatok meg!
              </p>
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
