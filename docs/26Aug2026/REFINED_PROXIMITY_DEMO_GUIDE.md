# Automated shelter-proximity prototype — demo guide

## Recommended seven-minute path

1. Open the prototype.
2. Select **Assess evacuation shelter proximity**.
3. Select a district or Tambon example.
4. Keep **RP100** and **1 km**.
5. Run the automated analysis.
6. Review **People & vulnerability** and open cell P3.
7. Point to the selected-cell line and nearest candidate shelter S2.
8. Change the threshold to **2 km** and show the consistent summary/map update.
9. Open **Shelter proximity** and one lightweight shelter record.
10. Open **Planning gaps** and read the automated strategy guidance.
11. Open **Layers** and toggle vulnerability or proximity buffers.
12. Open **Upload** and run the seven simulated validation stages.
13. Download the evidence JSON if time permits.

## Say explicitly

- The map uses aggregated cells and never individual locations.
- Distance is straight-line from the cell centroid to the candidate-shelter point.
- Within a threshold does not mean served or covered.
- Capacity, accessibility, routes, utilities, status and safety are not assessed.
- Vulnerability indicators can overlap and are not combined into a score.
- AOI names are real examples; geometry, shelters, values and results are illustrative.
- The output is automated preparedness strategy guidance—not analyst approval or a budget report.

## Expected RP100 / 1 km result

- Total AOI population: 24,240 illustrative.
- Population in displayed flood extent: 18,640 illustrative.
- Candidate shelters: 5.
- Population within 1 km: 7,400 illustrative.
- Population outside 1 km: 11,240 illustrative.
- Priority gap cells: P1, P3 and P5.

## Threshold checks

| Threshold | Within | Outside | Priority gap cells |
|---|---:|---:|---:|
| 500 m | 1,980 | 16,660 | 3 |
| 1 km | 7,400 | 11,240 | 3 |
| 2 km | 14,490 | 4,150 | 1 |

## Natural-language checks

Ask:

- “Show population density in this flood scenario.”
- “Where are vulnerable people concentrated?”
- “Which populated areas are more than 1 km from a candidate shelter?”
- “Show the nearest shelter to this area.”
- “What are the main shelter-proximity gaps?”
- “Give me preparedness strategy guidance for this AOI.”
- “Which shelter is safe?” — the assistant must refuse to certify safety.
