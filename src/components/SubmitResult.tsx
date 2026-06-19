import React, { useState, useEffect } from 'react';
import { Player, League, Match, SetScore, MatchScore } from '../types';
import { Trophy, HelpCircle, Send, CheckCircle2, AlertCircle, Plus, Info, Sparkles } from 'lucide-react';

interface SubmitResultProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  onSubmitResult: (newMatchSubmission: Match) => void;
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
  preselectedLeagueId?: string;
}

export default function SubmitResult({ players, leagues, matches, onSubmitResult, setView, preselectedLeagueId }: SubmitResultProps) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(preselectedLeagueId || '');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('custom');

  useEffect(() => {
    if (preselectedLeagueId) {
      setSelectedLeagueId(preselectedLeagueId);
      setSelectedMatchId('custom');
      setPlayer1Id('');
      setPlayer2Id('');
    }
  }, [preselectedLeagueId]);
  
  // Custom match feltöltés esetén
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');
  
  // Szettek eredményei (max 5)
  const [set1P1, setSet1P1] = useState<string>('');
  const [set1P2, setSet1P2] = useState<string>('');
  const [set2P1, setSet2P1] = useState<string>('');
  const [set2P2, setSet2P2] = useState<string>('');
  const [set3P1, setSet3P1] = useState<string>('');
  const [set3P2, setSet3P2] = useState<string>('');
  const [set4P1, setSet4P1] = useState<string>('');
  const [set4P2, setSet4P2] = useState<string>('');
  const [set5P1, setSet5P1] = useState<string>('');
  const [set5P2, setSet5P2] = useState<string>('');

  // Beküldő adatai
  const [submitterName, setSubmitterName] = useState<string>('');
  const [submitterContact, setSubmitterContact] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Kapcsolódó liga kiválasztásánál módosulnak a választható meccsek és játékosok
  const activeLeague = leagues.find(l => l.id === selectedLeagueId);
  
  // Tervezett meccsek listája az adott ligában
  const availableMatches = selectedLeagueId 
    ? matches.filter(m => m.leagueId === selectedLeagueId && m.status === 'Tervezett')
    : [];

  // Játékosok listája a ligában
  const availablePlayers = activeLeague
    ? players.filter(p => activeLeague.playerIds.includes(p.id))
    : players;

  // Meccs választás kezelése
  const handleMatchChange = (matchId: string) => {
    setSelectedMatchId(matchId);
    if (matchId !== 'custom') {
      const selectedMatch = matches.find(m => m.id === matchId);
      if (selectedMatch) {
        setPlayer1Id(selectedMatch.player1Id);
        setPlayer2Id(selectedMatch.player2Id);
      }
    } else {
      setPlayer1Id('');
      setPlayer2Id('');
    }
  };

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Nincs kiválasztva';
  };

  // Dinamikus eredmény számoló (Set counts)
  const calculateWinnerAndSets = (): { p1Sets: number, p2Sets: number, setsArray: SetScore[] } => {
    let p1Sets = 0;
    let p2Sets = 0;
    const setsArray: SetScore[] = [];

    const processSet = (p1Str: string, p2Str: string) => {
      const p1 = parseInt(p1Str, 10);
      const p2 = parseInt(p2Str, 10);
      if (!isNaN(p1) && !isNaN(p2)) {
        setsArray.push({ player1: p1, player2: p2 });
        if (p1 > p2) p1Sets++;
        if (p2 > p1) p2Sets++;
      }
    };

    processSet(set1P1, set1P2);
    processSet(set2P1, set2P2);
    processSet(set3P1, set3P2);
    processSet(set4P1, set4P2);
    processSet(set5P1, set5P2);

    return { p1Sets, p2Sets, setsArray };
  };

  const { p1Sets, p2Sets, setsArray } = calculateWinnerAndSets();

  // Validálás és beküldés
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedLeagueId) {
      setErrorMsg('Kérjük, válaszd ki a bajnokságot!');
      return;
    }
    if (!player1Id || !player2Id) {
      setErrorMsg('Mindkét játékos kiválasztása kötelező!');
      return;
    }
    if (player1Id === player2Id) {
      setErrorMsg('Egy játékos nem játszhat önmaga ellen!');
      return;
    }
    if (setsArray.length < 3) {
      setErrorMsg('A fallabda mérkőzéseken legalább 3 szett lejátszása és megadása kötelező!');
      return;
    }
    if (p1Sets < 3 && p2Sets < 3) {
      setErrorMsg('A mérkőzés megnyeréséhez az egyik játékosnak legalább 3 szettet kell nyernie!');
      return;
    }
    if (p1Sets === 3 && p2Sets === 3) {
      setErrorMsg('Hibás szettarány! Squash mérkőzésen nem lehet mindkét félnek 3 nyert szettje!');
      return;
    }
    if (p1Sets > 3 || p2Sets > 3) {
      setErrorMsg('Hibás szettarány! Senkinek sem lehet 3-nál több nyert szettje (Best of 5).');
      return;
    }
    if (!submitterName.trim()) {
      setErrorMsg('Kérjük, add meg a nevedet mint beküldő!');
      return;
    }

    // Létrehozzuk a beküldött mérkőzés entitást
    const newSubmission: Match = {
      id: selectedMatchId !== 'custom' ? selectedMatchId : `m_sub_${Date.now()}`,
      leagueId: selectedLeagueId,
      round: selectedMatchId !== 'custom' 
        ? (matches.find(m => m.id === selectedMatchId)?.round || 1)
        : 1, // Ha egyedi, default 1
      player1Id,
      player2Id,
      date: new Date().toISOString().split('T')[0], // Mai nap
      court: selectedMatchId !== 'custom' 
        ? (matches.find(m => m.id === selectedMatchId)?.court || '1-es pálya')
        : '1-es pálya',
      status: 'Beküldve', // Beküldve státuszt kap
      submittedScore: {
        player1Sets: p1Sets,
        player2Sets: p2Sets,
        sets: setsArray
      },
      submitterName,
      submitterContact,
      comment,
      submittedAt: new Date().toISOString()
    };

    onSubmitResult(newSubmission);
    setIsSuccess(true);
  };

  const handleResetForm = () => {
    setSelectedLeagueId('');
    setSelectedMatchId('custom');
    setPlayer1Id('');
    setPlayer2Id('');
    setSet1P1(''); setSet1P2('');
    setSet2P1(''); setSet2P2('');
    setSet3P1(''); setSet3P2('');
    setSet4P1(''); setSet4P2('');
    setSet5P1(''); setSet5P2('');
    setSubmitterName('');
    setSubmitterContact('');
    setComment('');
    setIsSuccess(false);
    setErrorMsg(null);
  };

  // SUCCESS STATE (Aktiválódik sikeres beküldés után)
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-8 text-center shadow-lg animate-fadeIn my-6">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h2 className="font-display font-extrabold text-2xl text-gray-950">Eredmény sikeresen beküldve!</h2>
        <p className="text-sm text-gray-500 mt-2 font-sans px-4">
          A mérkőzés rögzítésre került. Az adatok ellenőrzés és jóváhagyás után jelennek meg a hivatalos tabellán.
        </p>

        {/* Eredmény összefoglaló kártya */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/60 my-6 text-left space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Összefoglaló</p>
          <div className="text-sm font-sans">
            <span className="font-semibold text-gray-500">Liga:</span> <span className="font-bold text-gray-800">{activeLeague?.name}</span>
          </div>
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-150">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{getPlayerName(player1Id)}</p>
              <p className="font-semibold text-gray-950 text-sm">{getPlayerName(player2Id)}</p>
            </div>
            <div className="bg-brand-red text-white text-base font-mono font-bold px-3 py-1.5 rounded-lg">
              {p1Sets} : {p2Sets}
            </div>
          </div>
          <p className="text-xs text-gray-400 italic">"Az eredmény beküldve, admin jóváhagyásra vár."</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setView('home')}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors"
          >
            Vissza a kezdőlapra
          </button>
          <button
            onClick={handleResetForm}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm border border-gray-200 transition-colors"
          >
            Újabb eredmény rögzítése
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* Cím szekció */}
      <div className="text-center space-y-2">
        <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
          Gyors eredményjelentés
        </span>
        <h2 className="text-3xl font-display font-extrabold text-gray-900">Eredmény Beküldése</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Fallabda mérkőzés lezárása. Az adatok beküldését követően az admin jóváhagyja az eredményt és a pontok frissülnek.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-red" />
            <div>
              <p className="font-semibold">Hiba történt a validálás során</p>
              <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 1. LIGA KIVÁLASZTÁSA */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
            1. Bajnokság kiválasztása *
          </label>
          {preselectedLeagueId ? (
            <div className="w-full bg-red-50/50 border border-brand-red/30 rounded-xl px-4 py-3.5 text-sm font-bold text-brand-red flex justify-between items-center">
              <span>
                {leagues.find(l => l.id === selectedLeagueId)?.name} – {
                  selectedLeagueId === 'l1' ? '1. osztály' :
                  selectedLeagueId === 'l2' ? '2. osztály' :
                  selectedLeagueId === 'l3' ? '3. osztály' :
                  selectedLeagueId === 'l4' ? '4. osztály' :
                  selectedLeagueId === 'l5' ? '5. osztály' : 'Osztály'
                }
              </span>
              <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase px-2.5 py-1 bg-brand-red text-white rounded-md">
                Kiválasztva
              </span>
            </div>
          ) : (
            <select
              value={selectedLeagueId}
              onChange={(e) => {
                setSelectedLeagueId(e.target.value);
                setSelectedMatchId('custom');
                setPlayer1Id('');
                setPlayer2Id('');
              }}
              className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3.5 text-sm font-medium text-gray-800 transition-colors cursor-pointer"
              required
              id="input-select-league"
            >
              <option value="">-- Kérjük, válassz ligát --</option>
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.season})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedLeagueId && (
          <>
            {/* 2. MECCS SORSOLÁS KIVÁLASZTÁSA */}
            <div className="space-y-2 animate-fadeIn">
              <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
                2. Mérkőzés kiválasztása *
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => handleMatchChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3.5 text-sm text-gray-800 transition-colors cursor-pointer font-medium"
                id="input-select-match"
              >
                <option value="custom">Egyedi mérkőzés (nincs a tervezett sorsolásban)</option>
                {availableMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.round}. forduló: {getPlayerName(m.player1Id)} vs {getPlayerName(m.player2Id)} ({m.date})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. JÁTÉKOSOK (HA EGYEDI / CUSTOM MECCS) */}
            {selectedMatchId === 'custom' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400">Hazai Játékos *</label>
                  <select
                    value={player1Id}
                    onChange={(e) => setPlayer1Id(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red rounded-xl px-4 py-3 text-sm cursor-pointer font-medium text-gray-800"
                    id="input-player-1"
                    required
                  >
                    <option value="">-- Válassz hazai játékost --</option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase text-gray-400">Vendég Játékos *</label>
                  <select
                    value={player2Id}
                    onChange={(e) => setPlayer2Id(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red rounded-xl px-4 py-3 text-sm cursor-pointer font-medium text-gray-800"
                    id="input-player-2"
                    required
                  >
                    <option value="">-- Válassz vendég játékost --</option>
                    {availablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              // Ha kötött meccs, csak kiírjuk fix kártyaként, hogy megbízható legyen
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center justify-between animate-fadeIn text-sm">
                <div>
                  <p className="text-[10px] font-mono uppercase text-gray-400">Párosítás</p>
                  <p className="font-bold text-gray-800 mt-1">{getPlayerName(player1Id)} vs {getPlayerName(player2Id)}</p>
                </div>
                <span className="text-xs bg-brand-red/10 text-brand-red font-mono px-2 py-1 rounded-sm uppercase font-bold">
                  KÖTÖTT ÜTEMTERV
                </span>
              </div>
            )}

            {/* 4. SZETTEK EREDMÉNYEI (TOUCH FRIENDLY / COMPACT ROW MAP) */}
            {player1Id && player2Id && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-fadeIn" id="sets-input-section">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
                    3. Szettek pontszámai (PONT-SZÁMOK pl. 11-9)*
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-red bg-red-50 px-2 py-1 rounded-md">
                    <Info className="w-3 h-3" />
                    Adjad meg a szettek pontos állását (pl. 11 és 8)
                  </span>
                </div>

                {/* Scoreboard table view */}
                <div className="space-y-3">
                  
                  {/* Table headers */}
                  <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-mono font-bold text-gray-400 uppercase hidden sm:grid">
                    <span className="col-span-2 text-left">Szett</span>
                    <span className="col-span-5 truncate text-left pl-1">{getPlayerName(player1Id)}</span>
                    <span className="col-span-5 truncate text-left pl-1">{getPlayerName(player2Id)}</span>
                  </div>

                  {/* Set 1 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-2 font-mono text-xs font-bold text-gray-800 pl-1 uppercase">1. Szett</span>
                    <div className="col-span-6 sm:col-span-5 relative">
                      <input
                        type="number"
                        placeholder="Pont (hazai)"
                        min="0"
                        value={set1P1}
                        onChange={(e) => setSet1P1(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set1-player1"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-5 relative">
                      <input
                        type="number"
                        placeholder="Pont (vendég)"
                        min="0"
                        value={set1P2}
                        onChange={(e) => setSet1P2(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set1-player2"
                      />
                    </div>
                  </div>

                  {/* Set 2 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-2 font-mono text-xs font-bold text-gray-800 pl-1 uppercase">2. Szett</span>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (hazai)"
                        min="0"
                        value={set2P1}
                        onChange={(e) => setSet2P1(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set2-player1"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (vendég)"
                        min="0"
                        value={set2P2}
                        onChange={(e) => setSet2P2(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set2-player2"
                      />
                    </div>
                  </div>

                  {/* Set 3 */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-2 font-mono text-xs font-bold text-gray-800 pl-1 uppercase">3. Szett</span>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (hazai)"
                        min="0"
                        value={set3P1}
                        onChange={(e) => setSet3P1(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set3-player1"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (vendég)"
                        min="0"
                        value={set3P2}
                        onChange={(e) => setSet3P2(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono font-bold"
                        required
                        id="set3-player2"
                      />
                    </div>
                  </div>

                  {/* Set 4 (Opcionális) */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-2 font-mono text-xs text-gray-500 pl-1 uppercase">4. Szett <span className="text-[9px] lowercase italic">(opc.)</span></span>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (hazai)"
                        min="0"
                        value={set4P1}
                        onChange={(e) => setSet4P1(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono"
                        id="set4-player1"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (vendég)"
                        min="0"
                        value={set4P2}
                        onChange={(e) => setSet4P2(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono"
                        id="set4-player2"
                      />
                    </div>
                  </div>

                  {/* Set 5 (Opcionális) */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-12 sm:col-span-2 font-mono text-xs text-gray-500 pl-1 uppercase">5. Szett <span className="text-[9px] lowercase italic">(opc.)</span></span>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (hazai)"
                        min="0"
                        value={set5P1}
                        onChange={(e) => setSet5P1(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono"
                        id="set5-player1"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="number"
                        placeholder="Pont (vendég)"
                        min="0"
                        value={set5P2}
                        onChange={(e) => setSet5P2(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm text-center font-mono"
                        id="set5-player2"
                      />
                    </div>
                  </div>

                </div>

                {/* Automatikus visszajelzés szettarányról */}
                {setsArray.length >= 3 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between text-sm sm:text-base text-gray-900 font-sans">
                    <div className="flex items-center gap-2 font-semibold">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Becsült szettarány:</span>
                    </div>
                    <div className="font-mono font-black text-emerald-700 bg-white border border-emerald-100 px-3.5 py-1.5 rounded-lg text-lg">
                      {p1Sets} : {p2Sets}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. BEKÜLDŐ ADATAI */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
                4. Beküldő adatai
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-semibold">Beküldő Neve *</span>
                  <input
                    type="text"
                    placeholder="Pl. Szabó Péter"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm"
                    required
                    id="input-submitter-name"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-semibold">E-mail vagy Telefonszám</span>
                  <input
                    type="text"
                    placeholder="Pl. peter@gmail.com"
                    value={submitterContact}
                    onChange={(e) => setSubmitterContact(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm"
                    id="input-submitter-contact"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Megjegyzés a mérkőzéshez</span>
                <textarea
                  placeholder="Pl. Sportszerű, szoros meccs volt. Sajnos sérülés miatt a 4. szettben szünetet kellett tartani..."
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red rounded-xl px-4 py-3 text-sm"
                  id="input-submitter-comment"
                />
              </div>
            </div>

            {/* MEGERŐSÍTŐ SUBMIT BUTTON */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-maroon text-white font-semibold py-4 rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer font-sans"
                id="submit-form-button"
              >
                Mérkőzés beküldése jóváhagyásra
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
