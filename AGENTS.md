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

# Design System: Queue Works, Ambient Electric Violet

Use Queue Works as the product name and QW as its monogram. Do not add a tagline.
Keep repository names and hosting paths unless the owner explicitly requests a move.

## Visual direction
Use a soft, modern SaaS toolkit with a restrained gaming influence. Apply the
user's Ambient Electric Violet palette: midnight slate #0f172a, primary violet
#8b5cf6, secondary teal #2dd4bf. Use subtle violet/teal radial glows behind the
workspace; no repeating grid texture. Keep the six authorized tools and their behavior.

- Define interface colors in :root. Components use tokens from styles.css.
- Surfaces: #172238; inset fields/chart canvases: #101b30.
- Borders: #2b3954; stronger control borders: #596f95.
- Text: #f4f6fc; muted text: #b0bdd2; accent text: #c4b5fd.
- Violet primary buttons use near-black #080611 labels for sufficient contrast;
  use #a78bfa on hover. Teal is a secondary highlight, independent of chart colors.
- Use Inter for body text and chart labels; Outfit for wordmark and display text.
- Use rounded 12px panels, clear input boundaries, quiet depth, and restrained
  hover movement. Respect reduced motion and forced colors; keep focus visible.
- queue-works.css owns the branded shell refinements; styles.css owns tokens
  and shared components, tools.css owns tool-specific layout.
- Preserve wide/fluid workspaces up to 1,920px and contained mobile scrolling.
- Keep top tool tabs sticky and the version in the footer. The page scrollbar
  remains visually hidden while wheel, touch, and keyboard scrolling work.
- Use the branded QW favicon. The W in both monograms uses the wordmark’s
  violet-to-teal gradient; keep the Q white and the dot teal. Leave padding for
  gradient text glyphs so the final letter is not clipped.

## Chart colors
Interface accent and data colors are independent. colors.js owns Signal, Arcade,
and Spectrum palette presets and reusable color-wheel/HEX controls.
Do not couple A/B data-color defaults to the interface accent token.

- Allow per-series colors for all chart families, per-category slice colors for
  pie/doughnut charts, and independent Control A/Variant B colors for A/B charts.
- Support validated 3/6-digit HEX entry and wheel selection. Include keyboard
  hue, saturation, and brightness sliders, a labeled modal, and cancel/apply.
- Invalid HEX values retain the last valid chart color; never interpolate
  unvalidated input into styles. Colors remain in the current page session.
- Keep selected colors stable across tab switches and chart-style changes.
  Presets deliberately reset custom overrides.
- Match preview, legend, SVG/PNG, and native PowerPoint colors. Serialize resolved
  colors and styles into image exports; do not leave unresolved CSS variables.
- Preserve centered names-only legends, title-free axes, and independent dual
  scales for combination charts. Choose readable foregrounds for slice labels.

## Functional safeguards
Keep A/B statistical formulas, validation, hypothesis behavior, and random valid
startup samples intact. Changing colors must not change input data or results.

Keep Chart Creator and A/B Test Analyzer in separate accessible tabs. Preserve
both workspaces while switching. The default chart data input is an editable
table; retain bulk paste, CSV/Excel import, worksheet selection, and stale-export
protection. Never transmit or automatically persist input data. Utilities are
session-only. Do not erase existing local workspace storage.

Support the 21-style chart picker and native editable PowerPoint exports with
embedded data. Chart-family validation and stacking/export specifications belong
in chart-modes.js and must remain testable without the DOM. Preserve numeric X
values for scatter/bubble charts. Validate incompatible data explicitly. Do not
replace user data on style changes; examples require an explicit action.
On each fresh page load, choose a random chart style and generate valid matching
sample data. Do not rerandomize when users edit, switch tabs, or change styles.

Keep chart-data.js independent of the DOM. Test parsing, scaling, color
normalization/conversion, and chart families using Node's built-in tests.
Load pinned Excel/PowerPoint libraries only when needed and keep integrity hashes
in sync with intentional upgrades. Retain the native export fixes for percent
area grouping and bubble workbook values/headers/ranges.

## Focused tool architecture
Keep exactly the authorized tools: Chart Creator, A/B Test Analyzer, Excel
De-duper, Meeting Recap Builder, Slide Format Advisor, and Percentage Calculator. Do not restore dashboards,
project management, utility categories, other calculators, visual tools, or deck building.
Each tool stays mounted while switching accessible tabs. tools.css styles new
tools; the existing styles.css owns chart/A/B/shared design tokens.
Dedupe matching belongs in DOM-free dedupe-core.js, with workbook/UI logic in
deduper.js. Preserve first-match rows and source order, expose case/space/blank
matching clearly, and invalidate stale previews/downloads after changes.
Exclusion mode compares the entire exclusion column against the main-list column,
not row pairs. Skip blank main-list entries and export only the kept main column.
Keep this separate from ordinary within-column de-duping.
Export only cleaned-sheet values and number formats; explain formula flattening
and excluded sheets/styles in UI. Do not overwrite source files.
Keep the meeting-notes input empty on load, with no sample-note placeholder.
Show usage instructions outside the text box.
notes-core.js owns local recap drafting and section serialization. notes.js owns
item editing/moving/adding/removing, copy controls, and clipboard fallback. Use the
three authorized headings: Meeting notes/topics, What's Needed from Me | Tasks to
Create, and Action Items. Draft placements are suggestions from labels/headings
and conservative wording rules, never AI or inferred owners/dates. Keep user review
and reassignment available. Per-section copies omit headings; full copies include
nonempty section headings, with plain unbulleted lines and no meeting title.
Source changes disable stale copies while retaining reviewed edits until an explicit
rebuild. Preserve names, amounts, dates, negations, and checkbox status. Keep all
processing session-only; no model downloads or backend. slide-formats.js ranks
layout suggestions from brief themes and shows wireframes; describe its limits.
Use textContent for user content, never HTML interpolation or eval. Do not send
notes to Wrike; only copy the user's reviewed recap for manual pasting.

## File uploads
Use shared file-uploads.js drop areas for every file upload: visible drag/drop
copy, browse access for keyboard/touch, formats/limits, selected filenames, and
drag-over feedback. Feed dropped and browsed files through the same importer.
Keep file processing local, single-file validation, stale-request protection,
and source filenames for exports. Prevent accidental file navigation on drops.

Percentage Calculator uses percentages.js for DOM-free math plus its own UI. Keep
percentage-of, proportion, and increase/decrease calculations separate. Display
and copy round to one decimal (36.25% → 36.3%). Clear stale outputs on edits,
handle zero bases explicitly, and preserve inputs while switching tools.

Keep recap reset scoped to notes and draft only. Preserve other tool state.
Expose source-label toolbar controls and Alt/Option+Shift+M (For me),
Alt/Option+Shift+A (Action item), scoped to editable note fields. In reviewed
items, shortcuts move sections without rewriting text. Clear undo is session-only
and expires when new source work begins.

The current repository is thesolelab/queue-works and Pages path is /queue-works/.
Keep local asset URLs relative so deployments work under a repository subpath.
libraries.js owns shared lazy Excel/PowerPoint loading and integrity hashes;
reuse it rather than adding per-tool script loaders.
