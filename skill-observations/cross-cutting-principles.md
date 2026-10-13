# Cross-Cutting Principles

Principles that apply to all skills. Read as a mandatory checklist during
any skill creation or regeneration.

---

## Active Principles

### 1. A check counts once it has been seen failing
**Added:** 2026-10-13
**Applies to:** all skills with checks, tests or audits
**Requirement:** Before a check is trusted to pass anything, run it against a case known to be broken and see it fail. A presence check ("is X there?") passes a broken X, and a test written against the wrong measure (a phone overflow measured against `innerWidth`) passes every page. Name the broken case the check was proven on.
**Propagation:** opportunistic
**Status:** active
**From:** observations #6, #11, #12

### 2. The brief is satisfied by the build, beat by beat
**Added:** 2026-10-13
**Applies to:** all skills that build or rework something for a person
**Requirement:** Write down what the person asked for as beats, in their words, and name what in the current build delivers each one. Re-check every beat after any change underneath (a new asset, a new structure, another library). Things they have already approved are part of the brief: keep them unless the request names them, and report each as unchanged or changed. Add nothing the brief didn't ask for (loaders, skip buttons, extra steps) without saying so.
**Propagation:** opportunistic
**Status:** active
**From:** observations #5, #9, #13

### 3. Before building on an asset or a flow, confirm its role, its right to move, and that it works
**Added:** 2026-10-13
**Applies to:** all skills that take in material from a person or an existing system
**Requirement:** For anything handed over or inherited (a photo, a clip, a model, a booking flow), settle three things first: what it is for (a reference for taste, or material to use), whether it may be used where it's going (licence, platform terms, the owner's permission), and whether it does what it claims (run flows end to end). When the brief names a specific real thing, compare the asset with the reference before the expensive step.
**Propagation:** opportunistic
**Status:** active
**From:** observations #2, #4, #14
