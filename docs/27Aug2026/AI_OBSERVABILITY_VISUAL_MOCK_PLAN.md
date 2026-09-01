# AI Observability and Evaluation Visual Mock Plan

**Status:** Superseded as implementation boundary; retained as UX design record
**Original mock type:** Type A — subsequently expanded to the implemented Type B-lite pilot
**Entry points:** Planner result and technical/admin assurance workspace
**Audience:** Planners/end users, product and technical team, leadership
**Languages:** English and Thai
**Screens:** 1–5 approved
**Date:** 28 August 2026

## Implementation update — 28 August 2026

The Product Manager changed the delivery decision from Type A to Type B-lite. The five-screen UX in this plan was implemented with a real server-side OpenAI answer, real Langfuse workflow observations and scores, and real planner feedback. LangGraph was not added. The baseline comparison and historical dashboard values remain fixtures. See `../../HANDOVER.md` for the current source of truth.

## 1. Purpose

Create a credible, bilingual visual mock showing how a future observable AI planning explanation could be reviewed, diagnosed and compared. The mock will demonstrate the product experience and governance contract before any backend, LangGraph, OpenAI or Langfuse implementation is approved.

The mock must answer this proof question:

> Can a reviewer understand why an AI answer was produced, inspect its evidence and checks, and see whether a candidate release is better than the baseline?

## 2. Approved demonstration scenario

- **AOI:** Phaya Thai District, Bangkok
- **Scenario:** RP100 / 1% annual chance
- **Pilot question:** “Why should areas farther than 1 km from candidate shelters be prioritised?”
- **Illustrative population in flood extent:** 18,640
- **Illustrative population beyond 1 km:** 11,240
- **Governed evidence records:** 3
- **Answer boundary:** planning explanation only; no forecast, warning, safe-shelter designation or operational decision

All observability events, evidence, scores, versions, latency, tokens and cost are static fixtures. Every relevant view must display **Simulated observability** and **Illustrative data** status.

## 3. Audience design

### Planner/end-user layer

Show a concise explanation, evidence links, limitations and human-review status. Do not expose unnecessary model-chain detail or imply that evaluator passes make the recommendation operationally approved.

### Product and technical layer

Show the simulated trace, operation status, versions, evidence provenance, evaluator results, latency, tokens, cost and baseline/candidate comparison.

### Leadership layer

Show a compact assurance summary: trace coverage, checks passed/unknown/failed, ability to diagnose a seeded failure, release comparison and visible cost. Avoid implementation-level clutter by default.

## 4. Entry points

1. **Planner result:** add an **Explain with AI** action to the completed shelter-proximity result. It opens Screen 1 in the existing planning experience.
2. **Technical/admin workspace:** add an **AI assurance** entry in the top-right workspace/user area. It opens Screen 2 with navigation to Screens 3–5.
3. Screen 1 includes **View simulated trace** for authorised review, linking to Screen 2.
4. The technical/admin workspace includes **Back to planning** and does not replace or reset the current assessment.

Role access is simulated visually only. The static mock does not provide real authentication or authorisation.

## 5. Screen plan

### Screen 1 — AI planning explanation

**Primary audience:** Planner/end user

Display:

- approved pilot question;
- short answer using 18,640 and 11,240;
- three evidence citations with stable mock IDs;
- recommended follow-up actions;
- explicit limitations: mocked data, straight-line distance, unverified capacity/accessibility/route safety, and candidate shelters not approved;
- human-review-required status;
- simulated trace ID and generation time; and
- **View simulated trace** action.

The explanation must distinguish calculated/reference figures from generated narrative.

### Screen 2 — Trace detail

**Primary audience:** Product and technical team

Display one simulated request trace with operations:

1. validate AOI, scenario and access;
2. retrieve versioned evidence;
3. read deterministic calculation/reference values;
4. generate the planning explanation; and
5. check citations and mandatory limitations.

Show operation duration/status, mock input/output summaries, stable versions and the relationship between root, retrieval and generation observations. Do not present hidden chain-of-thought. Show concise decision summaries and recorded inputs/outputs only.

### Screen 3 — Evaluator results

**Primary audience:** Product, technical and governance reviewers

Display four deterministic checks:

- figures match expected assessment values;
- evidence IDs and versions resolve;
- output schema is valid; and
- mandatory limitations are present.

Display three narrow simulated judge results:

- groundedness;
- question relevance; and
- action usefulness.

Each result uses `pass`, `fail` or `unknown`, includes a short evidence-based reason, identifies the evaluated observation, and states that the judge itself requires human calibration. Include a visible seeded-failure option so the team can see one useful failure state rather than an all-green dashboard.

### Screen 4 — Baseline versus candidate comparison

**Primary audience:** Product, technical team and leadership

Compare the same golden-question set across two static versions. Show:

- prompt/model/workflow version identifiers;
- deterministic pass rate;
- judge results by class;
- latency, token and cost changes;
- regressions, improvements and unknown results; and
- release recommendation: hold, review or proceed.

Do not collapse quality into one unexplained score. The comparison must make the reason for a recommendation visible.

### Screen 5 — Cost, latency and quality dashboard

**Primary audience:** Leadership and technical owner

Show compact simulated metrics:

- traced requests;
- p50/p95 latency;
- input/output tokens;
- estimated cost per request and total cost;
- deterministic check pass rate;
- judge pass/fail/unknown distribution;
- feedback trend; and
- masking/retention policy status.

Label all metrics as demonstration fixtures, not live production telemetry.

## 6. Navigation and responsive behaviour

Use one full-screen assurance workspace with tabs for Trace, Evaluation, Compare and Dashboard. Screen 1 remains integrated with the planner result. Preserve the current map and assessment state when opening or closing assurance views.

At desktop width, use a summary rail and main detail area. At tablet/mobile widths, stack summaries above details, keep tabs horizontally scrollable, and avoid data tables wider than the viewport.

## 7. Bilingual content plan

- All headings, actions, statuses, explanations, evaluator reasons, limitations, charts, tooltips and accessibility labels must support EN/TH.
- Preserve technical identifiers such as AOI, RP100, trace ID, evidence ID, model/version, p50/p95 and `pass/fail/unknown` where needed; provide Thai explanatory text around them.
- Add exact and ordered-fragment translations to `public/i18n.js` for static and dynamically inserted content.
- Test switching language while every screen is open and after navigating between screens.
- Language remains stored under the existing `grp-language` local-storage key.

## 8. Static fixture contract

Create one clearly named fixture object/file containing:

- trace and observation IDs;
- timestamps and durations;
- prompt, model, workflow, tool/configuration and evidence versions;
- evidence titles and mock IDs;
- answer content and limitations;
- deterministic evaluator outputs;
- narrow-judge outputs and reasons;
- baseline/candidate experiment values;
- dashboard time-series values; and
- one seeded-failure variant.

The fixture must contain no secrets, personal data or real household locations. UI components should read the fixture rather than duplicate numbers in markup. A top-level `simulated: true` flag must drive the visual status label.

## 9. Visual and safety rules

- Reuse the SERVIR Global Collaborative palette, typography, spacing and logo.
- Use colour plus text/icon for status; never colour alone.
- Display **SIMULATED OBSERVABILITY · NO LIVE AI OR TRACING** persistently in technical views.
- Keep **AI output requires authorised human review** on Screen 1.
- An evaluator pass means the mock check passed; it does not mean scientific, policy or operational approval.
- Do not show or claim chain-of-thought.
- Do not imply that Langfuse Cloud, OpenAI or LangGraph is connected.
- Meet keyboard navigation, visible-focus, semantic heading, dialog/drawer and chart-text-alternative expectations.

## 10. Anticipated implementation files

Primary source of truth is `prototype/github/public/`.

- `public/index.html` — entry points and assurance workspace shell
- `public/styles.css` — planner explanation and assurance workspace styles
- `public/app.js` — deterministic interactions and screen state
- `public/i18n.js` — complete EN/TH coverage
- `public/observability-fixtures.js` — proposed static fixture source
- `README.md` — run/demo instructions and Type A boundary
- `HANDOVER.md` — mock status, validation and next decision
- `docs/27Aug2026/` — plan, proposal and evidence screenshots

No backend, provider SDK, API endpoint, cloud project or secret configuration is in scope.

## 11. Implementation sequence

### Phase 1 — Content and fixture

1. Finalise English answer, evidence labels, limitations and evaluator reasons.
2. Define baseline, candidate and seeded-failure fixtures.
3. Translate and review all user-visible content in Thai.

### Phase 2 — Planner experience

1. Add **Explain with AI** after a completed assessment.
2. Build Screen 1 with evidence and limitations.
3. Connect **View simulated trace** without losing assessment state.

### Phase 3 — Assurance workspace

1. Build workspace shell and Screen 2 trace timeline.
2. Add Screen 3 evaluator results and seeded-failure switch.
3. Add Screen 4 release comparison.
4. Add Screen 5 dashboard.
5. Add technical/admin entry point and return navigation.

### Phase 4 — Quality and evidence

1. Validate JavaScript and duplicate HTML IDs.
2. Test complete EN/TH switching on all states.
3. Test keyboard navigation and responsive layouts.
4. Confirm every screen carries simulation and safety labels.
5. Capture English and Thai screenshots for Screens 1–5.
6. Update README and handover with demonstrated behaviour and limitations.

## 12. Acceptance criteria

The Type A mock is complete when:

- both approved entry points work;
- Screens 1–5 are navigable and use one consistent static fixture;
- the approved Phaya Thai/RP100 question and figures are used consistently;
- the three evidence records are visible and traceable through the mock;
- four deterministic checks and three narrow judges are shown;
- a seeded failure clearly identifies the affected operation/check;
- baseline and candidate versions can be compared without one opaque quality score;
- cost, latency, tokens and quality are visible and labelled simulated;
- all content and dynamic states work in English and Thai;
- planner state is preserved when entering/leaving assurance views;
- keyboard/responsive checks pass;
- no network call, provider key or claim of live observability exists; and
- screenshots and handover notes document the result.

## 13. Out of scope

- Real AI generation
- LangGraph execution
- OpenAI calls
- Langfuse project or instrumentation
- Real evaluators or calibration runs
- Authentication or role enforcement
- Production telemetry, alerting or persistence
- Scientific approval of the illustrative evidence

## 14. Decision after the mock

Use the mock review to decide whether to proceed to the working Type B pilot. Approval should cover the final user experience, evidence contract, evaluator design, Thai wording, cloud-data policy, named owners and the limited implementation timebox. The visual mock itself is not evidence that the proposed observability architecture works.
