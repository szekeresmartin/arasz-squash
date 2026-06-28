import { getLeagueBySlug, getLeagueSlug } from '../data';

export type AppView = 'home' | 'leagues' | 'rules' | 'history' | 'admin';

export type LeagueTab = 'tabella' | 'eredmenyek' | 'sorsolas' | 'eredmeny_bekuldese' | 'jatekosok' | 'szabalyok';

export const LEAGUE_TAB_IDS: LeagueTab[] = [
  'tabella',
  'eredmenyek',
  'sorsolas',
  'eredmeny_bekuldese',
  'jatekosok',
  'szabalyok',
];

export function tabParamToState(tab: string | null): LeagueTab {
  if (tab === 'eredmeny-bekuldese') return 'eredmeny_bekuldese';
  if (tab === 'eredmenyek') return 'eredmenyek';
  if (tab === 'sorsolas') return 'sorsolas';
  if (tab === 'jatekosok') return 'jatekosok';
  if (tab === 'szabalyok') return 'szabalyok';
  return 'tabella';
}

export function tabStateToParam(tab: LeagueTab): string {
  if (tab === 'eredmeny_bekuldese') return 'eredmeny-bekuldese';
  return tab;
}

export function getLeaguePath(leagueId: string, tab: LeagueTab = 'tabella'): string {
  return `/bajnoksag/${getLeagueSlug(leagueId)}?tab=${tabStateToParam(tab)}`;
}

export function resolveViewFromPath(path: string, search: string): {
  view: AppView;
  selectedLeagueId: string | null;
  selectedSubTab: LeagueTab;
} {
  const tab = tabParamToState(new URLSearchParams(search).get('tab'));

  if (path === '/admin' || path === '/admin/login') {
    return { view: 'admin', selectedLeagueId: null, selectedSubTab: 'tabella' };
  }

  if (path === '/rules' || path === '/szabalyzat') {
    return { view: 'rules', selectedLeagueId: null, selectedSubTab: 'tabella' };
  }

  if (path === '/ligatortenet' || path === '/liga-tortenet' || path === '/dijazottak') {
    return { view: 'history', selectedLeagueId: null, selectedSubTab: 'tabella' };
  }

  if (path === '/bajnoksag' || path === '/leagues' || path === '/bajnoksagok') {
    return { view: 'leagues', selectedLeagueId: null, selectedSubTab: tab };
  }

  if (path.startsWith('/bajnoksag/')) {
    const slug = path.split('/').filter(Boolean)[1];
    const leagueMeta = slug ? getLeagueBySlug(slug) : undefined;
    return {
      view: 'leagues',
      selectedLeagueId: leagueMeta?.id ?? null,
      selectedSubTab: tab,
    };
  }

  return { view: 'home', selectedLeagueId: null, selectedSubTab: 'tabella' };
}
