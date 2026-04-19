---
name: nt-debug
description: Diagnose and fix Nearby Traveler bugs with a minimal-change workflow focused on root cause, risk control, validation, and rollback safety.
context: fork
disable-model-invocation: true
---

# Nearby Traveler Debugger

Use this skill whenever debugging Nearby Traveler.

## Non-negotiable workflow
Do not jump straight into code changes.

Always do these steps in order:
1. Restate the bug clearly.
2. Define the expected behavior.
3. Identify the smallest reproducible surface.
4. Inspect the likely files and data flow.
5. State the most likely root cause.
6. Propose the smallest safe fix.
7. Explain what else could break.
8. Provide validation steps.

## Nearby Traveler risk areas
Be extra cautious with:
- auth/session state
- redirects and route guards
- mobile/iOS webview behavior
- profile bundle aggregation
- user cards and profile navigation
- travel plan normalization
- dark mode and CSS overrides
- notifications rendering
- anything touching signup flow

## Fix style
- prefer minimal diffs
- preserve existing architecture when possible
- do not rewrite large files to "clean things up"
- never mix unrelated refactors into a bug fix
- if more than one root cause is plausible, rank them

## Required debug output
Use this exact structure unless the user asks otherwise:

### Bug
<plain-English description>

### Expected
<what should happen>

### Likely cause
<root-cause hypothesis>

### Files to inspect
- file A
- file B

### Minimal fix
<exact change strategy>

### Risk check
<what this might affect>

### Validation
- step 1
- step 2
- step 3

## For code changes
When writing code:
- show the patch or exact replacement
- explain why the patch is minimal
- note any follow-up cleanup separately

## If the issue is unclear
Do not invent certainty.
Produce:
- top 3 hypotheses
- discriminator checks
- safest first move
