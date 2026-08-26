# Global Risk Platform — Live Mock Refinement Brief

**Date:** 26 August 2026  
**Status:** Working brief after product-refinement discussion with Pin  
**Target:** Existing SERVIR GRP evacuation-planning live mock  
**Purpose:** Give Codex a clear, bounded implementation brief for the next prototype revision.

---

## 1. Product-direction update

The first slice is an **automated spatial planning view**, not a human-review workflow.

For a selected Thailand district or Tambon and an agreed static flood scenario, a Planner should be able to see:

1. where population and vulnerable-population concentrations are located;
2. where candidate evacuation shelters are located;
3. how far vulnerable-population areas are from their nearest candidate shelter;
4. which populated or vulnerable areas appear to have weak shelter proximity; and
5. automated, traceable strategy guidance for preparedness planning.

This slice should help the team discuss the spatial decision and the required data. It must not imply that a candidate shelter is officially safe, approved, accessible or able to accommodate everyone nearby.

### Revised working outcome

> For a selected Thailand district or Tambon and an agreed static return-period flood scenario, a Planner can view flood exposure, population density, vulnerable-population distribution, candidate shelter locations and shelter-proximity gaps, then receive automated and traceable preparedness guidance.

---

## 2. Main changes from the current prototype

### Remove from the first-slice journey

- ADPC analyst review status and comments.
- Human approval or validation step inside the application.
- “Not reviewed / Needs evidence / Provisionally suitable / Rejected” controls.
- Detailed inspection of shelter access, capacity, services, ownership and field evidence as a required step.
- “Prepare a budget case” as the main starting purpose.
- Editable budget-report generation as the primary outcome.
- Any wording that suggests the system has certified a location as safe.

These capabilities may be considered in later increments, but should not dominate or block the first live mock.

### Add or strengthen in the first slice

- A population-density layer.
- A vulnerable-population layer using aggregated spatial units, not individual people.
- Candidate shelter points.
- Nearest-shelter distance from each populated/vulnerable grid cell or area.
- A selectable proximity threshold, for example 500 m, 1 km and 2 km.
- Clear visualization of areas inside and outside the selected shelter-proximity threshold.
- Summary indicators for population, vulnerability and proximity gaps.
- Automated strategy guidance based on the displayed mock analysis.
- Upload options that reflect common raster and vector geospatial formats.

---

## 3. Revised planner journey

### Step 1 — Frame the decision

The Planner selects:

- planning purpose: **Assess evacuation shelter proximity**;
- area of interest: Thailand district or Tambon; and
- flood scenario: RP20, RP50 or RP100, with RP100 as the current default.

Keep a persistent label explaining that the scenario and results are illustrative.

### Step 2 — Load the planning layers

Display these layers together:

- selected AOI boundary;
- agreed flood extent;
- population-density grid or raster;
- aggregated vulnerable-population grid or areas; and
- candidate evacuation-shelter points.

The Layers control should allow each layer to be shown or hidden.

### Step 3 — Show people and vulnerability

The map should make population distribution the main analytical surface rather than showing only summary cards.

Use aggregated cells or zones. Do not display or simulate individual persons or household locations.

For a selected cell/zone, show:

- estimated total population;
- population density;
- available vulnerable-group indicators;
- whether it intersects the displayed flood extent;
- nearest candidate shelter; and
- distance to the nearest candidate shelter.

If vulnerability categories overlap, state that clearly and do not sum them as though they were mutually exclusive.

### Step 4 — Show shelter proximity and gaps

For each populated/vulnerable cell or zone, calculate or mock:

- nearest candidate-shelter ID;
- straight-line distance in metres or kilometres; and
- whether it falls within the selected proximity threshold.

Visually distinguish:

- populated areas within the threshold;
- populated areas outside the threshold; and
- high-density or high-vulnerability areas outside the threshold.

Optionally draw a line from a selected cell/zone to its nearest shelter. Avoid drawing every line at once if this makes the map unreadable.

**Important wording:** call this a **proximity analysis** or **proximity coverage estimate**. Do not call people “served” or “covered” unless verified shelter capacity and accessibility are included.

### Step 5 — Run automated checks

There is no person-in-the-loop step in this first slice.

Replace the analyst-review workflow with an automated analysis summary that states:

- which layers were used;
- the selected AOI, scenario and proximity threshold;
- the main population and vulnerability concentrations;
- the largest apparent proximity gaps;
- important missing data; and
- the limitations of the calculation.

The interface should not show an analyst status, comment form or approval state.

### Step 6 — Show strategy guidance

The main outcome should be **Preparedness strategy guidance**, not a budget report.

Example guidance sections:

- Priority areas for further planning;
- Areas with high population density and weak shelter proximity;
- Areas with concentrated vulnerable groups and weak shelter proximity;
- Candidate locations where additional shelter options may need investigation;
- Data gaps that prevent stronger conclusions; and
- Recommended next analysis or field-verification activities.

An intelligence report, formal budget request and approval workflow belong to later phases.

---

## 4. Proposed screen and interaction changes

### Header and framing

Change the primary title to:

> **Flood evacuation proximity planning**

Replace the current analyst-validation banner with:

> **Automated scenario analysis · Illustrative data · Not an official shelter assessment**

### Starting actions

Make **Assess evacuation shelter proximity** the primary action.

Secondary actions may include:

- Explore people and vulnerability;
- Explore candidate shelters;
- Upload local geospatial data; and
- Download building footprints.

Do not present budget preparation as the default entry point.

### Main result views

Use three connected views or tabs:

1. **People & vulnerability** — density and vulnerable-population patterns;
2. **Shelter proximity** — shelters, thresholds and nearest-shelter distance; and
3. **Planning gaps** — priority cells/areas plus automated strategy guidance.

The flood-risk layer remains supporting context and should stay visible through the Layers control.

### Suggested headline indicators

- Total population in the displayed AOI;
- Population within the displayed flood extent;
- Vulnerable-population estimate, where available;
- Number of candidate shelters;
- Population within the selected proximity threshold;
- Population outside the selected proximity threshold; and
- Number of high-priority gap cells/areas.

All mocked values must be visibly labelled **Illustrative**.

### Shelter popup or drawer

Keep the shelter details lightweight for this slice:

- candidate name/ID;
- source and source date, if mocked;
- location coordinates;
- proximity-zone radius;
- nearby population estimate; and
- clear limitations.

Do not add a suitability score or claim that the shelter is safe. Capacity, access, utilities, accessibility, ownership and operating status may appear as **Not assessed in this slice**.

---

## 5. Map visualization requirements

Show the relationship among people, vulnerability, flood extent and shelters without relying on colour alone.

Recommended visual treatment:

- population density: graduated fill or heat surface;
- vulnerable-population concentration: hatch, outline or symbol overlay;
- flood extent: semi-transparent blue polygon/raster;
- candidate shelters: consistent shelter icon;
- selected shelter-proximity threshold: transparent buffer ring;
- outside-threshold priority areas: strong outline plus icon or label; and
- nearest-shelter relationship: line only for the selected cell/area.

Provide a visible legend and toggles for each layer. Tooltips and labels should explain the units and whether values are mocked.

### Distance limitation

For this prototype, use or simulate **straight-line distance** unless an actual transport-network routing service already exists. Clearly label the method.

Do not describe straight-line distance as:

- walking distance;
- travel distance;
- travel time;
- accessible route; or
- safe evacuation route.

---

## 6. Mock analytical data contract

Use deterministic local mock data so repeated demonstrations return the same result.

### Population/vulnerability cell

```json
{
  "cell_id": "PT-POP-001",
  "geometry": "polygon-or-centroid",
  "population_estimate": 1240,
  "density_people_per_sq_km": 18600,
  "vulnerability": {
    "children_0_14": 210,
    "older_people_65_plus": 135,
    "disability_support_needs": 42,
    "low_mobility_households": 31
  },
  "intersects_flood_extent": true,
  "nearest_shelter_id": "PT-SHL-003",
  "nearest_shelter_distance_m": 1380,
  "within_selected_threshold": false,
  "source_status": "illustrative"
}
```

### Candidate shelter

```json
{
  "shelter_id": "PT-SHL-003",
  "name": "Candidate Shelter C",
  "geometry": "point",
  "source": "illustrative or named reference source",
  "source_date": "YYYY-MM-DD or unknown",
  "capacity": null,
  "official_status": "not assessed",
  "suitability_status": "not assessed",
  "source_status": "illustrative"
}
```

### Analysis configuration

```json
{
  "aoi_id": "TH-BKK-PHAYA-THAI",
  "scenario": "RP100",
  "distance_method": "straight_line",
  "proximity_threshold_m": 1000,
  "capacity_considered": false,
  "routing_considered": false,
  "analysis_status": "illustrative"
}
```

Do not create a composite vulnerability score unless the method, inputs and weighting are explicitly approved. Individual indicators may be displayed separately.

---

## 7. Upload-data refinement

Update the Upload interface so it explains the expected geospatial data types.

### Raster

- `.tif` / `.tiff` — preferably GeoTIFF with CRS/georeferencing.

### Vector

- `.shp` — upload as a ZIP containing at least `.shp`, `.shx` and `.dbf`; include `.prj` where available;
- `.geojson`;
- `.kml`;
- `.kmz`; and
- `.gdb` — upload a zipped File Geodatabase directory.

### Prototype upload behaviour

The live mock may simulate the upload rather than fully parse every format. It should still show these validation stages:

1. file type recognized;
2. geometry or raster type detected;
3. CRS detected or flagged as missing;
4. required attributes mapped or flagged;
5. file size and basic validity checked;
6. preview shown before applying; and
7. source, licence, date and user-provided provenance recorded.

Do not claim that a file has been fully ingested or analysed if the browser mock only simulates these steps.

---

## 8. AI-assistant behaviour

The assistant should open and explain the same governed map views. It should not invent a separate analysis.

Support example questions:

- “Show population density in this flood scenario.”
- “Where are vulnerable people concentrated?”
- “Which populated areas are more than 1 km from a candidate shelter?”
- “Show the nearest shelter to this area.”
- “What are the main shelter-proximity gaps?”
- “Give me preparedness strategy guidance for this AOI.”

The assistant must:

- repeat the AOI, scenario, threshold and distance method;
- distinguish mock data from production data;
- avoid identifying individual people or households;
- avoid calling a candidate shelter “safe” or “approved”;
- avoid claiming capacity coverage when capacity is unknown; and
- show evidence and limitations alongside recommendations.

---

## 9. Acceptance criteria for the revised live mock

1. **Given** a Planner selects an AOI and RP scenario, **when** the assessment runs, **then** the map displays flood extent, population density, vulnerable-population areas and candidate shelters together.
2. **Given** a populated/vulnerable cell is selected, **when** its details open, **then** the prototype shows its population, available vulnerability indicators, flood intersection, nearest candidate shelter and distance.
3. **Given** the Planner selects a 500 m, 1 km or 2 km threshold, **when** the threshold changes, **then** the map and summary update consistently.
4. **Given** an area is outside the threshold, **when** it is displayed as a gap, **then** the UI states that this is a proximity finding and does not consider shelter capacity, accessibility or route safety.
5. **Given** the first-slice workflow is open, **then** no analyst-review status, analyst-comment form or human-approval step is shown.
6. **Given** the analysis is complete, **when** the Planner opens Planning gaps, **then** the prototype provides automated preparedness strategy guidance and explicit data limitations.
7. **Given** the Planner asks a natural-language question about vulnerable people or shelters, **then** the assistant opens or references the same map analysis and does not certify any shelter as safe.
8. **Given** the Upload control is opened, **then** it lists GeoTIFF, zipped Shapefile, GeoJSON, KML, KMZ and zipped FileGDB as expected formats.
9. **Given** a simulated file is uploaded, **then** the prototype shows format, CRS, schema/attribute and provenance checks before applying the layer.
10. **Given** any result is displayed, **then** mocked values and geometries remain visibly labelled as illustrative.
11. **Given** a user relies on colour-impaired viewing, **then** key layer states and gaps remain distinguishable through symbols, outlines or labels as well as colour.
12. **Given** the application is viewed at normal desktop width, **then** controls, map, legends, drawers and result cards do not overlap or clip.

---

## 10. Explicitly out of scope for this revision

- ADPC analyst review or manual approval workflow;
- responsible-authority shelter approval;
- detailed facility evidence assessment;
- verified shelter capacity or allocation;
- road-network routing, travel time or route safety;
- individual- or household-level personal data;
- formal budget request or intelligence report;
- live forecasting or early warning;
- production-grade ingestion of every listed GIS format;
- production authentication, persistence or audit storage; and
- final scientific vulnerability weighting or composite risk scoring.

---

## 11. Open product/data questions — do not silently invent answers

The mock may use clearly labelled temporary defaults, but keep these questions visible for refinement:

1. Which population-density dataset and resolution should production use?
2. Which vulnerability indicators are approved, and at what aggregation level?
3. Should proximity use straight-line distance, road-network distance or travel time in production?
4. Which proximity thresholds are meaningful for the target planner and local context?
5. What is the authoritative candidate-shelter source?
6. When will shelter capacity, accessibility and operational status be available?
7. Should distance be calculated from every population cell, from vulnerable hotspots or from administrative centroids?
8. How should flood intersection change shelter eligibility or the displayed guidance?
9. Which uploaded formats must be genuinely processed in Release 1 rather than simulated?
10. What strategy-guidance rules or policy references should drive the automated output?

---

## 12. Implementation instructions for Codex

1. Inspect the current repository, README, mock-data structures and existing workflow before editing.
2. Preserve the established visual style and reusable components where practical.
3. Implement the revised journey with deterministic local mock data; do not add a production backend solely for this revision.
4. Remove or hide obsolete first-slice analyst-review and budget-report flows instead of leaving contradictory pathways visible.
5. Keep strong, persistent “Illustrative / Not official” labelling.
6. Prefer aggregated population cells or zones; never simulate personally identifiable locations.
7. Make the distance method and proximity threshold visible in the UI and assistant response.
8. Use capacity-neutral wording throughout.
9. Update any in-repository demo guide or README text that directly contradicts the revised mock.
10. Run the existing lint, tests and production build. Fix regressions within the scope of these changes.
11. Rebuild and start the Docker deployment, confirm its health check passes, and verify the main journey at desktop width.
12. Report back with:
    - files changed;
    - features implemented;
    - assumptions used;
    - tests/build results;
    - screenshots of the revised journey; and
    - unresolved questions or blockers.

Do not redesign the platform architecture or connect unapproved production datasets as part of this mock refinement.

