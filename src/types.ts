export interface Player {
  id: string;
  name: string;
  leagueId?: string;
  order?: number;
  active?: boolean;
  sourceSheetName?: string;
  headerCell?: string;
  rowCell?: string;
  phone?: string;
  email?: string;
  joinDate?: string;
}

export type MatchStatus = 'Tervezett' | 'Beküldve' | 'Jóváhagyva' | 'Elutasítva';

export interface SetScore {
  player1: number;
  player2: number;
}

export interface MatchScore {
  player1Sets: number;
  player2Sets: number;
  sets: SetScore[];
}

export interface Match {
  id: string;
  leagueId: string;
  round: number; // Forduló száma
  player1Id: string;
  player2Id: string;
  submittedPlayer1Id?: string;
  submittedPlayer2Id?: string;
  date?: string;
  court?: string; // Pálya vagy Helyszínpl. "1-es pálya"
  status: MatchStatus;
  submittedScore?: MatchScore;
  submitterName?: string;
  submitterContact?: string;
  comment?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  sourceCell?: string;
  reverseSourceCell?: string;
  resultId?: string;
  submissionType?: 'planned' | 'custom';
}

export interface League {
  id: string;
  name: string;
  season: string;
  rules: string;
  isActive: boolean;
  playerIds: string[];
  seasonId?: string;
  sheetName?: string;
  classLabel?: string;
  displayOrder?: number;
  playerCount?: number;
}

export interface Standing {
  leagueId?: string;
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
  form: ('W' | 'L')[];
}

export type ResultStatus = 'approved';
export type ResultKind = 'score' | 'walkover';

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
  importedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  source?: string;
  sourceReference?: string;
  normalizedToken?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoText: string;
  logoPath?: string;
  websiteUrl?: string;
  colorHex: string;
  isActive: boolean;
}
