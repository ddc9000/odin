import { readFileSync, writeFileSync } from 'node:fs'
import { ensureTimestampMap, spanSingleCue } from '../src/pipeline/vtt-file.ts'

const args = process.argv.slice(2)
const span = args.includes('--span')
const durationFlag = args.indexOf('--duration')
const duration = durationFlag === -1 ? undefined : Number(args[durationFlag + 1])
const file = args.filter((arg, index) => {
  if (arg.startsWith('--')) return false
  if (durationFlag !== -1 && index === durationFlag + 1) return false
  return true
})[0]

if (!file) {
  console.error('Usage: prepare-vtt.ts [--span --duration seconds] file.vtt')
  process.exit(1)
}

let text = readFileSync(file, 'utf8')
if (span) {
  if (!Number.isFinite(duration)) {
    console.error('--span requires --duration')
    process.exit(1)
  }
  text = spanSingleCue(text, duration as number)
}
writeFileSync(file, ensureTimestampMap(text))
