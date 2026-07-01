import assert from 'node:assert/strict';

import {
  LEAGUE_TAB_IDS,
  getLeaguePath,
  resolveViewFromPath,
  tabParamToState,
  tabStateToParam,
} from '../src/lib/routing';
import { loadLatestPublicResults } from '../src/lib/public-results';
import { loadPublicLeagueData } from '../src/lib/public-leagues';
import {
  getLivePairMatchStatus,
  resetMatchSubmissionOnSupabase,
  submitMatchResultToSupabase,
} from '../src/lib/result-submissions';

function testRoutingHelpers() {
  assert.ok(LEAGUE_TAB_IDS.includes('eredmeny_bekuldese'));
  assert.equal(tabParamToState('eredmeny-bekuldese'), 'eredmeny_bekuldese');
  assert.equal(tabStateToParam('eredmeny_bekuldese'), 'eredmeny-bekuldese');
  const leaguePath = getLeaguePath('league-e', 'eredmeny_bekuldese');
  assert.ok(leaguePath.startsWith('/bajnoksag/'));
  assert.ok(leaguePath.endsWith('?tab=eredmeny-bekuldese'));

  const adminRoute = resolveViewFromPath('/admin', '');
  assert.equal(adminRoute.view, 'admin');
  assert.equal(adminRoute.selectedLeagueId, null);
  assert.equal(adminRoute.selectedSubTab, 'tabella');

  const leaguePathOnly = leaguePath.split('?')[0];
  const leagueRoute = resolveViewFromPath(leaguePathOnly, '?tab=eredmenyek');
  assert.equal(leagueRoute.view, 'leagues');
  assert.equal(leagueRoute.selectedLeagueId, 'league-e');
  assert.equal(leagueRoute.selectedSubTab, 'eredmenyek');
}

function testImportability() {
  assert.equal(typeof loadLatestPublicResults, 'function');
  assert.equal(typeof loadPublicLeagueData, 'function');
  assert.equal(typeof submitMatchResultToSupabase, 'function');
  assert.equal(typeof resetMatchSubmissionOnSupabase, 'function');
  assert.equal(typeof getLivePairMatchStatus, 'function');
}

async function main() {
  testRoutingHelpers();
  testImportability();

  console.log('Smoke checks passed');
}

void main().catch((error) => {
  console.error('Smoke checks failed');
  console.error(error);
  process.exit(1);
});
