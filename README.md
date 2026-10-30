# ODIN

ODIN is een alleen-lezen videosite. Bezoekers kunnen bladeren, zoeken en afspelen. Er is geen account, geen upload en geen reactie.

De indeling is die van een bekende videosite: een balk met zoeken, een inklapbaar zijmenu, een raster van kaarten (miniatuur, titel, kanaal, duur), een kijkpagina met speler, titel, beschrijving en een kolom suggesties, en een zoekpagina. Naam, merk en kleuren zijn van ODIN. De beeldtaal staat in CSS-variabelen in `src/styles/tokens.css`, zodat een eigen stijl later één themablok is en niet een herschrijving van de pagina's.

Het onderwerp van de beelden is ambient en bosachtig, met een elektronische ondertoon uit de jaren negentig en tweeduizend. Op elke video staat een strofe uit de Hávamál. De drie video's in deze versie zijn placeholders en zijn zo gemarkeerd.

De site hoort op [https://ddc9000.github.io/odin/](https://ddc9000.github.io/odin/).

## Architectuur

```
browser
  pagina's (home, kijken, zoeken)
  speler ── native HLS op Safari, hls.js elders
  cataloguslaag ── src/data/catalog.json
  MEDIA_BASE_URL ── één instelling in src/config.ts
        │
        ▼
  public/media   (nu, mee met GitHub Pages)
  of een bucket  (later, bijvoorbeeld Cloudflare R2)
```

- **Vite en TypeScript.** Geen UI-framework. De bundel blijft klein, en op een iPhone speelt Safari het bestand direct.
- **Router.** `/`, `/watch/:id` en `/search?q=`. De app draait onder het pad `/odin/`. GitHub Pages heeft geen SPA-fallback; `public/404.html` zet een diepe link terug naar `index.html`, en een kort script in `index.html` herstelt het pad.
- **Catalogus.** `src/data/catalog.json` is het bestand. `createCatalog` in `src/data/repository.ts` is de enige datalaag die de pagina's gebruiken. Een latere database of API vervangt die module. De pagina's blijven `list`, `getById`, `search` en `related` aanroepen.
- **Mediapaden zijn relatief.** Een video verwijst naar `videos/<id>/master.m3u8`, een miniatuur en een `.vtt`. Geen absolute URL in de catalogus.
- **Eén media-instelling.** `MEDIA_BASE_URL` in `src/config.ts`. Leeg betekent: de map `public/media` die met de site mee wordt gepubliceerd. Een ingevulde URL is de nieuwe origin. Verder verandert er niets.
- **Beeld.** Adaptive HLS in drie rendities, 360p, 720p en 1080p, als MPEG-TS. Daarnaast een JPEG-miniatuur en een WebVTT-spoor.
- **Speler.** Kan de browser `application/vnd.apple.mpegurl` afspelen, dan gaat de URL rechtstreeks op het `<video>`-element. Dat is het pad op iPhone- en iPad-Safari, waar Media Source Extensions niet beschikbaar zijn en hls.js dus niet kan werken. Elders laadt de site hls.js. Het element heeft `playsinline` en `controls`, zodat iOS inline afspeelt en de systeembediening gebruikt.
- **Ondertitel.** De speler leest het WebVTT-bestand en tekent de actieve cue zelf, standaard aan. Zo blijft een strofe leesbaar, ook als de native cue-weergave per browser verschilt. Het master-playlist adverteert het spoor wel, maar niet als standaard, anders zet Safari er een tweede exemplaar overheen.
- **Nog niet gebouwd.** Accounts, uploads, likes en reacties. De types en de poorten staan in `src/future/`, de vlaggen in `src/features.ts` (allemaal `false`). De site roept ze niet aan. Zie `docs/uitbreidingen.md`.

## Lokaal draaien

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:5173/odin/](http://localhost:5173/odin/).

Productiebuild, hetzelfde pad als Pages:

```bash
npm run build
npm run preview
```

Open [http://localhost:4173/odin/](http://localhost:4173/odin/).

`npm run dev` en `npm run preview` zetten de HLS-MIME-types zelf (`application/vnd.apple.mpegurl`, `video/mp2t`, `text/vtt`). Een kale statische server doet dat niet altijd, en Safari weigert de playlist dan. GitHub Pages stuurt die types al.

## Een video toevoegen

Je hebt ffmpeg en ffprobe nodig. De bron is een mp4 plus een WebVTT-bestand.

De pipeline accepteert 1 tot 180 seconden. De eerste reeks — de placeholders en de echte eerste batch — blijft op hooguit 15 seconden. Dat is een afspraak over de inhoud, geen limiet in `encode-video.sh`. Elk uitvoerbestand moet onder 100 MB blijven. Het script stopt als een bestand dat haalt.

```bash
./scripts/encode-video.sh \
  --source bron.mp4 \
  --subtitles bron.vtt \
  --id night-fir \
  --title "Night Fir" \
  --description "Korte beschrijving." \
  --channel-id skald-of-the-pines \
  --channel-name "Skáld of the Pines" \
  --channel-handle @skald \
  --published-at 2026-11-01T18:00:00.000Z
```

Het script maakt `public/media/videos/night-fir/`:

| Bestand | Rol |
| --- | --- |
| `360p/`, `720p/`, `1080p/` | HLS-renditie, playlist plus MPEG-TS-segmenten |
| `master.m3u8` | Adaptive playlist, met een WebVTT-spoor |
| `subtitles.vtt`, `subtitles.m3u8` | Ondertitel |
| `thumb.jpg` | Miniatuur |

en werkt `src/data/catalog.json` bij (nieuw id, of vervanging van hetzelfde id). Commit de mediamap en de catalogus.

`--span-cue` rekt de enige cue op van 0 tot het einde van de bron. Dat is wat de Hávamál-placeholders doen: één strofe, het hele fragment zichtbaar. Het script weigert `--span-cue` als het bestand meer dan één cue heeft. Langere video's later houden hun eigen timing; laat de vlag dan weg.

`--placeholder` zet `placeholder: true`. De kaart en de kijkpagina tonen dan het label Placeholder.

`--stanza` en `--citation` horen bij een Hávamál-vers. Zonder die vlaggen blijft het versnummer leeg.

Placeholders opnieuw genereren (vervangt de héle catalogus door de drie testvideo's):

```bash
npm run generate:placeholders
```

De bron-mp4's landen in `sources/` en staan in `.gitignore`. De HLS-uitvoer in `public/media/` gaat wel mee in git, omdat GitHub Pages die bytes serveert.

## Placeholders en de tekst

De drie testvideo's duren 15 seconden. Het beeld is een langzaam bewegend verloop met een beetje ruis. Het geluid is een zacht akkoord met een beetje ruis eronder, gegenereerd met ffmpeg, niet opgenomen. In de catalogus staat `placeholder: true`.

De verzen komen uit Henry Adams Bellows, “Hovamol”, in *The Poetic Edda* (New York: The American-Scandinavian Foundation, 1923). Die uitgave is publiek domein.

| Video | Strofe | Beginregel |
| --- | --- | --- |
| At the Gate | 1 | Within the gates |
| The Road Alone | 47 | Young was I once |
| A Name That Stays | 77 | Cattle die |

Tekst op [Wikisource](https://en.wikisource.org/wiki/The_Poetic_Edda_(tr._Bellows)/Hovamol). Elke cue loopt van `00:00:00.000` tot het einde van de video.

## Media verplaatsen naar R2

Alleen `MEDIA_BASE_URL` in `src/config.ts` wijst naar de bytes.

1. Kopieer de inhoud van `public/media/` naar de bucket, met dezelfde relatieve paden (`videos/<id>/master.m3u8` enzovoort).
2. CORS: sta `GET` en `HEAD` toe vanaf de origin van de site. De speler zet `crossorigin="anonymous"` op het video-element en haalt het WebVTT-bestand met `fetch`.
3. Content-Types. Safari weigert HLS als die verkeerd zijn.
   - `.m3u8` → `application/vnd.apple.mpegurl`
   - `.ts` → `video/mp2t`
   - `.vtt` → `text/vtt`
   - `.jpg` → `image/jpeg`
4. Zet de instelling, zonder slash aan het eind:

```ts
export const MEDIA_BASE_URL = 'https://pub-xxxx.r2.dev'
```

5. `npm run build` en publiceer opnieuw. De catalogus blijft relatieve paden gebruiken.

Een lege string zet de site terug op de meegepubliceerde map. Als de bucket de bytes eenmaal heeft, kan `public/media` uit de repository. Tot die tijd is de map nodig voor Pages.

## Publiceren

`.github/workflows/pages.yml` draait de tests en de build bij elke push en elke pull request. Een push naar `main` zet `dist/` op GitHub Pages.

Eenmalig in de repository-instellingen: Settings → Pages → Build and deployment → Source: **GitHub Actions**.

De Vite-`base` is `/odin/`, passend bij `https://ddc9000.github.io/odin/`.

## Thema

`<html data-theme="forest-night">` is de donkere bosset. `forest-dawn` staat in hetzelfde tokenbestand. Componenten gebruiken alleen variabelen (`--bg`, `--text`, `--accent`, lettertypen, maten). Een eigen stijl vervangt die blokken.

## Grenzen van deze versie

- Eerste video's, placeholders en de echte eerste batch: hooguit 15 seconden. De pipeline zelf accepteert tot 180 seconden.
- Elk bestand onder 100 MB. De site blijft ruim onder 1 GB. De drie placeholders zitten daar ver onder.
- Geen login, geen upload, geen likes, geen reacties. De haakjes staan klaar en zijn uit.
