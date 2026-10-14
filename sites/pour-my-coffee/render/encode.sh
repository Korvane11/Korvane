#!/bin/bash
# Encodes the rendered frames into assets/pour/: H.264 MP4 (Safari and most browsers), VP9 WebM (Chromium builds
# without H.264, like Playwright's) and the stills (the poster is the loop's first frame = the intro's last).
# bash render/encode.sh <frames dir> [layouts]
set -e
F="$1"; OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/pour"; mkdir -p "$OUT"
for L in ${2:-l p}; do
  cp "$F/loop-$L/f0000.png" "$F/intro-$L/f0120.png"   # the intro's last frame is the loop's first: a seamless hand-over
  if [ "$L" = l ]; then CRF=21; WCRF=34; else CRF=24; WCRF=37; fi
  for K in intro loop; do
    ffmpeg -y -v error -framerate 24 -i "$F/$K-$L/f%04d.png" -c:v libx264 -preset slow -crf $CRF -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -an "$OUT/$K-$L.mp4"
    ffmpeg -y -v error -framerate 24 -i "$F/$K-$L/f%04d.png" -c:v libvpx-vp9 -b:v 0 -crf $WCRF -row-mt 1 -pix_fmt yuv420p -an "$OUT/$K-$L.webm"
  done
  ffmpeg -y -v error -i "$F/loop-$L/f0000.png" -q:v 3 "$OUT/hero-$L.jpg"
  ffmpeg -y -v error -i "$F/loop-$L/f0000.png" -c:v libwebp -quality 80 "$OUT/hero-$L.webp"
done
ls -la "$OUT"
