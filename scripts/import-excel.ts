import path from 'node:path';

import {
  calculateStandings,
  findExcelSourcePath,
  importExcelWorkbook,
  writeJsonFiles,
} from '../src/lib/excel-import.ts';

async function main() {
  const sourcePath = findExcelSourcePath();
  const imported = await importExcelWorkbook(sourcePath);

  const standingsByLeague = new Map<string, ReturnType<typeof calculateStandings>>();
  const output = {
    leagues: imported.leagues,
    players: imported.players,
    matches: imported.matches,
    results: imported.results,
  };

  for (const league of imported.leagues) {
    const leaguePlayers = imported.players.filter(player => player.leagueId === league.id);
    const leagueMatches = imported.matches.filter(match => match.leagueId === league.id);
    const leagueResults = imported.results.filter(result => result.leagueId === league.id);
    standingsByLeague.set(league.id, calculateStandings(leaguePlayers, leagueMatches, leagueResults));
  }

  const outputDir = path.join('data', 'generated');
  await writeJsonFiles(outputDir, {
    'leagues.json': output.leagues,
    'players.json': output.players,
    'matches.json': output.matches,
    'results.json': output.results,
    'import-report.json': imported.report,
  });

  console.log(`Imported from: ${imported.report.sourceFile}`);
  console.log(`Leagues: ${imported.report.totals.leagues}`);
  console.log(`Players: ${imported.report.totals.players}`);
  console.log(`Matches: ${imported.report.totals.matches}`);
  console.log(`Results: ${imported.report.totals.approvedResults}`);

  for (const warning of imported.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  for (const [leagueId, rows] of standingsByLeague) {
    console.log(`Standings ready for ${leagueId}: ${rows.length} rows`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
