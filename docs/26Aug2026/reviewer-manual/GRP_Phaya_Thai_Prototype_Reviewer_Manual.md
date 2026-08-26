# SERVIR GRP prototype reviewer manual

## Phaya Thai District example

**Prototype version:** 0.1.9-prototype  
**Live prototype:** http://18.139.74.142/  
**Local fallback:** http://localhost:8080  
**Audience:** Product, planning, data, method and platform reviewers  
**Recommended review time:** 20–30 minutes

## 1. Purpose of this manual

This manual guides a reviewer through the current first-phase evacuation-preparedness prototype using **Phaya Thai District, Bangkok** as the worked example.

The review should determine whether the prototype clearly helps a Planner:

1. compare five candidate locations;
2. understand nearby aggregated vulnerable-population zones and movement-support needs;
3. inspect illustrative shelter-proximity and population gaps;
4. build a preparedness investment brief; and
5. access the H/M/L risk map as supporting information.

The first phase intentionally does **not** contain analyst-validation status, approval states, candidate suitability scores or capacity decisions.

## 2. Important prototype boundaries

Before reviewing, keep these interpretation rules in mind:

- Phaya Thai District is a real administrative name.
- AOI boundaries, flood geometry, candidate locations, population values, vulnerability values, proximity results and risk points are illustrative.
- Candidate locations are not confirmed safe, suitable, approved or operational.
- Suitability and capacity are not assessed in this first phase.
- Vulnerable-population zones are aggregated and do not represent individual people or households.
- Vulnerability categories may overlap and must not be summed.
- Straight-line proximity is not walking distance, travel time or a safe route.
- “Within a threshold” does not mean people are served because capacity and accessibility are not included.
- RP20, RP50 and RP100 are static planning scenarios—not forecasts or current warnings.
- Low/green risk does not mean safe.

Do not enter personal information, operationally sensitive records or confidential facility information into the HTTP prototype.

## 3. Open the prototype

1. Open http://18.139.74.142/ in a current desktop version of Chrome, Edge or Firefox.
2. If the previous interface appears, use `Ctrl+F5` to hard-refresh.
3. Confirm the header says **Evacuation preparedness planning**.
4. Confirm the starting actions include **Build preparedness investment case** and **Review preparedness**.
5. Use the **+** button beside the assessment title to reset the demonstration at any time.

For local review:

```bash
cd prototype
python -m http.server 8080
```

Open http://localhost:8080.

## 4. Screen orientation

### Left panel — planning assistant

The assistant records the selected purpose, AOI and scenario and explains the current result. Reviewers can also ask questions in natural language.

### Right panel — map workspace

The map workspace contains:

- AOI selector;
- static RP scenario information;
- illustrative flood extent;
- candidate-location markers C1–C5;
- vulnerable-population zones V1–V4;
- result panel with candidate and vulnerable-people views;
- supporting risk-map view; and
- evidence/download controls.

### Hide and restore information

Select **×** on the planning-information panel to expand the map. Select **Show planning information** to restore the same active view. The candidate or vulnerable-people tab should remain selected.

## 5. Recommended Phaya Thai review path

### Step 1 — frame the purpose

Select **Review preparedness**.

Expected response:

- the assistant confirms the preparedness focus;
- the AOI selector opens; and
- no `undefined` text appears.

**Reviewer questions**

- Are the starting choices understandable?
- Is “Review preparedness” the right neutral entry point?
- Does the first-phase scope appear early enough?

### Step 2 — select Phaya Thai District

Select **Phaya Thai District, Bangkok**.

Expected result:

- AOI level: District;
- real-name/mock-data warning remains visible;
- RP100 is selected by default; and
- the assistant asks the reviewer to confirm the static flood scenario.

**Reviewer questions**

- Is the distinction between real AOI name and mocked geometry clear?
- Is “district or sub-district” the preferred terminology?
- What authoritative AOI identifier and boundary source should production use?

### Step 3 — understand RP100

Keep **RP100** and select **Confirm scenario & run assessment**.

RP100 means a 100-year return-period flood scenario with a 1% annual exceedance probability. It does not mean the event occurs exactly once every 100 years.

Expected RP100 demonstration values:

| Indicator | Illustrative value |
|---|---:|
| People within displayed flood extent | 18,640 |
| Candidate locations | 5 |
| Vulnerable-population zones | 4 |
| Vulnerability indicators | 4 |

**Reviewer questions**

- Is the RP100/1% AEP explanation understandable?
- Should the interface say “1% chance of being exceeded in any year” more prominently?
- Which approved return-period products and versions should production use?

### Step 4 — review five candidate locations

Open **Where could people move?**.

The current candidate-location relationships are:

| Candidate | Nearby illustrative zone | Movement-planning focus |
|---|---|---|
| C1 Candidate Stadium A | V1 child-support concentration | Family coordination, child-friendly transport and reunification |
| C2 Candidate School B | V2 older-people concentration | Mobility assistance, medication continuity and accessible transport |
| C3 Community Hall C | V3 disability-support concentration | Accessible vehicles, communication support and assistance teams |
| C4 Government Facility D | V4 low-mobility concentration | Pickup points, assisted movement and transport coordination |
| C5 Open Assembly Area E | V1 + V4 mixed focus | Family movement, staging and low-mobility transport |

Select C1 and inspect the drawer.

Expected content:

- candidate ID and illustrative facility type;
- nearby aggregated vulnerable zone;
- movement-planning focus;
- no individual/household locations; and
- suitability, capacity and official status explicitly outside this first phase.

**Reviewer questions**

- Does each candidate provide enough first-phase information?
- Is the relationship between candidate location and vulnerable group clear?
- Is any wording still incorrectly suggesting safety, capacity or approval?
- What additional movement-planning field should be introduced next?

### Step 5 — review the vulnerable-people map

Close the candidate drawer and select **Vulnerable people**.

Expected map behaviour:

- four purple hatched aggregated zones V1–V4 appear;
- candidate markers remain visible but secondary;
- the legend explains the vulnerable-population layer;
- the flood layer remains supporting context; and
- no individual or household point is shown.

Select a purple zone to inspect its information. Use **×** on the planning panel to expand the map, then use **Show planning information** to return.

**Reviewer questions**

- Are V1–V4 visible and understandable without relying only on colour?
- Is the aggregation/privacy warning clear?
- Are four zones sufficient for the discussion?
- What spatial aggregation level should production use?

### Step 6 — review the vulnerability bar chart

In the Vulnerable people view, review the horizontal bar chart.

Expected RP100 values:

| Indicator | Illustrative value | Unit |
|---|---:|---|
| Children aged 0–14 | 3,920 | People estimate |
| Older people aged 65+ | 2,760 | People estimate |
| Disability-related support needs | 930 | People estimate |
| Low-mobility households | 1,480 | Household estimate |

The chart labels every bar and does not rely on colour alone. It states that categories may overlap and that the low-mobility measure uses a different unit.

Change to RP20 and RP50 if time permits. The chart and cards should update consistently.

**Reviewer questions**

- Are the labels and units clear?
- Should households and people appear in one chart or separate charts?
- Which vulnerability indicators and definitions are approved?
- What privacy and minimum-aggregation rules are required?

### Step 7 — review shelter proximity and population gaps

Select **Shelter proximity and population gaps** below the vulnerability indicators.

Expected default headline:

> 11,240 people are farther than 1 km from a candidate shelter.

Expected RP100 distance bands:

| Distance to nearest candidate shelter | People | Percentage |
|---|---:|---:|
| Within 500 m | 1,980 | 10.6% |
| 500 m–1 km | 5,420 | 29.1% |
| 1–2 km | 7,090 | 38.0% |
| More than 2 km | 4,150 | 22.3% |

Test each threshold:

| Selected threshold | People beyond threshold | Priority areas |
|---|---:|---:|
| 500 m | 16,660 | 4 |
| 1 km | 11,240 | 3 |
| 2 km | 4,150 | 1 |

The interface must state that the threshold is a planning assumption, not an official universal standard.

**Reviewer questions**

- Is people beyond the threshold the correct headline?
- Which threshold is meaningful in Thailand and in what context?
- Should production use straight-line distance, network distance or travel time?
- Should the next increment add population cells and proximity radii to the map?

### Step 8 — build the preparedness investment brief

Close the proximity drawer and select **Investment brief**.

Expected title:

> Build the case for preparedness investment

Expected supporting text:

> Turn population, vulnerability and shelter-proximity gaps into strategic guidance for funding discussions.

Confirm the purpose is **Preparedness investment planning** and review the eight sections:

1. Executive summary;
2. Planning problem and supporting evidence;
3. Population and vulnerability context;
4. Shelter-proximity gaps;
5. Priority preparedness actions;
6. Indicative investment options;
7. Evidence and limitations; and
8. Supporting map appendix.

Select **Generate editable investment brief**. The browser should download:

`Phaya_Thai_District_RP100_Preparedness_Investment_Brief.doc`

The brief supports an investment discussion. It is not an automated funding decision, cost estimate or formal approval.

**Reviewer questions**

- Are the section names suitable for funding discussions?
- Which standard template and investment categories should be used?
- What costing, ownership and prioritisation fields belong in the next phase?
- Is the boundary between strategic guidance and formal funding approval clear?

### Step 9 — inspect the supporting H/M/L risk map

Select **Risk map** or **View risk map**.

Expected behaviour:

- H/red, M/yellow and L/green use both colour and letter labels;
- the map is presented as further information; and
- low/green explicitly does not mean safe.

Available prototype downloads include SVG, GeoJSON and JSON evidence. PNG and GeoTIFF remain future production-renderer outputs.

**Reviewer questions**

- Is the risk map correctly secondary to candidate and vulnerable-people views?
- Are the H/M/L semantics clear?
- What approved method, thresholds and provenance should production use?

### Step 10 — inspect upload guidance

Select **Upload**.

Expected guidance:

**Raster**

- `.tif` and `.tiff` GeoTIFF, preferably with CRS and georeferencing.

**Vector**

- zipped Shapefile containing `.shp`, `.shx`, `.dbf` and preferably `.prj`;
- `.geojson`;
- `.kml`;
- `.kmz`; and
- zipped `.gdb` File Geodatabase directory.

The prototype only simulates ingestion and schema checks.

**Reviewer questions**

- Which formats must Release 1 genuinely process?
- What schemas, CRS rules, size limits and required attributes apply?
- What provenance, source, licence and date must users provide?

## 6. Natural-language review tests

After running the Phaya Thai assessment, test:

- “Where could people move?”
- “Where are vulnerable people?”
- “Show children and older people.”
- “Show the shelter-proximity gaps.”
- “Build a preparedness investment brief.”
- “Show the risk map.”
- “Which candidate shelter is safe?”

Expected safe-place response: the assistant must not certify any candidate as safe, suitable or approved.

## 7. Reviewer comment method

When reviewing through Google Slides, Google Docs or an issue tracker, use these prefixes:

- **[UX]** workflow, labels, comprehension or accessibility;
- **[DATA]** source, identifier, vintage, licence or coverage;
- **[METHOD]** scenario, aggregation, proximity or classification method;
- **[PRIVACY]** vulnerable-population protection and aggregation;
- **[INVESTMENT]** strategic guidance, action or funding category;
- **[PLATFORM]** runtime, integration, deployment or shared service;
- **[DECISION]** explicit choice required;
- **[QUESTION]** clarification required.

A useful comment includes:

1. prototype step or screen;
2. expected behaviour;
3. observed behaviour;
4. recommended change;
5. Release 1 impact;
6. proposed owner or source, if known.

Example:

> [METHOD] Shelter proximity: 1 km is currently a selectable planning assumption. Please identify the policy or study supporting the production threshold and whether urban/rural thresholds should differ. Release 1 blocker: yes. Proposed owner: method lead.

## 8. Reviewer completion checklist

- [ ] I opened the current prototype and confirmed the first-phase label.
- [ ] I selected Phaya Thai District.
- [ ] I ran RP100 and understood 1% AEP.
- [ ] I reviewed all five candidate locations.
- [ ] I opened at least one candidate movement-information drawer.
- [ ] I reviewed V1–V4 on the vulnerable-people map.
- [ ] I reviewed the vulnerability bar chart and unit warning.
- [ ] I tested hide/show planning information.
- [ ] I tested 500 m, 1 km and 2 km proximity thresholds.
- [ ] I generated the preparedness investment brief.
- [ ] I opened the supporting H/M/L risk map.
- [ ] I reviewed upload-format guidance.
- [ ] I tested at least two natural-language questions.
- [ ] I recorded blockers, decisions, proposed owners and sources.

## 9. Known limitations

- Static frontend with no authentication or persistent database.
- Refreshing resets the session.
- No production AOI, hazard, population, vulnerability or shelter service is connected.
- No individual-level information is accepted or displayed.
- Candidate suitability, capacity and official status are not assessed.
- Proximity values are mocked and use a straight-line concept.
- No road routing, travel time, accessibility or route safety.
- No production costing or formal investment approval workflow.
- H/M/L methods are not approved for production.
- The live IP currently uses HTTP rather than an HTTPS domain.

## 10. Troubleshooting

### Old interface or wording appears

Use `Ctrl+F5`. If needed, clear site data and reopen the page.

### The information panel hides the map

Select **×** to expand the map. Select **Show planning information** to restore it.

### A download does not appear

Allow downloads for the site and check the browser Downloads folder.

### A result does not appear

Reset, select Review preparedness, choose Phaya Thai District, keep RP100 and run the assessment.

### Values disappear after changing scenario

Hard-refresh and confirm the prototype version is 0.1.9 or later.
