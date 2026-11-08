# Stat Console

Personal, browser-based chart creation, editable PowerPoint exports, and A/B test analysis.

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

The starting table is example data. Charts support up to 200 categories, 6 numeric
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

Desktop workspaces use a wider, fluid layout up to 1,680px with flexible gutters.
Tables and chart previews scroll within their own containers on small screens.

Use the **A/B Test Analyzer** tab for experiment inputs and results. Switching
tabs preserves both workspaces during the current page session. Arrow keys,
Home, and End navigate the tabs. Data is not persisted across reloads.

Each page load starts with newly randomized sample visitor and conversion counts
and calculates the sample results automatically. Replace these demo values with
your experiment counts to run your own analysis. Sample data is not saved.

## Deploy on GitHub Pages
1. Upload `index.html`, `styles.css`, `app.js`, `tabs.js`, `chart-data.js`, `chart-modes.js`, and `charts.js` to the root of your `insights-studio` repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose **main** and **/(root)**, then save.
5. Wait for the Pages deployment to complete and open the published URL.

No build step, packages, backend, or tracking are required. Outfit is loaded from
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
families, stacking, and export specifications. No
packages need to be installed. Use `node --check charts.js` for syntax validation.

## Privacy
All calculations run in the browser. Inputs are not transmitted or persisted by the application. **GitHub Pages is publicly accessible**; use only sample or approved data while prototyping. Review your organization's policy before entering confidential data.
