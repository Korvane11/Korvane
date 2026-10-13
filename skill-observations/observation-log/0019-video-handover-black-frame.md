---
id: 19
title: "Handing an intro video over to a loop on the loop's 'playing' event showed a black frame; the first check written for it passed on the broken code, because a preloaded, paused video already reports a presented frame"
status: open
type: open-source
skill: [webapp-testing]
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009) as the home for background-footage intros; 0009 covers when an intro starts and what chrome it carries, not the hand-over to a loop, so this is a new finding, not a restatement; skill-families.md Browser testing: webapp-testing added for the testing half (recipes read before: nothing on video frames); playwright-cli excluded: a command reference, the point is about what to measure, assumed, not read; no installed skill covers video layering (gsap-*, threejs-*, lightweight-3d-effects handle animation and real-time 3D only), so no other propagation"
area: "Intro sequencing: handing an intro clip over to a seamless loop; testing that hand-over"
date: 2026-10-13
session_context: "Eleven Cafē site: a rendered espresso pour (intro video) hands over to a steam loop whose first frame is the pour's last"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/js/home.js startLoop; sites/eleven-cafe/tests/behave.cjs, 'no black frame at the hand-over'"
commands_verified: "run: 30 screenshots 50-100 ms apart across the hand-over at 1440x900, mean brightness of the cup area: old code, one shot at 11.0 (black) among shots at 118; fixed code, all 30 between 118.1 and 118.7. run: first check (requestVideoFrameCallback registered at DOMContentLoaded) on the old code: passed, loopFrame 358 ms against a hand-over at 4519 ms. run: check with the callback registered on the loop's 'playing' event: old code FAIL (pour hidden at 4666 ms, loop's first frame at 4709 ms), fixed code ok twice (4501/4501, 4542/4542)"
---

**Issue:** The home page plays a rendered intro video, then a seamless
steam loop whose first frame is the intro's last frame. The page swapped
them on the loop's `playing` event: it showed the loop and hid the intro in
the same step. At that moment the loop had not yet put a frame on screen,
so for one frame there was nothing to see: a black flash where the cup had
been. A screenshot taken at 4.3 s happened to catch it. The fix keeps the
intro showing until the loop's first frame is on screen
(`requestVideoFrameCallback` on the loop, then hide the intro on the next
animation frame), with a 500 ms timer where that callback is missing.

The first automated check for it passed on the broken code. It recorded
the loop's first presented frame from page load, and a loop given
`preload="auto"` and `load()` presents its first frame while still paused
and invisible, minutes before the hand-over. Registering the frame
callback on the loop's `playing` event measured the right moment: the
check then failed on the old code and passed on the fix.

**Suggested improvement:**

- For the candidate skill: when one video takes over from another, keep
  the outgoing one visible under the incoming one until the incoming one
  has a frame on screen. Hide it on the incoming video's next presented
  frame, never on `playing`.
- In webapp-testing's recipes: to test "no black frame", record the
  incoming video's first presented frame after it starts playing (a frame
  callback registered on its `playing` event), and check that the outgoing
  layer was hidden no earlier. Back it with rapid screenshots of the area,
  measuring brightness.

**Principle:** "Playing" is not "on screen". A layer swap timed on a
playback event can show nothing for a frame. Wait for proof that the new
picture is painted before removing the old one. A check of that proof has
to measure the moment of the swap, or it will pass on the bug.
