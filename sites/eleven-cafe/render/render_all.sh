#!/bin/bash
# Renders every frame of the intro and the steam loop, landscape and portrait, then encodes them.
# bash render_all.sh <frames dir>   (about 1.5 h on 4 CPU cores with SwiftShader)
set -e
OUT="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"
export NODE_PATH="$(npm root -g)"
node "$HERE/render_pour.cjs" "$OUT/intro-l" 0 0 1600 900 24 4
node "$HERE/render_pour.cjs" "$OUT/loop-l"  0 1 1600 900 24 1
node "$HERE/render_pour.cjs" "$OUT/intro-p" 1 0 900 1600 24 4
node "$HERE/render_pour.cjs" "$OUT/loop-p"  1 1 900 1600 24 1
echo "ALL FRAMES DONE"
