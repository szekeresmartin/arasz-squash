import React from 'react';
import { Sponsor } from '../types';

interface SponsorBarProps {
  sponsors: Sponsor[];
}

export default function SponsorBar({ sponsors }: SponsorBarProps) {
  const activeSponsors = sponsors.filter(s => s.isActive);

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white border-y border-gray-100 py-12 sm:py-14 px-4 sm:px-6" id="partners">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-wider text-brand-red uppercase">Együttműködő Feleink</p>
          <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">Partnerek & Támogatók</h3>
          <div className="h-1 w-12 bg-brand-red mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6 items-center">
          {activeSponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center rounded-2xl px-4 py-5 sm:py-6 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40"
              id={`sponsor-card-${sponsor.id}`}
              aria-label={sponsor.name}
              title={sponsor.name}
            >
              {sponsor.logoPath ? (
                <img
                  src={sponsor.logoPath}
                  alt={sponsor.name}
                  loading="lazy"
                  className="w-auto max-w-full max-h-24 sm:max-h-28 md:max-h-32 object-contain transition-transform duration-200 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-24 sm:h-28 md:h-32 w-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-xs font-mono text-gray-400">
                  {sponsor.name}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
