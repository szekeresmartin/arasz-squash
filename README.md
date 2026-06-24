# Arasz-Öntöde Squashliga

Vite + React + TypeScript alapú squash liga prototípus.

## Futatás

1. Függőségek telepítése: `npm install`
2. Fejlesztői szerver indítása: `npm run dev`
3. Production build: `npm run build`

## Netlify megosztás

1. Futtasd le helyben az ellenőrzést: `npm run build`
2. Commitold a jelenlegi állapotot egy Git repositoryba.
3. Pushold fel GitHubra.
4. Netlifyban válaszd az `Add new site` > `Import an existing project` opciót.
5. Csatlakoztasd a GitHub repositoryt.
6. Build command: `npm run build`
7. Publish directory: `dist`
8. Deploy után küldd el a kapott Netlify URL-t a szervezőnek.

Megjegyzés: a `netlify.toml` már benne van a projektben, így a belső útvonalak, például a `/bajnoksag/...` oldalak közvetlen megnyitással is működni fognak.

## Megjegyzés

Az aktuális prototípushoz nem szükséges backend vagy AI API kulcs.
