const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const messages=$('#messages'), mapCanvas=$('#mapCanvas'), aoiMenu=$('#aoiMenu');
const detailDrawer=$('#detailDrawer'), backdrop=$('#backdrop');
let purpose='proximity', selectedAOI=null, selectedScenario='100', threshold=1000;
let assessmentComplete=false, uploadReady=false;

const AOIS={
  'phaya-thai':{name:'Phaya Thai District, Bangkok',short:'Phaya Thai District',level:'District',map:'PHAYA THAI',id:'TH-BKK-PHAYA-THAI'},
  'warin-chamrap':{name:'Warin Chamrap District, Ubon Ratchathani',short:'Warin Chamrap District',level:'District',map:'WARIN CHAMRAP',id:'TH-UBN-WARIN-CHAMRAP'},
  'kham-nam-saep':{name:'Tambon Kham Nam Saep, Warin Chamrap District, Ubon Ratchathani',short:'Tambon Kham Nam Saep',level:'Tambon',map:'KHAM NAM SAEP',id:'TH-UBN-KHAM-NAM-SAEP'}
};
const SCENARIOS={
  '20':{people:8420,aep:'5% AEP',chance:'5% annual exceedance probability'},
  '50':{people:12760,aep:'2% AEP',chance:'2% annual exceedance probability'},
  '100':{people:18640,aep:'1% AEP',chance:'1% annual exceedance probability'}
};
const SHELTERS={
  S1:{name:'Candidate Shelter A',x:545,y:350,coordinates:'Illustrative 13.781, 100.541',source:'Illustrative candidate-shelter register'},
  S2:{name:'Candidate Shelter B',x:690,y:390,coordinates:'Illustrative 13.776, 100.557',source:'Illustrative candidate-shelter register'},
  S3:{name:'Candidate Shelter C',x:500,y:475,coordinates:'Illustrative 13.768, 100.536',source:'Illustrative candidate-shelter register'},
  S4:{name:'Candidate Shelter D',x:655,y:520,coordinates:'Illustrative 13.763, 100.552',source:'Illustrative candidate-shelter register'},
  S5:{name:'Candidate Shelter E',x:750,y:470,coordinates:'Illustrative 13.769, 100.563',source:'Illustrative candidate-shelter register'}
};
const CELLS=[
  {id:'C1',label:'Population cell P1',base:3820,density:18600,v:{children:640,older:520,support:150,mobility:118},flood:true,nearest:'S1',distance:1380,x:465,y:365,highV:true},
  {id:'C2',label:'Population cell P2',base:2760,density:12400,v:{children:470,older:390,support:92,mobility:76},flood:true,nearest:'S1',distance:620,x:572,y:365,highV:false},
  {id:'C3',label:'Population cell P3',base:4150,density:20100,v:{children:720,older:610,support:171,mobility:142},flood:true,nearest:'S2',distance:2140,x:667,y:375,highV:true},
  {id:'C4',label:'Population cell P4',base:1980,density:9200,v:{children:310,older:280,support:61,mobility:54},flood:false,nearest:'S3',distance:430,x:485,y:450,highV:false},
  {id:'C5',label:'Population cell P5',base:3270,density:16900,v:{children:560,older:490,support:137,mobility:109},flood:true,nearest:'S4',distance:1740,x:577,y:450,highV:true},
  {id:'C6',label:'Population cell P6',base:2660,density:11800,v:{children:450,older:370,support:87,mobility:73},flood:true,nearest:'S4',distance:890,x:660,y:462,highV:false}
];

const fmt=n=>Math.round(n).toLocaleString('en-US');
const aoi=()=>selectedAOI?AOIS[selectedAOI]:null;
const thresholdText=()=>threshold===500?'500 m':threshold===1000?'1 km':'2 km';
const scale=()=>SCENARIOS[selectedScenario].people/18640;
function pop(c){
  const index=CELLS.indexOf(c), target=SCENARIOS[selectedScenario].people;
  if(index<CELLS.length-1)return Math.round(c.base*scale());
  return target-CELLS.slice(0,-1).reduce((sum,cell)=>sum+Math.round(cell.base*scale()),0);
}
const status=c=>c.distance<=threshold?'within':(c.highV||c.density>=16000?'priority':'gap');
const safeName=s=>(s||'Thailand_AOI').replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'');

function showToast(text){$('#toastText').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2400)}
function scrollChat(){messages.scrollTop=messages.scrollHeight}
function userMessage(text){const e=document.createElement('div');e.className='message user';e.innerHTML=`<div class="bubble"><p>${text}</p></div>`;messages.appendChild(e);scrollChat()}
function aiMessage(html){const e=document.createElement('div');e.className='message assistant';e.innerHTML=`<div class="avatar">AI</div><div class="bubble">${html}</div>`;messages.appendChild(e);scrollChat();return e}
function openAOI(){aoiMenu.classList.add('open')}
function closeAOI(){aoiMenu.classList.remove('open')}
function openModal(id){$('#'+id).classList.add('open')}
function closeModals(){$$('.modal').forEach(m=>m.classList.remove('open'))}
function openDrawer(){detailDrawer.classList.add('open');detailDrawer.setAttribute('aria-hidden','false');backdrop.classList.add('open')}
function closeDrawer(){detailDrawer.classList.remove('open');detailDrawer.setAttribute('aria-hidden','true');backdrop.classList.remove('open');$('#nearestLine').classList.remove('visible')}
function switchTab(name){$$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));$$('[data-tab-content]').forEach(c=>c.classList.toggle('active',c.dataset.tabContent===name))}

function choosePurpose(value){
  purpose=value;
  const labels={proximity:'Assess evacuation shelter proximity',people:'Explore people and vulnerability',shelters:'Explore candidate shelters',upload:'Upload local geospatial data',urban:'Download building footprints'};
  userMessage(labels[value]);
  if(value==='upload'){openModal('uploadModal');aiMessage('<p>The upload view lists common raster and vector formats and simulates format, CRS, attribute and provenance checks before a layer is applied.</p>');return}
  aiMessage(`<p>I’ll use the same governed spatial view for <b>${labels[value].toLowerCase()}</b>.</p><p>Select a Thailand district or Tambon. Administrative names are real examples; all displayed geometry and values remain illustrative.</p><button class="inline-action" data-action="select-aoi">Select district or Tambon</button>`);
  openAOI();
}

function selectAOI(id){
  selectedAOI=id;closeAOI();const x=aoi();
  $('#aoiLabel').innerHTML=`${x.name} <small>${x.level}</small>`;$('#globalAOI').textContent=x.name;$('#selectedAOIMapLabel').textContent=x.map;
  $('#exportAOI').textContent=`${x.name} · ${x.level}`;mapCanvas.classList.add('aoi-selected');
  userMessage(`Use ${x.name} (${x.level}).`);
  if(purpose==='urban'){
    aiMessage(`<p><b>${x.name}</b> selected. The building export is a separate urban-planning input. Footprints and height do not establish shelter suitability or calculate risk.</p><button class="run-btn" data-action="building-download">Download illustrative building GeoJSON</button>`);return;
  }
  aiMessage(`<p><strong>AOI selected:</strong> ${x.name} · ${x.level}.</p><p>Choose a static return-period scenario and proximity threshold. Distances are simulated straight-line distances—not routes or travel time.</p><div class="config-card"><div class="config-row"><small>Purpose</small><b>Assess evacuation shelter proximity</b></div><div class="config-row"><small>Flood scenario</small><div class="scenario-options"><button data-scenario="20">RP20<small>5% AEP</small></button><button data-scenario="50">RP50<small>2% AEP</small></button><button data-scenario="100" class="active">RP100<small>1% AEP</small></button></div></div><div class="config-row"><small>Proximity threshold</small><div class="scenario-options threshold-options"><button data-threshold="500">500 m</button><button data-threshold="1000" class="active">1 km</button><button data-threshold="2000">2 km</button></div></div><div class="config-row"><small>Output</small><b>People & vulnerability · shelter proximity · planning gaps<br><small>Additional: evidence JSON and automated strategy guidance</small></b></div><button class="run-btn" data-action="run">Run automated proximity analysis</button></div>`);
  selectScenario('100');setThreshold(1000,false);
}

function selectScenario(year){
  selectedScenario=year;$$('[data-scenario]').forEach(b=>b.classList.toggle('active',b.dataset.scenario===year));
  mapCanvas.classList.remove('scenario-20','scenario-50','scenario-100');mapCanvas.classList.add(`scenario-${year}`);
  $('#globalScenario').textContent=`RP${year} · ${SCENARIOS[year].aep}`;$('#exportScenario').textContent=`RP${year} · ${SCENARIOS[year].aep}`;
  updateAnalysis();
}

function setThreshold(value,announce=true){
  threshold=Number(value);$$('[data-threshold]').forEach(b=>b.classList.toggle('active',Number(b.dataset.threshold)===threshold));
  $('#thresholdLabel').textContent=thresholdText();$('#exportThreshold').textContent=thresholdText();
  renderBuffers();updateAnalysis();
  if(announce&&assessmentComplete){userMessage(`Use a ${thresholdText()} shelter-proximity threshold.`);aiMessage(`<p>Updated the same analysis to <b>${thresholdText()}</b> using straight-line distance. The map and summary now distinguish cells inside and outside that threshold.</p><p>This is a proximity estimate only; shelter capacity, accessibility and routes are not considered.</p>`)}
}

function renderBuffers(){
  const radii={500:35,1000:70,2000:140};
  $('#bufferLayer').innerHTML=Object.entries(SHELTERS).map(([id,s])=>`<circle data-buffer="${id}" cx="${s.x}" cy="${s.y}" r="${radii[threshold]}"/>`).join('');
}

function runAssessment(){
  if(!selectedAOI){openAOI();return}
  userMessage(`Run RP${selectedScenario} proximity analysis at ${thresholdText()}.`);
  const box=aiMessage(`<p>Running deterministic mock checks for <b>${aoi().short}</b>.</p><div class="analysis-steps"><div class="step"><span>✓</span>Load AOI and RP${selectedScenario} flood extent</div><div class="step"><span>✓</span>Display aggregated population and vulnerability cells</div><div class="step"><span>✓</span>Find nearest candidate shelter by straight-line distance</div><div class="step"><span>✓</span>Classify cells against the ${thresholdText()} threshold</div><div class="step"><span>✓</span>Generate traceable strategy guidance</div></div>`);
  $$('.step',box).forEach((e,i)=>setTimeout(()=>e.classList.add('done'),180+i*180));
  setTimeout(()=>{
    assessmentComplete=true;mapCanvas.classList.add('results-visible');updateAnalysis();
    const totals=calculateTotals();
    aiMessage(`<div class="ai-summary"><p><strong>Automated proximity analysis ready.</strong><br><small>${aoi().name} · RP${selectedScenario} · ${thresholdText()} · straight-line distance</small></p><p>The displayed flood extent contains an illustrative <b>${fmt(SCENARIOS[selectedScenario].people)} people</b>. About <b>${fmt(totals.outside)}</b> are in cells outside the threshold, including <b>${totals.priority} high-priority gap cells</b>.</p><p>Open the three connected views: <b>People & vulnerability</b>, <b>Shelter proximity</b> and <b>Planning gaps</b>.</p><p>Candidate shelters are not assessed for safety, capacity, accessibility or route availability.</p></div>`);
  },1200);
}

function calculateTotals(){
  const within=CELLS.filter(c=>c.distance<=threshold).reduce((n,c)=>n+pop(c),0);
  const outside=SCENARIOS[selectedScenario].people-within;
  const priority=CELLS.filter(c=>status(c)==='priority').length;
  return{within,outside,priority};
}

function updateAnalysis(){
  const totals=calculateTotals(), t=thresholdText();
  $('#kpiFlood').textContent=fmt(SCENARIOS[selectedScenario].people);$('#kpiWithin').textContent=fmt(totals.within);$('#kpiOutside').textContent=fmt(totals.outside);$('#kpiGaps').textContent=totals.priority;
  $('#kpiWithin').nextElementSibling.textContent=`Within ${t}*`;$('#kpiOutside').nextElementSibling.textContent=`Outside ${t}*`;
  $('#panelScenario').textContent=`${aoi()?aoi().short.toUpperCase():'SELECT AOI'} · RP${selectedScenario} · ${t.toUpperCase()} · ILLUSTRATIVE`;
  CELLS.forEach(c=>{
    const g=$(`[data-cell="${c.id}"]`,$('#populationLayer'));if(!g)return;
    const st=status(c);g.classList.remove('within','gap','priority');g.classList.add(st);$('text',g).textContent=`P${c.id.slice(1)} ${st==='within'?'✓':st==='priority'?'★':'!'}`;
  });
  renderCellList();renderShelterList();renderGuidance();
}

function renderCellList(){
  $('#cellList').innerHTML=CELLS.map(c=>{const st=status(c),statusText=st==='within'?`Within ${thresholdText()}`:st==='priority'?`Priority gap · outside ${thresholdText()}`:`Outside ${thresholdText()}`;return `<button data-cell-open="${c.id}" class="cell-row ${st}"><i>${st==='within'?'✓':st==='priority'?'★':'!'}</i><p><b>${c.label}</b><small>${fmt(pop(c))} people · ${fmt(c.density)}/km² · nearest ${c.nearest} ${c.distance.toLocaleString()} m</small></p><em>${statusText}</em></button>`}).join('');
}

function renderShelterList(){
  $('#shelterList').innerHTML=Object.entries(SHELTERS).map(([id,s])=>{const nearby=CELLS.filter(c=>c.nearest===id&&c.distance<=threshold).reduce((n,c)=>n+pop(c),0);return `<button data-shelter-open="${id}" class="shelter-row"><i>⌂</i><p><b>${id} · ${s.name}</b><small>${fmt(nearby)} nearby people within ${thresholdText()} · estimate only</small></p><em>View ›</em></button>`}).join('');
}

function renderGuidance(){
  const gaps=CELLS.filter(c=>status(c)==='priority').sort((a,b)=>b.distance-a.distance), totals=calculateTotals();
  const top=gaps[0];
  $('#guidanceList').innerHTML=`<div class="guidance-card"><span>01</span><p><b>Prioritise ${gaps.map(c=>'P'+c.id.slice(1)).join(', ')||'no cells at this threshold'}</b><small>${gaps.length?`${gaps.length} high-density or high-vulnerability cells are outside ${thresholdText()}.`:`All displayed cells are within ${thresholdText()}, but capacity and route checks are still missing.`}</small></p></div><div class="guidance-card"><span>02</span><p><b>Investigate additional shelter options</b><small>${top?`Start near ${top.label}, which is ${top.distance.toLocaleString()} m straight-line from ${top.nearest}.`:'No threshold gap is displayed at this setting.'} Do not infer shelter suitability.</small></p></div><div class="guidance-card"><span>03</span><p><b>Plan for vulnerable-population concentrations</b><small>Review children, older people, disability-related support needs and low-mobility households separately; indicators can overlap.</small></p></div><div class="guidance-card warning"><span>!</span><p><b>Close the evidence gaps before operational use</b><small>Missing: verified capacity, accessibility, routes, operating status, approved population source and authoritative shelter status.</small></p></div><p class="micro">Automated from displayed mock cells · RP${selectedScenario} · ${thresholdText()} · ${fmt(totals.outside)} people outside threshold · straight-line method.</p>`;
}

function openCell(id){
  const c=CELLS.find(x=>x.id===id), s=SHELTERS[c.nearest], st=status(c);if(!c)return;
  $('#drawerEyebrow').textContent=`${c.id} · AGGREGATED CELL · RP${selectedScenario} · ILLUSTRATIVE`;$('#drawerTitle').textContent=c.label;
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>${fmt(pop(c))} people</strong><span>${fmt(c.density)} people/km² · illustrative density</span><span class="status-badge ${st==='within'?'badge-within':'badge-gap'}">${st==='within'?`WITHIN ${thresholdText()}`:`OUTSIDE ${thresholdText()} · ${st==='priority'?'PRIORITY GAP':'GAP'}`}</span></div><div class="detail-grid"><div class="detail-card"><b>${c.flood?'Yes':'No'}</b><small>Intersects displayed flood extent</small></div><div class="detail-card"><b>${c.nearest}</b><small>Nearest candidate shelter</small></div><div class="detail-card"><b>${c.distance.toLocaleString()} m</b><small>Straight-line distance</small></div><div class="detail-card"><b>${thresholdText()}</b><small>Selected threshold</small></div></div><h3>Available vulnerability indicators</h3><ul class="detail-list"><li>Children 0–14 <span>${fmt(c.v.children*scale())}</span></li><li>Older people 65+ <span>${fmt(c.v.older*scale())}</span></li><li>Disability-related support needs <span>${fmt(c.v.support*scale())}</span></li><li>Low-mobility households <span>${fmt(c.v.mobility*scale())}</span></li></ul><div class="ai-note"><b>Interpretation:</b> Indicators are aggregated, illustrative and may overlap. ${st==='within'?`The centroid is within ${thresholdText()} of ${c.nearest}, but this does not mean people are served.`:`The centroid is outside ${thresholdText()} from its nearest candidate shelter. This is a proximity gap—not a capacity or route finding.`}</div><h3>Nearest candidate shelter</h3><ul class="detail-list"><li>${c.nearest} <span>${s.name}</span></li><li>Capacity/accessibility/routes <span>Not assessed in this slice</span></li><li>Official/suitability status <span>Not assessed</span></li></ul>`;
  const line=$('#nearestLine');line.setAttribute('x1',c.x);line.setAttribute('y1',c.y);line.setAttribute('x2',s.x);line.setAttribute('y2',s.y);line.classList.add('visible');openDrawer();
}

function openShelter(id){
  const s=SHELTERS[id], cells=CELLS.filter(c=>c.nearest===id), nearby=cells.filter(c=>c.distance<=threshold).reduce((n,c)=>n+pop(c),0);if(!s)return;
  $('#drawerEyebrow').textContent=`${id} · CANDIDATE SHELTER · ILLUSTRATIVE`;$('#drawerTitle').textContent=s.name;
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>${fmt(nearby)}</strong><span>nearby population within ${thresholdText()} · proximity estimate</span><span class="status-badge badge-candidate">NOT AN OFFICIAL SHELTER ASSESSMENT</span></div><div class="detail-grid"><div class="detail-card"><b>${id}</b><small>Candidate ID</small></div><div class="detail-card"><b>${thresholdText()}</b><small>Displayed proximity radius</small></div></div><h3>Lightweight candidate record</h3><ul class="detail-list"><li>Source <span>${s.source}</span></li><li>Source date <span>Unknown</span></li><li>Coordinates <span>${s.coordinates}</span></li><li>Nearest cells <span>${cells.map(c=>'P'+c.id.slice(1)).join(', ')||'None'}</span></li><li>Capacity <span>Not assessed in this slice</span></li><li>Access and utilities <span>Not assessed in this slice</span></li><li>Accessibility <span>Not assessed in this slice</span></li><li>Ownership/operating status <span>Not assessed in this slice</span></li><li>Official/suitability status <span>Not assessed</span></li></ul><div class="ai-note"><b>Limitation:</b> Nearby population is a straight-line proximity estimate. It must not be described as served or covered.</div>`;openDrawer();
}

function openEvidence(){
  const totals=calculateTotals();$('#drawerEyebrow').textContent='AUTOMATED CHECKS · TRACEABLE MOCK ANALYSIS';$('#drawerTitle').textContent='Inputs, findings and limitations';
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>Illustrative analysis</strong><span>${aoi()?aoi().name:'AOI not selected'} · RP${selectedScenario} · ${thresholdText()}</span></div><h3>Layers used</h3><ul class="detail-list"><li>AOI boundary <span>Real name · mocked geometry</span></li><li>Flood extent <span>RP${selectedScenario} · mocked geometry/model</span></li><li>Population density <span>6 aggregated illustrative cells</span></li><li>Vulnerability <span>4 separate indicators · may overlap</span></li><li>Candidate shelters <span>5 illustrative points</span></li></ul><h3>Automated findings</h3><ul class="detail-list"><li>Population in displayed flood extent <span>${fmt(SCENARIOS[selectedScenario].people)}</span></li><li>Within ${thresholdText()} <span>${fmt(totals.within)} · proximity only</span></li><li>Outside ${thresholdText()} <span>${fmt(totals.outside)}</span></li><li>Priority gap cells <span>${totals.priority}</span></li></ul><h3>Method and missing data</h3><ul class="detail-list"><li>Distance method <span>Straight-line centroid-to-point</span></li><li>Capacity considered <span>No</span></li><li>Routing/travel time considered <span>No</span></li><li>Accessibility considered <span>No</span></li><li>Approved source/version/licence <span>Not connected</span></li></ul><div class="ai-note"><b>Required next step:</b> confirm authoritative population, vulnerability and shelter sources; meaningful thresholds; distance method; and strategy-guidance rules before production use.</div>`;openDrawer();
}

function showGuidance(){if(!assessmentComplete){aiMessage('<p>Select an AOI and run the automated proximity analysis first.</p>');openAOI();return}switchTab('gaps');mapCanvas.classList.add('results-visible');userMessage('Give me preparedness strategy guidance for this AOI.');const t=calculateTotals();aiMessage(`<p><b>Preparedness guidance for ${aoi().short}</b> · RP${selectedScenario} · ${thresholdText()} · straight-line distance.</p><p>Prioritise the ${t.priority} high-density/high-vulnerability gap cells, investigate additional candidate options near the largest gaps, and verify population, shelter, capacity, accessibility and route data.</p><p>This is automated guidance from illustrative inputs—not an official shelter assessment.</p>`)}

function simulateUpload(name='demo_population_cells.geojson'){
  uploadReady=false;$('#applyUpload').disabled=true;$$('[data-check]').forEach(x=>x.classList.remove('passed'));
  const label=$('.upload-drop b');label.textContent=name;
  $$('[data-check]').forEach((x,i)=>setTimeout(()=>{x.classList.add('passed');$('span',x).textContent='✓';if(i===6){uploadReady=true;$('#applyUpload').disabled=false}},180+i*180));
}
function applyUpload(){if(!uploadReady)return;closeModals();userMessage('Apply the validated demonstration geospatial layer.');aiMessage('<p>The mock validation preview is complete and the simulated layer was applied as a versioned local overlay.</p><p><b>No production file was fully ingested or analysed.</b> Format, CRS, required attributes, validity and provenance must be enforced by production services.</p>');showToast('Simulated layer applied with provenance')}

function buildEvidence(){return{title:'SERVIR GRP evacuation shelter proximity mock evidence',generated_at:new Date().toISOString(),aoi:aoi(),scenario:`RP${selectedScenario}`,annual_exceedance_probability:SCENARIOS[selectedScenario].chance,configuration:{distance_method:'straight_line',proximity_threshold_m:threshold,capacity_considered:false,routing_considered:false,accessibility_considered:false,analysis_status:'illustrative'},summary:{total_aoi_population:24240,population_in_displayed_flood_extent:SCENARIOS[selectedScenario].people,...calculateTotals()},population_cells:CELLS.map(c=>({cell_id:c.id,population_estimate:pop(c),density_people_per_sq_km:c.density,vulnerability:{children_0_14:Math.round(c.v.children*scale()),older_people_65_plus:Math.round(c.v.older*scale()),disability_support_needs:Math.round(c.v.support*scale()),low_mobility_households:Math.round(c.v.mobility*scale())},intersects_flood_extent:c.flood,nearest_shelter_id:c.nearest,nearest_shelter_distance_m:c.distance,within_selected_threshold:c.distance<=threshold,gap_class:status(c),source_status:'illustrative'})),candidate_shelters:Object.entries(SHELTERS).map(([id,s])=>({shelter_id:id,name:s.name,source:s.source,source_date:'unknown',capacity:null,official_status:'not assessed',suitability_status:'not assessed',source_status:'illustrative'})),limitations:['Mock geometry and values','Straight-line distance only','Capacity, routes, accessibility and shelter status not assessed','Vulnerability indicators may overlap','Not for operational use']}}
function downloadEvidence(){if(!selectedAOI){openAOI();return}const blob=new Blob([JSON.stringify(buildEvidence(),null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${safeName(aoi().short)}_RP${selectedScenario}_${threshold}m_Proximity_Evidence_MOCK.json`;link.click();URL.revokeObjectURL(link.href);closeModals();showToast('Proximity evidence JSON downloaded')}
function downloadBuildings(){const x=aoi();if(!x){openAOI();return}const data={type:'FeatureCollection',name:`${safeName(x.short)}_Building_Footprints_MOCK`,metadata:{aoi:x.name,geometry_is_mock:true,illustrative:true,warning:'Screening input only; not evidence of shelter suitability'},features:[{type:'Feature',properties:{building_id:'BLD-001',height_m:12.5,floors:3,source:'illustrative',confidence:'demo'},geometry:{type:'Polygon',coordinates:[[[100.530,13.780],[100.531,13.780],[100.531,13.781],[100.530,13.781],[100.530,13.780]]]}},{type:'Feature',properties:{building_id:'BLD-002',height_m:null,floors:null,source:'illustrative',confidence:'missing'},geometry:{type:'Polygon',coordinates:[[[100.532,13.782],[100.533,13.782],[100.533,13.783],[100.532,13.783],[100.532,13.782]]]}}]};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/geo+json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${safeName(x.short)}_Building_Footprints_MOCK.geojson`;link.click();URL.revokeObjectURL(link.href);showToast('Illustrative building GeoJSON downloaded')}

function send(){
  const input=$('#chatInput'),text=input.value.trim();if(!text)return;input.value='';userMessage(text);const q=text.toLowerCase();
  setTimeout(()=>{
    if(q.includes('upload')||q.includes('own data')||q.includes('geotiff')||q.includes('shapefile'))openModal('uploadModal');
    else if(q.includes('population density')){if(assessmentComplete){switchTab('people');mapCanvas.classList.add('results-visible');aiMessage(`<p>Showing aggregated population-density cells for <b>${aoi().short}</b> · RP${selectedScenario}. Select P1–P6 for density, vulnerability, flood intersection and nearest shelter.</p>`)}else aiMessage('<p>Select an AOI and run the analysis first.</p>')}
    else if(q.includes('vulnerab')){if(assessmentComplete){switchTab('people');aiMessage(`<p>Vulnerability patterns are shown as hatched aggregated cells for <b>${aoi().short}</b> · RP${selectedScenario}. Indicators remain separate and may overlap.</p>`)}else aiMessage('<p>Select an AOI and run the analysis first.</p>')}
    else if(q.includes('more than')||q.includes('outside')||q.includes('gap')){if(assessmentComplete){switchTab('gaps');const t=calculateTotals();aiMessage(`<p>At <b>${thresholdText()}</b>, ${fmt(t.outside)} people are in displayed cells outside the threshold, with ${t.priority} priority gap cells. Distance is straight-line and does not include capacity or routes.</p>`)}else aiMessage('<p>Select an AOI and run the analysis first.</p>')}
    else if(q.includes('nearest shelter')){if(assessmentComplete){openCell('C3');aiMessage(`<p>Select a cell to show one line to its nearest candidate shelter. For example, P3 is ${CELLS[2].distance.toLocaleString()} m straight-line from S2.</p>`)}else aiMessage('<p>Run the analysis first, then select a population cell.</p>')}
    else if(q.includes('strategy')||q.includes('guidance')||q.includes('recommend'))showGuidance();
    else if(q.includes('safe')||q.includes('approved'))aiMessage('<p>The prototype cannot identify a safe or approved shelter. It shows candidate locations and straight-line proximity only; capacity, accessibility, route safety, operating status and authority approval are not assessed.</p>');
    else if(q.includes('shelter')){if(assessmentComplete){switchTab('shelters');aiMessage(`<p>Showing five illustrative candidate shelters and the ${thresholdText()} proximity estimate. “Within threshold” does not mean served or covered.</p>`)}else aiMessage('<p>Select an AOI and run the shelter-proximity analysis first.</p>')}
    else aiMessage('<p>Try asking about population density, vulnerable-population concentrations, areas outside 1 km, the nearest shelter, data uploads or preparedness strategy guidance.</p>');
  },250)
}

// Event wiring
document.addEventListener('click',e=>{
  const purposeBtn=e.target.closest('[data-purpose]');if(purposeBtn)return choosePurpose(purposeBtn.dataset.purpose);
  const aoiBtn=e.target.closest('[data-aoi]');if(aoiBtn)return selectAOI(aoiBtn.dataset.aoi);
  const scenarioBtn=e.target.closest('[data-scenario]');if(scenarioBtn)return selectScenario(scenarioBtn.dataset.scenario);
  const thresholdBtn=e.target.closest('[data-threshold]');if(thresholdBtn)return setThreshold(thresholdBtn.dataset.threshold);
  const tab=e.target.closest('[data-tab]');if(tab)return switchTab(tab.dataset.tab);
  const cell=e.target.closest('[data-cell-open]');if(cell)return openCell(cell.dataset.cellOpen);
  const mapCell=e.target.closest('.population-cell');if(mapCell)return openCell(mapCell.dataset.cell);
  const shelter=e.target.closest('[data-shelter-open]');if(shelter)return openShelter(shelter.dataset.shelterOpen);
  const mapShelter=e.target.closest('.shelter-marker');if(mapShelter)return openShelter(mapShelter.dataset.shelter);
  const open=e.target.closest('[data-open]');if(open){if(open.dataset.open==='evidence'||open.dataset.open==='summary')openEvidence();else if(open.dataset.open==='people')switchTab('people');return}
  const action=e.target.closest('[data-action]');if(action){({
    'select-aoi':openAOI,'run':runAssessment,'building-download':downloadBuildings
  }[action.dataset.action]||(()=>{}))();return}
  if(e.target.closest('[data-close-modal]'))closeModals();
});
$('#aoiSelector').addEventListener('click',()=>aoiMenu.classList.toggle('open'));
$('#aoiSearch').addEventListener('input',e=>$$('[data-aoi]').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase())));
$('#layersTool').addEventListener('click',()=>$('#layersMenu').classList.toggle('open'));
$$('[data-layer]').forEach(c=>c.addEventListener('change',()=>{mapCanvas.classList.toggle(`hide-${c.dataset.layer}`,!c.checked);$('#layerCount').textContent=$$('[data-layer]:checked').length}));
$('#uploadTool').addEventListener('click',()=>openModal('uploadModal'));$('#attachBtn').addEventListener('click',()=>openModal('uploadModal'));
$('#exportTool').addEventListener('click',()=>{if(!selectedAOI)return openAOI();openModal('exportModal')});
$('#downloadAnalysis').addEventListener('click',()=>{if(!selectedAOI)return openAOI();openModal('exportModal')});$('#confirmExport').addEventListener('click',downloadEvidence);
$('#openGuidance').addEventListener('click',showGuidance);$('#questionTool').addEventListener('click',()=>{$('#chatInput').value='What are the main shelter-proximity gaps?';$('#chatInput').focus()});
$('#demoFile').addEventListener('click',()=>simulateUpload());$('#geoFile').addEventListener('change',e=>{if(e.target.files[0])simulateUpload(e.target.files[0].name)});$('#applyUpload').addEventListener('click',applyUpload);
$('#closeDrawer').addEventListener('click',closeDrawer);backdrop.addEventListener('click',closeDrawer);$('#closePanel').addEventListener('click',()=>mapCanvas.classList.remove('results-visible'));
$('#legendToggle').addEventListener('click',e=>{const l=e.target.closest('.legend');l.classList.toggle('collapsed');e.target.textContent=l.classList.contains('collapsed')?'+':'−'});
$('#sendBtn').addEventListener('click',send);$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
$('#newChat').addEventListener('click',()=>location.reload());
$('#helpBtn').addEventListener('click',()=>{ $('#drawerEyebrow').textContent='PROTOTYPE SCOPE';$('#drawerTitle').textContent='How to interpret this view';$('#drawerBody').innerHTML='<div class="drawer-body-hero"><strong>Spatial planning mock</strong><span>Automated scenario analysis · not operational</span></div><ul class="detail-list"><li>AOI names <span>Real examples</span></li><li>Geometry and values <span>Illustrative</span></li><li>Distance <span>Straight-line only</span></li><li>Shelter capacity/status <span>Not assessed</span></li><li>Forecast or warning <span>No</span></li><li>Individual locations <span>Never displayed</span></li></ul>';openDrawer()});

renderBuffers();updateAnalysis();
