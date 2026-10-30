#!/usr/bin/env bash
# Turn one source MP4 and a WebVTT file into HLS (360p, 720p, 1080p),
# a thumbnail and a catalog entry under public/media.
#
# The pipeline accepts sources up to 180 seconds. The first ODIN batch
# is capped at 15 seconds by the people making the videos, not by this script.
# Every output file must stay under 100 MB.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SOURCE=""
SUBTITLES=""
ID=""
TITLE=""
DESCRIPTION=""
CHANNEL_ID=""
CHANNEL_NAME=""
CHANNEL_HANDLE=""
PLACEHOLDER="0"
AI_GENERATED="0"
SPAN_CUE="0"
STANZA=""
CITATION=""
PUBLISHED_AT=""
MAX_SECONDS="180.05"

usage() {
  cat <<'EOF'
Usage: scripts/encode-video.sh --source FILE --subtitles FILE.vtt --id SLUG \
  --title TEXT --description TEXT --channel-id SLUG --channel-name TEXT \
  --channel-handle @name [options]

Options:
  --placeholder     Mark the catalog entry as a pipeline placeholder
  --ai-generated    Mark the picture and sound as generated for ODIN
  --span-cue        Stretch the single WebVTT cue so it covers the whole video
  --stanza N        Hávamál stanza number
  --citation TEXT   Source line stored on the catalog entry
  --published-at ISO-8601
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="${2:-}"; shift 2 ;;
    --subtitles) SUBTITLES="${2:-}"; shift 2 ;;
    --id) ID="${2:-}"; shift 2 ;;
    --title) TITLE="${2:-}"; shift 2 ;;
    --description) DESCRIPTION="${2:-}"; shift 2 ;;
    --channel-id) CHANNEL_ID="${2:-}"; shift 2 ;;
    --channel-name) CHANNEL_NAME="${2:-}"; shift 2 ;;
    --channel-handle) CHANNEL_HANDLE="${2:-}"; shift 2 ;;
    --stanza) STANZA="${2:-}"; shift 2 ;;
    --citation) CITATION="${2:-}"; shift 2 ;;
    --published-at) PUBLISHED_AT="${2:-}"; shift 2 ;;
    --placeholder) PLACEHOLDER="1"; shift ;;
    --ai-generated) AI_GENERATED="1"; shift ;;
    --span-cue) SPAN_CUE="1"; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

for tool in ffmpeg ffprobe node; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing $tool" >&2
    exit 1
  fi
done

missing=0
for value in "$SOURCE" "$SUBTITLES" "$ID" "$TITLE" "$DESCRIPTION" "$CHANNEL_ID" "$CHANNEL_NAME" "$CHANNEL_HANDLE"; do
  if [[ -z "$value" ]]; then
    missing=1
  fi
done
if [[ "$missing" -eq 1 ]]; then
  echo "Missing a required argument" >&2
  usage >&2
  exit 2
fi

if [[ ! -f "$SOURCE" ]]; then
  echo "Source not found: $SOURCE" >&2
  exit 1
fi
if [[ ! -f "$SUBTITLES" ]]; then
  echo "Subtitles not found: $SUBTITLES" >&2
  exit 1
fi
if ! head -n 1 "$SUBTITLES" | grep -q '^WEBVTT'; then
  echo "Subtitles must be a WebVTT file starting with WEBVTT" >&2
  exit 1
fi
if [[ ! "$ID" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "id must be a lowercase slug" >&2
  exit 1
fi
if [[ ! "$CHANNEL_ID" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "channel id must be a lowercase slug" >&2
  exit 1
fi
if [[ ! "$CHANNEL_HANDLE" =~ ^@[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "channel handle must look like @name" >&2
  exit 1
fi

DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$SOURCE")"
if ! awk -v d="$DURATION" -v max="$MAX_SECONDS" 'BEGIN { exit !((d+0) >= 1 && (d+0) <= max) }'; then
  echo "Source duration ${DURATION}s is outside 1–180s" >&2
  exit 1
fi

OUT="public/media/videos/${ID}"
rm -rf "$OUT"
mkdir -p "$OUT"

echo "ODIN encode ${ID} (${DURATION}s)"

encode_variant() {
  local name="$1" width="$2" height="$3" bitrate="$4" maxrate="$5" bufsize="$6"
  local dir="${OUT}/${name}"
  mkdir -p "$dir"
  echo "  ${name}"
  ffmpeg -y -nostdin -hide_banner -loglevel error \
    -i "$SOURCE" \
    -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
    -c:v libx264 -profile:v main -level:v 4.0 -pix_fmt yuv420p \
    -preset veryfast \
    -b:v "$bitrate" -maxrate "$maxrate" -bufsize "$bufsize" \
    -sc_threshold 0 -g 48 -keyint_min 48 \
    -c:a aac -b:a 64k -ac 2 -ar 48000 \
    -t 180 \
    -hls_time 4 \
    -hls_playlist_type vod \
    -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -hls_segment_filename "${dir}/seg_%03d.ts" \
    -f hls "${dir}/index.m3u8"
}

ffmpeg -y -nostdin -hide_banner -loglevel error \
  -ss 1 -i "$SOURCE" -frames:v 1 \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -q:v 3 "${OUT}/thumb.jpg"

encode_variant 360p 640 360 400k 520k 800k
encode_variant 720p 1280 720 900k 1200k 1800k
encode_variant 1080p 1920 1080 1600k 2200k 3200k

cp "$SUBTITLES" "${OUT}/subtitles.vtt"
if [[ "$SPAN_CUE" == "1" ]]; then
  node --experimental-strip-types scripts/prepare-vtt.ts --span --duration "$DURATION" "${OUT}/subtitles.vtt"
else
  node --experimental-strip-types scripts/prepare-vtt.ts "${OUT}/subtitles.vtt"
fi

node --experimental-strip-types scripts/write-master.ts --dir "$OUT" --duration "$DURATION"

if [[ -z "$PUBLISHED_AT" ]]; then
  PUBLISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
fi

export ODIN_ID="$ID"
export ODIN_TITLE="$TITLE"
export ODIN_DESCRIPTION="$DESCRIPTION"
export ODIN_CHANNEL_ID="$CHANNEL_ID"
export ODIN_CHANNEL_NAME="$CHANNEL_NAME"
export ODIN_CHANNEL_HANDLE="$CHANNEL_HANDLE"
export ODIN_DURATION="$DURATION"
export ODIN_PUBLISHED_AT="$PUBLISHED_AT"
export ODIN_PLACEHOLDER="$PLACEHOLDER"
export ODIN_AI_GENERATED="$AI_GENERATED"
export ODIN_STANZA="$STANZA"
export ODIN_CITATION="$CITATION"
export ODIN_VTT_PATH="${OUT}/subtitles.vtt"

node --experimental-strip-types scripts/update-catalog.ts --catalog "${ROOT}/src/data/catalog.json"

echo "Wrote ${OUT}/master.m3u8"
