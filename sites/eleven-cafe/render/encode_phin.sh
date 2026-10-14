#!/bin/bash
# Encodes the rendered phin loop into assets/phin/: H.264 MP4 (Safari and most browsers), VP9 WebM (Chromium
# builds without H.264, like Playwright's) and the still (reduced motion, a data saver, before the clip loads).
# bash render/encode_phin.sh <frames dir> [still frame, default 21: two beads hanging, rings on the surface]
set -e
F="$1"; N="${2:-21}"; OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/phin"; mkdir -p "$OUT"
ffmpeg -y -v error -framerate 24 -i "$F/f%04d.png" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -an "$OUT/phin.mp4"
ffmpeg -y -v error -framerate 24 -i "$F/f%04d.png" -c:v libvpx-vp9 -b:v 0 -crf 30 -row-mt 1 -pix_fmt yuv420p -an "$OUT/phin.webm"
STILL=$(printf '%s/f%04d.png' "$F" "$N")
ffmpeg -y -v error -i "$STILL" -q:v 3 "$OUT/phin.jpg"
ffmpeg -y -v error -i "$STILL" -c:v libwebp -quality 82 "$OUT/phin.webp"
ls -la "$OUT"
