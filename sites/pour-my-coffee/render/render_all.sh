#!/bin/bash
# Renders every frame of the intro and the steam loop, landscape and portrait (the two run side by side),
# then encodes them. Resumable: frames already on disk are skipped.
# bash render_all.sh <frames dir>   (about 2.5 h on 4 CPU cores with SwiftShader)
set -e
OUT="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"
export NODE_PATH="$(npm root -g)" RESUME=1
( node "$HERE/render_pour.cjs" "$OUT/intro-l" 0 0 1440 810 24 4 && node "$HERE/render_pour.cjs" "$OUT/loop-l" 0 1 1440 810 24 2 ) > "$OUT/l.log" 2>&1 &
( node "$HERE/render_pour.cjs" "$OUT/intro-p" 1 0 720 1280 24 4 && node "$HERE/render_pour.cjs" "$OUT/loop-p" 1 1 720 1280 24 2 ) > "$OUT/p.log" 2>&1 &
wait
echo "ALL FRAMES DONE"
bash "$HERE/encode.sh" "$OUT"
