/** Pipeline ceiling. The first seed tapes are 15s; later tapes may use this. */
export const MAX_DURATION_SEC = 180

/** GitHub's hard file limit, and ours. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024

const DURATION_TOLERANCE_SEC = 0.05

export function assertSourceDuration(seconds: number): void {
  if (!Number.isFinite(seconds) || seconds < 1) {
    throw new Error(`Source must be at least 1 second (got ${String(seconds)})`)
  }
  if (seconds > MAX_DURATION_SEC + DURATION_TOLERANCE_SEC) {
    throw new Error(
      `Source is ${seconds.toFixed(3)}s. This pipeline accepts videos up to ${MAX_DURATION_SEC}s.`,
    )
  }
}

export function oversizedFiles(files: { path: string; bytes: number }[], maxBytes = MAX_FILE_BYTES) {
  return files.filter((file) => file.bytes >= maxBytes)
}
