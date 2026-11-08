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

# Design System: Insights Studio, Minimal Gaming HUD

Restyle the existing site visually only. Do NOT change statistical
calculations, chart data logic, form behavior, or Export SVG/PNG
functionality. Keep it responsive and accessible.

## Palette rule
Strictly monochrome plus ONE accent. Black, grays, white, and
yellow (#FFDC19). No other hues anywhere in the UI. Do not add
blue, green, purple, red, or any category colors.

## Step 1: Tokens
Define in :root and use ONLY these variables (no hard-coded colors
in components). Replace any existing equivalent values.

```css
:root {
  --bg: #0a0a0a;
  --surface: rgba(255, 255, 255, 0.03);
  --surface-inset: #000000;
  --border: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.20);

  --accent: #FFDC19;
  --accent-hover: #FFE64D;
  --accent-tint: rgba(255, 220, 25, 0.07);
  --accent-glow: rgba(255, 220, 25, 0.10);
  --on-accent: #0a0a0a;

  --text: #f2f2f2;
  --text-muted: rgba(242, 242, 242, 0.55);

  --chart-control: #c9c9c9;
  --chart-variant: var(--accent);

  --radius: 2px;
  --font-body: "Outfit", system-ui, sans-serif;
}
```

## Step 2: Global look
- Page background: var(--bg) with a very subtle repeating "+" grid
  pattern (~3-5% opacity). Use broad, soft yellow radial glows
  (--accent-glow) near the upper-right and lower-left areas to gently
  brighten the background without competing with the content.
- Font: load Outfit from Google Fonts, used site-wide. Bold,
  geometric headings.
- Small labels ("MARKETING ANALYTICS", field labels, tile labels,
  "Hypothesis"): 11-13px, uppercase, bold, letter-spacing 0.08em,
  muted color.
- Numbers (stat tiles, p-value, axis ticks): bold,
  font-variant-numeric: tabular-nums.
- Border radius: var(--radius) everywhere. Remove large rounded
  corners.

## Step 3: Components (mapped to this site)

### Header
- "Insights" in var(--text), "Studio" in var(--accent), large, bold,
  tight tracking.
- Keep the yellow rule under the header, 2px, fading out toward
  the right edge.

### Panels ("Test data", "Experiment results")
- background var(--surface), 1px var(--border), radius var(--radius).
- Section titles: bold, with a short 3px accent bar to their left.

### Inputs (Visitors A/B, Conversions A/B)
- Dark inset fields (var(--surface-inset)), 1px var(--border-strong),
  bold value text, square corners.
- Focus: 1px var(--accent) border.
- Labels above: uppercase, muted, small.

### Hypothesis radios
- Square or diamond marker, filled with var(--accent) when selected.
- Selected text var(--text), unselected var(--text-muted).

### Primary button ("Calculate results")
- Background var(--accent), text var(--on-accent), bold uppercase,
  letter-spacing 0.06em, radius 0, one clipped corner:
  clip-path: polygon(0 0, 100% 0, 100% 70%, 92% 100%, 0 100%).
- Hover: var(--accent-hover). Active: 1px translate down.

### Secondary buttons (Export SVG, Export PNG)
- Transparent, 1px var(--border-strong), uppercase muted text.
- Hover: border and text become var(--accent).

### Badges ("95% confidence", "Significant")
- Small rectangular badges with square corners instead of pills.
- "Significant" uses accent border and text. Neutral badges use
  var(--border-strong) and muted text.

### Result callout ("Variant B outperformed Control A")
- Background var(--accent-tint), 1px var(--border), 3px solid
  var(--accent) left border. Bold lead sentence, muted detail line.

### Stat tiles (Control A, Variant B, Relative lift, P-value)
- var(--surface-inset) background, 1px var(--border). All four tiles
  look identical: no colored borders.
- Tiny uppercase muted label, large bold value in var(--text).
- Only Variant B's value uses var(--accent).
- Add a small 8px corner notch or bracket detail (via
  pseudo-element) in var(--border-strong) on the top-left of each
  tile for the HUD feel.

### Chart ("Expected conversion rate distributions")
- Black container with 1px var(--border).
- Control curve: var(--chart-control). Variant B curve and fill:
  var(--chart-variant) with ~15% fill opacity.
- Gridlines and ticks: very low-opacity white. Dashed 95% markers
  stay subtle. Legend uses small square swatches.
- Ensure exported SVG/PNG still render correctly (explicit colors
  or inlined styles in the export, no unresolved CSS vars).

### Collapsible ("Statistical calculations")
- Styled as a section label with a chevron icon, 1px top border.
- Hover turns text to var(--accent).

### Footer
- Small, centered, muted, uppercase.
