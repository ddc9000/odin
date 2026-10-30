# Uitbreidingen die uit staan

Deze versie is alleen-lezen. Accounts, uploads, likes en reacties hebben wel een plek in de code, zodat een latere versie ze niet in de pagina's hoeft te verzinnen. Ze doen nog niets. De vlaggen staan in `src/features.ts` en zijn alle vier `false`. De site importeert de poorten niet. Een aanroep gooit `FeatureDisabledError`.

## Vlaggen

| Vlag | Poort | Wat er later bij komt |
| --- | --- | --- |
| `accounts` | `AuthPort` | Wie er ingelogd is |
| `uploads` | `UploadPort` | Een bronbestand aanleveren |
| `likes` | `LikePort` | Een hartje per video, per gebruiker |
| `comments` | `CommentPort` | Reacties onder een video |

Zet een vlag pas op `true` als de bijbehorende poort een echte implementatie heeft. De tests in `tests/features.test.ts` verwachten dat ze uit staan.

## Types

`src/future/types.ts`:

- `User` — `id`, `displayName`, `handle`, `email`
- `Session` — `userId`, `token`, `expiresAt`
- `Comment` — `id`, `videoId`, `userId`, `body`, `createdAt`
- `Like` — `videoId`, `userId`, `createdAt`
- `UploadRequest` — `videoId`, titel, beschrijving, bronbestand, ondertitelbestand

`AuthPort` heeft `currentUser`, `signIn(email)` en `signOut`. Er is bewust geen wachtwoordveld: een latere login hoort via een echte provider, niet via een geheim in deze repository.

Likes en reacties hangen aan `videoId` plus `userId`. De catalogus blijft de bron voor titel, duur en mediapaden. Tellingen en reacties komen uit de nieuwe poorten, niet uit `catalog.json`.

## Waar het in de interface zou landen

- **Account** — rechts in de bovenbalk. Nu is die plek leeg.
- **Upload** — een eigen route, niet een knop op de kijkpagina. De browser stuurt de bron en het WebVTT-bestand naar een server. Die server draait `scripts/encode-video.sh` (of dezelfde ffmpeg-stappen) en schrijft de HLS-uitvoer naar de media-origin. De browser maakt geen HLS.
- **Like** — in de rij onder de titel, naast de kanaalnaam. Uit zolang er geen gebruiker is.
- **Reacties** — onder de beschrijving. De suggestiekolom blijft voor andere video's.

## Wat er niet in deze versie zit

Geen sessiecookie, geen wachtwoord, geen formulier, geen endpoint. `createDisabledAuth` en de andere functies in `src/future/disabled.ts` zijn de implementatie zolang de vlag uit staat. Een echte poort krijgt dezelfde interface, en de pagina krijgt pas knoppen als de vlag aan gaat.
