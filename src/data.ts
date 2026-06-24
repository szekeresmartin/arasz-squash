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

const LEGACY_RULES_BY_ORDER = [
  'Minden mérkőzés 3 nyert szettig tart. Szigorú PAR-11 pontozás (minden labdamenet pontot ér). Hibás adogatás esetén a fogadónak jár a pont. A pályán védőszemüveg használata javasolt, junioroknak kötelező!',
  'Minden mérkőzés 3 nyert szettig tart. PAR-11 szabályok érvényesek. Az eredményeket a lejátszást követő 24 órában be kell küldeni a weboldalon keresztül.',
  'Kezdő és haladó szint. 3 nyert szettig játszanak. Kiváló lehetőség a versenyzés alapjainak elsajátítására barátságos légkörben.',
  'Mérkőzések 3 nyert szettig tartanak PAR-11 pontrendszerben. Ideális tapasztalt szabadidős játékosoknak a folyamatos fejlődésre és sportszerű csatákra.',
  'Különösen javasolt kezdőknek és a fallabda alapjaival most ismerkedőknek. Barátságos, heti rendszerességű fordulók családias légkörben.',
] as const;

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
  new URL('../data/sponsors/partner_1.svg', import.meta.url).href,
  new URL('../data/sponsors/partner_2.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_3.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_4.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_5.webp', import.meta.url).href,
  new URL('../data/sponsors/partner_6.webp', import.meta.url).href,
  new URL('../data/sponsors/martincreative_studio.png', import.meta.url).href,
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
  { id: 's1', name: 'AdProTech', logoText: 'AdProTech', logoPath: SPONSOR_LOGOS[0], colorHex: 'from-blue-600 to-cyan-500', websiteUrl: 'https://adprotech.hu', isActive: true },
  { id: 's2', name: 'Csodashop.hu', logoText: 'Csodashop.hu', logoPath: SPONSOR_LOGOS[1], colorHex: 'from-amber-500 to-orange-600', websiteUrl: 'https://csodashop.hu', isActive: true },
  { id: 's3', name: 'Happy Fagyi', logoText: 'Happy Fagyi 🍦', logoPath: SPONSOR_LOGOS[2], colorHex: 'from-pink-500 to-rose-400', websiteUrl: 'https://happyfagyi.hu', isActive: true },
  { id: 's4', name: 'Kovácsbusz', logoText: 'Kovácsbusz 🚌', logoPath: SPONSOR_LOGOS[3], colorHex: 'from-emerald-600 to-teal-500', websiteUrl: 'https://kovacsbusz.hu', isActive: true },
  { id: 's5', name: 'Rolling Kft. Szombathely', logoText: 'Rolling Kft. Szombathely', logoPath: SPONSOR_LOGOS[4], colorHex: 'from-slate-700 to-slate-900', websiteUrl: 'https://rollingkft.hu', isActive: true },
  { id: 's6', name: 'West Machine Kft.', logoText: 'West Machine', logoPath: SPONSOR_LOGOS[5], colorHex: 'from-red-600 to-orange-500', websiteUrl: 'https://westmachine.hu', isActive: true },
  { id: 's7', name: 'martin creative studio', logoText: 'martin creative studio', logoPath: SPONSOR_LOGOS[6], colorHex: 'from-slate-950 to-gray-700', websiteUrl: 'https://martincreative.studio', isActive: true },
];

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

    if (row1Won) {
      row1.wins += 1;
      row1.form.push('W');
      row2.losses += 1;
      row2.form.push('L');
    } else if (row2Won) {
      row2.wins += 1;
      row2.form.push('W');
      row1.losses += 1;
      row1.form.push('L');
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

  const getHeadToHeadWinner = (playerAId: string, playerBId: string) => {
    const directResults = approvedResults.filter(result => {
      const pairMatches =
        (result.player1Id === playerAId && result.player2Id === playerBId) ||
        (result.player1Id === playerBId && result.player2Id === playerAId);
      return pairMatches;
    });

    if (directResults.length !== 1) {
      return null;
    }

    const result = directResults[0];
    if (result.normalizedSetsWon === result.normalizedSetsLost) {
      return null;
    }

    const player1Won = result.normalizedSetsWon > result.normalizedSetsLost;
    const winnerId = player1Won ? result.player1Id : result.player2Id;
    return winnerId === playerAId ? playerAId : winnerId === playerBId ? playerBId : null;
  };

  standings.sort((a, b) => {
    if (b.basePoints !== a.basePoints) return b.basePoints - a.basePoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;

    const headToHeadWinner = getHeadToHeadWinner(a.playerId, b.playerId);
    if (headToHeadWinner === a.playerId) return -1;
    if (headToHeadWinner === b.playerId) return 1;

    // TODO: többes holtverseny esetén később admin / bizottsági döntés lehet szükséges.
    return a.playerName.localeCompare(b.playerName, 'hu');
  });

  return standings.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}
