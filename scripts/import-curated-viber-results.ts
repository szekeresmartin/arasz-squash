import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

type League = {
  id: string;
  name: string;
  sheetName: string;
};

type Player = {
  id: string;
  leagueId: string;
  name: string;
  active: boolean;
};

type Match = {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  status: 'scheduled' | 'approved';
  resultId?: string;
};

type ExistingResult = {
  id: string;
  leagueId: string;
  matchId: string;
  player1Id: string;
  player2Id: string;
  sourceSheet: string;
  sourceCells: string[];
  rawHomeToken: string;
  rawAwayToken?: string;
  normalizedSetsWon: number;
  normalizedSetsLost: number;
  kind: 'score' | 'walkover';
  status: 'approved';
  playedOnCourt?: boolean;
  isForfeit?: boolean;
  normalizedToken?: string;
  source?: string;
  importedAt?: string;
  sourceReference?: string;
};

type ReviewRecord = {
  sectionTitle: string;
  matchRaw: string;
  resultRaw: string;
  normalizedToken: string | null;
  resolvedLeagueId?: string;
  resolvedPlayer1Id?: string;
  resolvedPlayer2Id?: string;
  resolvedMatchId?: string;
  status: 'needs_review';
  issues: string[];
};

type Report = {
  sourceFile: string;
  importedAt: string;
  totalRows: number;
  parsedRows: number;
  appendedOfficialResults: number;
  skippedAlreadyApproved: number;
  reviewRows: number;
  unresolvedPlayers: number;
  unresolvedMatches: number;
  invalidTokens: number;
  perLeagueSummary: Array<{
    leagueId: string;
    rowsInSource: number;
    appendedOfficialResults: number;
    skippedAlreadyApproved: number;
    reviewRows: number;
  }>;
};

type CuratedRow = {
  sectionTitle: string;
  matchRaw: string;
  resultRaw: string;
};

type ResolvedPlayer = {
  player: Player;
  matchedBy: 'direct' | 'alias' | 'partial';
};

type ResolvedMatch = {
  match: Match;
  player1Score: number;
  player2Score: number;
  sourcePlayer1Id: string;
  sourcePlayer2Id: string;
};

const SOURCE_FILE = path.join('data', 'raw', 'viber-curated-results.txt');
const PLAYERS_FILE = path.join('data', 'generated', 'players.json');
const MATCHES_FILE = path.join('data', 'generated', 'matches.json');
const RESULTS_FILE = path.join('data', 'generated', 'results.json');
const REVIEW_FILE = path.join('data', 'generated', 'curated-viber-results-review.json');
const REPORT_FILE = path.join('data', 'generated', 'curated-viber-import-report.json');

const SECTION_TO_LEAGUE_ID = new Map<string, string>([
  ['E liga', 'league-e'],
  ['D liga', 'league-d'],
  ['B liga', 'league-b'],
  ['A liga / liga nem mindenhol egyértelmű', 'league-a'],
]);

const NAME_ALIASES: Record<string, string> = {
  'szerdahelyi d': 'Szerdahelyi Dániel',
  'szerdahelyi daniel': 'Szerdahelyi Dániel',
  'szekeres m': 'Szekeres Martin',
  'szekeres martin': 'Szekeres Martin',
  'vincze k': 'Vincze Krisztián',
  'vincze krisztián': 'Vincze Krisztián',
  'vincze krisztian': 'Vincze Krisztián',
  'hajba tibi': 'Hajba Tibor',
  'hajba t': 'Hajba Tibor',
  'hajba tibor': 'Hajba Tibor',
  'hajba z': 'Hajba Zoé',
  'hajba zoe': 'Hajba Zoé',
  'hajba zoé': 'Hajba Zoé',
  'bakos m': 'Bakos Mátyás',
  'bakos matyi': 'Bakos Mátyás',
  'bakos mátyás': 'Bakos Mátyás',
  'kovacs l': 'Kovács László',
  'kovacs laci': 'Kovács László',
  'kovács lászló': 'Kovács László',
  'marko zoltan': 'Markó Zoltán',
  'm zoli': 'Markó Zoltán',
  'pek robi': 'Pék Róbert',
  'pek r': 'Pék Róbert',
  'p i': 'Polgár István',
  'polgar istvan': 'Polgár István',
  'bankits csaba': 'Bankits Csaba',
  'csaba': 'Bankits Csaba',
  'gaspar julia': 'Gáspár Júlia',
  'julia': 'Gáspár Júlia',
  'balazs bikali': 'Bikali Balázs',
  'bikali balazs': 'Bikali Balázs',
  'varga tamas': 'Varga Tamás',
  'bartus peter': 'Bartus Péter',
  'toth z': 'Tóth Zoltán',
  'toth zoltan': 'Tóth Zoltán',
  'nemeth balazs': 'Némeh Balázs',
  'nemeth b': 'Némeh Balázs',
  'nemeth balazs.': 'Némeh Balázs',
  'nemeh balazs': 'Némeh Balázs',
  'nagy zoltan': 'Nagy Zoltán',
  'molnar milan': 'Molnár Milán',
  'bognar barna': 'Bognár Barna',
  'zsoldos tamas': 'Zsoldos Tamás',
  'lukacs daniel': 'Lukács Dániel',
  'sakovics peter': 'Sákovics Péter',
  'czupor andras': 'Czupor András',
};

const MANUAL_LEAGUE_NAME_HINTS = new Map<string, string>([
  ['varga tamas', 'league-c'],
  ['bartus peter', 'league-c'],
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-');
}

function parseJsonFile<T>(filePath: string): Promise<T> {
  return readFile(filePath, 'utf8').then(content => JSON.parse(content) as T);
}

function formatResultToken(value: string): string | null {
  const match = value.trim().match(/^([0-5])\s*(?:\/|–|—|-)\s*([0-5])$/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

function parseCuratedRows(sourceText: string): CuratedRow[] {
  const rows: CuratedRow[] = [];
  let currentSectionTitle = '';

  for (const rawLine of sourceText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('## ')) {
      currentSectionTitle = line.slice(3).trim();
      continue;
    }

    if (!line.startsWith('|')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());

    if (cells.length < 2) {
      continue;
    }

    const [matchRaw, resultRaw] = cells;
    if (!matchRaw || !resultRaw) {
      continue;
    }

    if (/^-{2,}$/.test(matchRaw.replace(/\s/g, '')) || /^Meccs$/i.test(matchRaw)) {
      continue;
    }

    if (/^Meccs$/i.test(matchRaw) || /^Eredmény$/i.test(resultRaw)) {
      continue;
    }

    rows.push({
      sectionTitle: currentSectionTitle,
      matchRaw,
      resultRaw,
    });
  }

  return rows;
}

function buildPlayersById(players: Player[]): Map<string, Player> {
  return new Map(players.map(player => [player.id, player]));
}

function buildLeagueById(leagues: League[]): Map<string, League> {
  return new Map(leagues.map(league => [league.id, league]));
}

function buildPlayerIndexes(players: Player[]) {
  const playersByLeague = new Map<string, Player[]>();
  const normalizedNameIndex = new Map<string, Player[]>();

  const addToIndex = (key: string, player: Player) => {
    const existing = normalizedNameIndex.get(key) ?? [];
    if (!existing.some(entry => entry.id === player.id)) {
      existing.push(player);
      normalizedNameIndex.set(key, existing);
    }
  };

  for (const player of players) {
    const leaguePlayers = playersByLeague.get(player.leagueId) ?? [];
    leaguePlayers.push(player);
    playersByLeague.set(player.leagueId, leaguePlayers);

    addToIndex(normalizeText(player.name), player);
  }

  for (const [alias, canonicalName] of Object.entries(NAME_ALIASES)) {
    const normalizedAlias = normalizeText(alias);
    const normalizedCanonicalName = normalizeText(canonicalName);
    const canonicalPlayers = players.filter(player => normalizeText(player.name) === normalizedCanonicalName);
    for (const player of canonicalPlayers) {
      addToIndex(normalizedAlias, player);
    }
  }

  return { playersByLeague, normalizedNameIndex };
}

function resolvePlayer(
  rawName: string,
  leagueId: string | undefined,
  players: Player[],
  playersByLeague: Map<string, Player[]>,
  normalizedNameIndex: Map<string, Player[]>,
): { resolved?: ResolvedPlayer; issues: string[] } {
  const issues: string[] = [];
  const normalized = normalizeText(rawName);
  const leagueScopedPlayers = leagueId ? (playersByLeague.get(leagueId) ?? []) : players;

  const direct = leagueScopedPlayers.filter(player => normalizeText(player.name) === normalized);
  if (direct.length === 1) {
    return { resolved: { player: direct[0], matchedBy: 'direct' }, issues };
  }

  const aliasMatches = (normalizedNameIndex.get(normalized) ?? []).filter(player =>
    leagueId ? player.leagueId === leagueId : true,
  );
  if (aliasMatches.length === 1) {
    return { resolved: { player: aliasMatches[0], matchedBy: 'alias' }, issues };
  }

  const tokenSet = new Set(normalized.split(' ').filter(Boolean));
  const partial = leagueScopedPlayers.filter(player => {
    const candidateTokens = new Set(normalizeText(player.name).split(' ').filter(Boolean));
    if (candidateTokens.size === 0 || tokenSet.size === 0) {
      return false;
    }

    const hasAllSourceTokens = [...tokenSet].every(token => candidateTokens.has(token));
    const hasAllCandidateTokens = [...candidateTokens].every(token => tokenSet.has(token));
    return hasAllSourceTokens || hasAllCandidateTokens;
  });

  if (partial.length === 1) {
    return { resolved: { player: partial[0], matchedBy: 'partial' }, issues };
  }

  if (direct.length > 1 || aliasMatches.length > 1 || partial.length > 1) {
    issues.push(`ambiguous_player: ${rawName}`);
    return { issues };
  }

  issues.push(`unresolved_player: ${rawName}`);
  return { issues };
}

function resolveLeagueId(sectionTitle: string, rawNameA: string, rawNameB: string, playerA?: Player, playerB?: Player): string | undefined {
  const explicitLeagueId = SECTION_TO_LEAGUE_ID.get(sectionTitle);
  if (explicitLeagueId) {
    return explicitLeagueId;
  }

  const hintA = MANUAL_LEAGUE_NAME_HINTS.get(normalizeText(rawNameA));
  const hintB = MANUAL_LEAGUE_NAME_HINTS.get(normalizeText(rawNameB));
  if (hintA && hintA === hintB) {
    return hintA;
  }

  if (playerA && playerB && playerA.leagueId === playerB.leagueId) {
    return playerA.leagueId;
  }

  if (playerA && !playerB) {
    return playerA.leagueId;
  }

  if (!playerA && playerB) {
    return playerB.leagueId;
  }

  return undefined;
}

function findMatch(
  leagueId: string,
  playerA: Player,
  playerB: Player,
  matches: Match[],
): { match?: Match; issues: string[] } {
  const pairMatches = matches.filter(match => {
    if (match.leagueId !== leagueId) {
      return false;
    }

    const ordered = [match.player1Id, match.player2Id].sort().join('::');
    const incoming = [playerA.id, playerB.id].sort().join('::');
    return ordered === incoming;
  });

  if (pairMatches.length === 1) {
    return { match: pairMatches[0], issues: [] };
  }

  if (pairMatches.length > 1) {
    return { issues: ['ambiguous_match'] };
  }

  return { issues: ['no_matching_match'] };
}

function buildSourceReference(sectionTitle: string, matchRaw: string, resultRaw: string, leagueId: string, matchId: string) {
  const digest = createHash('sha256')
    .update([sectionTitle, matchRaw, resultRaw, leagueId, matchId].join('\n'))
    .digest('hex')
    .slice(0, 16);
  return `curated-viber-${digest}`;
}

function toOfficialResult(params: {
  sectionTitle: string;
  match: Match;
  sourcePlayerA: Player;
  sourcePlayerB: Player;
  sourceToken: string;
  importedAt: string;
  sourceReference: string;
}): ExistingResult {
  const { sectionTitle, match, sourcePlayerA, sourcePlayerB, sourceToken, importedAt, sourceReference } = params;
  const sourceScores = sourceToken.split('/').map(value => Number.parseInt(value, 10));
  const sourceScoreA = sourceScores[0];
  const sourceScoreB = sourceScores[1];
  const player1IsSourceA = match.player1Id === sourcePlayerA.id && match.player2Id === sourcePlayerB.id;
  const player1Score = player1IsSourceA ? sourceScoreA : sourceScoreB;
  const player2Score = player1IsSourceA ? sourceScoreB : sourceScoreA;
  const normalizedToken = `${player1Score}/${player2Score}`;

  return {
    id: `result-${match.id.slice('match-'.length)}`,
    leagueId: match.leagueId,
    matchId: match.id,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    sourceSheet: sectionTitle,
    sourceCells: [],
    rawHomeToken: normalizedToken,
    rawAwayToken: `${player2Score}/${player1Score}`,
    normalizedSetsWon: player1Score,
    normalizedSetsLost: player2Score,
    kind: 'score',
    status: 'approved',
    playedOnCourt: true,
    isForfeit: false,
    normalizedToken,
    source: 'curated_viber',
    importedAt,
    sourceReference,
  };
}

async function main() {
  const [players, leagues, matches, results, sourceText] = await Promise.all([
    parseJsonFile<Player[]>(PLAYERS_FILE),
    parseJsonFile<League[]>(path.join('data', 'generated', 'leagues.json')),
    parseJsonFile<Match[]>(MATCHES_FILE),
    parseJsonFile<ExistingResult[]>(RESULTS_FILE),
    readFile(SOURCE_FILE, 'utf8'),
  ]);

  const importedAt = new Date().toISOString();
  const curatedRows = parseCuratedRows(sourceText);
  const { playersByLeague, normalizedNameIndex } = buildPlayerIndexes(players);
  const playersById = buildPlayersById(players);
  const leagueById = buildLeagueById(leagues);
  const approvedResultByMatchId = new Map(results.filter(result => result.status === 'approved').map(result => [result.matchId, result]));
  const updatedMatches = matches.map(match => ({ ...match }));
  const updatedMatchesById = new Map(updatedMatches.map(match => [match.id, match]));
  const appendedResults: ExistingResult[] = [];
  const reviewRows: ReviewRecord[] = [];
  const perLeagueSummary = new Map<string, { rowsInSource: number; appendedOfficialResults: number; skippedAlreadyApproved: number; reviewRows: number }>();
  let unresolvedPlayers = 0;
  let unresolvedMatches = 0;
  let invalidTokens = 0;
  let skippedAlreadyApproved = 0;

  const getLeagueSummary = (leagueId: string) => {
    const existing = perLeagueSummary.get(leagueId);
    if (existing) {
      return existing;
    }

    const summary = {
      rowsInSource: 0,
      appendedOfficialResults: 0,
      skippedAlreadyApproved: 0,
      reviewRows: 0,
    };
    perLeagueSummary.set(leagueId, summary);
    return summary;
  };

  for (const row of curatedRows) {
    const token = formatResultToken(row.resultRaw);
    const issues: string[] = [];
    const rawMatchParts = row.matchRaw.split(/\s*[–—-]\s*/).map(part => part.trim()).filter(Boolean);
    const rawPlayerA = rawMatchParts[0] ?? '';
    const rawPlayerB = rawMatchParts[1] ?? '';
    const sourcePlayerResolveA = resolvePlayer(rawPlayerA, undefined, players, playersByLeague, normalizedNameIndex);
    const sourcePlayerResolveB = resolvePlayer(rawPlayerB, undefined, players, playersByLeague, normalizedNameIndex);

    if (!token) {
      invalidTokens += 1;
      issues.push(`invalid_token: ${row.resultRaw}`);
    }

    if (rawMatchParts.length !== 2) {
      issues.push('invalid_match_format');
    }

    const maybeLeagueId = resolveLeagueId(row.sectionTitle, rawPlayerA, rawPlayerB, sourcePlayerResolveA.resolved?.player, sourcePlayerResolveB.resolved?.player);
    const leagueId = maybeLeagueId;

    const playerAResolve = resolvePlayer(rawPlayerA, leagueId, players, playersByLeague, normalizedNameIndex);
    const playerBResolve = resolvePlayer(rawPlayerB, leagueId, players, playersByLeague, normalizedNameIndex);

    issues.push(...playerAResolve.issues, ...playerBResolve.issues);

    const resolvedPlayerA = playerAResolve.resolved?.player;
    const resolvedPlayerB = playerBResolve.resolved?.player;

    if (leagueId) {
      const leagueSummary = getLeagueSummary(leagueId);
      leagueSummary.rowsInSource += 1;
    }

    if (!resolvedPlayerA || !resolvedPlayerB) {
      unresolvedPlayers += 1;
    }

    const resolvedLeagueId = leagueId ?? resolvedPlayerA?.leagueId ?? resolvedPlayerB?.leagueId;

    if (!resolvedLeagueId) {
      issues.push('unresolved_league');
    } else if (resolvedPlayerA && resolvedPlayerA.leagueId !== resolvedLeagueId) {
      issues.push(`league_mismatch: ${resolvedPlayerA.name}`);
    } else if (resolvedPlayerB && resolvedPlayerB.leagueId !== resolvedLeagueId) {
      issues.push(`league_mismatch: ${resolvedPlayerB.name}`);
    }

    let resolvedMatch: Match | undefined;
    if (resolvedLeagueId && resolvedPlayerA && resolvedPlayerB) {
      const matchResolution = findMatch(resolvedLeagueId, resolvedPlayerA, resolvedPlayerB, matches);
      issues.push(...matchResolution.issues);
      resolvedMatch = matchResolution.match;
    } else {
      issues.push('no_matching_match');
    }

    if (!resolvedMatch) {
      unresolvedMatches += 1;
    }

    const normalizedToken = token ?? null;
    const approvedMatch = resolvedMatch ? approvedResultByMatchId.get(resolvedMatch.id) : undefined;
    const updatedMatch = resolvedMatch ? updatedMatchesById.get(resolvedMatch.id) : undefined;

    if (approvedMatch) {
      if (updatedMatch) {
        updatedMatch.status = 'approved';
        updatedMatch.resultId = approvedMatch.id;
      }
      skippedAlreadyApproved += 1;
      if (resolvedLeagueId) {
        getLeagueSummary(resolvedLeagueId).skippedAlreadyApproved += 1;
      }
      continue;
    }

    if (!token || !resolvedMatch || !resolvedPlayerA || !resolvedPlayerB || issues.length > 0) {
      const reviewRecord: ReviewRecord = {
        sectionTitle: row.sectionTitle,
        matchRaw: row.matchRaw,
        resultRaw: row.resultRaw,
        normalizedToken,
        resolvedLeagueId,
        resolvedPlayer1Id: resolvedPlayerA?.id,
        resolvedPlayer2Id: resolvedPlayerB?.id,
        resolvedMatchId: resolvedMatch?.id,
        status: 'needs_review',
        issues: [...new Set(issues)],
      };
      reviewRows.push(reviewRecord);
      if (resolvedLeagueId) {
        getLeagueSummary(resolvedLeagueId).reviewRows += 1;
      }
      continue;
    }

    const sourceReference = buildSourceReference(row.sectionTitle, row.matchRaw, row.resultRaw, resolvedLeagueId, resolvedMatch.id);
    const sourceSheet = leagueById.get(resolvedMatch.leagueId)?.sheetName ?? row.sectionTitle;
    const officialResult = toOfficialResult({
      sectionTitle: sourceSheet,
      match: resolvedMatch,
      sourcePlayerA: resolvedPlayerA,
      sourcePlayerB: resolvedPlayerB,
      sourceToken: token,
      importedAt,
      sourceReference,
    });

    appendedResults.push(officialResult);
    results.push(officialResult);
    if (updatedMatch) {
      updatedMatch.status = 'approved';
      updatedMatch.resultId = officialResult.id;
    }

    if (resolvedLeagueId) {
      getLeagueSummary(resolvedLeagueId).appendedOfficialResults += 1;
    }
  }

  const sortedResults = results;
  const report: Report = {
    sourceFile: SOURCE_FILE,
    importedAt,
    totalRows: curatedRows.length,
    parsedRows: curatedRows.length,
    appendedOfficialResults: appendedResults.length,
    skippedAlreadyApproved,
    reviewRows: reviewRows.length,
    unresolvedPlayers,
    unresolvedMatches,
    invalidTokens,
    perLeagueSummary: [...perLeagueSummary.entries()]
      .map(([leagueId, summary]) => ({
        leagueId,
        ...summary,
      }))
      .sort((a, b) => (leagueById.get(a.leagueId)?.name ?? a.leagueId).localeCompare(leagueById.get(b.leagueId)?.name ?? b.leagueId)),
  };

  await mkdir(path.dirname(RESULTS_FILE), { recursive: true });
  await Promise.all([
    writeFile(RESULTS_FILE, `${JSON.stringify(sortedResults, null, 2)}\n`, 'utf8'),
    writeFile(MATCHES_FILE, `${JSON.stringify(updatedMatches, null, 2)}\n`, 'utf8'),
    writeFile(REVIEW_FILE, `${JSON.stringify(reviewRows, null, 2)}\n`, 'utf8'),
    writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
  ]);

  console.log(`Imported rows: ${report.totalRows}`);
  console.log(`Appended official results: ${report.appendedOfficialResults}`);
  console.log(`Skipped already approved: ${report.skippedAlreadyApproved}`);
  console.log(`Review rows: ${report.reviewRows}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
