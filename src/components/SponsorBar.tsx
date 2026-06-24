import React from 'react';
import { Sponsor } from '../types';

interface SponsorBarProps {
  sponsors: Sponsor[];
}

export default function SponsorBar({ sponsors }: SponsorBarProps) {
  const activeSponsors = sponsors.filter(s => s.isActive);

  return (
    <section className="bg-gray-50 border-y border-gray-100 py-12 px-6" id="partners">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-wider text-brand-red uppercase">Együttműködő Feleink</p>
          <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">Partnerek & Támogatók</h3>
          <div className="h-1 w-12 bg-brand-red mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-stretch justify-center">
          {activeSponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center bg-white border border-gray-200/80 rounded-xl p-5 sm:p-6 hover:border-brand-red hover:shadow-md transition-all duration-300 overflow-hidden min-h-28"
              id={`sponsor-card-${sponsor.id}`}
              aria-label={sponsor.name}
              title={sponsor.name}
            >
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${sponsor.colorHex}`} />
              {sponsor.logoPath ? (
                <img
                  src={sponsor.logoPath}
                  alt={sponsor.name}
                  loading="lazy"
                  className="max-h-16 sm:max-h-20 w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="h-16 w-full max-w-36 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
              )}
            </a>
          ))}
        </div>
        
      </div>
    </section>
  );
}
