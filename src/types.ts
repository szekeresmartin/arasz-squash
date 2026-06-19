export interface Player {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  joinDate: string;
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
  date: string;
  court?: string; // Pálya vagy Helyszínpl. "1-es pálya"
  status: MatchStatus;
  submittedScore?: MatchScore;
  submitterName?: string;
  submitterContact?: string;
  comment?: string;
  submittedAt?: string;
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
  points: number;
  form: ('W' | 'L')[];
}

export interface Sponsor {
  id: string;
  name: string;
  logoText: string;
  websiteUrl?: string;
  colorHex: string;
  isActive: boolean;
}
