import React from 'react';
import { BookOpen, ListOrdered, ScrollText } from 'lucide-react';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'ordered'; items: string[] }
  | { type: 'subheading'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

type Section = {
  number: string;
  title: string;
  blocks: Block[];
};

const TABLE_OF_CONTENTS = [
  'I. Általános rendelkezések',
  '1. A liga célja',
  '2. A liga lebonyolítása',
  '3. Feljutás és kiesés',
  '4. Új játékosok besorolása',
  '5. Sérülésből visszatérő játékosok',
  '6. Mérkőzések szervezése',
  '7. Mérkőzések helyszíne',
  '8. Mérkőzések lebonyolítása',
  '9. Labdahasználat',
  '10. Eredmények rögzítése',
  '11. Pontozási rendszer',
  '12. Rangsorolás',
  '13. Mérkőzések halasztása',
  '14. Időpont-egyeztetés',
  '15. Sérülések',
  '16. Sportszerűség és pályán tanúsított magatartás',
  '17. Viselkedés mérkőzés közben',
  '18. Vitás helyzetek kezelése bíró nélkül',
  '19. LET és STROKE alkalmazása',
  '20. Kétes labdák',
  '21. Bíró alkalmazása',
  '22. Olyan információk, amelyeket a bíró nem láthatott',
  '23. Mérkőzés befejezése',
  '24. Sportszerűtlen magatartás',
  '25. A szervező döntési jogköre',
  '26. Díjazás',
  'V. Egyéb rendelkezések',
  '27. Kommunikáció',
  '28. Viber-csoportok használata',
  '29. A liga szellemisége',
  '30. A Versenybizottság jogköre',
  '31. Záró rendelkezések',
  '32. Elérhetőségek',
];

const SECTIONS: Section[] = [
  {
    number: '1',
    title: 'A liga célja',
    blocks: [
      {
        type: 'paragraph',
        text: 'Az ARASZ–Öntöde Squash Liga célja, hogy a squash sport kedvelői szervezett keretek között, rendszeres játéklehetőség mellett, sportszerű körülmények között mérhessék össze tudásukat.',
      },
      {
        type: 'paragraph',
        text: 'A liga lehetőséget biztosít minden játékos számára, hogy a teljesítménye alapján feljebb léphessen a magasabb osztályokba, vagy újra felküzdje magát korábbi helyezésére.',
      },
      {
        type: 'paragraph',
        text: 'A liga folyamatos rendszerben működik: minden sorozat lezárását követően új nevezési időszak kezdődik, majd a következő forduló a friss ranglista alapján indul.',
      },
    ],
  },
  {
    number: '2',
    title: 'A liga lebonyolítása',
    blocks: [
      {
        type: 'paragraph',
        text: 'A nevezések lezárását követően a játékosokat az aktuális ranglista alapján 8–9 fős ligacsoportokba soroljuk.',
      },
      { type: 'subheading', text: 'A csoportok jelölése:' },
      {
        type: 'bullets',
        items: ['A liga', 'B liga', 'C liga', 'D liga', 'E liga'],
      },
      {
        type: 'paragraph',
        text: 'Szükség esetén további ligacsoportok is kialakíthatók.',
      },
      {
        type: 'paragraph',
        text: 'Minden ligacsoportban körmérkőzéses rendszer szerint zajlik a verseny, vagyis minden játékos egyszer mérkőzik meg minden csoporttársával.',
      },
      {
        type: 'paragraph',
        text: 'Egy sorozat várható időtartama 10–14 hét, amelynek során hetente egy kijelölt mérkőzést kell lejátszani.',
      },
      {
        type: 'paragraph',
        text: 'A sorozat végén eredményhirdetésre és díjátadóra kerül sor, ezt követően pedig a következő liga veszi kezdetét.',
      },
    ],
  },
  {
    number: '3',
    title: 'Feljutás és kiesés',
    blocks: [
      { type: 'subheading', text: 'A bajnokság végén:' },
      {
        type: 'bullets',
        items: [
          'minden ligacsoport 1. és 2. helyezettje automatikusan feljut a következő magasabb ligába;',
          'minden ligacsoport utolsó két helyezettje a következő alacsonyabb ligába kerül.',
        ],
      },
      { type: 'paragraph', text: 'Az A liga a legmagasabb osztály, így onnan természetesen nincs feljutás.' },
      { type: 'paragraph', text: 'Az utolsó ligacsoportból nincs kiesés.' },
      {
        type: 'paragraph',
        text: 'Az egyes sorozatok eredménye alapján frissül a liga ranglistája, amely meghatározza a következő sorozat csoportbeosztását.',
      },
    ],
  },
  {
    number: '4',
    title: 'Új játékosok besorolása',
    blocks: [
      {
        type: 'paragraph',
        text: 'Az újonnan érkező játékosok alapvetően az alsóbb ligacsoportokból kezdik meg szereplésüket.',
      },
      {
        type: 'paragraph',
        text: 'Amennyiben azonban egy játékos játéktudása ezt indokolja, a szervezőség egyéni elbírálás alapján magasabb ligába sorolhatja.',
      },
      { type: 'subheading', text: 'Ennek módja lehet:' },
      {
        type: 'bullets',
        items: ['kihívásos mérkőzés,', 'korábbi versenyeredmények,', 'vagy egyéb szakmai szempont.'],
      },
      {
        type: 'paragraph',
        text: 'A cél minden esetben az, hogy a játékos a tudásának megfelelő ligában kezdhesse meg szereplését.',
      },
    ],
  },
  {
    number: '5',
    title: 'Sérülésből visszatérő játékosok',
    blocks: [
      {
        type: 'paragraph',
        text: 'Azok a játékosok, akik sérülés miatt hosszabb időre kihagyták a ligát, visszatéréskor a szervezőség döntése alapján kerülnek besorolásra.',
      },
      { type: 'subheading', text: 'A besorolás történhet:' },
      {
        type: 'bullets',
        items: [
          'visszasoroló mérkőzés alapján,',
          'vagy legfeljebb egy ligával alacsonyabb csoportba történő visszahelyezéssel, mint amelyben a sérülés előtt szerepeltek.',
        ],
      },
      {
        type: 'paragraph',
        text: 'A szervezőség minden esetben arra törekszik, hogy a játékos a jelenlegi tudásának megfelelő ligában folytathassa a játékot.',
      },
    ],
  },
  {
    number: '6',
    title: 'Mérkőzések szervezése',
    blocks: [
      {
        type: 'paragraph',
        text: 'Minden ligacsoport számára külön Viber-csoport készül, amely kizárólag a mérkőzések szervezésére szolgál.',
      },
      {
        type: 'paragraph',
        text: 'A heti párosításokat előre meghatározott sorsolás alapján kell lejátszani.',
      },
      {
        type: 'paragraph',
        text: 'A játékosok kötelesek egymással felvenni a kapcsolatot, és egyeztetni a mérkőzés időpontját.',
      },
    ],
  },
  {
    number: '7',
    title: 'Mérkőzések helyszíne',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga valamennyi hivatalos mérkőzését az Öntöde Sportcentrumban kell lejátszani.',
      },
      { type: 'subheading', text: 'A szervező' },
      {
        type: 'bullets',
        items: ['pályát,', 'bírót,', 'valamint labdát'],
      },
      { type: 'paragraph', text: 'nem biztosít.' },
      { type: 'paragraph', text: 'Ezekről a játékosoknak kell gondoskodniuk.' },
    ],
  },
  {
    number: '8',
    title: 'Mérkőzések lebonyolítása',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga mérkőzéseire a World Squash Federation (WSF) hivatalos szabályrendszere vonatkozik.',
      },
      { type: 'paragraph', text: 'Minden mérkőzés 5 szettig tart!' },
      {
        type: 'paragraph',
        text: 'A mérkőzések PAR11 pontozási rendszerben zajlanak, vagyis minden labdamenet pontot ér.',
      },
      {
        type: 'paragraph',
        text: 'Egy szett 11 pontig tart, azonban 10–10-es állásnál a szett csak kétpontos különbséggel nyerhető meg.',
      },
      {
        type: 'paragraph',
        text: 'A mérkőzések során a játékosoktól elvárható a WSF szabályainak ismerete és betartása.',
      },
    ],
  },
  {
    number: '9',
    title: 'Labdahasználat',
    blocks: [
      { type: 'subheading', text: 'A liga' },
      {
        type: 'paragraph',
        text: 'Az A ligában alapértelmezés szerint 2 sárga pöttyös hivatalos squashlabdát kell használni.',
      },
      { type: 'subheading', text: 'Ettől az alábbi esetekben lehet eltérni:' },
      {
        type: 'bullets',
        items: [
          'amennyiben mindkét játékos egyetért, használható 1 piros pöttyös labda is;',
          'az 50 év feletti játékosok kérhetik, hogy mérkőzésüket 1 piros pöttyös labdával játsszák.',
        ],
      },
      { type: 'subheading', text: 'B–E liga' },
      {
        type: 'paragraph',
        text: 'A B, C, D és E ligákban az alapértelmezett labda az 1 piros pöttyös squashlabda.',
      },
      {
        type: 'paragraph',
        text: 'Ha mindkét játékos beleegyezik, ettől eltérő típusú labda is használható.',
      },
    ],
  },
  {
    number: '10',
    title: 'Eredmények rögzítése',
    blocks: [
      { type: 'paragraph', text: 'A mérkőzés befejezését követően az eredményt haladéktalanul rögzíteni kell.' },
      { type: 'paragraph', text: 'Az eredmény közléséért a mérkőzés győztese felelős.' },
      { type: 'subheading', text: 'Az eredményt két helyen kell közzétenni:' },
      {
        type: 'bullets',
        items: [
          'a Squash Liga – Öntöde Viber csoportban;',
          'valamint a liga hivatalos digitális eredménykezelő felületén. www.araszsquashliga.hu',
        ],
      },
      { type: 'paragraph', text: 'A bajnokság aktuális állását a szervezőség folyamatosan frissíti.' },
      { type: 'subheading', text: 'Az eredmények elérhetők:' },
      {
        type: 'bullets',
        items: ['az araszsquashliga.hu weboldalon,', 'a Viber csoportban,', 'valamint az Öntöde Sportcentrum faliújságján.'],
      },
    ],
  },
  {
    number: '11',
    title: 'Pontozási rendszer',
    blocks: [
      { type: 'paragraph', text: 'A mérkőzések után a játékosok az alábbi pontokat kapják:' },
      {
        type: 'table',
        headers: ['Eredmény', 'Pont'],
        rows: [
          ['Győzelem', '5 pont'],
          ['Vereség 2–3-as szettaránnyal', '3 pont'],
          ['Vereség 1–4-es szettaránnyal', '2 pont'],
          ['Vereség 0–5-ös szettaránnyal', '1 pont'],
          ['Le nem játszott mérkőzés', '0 pont'],
        ],
      },
      {
        type: 'paragraph',
        text: 'Amennyiben egy játékos visszalép a bajnokságtól, az addig megszerzett pontok és a hátralévő mérkőzések elszámolásáról a szervezőség dönt, a sportszerűség elvét szem előtt tartva.',
      },
    ],
  },
  {
    number: '12',
    title: 'Rangsorolás',
    blocks: [
      {
        type: 'paragraph',
        text: 'Azonos pontszám esetén a sorrendet az alábbiak szerint kell megállapítani:',
      },
      {
        type: 'ordered',
        items: ['több megnyert mérkőzés;', 'jobb szettarány;', 'több megnyert szett;', 'egymás elleni eredmény.'],
      },
      {
        type: 'paragraph',
        text: 'A megnyert szettek összehasonlításánál csak a ténylegesen lejátszott mérkőzések eredményei számítanak.',
      },
      {
        type: 'paragraph',
        text: 'Ha egy játékos sérülés miatt nem tudta lejátszani mérkőzését, akkor a megnyert szetteket egyik érintett játékosnál sem vesszük figyelembe az összehasonlítás során. A megszerzett bajnoki pontok azonban természetesen érvényben maradnak.',
      },
      {
        type: 'paragraph',
        text: 'Ezért minden játékos számára fontos, hogy minden egyes szettért a végsőkig küzdjön, hiszen a szezon végén akár egyetlen megnyert szett is dönthet a feljutásról, a kiesésről vagy a végső helyezésről.',
      },
    ],
  },
  {
    number: '13',
    title: 'Mérkőzések halasztása',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga előre elkészített sorsolási rend alapján zajlik. (el lehet térni)',
      },
      { type: 'paragraph', text: 'Minden játékos számára hetente egy kötelező mérkőzés kerül kijelölésre.' },
      {
        type: 'paragraph',
        text: 'Ha a kijelölt időszakban a mérkőzés nem játszható le, a két játékos köteles új időpontot egyeztetni.',
      },
      { type: 'paragraph', text: 'A mérkőzés elhalasztása nem jelenti azt, hogy annak lejátszása elmaradhat.' },
      {
        type: 'paragraph',
        text: 'A cél minden esetben az, hogy valamennyi mérkőzés a bajnokság lezárásáig lejátszásra kerüljön.',
      },
    ],
  },
  {
    number: '14',
    title: 'Időpont-egyeztetés',
    blocks: [
      { type: 'paragraph', text: 'A heti ellenféllel minden esetben kapcsolatba kell lépni, és meg kell állapodni:' },
      { type: 'bullets', items: ['a mérkőzés időpontjáról, vagy', 'annak elhalasztásáról.'] },
      {
        type: 'paragraph',
        text: 'Ha egy játékos többszöri megkeresés ellenére sem reagál, illetve nem hajlandó időpontot egyeztetni, és ennek bizonyítható nyoma van a Viber csoportban, a szervezőség egyedi elbírálás alapján játék nélkül is megítélheti az 5 pontot a vétlen játékos részére.',
      },
      { type: 'paragraph', text: 'A döntés minden esetben a sportszerűség figyelembevételével történik.' },
    ],
  },
  {
    number: '15',
    title: 'Sérülések',
    blocks: [
      {
        type: 'paragraph',
        text: 'Sérült játékosnak az tekintendő, aki orvosi vagy egészségügyi okból átmenetileg nem tud squashmérkőzést játszani.',
      },
      {
        type: 'paragraph',
        text: 'Amint a játékos ismét játékra alkalmas állapotba kerül, köteles részt venni a liga mérkőzésein.',
      },
      { type: 'paragraph', text: 'A többi játékos nem köteles megvárni, amíg a sérülésből visszatérő játékos ismét csúcsformába kerül.' },
      {
        type: 'paragraph',
        text: 'A mérkőzéseket a hivatalos sorsolás szerint, ésszerű határidőn belül le kell játszani.',
      },
    ],
  },
  {
    number: '16',
    title: 'Sportszerűség és pályán tanúsított magatartás',
    blocks: [
      {
        type: 'paragraph',
        text: 'Az ARASZ–Öntöde Squash Liga amatőr bajnokság, amelynek alapja a kölcsönös tisztelet, a sportszerűség és a fair play.',
      },
      {
        type: 'paragraph',
        text: 'A liga minden résztvevőjétől elvárjuk, hogy ellenfelével, a nézőkkel és az esetleges mérkőzésvezetővel szemben végig tiszteletteljes magatartást tanúsítson.',
      },
      {
        type: 'paragraph',
        text: 'A mérkőzések célja a sportszerű versenyzés, ezért minden játékos köteles elfogadni a szabályokat és azok szellemiségét.',
      },
    ],
  },
  {
    number: '17',
    title: 'Viselkedés mérkőzés közben',
    blocks: [
      { type: 'paragraph', text: 'A labdamenet alatt a játékosok nem zavarhatják egymást.' },
      { type: 'subheading', text: 'Ennek megfelelően tilos:' },
      {
        type: 'bullets',
        items: [
          'az ellenfélhez beszélni;',
          'kommentálni a játékot;',
          'vitatni az aktuális labdamenetet;',
          'hangos megjegyzéseket tenni;',
          'bármilyen olyan viselkedést tanúsítani, amely az ellenfél koncentrációját zavarhatja.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Ha valamelyik játékos ezt megszegi, ellenfele köteles kulturált módon figyelmeztetni.',
      },
      {
        type: 'paragraph',
        text: 'Amennyiben a sportszerűtlen viselkedés ismétlődik, a szervezőség jogosult a mérkőzés kivizsgálására.',
      },
    ],
  },
  {
    number: '18',
    title: 'Vitás helyzetek kezelése bíró nélkül',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga mérkőzéseinek többségét hivatalos bíró nélkül játsszák.',
      },
      {
        type: 'paragraph',
        text: 'Ezért a játékosoknak minden esetben törekedniük kell a korrekt és sportszerű döntések meghozatalára.',
      },
      {
        type: 'paragraph',
        text: 'Ha egy játékhelyzet megítélésében nincs egyetértés, a vita helyett a játék folyamatosságát kell előtérbe helyezni. Nem egyező vélemények esetén a játékot LET-el azaz a labdamenet újrajátszásával kell folytatni.',
      },
      { type: 'paragraph', text: 'A pályán hosszabb vita nem megengedett.' },
    ],
  },
  {
    number: '19',
    title: 'LET és STROKE alkalmazása',
    blocks: [
      {
        type: 'paragraph',
        text: 'Ha egy játékos úgy ítéli meg, hogy az adott szituáció Stroke, ezt kulturált módon jelezheti ellenfelének.',
      },
      { type: 'paragraph', text: 'Amennyiben az ellenfél egyetért, a Stroke megadható.' },
      {
        type: 'paragraph',
        text: 'Ha azonban az ellenfél másként látta a szituációt, vagy nem ért egyet a döntéssel, a labdamenetet LET-tel kell újrajátszani.',
      },
      {
        type: 'paragraph',
        text: 'Mivel bíró nélküli mérkőzésen két különböző vélemény áll egymással szemben, egyik játékos véleménye sem tekinthető fontosabbnak a másikénál.',
      },
      { type: 'paragraph', text: 'Ilyen esetben a korrekt megoldás minden alkalommal a LET.' },
      {
        type: 'paragraph',
        text: 'A játék folytatását hosszabb vita nem akadályozhatja.',
      },
      {
        type: 'paragraph',
        text: 'Ha egy játékos rendszeresen vitás helyzetekbe kerül ugyanazzal az ellenféllel, javasolt a következő mérkőzést hivatalos mérkőzésvezető jelenlétében lejátszani.',
      },
    ],
  },
  {
    number: '20',
    title: 'Kétes labdák',
    blocks: [
      {
        type: 'paragraph',
        text: 'Előfordulhatnak olyan szituációk, amikor nem állapítható meg egyértelműen:',
      },
      {
        type: 'bullets',
        items: [
          'hogy a labda egyszer vagy kétszer pattant-e;',
          'hogy hozzáért-e a falhoz;',
          'vagy egyéb olyan körülmény merül fel, amelyet egyik játékos sem tud biztosan megítélni.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Amennyiben nincs jelen olyan külső személy vagy hivatalos bíró, aki egyértelműen látta az esetet, a labdamenetet LET-tel kell újrajátszani.',
      },
      { type: 'paragraph', text: 'A cél nem a vita megnyerése, hanem a mérkőzés sportszerű folytatása.' },
    ],
  },
  {
    number: '21',
    title: 'Bíró alkalmazása',
    blocks: [
      {
        type: 'paragraph',
        text: 'Amennyiben a mérkőzés előtt mindkét játékos elfogad egy jelenlévő személyt mérkőzésvezetőnek, a mérkőzés során az ő döntése az irányadó.',
      },
      { type: 'paragraph', text: 'A bíró döntéseit minden játékos köteles elfogadni.' },
      {
        type: 'paragraph',
        text: 'A bíró természetesen tévedhet, azonban a pályán az ő ítélete számít véglegesnek.',
      },
      { type: 'paragraph', text: 'A játékosok nem próbálhatják meggyőzni a bírót arról, hogy döntése hibás volt.' },
      { type: 'paragraph', text: 'Nincs lehetőség hosszas vitára vagy a döntés megváltoztatására.' },
    ],
  },
  {
    number: '22',
    title: 'Olyan információk, amelyeket a bíró nem láthatott',
    blocks: [
      {
        type: 'paragraph',
        text: 'Előfordulhatnak olyan esetek, amelyeket kizárólag a játékosok érzékelhetnek.',
      },
      { type: 'subheading', text: 'Például:' },
      {
        type: 'bullets',
        items: ['ütők összeérése;', 'testkontaktus;', 'egyéb olyan esemény, amely kívülről nem volt látható.'],
      },
      { type: 'paragraph', text: 'A játékos természetesen közölheti ezt a bíróval.' },
      {
        type: 'paragraph',
        text: 'A végső döntést azonban minden esetben a bíró hozza meg a saját megfigyelése alapján.',
      },
      {
        type: 'paragraph',
        text: 'Videóbíró vagy visszajátszás hiányában kizárólag a pályán jelen lévő mérkőzésvezető döntése tekinthető hivatalosnak.',
      },
    ],
  },
  {
    number: '23',
    title: 'Mérkőzés befejezése',
    blocks: [
      { type: 'paragraph', text: 'A mérkőzés végén a játékosok kötelesek egymásnak megköszönni a játékot.' },
      {
        type: 'paragraph',
        text: 'A kézfogás vagy más, kölcsönösen elfogadott sportolói üdvözlés a mérkőzés lezárásának része.',
      },
      { type: 'paragraph', text: 'A mérkőzés után kialakult vitákat a pályán nem szabad folytatni.' },
      { type: 'paragraph', text: 'A végeredményt a játékosok kötelesek elfogadni.' },
      {
        type: 'paragraph',
        text: 'Amennyiben valaki úgy érzi, hogy egy mérkőzésen több vitatható helyzet is előfordult, a következő találkozóra kérjen hivatalos bírót.',
      },
    ],
  },
  {
    number: '24',
    title: 'Sportszerűtlen magatartás',
    blocks: [
      { type: 'paragraph', text: 'Sportszerűtlen viselkedésnek minősül különösen:' },
      {
        type: 'bullets',
        items: [
          'sértő vagy trágár beszéd;',
          'ellenfél provokálása;',
          'szándékos időhúzás;',
          'ismétlődő szabálytalanságok;',
          'a mérkőzés szándékos akadályozása;',
          'a bíró vagy az ellenfél döntéseinek folyamatos vitatása;',
          'kézfogás megtagadása;',
          'fenyegető vagy agresszív viselkedés.',
        ],
      },
      { type: 'paragraph', text: 'A szervezőség jogosult az ilyen esetek kivizsgálására.' },
      {
        type: 'paragraph',
        text: 'A szabályszegés súlyosságától függően figyelmeztetés, pontlevonás, mérkőzés elvesztése vagy a ligából történő kizárás is alkalmazható.',
      },
    ],
  },
  {
    number: '25',
    title: 'A szervező döntési jogköre',
    blocks: [
      { type: 'paragraph', text: 'A jelen szabályzatban nem szabályozott kérdésekben a szervező jogosult döntést hozni.' },
      { type: 'paragraph', text: 'A döntések meghozatalakor minden esetben az alábbi alapelvek az irányadók:' },
      {
        type: 'bullets',
        items: ['sportszerűség;', 'egyenlő bánásmód;', 'a liga zavartalan működése;', 'a játékosok érdekeinek figyelembevétele.'],
      },
      { type: 'paragraph', text: 'A szervező döntése minden résztvevő számára kötelező érvényű.' },
    ],
  },
  {
    number: '26',
    title: 'Díjazás',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga végén minden ligacsoportban díjazásban részesülnek a legeredményesebb játékosok.',
      },
      { type: 'paragraph', text: 'Díjazásban részesül:' },
      { type: 'bullets', items: ['az 1. helyezett,', 'valamint a 2. helyezett.'] },
      { type: 'paragraph', text: 'A díjazás minden ligacsoportban:' },
      { type: 'bullets', items: ['érem,', 'oklevél (amennyiben készül),', 'valamint a szervezőség által felajánlott ajándék(ok).'] },
      { type: 'paragraph', text: 'A szervezőség fenntartja a jogot különdíjak odaítélésére is.' },
    ],
  },
  {
    number: '27',
    title: 'Kommunikáció',
    blocks: [
      { type: 'paragraph', text: 'A liga hivatalos kommunikációja az alábbi felületeken történik:' },
      {
        type: 'bullets',
        items: [
          'a Squash Liga – Öntöde Viber közösség,',
          'a ligacsoportok külön Viber-csoportjai,',
          'az araszsquashliga.hu weboldal,',
          'valamint elektronikus levélben.',
        ],
      },
      {
        type: 'paragraph',
        text: 'A nevezést követően minden játékos megkapja a csoporttársai elérhetőségét, hogy a mérkőzések időpontját közvetlenül is egyeztethessék.',
      },
    ],
  },
  {
    number: '28',
    title: 'Viber-csoportok használata',
    blocks: [
      {
        type: 'paragraph',
        text: 'A liga hatékony működése érdekében minden résztvevő köteles a Viber-csoportokat rendeltetésszerűen használni.',
      },
      { type: 'subheading', text: 'Ligacsoport Viber-csoport' },
      {
        type: 'paragraph',
        text: 'A saját ligacsoport Viber-csoportja kizárólag az alábbi célokat szolgálja:',
      },
      {
        type: 'bullets',
        items: ['mérkőzések szervezése;', 'időpont-egyeztetés;', 'halasztások egyeztetése;', 'egyéb, az adott ligacsoportot érintő információk.'],
      },
      { type: 'subheading', text: 'Fő Viber-csoport' },
      { type: 'paragraph', text: 'A fő Viber-csoportban kizárólag a következő információk közzététele javasolt:' },
      {
        type: 'bullets',
        items: ['mérkőzések végeredményei;', 'már leegyeztetett mérkőzés-időpontok;', 'hivatalos szervezői közlemények.'],
      },
      {
        type: 'paragraph',
        text: 'Kérjük, hogy a fő csoportban a felesleges beszélgetéseket mindenki mellőzze, ezzel is segítve az információk gyors áttekinthetőségét.',
      },
    ],
  },
  {
    number: '29',
    title: 'A liga szellemisége',
    blocks: [
      { type: 'paragraph', text: 'Az ARASZ–Öntöde Squash Liga nem csupán egy versenysorozat.' },
      { type: 'paragraph', text: 'Célja egy olyan sportszerető közösség kialakítása, ahol minden résztvevő:' },
      {
        type: 'bullets',
        items: ['rendszeresen sportolhat,', 'fejlődhet,', 'új ellenfeleket ismerhet meg,', 'és jó hangulatban versenyezhet.'],
      },
      {
        type: 'paragraph',
        text: 'A liga sikerének alapja nem csupán a győzelem, hanem a kölcsönös tisztelet, a korrekt hozzáállás és a sportszerű játék.',
      },
      { type: 'paragraph', text: 'Arra kérünk minden résztvevőt, hogy eredménytől függetlenül mindig ennek szellemében lépjen pályára.' },
    ],
  },
  {
    number: '30',
    title: 'A Versenybizottság jogköre',
    blocks: [
      {
        type: 'paragraph',
        text: 'A jelen szabályzatban nem részletezett vagy előre nem látható esetekben a Versenybizottság jogosult döntést hozni.',
      },
      { type: 'paragraph', text: 'A döntések során minden esetben az alábbi szempontok az irányadók:' },
      {
        type: 'bullets',
        items: ['a WSF hivatalos szabályai;', 'a sportszerűség elve;', 'a liga érdekei;', 'a résztvevők közötti egyenlő bánásmód.'],
      },
      { type: 'paragraph', text: 'A Versenybizottság döntése végleges.' },
    ],
  },
  {
    number: '31',
    title: 'Záró rendelkezések',
    blocks: [
      { type: 'paragraph', text: 'A nevezés leadásával minden játékos kijelenti, hogy:' },
      {
        type: 'bullets',
        items: [
          'megismerte a jelen szabályzatot;',
          'annak rendelkezéseit elfogadja;',
          'vállalja azok maradéktalan betartását;',
          'elfogadja a Versenybizottság döntéseit.',
        ],
      },
      {
        type: 'paragraph',
        text: 'A szabályzat célja nem a büntetés, hanem a bajnokság sportszerű, átlátható és zavartalan lebonyolítása.',
      },
      { type: 'paragraph', text: 'Minden résztvevő közös érdeke, hogy a liga jó hangulatban, korrekt körülmények között működjön.' },
    ],
  },
  {
    number: '32',
    title: 'Elérhetőségek',
    blocks: [
      { type: 'paragraph', text: 'E-mail: ontodesquashliga@gmail.com' },
      { type: 'paragraph', text: 'Telefon: +36 70 317 4424' },
      { type: 'paragraph', text: 'Weboldal: araszsquashliga.hu' },
      { type: 'paragraph', text: 'Jó játékot kívánunk!' },
      {
        type: 'paragraph',
        text: 'Köszönjük, hogy részese vagy az ARASZ–Öntöde Squash Liga közösségének!',
      },
      {
        type: 'paragraph',
        text: 'Kívánunk minden résztvevőnek sikeres mérkőzéseket, izgalmas labdameneteket, sportszerű küzdelmeket és sok örömet a játékban.',
      },
      { type: 'paragraph', text: 'Találkozzunk a pályán!' },
      { type: 'paragraph', text: 'ARASZ–Öntöde Squash Liga' },
      { type: 'paragraph', text: 'Versenybizottság' },
    ],
  },
];

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  if (block.type === 'paragraph') {
    return <p className="text-[15px] sm:text-base leading-7 text-slate-700">{block.text}</p>;
  }

  if (block.type === 'subheading') {
    return <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{block.text}</h4>;
  }

  if (block.type === 'bullets') {
    return (
      <ul className="space-y-2 text-[15px] sm:text-base leading-7 text-slate-700">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-teal-600 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'ordered') {
    return (
      <ol className="space-y-2 text-[15px] sm:text-base leading-7 text-slate-700 list-decimal pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {block.headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {block.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3 align-top text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RuleSection: React.FC<{ section: Section }> = ({ section }) => {
  return (
    <section id={`section-${section.number}`} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <span className="font-mono text-sm font-bold">{section.number}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-950">{section.title}</h3>
        </div>
      </div>
      <div className="space-y-4">
        {section.blocks.map((block, index) => (
          <BlockView key={`${section.number}-${index}-${block.type}`} block={block} />
        ))}
      </div>
    </section>
  );
};

export default function Rules() {
  return (
    <div className="mx-auto max-w-6xl pb-16 animate-fadeIn">
      <header className="relative overflow-hidden rounded-[2rem] border border-teal-200/70 bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-900 px-6 py-10 sm:px-10 sm:py-14 text-white shadow-2xl shadow-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%),linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px] opacity-30" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur">
              Hivatalos versenyszabályzat
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur">
              ARASZ–Öntöde Squash Liga
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            ARASZ–Öntöde Squash Liga Szabályzat
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
            A bajnokság rendje, pontozása, labdahasználata és sportszerűségi alapelvei.
          </p>
        </div>
      </header>

      <div className="mt-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Tartalomjegyzék</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {TABLE_OF_CONTENTS.map((item, index) => (
              <div
                key={item}
                className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  index === 0 || index === 26
                    ? 'border-teal-200 bg-teal-50/60 text-teal-900 sm:col-span-2'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <RuleSection key={section.number} section={section} />
        ))}
      </div>

    </div>
  );
}
