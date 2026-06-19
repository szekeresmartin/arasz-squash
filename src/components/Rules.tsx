import React from 'react';
import { Shield, Award, Calendar, ToggleLeft, Heart, Zap, FileText } from 'lucide-react';

interface RulesProps {
  setView: (view: 'home' | 'leagues' | 'rules' | 'admin') => void;
}

export default function Rules({ setView }: RulesProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-16">
      
      {/* Fejléc / Hero */}
      <div className="bg-gradient-to-r from-brand-maroon to-brand-red text-white rounded-3xl p-8 sm:p-10 shadow-lg text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        <div className="relative z-10 space-y-3">
          <span className="bg-white/15 backdrop-blur-md text-white font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Hivatalos Versenyszabályzat
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
            Arasz-Öntöde Squashliga Szabálykönyv
          </h1>
          <p className="text-sm sm:text-base text-red-150 max-w-xl mx-auto">
            A sportszerű játék, a biztonság és a gördülékeny lebonyolítás érdekében kérjük minden tagunkat a szabályok szigorú betartására.
          </p>
        </div>
      </div>

      {/* Alapszabályok Kártyák */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kártya 1: Lebonyolítás */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-brand-red p-2.5 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">1. A Bajnokság Rendje</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2.5 font-sans leading-relaxed">
            <p>
              • A bajnokság fordulókból áll, amelyekben minden játékosnak megvan a kijelölt ellenfele.
            </p>
            <p>
              • A felek önállóan egyeztetnek időpontot a mérkőzésre, és lefoglalják a pályát az <span className="font-semibold text-gray-900">Arasz Squash Clubban</span>.
            </p>
            <p>
              • A mérkőzések lejátszására a forduló végéig van lehetőség. Amennyiben egy meccset nem játszanak le, az adminisztráció jogosult dönteni a pontokról.
            </p>
          </div>
        </div>

        {/* Kártya 2: Pontozási Rendszer */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-brand-red p-2.5 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">2. Pontozás és Szettek</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2.5 font-sans leading-relaxed">
            <p>
              • Minden mérkőzés <span className="font-semibold text-gray-900">3 nyert szettig (Best of 5)</span> tart.
            </p>
            <p>
              • Szigorú <span className="font-semibold text-gray-900">PAR-11 pontozás</span> érvényes: minden labdamenet pontot ér, függetlenül attól, hogy ki adogatott.
            </p>
            <p>
              • 10-10 állásnál addig kell folytatni a játékot, amíg az egyik fél <span className="font-semibold text-gray-900">2 pont különbséget</span> nem szerez (pl. 12-10, 13-11).
            </p>
          </div>
        </div>

        {/* Kártya 3: Biztonság */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-brand-red p-2.5 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">3. Biztonság és Felszerelés</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2.5 font-sans leading-relaxed">
            <p>
              • A pályára kizárólag <span className="font-semibold text-gray-900">tiszta, nem nyomot hagyó talpú (non-marking)</span> teremcipővel szabad belépni.
            </p>
            <p>
              • <span className="font-semibold text-green-700">Védőszemüveg használata</span> minden játékosnak javasolt, 19 év alatti junioroknak pedig szigorúan kötelező!
            </p>
            <p>
              • Sérülésveszélyes vagy sportszerűtlen játék esetén a meccs azonnal félbeszakítható, a részletekről konzultáljatok a szervezőkkel.
            </p>
          </div>
        </div>

        {/* Kártya 4: Beküldés */}
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-brand-red p-2.5 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">4. Eredmények Rögzítése</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2.5 font-sans leading-relaxed">
            <p>
              • A lejátszott mérkőzést a weboldalon, a megfelelő liga lapján az <span className="font-semibold text-gray-900">„Eredmény beküldése”</span> fül alatt kell bejelenteni.
            </p>
            <p>
              • Az eredményeket a lejátszást követő <span className="font-semibold text-gray-950">24 órán belül</span> fel kell tölteni.
            </p>
            <p>
              • A beküldött adatok (pontos szettek) adminisztrátori áttekintés és jóváhagyás után válnak véglegessé a ranglistákon.
            </p>
          </div>
        </div>

      </div>

      {/* Fairness sáv */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="bg-amber-100 text-amber-800 p-3 rounded-xl">
          <Heart className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-display font-bold text-gray-950 text-base">Sportszerűség (Fair Play) mindfelett</h4>
          <p className="text-xs text-gray-600 leading-relaxed font-sans">
            A liga lényege a közösségépítés és a fallabda imádata. Bármilyen vitatott szituációban a sportszerűség elgondolása alapján egyezzetek meg, vagy ismételjétek meg a pontot (let labdamenet). Jó játékot kívánunk!
          </p>
        </div>
      </div>

    </div>
  );
}
