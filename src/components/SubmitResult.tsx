import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Send } from 'lucide-react';
import { League, Match, MatchScore, Player } from '../types';
import { getLeagueClassLabel } from '../data';

interface SubmitResultProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  onSubmitResult: (payload: {
    leagueId: string;
    player1Id: string;
    player2Id: string;
    finalScore: MatchScore;
    submitterName: string;
    comment?: string;
  }) => void;
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin', extra?: { leagueId?: string; subTab?: string }) => void;
  preselectedLeagueId?: string;
}

const FINAL_SCORE_OPTIONS = ['5:0', '4:1', '3:2', '2:3', '1:4', '0:5'] as const;

export default function SubmitResult({ players, leagues, matches, onSubmitResult, setView, preselectedLeagueId }: SubmitResultProps) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(preselectedLeagueId || '');
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');
  const [finalScore, setFinalScore] = useState<string>('');
  const [submitterName, setSubmitterName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedLeagueId) {
      setSelectedLeagueId(preselectedLeagueId);
      setPlayer1Id('');
      setPlayer2Id('');
      setFinalScore('');
      setErrorMsg(null);
    }
  }, [preselectedLeagueId]);

  const activeLeague = leagues.find(l => l.id === selectedLeagueId);
  const availablePlayers = activeLeague
    ? players.filter(p => activeLeague.playerIds.includes(p.id))
    : players;
  const playerNameById = new Map(players.map(player => [player.id, player.name]));
  const currentLeagueMatches = selectedLeagueId
    ? matches.filter(match => match.leagueId === selectedLeagueId)
    : [];

  const getPlayerName = (id: string) => playerNameById.get(id) || 'Nincs kiválasztva';

  const getParsedScore = () => {
    const [player1SetsRaw, player2SetsRaw] = finalScore.split(':');
    const player1Sets = Number(player1SetsRaw);
    const player2Sets = Number(player2SetsRaw);

    if (Number.isNaN(player1Sets) || Number.isNaN(player2Sets)) {
      return null;
    }

    return { player1Sets, player2Sets };
  };

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
    const samePairMatch = currentLeagueMatches.find(match => {
      const sameOrder = match.player1Id === player1Id && match.player2Id === player2Id;
      const reverseOrder = match.player1Id === player2Id && match.player2Id === player1Id;
      return sameOrder || reverseOrder;
    });
    if (samePairMatch?.status === 'Jóváhagyva' || samePairMatch?.status === 'Beküldve') {
      setErrorMsg('Ehhez a pároshoz már van beküldött vagy jóváhagyott eredmény.');
      return;
    }
    if (!finalScore) {
      setErrorMsg('Kérjük, válaszd ki a végeredményt!');
      return;
    }
    if (!FINAL_SCORE_OPTIONS.includes(finalScore as typeof FINAL_SCORE_OPTIONS[number])) {
      setErrorMsg('Kérjük, válassz egy érvényes végeredményt!');
      return;
    }
    const parsedScore = getParsedScore();
    if (!parsedScore || parsedScore.player1Sets + parsedScore.player2Sets !== 5) {
      setErrorMsg('A végeredménynek 5 lejátszott szettet kell mutatnia.');
      return;
    }
    if (!submitterName.trim()) {
      setErrorMsg('Kérjük, add meg a nevedet mint beküldő!');
      return;
    }

    onSubmitResult({
      leagueId: selectedLeagueId,
      player1Id,
      player2Id,
      finalScore: {
        player1Sets: parsedScore.player1Sets,
        player2Sets: parsedScore.player2Sets,
        sets: [],
      },
      submitterName: submitterName.trim(),
      comment: comment.trim() || undefined,
    });
    setIsSuccess(true);
  };

  const handleResetForm = () => {
    setSelectedLeagueId('');
    setPlayer1Id('');
    setPlayer2Id('');
    setFinalScore('');
    setSubmitterName('');
    setComment('');
    setIsSuccess(false);
    setErrorMsg(null);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-gray-150 rounded-3xl p-8 text-center shadow-lg animate-fadeIn my-6">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="font-display font-extrabold text-2xl text-gray-950">Eredmény sikeresen beküldve!</h2>
        <p className="text-sm text-gray-500 mt-2 font-sans px-4">
          A beküldés elmentve, és most már az admin jóváhagyási listájába került.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/60 my-6 text-left space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Összefoglaló</p>
          <div className="text-sm font-sans">
            <span className="font-semibold text-gray-500">Liga:</span> <span className="font-bold text-gray-800">{activeLeague?.name}</span>
          </div>
          <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-150 gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{getPlayerName(player1Id)}</p>
              <p className="font-semibold text-gray-950 text-sm">{getPlayerName(player2Id)}</p>
            </div>
            <div className="bg-brand-red text-white text-base font-mono font-bold px-3 py-1.5 rounded-lg">
              {finalScore}
            </div>
          </div>
          <p className="text-xs text-gray-400 italic">"Jóváhagyás után kerül be a hivatalos táblába és statisztikákba."</p>
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
      <div className="text-center space-y-2">
        <span className="bg-brand-red/10 text-brand-red font-mono font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">
          Gyors eredményjelentés
        </span>
        <h2 className="text-3xl font-display font-extrabold text-gray-900">Eredmény Beküldése</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Fallabda mérkőzés lezárása. Most már csak a két játékost és a végeredményt kell megadni, utána az adminhoz kerül.
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

        <div className="space-y-2">
          <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
            1. Bajnokság kiválasztása *
          </label>
          {preselectedLeagueId ? (
            <div className="w-full bg-brand-red/5 border border-brand-red/20 rounded-xl px-4 py-3.5 text-sm font-bold text-brand-red flex justify-between items-center">
              <span>
                {leagues.find(l => l.id === selectedLeagueId)?.name} - {getLeagueClassLabel(selectedLeagueId)}
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
                setPlayer1Id('');
                setPlayer2Id('');
                setFinalScore('');
                setErrorMsg(null);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase text-gray-400">1. Játékos *</label>
                <select
                  value={player1Id}
                  onChange={(e) => {
                    setPlayer1Id(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red rounded-xl px-4 py-3 text-sm cursor-pointer font-medium text-gray-800"
                  id="input-player-1"
                  required
                >
                  <option value="">-- Válassz játékost --</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase text-gray-400">2. Játékos *</label>
                <select
                  value={player2Id}
                  onChange={(e) => {
                    setPlayer2Id(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red rounded-xl px-4 py-3 text-sm cursor-pointer font-medium text-gray-800"
                  id="input-player-2"
                  required
                >
                  <option value="">-- Válassz játékost --</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {player1Id && player2Id && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-fadeIn" id="final-score-section">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
                    3. Végeredmény *
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-red bg-brand-red/10 px-2 py-1 rounded-md">
                    <Info className="w-3 h-3" />
                    Csak az 5 lejátszott szett kombinációja kell
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-mono uppercase text-gray-400">Párosítás</p>
                    <p className="font-bold text-gray-800 mt-1">{getPlayerName(player1Id)} vs {getPlayerName(player2Id)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono font-bold uppercase text-gray-400">Szettarány</label>
                    <select
                      value={finalScore}
                      onChange={(e) => {
                        setFinalScore(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-brand-red rounded-xl px-4 py-3 text-sm cursor-pointer font-medium text-gray-800"
                      id="input-final-score"
                      required
                    >
                      <option value="">-- Válassz végeredményt --</option>
                      {FINAL_SCORE_OPTIONS.map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-xs font-mono font-bold uppercase text-gray-500 tracking-wider">
                4. Beküldő neve
              </label>

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
