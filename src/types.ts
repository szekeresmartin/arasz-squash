export interface Player {
  id: string;
  name: string;
  leagueId?: string;
  order?: number;
  active?: boolean;
  sourceSheetName?: string;
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
  date?: string;
  court?: string; // Pálya vagy Helyszínpl. "1-es pálya"
  status: MatchStatus;
  submittedScore?: MatchScore;
  submitterName?: string;
  submitterContact?: string;
  comment?: string;
  submittedAt?: string;
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
}

export interface Standing {
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
