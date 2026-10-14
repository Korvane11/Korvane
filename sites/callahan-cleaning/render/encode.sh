#!/bin/bash
# Turn the rendered frames (render/out/) into the site's films and stills.
#   intro-{l,p}.{mp4,webm}  frames 1-96, 24 fps (4 s): the blinds open
#   loop-{l,p}.{mp4,webm}   frames 97-168 (3 s, seamless): rendered every other frame, the rest interpolated
#   still-{l,p}.jpg         frame 96: the poster, the fallback and the reduced-motion picture
# MP4 (H.264) for browsers, WebM (VP9) for Chromium builds without H.264 (Playwright's).
# A light temporal-only denoise (hqdn3d, spatial 0) calms the shimmer each frame's own denoising leaves on the walls.
set -e
TD="hqdn3d=0:0:5:5"
cd "$(dirname "$0")/.."
OUT=render/out
DST=assets/film
mkdir -p $DST
for L in land port; do
  S=${L:0:1}
  F=$OUT/film-$L
  [ -f $F/0096.png ] || { echo "film-$L not rendered yet"; continue; }
  # the opening
  ffmpeg -y -loglevel error -framerate 24 -start_number 1 -i $F/%04d.png -frames:v 96 -vf $TD \
    -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -profile:v high $DST/intro-$S.mp4
  ffmpeg -y -loglevel error -framerate 24 -start_number 1 -i $F/%04d.png -frames:v 96 -vf $TD \
    -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -pix_fmt yuv420p $DST/intro-$S.webm
  # the loop: 36 rendered frames (97, 99 ... 167) plus 97 again at the end so the interpolation wraps
  T=$(mktemp -d)
  i=0
  for f in $(seq 97 2 167) 97; do cp $F/$(printf %04d $f).png $T/$(printf %03d $i).png; i=$((i+1)); done
  ffmpeg -y -loglevel error -framerate 12 -i $T/%03d.png -vf "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,hqdn3d=0:0:5:5" $T/interp_%03d.png
  # keep 72 frames: 97 ... 168 (the next would be 97 again)
  ffmpeg -y -loglevel error -framerate 24 -i $T/interp_%03d.png -frames:v 72 \
    -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -profile:v high $DST/loop-$S.mp4
  ffmpeg -y -loglevel error -framerate 24 -i $T/interp_%03d.png -frames:v 72 \
    -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -pix_fmt yuv420p $DST/loop-$S.webm
  rm -rf $T
  python3 -c "from PIL import Image; Image.open('$F/0096.png').convert('RGB').save('$DST/still-$S.jpg', quality=84, optimize=True, progressive=True)"
  python3 -c "from PIL import Image; Image.open('$F/0001.png').convert('RGB').save('$DST/first-$S.jpg', quality=80, optimize=True, progressive=True)"
done
# the service stills: JPEG for every browser
for f in $OUT/stills/*.png; do
  [ -e "$f" ] || continue
  n=$(basename $f .png)
  python3 -c "from PIL import Image; Image.open('$f').convert('RGB').save('assets/renders/$n.jpg', quality=82, optimize=True, progressive=True)"
done
ls -la $DST assets/renders
