window.MVP1_MOCK = {
  meta: {
    baseline: "04 Sep 2026 v0.3",
    label: "Refinement prototype — illustrative data",
    warning: "This prototype validates workflow and language only. It does not prove identity, authorization, file validation, GIS calculations, persistence, exports or recovery."
  },
  roles: {
    planner: { name: "Mali Srisuk", organization: "Thailand NDMO", hub: "Thailand Planning", role: "Planner", initials: "MS" },
    support: { name: "Arun Support", organization: "SERVIR Platform Operations", hub: "Thailand Planning · support-approved", role: "Platform Support", initials: "AS" },
    developer: { name: "Kwan Developer", organization: "ADPC / SERVIR", hub: "Thailand Planning · development", role: "Hub Developer", initials: "KD" },
    unauthorized: { name: "Demo User", organization: "Unassigned organization", hub: "No workspace assignment", role: "No assigned role", initials: "DU" }
  },
  sources: {
    boundary: { id: "BND-TH-BKK-PHAYATHAI", title: "Thailand administrative boundary", provider: "TBC", edition: "TBC", status: "Needs decision" },
    hazard: { id: "JRC-FLOOD-RP100-TBC", title: "JRC RP100 flood-hazard layer", provider: "European Commission Joint Research Centre", edition: "TBC", status: "Illustrative" },
    centers: { id: "DST-TH-CENTER-0007", title: "Phaya Thai evacuation-center register", provider: "Bangkok Metropolitan Administration", dataDate: "15 Aug 2026", savedAt: "4 Sep 2026, 10:42 ICT", origin: "Saved local", status: "Available" },
    vulnerability: { id: "DST-TH-VULN-PLATFORM-01", title: "Normalized vulnerability raster", provider: "TBC", metric: "Normalized vulnerability index", unit: "Index, 0–1", status: "Needs decision" }
  },
  scenarios: [
    { value: "10", annual: "About 10%", description: "More frequent", counts: [2,10,2] },
    { value: "20", annual: "About 5%", description: "", counts: [3,9,2] },
    { value: "50", annual: "About 2%", description: "", counts: [4,8,2] },
    { value: "75", annual: "About 1.33%", description: "", counts: [4,8,2] },
    { value: "100", annual: "About 1%", description: "", counts: [5,7,2] },
    { value: "200", annual: "About 0.5%", description: "", counts: [6,6,2] },
    { value: "500", annual: "About 0.2%", description: "Less frequent, more extreme", counts: [8,4,2] }
  ],
  assessment: {
    id: "ASM-TH-20260904-001",
    traceId: "TRC-6E31A04F",
    status: "Completed with warnings",
    area: "Phaya Thai District, Bangkok",
    startedAt: "4 Sep 2026, 11:04:38 ICT",
    completedAt: "4 Sep 2026, 11:05:04 ICT",
    methods: { exposure: "EXPOSURE-METHOD-TBC", vulnerability: "VULNERABILITY-METHOD-TBC", contract: "GRP-MVP1-RESULT-v1" }
  },
  centers: [
    { id:"CTR-001", name:"Phaya Thai Community Hall", status:"exposed", reason:"Geometry intersects the selected flood exposure area.", x:36, y:36 },
    { id:"CTR-002", name:"District Sports Center", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:65, y:31 },
    { id:"CTR-003", name:"Community School 3", status:"unable", reason:"Coordinates are missing.", x:null, y:null },
    { id:"CTR-004", name:"Public Facility 4", status:"unable", reason:"Geometry is invalid.", x:null, y:null },
    { id:"CTR-005", name:"Community Center 5", status:"exposed", reason:"Geometry intersects the selected flood exposure area.", x:48, y:52 },
    { id:"CTR-006", name:"District School 6", status:"exposed", reason:"Geometry intersects the selected flood exposure area.", x:57, y:43 },
    { id:"CTR-007", name:"Municipal Building 7", status:"exposed", reason:"Geometry intersects the selected flood exposure area.", x:43, y:65 },
    { id:"CTR-008", name:"Sports Ground 8", status:"exposed", reason:"Geometry intersects the selected flood exposure area.", x:67, y:59 },
    { id:"CTR-009", name:"Community Hall 9", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:75, y:69 },
    { id:"CTR-010", name:"Public School 10", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:77, y:42 },
    { id:"CTR-011", name:"Temple Grounds 11", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:24, y:61 },
    { id:"CTR-012", name:"Municipal Hall 12", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:27, y:27 },
    { id:"CTR-013", name:"Community Center 13", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:83, y:22 },
    { id:"CTR-014", name:"District Facility 14", status:"clear", reason:"Valid geometry does not intersect the selected flood exposure area.", x:84, y:78 }
  ],
  mcpCapabilities: [
    { need:"Capability discovery", owner:"SIG MCP", position:"Available pattern", state:"available" },
    { need:"Evidence retrieval and packs", owner:"SIG MCP", position:"Available pattern; inspect live capabilities", state:"available" },
    { need:"Groundedness verification", owner:"SIG MCP", position:"Available pattern", state:"available" },
    { need:"Durable evidence receipts", owner:"SIG MCP", position:"Available pattern; privacy TBC", state:"decision" },
    { need:"OIDC and Hub authorization", owner:"Hub backend", position:"Not provided by shared MCP token", state:"hub" },
    { need:"JRC RP10–RP500 layers", owner:"Joint / TBC", position:"Not confirmed in current catalogue", state:"gap" },
    { need:"Thailand data sources", owner:"Joint / TBC", position:"Boundaries, centers and vulnerability not confirmed", state:"gap" },
    { need:"Deterministic GIS analytics", owner:"Joint / TBC", position:"compute_run declared but not implemented", state:"gap" },
    { need:"Local Hub contribution", owner:"Joint / TBC", position:"contribute_submit declared but not implemented", state:"gap" },
    { need:"Private PDF and map exports", owner:"Hub backend", position:"Normal application API/service", state:"hub" }
  ],
  evidencePack: {
    id:"PACK-ILLUSTRATIVE-001", reportId:"REPORT-ILLUSTRATIVE-001", receiptId:"RECEIPT-ILLUSTRATIVE-001",
    question:"Which evacuation centers may be exposed under JRC RP100, and what limitations should a planner consider?",
    gaps:["Center capacity","Building condition","Route viability","Accessibility","Official approval","Current flood conditions"]
  },
  vulnerabilityBands: [
    { label:"0.00–0.20", value:12 }, { label:"0.21–0.40", value:24 }, { label:"0.41–0.60", value:31 },
    { label:"0.61–0.80", value:22 }, { label:"0.81–1.00", value:11 }
  ],
  stories: {
    "US-01": { title:"Sign in to the authorized Hub workspace", screens:"Sign in; access not authorized", decisions:"R-01", criteria:["Approved user enters the correct workspace","Unassigned user receives a non-revealing denial","Sign-out and expired/revoked access are represented","Tokens do not appear in URLs or errors","Shared identity contract remains a technical requirement"] },
    "US-02": { title:"Use only authorized Hub data and functions", screens:"Access denial; protected workspace", decisions:"R-01, R-08", criteria:["Protected actions show server authorization requirement","Identifier tampering exposes no private metadata","Route classification is visible for review","Public output boundary remains TBC","Denial does not confirm resource existence"] },
    "US-03": { title:"Upload and check a local dataset", screens:"Upload; validation result", decisions:"R-07", criteria:["Formats, size and fields appear before selection","CRS, extent, schema and geometry checks are represented","Blocking errors prevent save","Validation summary includes provenance","No automatic repair or invented data"] },
    "US-04": { title:"Save one current local dataset", screens:"Save; replace confirmation", decisions:"R-08, R-12", criteria:["Save is linked to the current Hub","Later-session persistence is represented","Stable dataset ID and metadata are visible","Failed replacement preserves current item","No history or rollback is implied","Missing stored file becomes unavailable"] },
    "US-05": { title:"See platform and saved local choices", screens:"Data sources; configure", decisions:"R-03, R-04, R-05", criteria:["Platform and saved local groups are separate","Every choice has a source label","Unavailable choices cannot be selected","Other-Hub metadata is absent","No merging or silent substitution"] },
    "US-06": { title:"Choose area, flood scenario and data", screens:"Configure; confirm", decisions:"R-02, R-03", criteria:["Supported area and boundary source are shown","All seven JRC return periods are selectable","Static-scenario warning is visible","Origin and provenance appear for each input","Exact choices must be confirmed before run"] },
    "US-07": { title:"Identify centers that may be exposed", screens:"Processing; results; failure", decisions:"R-03, R-04, R-09", criteria:["Assessment and trace IDs are represented","Every center has exactly one required status","Unable-to-assess records remain in the list","Determinism requires real implementation evidence","Golden counts require data-science approval","Web/REST/MCP parity requires implementation","Failure never appears as a successful zero"] },
    "US-08": { title:"Show vulnerable-people information", screens:"Results; partial-result warning", decisions:"R-05, R-06", criteria:["Selected vulnerability source and ID are shown","Map overlay and legend are represented","Chart metric and units are explicit","Index is never called a population count","Missing coverage becomes unavailable, not zero","Partial-result policy remains a decision"] },
    "US-09": { title:"Review summary, chart, map and center list", screens:"Assessment results", decisions:"R-05, R-09", criteria:["Summary contains required counts","Counts reconcile to the in-scope total","Chart uses index units","Map contains required layers","Invalid geometry remains in the list","Map/list selection is synchronized","Status does not rely on color alone"] },
    "US-10": { title:"Understand each result, source and limitation", screens:"Center detail; evidence", decisions:"R-03–R-06", criteria:["Center status has a plain-language reason","Not exposed is never labelled Safe","All input sources are named","Methods, units and warnings are shown","Suitability exclusions are explicit","Missing provenance is marked Unverified"] },
    "US-11": { title:"Download summary and evacuation map", screens:"Download options; previews", decisions:"R-10", criteria:["Summary content is represented","Map content and legends are represented","Outputs use the canonical mock result","No center is labelled Safe","Failed/incomplete result cannot look complete","Private data boundary is stated","Print readability needs physical review"] },
    "US-12": { title:"Investigate an assessment using its support reference", screens:"Support lookup; timeline; health", decisions:"R-12", criteria:["Assessment and trace IDs are searchable","Correlation timeline spans the workflow","Failure categories are distinct","Secrets and raw data are excluded","Planner cannot edit accountability events","Lean health signals are represented","Restore evidence requires a real exercise"] }
  }
};
