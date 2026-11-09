# Stat Console

A browser-based toolkit for everyday work. Five areas organize working utilities;
there are no projects, tasks, owners, deadlines, or decision logs.

The shell uses graphite/slate surfaces and electric mint (`#04E2B7`, hover
`#0EF3C5`). Chart and image colors are independent of the interface. Inputs and
outputs stay in your browser; download files before closing or reloading the tab.

## Data
- Paste CSV/TSV or import up to 20 CSV, TSV, XLS/XLSX, or JSON files (5 MB each).
  Each nonempty Excel sheet becomes a session table. Save formula results in
  Excel before importing. JSON accepts row arrays or records with identical keys.
- Trim whitespace and remove blank/exact duplicate rows, find duplicate keys,
  calculate columns, or pivot with sum, average, count, minimum, or maximum.
- Combine matching tables by appending rows, compare versions by a unique key,
  or left-join columns. Comparisons require identical headers. Joins retain every
  left row; unmatched values stay blank and duplicate headers receive suffixes.
- Keep session snapshots, convert/download CSV, TSV, JSON, or XLSX, send a table
  to Chart Studio, or add an editable table slide to the deck.
- Keep or download cleanup/calculated-column recipes and replay them on another
  table. Recipes cannot execute scripts; joins and pivots are manual operations.

Tables support 10,000 rows, 100 columns, and 200,000 cells. Previews show 30 rows;
exports retain all rows. Chart handoff explicitly offers the first 200 rows for
larger tables. CSV/TSV downloads neutralize formula-like text. XLSX exports preserve
cell contents as text, including leading zeros, rather than guessing column types.

## Presentations
Chart Studio retains all 21 chart styles, dual axes, custom colors, editable data,
and native PowerPoint export. A/B Test Analyzer remains in its own tab.

**Add chart to deck** captures the applied chart data/settings as a native editable
chart. Add table slides from Data or the deck table form (up to 15 data rows and
8 columns), and image slides from Visuals. Reorder/remove slides and download one
16:9 PowerPoint containing up to 30 slides. Charts and tables are editable; image
and A/B distribution slides are images. Charts retain embedded data and the
bubble-workbook, percentage-area, and slice-label export repairs in mixed decks.
Deck snapshots stay unchanged if you subsequently edit the original chart.

## Calculators
- Percentage of a number, one number as a percentage of another, and percentage
  increase/decrease. **Display and Copy round to one decimal place**:
  `36.25%` becomes `36.3%`. Editing inputs clears stale results. Percentage change
  requires a positive starting value; zero totals receive explicit explanations.
- Budget versus actual spend, ROI, target-margin pricing, break-even/unit economics,
  compound-growth forecasts, demand sensitivity, and weighted decision scorecards.
- Result tables can be downloaded as CSV or opened in Data for charting.

ROI uses total return including the original investment. Forecasts assume constant
compound growth (up to 120 periods). Sensitivity varies demand from −20% to +20%
with fixed price/cost assumptions. Weighted scores normalize nonnegative weights;
use a consistent higher-is-better scoring scale. These are deterministic models,
not predictions or an AI service.

## Text
- Paste plain text, strip common Markdown formatting, trim/collapse spaces,
  extract unique list items, sort lines, or change case. Textareas accept plain
  text from rich-text clipboard sources.
- Compare text by line with labeled added/removed/unchanged rows and download a
  diff. Limits: 1,500 lines and 1 million line pairs.
- Convert CSV/TSV tables to Markdown, JSON, CSV, or tab-separated plain text;
  convert Markdown tables back to CSV or send the table to Data.

## Visuals
- Resize PNG/JPEG/WebP, choose standard export sizes, compress JPEG/WebP, and
  convert formats. Aspect ratio is locked by default; presets unlock it.
- Remove a **solid-color background** by selected color and tolerance. This is
  color-based removal, not AI subject segmentation; matching foreground colors
  are removed too. Use PNG/WebP for transparency; JPEG uses white behind it.
- Download an image or add PNG/JPEG to the deck. Image outputs must be regenerated
  after changing settings. Source images are limited to 10 MB / 32 million pixels;
  individual output dimensions are 1–8,192 px with at most 32 million pixels.
- Batch fit up to 20 images into consistently sized PNG/JPEG canvases and download
  a ZIP. Batch dimensions are 1–4,096 px, with at most 64 million total output pixels.
  Images are centered without stretching;
  letterboxing is transparent for PNG and white for JPEG.
- Pick foreground/background colors with HEX or the color wheel and check WCAG
  AA/AAA contrast. Normal-text AA requires 4.5:1; large-text AA requires 3:1.

## Navigation and previous data
Use the five sidebar areas, in-area tool shortcuts, or **Ctrl/Cmd K** command
search. Switching areas preserves mounted forms and chart/A/B inputs.

Previous project-management controls are removed. If an old locally saved
workspace exists, **Download previous workspace** preserves a complete JSON
backup, including notes/tasks. **Recover previous tables & charts** brings its
datasets and chart snapshots into the session without changing the old storage.
No new data is automatically saved. Download working tables, recipes, images,
text outputs, and decks before closing the tab.

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
  Color settings are retained while switching tabs and styles, but reset on reload unless kept in a deck snapshot for the current session.

## Create a chart for PowerPoint
1. Open the **Chart Studio** tab and edit the spreadsheet-style table directly.
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
Home, and End navigate the tabs. Use **Add chart to deck** to keep an applied chart snapshot for the current session. Download the deck before closing the tab. A/B inputs remain session-only.

Each page load starts with newly randomized sample visitor and conversion counts
and calculates the sample results automatically. Replace these demo values with
your experiment counts to run your own analysis. Sample data is not saved.

## Deploy on GitHub Pages
Publish the repository root on GitHub Pages (Settings → Pages → main / root).
Keep `index.html`, both CSS files, and all root JavaScript modules together.
There is no build step, account, backend, or tracking.

Inter and Outfit load from Google Fonts with system fallbacks. Excel import/export
loads SheetJS 0.20.3 on demand; PowerPoint loads PptxGenJS 4.0.1; image ZIP exports
load JSZip 3.10.1 when it is not already present. All script URLs are pinned with
SHA-384 integrity checks. Initial library/font downloads require a connection;
input data is never sent to these providers. No document/PDF tools are included.

## Statistical methodology
- Two-sided: uncorrected pooled two-proportion Z-test, `p = 2(1 − Φ(|z|))`.
- One-sided: prespecified directional alternative `B > A`, `p = 1 − Φ(z)`.
- Confidence level: 95%; p < 0.05 is considered significant.
- Displayed confidence interval uses an unpooled normal approximation (one-sided lower bound or two-sided bounds).
- Distribution curves visualize approximate sampling distributions and are not the hypothesis test itself. Each 95% chart marker is the lower bound of the individual sampling distribution (5th percentile in one-sided mode; 2.5th percentile in two-sided mode).
- Requires at least five conversions and five non-conversions in each arm. Normal approximations can still be inaccurate in edge cases.
- Repeated peeking, sample ratio mismatch, and unplanned hypothesis selection can compromise conclusions. Do not use significance alone as a launch decision.

## Developer checks
Run `node --test tests/*.test.cjs`. Tests cover existing chart/A/B behavior,
percentage rounding, legacy project validation, data operations, text comparison
and conversion, calculator models, and contrast. Use `node --check` on changed
JavaScript files. Browser checks should cover cross-tool handoffs, native mixed
PowerPoint decks, image pixels/ZIPs, clipboard fallback, and responsive layouts.

## Privacy
Processing happens in this browser. New utility inputs are session-only and are
not transmitted or persisted. Downloaded files contain your entered data. Old
saved workspace data is used only for optional recovery or backup, and is never
overwritten or deleted by the new utilities.
