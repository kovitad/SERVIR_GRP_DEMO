# Step-by-step revision — restore systematic prototype and add vulnerable-people map

**Date:** 26 August 2026  
**Decision:** Roll back the broad automated proximity redesign and introduce Pin's ideas incrementally.

## What was restored

The application source was restored from Git commit `9102adf`, preserving the structured 25 August journey:

1. choose planning purpose;
2. select district or Tambon;
3. choose RP20/RP50/RP100;
4. review candidate evacuation places;
5. review vulnerable people;
6. record analyst review;
7. generate an editable budget report; and
8. open the H/M/L risk map as supporting information.

## Only new feature in this revision

An aggregated vulnerable-people map layer was added to the existing **Vulnerable people** tab.

### Behaviour

- V1–V4 appear as purple hatched polygons only when the Vulnerable people tab is active.
- Candidate-place markers remain visible but visually secondary.
- The flood layer is softened so the vulnerability pattern remains readable.
- The legend explains the new layer and aggregation/privacy limitation.
- Selecting V1–V4 opens a lightweight evidence drawer.
- Closing the result panel expands the full map without losing the vulnerable layer.
- Natural-language questions about vulnerable people open the same map view.

### Zone meanings

- V1: illustrative child-support concentration;
- V2: illustrative older-people concentration;
- V3: illustrative disability-related support concentration; and
- V4: illustrative low-mobility concentration.

These are demonstration zones, not production findings. Categories can overlap and no individual or household locations are represented.

## Deferred

The following remain archived for later incremental consideration and are not in the current interface:

- selectable shelter-proximity thresholds;
- nearest-shelter lines and gap calculations;
- automated strategy-guidance replacement;
- broad upload redesign; and
- removal of analyst/budget workflows.

## Test path

1. Run an RP100 assessment.
2. Select **Vulnerable people**.
3. Confirm V1–V4 and the purple legend appear.
4. Select V1 and confirm its aggregated detail opens.
5. Close the drawer.
6. Close the main result panel with **×** and confirm all four zones remain visible.
7. Return to candidate view and confirm the vulnerability zones are hidden.
8. Ask “Where are vulnerable people?” and confirm the same map view opens.
