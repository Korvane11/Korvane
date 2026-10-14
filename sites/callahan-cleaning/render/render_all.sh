#!/bin/bash
# Render every 3D frame and still for the site (Blender 5.2 via `pip install bpy`, Cycles on the CPU).
# Frames land in render/out/ (not committed); encode.sh turns them into the site's videos and images.
# Resumable: frames already on disk are skipped. About 8 hours on 4 cores.
set -e
cd "$(dirname "$0")/.."
OUT=render/out
python3 render/fetch_assets.py
for L in land port; do
  # the opening: every frame; the loop: every other frame (encode.sh interpolates the rest)
  python3 render/scene.py film $OUT/film-$L --layout $L --frames 1-96 --samples 32
  python3 render/scene.py film $OUT/film-$L --layout $L --frames 97-168:2 --samples 32
done
for S in living kitchen moving rental office; do
  python3 render/scene.py $S $OUT/stills --samples 256
done
