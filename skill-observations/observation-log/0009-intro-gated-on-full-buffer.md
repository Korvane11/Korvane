---
id: 9
title: "A cinematic intro waited for the whole clip to buffer and carried loader and skip chrome the brief never asked for; the owner saw a long black screen and had all of it removed"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "no family registry yet; searched every installed skill for preloader, loading screen, skip intro and canplaythrough guidance: only barba-js (page-transition loading screens) and react-three-fiber (an asset Preloader example) mention loaders, neither covers a video-background intro; reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008) as the home for background-footage intros; no propagation to installed skills"
area: "intro sequencing: when a video-background intro starts, and what UI it carries"
date: 2026-10-12
session_context: "SimNow site: the owner asked to 'take away the skip intro bar when the website is loading and not have it on a black screen for so long and also take away the warming up thing'"
parked_until:
resolved:
resolution:
reference: "sites/simnow/js/main.js startPlayback() and START_WAIT; sites/simnow/README.md, The tail-lights intro"
commands_verified: "run: Playwright timing test, local server: the clip was playing ~30-50 ms after DOMContentLoaded and the site opened ~2 s later (previously gated on canplaythrough with a 9 s timeout); run: the clip response held back 5 s, the site opened on the poster 2.5 s after boot and the drive started by itself at rate 1 when the file arrived; run: reduced motion still sets preload none and downloads nothing"
---

**Issue:** The intro was built to start only once the clip fired
`canplaythrough`, with a 9 s timeout. On a desktop with a warm cache this is
instant. On a phone it isn't: iOS often won't buffer a video until `play()`
is called, so `canplaythrough` may never fire and the wait runs to the
timeout. The page also had chrome the owner never asked for:
- a progress meter;
- a "Warming up" label;
- a "Skip intro" button.

To the owner, this read as a long black screen with clutter on it. They
asked for all three to go, and for less time on black.

The brief only ever said: "opens on black, the lights come on, the site
opens". The meter, label and skip button were defaults that came from
generic intro practice, not from that brief.

**Suggested improvement:** In the scroll-film-renders candidate (the home
for background-footage intros), describe the intro start as:
1. Set the video source as the element is parsed, not after the scripts
   at the end of the page have run.
2. Call `play()` at once, and start the intro on the first `playing` event.
   Never wait for `canplaythrough`: it means the whole clip is buffered,
   and some mobile browsers won't buffer before a play call.
3. Cap the black wait at 2-3 s. Past the cap, open the site on the poster
   frame, and let a keep-alive start the clip when it arrives.
4. Add no loader text, progress bar or skip control unless the brief asks
   for one. Keep the whole intro short enough (about 2 s to the site) that
   a skip button isn't needed.
5. Test the slow path by holding back only the clip's response (e.g.
   Playwright `page.route` with a delay). Throttling the whole network
   slows the page scripts as well, so the cap never gets exercised.

**Principle:** A brief that describes a sequence ("black, then lights, then
the site") also tells you what is NOT in it. Loading chrome and skip
controls are additions to the owner's design, and they cost time on screen.
Gate the first beat on the earliest frame the browser can show, not on the
whole asset, and fall back to a still frame rather than to more waiting.
