# Arasz-Öntöde Squashliga import audit

Forrás: `data/raw/0612_15_arasz_ontode_liga.xlsx`

Megjegyzés: a kért fájlnév (`data/raw/arasz-ontode-liga-2026.xlsx`) nem volt jelen a workspace-ben; az audit a megtalált, megfelelőnek tűnő workbookra készült.

## Workbook lapjai

1. `A liga`
1. `B liga`
1. `C liga`
1. `D liga`
1. `E liga`
1. `F liga`
1. `G liga`
1. `15. kör sorsolás`
1. `Versenykiírás`
1. `Ligabeosztas`
1. `Elérhetőség`
1. `Piramis Bajnokság`
1. `Liga történelem`
1. `Munka1`
1. `Ranglista`
1. `H liga`
1. `9_fős_liga`
1. `10_fős_liga`
1. `Női liga`

## Kért lapok azonosítása

- `A liga` - megtalálva
- `B liga` - megtalálva
- `C liga` - megtalálva
- `D liga` - megtalálva
- `E liga` - megtalálva
- `Versenykiírás` - megtalálva
- `Elérhetőség` - megtalálva
- `Piramis Bajnokság` - megtalálva
- `Liga történelem` - megtalálva

## Liga lapok szerkezete

Közös minta:
- a vízszintes játékosfejléc a `1. sorban` kezdődik
- a függőleges játékosnév-oszlop az `A oszlopban` kezdődik
- a játékosblokkok 3 sor magasak
- az eredmények a meccsmátrixban szöveges tokenként vannak tárolva, nem numerikus score-ként
- az összesítő oszlopok képletekből számolódnak, ezért az importnál nem ezeket kell forrásként kezelni

### `A liga`

- játékosnév-sor kezdete: `1. sor`
- játékosnév-oszlop kezdete: `A oszlop`
- meccsmátrix: `B4:K33`
- összesítő oszlopok: `L:P`
- eredményformátum: szöveges, perjeles tokenek, például `5/0`, `4/1`, `3/2`, `2/3`, `1/4`, `0/5`, valamint forfeit variánsok `5/-` és `-/5`
- megjegyzés: a sorblokkok `4, 7, 10, ... 31` sorokon futnak, vagyis 10 játékos van a ligában

### `B liga`

- játékosnév-sor kezdete: `1. sor`
- játékosnév-oszlop kezdete: `A oszlop`
- meccsmátrix: `B4:K33`
- összesítő oszlopok: `L:P`
- eredményformátum: ugyanaz a szöveges, perjeles tokenkészlet, mint az `A ligában`
- megjegyzés: 10 játékos, 3 soros blokkokkal

### `C liga`

- játékosnév-sor kezdete: `1. sor`
- játékosnév-oszlop kezdete: `A oszlop`
- meccsmátrix: `B4:L36`
- összesítő oszlopok: `M:Q`
- eredményformátum: szöveges, perjeles tokenek
- megjegyzés: 11 játékos, 3 soros blokkokkal

### `D liga`

- játékosnév-sor kezdete: `1. sor`
- játékosnév-oszlop kezdete: `A oszlop`
- meccsmátrix: `B4:L36`
- összesítő oszlopok: `M:Q`
- eredményformátum: szöveges, perjeles tokenek; ebben a workbookban már látható példaértékek is vannak, például `5/0`, `3/2`, `2/3`, `0/5`
- megjegyzés: 11 játékos, 3 soros blokkokkal

### `E liga`

- játékosnév-sor kezdete: `1. sor`
- játékosnév-oszlop kezdete: `A oszlop`
- meccsmátrix: `B4:J30`
- összesítő oszlopok: `K:O`
- eredményformátum: szöveges, perjeles tokenek; itt is előfordulnak `5/0`, `4/1`, `3/2`, `2/3`, `1/4`, `0/5`
- megjegyzés: 9 játékos, 3 soros blokkokkal

## PII / publikálhatóság

- `Elérhetőség` lap: `A1:C46`
- tartalom: név, telefonszám, e-mail cím
- következtetés: ezt a lapot privát forrásként kell kezelni, és semmilyen publikus adatmodellbe vagy publikus frontendbe nem szabad átvinni

## Technikai terv a normalizáláshoz

1. Azonosítsuk a liga lapokat név alapján, és tároljunk hozzájuk `league_key`-t, `display_name`-t és a hozzájuk tartozó sormintát.
1. A `1. sor` és az `A oszlop` alapján építsük fel a játékosok listáját.
1. A 3 soros blokkokból hozzunk létre egy-egy logikai játékos rekordot, és a jobb oldali összesítő oszlopokat kezeljük csak derivált, nem kanonikus mezőként.
1. A meccsmátrix minden nem üres, nem önmagára mutató cellájából képezzünk `match` rekordot:
   - `league`
   - `player_a`
   - `player_b`
   - `result_raw`
   - opcionálisan `block_row`, `block_col`, `source_cell`
1. A `result_raw` tokeneket normalizáljuk szerkezetre:
   - `sets_won`
   - `sets_lost`
   - `is_walkover`
   - `is_forfeit`
1. Deduplikáljunk az esetleges kétirányú beírások ellenőrzésével, és logoljunk konfliktust, ha a két cella eltér.
1. A tabellát ne importáljuk az Excel összesítő oszlopaiból. A `standings` táblát a nyers `matches/results` adatokból számoljuk újra.
1. A publikus exportból hagyjuk ki az `Elérhetőség` lap adatait.

## Rövid adatmodell-javaslat

- `leagues`: egy sor laponként
- `players`: league-hez kötött játékosok, stabil normalizált névvel
- `matches`: player-párok, eredeti cellahivatkozással visszakövethetően
- `results`: a szöveges tokenből kinyert strukturált eredmény
- `standings`: számolt rangsor, teljesen derivált

## Megjegyzés a rankingról

A workbook jelenleg képletekkel számol összesítést és sorrendet. Az importban ezeket nem szabad készpénznek venni, hanem a nyers eredményekből kell újraszámolni, hogy a későbbi adatmodell független legyen az Excel táblától.
