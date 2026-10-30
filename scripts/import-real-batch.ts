/**
 * Replace the catalog with the real first batch.
 * Each source is a short mp4 whose stanza is already in the picture.
 * This writes a WebVTT cue for the whole clip and runs encode-video.sh.
 *
 *   node --experimental-strip-types scripts/import-real-batch.ts \
 *     --json uploads/odin-videos.json --dir uploads
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { videoIdFromTitle } from '../src/pipeline/ids.ts'

interface Entry {
  source: string
  title: string
  stanza: number
  stanza_text: string
  description_nl: string
  translation: string
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

const jsonPath = arg('--json')
const dir = arg('--dir')
if (!jsonPath || !dir) {
  console.error('Usage: import-real-batch.ts --json catalog.json --dir folder-of-mp4s')
  process.exit(1)
}

const entries = JSON.parse(readFileSync(jsonPath, 'utf8')) as Entry[]
if (!Array.isArray(entries) || entries.length === 0) {
  console.error('Catalog JSON is empty')
  process.exit(1)
}

function findSource(folder: string, source: string): string {
  const stem = source.replace(/\.mp4$/i, '')
  const names = readdirSync(folder)
  const match = names.find((name) => name === source || name.startsWith(`${stem}_`) || name.startsWith(`${stem}.`))
  if (!match) throw new Error(`Missing ${source} in ${folder}`)
  return path.join(folder, match)
}

const sources = entries.map((entry) => ({ entry, file: findSource(dir, entry.source) }))

const media = path.join(root, 'public/media/videos')
rmSync(media, { recursive: true, force: true })
mkdirSync(media, { recursive: true })

const catalog = path.join(root, 'src/data/catalog.json')
const init = spawnSync('node', ['--experimental-strip-types', 'scripts/update-catalog.ts', '--init', '--catalog', catalog], {
  cwd: root,
  stdio: 'inherit',
})
if (init.status !== 0) process.exit(init.status ?? 1)

const vttDir = path.join(root, 'sources/real-batch')
mkdirSync(vttDir, { recursive: true })

sources.forEach(({ entry, file }, index) => {
  const id = videoIdFromTitle(entry.title)
  const vttPath = path.join(vttDir, `${id}.vtt`)
  const body = entry.stanza_text.replace(/\r\n/g, '\n').trim()
  writeFileSync(
    vttPath,
    `WEBVTT\n\nNOTE ${entry.translation}\n\n00:00:00.000 --> 00:00:15.000\n${body}\n`,
  )
  const day = String(22 + index).padStart(2, '0')
  const published = `2026-10-${day}T18:00:00.000Z`
  console.log(`\n${entry.source} -> ${id}`)
  const child = spawnSync(
    'bash',
    [
      'scripts/encode-video.sh',
      '--source',
      file,
      '--subtitles',
      vttPath,
      '--id',
      id,
      '--title',
      entry.title,
      '--description',
      entry.description_nl,
      '--channel-id',
      'odin-forest',
      '--channel-name',
      'ODIN · Forest',
      '--channel-handle',
      '@odin',
      '--stanza',
      String(entry.stanza),
      '--citation',
      entry.translation,
      '--published-at',
      published,
      '--ai-generated',
      '--span-cue',
    ],
    { cwd: root, stdio: 'inherit' },
  )
  if (child.status !== 0) process.exit(child.status ?? 1)
})

console.log(`Imported ${sources.length} videos.`)
