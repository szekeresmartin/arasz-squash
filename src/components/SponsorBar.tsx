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

        {/* Desktop view: Single row flex grid, Mobile view: Grid or scrollable wrapper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center">
          {activeSponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.websiteUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center justify-center bg-white border border-gray-200/80 rounded-xl p-5 hover:border-brand-red hover:shadow-md transition-all duration-300 overflow-hidden"
              id={`sponsor-card-${sponsor.id}`}
            >
              {/* Decorative top-line gradient */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${sponsor.colorHex}`} />

              <div className="h-10 flex items-center justify-center">
                <span className="font-display font-extrabold text-lg text-gray-700 group-hover:text-brand-red transition-colors duration-300 text-center uppercase tracking-wide">
                  {sponsor.name.split(' ')[0]}
                  {sponsor.name.includes('.') || sponsor.name.includes('Kft') ? (
                    <span className="text-[10px] lowercase font-normal block text-gray-400 group-hover:text-brand-red/70">
                      {sponsor.name.split(' ').slice(1).join(' ') || 'partner'}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* Subtle hover background highlight details */}
              <div className="mt-2 text-[10px] font-mono text-gray-400 group-hover:text-brand-red/80 transition-colors uppercase">
                {sponsor.name.includes('Fagyi') ? 'fagylaltozó' : sponsor.name.includes('busz') ? 'személyszállítás' : 'támogató'}
              </div>
            </a>
          ))}
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8 font-mono">
          Szeretne Ön is csatlakozni szponzorként? Írjon nekünk az admin@araszontodesquash.hu címen!
        </p>
      </div>
    </section>
  );
}
