export type HistoryPlacement = {
  label: string;
  values: Array<string | null>;
};

export type HistoryLeague = {
  id: string;
  title: string;
  shortLabel: string;
  placements: HistoryPlacement[];
};

export type GalleryImage = {
  src: string;
  caption: string;
};

export const HISTORY_SEASONS = [
  '1. liga (29 induló)',
  '2. liga (36 induló)',
  '3. liga (38 induló)',
  '4. liga (43 induló)',
  '5. liga (42 induló)',
  '6. liga (48 induló)',
  '7. Nyári liga',
  '8. liga (40 induló)',
  '9. liga (42 induló)',
  '10. liga (40 induló)',
  '11. liga (36 induló)',
  '12. liga (36 induló)',
  '13. liga (30 induló)',
  '14. liga (40 induló)',
] as const;

export const HISTORY_LEAGUES: HistoryLeague[] = [
  {
    id: 'a',
    title: 'A liga',
    shortLabel: 'A',
    placements: [
      {
        label: '1. hely',
        values: ['Nagy Ferenc', 'Tóth Zoltán', 'Tóth Zoltán', 'Polgár István', 'Tóth Zoltán', 'Tóth Zoltán', 'Tóth Zoltán', 'Tóth Zoltán', 'Tóth Zoltán', 'Weisz György', 'Polgár István', 'Tóth Zoltán', 'Polgár István', 'Marton Zoltán'],
      },
      {
        label: '2. hely',
        values: ['Tóth Zoltán', 'Polgár István', 'Polgár István', 'Sákovics Péter', 'Sákovics Péter', 'Weisz György', 'Polgár István', 'Weisz György', 'Weisz György', 'Tóth Zoltán', 'Weisz György', 'Polgár István', 'Tóth Zoltán', 'Tóth Zoltán'],
      },
      {
        label: '3. hely',
        values: ['Sákovics Péter', 'Weisz György', 'Nagy Ferenc', 'Tóth Zoltán', 'Polgár István', 'Polgár István', 'Sákovics Péter', 'Sákovics Péter', 'Sákovics Péter', 'Sákovics Péter', 'Tóth Zoltán', 'Weisz György', 'Weisz György', 'Polgár István'],
      },
    ],
  },
  {
    id: 'b',
    title: 'B liga',
    shortLabel: 'B',
    placements: [
      {
        label: '1. hely',
        values: ['Nagy Tamás', 'Marton Zoltán', 'Hajdu Péter', 'Nagy Tamás', 'Hajdu Péter', 'Pilhoffer Béla', 'Antal Péter', 'Hajdú Péter', 'Pék Róbert', 'Dombay Miklós', 'Hajdu Péter', 'Nagy Ferenc', 'Sákovics Péter', 'Pék Róbert'],
      },
      {
        label: '2. hely',
        values: ['Pék Róbert', 'Kovács Gábor', 'Tóth István', 'Marton Zoltán', 'Pék Róbert', 'Kovács Gábor', 'Tóth István', 'Dombay Miklós', 'Marton Zoltán', 'Marton Zoltán', 'Nagy Ferenc', 'Markó Zoltán', 'Tóth István', 'Kovács István'],
      },
    ],
  },
  {
    id: 'c',
    title: 'C liga',
    shortLabel: 'C',
    placements: [
      {
        label: '1. hely',
        values: ['Pozsár András', 'Mészáros István', 'Pozsár András', 'Bilics László', 'Antal Péter', 'Kiss Roland', 'Mészáros István', 'Kovács László', 'Kovács Gábor', 'Bilics László', 'Kovács Gábor', 'Tóth István', 'Antal Péter', 'Czupor András'],
      },
      {
        label: '2. hely',
        values: ['Markó Zoltán', 'Csirke Balázs', 'Sebesi Patrik', 'Mészáros István', 'Bikali Balázs', 'Selmeczy Gyula', 'Bikali Balázs', 'Markó Zoltán', 'Bilics László', 'Kulcsár Sándor', 'Markó Zoltán', 'Bikali Balázs', 'Kovács László', 'Varga Lorena'],
      },
    ],
  },
  {
    id: 'd',
    title: 'D liga',
    shortLabel: 'D',
    placements: [
      {
        label: '1. hely',
        values: ['Mészáros István', 'Bognár Barna', 'Cseh Olivér', 'Antal Péter', 'Nagy Zoltán', 'dr. Tóth Ádám', 'Kovács László', 'Székely Árpád', 'Bikali Balázs', 'dr. Tóth Ádám', 'Kovács László', 'Antal Péter', 'Czupos András', 'Fekete Tamás'],
      },
      {
        label: '2. hely',
        values: ['Sebesi Patrik', 'Bartus Péter', 'Szőke Tibor', 'Bikali Balázs', 'Bíró Zoltán', 'Börzsönyi Balázs', 'Dobai László', 'Bíró Zoltán', 'dr. Tóth Ádám', 'Varga Lorena', 'Varga Lorena', 'Székely Árpád', 'Börzsönyi Balázs', 'Varga Tamás'],
      },
    ],
  },
  {
    id: 'e',
    title: 'E liga',
    shortLabel: 'E',
    placements: [
      {
        label: '1. hely',
        values: [null, null, null, 'Nagy Zoltán', 'Börzsönyi Balázs', 'Dobai László', 'Simon Ádám', null, 'Bankits Csaba', 'Tóth Bálint', 'Székely Árpád', 'Börzsönyi Balázs', 'Fekete Tamás', 'Lukács Dániel'],
      },
      {
        label: '2. hely',
        values: [null, null, null, 'Fekete Tamás', 'Varga Tamás', 'Kovács László', 'Makszin Miklós', null, 'Cseh Olivér', 'Cseh Olivr', 'Khmet Alex', 'Czupor András', 'Makszin Miklós', 'Molnár Milán'],
      },
    ],
  },
  {
    id: 'f',
    title: 'F liga',
    shortLabel: 'F',
    placements: [
      {
        label: '1. hely',
        values: [null, null, null, null, null, null, null, null, 'Székely Árpád', 'Bartus Péter', 'Varga Tamás', 'Hatos Balázs', null, null],
      },
      {
        label: '2. hely',
        values: [null, null, null, null, null, null, null, null, 'Simon Ádám', 'Makszin Miklós', 'Hatos Balázs', 'Fekete Tamás', null, null],
      },
    ],
  },
  {
    id: 'g',
    title: 'G liga',
    shortLabel: 'G',
    placements: [
      {
        label: '1. hely',
        values: [null, null, null, null, null, null, null, null, 'Makszin Miklós', 'Varga Tamás', null, null, null, null],
      },
      {
        label: '2. hely',
        values: [null, null, null, null, null, null, null, null, 'Orosz Tamás', 'Hatos Balázs', null, null, null, null],
      },
    ],
  },
];

export const DIJAZOTTAK_GALLERY: GalleryImage[] = [
  { src: new URL('../../data/dijazottak/IMG_2013.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2014.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2015.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2016.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2017.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2018.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2019.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
  { src: new URL('../../data/dijazottak/IMG_2012.JPG', import.meta.url).href, caption: 'Díjazottak csoportkép' },
];
