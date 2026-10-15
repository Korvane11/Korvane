#!/bin/bash
# Crops the square Blender frames into the two layouts and encodes them:
#   landscape: the bottom 9/16 of the square, 1280x720 (the cup on the right, the words on the left)
#   portrait:  the right 9/16 of the square, 720x1280 (the cup low, the words above)
# The intro's last frame is the loop's first (the loop's frame 0 is copied in as the intro's frame 144).
# bash render/blender/encode.sh <frames dir> [out dir]   (default <frames dir>/encoded; the site's assets/pour only once chosen)
set -e
F="$1"; OUT="${2:-$F/encoded}"; mkdir -p "$OUT"
cp "$F/loop/f0000.png" "$F/intro/f0144.png"
for L in l p; do
  if [ $L = l ]; then CROP="crop=iw:ih*9/16:0:ih*7/16,scale=1280:720:flags=lanczos"; CRF=21; WCRF=34
  else CROP="crop=iw*9/16:ih:iw*7/16:0,scale=720:1280:flags=lanczos"; CRF=24; WCRF=37; fi
  for K in intro loop; do
    ffmpeg -y -v error -framerate 24 -i "$F/$K/f%04d.png" -vf "$CROP" -c:v libx264 -preset slow -crf $CRF -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -an "$OUT/$K-$L.mp4"
    ffmpeg -y -v error -framerate 24 -i "$F/$K/f%04d.png" -vf "$CROP" -c:v libvpx-vp9 -b:v 0 -crf $WCRF -row-mt 1 -pix_fmt yuv420p -an "$OUT/$K-$L.webm"
  done
  ffmpeg -y -v error -i "$F/loop/f0000.png" -vf "$CROP" -q:v 3 "$OUT/hero-$L.jpg"
  ffmpeg -y -v error -i "$F/loop/f0000.png" -vf "$CROP" -c:v libwebp -quality 80 "$OUT/hero-$L.webp"
done
ls -la "$OUT"
