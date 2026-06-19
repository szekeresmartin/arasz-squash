import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export type ResultStatus = 'approved';
export type MatchStatus = 'scheduled' | 'approved';
export type ResultKind = 'score' | 'walkover';

export interface League {
  id: string;
  sheetName: string;
  name: string;
  classLabel: '1. osztály' | '2. osztály' | '3. osztály' | '4. osztály' | '5. osztály';
  order: number;
  playerCount: number;
}

export interface Player {
  id: string;
  leagueId: string;
  name: string;
  sourceSheetName: string;
  headerCell: string;
  rowCell: string;
  order: number;
  active: boolean;
}

export interface Match {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  sourceCell: string;
  reverseSourceCell?: string;
  status: MatchStatus;
  resultId?: string;
}

export interface Result {
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
  kind: ResultKind;
  status: ResultStatus;
  playedOnCourt?: boolean;
  isForfeit?: boolean;
}

export interface StandingRow {
  leagueId: string;
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDifference: number;
  basePoints: number;
  rankingScore: number;
  position: number;
}

export interface LeagueImportReport {
  sheetName: string;
  realPlayers: number;
  placeholderCells: number;
  matches: number;
  rawFilledResultCells: number;
  approvedResults: number;
  conflictCells: Array<{
    sourceCells: string[];
    rawHomeToken: string;
    rawAwayToken?: string;
    reason: string;
  }>;
  unknownTokens: Array<{
    cell: string;
    value: string;
    reason: string;
  }>;
  skippedCells: Array<{
    cell: string;
    value: string;
    reason: string;
  }>;
}

export interface ImportReport {
  sourceFile: string;
  importedAt: string;
  leagues: LeagueImportReport[];
  totals: {
    leagues: number;
    players: number;
    matches: number;
    approvedResults: number;
    placeholderCells: number;
    rawFilledResultCells: number;
    conflictCells: number;
    unknownTokens: number;
  };
}

type LeagueConfig = {
  id: string;
  sheetName: string;
  name: string;
  classLabel: League['classLabel'];
  order: number;
  headerStartCol: string;
  headerEndCol: string;
  summaryStartCol: string;
  rowStart: number;
  rowEnd: number;
};

const LEAGUE_CONFIGS: LeagueConfig[] = [
  {
    id: 'league-a',
    sheetName: 'A liga',
    name: 'A liga',
    classLabel: '1. osztály',
    order: 1,
    headerStartCol: 'B',
    headerEndCol: 'K',
    summaryStartCol: 'L',
    rowStart: 4,
    rowEnd: 33,
  },
  {
    id: 'league-b',
    sheetName: 'B liga',
    name: 'B liga',
    classLabel: '2. osztály',
    order: 2,
    headerStartCol: 'B',
    headerEndCol: 'K',
    summaryStartCol: 'L',
    rowStart: 4,
    rowEnd: 33,
  },
  {
    id: 'league-c',
    sheetName: 'C liga',
    name: 'C liga',
    classLabel: '3. osztály',
    order: 3,
    headerStartCol: 'B',
    headerEndCol: 'L',
    summaryStartCol: 'M',
    rowStart: 4,
    rowEnd: 36,
  },
  {
    id: 'league-d',
    sheetName: 'D liga',
    name: 'D liga',
    classLabel: '4. osztály',
    order: 4,
    headerStartCol: 'B',
    headerEndCol: 'L',
    summaryStartCol: 'M',
    rowStart: 4,
    rowEnd: 36,
  },
  {
    id: 'league-e',
    sheetName: 'E liga',
    name: 'E liga',
    classLabel: '5. osztály',
    order: 5,
    headerStartCol: 'B',
    headerEndCol: 'J',
    summaryStartCol: 'K',
    rowStart: 4,
    rowEnd: 30,
  },
];

const XLSX_CANDIDATES = [
  path.join('data', 'raw', '0612_15_arasz_ontode_liga.xlsx'),
  path.join('data', 'raw', 'arasz-ontode-liga-2026.xlsx'),
];

function isPlaceholderValue(value: string | undefined): boolean {
  if (value === undefined || value === null) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  return (
    lower === '0' ||
    lower === 'null' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === '-' ||
    lower === '—' ||
    lower === 'placeholder'
  );
}

function isPlayerName(value: string | undefined): boolean {
  if (isPlaceholderValue(value)) return false;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('összpont') || lower.includes('helyezés') || lower === 'győze-lem') return false;
  return /[\p{L}]/u.test(trimmed);
}

function colToNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.toUpperCase().charCodeAt(0) - 64);
  return n;
}

function numToCol(n: number): string {
  let out = '';
  let current = n;
  while (current > 0) {
    const rem = (current - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    current = Math.floor((current - 1) / 26);
  }
  return out;
}

function cellRef(col: string, row: number): string {
  return `${col}${row}`;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number.parseInt(dec, 10)));
}

function escapeJsonString(value: string): string {
  return JSON.stringify(value);
}

function readZipEntry(zipPath: string, entryPath: string): string {
  return execFileSync('unzip', ['-p', zipPath, entryPath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseAttributes(fragment: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const regex = /([A-Za-z_:@][A-Za-z0-9_:\-@.]*)="([^"]*)"/g;
  for (const match of fragment.matchAll(regex)) {
    attributes[match[1]] = decodeXml(match[2]);
  }
  return attributes;
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const sharedStringRegex = /<si\b[\s\S]*?<\/si>/g;
  for (const sharedStringMatch of xml.matchAll(sharedStringRegex)) {
    const chunk = sharedStringMatch[0];
    const textParts: string[] = [];
    for (const textMatch of chunk.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) {
      textParts.push(decodeXml(textMatch[1]));
    }
    out.push(textParts.join(''));
  }
  return out;
}

function parseWorkbookSheetTargets(workbookXml: string, relsXml: string): Array<{ name: string; target: string }> {
  const rels: Record<string, string> = {};
  for (const relMatch of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = parseAttributes(relMatch[1]);
    if (attrs.Id && attrs.Target) {
      rels[attrs.Id] = attrs.Target;
    }
  }

  const sheets: Array<{ name: string; target: string }> = [];
  for (const sheetMatch of workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const attrs = parseAttributes(sheetMatch[1]);
    const relId = attrs['r:id'];
    if (attrs.name && relId && rels[relId]) {
      sheets.push({ name: attrs.name, target: rels[relId] });
    }
  }
  return sheets;
}

type ParsedCell = {
  ref: string;
  col: number;
  row: number;
  value: string;
};

type ParsedSheet = {
  cellsByRef: Map<string, ParsedCell>;
  valuesByRow: Map<number, Map<number, string>>;
};

function parseSheetXml(xml: string, sharedStrings: string[]): ParsedSheet {
  const cellsByRef = new Map<string, ParsedCell>();
  const valuesByRow = new Map<number, Map<number, string>>();

  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowAttrs = parseAttributes(rowMatch[1]);
    const rowIndex = Number(rowAttrs.r);
    const rowBody = rowMatch[2];
    const rowCells = new Map<number, string>();

    for (const cellMatch of rowBody.matchAll(/<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrFragment = cellMatch[1] ?? cellMatch[2] ?? '';
      const cellBody = cellMatch[3] ?? '';
      const cellAttrs = parseAttributes(attrFragment);
      const ref = cellAttrs.r;
      if (!ref) continue;
      const match = /^([A-Z]+)(\d+)$/.exec(ref);
      if (!match) continue;
      const col = colToNum(match[1]);
      const row = Number(match[2]);
      const type = cellAttrs.t;
      let value = '';

      if (type === 's') {
        const shared = /<v>([\s\S]*?)<\/v>/.exec(cellBody)?.[1];
        if (shared !== undefined) {
          value = sharedStrings[Number(shared)] ?? '';
        }
      } else if (type === 'inlineStr') {
        const texts = [...cellBody.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(matchItem => decodeXml(matchItem[1]));
        value = texts.join('');
      } else if (type === 'b') {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(cellBody)?.[1];
        value = raw === '1' ? 'TRUE' : 'FALSE';
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(cellBody)?.[1];
        if (raw !== undefined) {
          value = raw;
        } else {
          const texts = [...cellBody.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(matchItem => decodeXml(matchItem[1]));
          value = texts.join('');
        }
      }

      const decodedValue = decodeXml(value);
      const cell: ParsedCell = { ref, col, row, value: decodedValue };
      cellsByRef.set(ref, cell);
      rowCells.set(col, decodedValue);
    }

    valuesByRow.set(rowIndex, rowCells);
  }

  return { cellsByRef, valuesByRow };
}

function getCellValue(valuesByRow: Map<number, Map<number, string>>, row: number, col: number | string): string {
  const colIndex = typeof col === 'number' ? col : colToNum(col);
  return valuesByRow.get(row)?.get(colIndex) ?? '';
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getLeagueActiveNames(sheet: ParsedSheet, config: LeagueConfig): string[] {
  const row1 = sheet.valuesByRow.get(1) ?? new Map<number, string>();
  const headerNames: string[] = [];
  for (let col = colToNum(config.headerStartCol); col <= colToNum(config.summaryStartCol) - 1; col += 1) {
    const value = row1.get(col);
    if (isPlayerName(value)) {
      headerNames.push(normalizeName(value));
    }
  }

  const rowNames: string[] = [];
  for (let row = config.rowStart; row <= config.rowEnd; row += 3) {
    const value = getCellValue(sheet.valuesByRow, row, 'A');
    if (isPlayerName(value)) {
      rowNames.push(normalizeName(value));
    }
  }

  const rowNameSet = new Set(rowNames);
  const activeNames = headerNames.filter(name => rowNameSet.has(name));
  for (const rowName of rowNames) {
    if (!activeNames.includes(rowName)) {
      activeNames.push(rowName);
    }
  }
  return activeNames;
}

function isMirroredResult(
  forward: { player1Sets: number; player2Sets: number; kind: ResultKind },
  reverse: { player1Sets: number; player2Sets: number; kind: ResultKind },
): boolean {
  return (
    forward.player1Sets === reverse.player2Sets &&
    forward.player2Sets === reverse.player1Sets &&
    forward.kind === reverse.kind
  );
}

function normalizeTokenForMatchOrientation(
  parsed: { player1Sets: number; player2Sets: number; kind: ResultKind },
  orientation: 'forward' | 'reverse',
): { normalizedSetsWon: number; normalizedSetsLost: number; kind: ResultKind } {
  if (orientation === 'forward') {
    return {
      normalizedSetsWon: parsed.player1Sets,
      normalizedSetsLost: parsed.player2Sets,
      kind: parsed.kind,
    };
  }

  return {
    normalizedSetsWon: parsed.player2Sets,
    normalizedSetsLost: parsed.player1Sets,
    kind: parsed.kind,
  };
}

function getBasePointsForPlayer(normalizedSetsWon: number, normalizedSetsLost: number, kind: ResultKind): number {
  if (kind === 'walkover') {
    if (normalizedSetsWon > normalizedSetsLost) return 5;
    return 0;
  }

  if (normalizedSetsWon > normalizedSetsLost) {
    return 5;
  }

  if (normalizedSetsLost > normalizedSetsWon) {
    return normalizedSetsWon + 1;
  }

  return 0;
}

function getMatchBasePoints(
  normalizedSetsWon: number,
  normalizedSetsLost: number,
  kind: ResultKind,
): { player1Points: number; player2Points: number } {
  const player1Points = getBasePointsForPlayer(normalizedSetsWon, normalizedSetsLost, kind);
  const player2Points = getBasePointsForPlayer(normalizedSetsLost, normalizedSetsWon, kind);
  return { player1Points, player2Points };
}

function createId(prefix: string, ...parts: Array<string | number>): string {
  const slug = parts
    .map(part => String(part))
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${prefix}-${slug}`;
}

function parseResultToken(rawValue: string): { player1Sets: number; player2Sets: number; kind: ResultKind } | null {
  const token = rawValue.replace(/\s+/g, '');
  const scoreMatch = /^(\d+)\/(\d+)$/.exec(token);
  if (scoreMatch) {
    return {
      player1Sets: Number(scoreMatch[1]),
      player2Sets: Number(scoreMatch[2]),
      kind: 'score',
    };
  }

  const walkoverPlayer1 = /^(\d+)\/-$/.exec(token);
  if (walkoverPlayer1) {
    return {
      player1Sets: Number(walkoverPlayer1[1]),
      player2Sets: 0,
      kind: 'walkover',
    };
  }

  const walkoverPlayer2 = /^-\/(\d+)$/.exec(token);
  if (walkoverPlayer2) {
    return {
      player1Sets: 0,
      player2Sets: Number(walkoverPlayer2[1]),
      kind: 'walkover',
    };
  }

  return null;
}

function buildLeagueImport(
  sheet: ParsedSheet,
  config: LeagueConfig,
): {
  league: League;
  players: Player[];
  matches: Match[];
  results: Result[];
  warnings: string[];
  report: LeagueImportReport;
} {
  const headerRow = sheet.valuesByRow.get(1) ?? new Map<number, string>();
  const headerNames: string[] = [];
  const placeholderCells: LeagueImportReport['skippedCells'] = [];

  for (let col = colToNum(config.headerStartCol); col <= colToNum(config.summaryStartCol) - 1; col += 1) {
    const cell = `${numToCol(col)}1`;
    const value = headerRow.get(col) ?? '';
    if (isPlayerName(value)) {
      headerNames.push(normalizeName(value));
    } else {
      placeholderCells.push({
        cell,
        value,
        reason: isPlaceholderValue(value) ? 'placeholder-player-slot' : 'non-player-header-cell',
      });
    }
  }

  const rowNames: string[] = [];
  for (let row = config.rowStart; row <= config.rowEnd; row += 3) {
    const cell = `A${row}`;
    const value = getCellValue(sheet.valuesByRow, row, 'A');
    if (isPlayerName(value)) {
      rowNames.push(normalizeName(value));
    } else {
      placeholderCells.push({
        cell,
        value,
        reason: isPlaceholderValue(value) ? 'placeholder-player-slot' : 'non-player-row-cell',
      });
    }
  }

  const activeNames = headerNames.filter(name => rowNames.includes(name));
  for (const rowName of rowNames) {
    if (!activeNames.includes(rowName)) {
      activeNames.push(rowName);
    }
  }

  const league: League = {
    id: config.id,
    sheetName: config.sheetName,
    name: config.name,
    classLabel: config.classLabel,
    order: config.order,
    playerCount: activeNames.length,
  };

  const playerByName = new Map<string, Player>();
  const players: Player[] = [];
  activeNames.forEach((name, index) => {
    const player: Player = {
      id: createId('player', config.id, index + 1, name),
      leagueId: config.id,
      name,
      sourceSheetName: config.sheetName,
      headerCell: `${numToCol(colToNum(config.headerStartCol) + index)}1`,
      rowCell: `A${config.rowStart + index * 3}`,
      order: index + 1,
      active: true,
    };
    players.push(player);
    playerByName.set(name, player);
  });

  const matches: Match[] = [];
  const results: Result[] = [];
  const warnings: string[] = [];
  const conflictCells: LeagueImportReport['conflictCells'] = [];
  const unknownTokens: LeagueImportReport['unknownTokens'] = [];
  let rawFilledResultCells = 0;
  let approvedResults = 0;

  for (let i = 0; i < activeNames.length; i += 1) {
    for (let j = i + 1; j < activeNames.length; j += 1) {
      const player1Name = activeNames[i];
      const player2Name = activeNames[j];
      const player1 = playerByName.get(player1Name);
      const player2 = playerByName.get(player2Name);
      if (!player1 || !player2) continue;

      const forwardCell = `${numToCol(colToNum(config.headerStartCol) + j)}${config.rowStart + i * 3}`;
      const reverseCell = `${numToCol(colToNum(config.headerStartCol) + i)}${config.rowStart + j * 3}`;
      const forwardValue = getCellValue(sheet.valuesByRow, config.rowStart + i * 3, numToCol(colToNum(config.headerStartCol) + j));
      const reverseValue = getCellValue(sheet.valuesByRow, config.rowStart + j * 3, numToCol(colToNum(config.headerStartCol) + i));
      const forwardToken = forwardValue.trim();
      const reverseToken = reverseValue.trim();

      const forwardParsed = forwardToken ? parseResultToken(forwardToken) : null;
      const reverseParsed = reverseToken ? parseResultToken(reverseToken) : null;
      const matchId = createId('match', config.id, i + 1, j + 1, player1.name, player2.name);

      if (forwardToken) {
        rawFilledResultCells += 1;
        if (!forwardParsed) {
          unknownTokens.push({
            cell: forwardCell,
            value: forwardToken,
            reason: 'unparseable-result-token',
          });
        }
      }
      if (reverseToken) {
        rawFilledResultCells += 1;
        if (!reverseParsed) {
          unknownTokens.push({
            cell: reverseCell,
            value: reverseToken,
            reason: 'unparseable-result-token',
          });
        }
      }

      const hasForward = forwardParsed !== null;
      const hasReverse = reverseParsed !== null;
      const mirrored = Boolean(forwardParsed && reverseParsed && isMirroredResult(forwardParsed, reverseParsed));

      if (hasForward && hasReverse) {
        if (!mirrored) {
          const conflictReason = `conflicting-mirror-values`;
          warnings.push(
            `Conflicting duplicate results in ${config.sheetName} for ${player1.name} vs ${player2.name} (${forwardCell}=${forwardToken}, ${reverseCell}=${reverseToken})`,
          );
          conflictCells.push({
            sourceCells: [forwardCell, reverseCell],
            rawHomeToken: forwardToken,
            rawAwayToken: reverseToken,
            reason: conflictReason,
          });
        } else {
          placeholderCells.push({
            cell: reverseCell,
            value: reverseToken,
            reason: 'deduplicated-mirror-cell',
          });
        }
      }

      const selected = hasForward ? forwardParsed : hasReverse ? reverseParsed : null;
      const selectedCell = hasForward ? forwardCell : hasReverse ? reverseCell : forwardCell;
      const selectedOrientation = hasForward ? 'forward' : 'reverse';
      const normalizedSelected = selected ? normalizeTokenForMatchOrientation(selected, selectedOrientation) : null;

      const match: Match = {
        id: matchId,
        leagueId: config.id,
        player1Id: player1.id,
        player2Id: player2.id,
        sourceCell: selectedCell,
        reverseSourceCell: hasForward && hasReverse ? (selectedCell === forwardCell ? reverseCell : forwardCell) : undefined,
        status: 'scheduled',
        resultId: undefined,
      };

      if (selected && normalizedSelected && (hasForward === false || hasReverse === false || mirrored)) {
        const resultId = createId('result', config.id, i + 1, j + 1, player1.name, player2.name);
        match.status = 'approved';
        match.resultId = resultId;
        const result: Result = {
          id: resultId,
          leagueId: config.id,
          matchId,
          player1Id: player1.id,
          player2Id: player2.id,
          sourceSheet: config.sheetName,
          sourceCells: hasForward && hasReverse ? [selectedCell, selectedCell === forwardCell ? reverseCell : forwardCell] : [selectedCell],
          rawHomeToken: selectedCell === forwardCell ? forwardToken : reverseToken,
          rawAwayToken: hasForward && hasReverse ? (selectedCell === forwardCell ? reverseToken : forwardToken) : undefined,
          normalizedSetsWon: normalizedSelected.normalizedSetsWon,
          normalizedSetsLost: normalizedSelected.normalizedSetsLost,
          kind: normalizedSelected.kind,
          status: 'approved',
        };
        results.push(result);
        approvedResults += 1;
      }

      matches.push(match);
    }
  }

  return {
    league,
    players,
    matches,
    results,
    warnings,
    report: {
      sheetName: config.sheetName,
      realPlayers: activeNames.length,
      placeholderCells: placeholderCells.filter(entry => entry.reason.includes('placeholder')).length,
      matches: matches.length,
      rawFilledResultCells,
      approvedResults,
      conflictCells,
      unknownTokens,
      skippedCells: placeholderCells,
    },
  };
}

export function calculateStandings(players: Player[], matches: Match[], results: Result[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  for (const player of players) {
    rows.set(player.id, {
      leagueId: player.leagueId,
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
    });
  }

  const approvedResultByMatchId = new Map(results.filter(result => result.status === 'approved').map(result => [result.matchId, result]));

  for (const match of matches) {
    const result = approvedResultByMatchId.get(match.id);
    if (!result) continue;

    const row1 = rows.get(result.player1Id);
    const row2 = rows.get(result.player2Id);
    if (!row1 || !row2) continue;

    row1.matchesPlayed += 1;
    row2.matchesPlayed += 1;
    if (result.kind !== 'walkover') {
      row1.setsWon += result.normalizedSetsWon;
      row1.setsLost += result.normalizedSetsLost;
      row2.setsWon += result.normalizedSetsLost;
      row2.setsLost += result.normalizedSetsWon;
    }

    const points = getMatchBasePoints(result.normalizedSetsWon, result.normalizedSetsLost, result.kind);
    row1.basePoints += points.player1Points;
    row2.basePoints += points.player2Points;

    if (result.normalizedSetsWon > result.normalizedSetsLost) {
      row1.wins += 1;
      row2.losses += 1;
    } else if (result.normalizedSetsLost > result.normalizedSetsWon) {
      row2.wins += 1;
      row1.losses += 1;
    }
  }

  const standings = [...rows.values()].map(row => ({
    ...row,
    setDifference: row.setsWon - row.setsLost,
    rankingScore: row.basePoints * 1_000_000 + row.wins * 10_000 + (row.setsWon - row.setsLost) * 100 + row.setsWon,
  }));

  const getHeadToHeadWinner = (playerAId: string, playerBId: string) => {
    const directResults = results.filter(result => {
      const pairMatches =
        (result.player1Id === playerAId && result.player2Id === playerBId) ||
        (result.player1Id === playerBId && result.player2Id === playerAId);
      return result.status === 'approved' && pairMatches;
    });

    if (directResults.length !== 1) {
      return null;
    }

    const result = directResults[0];
    if (result.normalizedSetsWon === result.normalizedSetsLost) {
      return null;
    }

    const winnerId = result.normalizedSetsWon > result.normalizedSetsLost ? result.player1Id : result.player2Id;
    return winnerId === playerAId ? playerAId : winnerId === playerBId ? playerBId : null;
  };

  standings.sort((a, b) => {
    if (b.basePoints !== a.basePoints) return b.basePoints - a.basePoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if ((b.setsWon - b.setsLost) !== (a.setsWon - a.setsLost)) return (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost);
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    const headToHeadWinner = getHeadToHeadWinner(a.playerId, b.playerId);
    if (headToHeadWinner === a.playerId) return -1;
    if (headToHeadWinner === b.playerId) return 1;
    // TODO: többes holtverseny esetén lehet, hogy admin döntésre lesz szükség.
    return a.playerName.localeCompare(b.playerName, 'hu');
  });

  standings.forEach((row, index) => {
    row.position = index + 1;
  });

  return standings;
}

export function findExcelSourcePath(): string {
  for (const candidate of XLSX_CANDIDATES) {
    try {
      if (existsSync(candidate)) {
        return candidate;
      }
    } catch {
      continue;
    }
  }
  return XLSX_CANDIDATES[0];
}

export async function loadWorkbookData(xlsxPath: string) {
  const workbookXml = readZipEntry(xlsxPath, 'xl/workbook.xml');
  const relsXml = readZipEntry(xlsxPath, 'xl/_rels/workbook.xml.rels');
  const sharedStringsXml = (() => {
    try {
      return readZipEntry(xlsxPath, 'xl/sharedStrings.xml');
    } catch {
      return '';
    }
  })();
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : [];
  const sheets = parseWorkbookSheetTargets(workbookXml, relsXml);
  const configByName = new Map(LEAGUE_CONFIGS.map(config => [config.sheetName, config]));
  const data = new Map<string, ParsedSheet>();

  for (const sheet of sheets) {
    const config = configByName.get(sheet.name);
    if (!config) continue;
    const sheetXml = readZipEntry(xlsxPath, `xl/${sheet.target}`);
    data.set(sheet.name, parseSheetXml(sheetXml, sharedStrings));
  }

  return { sheets, data };
}

export async function importExcelWorkbook(xlsxPath: string) {
  const { data } = await loadWorkbookData(xlsxPath);
  const leagues: League[] = [];
  const players: Player[] = [];
  const matches: Match[] = [];
  const results: Result[] = [];
  const warnings: string[] = [];
  const leagueReports: LeagueImportReport[] = [];

  for (const config of LEAGUE_CONFIGS) {
    const sheet = data.get(config.sheetName);
    if (!sheet) {
      warnings.push(`Missing sheet: ${config.sheetName}`);
      continue;
    }
    const imported = buildLeagueImport(sheet, config);
    leagues.push(imported.league);
    players.push(...imported.players);
    matches.push(...imported.matches);
    results.push(...imported.results);
    warnings.push(...imported.warnings);
    leagueReports.push(imported.report);
  }

  const report: ImportReport = {
    sourceFile: xlsxPath,
    importedAt: new Date().toISOString(),
    leagues: leagueReports,
    totals: {
      leagues: leagues.length,
      players: players.length,
      matches: matches.length,
      approvedResults: results.filter(result => result.status === 'approved').length,
      placeholderCells: leagueReports.reduce((sum, league) => sum + league.placeholderCells, 0),
      rawFilledResultCells: leagueReports.reduce((sum, league) => sum + league.rawFilledResultCells, 0),
      conflictCells: leagueReports.reduce((sum, league) => sum + league.conflictCells.length, 0),
      unknownTokens: leagueReports.reduce((sum, league) => sum + league.unknownTokens.length, 0),
    },
  };

  return { leagues, players, matches, results, warnings, report };
}

export async function writeJsonFiles(outputDir: string, data: Record<string, unknown>): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  for (const [fileName, value] of Object.entries(data)) {
    const fullPath = path.join(outputDir, fileName);
    await fs.writeFile(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
}
