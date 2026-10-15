#!/bin/bash
# Renders the Blender opening (the intro, 144 frames, then the steam loop, 48 frames) as 1200 px squares,
# then encodes both layouts. Resumable: frames on disk are skipped. About 5-6 h on 4 cores.
# Writes its PID to <frames dir>/render.pid and touches <frames dir>/done at the end: wait on those, never on a
# process search (a pgrep -f pattern also matches the shell that runs it).
# bash render/blender/render_all.sh <frames dir>
set -e
OUT="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"; echo $$ > "$OUT/render.pid"; rm -f "$OUT/done"
python3 "$HERE/scene.py" "$OUT/intro" --mode intro --size 1200 --samples 32
python3 "$HERE/scene.py" "$OUT/loop" --mode loop --size 1200 --samples 32
bash "$HERE/encode.sh" "$OUT"
touch "$OUT/done"
