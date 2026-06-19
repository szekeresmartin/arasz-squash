import { Player, League, Match, Sponsor, Standing } from './types';

// Alapértelmezett Játékosok (Seeded Players)
export const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: 'Kovács Gábor', phone: '+36 30 123 4567', email: 'kovacs.gabor@gmail.com', joinDate: '2025-01-10' },
  { id: 'p2', name: 'Tóth Péter', phone: '+36 20 987 6543', email: 'toth.peter@yahoo.com', joinDate: '2025-01-12' },
  { id: 'p3', name: 'Szabó Zoltán', phone: '+36 70 555 4321', email: 'szabo.zoltan@freemail.hu', joinDate: '2025-02-15' },
  { id: 'p4', name: 'Nagy László', phone: '+36 30 444 8888', email: 'nagy.laszlo@hotmail.com', joinDate: '2025-02-20' },
  { id: 'p5', name: 'Kiss Beáta', phone: '+36 30 333 1122', email: 'kiss.bea@squash.hu', joinDate: '2025-03-01' },
  { id: 'p6', name: 'Balogh András', phone: '+36 20 222 7777', email: 'balogh.andras@gmail.com', joinDate: '2025-03-05' },
  { id: 'p7', name: 'Horváth Tamás', phone: '+36 70 111 2233', email: 'horvath.tamas@szolgaltato.hu', joinDate: '2025-03-10' },
  { id: 'p8', name: 'Molnár Gergő', phone: '+36 30 888 9999', email: 'molnar.gergo@arasz.hu', joinDate: '2025-03-15' },
  { id: 'p9', name: 'Varga Dániel', phone: '+36 30 777 6666', email: 'varga.daniel@ontode.hu', joinDate: '2025-03-18' },
  { id: 'p10', name: 'Németh Zoltán', phone: '+36 20 666 5555', email: 'nemeth.zoltan@gmail.com', joinDate: '2025-03-20' },
  { id: 'p11', name: 'Kocsis Dóra', phone: '+36 30 555 1212', email: 'kocsis.dora@gmail.com', joinDate: '2025-03-22' },
  { id: 'p12', name: 'Sipos Júlia', phone: '+36 20 444 3434', email: 'sipos.julia@index.hu', joinDate: '2025-03-25' }
];

// Alapértelmezett Ligák (Seeded Leagues)
export const DEFAULT_LEAGUES: League[] = [
  {
    id: 'l1',
    name: 'A Liga',
    season: '2026 Tavasz / Nyár',
    rules: 'Minden mérkőzés 3 nyert szettig tart. Szigorú PAR-11 pontozás (minden labdamenet pontot ér). Hibás adogatás esetén a fogadónak jár a pont. A pályán védőszemüveg használata javasolt, junioroknak kötelező!',
    isActive: true,
    playerIds: ['p1', 'p2', 'p3', 'p4']
  },
  {
    id: 'l2',
    name: 'B Liga',
    season: '2026 Tavasz / Nyár',
    rules: 'Minden mérkőzés 3 nyert szettig tart. PAR-11 szabályok érvényesek. Az eredményeket a lejátszást követő 24 órában be kell küldeni a weboldalon keresztül.',
    isActive: true,
    playerIds: ['p5', 'p6', 'p7', 'p8']
  },
  {
    id: 'l3',
    name: 'C Liga',
    season: '2026 Tavasz / Nyár',
    rules: 'Kezdő és haladó szint. 3 nyert szettig játszanak. Kiváló lehetőség a versenyzés alapjainak elsajátítására barátságos légkörben.',
    isActive: true,
    playerIds: ['p9', 'p10']
  },
  {
    id: 'l4',
    name: 'D Liga',
    season: '2026 Tavasz / Nyár',
    rules: 'Mérkőzések 3 nyert szettig tartanak PAR-11 pontrendszerben. Ideális tapasztalt szabadidős játékosoknak a folyamatos fejlődésre és sportszerű csatákra.',
    isActive: true,
    playerIds: ['p1', 'p3', 'p7', 'p9']
  },
  {
    id: 'l5',
    name: 'E Liga',
    season: '2026 Tavasz / Nyár',
    rules: 'Különösen javasolt kezdőknek és a fallabda alapjaival most ismerkedőknek. Barátságos, heti rendszerességű fordulók családias légkörben.',
    isActive: true,
    playerIds: ['p5', 'p11', 'p12']
  }
];

export const LEAGUE_ROUTE_META = [
  { id: 'l1', slug: 'a-liga', classLabel: '1. osztály' },
  { id: 'l2', slug: 'b-liga', classLabel: '2. osztály' },
  { id: 'l3', slug: 'c-liga', classLabel: '3. osztály' },
  { id: 'l4', slug: 'd-liga', classLabel: '4. osztály' },
  { id: 'l5', slug: 'e-liga', classLabel: '5. osztály' },
] as const;

export function getLeagueRouteMeta(leagueId: string) {
  return LEAGUE_ROUTE_META.find(entry => entry.id === leagueId);
}

export function getLeagueBySlug(slug: string) {
  return LEAGUE_ROUTE_META.find(entry => entry.slug === slug);
}

export function getLeagueClassLabel(leagueId: string) {
  return getLeagueRouteMeta(leagueId)?.classLabel || 'Bajnokság';
}

export function getLeagueSlug(leagueId: string) {
  return getLeagueRouteMeta(leagueId)?.slug || leagueId;
}

// Alapértelmezett Mérkőzések (Seeded Matches in multiple states)
export const DEFAULT_MATCHES: Match[] = [
  // A Liga - Forduló 1
  {
    id: 'm1_1',
    leagueId: 'l1',
    round: 1,
    player1Id: 'p1',
    player2Id: 'p2',
    date: '2026-05-15',
    court: '1-es pálya',
    status: 'Jóváhagyva',
    submittedScore: {
      player1Sets: 3,
      player2Sets: 1,
      sets: [
        { player1: 11, player2: 9 },
        { player1: 11, player2: 7 },
        { player1: 8, player2: 11 },
        { player1: 11, player2: 6 }
      ]
    },
    submitterName: 'Kovács Gábor',
    submitterContact: 'kovacs.gabor@gmail.com',
    comment: 'Remek, pörgős meccs volt, elfáradtunk a végére.',
    submittedAt: '2026-05-15T20:30:00Z'
  },
  {
    id: 'm1_2',
    leagueId: 'l1',
    round: 1,
    player1Id: 'p3',
    player2Id: 'p4',
    date: '2026-05-16',
    court: '2-es pálya',
    status: 'Jóváhagyva',
    submittedScore: {
      player1Sets: 0,
      player2Sets: 3,
      sets: [
        { player1: 5, player2: 11 },
        { player1: 9, player2: 11 },
        { player1: 8, player2: 11 }
      ]
    },
    submitterName: 'Nagy László',
    submittedAt: '2026-05-16T18:15:00Z'
  },
  // A Liga - Forduló 2
  {
    id: 'm1_3',
    leagueId: 'l1',
    round: 2,
    player1Id: 'p1',
    player2Id: 'p3',
    date: '2026-06-01',
    court: '1-es pálya',
    status: 'Jóváhagyva',
    submittedScore: {
      player1Sets: 3,
      player2Sets: 2,
      sets: [
        { player1: 11, player2: 8 },
        { player1: 12, player2: 14 },
        { player1: 7, player2: 11 },
        { player1: 11, player2: 9 },
        { player1: 11, player2: 5 }
      ]
    },
    submitterName: 'Kovács Gábor',
    submittedAt: '2026-06-01T21:00:00Z'
  },
  {
    id: 'm1_4',
    leagueId: 'l1',
    round: 2,
    player1Id: 'p2',
    player2Id: 'p4',
    date: '2026-06-02',
    court: '3-as pálya',
    status: 'Beküldve', // Várunk a jóváhagyásra, hogy kipróbálható legyen!
    submittedScore: {
      player1Sets: 1,
      player2Sets: 3,
      sets: [
        { player1: 8, player2: 11 },
        { player1: 11, player2: 9 },
        { player1: 6, player2: 11 },
        { player1: 9, player2: 11 }
      ]
    },
    submitterName: 'Tóth Péter',
    submitterContact: '+36 20 987 6543',
    comment: 'Laci ma tarthatatlan volt, gratulálok neki.',
    submittedAt: '2026-06-18T19:40:00Z'
  },
  // A Liga - Forduló 3 (Tervezett)
  {
    id: 'm1_5',
    leagueId: 'l1',
    round: 3,
    player1Id: 'p1',
    player2Id: 'p4',
    date: '2026-06-25',
    court: '2-es pálya',
    status: 'Tervezett'
  },
  {
    id: 'm1_6',
    leagueId: 'l1',
    round: 3,
    player1Id: 'p2',
    player2Id: 'p3',
    date: '2026-06-26',
    court: '1-es pálya',
    status: 'Tervezett'
  },

  // B Liga - Forduló 1
  {
     id: 'm2_1',
     leagueId: 'l2',
     round: 1,
     player1Id: 'p5',
     player2Id: 'p6',
     date: '2026-05-18',
     court: '3-as pálya',
     status: 'Jóváhagyva',
     submittedScore: {
       player1Sets: 3,
       player2Sets: 0,
       sets: [
         { player1: 11, player2: 5 },
         { player1: 11, player2: 8 },
         { player1: 11, player2: 4 }
       ]
     },
     submitterName: 'Kiss Beáta'
  },
  {
     id: 'm2_2',
     leagueId: 'l2',
     round: 1,
     player1Id: 'p7',
     player2Id: 'p8',
     date: '2026-05-19',
     court: '1-es pálya',
     status: 'Jóváhagyva',
     submittedScore: {
       player1Sets: 2,
       player2Sets: 3,
       sets: [
         { player1: 11, player2: 9 },
         { player1: 8, player2: 11 },
         { player1: 11, player2: 5 },
         { player1: 5, player2: 11 },
         { player1: 9, player2: 11 }
       ]
     },
     submitterName: 'Molnár Gergő'
  },
  // B Liga - Forduló 2 (Beküldve)
  {
     id: 'm2_3',
     leagueId: 'l2',
     round: 2,
     player1Id: 'p5',
     player2Id: 'p7',
     date: '2026-06-10',
     court: '2-es pálya',
     status: 'Beküldve',
     submittedScore: {
       player1Sets: 3,
       player2Sets: 1,
       sets: [
         { player1: 11, player2: 6 },
         { player1: 11, player2: 3 },
         { player1: 9, player2: 11 },
         { player1: 11, player2: 8 }
       ]
     },
     submitterName: 'Kiss Beáta',
     comment: 'Nagyon izgalmas szettek!'
  },
  {
     id: 'm2_4',
     leagueId: 'l2',
     round: 2,
     player1Id: 'p6',
     player2Id: 'p8',
     date: '2026-06-11',
     court: '1-es pálya',
     status: 'Tervezett'
  },

  // C Liga - Forduló 1
  {
     id: 'm3_1',
     leagueId: 'l3',
     round: 1,
     player1Id: 'p9',
     player2Id: 'p10',
     date: '2026-06-05',
     court: '3-as pálya',
     status: 'Jóváhagyva',
     submittedScore: {
       player1Sets: 3,
       player2Sets: 1,
       sets: [
         { player1: 11, player2: 6 },
         { player1: 12, player2: 10 },
         { player1: 7, player2: 11 },
         { player1: 11, player2: 9 }
       ]
     }
  },

  // Női Liga
  {
    id: 'm5_1',
    leagueId: 'l5',
    round: 1,
    player1Id: 'p5',
    player2Id: 'p11',
    date: '2026-06-12',
    court: '1-es pálya',
    status: 'Jóváhagyva',
    submittedScore: {
      player1Sets: 3,
      player2Sets: 0,
      sets: [
        { player1: 11, player2: 4 },
        { player1: 11, player2: 7 },
        { player1: 11, player2: 5 }
      ]
    }
  },
  {
    id: 'm5_2',
    leagueId: 'l5',
    round: 1,
    player1Id: 'p11',
    player2Id: 'p12',
    date: '2026-06-14',
    court: '2-es pálya',
    status: 'Tervezett'
  }
];

// Alapértelmezett Szponzorok (Sponsors)
export const DEFAULT_SPONSORS: Sponsor[] = [
  { id: 's1', name: 'AdProTech', logoText: 'AdProTech', colorHex: 'from-blue-600 to-cyan-500', websiteUrl: 'https://adprotech.hu', isActive: true },
  { id: 's2', name: 'Csodashop.hu', logoText: 'Csodashop.hu', colorHex: 'from-amber-500 to-orange-600', websiteUrl: 'https://csodashop.hu', isActive: true },
  { id: 's3', name: 'Happy Fagyi', logoText: 'Happy Fagyi 🍦', colorHex: 'from-pink-500 to-rose-400', websiteUrl: 'https://happyfagyi.hu', isActive: true },
  { id: 's4', name: 'Kovácsbusz', logoText: 'Kovácsbusz 🚌', colorHex: 'from-emerald-600 to-teal-500', websiteUrl: 'https://kovacsbusz.hu', isActive: true },
  { id: 's5', name: 'Rolling Kft.', logoText: 'Rolling Kft. ⚙️', colorHex: 'from-slate-700 to-gray-500', websiteUrl: 'https://rollingkft.hu', isActive: true },
  { id: 's6', name: 'West Machine Kft.', logoText: 'West Machine', colorHex: 'from-red-600 to-orange-500', websiteUrl: 'https://westmachine.hu', isActive: true },
];

/**
 * Számolja a tabella állását egy adott liga mérkőzései és játékosai alapján.
 * Szabályok:
 *  - Csak a 'Jóváhagyva' státuszú mérkőzések vesznek részt az újraszámolásban.
 *  - Win (győzelem) = 3 pont.
 *  - Loss (vereség) = 0 pont.
 *  - Rendezi az alábbiak szerint:
 *     1. Pontszám (csökkenő)
 *     2. Győzelmi arány (csökkenő)
 *     3. Szettkülönbség (nyert szett - vesztett szett, csökkenő)
 *     4. Kevesebb játszott meccs (ha pont egyenlőség)
 */
export function calculateStandings(leagueId: string, matches: Match[], players: Player[], leaguePlayerIds?: string[]): Standing[] {
  const currentLeaguePlayerIds = leaguePlayerIds || [];
  
  // Összegyűjtjük a liga meccseit
  const leagueMatches = matches.filter(m => m.leagueId === leagueId && m.status === 'Jóváhagyva');
  
  // Feltérképezzük a játékosokat
  const playerStats: Record<string, {
    playerName: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
    points: number;
    form: ('W' | 'L')[];
  }> = {};

  // Beállítjuk az alapértelmezett üres statisztikákat a liga minden játékosának
  currentLeaguePlayerIds.forEach(pId => {
    const player = players.find(p => p.id === pId);
    if (player) {
      playerStats[pId] = {
        playerName: player.name,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        form: []
      };
    }
  });

  // Feldolgozzuk a meccseket időrendben a forma (W-W-L) pontos kirajzolásához
  // Előbb rendezzük dátum szerint
  const sortedMatches = [...leagueMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedMatches.forEach(match => {
    const p1 = match.player1Id;
    const p2 = match.player2Id;
    const score = match.submittedScore;

    if (!score) return;

    // Inicializáljuk ha nem volt benne (pl. ha valaki nincs megadva a liga játékosai közt, de játszott)
    if (!playerStats[p1]) {
      const p = players.find(x => x.id === p1);
      playerStats[p1] = {
        playerName: p ? p.name : 'Ismeretlen játékos',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        form: []
      };
    }
    if (!playerStats[p2]) {
      const p = players.find(x => x.id === p2);
      playerStats[p2] = {
        playerName: p ? p.name : 'Ismeretlen játékos',
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        points: 0,
        form: []
      };
    }

    const s1 = score.player1Sets;
    const s2 = score.player2Sets;

    // Statisztika frissítés
    playerStats[p1].matchesPlayed += 1;
    playerStats[p2].matchesPlayed += 1;

    playerStats[p1].setsWon += s1;
    playerStats[p1].setsLost += s2;
    playerStats[p2].setsWon += s2;
    playerStats[p2].setsLost += s1;

    if (s1 > s2) {
      playerStats[p1].wins += 1;
      playerStats[p1].points += 3;
      playerStats[p1].form.push('W');

      playerStats[p2].losses += 1;
      playerStats[p2].points += 0;
      playerStats[p2].form.push('L');
    } else {
      playerStats[p2].wins += 1;
      playerStats[p2].points += 3;
      playerStats[p2].form.push('W');

      playerStats[p1].losses += 1;
      playerStats[p1].points += 0;
      playerStats[p1].form.push('L');
    }
  });

  // Tabella tömbbé alakítása és rendezése
  const standingList: Standing[] = Object.entries(playerStats).map(([playerId, stats]) => ({
    playerId,
    playerName: stats.playerName,
    matchesPlayed: stats.matchesPlayed,
    wins: stats.wins,
    losses: stats.losses,
    setsWon: stats.setsWon,
    setsLost: stats.setsLost,
    points: stats.points,
    // Megtartjuk az utolsó 4 meccs formáját
    form: stats.form.slice(-4)
  }));

  // Rendezési szabályok:
  // 1. Pontok csökkenőben
  // 2. Győzelmek száma csökkenőben
  // 3. Szett különbség csökkenőben
  standingList.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    const diffB = b.setsWon - b.setsLost;
    const diffA = a.setsWon - a.setsLost;
    return diffB - diffA;
  });

  return standingList;
}
