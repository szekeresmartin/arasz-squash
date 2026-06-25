import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trophy, X } from 'lucide-react';
import { DIJAZOTTAK_GALLERY, HISTORY_LEAGUES, HISTORY_SEASONS, HistoryLeague } from '../data/leagueHistory';

type SeasonRow = {
  league: string;
  first: string | null;
  second: string | null;
};

function LeagueTable({ rows, seasonLabel }: { rows: SeasonRow[]; seasonLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[780px] w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600">
              Liga
            </th>
            <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600">
              1. hely
            </th>
            <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600">
              2. hely
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.league} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
              <th className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-4 py-4 text-left font-semibold text-slate-950">
                {row.league}
              </th>
              <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                {row.first ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 ring-1 ring-amber-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold text-amber-950">
                      1
                    </span>
                    <span>{row.first}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="border-b border-slate-100 px-4 py-4 align-top text-slate-700">
                {row.second ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-900 ring-1 ring-slate-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[11px] font-bold text-slate-950">
                      2
                    </span>
                    <span>{row.second}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LeagueHistory() {
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(HISTORY_SEASONS.length - 1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const selectedSeasonLabel = HISTORY_SEASONS[selectedSeasonIndex];

  const selectedRows = useMemo<SeasonRow[]>(
    () => HISTORY_LEAGUES
      .map((league) => ({
        league: league.title,
        first: league.placements[0]?.values[selectedSeasonIndex] ?? null,
        second: league.placements[1]?.values[selectedSeasonIndex] ?? null,
      }))
      .filter((row) => Boolean(row.first || row.second)),
    [selectedSeasonIndex],
  );

  useEffect(() => {
    if (selectedImageIndex === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImageIndex(null);
      }

      if (event.key === 'ArrowLeft') {
        setSelectedImageIndex((current) => {
          if (current === null) return current;
          return (current - 1 + DIJAZOTTAK_GALLERY.length) % DIJAZOTTAK_GALLERY.length;
        });
      }

      if (event.key === 'ArrowRight') {
        setSelectedImageIndex((current) => {
          if (current === null) return current;
          return (current + 1) % DIJAZOTTAK_GALLERY.length;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImageIndex]);

  return (
    <div className="mx-auto max-w-7xl pb-16 animate-fadeIn space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-teal-800 to-cyan-700 px-6 py-10 sm:px-10 sm:py-14 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px] opacity-30" />
        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur">
              Eddigi bajnokaink
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur">
              Díjazottak
            </span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Liga története
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
            Arasz-Öntöde Squash liga díjazottak és játékosok közös pillanatai
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Liga történelem</h2>
                <p className="text-sm text-slate-500">Eddigi bajnokok és második helyezettek ligánként.</p>
              </div>
            </div>
          </div>

          <div className="lg:min-w-[280px]">
            <label className="mb-2 block text-xs font-mono font-semibold uppercase tracking-widest text-slate-500" htmlFor="season-select">
              Hányadik liga
            </label>
            <select
              id="season-select"
              value={selectedSeasonIndex}
              onChange={(event) => setSelectedSeasonIndex(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white"
            >
              {HISTORY_SEASONS.map((season, index) => (
                <option key={season} value={index}>
                  {season}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Alapértelmezetten a legutóbbi sorozat jelenik meg.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-950">{selectedSeasonLabel}</h3>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              {HISTORY_LEAGUES.length} liga
            </div>
          </div>
          <LeagueTable rows={selectedRows} seasonLabel={selectedSeasonLabel} />
        </div>

      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Galéria</h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {DIJAZOTTAK_GALLERY.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              aria-label={`Kép megnyitása ${index + 1}.`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={image.src}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-300 group-hover:bg-slate-950/10" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Díjazottak képgaléria"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
            <div
              className="relative w-full max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImageIndex(null)}
                className="absolute -top-3 -right-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-900 shadow-lg"
                aria-label="Bezárás"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative overflow-hidden rounded-3xl bg-black shadow-2xl">
                <img
                  src={DIJAZOTTAK_GALLERY[selectedImageIndex].src}
                  alt=""
                  className="max-h-[80vh] w-full object-contain"
                />

                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(
                      (current) => (current === null ? current : (current - 1 + DIJAZOTTAK_GALLERY.length) % DIJAZOTTAK_GALLERY.length),
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg hover:bg-white"
                  aria-label="Előző kép"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(
                      (current) => (current === null ? current : (current + 1) % DIJAZOTTAK_GALLERY.length),
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg hover:bg-white"
                  aria-label="Következő kép"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-white/85">
                <p className="text-sm font-semibold">
                  {selectedImageIndex + 1} / {DIJAZOTTAK_GALLERY.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
