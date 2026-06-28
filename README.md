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

## Supabase

A projekt már Supabase-re van kötve. Ehhez ez kell:

1. Hozd létre a `public.app_state` táblát a [supabase/schema.sql](/Users/szekeresmartin/Documents/arasz-squash/supabase/schema.sql) alapján.
2. Állítsd be a környezeti változókat:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Netlify-on ugyanazokat az env változókat add meg a site beállításaiban.

Példa a jelenlegi projektre:

```text
VITE_SUPABASE_URL=https://fnikgmsyooyxhfvvfjeh.supabase.co
```

Megjegyzés:
- A jelenlegi implementáció közvetlenül a Supabase REST API-t használja.
- A publikus írások működéséhez RLS policy-ket is be kell kapcsolni a schema SQL-ben.
- Ha később erősebb jogosultságkezelés kell, érdemes külön admin auth réteget is tenni elé.
