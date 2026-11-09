# Stat Console

Five focused tools in one tabbed interface:

- **Chart Creator** — turn Excel/CSV or pasted data into customizable charts and
  export SVG, PNG, or a native editable PowerPoint slide.
- **A/B Test Analyzer** — compare experiment conversion rates with the existing
  two-proportion test and export the distribution chart.
- **Excel De-duper** — remove duplicates within a column or exclude a second list.
- **Note Organizer** — turn meeting notes into an editable bulleted Wrike recap.
- **Slide Format Advisor** — describe your message and get five slide-layout ideas.

The graphite/mint design, wide responsive layout, and custom chart colors remain.
The previous dashboards, project management, broad utility categories, calculators,
visual tools, and multi-slide deck builder are removed. Inputs remain mounted
while switching tabs; Arrow keys, Home, and End navigate the tabs.

## Excel de-duper
1. Upload XLSX, XLS, or CSV (up to 10 MB).
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

## Note organizer
Type or paste one note per line, optionally add a meeting title, and select
**Organize notes**. Common bullets/numbering are cleaned up and repeated lines
are consolidated. Explicit `Decision:`, `Action:`, `TODO:`, and `Question:` labels
are grouped into Discussion, Decisions, Action items, and Open questions. Section
headings also work. Names, dates, figures, and wording stay as written.

Turn grouping/repetition options off if desired. Edit the resulting recap and
select **Copy recap for Wrike**, then paste it into your meeting recap. Clipboard
failure selects the recap for manual copying. There is no Wrike connection or
automatic posting. This is deterministic organization, not AI summarization.
Notes are session-only: copy them before closing/reloading. Limits: 100,000
characters / 5,000 lines. Source edits invalidate the generated recap.

## Slide format advisor
Describe the message you want the audience to understand or decide, then select
**Recommend slide formats**. Five ranked layout cards explain when each format
works, show a wireframe, and list the slide structure. Copy a chosen outline to
use when building the slide in PowerPoint.

Suggestions match themes such as comparisons, trends, change, processes, metrics,
causes, and decisions. General briefs receive flexible fallback formats. This is
a rule-based layout guide, not an AI content generator; it does not invent slide
facts or create a deck. Limits: 15–5,000 characters per brief.

## Customize chart colors
- Choose Signal, Arcade, or Spectrum in **Chart palette**, then customize each
  series using its swatch and HEX field. Pie and doughnut charts have a color
  control for each category instead.
- A swatch opens the color wheel. Hue, saturation, and brightness sliders provide
  keyboard access; HEX input accepts 3 or 6 digits. Select **Apply color** to
  commit a wheel selection, or Cancel/Escape to keep the previous color.
- In **A/B Test Analyzer**, expand **Chart colors** to set Control A and Variant B
  independently. Changing colors does not change test values or results.
- Selected colors appear in the preview and SVG/PNG/PowerPoint exports. Invalid
  HEX input leaves the last valid color applied. Presets reset custom overrides.
  Color settings are retained while switching tabs and styles, but reset on reload.

## Create a chart for PowerPoint
1. Open the **Chart Creator** tab and edit the spreadsheet-style table directly.
   Add or remove rows and series as needed. Paste a full table with headers into
   any cell, expand **Paste a table or CSV**, or upload CSV, TSV,
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
Keep `index.html`, `styles.css`, `tools.css`, `colors.js`, `app.js`, `tabs.js`,
`chart-data.js`, `chart-modes.js`, `charts.js`, `dedupe-core.js`, `deduper.js`,
`notes-core.js`, `notes.js`, and `slide-formats.js` together. No build step,
backend, account, or tracking is required.

Inter and Outfit load from Google Fonts with system fallbacks. SheetJS 0.20.3
loads for Excel input/output and PptxGenJS 4.0.1 for PowerPoint export, on demand,
with pinned URLs and SHA-384 integrity checks. Initial library downloads require
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
Run `node --test tests/*.test.cjs` for chart parsing/scales/families, colors, A/B
samples, selected-column dedupe, note organization, and slide-format matching.
Run `node --check` on changed JavaScript files. Browser checks cover downloaded
XLSX values/formats, clipboard success/fallback, preserved tab state, native
PowerPoint exports, and desktop/mobile layouts.

## Privacy
All processing runs in the browser. Inputs are not transmitted or automatically
saved. Downloaded/copied outputs contain entered data. Old local workspace
storage is left untouched, although its management UI is no longer included.
