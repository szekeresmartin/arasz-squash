import { League, Match, Player, Result, Sponsor, Standing } from './types';
import rawLeagues from '../data/generated/leagues.json';
import rawPlayers from '../data/generated/players.json';
import rawMatches from '../data/generated/matches.json';
import rawResults from '../data/generated/results.json';

type GeneratedLeague = {
  id: string;
  sheetName: string;
  name: string;
  classLabel: string;
  order: number;
  playerCount: number;
};

type GeneratedPlayer = {
  id: string;
  leagueId: string;
  name: string;
  sourceSheetName: string;
  headerCell: string;
  rowCell: string;
  order: number;
  active: boolean;
};

type GeneratedMatch = {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  sourceCell: string;
  reverseSourceCell?: string;
  status: 'scheduled' | 'approved';
  resultId?: string;
};

type GeneratedResult = Result;

const GENERATED_LEAGUES = rawLeagues as GeneratedLeague[];
const GENERATED_PLAYERS = rawPlayers as GeneratedPlayer[];
const GENERATED_MATCHES = rawMatches as GeneratedMatch[];
const GENERATED_RESULTS = rawResults as GeneratedResult[];

const LEAGUE_SLUGS = ['a-liga', 'b-liga', 'c-liga', 'd-liga', 'e-liga'] as const;

const RULE_TEXT = `A liga meccsre a WSF szabályrendszere vonatkozik, minden labdamenet pontot ér és 11 pontig tart egy szett. 10-10 után két pont különbséggel lehet nyerni. A mérkőzés öt lejátszott szettből áll.
Pontozás: Győzelemért 5 pont, vereségért 2/3 szett aránynál 3 pont, 1/4 szett aránynál 2 pont, 0/5 szett aránynál 1 pont, játék nélkül 0 pont jár.
Visszalépő játékos esetén a pontok elosztásáról a versenybizottság dönt a sportszerűség elve alapján. Ha valakivel többszöri próbálkozás ellenére sem sikerül időpontot egyeztetni,(és ennek nyoma van a viber csoportban) akkor a rendezőség egyedi elbírálása alapján is jár az 5 pont játék nélkül. Egyenlő pontszám, győzelmi szám, szettkülönbség és megnyert szett esetén az egymás elleni eredmény dönt, ennek hiányában a névsor szerinti sorrend érvényes. Ha minden összehasonlított mutató teljesen egyezik és nincs egymás elleni eredmény, azonos helyezés jár.(a megnyert szetteket, csak lejátszott mérkőzéseknél vesszük alapul, tehát ha az ellenfél nem tudta lejátszani a meccsét sérülés miatt, akkor két játékos eredményének összehasonlításánál a megnyert szetteket nem veszük számításba egyik félnél sem, de a pontokat természetesen igen)
Fontos, hogy küzdj minden szettért, mert a végén sokszor számít, hogy hány szettet tudtál megnyerni és ezen múlhat a helyezésed a ligában.
Labda: "A" ligában 2 sárga pöttyös labda az alap! Ettől eltérni kétféleképpen lehet: 1. Amennyiben mindkét játékos beleegyezik úgy használható a piros pöttyös labda is.    2. Az +50 feletti játékosok kérhetik a piros labdát meccslabdának. 
B - C - D - E  ligában az alap labda az 1 piros pöttyös. Amennyiben mindkét játékos beleegyezik úgy használható bármelyik típus.`;

const LEGACY_RULES_BY_ORDER = [RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT] as const;

function getLeagueSlugByOrder(order: number) {
  return LEAGUE_SLUGS[order - 1] || `liga-${order}`;
}

function buildRoundRobinRounds(playerIds: string[]) {
  const ids = [...playerIds];
  const hasBye = ids.length % 2 === 1;
  if (hasBye) {
    ids.push('__BYE__');
  }

  const rounds: Array<Array<[string, string]>> = [];
  const fixed = ids[0];
  let rotating = ids.slice(1);
  const roundCount = ids.length - 1;

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const arrangement = [fixed, ...rotating];
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < arrangement.length / 2; i += 1) {
      const left = arrangement[i];
      const right = arrangement[arrangement.length - 1 - i];
      if (left !== '__BYE__' && right !== '__BYE__') {
        pairs.push([left, right]);
      }
    }

    rounds.push(pairs);

    if (rotating.length > 0) {
      rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
    }
  }

  return rounds;
}

function buildRoundMap() {
  const roundMap = new Map<string, number>();

  for (const league of GENERATED_LEAGUES) {
    const orderedPlayers = GENERATED_PLAYERS
      .filter(player => player.leagueId === league.id && player.active)
      .sort((a, b) => a.order - b.order)
      .map(player => player.id);

    const rounds = buildRoundRobinRounds(orderedPlayers);

    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach(([player1Id, player2Id]) => {
        const key = [player1Id, player2Id].sort().join('::');
        roundMap.set(`${league.id}:${key}`, roundIndex + 1);
      });
    });
  }

  return roundMap;
}

function buildResultMap() {
  return new Map(GENERATED_RESULTS.map(result => [result.matchId, result]));
}

const ROUND_MAP = buildRoundMap();
const RESULT_MAP = buildResultMap();
const SPONSOR_LOGOS = [
  new URL('../data/sponsors/arasz_store.jpg', import.meta.url).href,
  new URL('../data/sponsors/partner_1.svg', import.meta.url).href,
  new URL('../data/sponsors/partner_2.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_3.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_4.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_5.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_6.webp', import.meta.url).href,
  new URL('../data/sponsors/martincreative_studio.png', import.meta.url).href,
  new URL('../data/sponsors/ontode-sportcentrum-logo.jpg', import.meta.url).href,
] as const;

export const DEFAULT_LEAGUES: League[] = GENERATED_LEAGUES.map((league) => ({
  id: league.id,
  name: league.name,
  season: '2026 Tavasz / Nyár',
  rules: LEGACY_RULES_BY_ORDER[league.order - 1] || 'Standard squash liga szabályok érvényesek.',
  isActive: true,
  playerIds: GENERATED_PLAYERS
    .filter(player => player.leagueId === league.id && player.active)
    .sort((a, b) => a.order - b.order)
    .map(player => player.id),
}));

export const DEFAULT_PLAYERS: Player[] = GENERATED_PLAYERS.map((player) => ({
  id: player.id,
  name: player.name,
  leagueId: player.leagueId,
  order: player.order,
  active: player.active,
  sourceSheetName: player.sourceSheetName,
}));

export const DEFAULT_RESULTS: Result[] = GENERATED_RESULTS.map(result => ({
  ...result,
  playedOnCourt: result.kind === 'score',
  isForfeit: result.kind === 'walkover',
}));

export const DEFAULT_MATCHES: Match[] = GENERATED_MATCHES.map((match) => {
  const result = RESULT_MAP.get(match.id);
  const round = ROUND_MAP.get(`${match.leagueId}:${[match.player1Id, match.player2Id].sort().join('::')}`) || 1;

  return {
    id: match.id,
    leagueId: match.leagueId,
    round,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    status: match.status === 'approved' ? 'Jóváhagyva' : 'Tervezett',
    submittedScore: result ? {
      player1Sets: result.normalizedSetsWon,
      player2Sets: result.normalizedSetsLost,
      sets: [],
    } : undefined,
    sourceCell: match.sourceCell,
    reverseSourceCell: match.reverseSourceCell,
    resultId: match.resultId,
  };
});

export const DEFAULT_SPONSORS: Sponsor[] = [
  { id: 's9', name: 'Öntöde Sportcentrum', logoText: 'Öntöde Sportcentrum', logoPath: SPONSOR_LOGOS[8], colorHex: 'from-teal-700 to-cyan-600', websiteUrl: 'https://ontodesport.hu/', isActive: true },
  { id: 's1', name: 'Arasz Store', logoText: 'Arasz Store', logoPath: SPONSOR_LOGOS[0], colorHex: 'from-teal-600 to-cyan-500', websiteUrl: 'https://araszstore.hu/', isActive: true },
  { id: 's2', name: 'AdProTech', logoText: 'AdProTech', logoPath: SPONSOR_LOGOS[1], colorHex: 'from-blue-600 to-cyan-500', websiteUrl: 'https://www.adprotech.hu/', isActive: true },
  { id: 's3', name: 'Csodashop.hu', logoText: 'Csodashop.hu', logoPath: SPONSOR_LOGOS[2], colorHex: 'from-amber-500 to-orange-600', websiteUrl: 'https://csodashop.hu', isActive: true },
  { id: 's4', name: 'Happy Fagyi', logoText: 'Happy Fagyi 🍦', logoPath: SPONSOR_LOGOS[3], colorHex: 'from-pink-500 to-rose-400', websiteUrl: 'https://happyfagyi.hu', isActive: true },
  { id: 's5', name: 'Kovácsbusz', logoText: 'Kovácsbusz 🚌', logoPath: SPONSOR_LOGOS[4], colorHex: 'from-emerald-600 to-teal-500', websiteUrl: 'https://kovacsbusz.hu', isActive: true },
  { id: 's6', name: 'Rolling Kft. Szombathely', logoText: 'Rolling Kft. Szombathely', logoPath: SPONSOR_LOGOS[5], colorHex: 'from-slate-700 to-slate-900', websiteUrl: 'https://rollingkft.hu', isActive: true },
  { id: 's7', name: 'West Machine Kft.', logoText: 'West Machine', logoPath: SPONSOR_LOGOS[6], colorHex: 'from-red-600 to-orange-500', websiteUrl: 'https://westmachine.hu', isActive: true },
  { id: 's8', name: 'martin creative studio', logoText: 'martin creative studio', logoPath: SPONSOR_LOGOS[7], colorHex: 'from-slate-950 to-gray-700', websiteUrl: 'https://martincreative.studio', isActive: true },
];

const DEFAULT_SPONSOR_IDS = new Set(DEFAULT_SPONSORS.map((sponsor) => sponsor.id));

export function normalizeSponsors(sponsors: Sponsor[]): Sponsor[] {
  const sponsorById = new Map(sponsors.map((sponsor) => [sponsor.id, sponsor] as const));
  const normalizedDefaults = DEFAULT_SPONSORS.map((defaultSponsor) => {
    const persistedSponsor = sponsorById.get(defaultSponsor.id);

    if (!persistedSponsor) {
      return defaultSponsor;
    }

    return {
      ...persistedSponsor,
      ...defaultSponsor,
      isActive: true,
    };
  });

  const extraSponsors = sponsors.filter((sponsor) => !DEFAULT_SPONSOR_IDS.has(sponsor.id));

  return [...normalizedDefaults, ...extraSponsors];
}

export const LEAGUE_ROUTE_META = GENERATED_LEAGUES.map((league) => ({
  id: league.id,
  slug: getLeagueSlugByOrder(league.order),
  classLabel: league.classLabel,
}));

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

export function calculateStandings(players: Player[], matches: Match[], results: Result[]): Standing[] {
  const playerRows = new Map<string, Standing>();
  const headToHeadWinsByPlayerId = new Map<string, number>();

  for (const player of players) {
    playerRows.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      setDifference: 0,
      basePoints: 0,
      rankingScore: 0,
      position: 0,
      form: [],
    });
  }

  const matchOrder = new Map(matches.map((match, index) => [match.id, index]));
  const approvedResults = results
    .filter(result => result.status === 'approved' && playerRows.has(result.player1Id) && playerRows.has(result.player2Id))
    .slice()
    .sort((a, b) => (matchOrder.get(a.matchId) ?? 0) - (matchOrder.get(b.matchId) ?? 0));

  const getBasePointsForPlayer = (result: Result, isPlayer1: boolean) => {
    const playerWon = isPlayer1
      ? result.normalizedSetsWon > result.normalizedSetsLost
      : result.normalizedSetsLost > result.normalizedSetsWon;

    if (result.kind === 'walkover') {
      return playerWon ? 5 : 0;
    }

    if (playerWon) {
      return 5;
    }

    const loserSets = isPlayer1 ? result.normalizedSetsWon : result.normalizedSetsLost;
    return loserSets + 1;
  };

  const getPairKey = (player1Id: string, player2Id: string) => {
    return player1Id < player2Id ? `${player1Id}::${player2Id}` : `${player2Id}::${player1Id}`;
  };

  const pairWins = new Map<string, { player1Id: string; player2Id: string; player1Wins: number; player2Wins: number }>();

  for (const result of approvedResults) {
    const row1 = playerRows.get(result.player1Id);
    const row2 = playerRows.get(result.player2Id);

    if (!row1 || !row2) {
      continue;
    }

    row1.matchesPlayed += 1;
    row2.matchesPlayed += 1;
    if (result.kind !== 'walkover') {
      row1.setsWon += result.normalizedSetsWon;
      row1.setsLost += result.normalizedSetsLost;
      row2.setsWon += result.normalizedSetsLost;
      row2.setsLost += result.normalizedSetsWon;
    }

    const row1Won = result.normalizedSetsWon > result.normalizedSetsLost;
    const row2Won = result.normalizedSetsLost > result.normalizedSetsWon;

    row1.basePoints += getBasePointsForPlayer(result, true);
    row2.basePoints += getBasePointsForPlayer(result, false);

    const pairKey = getPairKey(result.player1Id, result.player2Id);
    const pair = pairWins.get(pairKey) ?? {
      player1Id: result.player1Id,
      player2Id: result.player2Id,
      player1Wins: 0,
      player2Wins: 0,
    };

    if (row1Won) {
      row1.wins += 1;
      row1.form.push('W');
      row2.losses += 1;
      row2.form.push('L');
      if (pair.player1Id === result.player1Id) {
        pair.player1Wins += 1;
      } else {
        pair.player2Wins += 1;
      }
    } else if (row2Won) {
      row2.wins += 1;
      row2.form.push('W');
      row1.losses += 1;
      row1.form.push('L');
      if (pair.player1Id === result.player1Id) {
        pair.player2Wins += 1;
      } else {
        pair.player1Wins += 1;
      }
    }

    pairWins.set(pairKey, pair);
  }

  for (const pair of pairWins.values()) {
    const row1 = playerRows.get(pair.player1Id);
    const row2 = playerRows.get(pair.player2Id);

    if (!row1 || !row2) {
      continue;
    }

    const sameRankingStats =
      row1.basePoints === row2.basePoints &&
      row1.wins === row2.wins &&
      (row1.setsWon - row1.setsLost) === (row2.setsWon - row2.setsLost) &&
      row1.setsWon === row2.setsWon;

    if (!sameRankingStats) {
      continue;
    }

    if (pair.player1Wins > pair.player2Wins) {
      headToHeadWinsByPlayerId.set(pair.player1Id, (headToHeadWinsByPlayerId.get(pair.player1Id) ?? 0) + 1);
    } else if (pair.player2Wins > pair.player1Wins) {
      headToHeadWinsByPlayerId.set(pair.player2Id, (headToHeadWinsByPlayerId.get(pair.player2Id) ?? 0) + 1);
    }
  }

  const standings = [...playerRows.values()].map(row => {
    const setDifference = row.setsWon - row.setsLost;
    return {
      ...row,
      setDifference,
      rankingScore: row.basePoints * 1_000_000 + row.wins * 10_000 + setDifference * 100 + row.setsWon,
      form: row.form.slice(-4),
    };
  });

  standings.sort((a, b) => {
    if (b.basePoints !== a.basePoints) return b.basePoints - a.basePoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    const aHeadToHeadWins = headToHeadWinsByPlayerId.get(a.playerId) ?? 0;
    const bHeadToHeadWins = headToHeadWinsByPlayerId.get(b.playerId) ?? 0;
    if (bHeadToHeadWins !== aHeadToHeadWins) return bHeadToHeadWins - aHeadToHeadWins;
    const nameOrder = a.playerName.localeCompare(b.playerName, 'hu');
    if (nameOrder !== 0) return nameOrder;
    return a.playerId.localeCompare(b.playerId, 'hu');
  });

  let currentPosition = 0;
  let previousKey = '';

  return standings.map((row, index) => {
    const headToHead = headToHeadWinsByPlayerId.get(row.playerId) ?? 0;
    const key = `${row.basePoints}|${row.wins}|${row.setDifference}|${row.setsWon}|${headToHead}`;

    if (key !== previousKey) {
      currentPosition = index + 1;
      previousKey = key;
    }

    return {
      ...row,
      position: currentPosition,
    };
  });
}
