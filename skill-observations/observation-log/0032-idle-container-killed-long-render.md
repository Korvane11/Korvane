---
id: 32
title: "A 5-hour offline render started with nohup in a cloud session died twice when the session went idle and the container was reclaimed: once after a 2-hour background waiter hit its time limit, once between two user turns; each time the owner was told an ETA the render could not meet"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "reuses the open candidate scroll-film-renders (long offline renders); no installed skill covers running long jobs in an ephemeral cloud container; the blueprint's Build section is where render budgets are set; checked"
area: "Running multi-hour background jobs in a cloud container that is reclaimed when the session is idle"
date: 2026-10-15
session_context: "Pour My Coffee Co site: the Blender (Cycles, CPU) opening, 240 frames at about 70 s a frame, started with nohup and waited on by a background until-loop (2 h maximum)"
parked_until:
resolved:
resolution:
reference: "sites/pour-my-coffee/render/blender/render_all.sh (resumable; writes render.pid and a done file)"
commands_verified: "run: after the waiter was stopped at its 2 h limit and the turn ended, the next turn found render.pid not alive and 110 of 240 frames; restarted, it was found dead again after the next idle gap at 114 frames. run: the frames already written survived in /tmp both times, and the resumable script skipped them"
---

**Issue:** The render was planned at 5-6 hours on 4 CPU cores and started
with `nohup ... &`. A background waiter (`run_in_background`, 2 h maximum)
kept the session active; when it hit its limit and the turn ended, the
container was reclaimed after a period of inactivity and the render died
(110 of 240 frames). After a restart it died again across the next idle gap
(114 frames). Both times the owner had just been given a finish time that
assumed the job would keep running. The environment notes say the container
is reclaimed after inactivity, but nothing connected that to "a job longer
than a waiter's time limit will not survive".

**Suggested improvement:** In the blueprint's Build section (and the
render skill if it is built): budget offline renders to finish inside one
background waiter's time limit (2 h here), measured from a timed test frame
(frames x seconds per frame), and cut frames, size or samples to fit before
starting; make every render resumable; and when a job must run longer,
re-arm a waiter before the old one expires, never leave the session idle,
and give the owner a finish time only for the part a live waiter covers.

**Principle:** In an environment that reclaims idle machines, a background
job lives only as long as something keeps the session busy. Size long jobs
to the longest wait the session can hold, or chain the waits, and promise
times only for what is covered.
