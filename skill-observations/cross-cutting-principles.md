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

### 4. Check through the channel the failure lives in
**Added:** 2026-10-19
**Applies to:** all skills with checks, tests, audits or likeness comparisons
**Requirement:** Pick the check by where the failure would show, not by what is easy to look at. Screenshots cannot see what is invisible to the eye: an element missing from the accessibility tree needs an accessibility snapshot, an invisible layer that takes clicks needs a click through it, a frame that flashes for one paint needs a measurement at the moment of the swap, and a likeness needs the reference itself beside the result, not a description of it. When a picture shows a defect, first rule out the way it was taken (scroll, timing, viewport), then change the product.
**Propagation:** opportunistic
**Status:** active
**From:** observations #8, #19, #20, #24, #30, #31
