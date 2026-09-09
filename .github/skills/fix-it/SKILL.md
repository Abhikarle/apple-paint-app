---
name: fix-it
description: "Use when you need to debug, diagnose, and fix a bug or regression in the codebase. Covers root-cause investigation, minimal edits, verification, and safe progress checks."
---

# Fix It

## Purpose

Use this skill when the app is broken, a test fails, a user flow is incorrect, or a regression needs a targeted fix. The goal is to identify the real root cause, make the smallest safe change, and verify the outcome with evidence.

## Workflow

### 1. Reproduce and scope
- Confirm the bug or failure and capture the exact symptom.
- Identify where it happens: UI, state, API, rendering, or build/test step.
- Note the input, trigger, and expected behavior.

### 2. Localize the failing path
- Trace the code path from the trigger to the actual failure.
- Check the most likely suspects first: recent edits, event handlers, state updates, conditions, and API calls.
- Prefer the narrowest read/search needed to isolate the cause.

### 3. Form a single working hypothesis
- State the likely root cause in one sentence before changing code.
- If there are multiple suspects, test the most probable one first.
- Avoid broad refactors while investigating.

### 4. Add or use a failing check when helpful
- Prefer a minimal repro, assertion, or user flow that proves the issue.
- If the bug is hard to verify manually, add a focused regression check.
- Do not add test-only code to production logic.

### 5. Apply the smallest fix
- Change only the logic needed to address the root cause.
- Keep the edit narrow and easy to review.
- Avoid unrelated cleanup in the same patch.

### 6. Verify with the smallest relevant command
- Run the most direct validation: app, test, lint, or build command for the affected behavior.
- Confirm the result with fresh output and exit status.
- If verification fails, return to the root cause and adjust the hypothesis.

### 7. Review and summarize
- Check that the fix aligns with expected behavior and does not introduce regressions.
- Summarize:
  - root cause
  - what changed
  - how it was verified
  - any follow-up risk or note

## Decision points

- If the bug cannot be reproduced, reduce scope and isolate the exact preconditions.
- If the symptom is unclear, inspect logs, state, or console output before patching.
- If a fix is uncertain, validate one hypothesis at a time rather than stacking guesses.
- If the problem spans multiple layers, fix the source of truth first, not just the symptom.

## Completion checks

A fix is complete only when all of the following are true:
- The root cause has been identified, not just masked.
- The change is minimal and matches the actual cause.
- Verification has been run and evidence is recorded.
- No unrelated files or intentional cleanup were introduced.

## Example prompts

- "Fix the button click handler so it updates the correct state."
- "The canvas draw tool is misbehaving; diagnose and patch it."
- "Find the regression causing the modal to stay open after submit."
- "Trace why the project fails to build and fix the root cause."

## Related customizations to create next

- A debug-and-diagnose skill for investigating runtime issues and logs
- A review-and-refactor skill for code quality checks before merge
- A test-first skill for adding targeted regression tests before fixing bugs
- A project-specific skill for this painting app, covering drawing, layer, and canvas workflows
