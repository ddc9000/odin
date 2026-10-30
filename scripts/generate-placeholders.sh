#!/usr/bin/env bash
# Build the three 15-second placeholder tapes and run them through encode-video.sh.
# Re-running replaces the catalog with only these three entries.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Missing ffmpeg" >&2
  exit 1
fi

SRC_DIR="sources/placeholders"
mkdir -p "$SRC_DIR"

node --experimental-strip-types scripts/update-catalog.ts --init --catalog "${ROOT}/src/data/catalog.json"

render_source() {
  local out="$1" seed="$2" kind="$3" speed="$4"
  local c0="$5" c1="$6" c2="$7" c3="$8"
  local f1="$9" f2="${10}" f3="${11}"
  echo "Rendering source ${out}"
  ffmpeg -y -nostdin -hide_banner -loglevel error \
    -f lavfi -i "gradients=s=1920x1080:r=30:d=15:n=4:type=${kind}:speed=${speed}:seed=${seed}:c0=${c0}:c1=${c1}:c2=${c2}:c3=${c3}" \
    -f lavfi -i "sine=frequency=${f1}:sample_rate=48000:duration=15" \
    -f lavfi -i "sine=frequency=${f2}:sample_rate=48000:duration=15" \
    -f lavfi -i "sine=frequency=${f3}:sample_rate=48000:duration=15" \
    -f lavfi -i "anoisesrc=color=pink:amplitude=0.012:sample_rate=48000:duration=15" \
    -filter_complex "[0:v]noise=alls=7:allf=t,format=yuv420p[v];[1:a][2:a][3:a][4:a]amix=inputs=4:normalize=0:duration=first,lowpass=f=650,afade=t=in:st=0:d=1.2,afade=t=out:st=13.2:d=1.8,volume=0.16[a]" \
    -map "[v]" -map "[a]" \
    -t 15 -shortest \
    -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 18 \
    -c:a aac -b:a 128k -ar 48000 \
    "$out"

  local probed
  probed="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$out")"
  if ! awk -v d="$probed" 'BEGIN { exit !((d+0) > 0 && (d+0) <= 15.05) }'; then
    echo "Placeholder ${out} is ${probed}s; this batch must stay at or under 15 seconds" >&2
    exit 1
  fi
}

write_vtt() {
  local path="$1"
  local verse="$2"
  cat > "$path" <<EOF
WEBVTT

NOTE Henry Adams Bellows, translator. Hovamol. The Poetic Edda. New York: The American-Scandinavian Foundation, 1923. Public domain.

00:00:00.000 --> 00:00:15.000
${verse}
EOF
}

CITATION="Henry Adams Bellows, translator. Hovamol. The Poetic Edda. New York: The American-Scandinavian Foundation, 1923. Public domain."
CHANNEL_ID="skald-of-the-pines"
CHANNEL_NAME="Skáld of the Pines"
CHANNEL_HANDLE="@skald"

render_source "${SRC_DIR}/at-the-gate.mp4" 11 radial 0.012 \
  0x102018 0x1e3a2c 0x6d8a62 0xc4924a \
  98 146.83 196
write_vtt "${SRC_DIR}/at-the-gate.vtt" "$(cat <<'EOF'
Within the gates | ere a man shall go,
(Full warily let him watch,)
Full long let him look about him;
For little he knows | where a foe may lurk,
And sit in the seats within.
EOF
)"

render_source "${SRC_DIR}/the-road-alone.mp4" 27 linear 0.01 \
  0x1a140e 0x8a5a32 0x243028 0xc9a06a \
  110 174.61 220
write_vtt "${SRC_DIR}/the-road-alone.vtt" "$(cat <<'EOF'
Young was I once, | and wandered alone,
And nought of the road I knew;
Rich did I feel | when a comrade I found,
For man is man's delight.
EOF
)"

render_source "${SRC_DIR}/a-name-that-stays.mp4" 41 circular 0.014 \
  0x0c1218 0x1a3040 0x2c4038 0x8a7048 \
  82.41 123.47 164.81
write_vtt "${SRC_DIR}/a-name-that-stays.vtt" "$(cat <<'EOF'
Cattle die, | and kinsmen die,
And so one dies one's self;
But a noble name | will never die,
If good renown one gets.
EOF
)"

encode_one() {
  local id="$1" title="$2" stanza="$3" published="$4" description="$5"
  bash scripts/encode-video.sh \
    --source "${SRC_DIR}/${id}.mp4" \
    --subtitles "${SRC_DIR}/${id}.vtt" \
    --id "$id" \
    --title "$title" \
    --description "$description" \
    --channel-id "$CHANNEL_ID" \
    --channel-name "$CHANNEL_NAME" \
    --channel-handle "$CHANNEL_HANDLE" \
    --placeholder \
    --span-cue \
    --stanza "$stanza" \
    --citation "$CITATION" \
    --published-at "$published"
}

encode_one at-the-gate "At the Gate" 1 "2026-10-28T18:00:00.000Z" \
  "Placeholder for the ODIN pipeline, not a finished recording. A slow moss gradient, a little noise, and a low drone. Hávamál stanza 1, in the 1923 translation by Henry Adams Bellows, stays on screen the whole time."

encode_one the-road-alone "The Road Alone" 47 "2026-10-29T18:00:00.000Z" \
  "Placeholder. Dusk colours drift across the frame under a soft chord. Hávamál 47, Bellows 1923, held for the full length of the clip."

encode_one a-name-that-stays "A Name That Stays" 77 "2026-10-30T18:00:00.000Z" \
  "Placeholder. Night colours and a quiet low chord. Hávamál 77, Bellows 1923: the stanza about a name that outlasts cattle and kin."

echo "Placeholder catalog is ready."
