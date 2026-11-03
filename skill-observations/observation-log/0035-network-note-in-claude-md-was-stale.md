---
id: 35
title: "CLAUDE.md states the network level as a fact; this session's network blocked the sites it implies are reachable"
status: open
type: open-source
skill: []
proposes_skill: []
target_file: [CLAUDE.md]
siblings_checked: "none: the fix belongs in the project instructions (SimNow 'Network' line), not a skill"
area: "Project memory about the environment's network access"
date: 2026-11-03
session_context: "Building a Tucson cold-call lead list (scratchpad leads/tucson-leads-2026-11-03.md)"
parked_until:
resolved:
resolution:
reference:
commands_verified: "run: curl to haleysbakehouse.godaddysites.com, www.google.com, www.yelp.com, ecorp.azcc.gov, simnowusa.com: all CONNECT 403 at the agent proxy; WebFetch: ENOTFOUND. WebSearch worked."
---

**Issue:** CLAUDE.md says "the owner set this environment's Network access to
Full on 2026-10-12, so simnowusa.com loads". In this session every direct
fetch (simnowusa.com included, plus Google, Yelp, the Arizona Corporation
Commission and every small-business site) was refused at the proxy. The
research had to fall back to search-engine summaries, and the first tool
calls were spent discovering that. The note reads as a permanent fact but
describes one environment on one date; sessions can run in a different
environment or after the setting changed.

**Suggested improvement:** Reword the CLAUDE.md line as dated history plus a
probe: "Network was Full on 2026-10-12. Check before relying on it:
`curl -s -o /dev/null -w '%{http_code}' https://simnowusa.com` (000 with a
proxy 403 means blocked; fall back to WebSearch and tell the owner which
hosts to allow)."

**Principle:** Environment facts in project memory (network level, installed
tools, credentials) are snapshots, not invariants. Record them with a date
and the one-line probe that re-checks them, so a session verifies before it
plans around them.
