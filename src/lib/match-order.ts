import { Match } from '../types';

export function getMatchDisplayPlayerIds(
  match: Pick<Match, 'player1Id' | 'player2Id' | 'submittedPlayer1Id' | 'submittedPlayer2Id'>,
) {
  return [
    match.submittedPlayer1Id ?? match.player1Id,
    match.submittedPlayer2Id ?? match.player2Id,
  ] as const;
}
