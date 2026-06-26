import React from 'react';
import { League, Match, Player, Result } from '../types';
import { Trophy, Calendar, CheckSquare, ArrowRight, Newspaper } from 'lucide-react';
import { getLeagueClassLabel } from '../data';

interface PublicHomeProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  results: Result[];
  setView: (view: 'home' | 'leagues' | 'rules' | 'history' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
}

export default function PublicHome({ players, leagues, matches, results, setView }: PublicHomeProps) {
  const activeLeagues = leagues.filter(l => l.isActive).slice(0, 5);
  const plannedMatchesCount = matches.filter(m => m.status === 'Tervezett').length;
  const completedMatchesCount = matches.filter(m => m.status === 'Jóváhagyva').length;
  const playerNameById = new Map(players.map(player => [player.id, player.name]));

  const latestResults = results
    .map((result, index) => ({
      result,
      index,
      timestamp: result.importedAt ? Date.parse(result.importedAt) : 0,
    }))
    .sort((a, b) => {
      if (b.timestamp !== a.timestamp) {
        return b.timestamp - a.timestamp;
      }

      return b.index - a.index;
    })
    .slice(0, 3)
    .map(item => item.result);

  const getPlayerName = (id: string) => playerNameById.get(id) || 'Ismeretlen játékos';
  const getLeagueName = (leagueId: string) => `${leagueId.split('-').pop()?.toUpperCase() || leagueId} liga`;

  return (
    <div className="space-y-12 pb-16 animate-fadeIn bg-radial-pattern">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-maroon via-brand-red to-brand-maroon text-white rounded-3xl py-16 px-8 sm:px-12 shadow-xl border border-brand-maroon">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-display font-black tracking-[0.18em] uppercase border border-white/10">
            <Trophy className="w-4 h-4 text-yellow-400" />
            15. squash liga
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.05em] leading-[0.92] drop-shadow-[0_4px_18px_rgba(0,0,0,0.18)]">
            Arasz-Öntöde <br />
            <span className="text-white/95">Squashliga</span>
          </h1>

          <p className="text-base sm:text-lg text-white/85 max-w-xl font-normal leading-relaxed">
            Válassz bajnokságot, és utána nézd meg a tabellát, a sorsolást, az eredményeket vagy küldj be új meccseredményt.
          </p>
        </div>

        <div className="hidden lg:block absolute -right-12 -bottom-12 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="hidden md:block absolute right-16 top-1/2 -translate-y-1/2 opacity-15 border-[12px] border-white/20 w-48 h-48 rounded-full"></div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-brand-red">
              <Newspaper className="h-3.5 w-3.5" />
              Friss hírek
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-950">
              Legutóbbi eredmények
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {latestResults.length > 0 ? (
            latestResults.map((result) => (
              <article
                key={result.id}
                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-red/30 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-red/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-brand-red">
                      {getLeagueClassLabel(result.leagueId)}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-950 leading-tight">
                        {getPlayerName(result.player1Id)} - {getPlayerName(result.player2Id)}
                      </h3>
                    </div>
                  </div>

                  <div className="min-w-[84px] self-stretch rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-slate-400">
                      Eredmény
                    </p>
                    <p className="mt-1 text-3xl font-display font-extrabold text-brand-red leading-none">
                      {result.normalizedSetsWon}:{result.normalizedSetsLost}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-brand-red">
                    {getLeagueName(result.leagueId)}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="lg:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500">
              Jelenleg nincs megjeleníthető eredmény.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Aktív ligák</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{activeLeagues.length} Liga</h4>
          </div>
          <div className="bg-brand-red/10 text-brand-red p-3 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Tervezett meccsek</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{plannedMatchesCount} Meccs</h4>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Lejátszott mérkőzések</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{completedMatchesCount} Lejátszva</h4>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider w-fit">
            Válassz bajnokságot
          </span>
          <h2 className="text-3xl font-display font-extrabold text-gray-900">Bajnokságok</h2>
          <p className="text-sm text-gray-500 font-sans max-w-2xl">
            Az öt liga közül válassz, majd nyisd meg a részletes tabellát és a hozzá tartozó sorsolást.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {activeLeagues.map((league) => (
            <div
              key={league.id}
              className="group bg-white rounded-2xl border border-gray-150 p-5 shadow-xs hover:border-brand-red hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              id={`league-select-card-${league.id}`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 group-hover:bg-brand-red transition-colors"></div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-xl text-gray-950 group-hover:text-brand-red transition-colors">
                      {league.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 mt-1">
                      {getLeagueClassLabel(league.id)}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md whitespace-nowrap">
                    AKTÍV
                  </span>
                </div>

                <button
                  onClick={() => setView('leagues', { leagueId: league.id, subTab: 'tabella' })}
                  className="w-full bg-gray-50 group-hover:bg-brand-red group-hover:text-white group-hover:border-brand-red border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                  id={`view-league-${league.id}`}
                >
                  Megnézem
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-8 border border-gray-150 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl text-center mx-auto space-y-4">
          <h3 className="text-2xl font-display font-extrabold text-gray-900">Első lépés: liga kiválasztása</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            A részletes tabella, a fordulók és az eredménybeküldés csak az adott bajnokság oldalán jelenik meg.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setView('leagues')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-brand-red border border-brand-red/20 hover:border-brand-red px-5 py-3 rounded-xl hover:bg-brand-red/5 transition-colors"
              id="home-open-leagues"
            >
              Összes bajnokság
            </button>
            <button
              onClick={() => setView('history')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 border border-gray-200 hover:border-teal-400 px-5 py-3 rounded-xl hover:bg-teal-50 transition-colors"
              id="home-open-history"
            >
              Liga története
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
