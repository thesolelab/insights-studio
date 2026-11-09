# Queue Works diagnostic — November 9, 2026

Repository: https://github.com/thesolelab/queue-works
Live site: https://thesolelab.github.io/queue-works/
Reviewed base: `8772721` (main after the recap shortcut fix).

## Findings and adjustments

- GitHub Pages is built from `main` at the repository root. The renamed site and
  its 17 existing local CSS, JavaScript, and favicon assets responded HTTP 200.
  Local paths are relative; no production asset path needed a rename. Updated
  stale README repository/hosting information and the local Git remote.
- Chart Creator and Excel De-duper maintained separate lazy Excel loaders, which
  could insert duplicate scripts when both tools were used. Consolidated these
  into `libraries.js`, retaining the exact pinned URLs and integrity hashes.
  Concurrent users share one promise; failures/timeouts allow another attempt.
  PowerPoint loading now checks for its required globals before reporting success.
- Added GitHub Actions checks for JavaScript syntax and Node tests. Added focused
  tests for shared loading, errors, timeouts, missing globals, preloaded libraries,
  and asset resolution under a repository subpath.
- No statistical formulas, chart data logic, chart styles, or input persistence
  rules were changed. No backend, framework, or build dependencies were added.

## Verification

- 56 Node tests passed; every application JavaScript file passed `node --check`.
- Served the candidate under `/queue-works/` and checked all six tools in Chromium.
- All 21 chart styles: preview, SVG/PNG downloads, native editable PPTX XML,
  and embedded workbook data passed existing browser/export checks.
- Concurrent Excel loads and XLSX uploads in both tools used exactly one script
  request; no Excel library was requested at initial page load.
- De-dupe and cross-column exclusions: matching options, stale-output protection,
  worksheet offsets, cleaned workbook values, and header-only output passed.
- Recap: editing/moving/copying, stale-source protection, reset/undo, and shortcuts
  passed. Percentage calculator rounding/copy and slide suggestions also passed.
- Responsive checks covered widths from 320 to 1920 pixels. No application
  JavaScript errors were observed in the browser checks.

## Verification limits

Automated export checks inspect generated presentation XML and embedded data;
PowerPoint desktop was not available for visual inspection. Browser checks used
local copies of the exact pinned CDN libraries and fonts because this test
browser has certificate-trust issues with external resources; production URLs
and integrity hashes are unchanged. Live-site HTTP checks tested the deployed
main branch; candidate changes require merging the pull request to deploy.
No measured page-speed improvement is claimed: the optimization removes
redundant loading and duplicate loader code.
