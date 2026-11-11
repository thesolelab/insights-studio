# Simple Worx

A browser-based toolkit for everyday work. The product is Simple Worx; the
repository and hosting path are `simple-worx`.

Repository: https://github.com/thesolelab/simple-worx

Live site: https://thesolelab.github.io/simple-worx/

Seven focused tools in one tabbed interface:

- **Chart Creator** — turn Excel/CSV or pasted data into customizable charts and
  export SVG, PNG, or a native editable PowerPoint slide.
- **A/B Test Analyzer** — compare experiment conversion rates with the existing
  two-proportion test and export the distribution chart.
- **Excel De-duper** — remove duplicates, exclude a second list, or compare lists.
- **Meeting Recap Builder** — review notes, personal tasks, and action items for Wrike.
- **Slide Table Builder** — paste spreadsheet data, format it, and copy/export a
  slide-ready visual or editable PowerPoint text boxes and shapes.
- **UTM Builder** — generate, copy, and clear campaign tracking links.
- **Percentage Calculator** — percentage-of, proportions, and increase/decrease.

The Ambient Electric Violet design uses midnight slate (`#0f172a`), violet
(`#8b5cf6`), and secondary teal (`#2dd4bf`) with soft ambient glows, rounded panels,
and a wide responsive layout. Chart-series colors remain independently customizable.
The previous dashboards, project management, broad utility categories, other calculators,
visual tools, and multi-slide deck builder are removed. Inputs remain mounted
while switching tabs; Arrow keys, Home, and End navigate the tabs.

## Home and your daily spark
The site opens on Home with a motivational message, the local date, and seven tool
cards. Select a card to open its workspace, or use the top tabs. Home is a launchpad;
all tools remain mounted, so going Home and back retains current inputs and drafts.
Home and every tool share the same page width/gutters, header/logo, and navigation
geometry. Switching tabs starts at the top without changing those dimensions.
Short pages fill the viewport; longer tools grow and scroll naturally.

A curated collection of 31 original messages rotates by the device's local calendar
date. The message stays the same throughout that day and across reloads, updates
at local midnight, and refreshes when returning to the page after sleep or a time
zone change. It does not need AI, an account, cookies, or a quote service. The device
clock determines the date. Cards, tabs, and focus states support keyboard access;
reduced-motion and forced-colors preferences are respected. The hero uses a single
local, losslessly compressed scene in
`assets/home-atmosphere.webp`: broad ribbons flow into its top-right teal glow,
behind live text and controls rather than inside a standalone illustration box.
The artwork is decorative and visible only on Home. Navigation wraps on smaller
screens rather than
hiding labels beyond a horizontal scroll area.

## Excel de-duper
1. Drag and drop XLSX, XLS, or CSV into the upload area, or choose **browse files**
   (up to 10 MB).
2. Choose the worksheet and the column to check. The first used row is the header.
   Columns are identified by letter and header, so repeated/blank headers work.
3. Select **Preview de-dupe**. The first row for each matching column value is
   retained, including all its original columns. Review counts, cleaned rows, and
   rows being removed with their original Excel row numbers.
4. Download a new `-deduped.xlsx` workbook. Your original file is unchanged.

Default matching ignores case and surrounding spaces, while keeping all rows
with blank key values. **Matching options** lets you change these choices. Key
matching uses the cells' displayed values, so `001` and `1` remain distinct when
formatted differently. Limits: 50,000 data rows, 200 columns, 1 million cells.
Changing the worksheet or settings invalidates the preview and download.

The download contains only the selected cleaned worksheet. Cell values and number
formats (including dates, currencies, and leading-zero formats) are retained.
Formulas become their cached values; save/recalculate in Excel first. Formulas
without saved values receive an error. Other sheets, macros, and layout styling
are not copied. This prevents row deletion from leaving broken formula references.

### Exclude companies already on another list
Choose **Exclude matches from another column**, set the **Main list column**
(e.g. A = target accounts), and set the **Exclusion list column** (e.g. B = existing
accounts). Preview the exclusions, then download the cleaned list.

Each nonblank main-list value is compared against **every** nonblank value in the
exclusion column, regardless of row position. Matching uses the same case/space
options as de-duping. This is exact text matching, not fuzzy company-name matching.
Blank main-list entries are skipped. Repeated unmatched main-list values remain;
this mode performs exclusion, not additional within-list de-duplication.

The `-excluded.xlsx` export contains only the kept main-list column and its header,
with original spelling, order, values, and number formats. It never includes the
exclusion column. Preview counts refer to nonblank main-list entries, and removed
entries identify the matching exclusion row. Changing either column, the mode,
or matching settings requires a new preview. If all entries are excluded, the
export contains the header only.

## List comparison
Find **List comparison** below the existing Excel De-duper. Paste one entry per
line into A and B, or upload a spreadsheet using the existing drop area, select a
worksheet and two columns above, and choose **Use selected worksheet columns as
A / B**. This copies a snapshot without the headers; later worksheet changes do
not change the pasted lists until you bring them in again.

Compare lists to see shared values, A-only, B-only, and a combined unique list.
Blank lines and repeated matches are consolidated. Case/space options affect
matching only; first spellings are preserved, shared values use A, and the combined
list follows A then unmatched B. Results contain values only, not full source rows.
Copy the selected result or download all four result sets as separate Excel sheets.
Edits invalidate results. Clear lists leaves the uploaded workbook untouched.
Limits: 50,000 lines and 1 million characters per list.

## Slide-ready table builder
Paste a full Excel/Sheets range (tabs) or CSV including headers, then **Build table**.
Edit the resulting cells or paste a tab-separated range into any cell. Ranges
start at the selected cell and can expand the table within the row/column limits.
Format font size, padding, alignment, relative column
widths, alternate row shading, borders, and six independently customizable colors.
The first row is always the header. Values remain text, including leading zeros,
percentages, currency, and literal HTML. Rebuilding from the source replaces cell
edits. Clear table retains formatting choices, while clearing the source and outputs.

**Copy table image** copies a PNG for pasting into PowerPoint. Download PNG/SVG
if the clipboard is unavailable. **Export editable PowerPoint** creates one 16:9
slide made from editable rectangles and text boxes, rather than a native PowerPoint
table. It is a formatted visual, without spreadsheet formulas or table-specific
editing commands. Arial is used for portable preview/export typography.

Limits: headers + 1–30 data rows, 1–10 columns, 500 characters per cell, and 100,000
pasted characters. A table must fit one slide; oversized tables remain visible
in the preview, with exports disabled and an explanation beside it.
**Fit to slide** tries smaller fonts/padding (down to 10 pt / 4 pt) without changing
cell data. If it cannot fit, split the table, shorten text, or adjust column widths.
Invalid or overly narrow settings show a message in the preview rather than an empty box. Image preview and PowerPoint
share wrapping, geometry, colors, and explicit text. Actual font rendering can vary
between browsers and desktop PowerPoint.

## UTM link builder
Enter an HTTP/HTTPS destination URL and required source, medium, and campaign.
Term and content are optional. Select **Generate link**, **Copy link**, or
**Clear / reset**. Clear resets all fields and the generated link. Editing an input
invalidates the old link. Clipboard failure selects the link for manual copying.

Values are trimmed, lowercased, and URL-encoded. The entire generated/copied link
is lowercase, including destination paths, query parameters, and anchors. Existing managed
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content` parameters
are replaced (blank optional values remove old tags). Other query parameters and
anchors are preserved. URLs with embedded credentials or non-HTTP protocols are
rejected. Limits: 8,192 URL characters and 1,000 per UTM field. Links are created
locally, never visited, shortened, saved, or sent to an analytics service.

## Meeting recap builder
The input starts empty, with step-by-step instructions above it rather than sample
notes or placeholder text inside. Paste one point per line and select **Build recap**.
Review the draft in the three
sections matching your meeting template:
- Meeting notes/topics
- What's Needed from Me | Tasks to Create
- Action Items

Explicit `For me:`, `My task:`, `Task:`, and `TODO:` labels place a point under your
tasks; `Action:`/`Follow-up:` place it under action items. Existing section headings
are respected rather than overridden by wording suggestions. Simple clear wording such as “I will send…” or “Matt will find…”
may suggest a follow-up section, with a visible review note. Questions, uncertain
wording, and unassigned context normally stay in meeting topics. Placements use
local rules, not AI, and can be wrong; review them. Owners, commitments, dates,
amounts, and wording are never invented or extracted into new tasks.

Edit each item, change its section, remove it, or add a new one. Moving items keeps
source order within sections. Repeated notes are optionally consolidated within
the same section, so separate personal tasks and others' actions are not merged.
Checkbox status is preserved as `Completed:` or `To do:` text.

**Copy section** copies only that section's item lines for pasting into your
existing Wrike section. **Copy full recap for Wrike** includes the nonempty section
headings. Both use plain lines without bullets and no meeting title. Empty sections
are not copied. A collapsible combined preview reflects your reviewed item edits.
Clipboard failure selects the requested text for manual copying. No Wrike posting
or task creation happens automatically.

Changing the source or repeat option disables copying but retains the current draft
for reference. **Rebuild recap** replaces that draft, including manual edits; the UI
explains this. Reverting the source restores copy access to the existing draft.
Notes and draft edits stay in the current browser tab only. Copy before closing or
reloading. Limits: 100,000 source characters, 5,000 source lines, 500 review items.
There is no AI service, model download, backend, account, or external note processing.

## Percentage calculator
Use the Percentage Calculator tab for X% of Y, X as a percentage of Y, or
percentage increase/decrease from X to Y. Each card has a Calculate button,
keyboard submission, and a Copy button. Output and copied values round to one
decimal place (`36.25%` → `36.3%`); percentage results include `%` when copied.
Changing either input clears its stale result. Inputs remain across tab switches.
**Clear / reset** clears all three calculators, including results, validation
messages, and copy state, without reloading other tools. Decimals and negative
values are accepted, except that
percentage-change starting values must be positive; zero denominators receive an
explanation. Clipboard failures select the result for manual copying. All math
runs locally without an account, model download, or AI service.

## Customize chart colors
- Choose Signal, Arcade, or Spectrum in **Chart palette**, then customize each
  series using its swatch and HEX field. Pie and doughnut charts have a color
  control for each category instead.
- A swatch opens the color wheel. Hue, saturation, and brightness sliders provide
  keyboard access; HEX input accepts 3 or 6 digits. Select **Apply color** to
  commit a wheel selection, or Cancel/Escape to keep the previous color.
- In **A/B Test Analyzer**, expand **Chart colors & export appearance** to set Control A and Variant B
  independently, plus the background, axis labels/title, and chart annotation text.
  These chart-only colors apply to the preview and SVG/PNG exports without changing
  the interface or test values. Select **PNG background**: Solid uses your chosen
  chart background; Transparent lets the slide show through. SVG retains the solid
  background. Choose text colors that contrast with the target slide.
- Selected colors appear in the preview and SVG/PNG/PowerPoint exports. Invalid
  HEX input leaves the last valid color applied. Presets reset custom overrides.
  Color settings are retained while switching tabs and styles, but reset on reload.

## Create a chart for PowerPoint
1. Open the **Chart Creator** tab and edit the spreadsheet-style table directly.
   Add or remove rows and series as needed. Paste a full table with headers into
   any cell, expand **Paste a table or CSV**, or drag and drop / browse for CSV, TSV,
   XLSX, or XLS data. Include column headers in the first row. For Excel files,
   select the worksheet to use. Save workbooks with formulas in Excel first so
   their calculated values are available.
2. Select **Update chart** after editing data. Choose the category column
   and the numeric series to include, then choose a **Chart style**. The picker
   includes 21 styles: combination; grouped, stacked, and 100% stacked columns
   and horizontal bars; line, marked line, smooth line; area, stacked area,
   100% stacked area; scatter points, scatter lines, bubble; pie, doughnut;
   radar, marked radar, and filled radar.
3. In **Combination** mode, choose Column or Line per series. For different units
   or scales, enable the second axis and assign the desired
   series to **Right**. Set number/percentage formats for each axis. Chart axes
   show tick labels without titles; the centered legend shows series names only.
4. Select **Export PowerPoint** to download a 16:9 slide with a native, editable
   chart and embedded data worksheet. In PowerPoint, select the chart and choose
   **Edit Data**. You can also copy the chart into an existing presentation.
   SVG and PNG exports are available when you prefer an image.

Every page load selects a random chart style and generates fresh, compatible
sample data. Editing data or switching tabs/styles never rerandomizes it.
Charts support up to 200 categories, 6 numeric
series, and 5 MB uploads. Use decimal points for numbers. Percentages such as
`3.8%` are stored as `0.038`; choose Percentage format for fractional values.
Blank numeric cells are flagged rather than silently treated as zero.

Use **Load example for this style** to try a suitable dataset; changing styles
alone never replaces your data. Scatter charts require a numeric X column and
one or more Y series. Bubble charts also require a separate non-negative size
column. Pie/doughnut use one selected series and at most 12 categories, with
non-negative values and a positive total. Radar uses 3–12 non-negative categories.
100% stacks and stacked areas require non-negative values. Other chart families
use a shared scale; independent dual axes are available in Combination mode.
Every style exports as a native editable PowerPoint chart, not a screenshot.

Desktop workspaces use a wider, fluid layout up to 1,920px with flexible gutters.
Tables and chart previews scroll within their own containers on small screens.

Use the **A/B Test Analyzer** tab for experiment inputs and results. Switching
tabs preserves both workspaces during the current page session. Arrow keys,
Home, and End navigate the tabs. Both tools retain their inputs while switching tabs, but reset on reload.

Each page load starts with newly randomized sample visitor and conversion counts
and calculates the sample results automatically. Replace these demo values with
your experiment counts to run your own analysis. Sample data is not saved.

## Deploy on GitHub Pages
Publish the repository root on GitHub Pages (Settings → Pages → main / root).
Keep `index.html`, `styles.css`, `tools.css`, `simple-worx.css`, `favicon.svg`,
`colors.js`, `app.js`, `tabs.js`, `home-core.js`, `home.js`, `assets/home-atmosphere.webp`,
`chart-data.js`, `chart-modes.js`, `charts.js`, `dedupe-core.js`, `deduper.js`,
`notes-core.js`, `notes.js`, `file-uploads.js`, `libraries.js`, and `percentages.js`
together with `productivity-core.js`, `list-comparison.js`, `table-core.js`,
`slide-table.js`, and `utm.js`. No build step,
backend, account, or tracking is required.

Inter and Outfit load from Google Fonts with system fallbacks. SheetJS 0.20.3
loads for Excel input/output and PptxGenJS 4.0.1 for PowerPoint export, on demand,
with pinned URLs and SHA-384 integrity checks. The shared `libraries.js` loader
reuses one request across tools, verifies the required APIs, and allows retries
after load errors/timeouts. Initial library downloads require
a connection. User data is never sent to the library/font providers.

## Statistical methodology
- Two-sided: uncorrected pooled two-proportion Z-test, `p = 2(1 − Φ(|z|))`.
- One-sided: prespecified directional alternative `B > A`, `p = 1 − Φ(z)`.
- Confidence level: 95%; p < 0.05 is considered significant.
- Displayed confidence interval uses an unpooled normal approximation (one-sided lower bound or two-sided bounds).
- Distribution curves visualize approximate sampling distributions and are not the hypothesis test itself. Each 95% chart marker is the lower bound of the individual sampling distribution (5th percentile in one-sided mode; 2.5th percentile in two-sided mode).
- Requires at least five conversions and five non-conversions in each arm. Normal approximations can still be inaccurate in edge cases.
- Repeated peeking, sample ratio mismatch, and unplanned hypothesis selection can compromise conclusions. Do not use significance alone as a launch decision.

## Developer checks
GitHub Actions runs JavaScript syntax checks and Node tests on pushes and pull
requests, without installing application dependencies. Tests also verify local
assets resolve beneath a repository subpath and shared library loading/retry behavior.

Run `node --test tests/*.test.cjs` for chart parsing/scales/families, colors, A/B
samples, selected-column dedupe, note organization, percentage calculations, list comparison, UTM links, and table layout.
Run `node --check` on changed JavaScript files. Browser checks cover downloaded
XLSX values/formats, clipboard success/fallback, preserved tab state, native
PowerPoint exports, and desktop/mobile layouts.

## Privacy
All processing runs in the browser. Inputs are not transmitted or automatically
saved. Downloaded/copied outputs contain entered data. Old local workspace
storage is left untouched, although its management UI is no longer included.

File upload areas support one file at a time, visible drag-over feedback, and
native keyboard/touch file browsing. Dropped and browsed files use identical
validation and import paths. Dropping files outside the areas does not navigate
away from open work.

Meeting Recap Builder: use **Clear / reset** to start another meeting without
refreshing other tools. **Undo clear** restores the previous notes and reviewed
draft until you type new notes, change the merge setting, or build another recap.
While editing notes, press **Alt/Option + Shift + M** for **For me**, or
**Alt/Option + Shift + A** for **Action item**. These label the current line or
selected lines; in a reviewed recap they move the current item instead.
The toolbar buttons provide the same source-note labels without a keyboard.

Original Ctrl/Cmd+Shift+1/2 shortcuts remain supported when the browser delivers
them to the page; some browsers reserve those combinations. Shortcuts only run
while editing source notes or a reviewed recap item.
