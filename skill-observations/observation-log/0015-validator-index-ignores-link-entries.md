---
id: 15
title: "The bundle validator's Contents-index check fails a reference file whose index entries are Markdown links ([Name](#anchor)): it compares entries to headings as plain text"
status: open
type: open-source
skill: [task-observer]
proposes_skill: []
target_file: [".claude/skills/task-observer/scripts/validate-skill-bundle.py"]
siblings_checked: "no family registry entry for task-observer; the check lives only in scripts/validate-skill-bundle.py (check_reference_indexes, read); no other installed skill packs bundles; checked, instance-specific to the validator, no propagation"
area: "scripts/validate-skill-bundle.py, check_reference_indexes"
date: 2026-10-13
session_context: "First skill review: packing the staged animation-styles skill, whose references/styles.md is generated with a linked Contents index"
parked_until:
resolved:
resolution:
reference:
commands_verified: "run: validate-skill-bundle.py on the staged animation-styles with index entries '- [01 Particles](#01-particles)': FAIL, 20 x 'heading not in its own Contents index'; after changing the generator to plain entries '- 01 Particles': 'OK: all gate checks passed', 46 members round-tripped"
---

**Issue:** The validator's index check strips the leading `- ` from each
Contents entry and then matches each heading as a prefix of an entry. A
standard Markdown index writes entries as links, `- [01 Particles](#01-particles)`.
After stripping, that entry starts with `[`, so no heading matches, and
every section in the file is reported missing. The index was complete and
correct. The pack step refused the bundle until the generator was changed
to write plain entries, losing the in-page links that make the file easy to
navigate on GitHub.

**Suggested improvement:** In `check_reference_indexes`, normalise link
entries before matching: replace `[text](#anchor)` with `text` (for
example `re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", entry)`). Add the linked
form to the check's tests as a passing case.

**Principle:** A format check must accept every standard spelling of the
thing it checks. A checker that knows one spelling rejects a correct file
and pushes the author to rewrite good content to satisfy the tool.
