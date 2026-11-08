# Instructions for Codex

These instructions apply throughout this repository.

## Branches and pull requests

- Start each new task on a separate branch based on the latest `main`. Use a descriptive name such as `fix/login-error` or `feature/player-search`.
- If the current session already has a branch dedicated to this task, continue on it. Do not discard uncommitted work or overwrite another person's changes.
- Never commit or push directly to `main`. Do not force-push.
- Keep each branch and pull request focused on one task.
- Run relevant checks, review the diff, then open a pull request targeting `main` when the changes are ready.
- Do not merge pull requests unless the repository owner explicitly asks.
- If repository access or permissions prevent this workflow, explain the blocker instead of changing `main`.

## Making and checking changes

- Read the README and any applicable directory instructions before editing.
- Follow the existing project structure and coding conventions. Keep changes limited to the requested task.
- Use the project's documented checks when available. For behavior changes, verify the affected functionality; for visual changes, check the page in a browser when possible.
- Do not invent test commands or claim checks passed when they were not run. Explain any checks that could not be completed.
- For documentation-only changes, review the text and diff; application tests are not required.
- Never commit passwords, API keys, tokens, or private user data.

## Explaining the work

- Use beginner-friendly language and explain unfamiliar Git or coding terms when needed.
- In the pull request, describe what changed, why it changed, and how it was checked. Mention any remaining limitations.
- Share the pull request link and explain the next step for the owner.

# Design System: Stat Console, Graphite + Electric Cyan

Use Stat Console as the product name and SC as its monogram. Keep repository
names and hosting paths unless the owner explicitly requests a move.

## Visual direction
Use a clean analytics command center with a restrained gaming influence.
Use graphite surfaces and cyan interface accents for the shell. Chart colors
are independently customizable.

- Page background: graphite `#11151B`.
- Panels: slate `#1A2029`; inputs and chart canvases: deep slate `#151A22`.
- Borders: steel `#323D4B`, stronger control borders `#465365`.
- Primary text: soft white `#F2F5F9`; secondary text: cool gray `#A3AFBF`.
- Buttons, active tabs, and focus: electric cyan `#36D6ED`; hover `#74E7F6`.
- Define interface colors in :root; components use these tokens.
- Use Inter for body text and chart labels, Outfit for the wordmark, with
  system-font fallbacks. Use tabular numbers and compact, legible labels.
- Use crisp borders, moderate 8px corners, and subtle hover movement. Respect
  prefers-reduced-motion. Do not add page glow or repeating background texture.
- Keep desktop workspaces wide and fluid up to 1,680px. Contain mobile table/chart
  scrolling and keep keyboard focus visible.
- Keep the version in the footer, not beneath the wordmark.

## Chart colors
Interface accent and data colors are independent. colors.js owns Signal, Arcade,
and Spectrum palette presets and reusable color-wheel/HEX controls.

- Allow per-series colors for all chart families, per-category slice colors for
  pie/doughnut charts, and independent Control A/Variant B colors for A/B charts.
- Support validated 3/6-digit HEX entry and wheel selection. Include keyboard
  hue, saturation, and brightness sliders, a labeled modal, and cancel/apply.
- Invalid HEX values retain the last valid chart color; never interpolate
  unvalidated input into styles. Colors remain local to the current page session.
- Keep selected colors stable across tab switches and chart-style changes.
  Presets deliberately reset custom overrides.
- Match preview, legend, SVG/PNG, and native PowerPoint colors. Serialize resolved
  colors and styles into image exports; do not leave unresolved CSS variables.
- Preserve centered names-only legends, title-free axes, and independent dual
  scales for combination charts. Choose readable foregrounds for slice labels.

## Functional safeguards
Keep A/B statistical formulas, validation, hypothesis behavior, and random valid
startup samples intact. Changing colors must not change input data or results.

Keep Chart Studio and A/B Test Analyzer in separate accessible tabs. Preserve
both workspaces while switching. The default chart data input is an editable
table; retain bulk paste, CSV/Excel import, worksheet selection, and stale-export
protection. Do not persist or transmit input data.

Support the 21-style chart picker and native editable PowerPoint exports with
embedded data. Chart-family validation and stacking/export specifications belong
in chart-modes.js and must remain testable without the DOM. Preserve numeric X
values for scatter/bubble charts. Validate incompatible data explicitly. Do not
replace user data on style changes; examples require an explicit action.

Keep chart-data.js independent of the DOM. Test parsing, scaling, color
normalization/conversion, and chart families using Node's built-in tests.
Load pinned Excel/PowerPoint libraries only when needed and keep integrity hashes
in sync with intentional upgrades. Retain the native export fixes for percent
area grouping and bubble workbook values/headers/ranges.
