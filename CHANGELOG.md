# Changelog

## Unreleased — Minimal Gaming HUD
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
