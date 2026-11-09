# Changelog

## Unreleased — Plain-text meeting recaps
- Remove meeting title/group controls and output headings/list markers.
- Clean spacing, empty lines, explicit headings, and repeated notes while
  preserving source order, wording, names, dates, numbers, and action labels.
- Keep recap editing and copying local; no AI or backend integration.

## Unreleased — Main-list exclusions
- Add an Excel mode to remove main-list entries found anywhere in an exclusion
  column, with case/space options, preview counts, and matching row references.
- Export only the remaining main-list column; preserve order, values, and formats.
- Retain ordinary within-column de-duping and invalidate results after mode/column edits.

## Unreleased — Cleaner page navigation
- Hide the page scrollbar while retaining wheel, touch, and keyboard scrolling.
- Keep tool tabs visible while scrolling and remove the tab underline overflow
  that created an unnecessary vertical scrollbar in the navigation strip.

## 0.4.0 — Focused work tools
- Replace broad utility navigation with Chart Creator, A/B Test Analyzer, Excel
  De-duper, Note Organizer, and Slide Format Advisor tabs.
- De-dupe Excel/CSV by a selected worksheet column, preview removed rows, and
  download kept values/number formats with explicit case/space/blank options.
- Organize meeting notes into editable recap bullets for manual Wrike pasting.
- Recommend five slide layouts with wireframes and copyable outlines from a brief.
- Remove obsolete dashboards, calculators, visual/text workbenches, and deck building.
- Preserve chart styles, A/B statistics, and native single-slide export repairs.

## 0.3.0 — Everyday utility console
- Replace project management with Data, Presentations, Calculators, Text, and Visuals.
- Add file combination, duplicate finding, pivots, format conversion, and recipes.
- Assemble editable charts/tables and images into a mixed PowerPoint deck.
- Add budget, ROI, pricing, break-even, forecast, sensitivity, and weighted calculators.
- Add text cleanup/comparison/conversion, image resize/compression/background-color
  removal, batch ZIP exports, and color contrast tools.
- Round percentage displays and copied results to one decimal place.
- Preserve old local workspace backups and recover tables/charts without project UI.
- No document or PDF tools. New inputs remain session-only.

## Unreleased — Percentage calculator
- Add standalone percentage-of, proportion, and increase/decrease calculators
  with copyable results, keyboard submission, and explicit zero-base validation.
- Retain calculator inputs across tool/project navigation without saving them.

## 0.2.0 — Project command center
- Add project spaces, overview actions/notes, command search, and explicit local
  saving with portable JSON backups and validated imports.
- Add CSV/TSV workbench cleanup, calculated columns, keyed version comparisons,
  left joins, safe CSV downloads, and replayable cleanup/calculation workflows.
- Add scenario economics, decision tracking, note-to-action extraction, and
  editable Markdown document templates.
- Save and restore chart data, styles, axes, and colors within projects. Retain
  native editable PowerPoint exports and separate Chart Studio/A/B tabs.
- Add a responsive sidebar and wider command-center shell.

## Unreleased — Electric Mint accent
- Use #04E2B7 for interface accents and #0EF3C5 for hover highlights, with subtle
  mint selection tints against the existing graphite/slate surfaces.
- Keep chart palettes and A/B default curve colors independent of the interface.

## Unreleased — Random Chart Studio startup
- Randomly select from all 21 chart styles and generate compatible sample data
  on every page load, with a matching sample chart title.
- Preserve user data when editing or switching tabs/styles; retain the explicit
  example loader and existing A/B startup behavior.

## Unreleased — Graphite + Electric Cyan
- Refresh the interface with graphite/slate surfaces, cyan accents, Inter body
  typography, Outfit branding, softer corners, and a clean background.
- Add reusable color-wheel/HEX controls, keyboard HSV sliders, and cancel/apply
  behavior; provide Signal, Arcade, and Spectrum chart palettes.
- Customize all chart-series colors, pie/doughnut slices, and A/B curves while
  retaining selections across tabs/styles and matching preview/export colors.
- Keep A/B calculations and chart data unchanged; replace the earlier yellow-only
  design guidelines with the new Stat Console visual system.

## Unreleased — Stat Console rebrand
- Rename the product to Stat Console in the header, browser title, footer,
  documentation, export fallback names, and PowerPoint author metadata.
- Update the header monogram to SC and A/B image export filenames to the new name.

## Unreleased — Expanded chart styles and wider desktop workspace
- Add 21 chart styles across combination, grouped/stacked/100% column and bar,
  line and area variants, scatter, bubble, pie/doughnut, and radar families.
- Provide style-specific examples, data guidance, shared-scale validation, and
  preserved dual axes for combination charts.
- Render all styles in SVG/PNG and export native editable PowerPoint charts
  with embedded data, including a fix for zero-valued bubble workbook cells.
- Preserve centered, names-only legends and title-free axes; grow image height
  when longer legends need extra rows.
- Widen the desktop layout to 1,680px with fluid gutters, using BuilderLab's
  broader desktop spacing as a reference while retaining mobile layouts.

## Unreleased — Chart presentation cleanup
- Remove axis titles from Chart Studio previews and exports while keeping tick
  labels and independent left/right scales.
- Center the bottom legend, wrapping longer legends into centered rows, and
  display series names without left/right suffixes.
- Remove unused axis-title inputs from chart settings.

## Unreleased — Workspace tabs and table editor
- Separate Chart Studio and A/B Test Analyzer into keyboard-accessible tabs,
  preserving each workspace's inputs and results when switching.
- Replace the default CSV block with editable table cells, readable aligned
  numbers, and controls to add/remove rows and series.
- Keep bulk paste under a disclosure and retain CSV/Excel uploads, dual axes,
  and editable PowerPoint/image exports.
- Preserve chart settings after value-only edits and disable stale exports until
  Update chart is selected.

## Unreleased — Chart studio
- Paste tables or import CSV, TSV, XLSX, and XLS files, with Excel worksheet selection.
- Configure column, line, and combination charts with independent left/right axes,
  axis titles, and number or percentage formatting.
- Export self-contained SVG/PNG images or a PowerPoint slide containing a native
  editable chart and its embedded source-data worksheet.
- Add validation for blank values, malformed tables, file size, row count, and
  series count; keep imported data in the browser.
- Load integrity-checked Excel/PowerPoint libraries only on demand.
- Preserve the existing A/B analyzer.

## Unreleased — Minimal Gaming HUD
- Remove the analyzer/version subtitle from the header and show the version
  number in the footer.
- Remove the Marketing Analytics header label and generate valid random sample
  counts on each page load before calculating initial results.
- Add more noticeable button hover lift, highlight, and glow, with reduced-motion
  support.
- Brighten the page background with broader, soft yellow glows while keeping
  inset fields and the chart black.
- Apply the monochrome and yellow design system, Outfit typography, square panels,
  HUD stat tiles, accessible focus styles, and responsive layouts.
- Centralize chart colors in CSS tokens and resolve them into SVG attributes so
  SVG and PNG exports remain self-contained.
- Preserve statistical calculations, chart coordinates, validation, and exports.
- Document the visual design system in AGENTS.md and the Google Fonts dependency
  in README.md.

## v0.1.1 — Distribution marker correction
- Position both 95% markers on the lower side of their respective sampling distributions.
- Use the 5th percentile for one-sided mode and the 2.5th percentile for two-sided mode.
- Clarify that these are individual distribution boundaries, not the significance test itself.
- Preserve existing calculations, branding, and exports.

## v0.1.0 — Initial prototype
- Four-field A/B test quick entry and one-sided/two-sided hypothesis selector.
- Fixed 95% significance threshold and two-proportion Z-test calculations.
- Conversion rate, relative lift, p-value, and significance summary.
- Black-background sampling distribution chart with white labels, gray Control A, yellow Variant B, and 95% markers.
- Expandable calculation details.
- Presentation-ready SVG and high-resolution PNG chart export.
