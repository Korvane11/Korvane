#!/bin/bash
# Encodes the rendered frames into assets/pour/: H.264 MP4 (Safari and most browsers),
# VP9 WebM (Chromium builds without H.264, like Playwright's) and the stills.
# bash render/encode.sh <frames dir> [layouts]   (the dir render_all.sh wrote; layouts: "l p" by default)
set -e
F="$1"; OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/pour"; mkdir -p "$OUT"
for L in ${2:-l p}; do
  # the intro's last frame is the loop's first, so the hand-over is seamless
  cp "$F/loop-$L/f0000.png" "$F/intro-$L/f0103.png"
  for K in intro loop; do
    ffmpeg -y -v error -framerate 24 -i "$F/$K-$L/f%04d.png" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -an "$OUT/$K-$L.mp4"
    ffmpeg -y -v error -framerate 24 -i "$F/$K-$L/f%04d.png" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -pix_fmt yuv420p -an "$OUT/$K-$L.webm"
  done
  # the still: the settled cup with its steam (the loop's first frame)
  ffmpeg -y -v error -i "$F/loop-$L/f0000.png" -q:v 3 "$OUT/hero-$L.jpg"
  ffmpeg -y -v error -i "$F/loop-$L/f0000.png" -c:v libwebp -quality 82 "$OUT/hero-$L.webp"
done
ls -la "$OUT"
