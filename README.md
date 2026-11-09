# Stat Console

A personal command center for projects, data, decisions, and editable PowerPoint charts.

The interface uses graphite/slate surfaces with electric-mint accents
(`#04E2B7`, with `#0EF3C5` hover highlights). Body text
uses Inter; the Stat Console wordmark uses Outfit. Data colors are independent
of the interface accent.

## Start using the command center
1. Create a project, or select **Load example project** in Overview. Add notes,
   actions, owners, and due dates. The overview highlights overdue actions and
   decisions due for review.
2. Open **Workbench** to paste or upload CSV/TSV. Clean whitespace and duplicate
   rows, calculate columns, compare versions by a unique key, or left-join another
   saved table. Original project datasets remain unchanged. Save a dataset copy
   when the result is ready. Previews show 30 rows; downloads keep the full table.
3. Select **Analyze table**, customize the chart, and **Save to project**. Open saved
   charts in **Create** to edit them or export native PowerPoint slides. Chart
   Studio also imports Excel; **To workbench** sends its applied table back.
4. Use **Scenarios** for unit-economics comparisons (revenue, cost, profit, margin,
   and break-even). Record the conclusion, reasoning, owner, and review date in
   **Decisions**. Scenario inputs assume a constant price and cost per unit.
5. **Create** produces editable project briefs, meeting agendas, and decision memos
   from your records. Download the Markdown draft before navigating away. Lines
   marked `TODO:` or `ACTION:` in project notes can become reviewed next actions.
6. Save cleanup/calculated-column steps in Workbench and replay them in **Automate**
   on another saved dataset. Review results before saving. Joins and comparisons
   are manual operations and are not included in saved workflows.

Press **Ctrl/Cmd K** to find tools, projects, datasets, and saved charts.

**Save locally** explicitly saves all projects on this browser. Changes after a
manual save require another save. **Download project** creates a portable JSON
backup of the active project; **Import project** adds a separate copy. Browser
storage can be cleared or unavailable, and does not synchronize between devices.
Project files and saved browser workspaces are limited to 5 MB. Workbench tables
support 10,000 rows, 100 columns, and 200,000 cells. Charts retain their 200-row /
6-series limits; larger tables offer an explicit **Analyze first 200 rows** action.
CSV downloads escape text that could be interpreted as spreadsheet formulas.

This version runs locally in the browser: it has no account system, integrations,
scheduled jobs, or AI service. Briefs are templates based on entered records.

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
  Color settings are retained while switching tabs and styles, but reset on reload unless stored in a project chart snapshot.

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
Home, and End navigate the tabs. Use **Save to project** followed by **Save locally** to retain applied chart snapshots across reloads. A/B inputs remain session-only.

Each page load starts with newly randomized sample visitor and conversion counts
and calculates the sample results automatically. Replace these demo values with
your experiment counts to run your own analysis. Sample data is not saved.

## Deploy on GitHub Pages
1. Upload `index.html`, `styles.css`, `console.css`, `console-core.js`, `console.js`, `colors.js`, `app.js`, `tabs.js`, `chart-data.js`, `chart-modes.js`, and `charts.js` to the root of your `stat-console` repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose **main** and **/(root)**, then save.
5. Wait for the Pages deployment to complete and open the published URL.

No build step, packages, backend, or tracking are required. Inter and Outfit are loaded from
Google Fonts with a system-font fallback; the application still works if the font
service is unavailable. Inputs are never included in font requests.

Excel import loads SheetJS 0.20.3 from its official CDN on demand. PowerPoint
export loads PptxGenJS 4.0.1 from jsDelivr on demand. Both script versions are
pinned and checked with SHA-384 integrity hashes. These two features require a
connection for their initial library download; pasted/CSV input, chart previews,
and image exports work without these libraries. Data stays in your browser and
is never sent to the library providers.

## Statistical methodology
- Two-sided: uncorrected pooled two-proportion Z-test, `p = 2(1 − Φ(|z|))`.
- One-sided: prespecified directional alternative `B > A`, `p = 1 − Φ(z)`.
- Confidence level: 95%; p < 0.05 is considered significant.
- Displayed confidence interval uses an unpooled normal approximation (one-sided lower bound or two-sided bounds).
- Distribution curves visualize approximate sampling distributions and are not the hypothesis test itself. Each 95% chart marker is the lower bound of the individual sampling distribution (5th percentile in one-sided mode; 2.5th percentile in two-sided mode).
- Requires at least five conversions and five non-conversions in each arm. Normal approximations can still be inaccurate in edge cases.
- Repeated peeking, sample ratio mismatch, and unplanned hypothesis selection can compromise conclusions. Do not use significance alone as a launch decision.

## Developer checks
With Node.js installed, run `node --test tests/*.test.cjs` to check random sample
validity, CSV/table parsing, numeric formats, independent axis scales, chart
families, stacking, export specifications, color conversion/validation, project
imports, workbench operations, workflows, and scenario economics. No
packages need to be installed. Use `node --check charts.js` for syntax validation.

## Privacy
All calculations run in the browser. Inputs are never transmitted by the application. Projects persist on this browser only when you select **Save locally**, and project downloads contain their entered data. **Forget saved copy** removes browser storage while keeping the open session; closing the page then clears the session. **GitHub Pages is publicly accessible**; use only sample or approved data while prototyping. Review your organization's policy before entering confidential data.
