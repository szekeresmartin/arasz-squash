import React, { useState } from 'react';
import { Player, League, Match, Sponsor, SetScore, MatchScore } from '../types';
import { 
  Trophy, Users, Calendar, CheckCircle2, XCircle, Edit3, Save, Plus, 
  Trash2, Upload, FileText, AlertTriangle, ShieldCheck, Landmark, 
  Settings, ToggleLeft, ToggleRight, Sparkles, LayoutDashboard, PlusCircle
} from 'lucide-react';

interface AdminPanelProps {
  players: Player[];
  leagues: League[];
  matches: Match[];
  sponsors: Sponsor[];
  onAddPlayer: (p: Player) => void;
  onUpdatePlayer: (p: Player) => void;
  onDeletePlayer: (id: string) => void;
  onAddLeague: (l: League) => void;
  onUpdateLeague: (l: League) => void;
  onAddMatches: (m: Match[]) => void;
  onApproveMatch: (matchId: string, finalScore?: MatchScore) => void;
  onUpdateMatchSubmission: (matchId: string, finalScore: MatchScore) => void;
  onRejectMatch: (matchId: string) => void;
  onDeleteMatch: (matchId: string) => void;
  onUpdateSponsor: (s: Sponsor) => void;
  onAddSponsor: (s: Sponsor) => void;
}

export default function AdminPanel({
  players,
  leagues,
  matches,
  sponsors,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onAddLeague,
  onUpdateLeague,
  onAddMatches,
  onApproveMatch,
  onUpdateMatchSubmission,
  onRejectMatch,
  onDeleteMatch,
  onUpdateSponsor,
  onAddSponsor
}: AdminPanelProps) {
  
  // Belső navigációs fülek az adminon belül
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');

  const pendingSubmissions = matches.filter(m => m.status === 'Beküldve');
  const approvedMatches = matches.filter(m => m.status === 'Jóváhagyva');
  const activeLeaguesCount = leagues.filter(l => l.isActive).length;
  const playedMatchesCount = matches.filter(m => m.status === 'Jóváhagyva').length;
  const activePlayersCount = players.length;

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Ismeretlen';
  };

  // ----------------------------------------------------
  // SUB-TAB 1: DASHBOARD
  // ----------------------------------------------------
  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Üdvözlő banner */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-8 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display font-bold text-xl sm:text-2xl">Arasz-Öntöde Squashliga Központ</h3>
          <p className="text-xs text-gray-400 font-mono mt-1">Státusz: Rendszergazda bejelentkezve • Módosítások azonnal mentve</p>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-mono px-3 py-1 rounded-md uppercase font-bold tracking-wider">
          Aktív szinkron
        </span>
      </div>

      {/* Részletes statisztikák */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Lejátszott mérkőzések</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900 mt-1">{playedMatchesCount}</h4>
          </div>
          <div className="p-3 rounded-xl bg-brand-red/10 text-brand-red">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-xs relative">
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Jóváhagyásra vár</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900 mt-1">{pendingSubmissions.length}</h4>
          </div>
          <div className={`p-3 rounded-xl ${pendingSubmissions.length > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          {pendingSubmissions.length > 0 && (
            <span className="absolute top-3 right-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
            </span>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Aktív Ligacsoportok</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900 mt-1">{activeLeaguesCount}</h4>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Settings className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Bajnoki játékosok</p>
            <h4 className="text-3xl font-display font-extrabold text-gray-900 mt-1">{activePlayersCount} fő</h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gyors Műveletek */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs">
        <h4 className="font-display font-bold text-lg text-gray-900 mb-4">Gyors Műveletek Központja</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveAdminTab('jovahagyasok')}
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-brand-red rounded-xl hover:bg-gray-50/50 text-left transition-all"
            id="quick-action-jovahagyas"
          >
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Eredmények jóváhagyása</p>
              <p className="text-xs text-gray-450 mt-0.5">{pendingSubmissions.length} függő tétel vár megoldásra</p>
            </div>
          </button>

          <button
            onClick={() => setActiveAdminTab('import')}
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-brand-red rounded-xl hover:bg-gray-50/50 text-left transition-all"
            id="quick-action-import"
          >
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Sorsolás feltöltése</p>
              <p className="text-xs text-gray-450 mt-0.5">Ütemterv táblázat importálása (CSV)</p>
            </div>
          </button>

          <button
            onClick={() => setActiveAdminTab('jatekosok')}
            className="flex items-center gap-3 p-4 border border-gray-200 hover:border-brand-red rounded-xl hover:bg-gray-50/50 text-left transition-all"
            id="quick-action-addplayer"
          >
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Új játékos rögzítése</p>
              <p className="text-xs text-gray-450 mt-0.5">Fallabdázók adatbázisának szerkesztése</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SUB-TAB 2: LIGÁK KEZELÉSE
  // ----------------------------------------------------
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueSeason, setNewLeagueSeason] = useState('2026 Tavasz / Nyár');
  const [newLeagueRules, setNewLeagueRules] = useState('');
  const [selectedLeaguePlayers, setSelectedLeaguePlayers] = useState<string[]>([]);
  const [isAddingLeague, setIsAddingLeague] = useState(false);

  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;

    const newL: League = {
      id: `l_${Date.now()}`,
      name: newLeagueName,
      season: newLeagueSeason,
      rules: newLeagueRules || 'Standard squash liga szabályok érvényesek.',
      isActive: true,
      playerIds: selectedLeaguePlayers
    };

    onAddLeague(newL);
    setNewLeagueName('');
    setNewLeagueRules('');
    setSelectedLeaguePlayers([]);
    setIsAddingLeague(false);
  };

  const handleToggleLeaguePlayer = (pId: string) => {
    if (selectedLeaguePlayers.includes(pId)) {
      setSelectedLeaguePlayers(selectedLeaguePlayers.filter(id => id !== pId));
    } else {
      setSelectedLeaguePlayers([...selectedLeaguePlayers, pId]);
    }
  };

  const renderLeaguesTab = () => (
    <div className="space-y-6 animate-fadeIn" id="admin-leagues-view">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
        <div>
          <h3 className="font-display font-bold text-lg text-gray-900">Ligacsoportok</h3>
          <p className="text-xs text-gray-500">Módosítsd a bajnokságokat, rendelj hozzájuk játékosokat</p>
        </div>
        <button
          onClick={() => setIsAddingLeague(!isAddingLeague)}
          className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg hover:bg-brand-maroon transition-all flex items-center gap-1"
          id="btn-add-league"
        >
          <Plus className="w-4 h-4" />
          Új liga
        </button>
      </div>

      {isAddingLeague && (
        <form onSubmit={handleCreateLeague} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4 animate-fadeIn">
          <h4 className="font-display font-bold text-sm text-gray-800">Új Squash Bajnokság Létrehozása</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-600">Liga megnevezése *</span>
              <input
                type="text"
                placeholder="Pl. D Liga vagy Junior Liga"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-600">Szezon *</span>
              <input
                type="text"
                value={newLeagueSeason}
                onChange={(e) => setNewLeagueSeason(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-600">Egyedi szabályok / Leírás</span>
            <textarea
              placeholder="Ide írhatod a csoport speciális pontozási szabályait..."
              rows={2}
              value={newLeagueRules}
              onChange={(e) => setNewLeagueRules(e.target.value)}
              className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Játékos választó a ligába */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-650 block">Csoport játékosainak kijelölése:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-3 bg-white border rounded-lg">
              {players.map(p => {
                const checked = selectedLeaguePlayers.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-1 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleLeaguePlayer(p.id)}
                      className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingLeague(false)}
              className="px-4 py-2 text-xs font-mono font-bold text-gray-550 hover:bg-gray-100 rounded-lg"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-brand-maroon"
            >
              Liga Létrehozása
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leagues.map(l => (
          <div key={l.id} className="bg-white border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-display font-bold text-base text-gray-900">{l.name}</h4>
                <p className="text-xs text-gray-450 font-mono mt-0.5">{l.season}</p>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${l.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {l.isActive ? 'AKTÍV' : 'INAKTÍV'}
              </span>
            </div>

            {/* Játékosok száma */}
            <div className="text-xs space-y-1">
              <span className="text-gray-400 uppercase font-mono">Résztvevők száma:</span>
              <p className="font-semibold text-gray-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {l.playerIds.length} regisztrált játékos
              </p>
            </div>

            {/* Gyors módosító (Pl active/inactive váltó) */}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => onUpdateLeague({ ...l, isActive: !l.isActive })}
                className="text-[11px] font-mono font-bold text-gray-550 hover:text-brand-red flex items-center gap-1.5"
              >
                {l.isActive ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-500" /> DEAKTIVÁLÁS
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-400" /> AKTIVÁLÁS
                  </>
                )}
              </button>
              
              <span className="text-[10px] text-gray-400">ID: {l.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SUB-TAB 3: JÁTÉKOSOK KEZELÉSE
  // ----------------------------------------------------
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newP: Player = {
      id: `p_${Date.now()}`,
      name: newPlayerName,
      phone: newPlayerPhone || undefined,
      email: newPlayerEmail || undefined,
      joinDate: new Date().toISOString().split('T')[0]
    };

    onAddPlayer(newP);
    setNewPlayerName('');
    setNewPlayerPhone('');
    setNewPlayerEmail('');
    setIsAddingPlayer(false);
  };

  const handleStartEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone || '');
    setEditEmail(p.email || '');
  };

  const handleSavePlayerEdit = (pId: string) => {
    if (!editName.trim()) return;
    onUpdatePlayer({
      id: pId,
      name: editName,
      phone: editPhone || undefined,
      email: editEmail || undefined,
      joinDate: players.find(p => p.id === pId)?.joinDate || '2026-01-01'
    });
    setEditingPlayerId(null);
  };

  const renderPlayersTab = () => (
    <div className="space-y-6 animate-fadeIn" id="admin-players-view">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
        <div>
          <h3 className="font-display font-bold text-lg text-gray-900">Regisztrált játékosok</h3>
          <p className="text-xs text-gray-500">Módosítsd vagy adj hozzá új fallabdázókat</p>
        </div>
        <button
          onClick={() => setIsAddingPlayer(!isAddingPlayer)}
          className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg hover:bg-brand-maroon transition-all flex items-center gap-1"
          id="btn-add-player"
        >
          <Plus className="w-4 h-4" />
          Új játékos
        </button>
      </div>

      {isAddingPlayer && (
        <form onSubmit={handleCreatePlayer} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4 animate-fadeIn">
          <h4 className="font-display font-bold text-sm text-gray-800">Új Játékos Felvétele az Adatbázisba</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-650">Név *</span>
              <input
                type="text"
                placeholder="Pl. Kovács András"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-650">Telefonszám</span>
              <input
                type="text"
                placeholder="Pl. +36 30 555 4444"
                value={newPlayerPhone}
                onChange={(e) => setNewPlayerPhone(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-650">E-mail cím</span>
              <input
                type="email"
                placeholder="Pl. andras@freemail.hu"
                value={newPlayerEmail}
                onChange={(e) => setNewPlayerEmail(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingPlayer(false)}
              className="px-4 py-2 text-xs font-mono font-bold text-gray-550 hover:bg-gray-100 rounded-lg"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-brand-maroon"
            >
              Játékos mentése
            </button>
          </div>
        </form>
      )}

      {/* Játékos lista rács */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b bg-gray-50 text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Név</th>
                <th className="py-4 px-6">Kapcsolat</th>
                <th className="py-4 px-6 text-center">Megyei Tagság</th>
                <th className="py-4 px-6 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {players.map(p => {
                const isEditing = editingPlayerId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/20">
                    <td className="py-4 px-6 font-semibold">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border rounded px-2.5 py-1 text-sm bg-white font-semibold"
                        />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600 space-y-1">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Telefon"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="border rounded px-2 py-0.5 text-xs block w-full bg-white"
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="border rounded px-2 py-0.5 text-xs block w-full bg-white"
                          />
                        </div>
                      ) : (
                        <div className="text-xs font-mono">
                          <p>{p.phone || 'Nincs tel.'}</p>
                          <p className="text-gray-400">{p.email || 'Nincs e-mail'}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-xs text-gray-500">
                      {p.joinDate}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSavePlayerEdit(p.id)}
                            className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded"
                            title="Mentés"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPlayerId(null)}
                            className="text-gray-500 hover:text-gray-650 p-1 bg-gray-50 rounded"
                          >
                            Mégse
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStartEditPlayer(p)}
                            className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded"
                            title="Szerkesztés"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Biztosan törlöd ${p.name} játékost az adatbázisból? Ez törli a ligás bejegyzéseit is.`)) {
                                onDeletePlayer(p.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded animate-colors"
                            title="Törlés"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SUB-TAB 4: SORSOLÁS IMPORT CSV-BŐL (IMPORTANT COMPONENT)
  // ----------------------------------------------------
  const [csvContent, setCsvContent] = useState<string>('');
  const [targetImportLeagueId, setTargetImportLeagueId] = useState<string>('');
  
  interface ParsedRow {
    lineNum: number;
    round: number;
    player1Name: string;
    player2Name: string;
    date: string;
    court: string;
    errors: string[];
    isValid: boolean;
  }
  
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  // Minta CSV betöltése azonnali tesztelhetőségért
  const loadSampleCSV = () => {
    const sample = `Forduló,Hazai Játékos,Vendég Játékos,Dátum,Pálya
3,Kovács Gábor,Nagy László,2026-07-10,1-es pálya
3,Tóth Péter,Szabó Zoltán,2026-07-12,2-es pálya
4,NemLétező Játékos,Kovács Gábor,2026-07-20,1-es pálya
4,Tóth Péter,Nagy László,hibas-datum,3-as pálya`;
    setCsvContent(sample);
    parseCSVText(sample);
  };

  const parseCSVText = (text: string) => {
    setImportSuccess(false);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const rows: ParsedRow[] = [];
    
    // Feldolgozás a fejrész után (második sortól)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.trim());
      
      const errors: string[] = [];
      const round = parseInt(cols[0], 10);
      const player1Name = cols[1] || '';
      const player2Name = cols[2] || '';
      const date = cols[3] || '';
      const court = cols[4] || '1-es pálya';

      // 1. Kör validálás
      if (isNaN(round) || round <= 0) {
        errors.push('A forduló sorszáma érvénytelen (csak pozitív egész szám).');
      }

      // 2. Játékos 1 létezik-e az adatbázisban
      const p1 = players.find(p => p.name.toLowerCase() === player1Name.toLowerCase());
      if (!p1 && player1Name) {
        errors.push(`'${player1Name}' nevű játékos nincs regisztrálva az adatbázisban!`);
      } else if (!player1Name) {
        errors.push('Hazai játékos megadása kötelező.');
      }

      // 3. Játékos 2 létezik-e
      const p2 = players.find(p => p.name.toLowerCase() === player2Name.toLowerCase());
      if (!p2 && player2Name) {
        errors.push(`'${player2Name}' nevű játékos nincs regisztrálva az adatbázisban!`);
      } else if (!player2Name) {
        errors.push('Vendég játékos megadása kötelező.');
      }

      // Onanizmus ellenőrzés
      if (player1Name && player2Name && player1Name.toLowerCase() === player2Name.toLowerCase()) {
        errors.push('A játékos nem játszhat önmaga ellen.');
      }

      // 4. Dátum formátum ellenőrzése (YYYY-MM-DD minta)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        errors.push(`Hibás dátum formátum: '${date}'. Elvárt: ÉÉÉÉ-HH-NN (pl. 2026-07-25)`);
      }

      rows.push({
        lineNum: i + 1,
        round: isNaN(round) ? 0 : round,
        player1Name,
        player2Name,
        date,
        court,
        errors,
        isValid: errors.length === 0
      });
    }

    setParsedRows(rows);
  };

  const executeScheduleImport = () => {
    if (!targetImportLeagueId) {
      alert('Kérjük, válaszd ki a cél bajnokságot az importáláshoz!');
      return;
    }

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('Nincs importálható érvényes sor a táblázatban.');
      return;
    }

    // Átalakítjuk a mérkőzéseket Match entitásokká
    const matchesToImport: Match[] = validRows.map((r, idx) => {
      const p1Id = players.find(p => p.name.toLowerCase() === r.player1Name.toLowerCase())!.id;
      const p2Id = players.find(p => p.name.toLowerCase() === r.player2Name.toLowerCase())!.id;
      
      return {
        id: `m_imp_${Date.now()}_${idx}`,
        leagueId: targetImportLeagueId,
        round: r.round,
        player1Id: p1Id,
        player2Id: p2Id,
        date: r.date,
        court: r.court,
        status: 'Tervezett'
      };
    });

    onAddMatches(matchesToImport);
    setImportSuccess(true);
    setCsvContent('');
    setParsedRows([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
        parseCSVText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
        parseCSVText(text);
      };
      reader.readAsText(file);
    }
  };

  const renderImportTab = () => {
    const validCount = parsedRows.filter(r => r.isValid).length;
    const invalidCount = parsedRows.filter(r => !r.isValid).length;

    return (
      <div className="space-y-6 animate-fadeIn" id="admin-import-view">
        <div className="bg-white p-5 rounded-xl border">
          <h3 className="font-display font-bold text-lg text-gray-900">Sorsolás feltöltése táblázatból</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tölts fel előre összeállított meccssorsolást. Az importáló segédeszköz jelzi az érvénytelen sorokat, és csak a hibátlan játékospárokat rögzíti.
          </p>
        </div>

        {importSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Sikeres importálás!</p>
              <p className="text-xs text-emerald-700 mt-1">A valid ütemezett mérkőzések rögzítésre kerültek a választott ligában 'Tervezett' státusszal.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Beviteli és Drag-Drop zóna (Left - 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Célliga */}
            <div className="bg-white p-4 border rounded-xl space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase text-gray-400">1. Cél Bajnokság Kiválasztása *</span>
              <select
                value={targetImportLeagueId}
                onChange={(e) => setTargetImportLeagueId(e.target.value)}
                className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm font-semibold"
                required
              >
                <option value="">-- Cél bajnokság --</option>
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.season})</option>
                ))}
              </select>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragOver ? 'border-brand-red bg-brand-red/5' : 'border-gray-300 bg-white'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Sorsolási táblázat feltöltése</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-mono">Elfogadott: CSV / XLSX (szimulált)</p>
              
              <div className="mt-4 flex justify-center">
                <label className="bg-gray-100 hover:bg-gray-150 border text-gray-700 font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs">
                  Tallózás...
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Paste box */}
            <div className="bg-white p-5 border rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold uppercase text-gray-400">Vagy másold be a CSV-t kézzel:</span>
                <button
                  type="button"
                  onClick={loadSampleCSV}
                  className="text-[10px] font-mono font-bold text-brand-red underline hover:text-brand-maroon focus:outline-none"
                >
                  Minta CSV Betöltése
                </button>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  parseCSVText(e.target.value);
                }}
                placeholder="Forduló,Hazai Játékos,Vendég Játékos,Dátum,Pálya&#10;1,Kovács Gábor,Tóth Péter,2026-07-01,1-es pálya"
                rows={6}
                className="w-full bg-gray-50 border rounded-lg p-3 text-xs font-mono"
              />
            </div>

          </div>

          {/* Vizsgálati Előnézet táblázat (Right - 7 cols) */}
          <div className="lg:col-span-7 bg-white border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-mono font-bold uppercase text-gray-400">2. Import Előnézet & Vizsgálat</span>
              <div className="flex gap-2 text-[10px] font-mono font-bold uppercase">
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded">Ok: {validCount} sor</span>
                <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded">Hibás: {invalidCount} sor</span>
              </div>
            </div>

            {parsedRows.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm italic font-sans flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-gray-300" />
                <span>Nincs feldolgozott adat. Tölts fel egy fájlt vagy használd a szuper Minta gombot!</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-400 font-mono font-bold uppercase">
                        <th className="p-3 text-center">Sor</th>
                        <th className="p-3">Párosítás</th>
                        <th className="p-3">Dátum</th>
                        <th className="p-3">Státusz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className={r.isValid ? 'bg-white' : 'bg-brand-red/5'}>
                          <td className="p-3 text-center font-mono text-gray-400">{r.lineNum}</td>
                          <td className="p-3 font-semibold text-gray-800">
                            {r.player1Name || '?'} vs {r.player2Name || '?'}
                            {!r.isValid && (
                              <div className="text-[10px] text-brand-red font-normal mt-1 space-y-0.5">
                                {r.errors.map((err, errIdx) => (
                                  <p key={errIdx} className="flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-brand-red shrink-0" />
                                    {err}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-gray-500">{r.date}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              r.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {r.isValid ? 'KÉSZ' : 'AHIBA'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <button
                    onClick={executeScheduleImport}
                    disabled={!targetImportLeagueId || validCount === 0}
                    className="w-full bg-brand-red disabled:bg-gray-200 disabled:text-gray-400 disabled:border-transparent text-white font-mono text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Hivatalos Importálás ({validCount} valid sor)
                  </button>
                  {!targetImportLeagueId && (
                    <p className="text-center text-[11px] text-brand-red font-mono mt-2">
                      * Az importáláshoz először válassz ki egy cél bajnokságot!
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 5: JÓVÁHAGYÁSOK (PENDING APPROVAL DIRECTORY)
  // ----------------------------------------------------
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editP1Sets, setEditP1Sets] = useState<number>(3);
  const [editP2Sets, setEditP2Sets] = useState<number>(0);
  
  // Szettenkénti részeredmények szerkesztése
  const [editS1P1, setEditS1P1] = useState<string>('');
  const [editS1P2, setEditS1P2] = useState<string>('');
  const [editS2P1, setEditS2P1] = useState<string>('');
  const [editS2P2, setEditS2P2] = useState<string>('');
  const [editS3P1, setEditS3P1] = useState<string>('');
  const [editS3P2, setEditS3P2] = useState<string>('');
  const [editS4P1, setEditS4P1] = useState<string>('');
  const [editS4P2, setEditS4P2] = useState<string>('');
  const [editS5P1, setEditS5P1] = useState<string>('');
  const [editS5P2, setEditS5P2] = useState<string>('');

  const handleStartEditSubmission = (match: Match) => {
    setEditingSubId(match.id);
    const score = match.submittedScore;
    if (score) {
      setEditP1Sets(score.player1Sets);
      setEditP2Sets(score.player2Sets);
      // Betöltjük a szetteket
      setEditS1P1(score.sets[0]?.player1.toString() || '');
      setEditS1P2(score.sets[0]?.player2.toString() || '');
      setEditS2P1(score.sets[1]?.player1.toString() || '');
      setEditS2P2(score.sets[1]?.player2.toString() || '');
      setEditS3P1(score.sets[2]?.player1.toString() || '');
      setEditS3P2(score.sets[2]?.player2.toString() || '');
      setEditS4P1(score.sets[3]?.player1.toString() || '');
      setEditS4P2(score.sets[3]?.player2.toString() || '');
      setEditS5P1(score.sets[4]?.player1.toString() || '');
      setEditS5P2(score.sets[4]?.player2.toString() || '');
    }
  };

  const compileEditedScore = () => {
    // Összeállítjuk a szettek tömbjét
    const sets: SetScore[] = [];
    const pushSet = (p1Str: string, p2Str: string) => {
      const p1 = parseInt(p1Str, 10);
      const p2 = parseInt(p2Str, 10);
      if (!isNaN(p1) && !isNaN(p2)) {
        sets.push({ player1: p1, player2: p2 });
      }
    };

    pushSet(editS1P1, editS1P2);
    pushSet(editS2P1, editS2P2);
    pushSet(editS3P1, editS3P2);
    pushSet(editS4P1, editS4P2);
    pushSet(editS5P1, editS5P2);

    if (sets.length < 3) {
      alert('Hiba: Legalább 3 szett pontszámainak rögzítése kötelező!');
      return null;
    }

    return {
      player1Sets: editP1Sets,
      player2Sets: editP2Sets,
      sets
    };
  };

  const handleSaveEdit = (matchId: string) => {
    const compiledScore = compileEditedScore();
    if (!compiledScore) {
      return;
    }

    onUpdateMatchSubmission(matchId, compiledScore);
    setEditingSubId(null);
  };

  const handleSaveAndApproveEdit = (matchId: string) => {
    const compiledScore = compileEditedScore();
    if (!compiledScore) {
      return;
    }

    onApproveMatch(matchId, compiledScore);
    setEditingSubId(null);
  };

  const renderApprovalTab = () => (
    <div className="space-y-6 animate-fadeIn font-sans" id="admin-approvals-view">
      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-display font-bold text-lg text-gray-900">Beküldött eredmények ellenőrzése</h3>
        <p className="text-xs text-gray-500 mt-1">
          A publikusan beküldött mérkőzések és a már jóváhagyott eredmények listája. Jóváhagyás után a tabellák azonnal frissülnek.
        </p>
      </div>

      <div className="space-y-6">
        {pendingSubmissions.length === 0 ? (
          <div className="text-center bg-white border rounded-xl py-16 text-gray-400 text-sm font-sans italic flex flex-col items-center justify-center gap-3">
            <ShieldCheck className="w-12 h-12 text-emerald-500 opacity-60" />
            <div>
              <p className="font-bold text-gray-805 not-italic">Minden eredmény rendezve!</p>
              <p className="text-xs text-gray-400 mt-1">Nincsen függő jóváhagyásra váró mérkőzés.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((match) => {
              const leagueName = leagues.find(l => l.id === match.leagueId)?.name || 'Liga';
              const score = match.submittedScore;
              const isEditing = editingSubId === match.id;

              return (
                <div key={match.id} className="bg-white border rounded-xl overflow-hidden shadow-xs border-amber-200">
                  <div className="bg-amber-50/50 border-b px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-brand-red text-white px-2 py-0.5 rounded-sm">
                        {leagueName}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-800">FÜGGŐ JÓVÁHAGYÁS</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      Beérkezett: {match.submittedAt ? new Date(match.submittedAt).toLocaleString('hu-HU') : 'ismeretlen időpont'}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 bg-gray-50 p-4 border rounded-xl animate-fadeIn">
                        <p className="text-xs font-mono font-bold text-amber-700 uppercase">Eredmény javítása / szerkesztése</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 font-semibold">{getPlayerName(match.player1Id)} szettjei:</span>
                            <input type="number" min="0" max="3" value={editP1Sets} onChange={(e) => setEditP1Sets(parseInt(e.target.value, 10) || 0)} className="bg-white border rounded px-3 py-1.5 text-xs font-mono font-bold w-full" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500 font-semibold">{getPlayerName(match.player2Id)} szettjei:</span>
                            <input type="number" min="0" max="3" value={editP2Sets} onChange={(e) => setEditP2Sets(parseInt(e.target.value, 10) || 0)} className="bg-white border rounded px-3 py-1.5 text-xs font-mono font-bold w-full" />
                          </div>
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <span className="text-xs font-semibold text-gray-600 block mb-1">Szettenkénti pontok:</span>
                          <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono text-gray-400">
                            <span>1. szett</span><span>2. szett</span><span>3. szett</span><span>4. szett</span><span>5. szett</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="flex gap-1">
                              <input type="number" placeholder="H" value={editS1P1} onChange={e => setEditS1P1(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                              <input type="number" placeholder="V" value={editS1P2} onChange={e => setEditS1P2(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                            </div>
                            <div className="flex gap-1">
                              <input type="number" placeholder="H" value={editS2P1} onChange={e => setEditS2P1(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                              <input type="number" placeholder="V" value={editS2P2} onChange={e => setEditS2P2(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                            </div>
                            <div className="flex gap-1">
                              <input type="number" placeholder="H" value={editS3P1} onChange={e => setEditS3P1(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                              <input type="number" placeholder="V" value={editS3P2} onChange={e => setEditS3P2(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                            </div>
                            <div className="flex gap-1">
                              <input type="number" placeholder="H" value={editS4P1} onChange={e => setEditS4P1(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                              <input type="number" placeholder="V" value={editS4P2} onChange={e => setEditS4P2(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                            </div>
                            <div className="flex gap-1">
                              <input type="number" placeholder="H" value={editS5P1} onChange={e => setEditS5P1(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                              <input type="number" placeholder="V" value={editS5P2} onChange={e => setEditS5P2(e.target.value)} className="w-1/2 text-center p-1 bg-white border text-xs" />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setEditingSubId(null)} className="px-4 py-2 text-xs font-mono font-bold bg-white hover:bg-gray-100 rounded-lg text-gray-550 border">
                            Szerkesztés mégse
                          </button>
                          <button type="button" onClick={() => handleSaveEdit(match.id)} className="px-4 py-2 text-xs font-mono font-bold bg-gray-900 hover:bg-black text-white rounded-lg uppercase">
                            Mentés
                          </button>
                          <button type="button" onClick={() => handleSaveAndApproveEdit(match.id)} className="px-4 py-2 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg uppercase">
                            Mentés és Jóváhagyás
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-4">
                            <div className="space-y-1">
                              <p className="text-base font-bold text-gray-900">{getPlayerName(match.player1Id)}</p>
                              <p className="text-base font-bold text-gray-900">{getPlayerName(match.player2Id)}</p>
                            </div>
                            <div className="bg-brand-red text-white text-lg font-mono font-black py-2 px-4 rounded-xl">
                              {score ? `${score.player1Sets} : ${score.player2Sets}` : '?:?'}
                            </div>
                          </div>

                          {score && (
                            <div className="flex gap-1.5 pt-1">
                              {score.sets.map((set, idx) => (
                                <div key={idx} className="bg-gray-50 border text-[11px] font-mono h-8 w-11 flex flex-col justify-center items-center rounded-sm">
                                  <span className={set.player1 > set.player2 ? 'text-gray-950 font-bold' : 'text-gray-400'}>{set.player1}</span>
                                  <span className={set.player2 > set.player1 ? 'text-gray-950 font-bold' : 'text-gray-400'}>{set.player2}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border-t pt-3 mt-3 text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <p>
                              <span className="font-semibold text-gray-600">Beküldő:</span> {match.submitterName || 'Ismeretlen'}
                              {match.submitterContact && <span className="text-gray-400 block sm:inline sm:pl-2">({match.submitterContact})</span>}
                            </p>
                            {match.comment && (
                              <p>
                                <span className="font-semibold text-gray-600">Megjegyzés:</span> "{match.comment}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-row md:flex-col justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <button onClick={() => onApproveMatch(match.id)} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider shadow-sm cursor-pointer" id={`approve-${match.id}`}>
                            <CheckCircle2 className="w-4 h-4" />
                            Jóváhagyás
                          </button>
                          <button onClick={() => handleStartEditSubmission(match)} className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider border cursor-pointer border-gray-200">
                            <Edit3 className="w-4 h-4" />
                            Szerkesztés
                          </button>
                          <button onClick={() => { if (window.confirm('Biztosan elutasítod ezt a bejelentést?')) { onRejectMatch(match.id); } }} className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider border border-rose-100 cursor-pointer" id={`reject-${match.id}`}>
                            <XCircle className="w-4 h-4" />
                            Elutasítás
                          </button>
                          <button onClick={() => { if (window.confirm('Biztosan törlöd ezt az eredményt?')) { onDeleteMatch(match.id); } }} className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider shadow-sm cursor-pointer" id={`delete-${match.id}`}>
                            <Trash2 className="w-4 h-4" />
                            Törlés
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {approvedMatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-lg text-gray-900">Jóváhagyott eredmények</h4>
              <span className="text-xs font-mono text-gray-400">{approvedMatches.length} db</span>
            </div>
            {approvedMatches.map((match) => {
              const leagueName = leagues.find(l => l.id === match.leagueId)?.name || 'Liga';
              const score = match.submittedScore;
              return (
                <div key={match.id} className="bg-white border rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-gray-50 border-b px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-brand-red text-white px-2 py-0.5 rounded-sm">{leagueName}</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">JÓVÁHAGYVA</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      Beérkezett: {match.submittedAt ? new Date(match.submittedAt).toLocaleString('hu-HU') : 'ismeretlen időpont'}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                          <div className="space-y-1">
                            <p className="text-base font-bold text-gray-900">{getPlayerName(match.player1Id)}</p>
                            <p className="text-base font-bold text-gray-900">{getPlayerName(match.player2Id)}</p>
                          </div>
                          <div className="bg-brand-red text-white text-lg font-mono font-black py-2 px-4 rounded-xl">
                            {score ? `${score.player1Sets} : ${score.player2Sets}` : '?:?'}
                          </div>
                        </div>
                        <div className="border-t pt-3 mt-3 text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p>
                            <span className="font-semibold text-gray-600">Beküldő:</span> {match.submitterName || 'Ismeretlen'}
                          </p>
                          {match.comment && (
                            <p>
                              <span className="font-semibold text-gray-600">Megjegyzés:</span> "{match.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 md:pt-0">
                        <button
                          onClick={() => {
                            if (window.confirm('Biztosan törlöd ezt az eredményt? Ez visszavonja a hivatalos állapotot is.')) {
                              onDeleteMatch(match.id);
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider shadow-sm cursor-pointer"
                          id={`delete-approved-${match.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Törlés
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SUB-TAB 6: SZPONZOROK KEZELÉSE 
  // ----------------------------------------------------
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorUrl, setNewSponsorUrl] = useState('');
  const [newSponsorColor, setNewSponsorColor] = useState('from-blue-600 to-cyan-500');
  const [isAddingSponsor, setIsAddingSponsor] = useState(false);

  const handleCreateSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim()) return;

    const newS: Sponsor = {
      id: `s_${Date.now()}`,
      name: newSponsorName,
      logoText: newSponsorName,
      websiteUrl: newSponsorUrl || undefined,
      colorHex: newSponsorColor,
      isActive: true
    };

    onAddSponsor(newS);
    setNewSponsorName('');
    setNewSponsorUrl('');
    setIsAddingSponsor(false);
  };

  const renderSponsorsTab = () => (
    <div className="space-y-6 animate-fadeIn" id="admin-sponsors-view">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
        <div>
          <h3 className="font-display font-bold text-lg text-gray-900">Szponzorok & Támogatók</h3>
          <p className="text-xs text-gray-500">Módosítsd a szponzor sávban megjelenő céges partnereket</p>
        </div>
        <button
          onClick={() => setIsAddingSponsor(!isAddingSponsor)}
          className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg hover:bg-brand-maroon transition-all flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Szponzor hozzáadása
        </button>
      </div>

      {isAddingSponsor && (
        <form onSubmit={handleCreateSponsor} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4 animate-fadeIn">
          <h4 className="font-display font-bold text-sm text-gray-800">Új Támogató rögzítése</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-655">Partner neve *</span>
              <input
                type="text"
                placeholder="Pl. Kovács Kft."
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-655">Weboldal URL</span>
              <input
                type="url"
                placeholder="Pl. https://kovacskft.hu"
                value={newSponsorUrl}
                onChange={(e) => setNewSponsorUrl(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-655">Arculati Gradiens Szín</span>
              <select
                value={newSponsorColor}
                onChange={(e) => setNewSponsorColor(e.target.value)}
                className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
              >
                <option value="from-blue-600 to-cyan-500">Gradiens Kék</option>
                <option value="from-emerald-600 to-teal-500">Gradiens Zöld</option>
                <option value="from-pink-500 to-rose-400">Gradiens Pink</option>
                <option value="from-amber-500 to-orange-600">Gradiens Narancs</option>
                <option value="from-red-600 to-orange-500">Gradiens Piros</option>
                <option value="from-slate-700 to-gray-500">Gradiens Szürke</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSponsor(false)}
              className="px-4 py-2 text-xs font-mono font-bold text-gray-550 hover:bg-gray-100 rounded-lg"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="bg-brand-red text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-brand-maroon"
            >
              Szponzor mentése
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sponsors.map(sponsor => (
          <div key={sponsor.id} className="bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className={`h-1.5 -mx-5 -mt-5 rounded-t-xl bg-gradient-to-r ${sponsor.colorHex}`}></div>
            
            <div className="pt-4">
              <h4 className="font-display font-extrabold text-gray-800 uppercase tracking-wider">{sponsor.name}</h4>
              <p className="text-xs text-gray-400 mt-1 truncate">{sponsor.websiteUrl || 'Nincs beadott URL'}</p>
            </div>

            <div className="flex justify-between items-center pt-5 mt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onUpdateSponsor({ ...sponsor, isActive: !sponsor.isActive })}
                className="text-xs font-mono font-bold text-gray-550 flex items-center gap-1.5"
                id={`sponsor-toggle-${sponsor.id}`}
              >
                {sponsor.isActive ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-500" /> AKTÍV JELENLÉT
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-gray-400" /> REJTETT
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SUB-TAB 7: SZABÁLYOK / BEÁLLÍTÁSOK
  // ----------------------------------------------------
  const [selectedSpecRulesLeagueId, setSelectedSpecRulesLeagueId] = useState('');
  const [leagueRulesText, setLeagueRulesText] = useState('');
  const [saveRulesSuccess, setSaveRulesSuccess] = useState(false);

  const handleSelectRulesLeague = (leagueId: string) => {
    setSelectedSpecRulesLeagueId(leagueId);
    setSaveRulesSuccess(false);
    const l = leagues.find(x => x.id === leagueId);
    if (l) {
      setLeagueRulesText(l.rules);
    } else {
      setLeagueRulesText('');
    }
  };

  const handleSaveLeagueRulesText = () => {
    const l = leagues.find(x => x.id === selectedSpecRulesLeagueId);
    if (l) {
      onUpdateLeague({
        ...l,
        rules: leagueRulesText
      });
      setSaveRulesSuccess(true);
    }
  };

  const renderConfigTab = () => (
    <div className="space-y-6 animate-fadeIn font-sans" id="admin-config-view">
      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-display font-bold text-lg text-gray-900">Bajnoki Szabályzatok Szerkesztése</h3>
        <p className="text-xs text-gray-500 mt-1">Szerkeszd a különböző ligacsoportok (A Liga, B Liga, Senior) egyedi részszabályzatait.</p>
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-gray-400">Válassz szerkeszteni kívánt ligát:</span>
          <select
            value={selectedSpecRulesLeagueId}
            onChange={(e) => handleSelectRulesLeague(e.target.value)}
            className="w-full bg-gray-50 border rounded-lg px-4 py-2 text-sm cursor-pointer font-semibold text-gray-805"
          >
            <option value="">-- Kérjük, válassz ligát --</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.season})</option>
            ))}
          </select>
        </div>

        {selectedSpecRulesLeagueId && (
          <div className="space-y-4 pt-2 animate-fadeIn">
            {saveRulesSuccess && (
              <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                A szabályzat szövege sikeresen frissítve lett! Megtekinthető a liga részletezőnél.
              </div>
            )}
            
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-gray-500">Szabályzat szövegezése:</span>
              <textarea
                value={leagueRulesText}
                onChange={e => setLeagueRulesText(e.target.value)}
                rows={6}
                className="w-full bg-gray-50 border rounded-lg p-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveLeagueRulesText}
              className="bg-brand-red hover:bg-brand-maroon text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg"
            >
              Változtatások Mentése
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      
      {/* Bal oldali admin kategória menü (Left - 3 cols) */}
      <div className="lg:col-span-3 bg-white border border-gray-150 rounded-2xl p-4 shadow-xs h-fit space-y-2" id="admin-navigation-rail">
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <div className="bg-brand-red text-white p-1.5 rounded-lg">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-sm text-gray-800 uppercase tracking-wider block">Admin Vezérlő</span>
        </div>

        {[
          { id: 'dashboard', name: 'Dashboard', count: 0 },
          { id: 'jovahagyasok', name: 'Eredmény-jóváhagyás', count: pendingSubmissions.length },
          { id: 'ligak', name: 'Ligacsoportok', count: 0 },
          { id: 'jatekosok', name: 'Játékosok', count: 0 },
          { id: 'import', name: 'Sorsolás feltöltés', count: 0 },
          { id: 'sponsors', name: 'Szponzorok', count: 0 },
          { id: 'config', name: 'Szabályzatok', count: 0 }
        ].map((rail) => {
          const isSelected = activeAdminTab === rail.id;
          return (
            <button
              key={rail.id}
              onClick={() => setActiveAdminTab(rail.id)}
              className={`w-full flex justify-between items-center px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-brand-red/10 text-brand-red font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              id={`admin-rail-${rail.id}`}
            >
              <span>{rail.name}</span>
              {rail.count > 0 && (
                <span className="bg-brand-red text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {rail.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Jobb oldali munkafelület (Right - 9 cols) */}
      <div className="lg:col-span-9">
        {activeAdminTab === 'dashboard' && renderDashboard()}
        {activeAdminTab === 'ligak' && renderLeaguesTab()}
        {activeAdminTab === 'jatekosok' && renderPlayersTab()}
        {activeAdminTab === 'import' && renderImportTab()}
        {activeAdminTab === 'jovahagyasok' && renderApprovalTab()}
        {activeAdminTab === 'sponsors' && renderSponsorsTab()}
        {activeAdminTab === 'config' && renderConfigTab()}
      </div>

    </div>
  );
}
