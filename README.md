# Insights Studio

Personal, browser-based A/B test analysis and presentation-ready chart exports.

## Deploy on GitHub Pages
1. Upload `index.html`, `styles.css`, and `app.js` to the root of your `insights-studio` repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose **main** and **/(root)**, then save.
5. Wait for the Pages deployment to complete and open the published URL.

No build step, packages, backend, tracking, or external network requests are required.

## Statistical methodology
- Two-sided: uncorrected pooled two-proportion Z-test, `p = 2(1 − Φ(|z|))`.
- One-sided: prespecified directional alternative `B > A`, `p = 1 − Φ(z)`.
- Confidence level: 95%; p < 0.05 is considered significant.
- Displayed confidence interval uses an unpooled normal approximation (one-sided lower bound or two-sided bounds).
- Distribution curves visualize approximate sampling distributions and are not the hypothesis test itself. Each 95% chart marker is the lower bound of the individual sampling distribution (5th percentile in one-sided mode; 2.5th percentile in two-sided mode).
- Requires at least five conversions and five non-conversions in each arm. Normal approximations can still be inaccurate in edge cases.
- Repeated peeking, sample ratio mismatch, and unplanned hypothesis selection can compromise conclusions. Do not use significance alone as a launch decision.

## Privacy
All calculations run in the browser. Inputs are not transmitted or persisted by the application. **GitHub Pages is publicly accessible**; use only sample or approved data while prototyping. Review your organization's policy before entering confidential data.
