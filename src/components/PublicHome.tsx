import React from 'react';
import { Player, League, Match } from '../types';
import { Trophy, Calendar, CheckSquare, Send, ArrowRight, User, CircleDot } from 'lucide-react';
import { calculateStandings } from '../data';

interface PublicHomeProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
}

export default function PublicHome({ players, leagues, matches, setView }: PublicHomeProps) {
  // Dinamikus statisztikák kiszámítása
  const activeLeaguesCount = leagues.filter(l => l.isActive).length;
  const nextMatchesCount = matches.filter(m => m.status === 'Tervezett').length;
  const completedMatchesCount = matches.filter(m => m.status === 'Jóváhagyva').length;
  
  // Legutolsó 5 jóváhagyott eredmény
  const recentResults = [...matches]
    .filter(m => m.status === 'Jóváhagyva' && m.submittedScore)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Kiemelt liga kiválasztása (A Liga - l1)
  const featuredLeague = leagues.find(l => l.id === 'l1') || leagues[0];
  const featuredStandings = featuredLeague 
    ? calculateStandings(featuredLeague.id, matches, players, featuredLeague.playerIds).slice(0, 4) 
    : [];

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Ismeretlen';
  };

  return (
    <div className="space-y-12 pb-16 animate-fadeIn bg-radial-pattern">
      
      {/* 1. Hero / Nagy Fejléc */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-maroon via-brand-red to-red-900 text-white rounded-3xl py-16 px-8 sm:px-12 shadow-xl border border-red-800">
        {/* Subtle decorative background squash grid */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border border-white/10">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            2026-os szezon folyamatban
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
            Arasz-Öntöde <br />
            <span className="text-red-300">Squashliga</span>
          </h1>
          
          <p className="text-base sm:text-lg text-red-100 max-w-xl font-normal leading-relaxed">
            Aktuális ligák, sorsolások, eredmények és tabellák egy helyen. Játssz a legjobbakkal, gyűjtsd a pontokat és kövesd nyomon a fejlődésed!
          </p>
          
          <div className="pt-4 flex flex-wrap gap-4">
            <button
              onClick={() => setView('leagues', { subTab: 'tabella' })}
              className="bg-white text-brand-red font-semibold px-6 py-3.5 rounded-xl shadow-md hover:bg-red-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              id="hero-go-leagues"
            >
              Bajnokságok böngészése
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('leagues', { leagueId: featuredLeague?.id, subTab: 'eredmeny_bekuldese' })}
              className="bg-brand-red/40 backdrop-blur-md text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 hover:bg-brand-red/60 transition-all flex items-center gap-2 cursor-pointer"
              id="hero-submit-score"
            >
              Meccseredmény beküldése
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient squash ball graphic */}
        <div className="hidden lg:block absolute -right-12 -bottom-12 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="hidden md:block absolute right-16 top-1/2 -translate-y-1/2 opacity-15 border-[12px] border-white/20 w-48 h-48 rounded-full"></div>
      </section>

      {/* 2. Gyors Kártyák (Quick Bento Metrics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Aktív csoportok</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{activeLeaguesCount} Liga</h4>
          </div>
          <div className="bg-red-50 text-brand-red p-3 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Tervezett mecsek</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{nextMatchesCount} Meccs</h4>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Hivatalos mérkőzések</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900">{completedMatchesCount} Lejátszva</h4>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Action Metric Button */}
        <button
          onClick={() => setView('leagues', { leagueId: featuredLeague?.id, subTab: 'eredmeny_bekuldese' })}
          className="group text-left bg-gray-900 hover:bg-brand-maroon focus:ring-4 focus:ring-red-100 p-6 rounded-2xl text-white shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
          id="home-action-card-submit"
        >
          <div className="w-full flex justify-between items-start">
            <span className="bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase">
              Eredmény beküldése
            </span>
            <Send className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
            <h5 className="font-display font-bold text-lg leading-tight">Nem rögzített mérkőzése van?</h5>
            <p className="text-xs text-red-200 mt-1">Saját meccseredmény rögzítése ide</p>
          </div>
        </button>

      </section>

      {/* 3. Kétoszlopos szekció: Kiemelt liga tabella vs Legutóbbi eredmények */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kiemelt aktuális liga blokk (Left - 5 cols) */}
        {featuredLeague && (
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                    Kiemelt Csoport
                  </span>
                  <h3 className="text-xl font-display font-bold text-gray-900 mt-2">{featuredLeague.name}</h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">{featuredLeague.season}</p>
                </div>
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>

              {/* Részleges Állástábla */}
              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-12 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-5">Játékos</span>
                  <span className="col-span-2 text-center">M</span>
                  <span className="col-span-2 text-center">Ny/V</span>
                  <span className="col-span-2 text-right">P</span>
                </div>

                {featuredStandings.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Még nincs lejátszott mérkőzés.</p>
                ) : (
                  featuredStandings.map((standing, index) => (
                    <div 
                      key={standing.playerId}
                      className="grid grid-cols-12 text-sm py-2 border-b border-gray-50 hover:bg-gray-50/50 rounded-md px-1 items-center"
                    >
                      <span className={`col-span-1 text-center font-mono font-bold ${
                        index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : 'text-gray-400'
                      }`}>
                        {index + 1}.
                      </span>
                      <span className="col-span-5 font-semibold text-gray-800 truncate pr-1">
                        {standing.playerName}
                      </span>
                      <span className="col-span-2 text-center font-mono text-gray-600">
                        {standing.matchesPlayed}
                      </span>
                      <span className="col-span-2 text-center font-mono text-xs text-gray-500">
                        {standing.wins}-{standing.losses}
                      </span>
                      <span className="col-span-2 text-right font-mono font-bold text-brand-red">
                        {standing.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-150">
              <button
                onClick={() => setView('leagues', { leagueId: featuredLeague.id, subTab: 'tabella' })}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider"
                id="featured-league-open"
              >
                Teljes tabella és sorsolás
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Legfrissebb eredmények táblázata (Right - 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">Legutóbbi Eredmények</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">A bajnokság legfrissebb jóváhagyott meccsei</p>
            </div>
            <button
              onClick={() => setView('leagues', { subTab: 'eredmenyek' })}
              className="text-xs font-mono font-semibold text-brand-red hover:text-brand-maroon flex items-center gap-1 uppercase hover:underline"
              id="latest-results-more"
            >
              Összes
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {recentResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CircleDot className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-500" />
                <p className="text-sm">Nincsenek még megerősített eredmények tavaszi szezununkban.</p>
              </div>
            ) : (
              recentResults.map((match) => {
                const leagueName = leagues.find(l => l.id === match.leagueId)?.name || 'Liga';
                return (
                  <div 
                    key={match.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/60 rounded-xl border border-gray-150 hover:border-gray-300 transition-all gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-red-50 text-brand-red rounded-sm uppercase tracking-wider">
                          {leagueName}
                        </span>
                        <span className="text-[10px] font-mono text-gray-450">
                          {match.date} • Forduló {match.round}
                        </span>
                      </div>
                      
                      {/* Játékosok és eredmény */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="space-y-1">
                          <p className={`text-sm font-semibold ${match.submittedScore!.player1Sets > match.submittedScore!.player2Sets ? 'text-gray-900' : 'text-gray-500 font-normal'}`}>
                            {getPlayerName(match.player1Id)}
                          </p>
                          <p className={`text-sm font-semibold ${match.submittedScore!.player2Sets > match.submittedScore!.player1Sets ? 'text-gray-900' : 'text-gray-500 font-normal'}`}>
                            {getPlayerName(match.player2Id)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Szettek és Végeredmény */}
                    <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-150">
                      {/* Pontos Szett állások */}
                      <div className="flex gap-1">
                        {match.submittedScore?.sets.map((set, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border border-gray-200 text-[10px] font-mono text-gray-500 h-7 w-9 flex flex-col justify-center items-center rounded-sm"
                            title={`${idx + 1}. szett`}
                          >
                            <span className={set.player1 > set.player2 ? 'text-gray-900 font-bold' : ''}>{set.player1}</span>
                            <span className={set.player2 > set.player1 ? 'text-gray-900 font-bold' : ''}>{set.player2}</span>
                          </div>
                        ))}
                      </div>

                      {/* Szett végeredmény */}
                      <div className="bg-brand-red text-white text-base font-mono font-bold px-3.5 py-1.5 rounded-lg flex gap-1 items-center. justify-center filter drop-shadow-xs">
                        <span>{match.submittedScore?.player1Sets}</span>
                        <span className="opacity-60 text-xs">:</span>
                        <span>{match.submittedScore?.player2Sets}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </section>

      {/* 4. Ligalista / Információs sáv */}
      <section className="bg-white rounded-3xl p-8 border border-gray-150 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl text-center mx-auto space-y-4">
          <h3 className="text-2xl font-display font-extrabold text-gray-900">Segítség a Bajnoksághoz</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Ligáinkban bárki részt vehet, aki betöltötte a szükséges korhatárt és betartja a szabályokat. A mérkőzéseket tetszőleges szabad időpontban játszhatjátok le az Arasz Squash Clubban, majd küldjétek be bátran az eredményt!
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setView('leagues')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-brand-red border border-brand-red/20 hover:border-brand-red px-5 py-3 rounded-xl hover:bg-red-50/50 transition-colors"
              id="home-rules-info"
            >
              Szabályzatunk & Csoportok
            </button>
          </div>
        </div>
      </section>
      
    </div>
  );
}
