import { resolveMediaBase } from './media-url'

/**
 * The only media-location setting.
 *
 * Leave this empty to load files from the copy published with the site
 * (`<site>/media`, on GitHub Pages that is /odin/media).
 *
 * To move the bytes to Cloudflare R2 or any other public origin, set this
 * to that origin's base URL with no trailing slash, then rebuild:
 *
 *   export const MEDIA_BASE_URL = 'https://pub-xxxx.r2.dev'
 *
 * Catalog entries stay relative (`videos/<id>/master.m3u8`).
 * The new origin must allow GET from this site (CORS) and send the HLS
 * MIME types described in the README.
 */
export const MEDIA_BASE_URL = ''

export const mediaBaseUrl = resolveMediaBase(MEDIA_BASE_URL, import.meta.env.BASE_URL)
