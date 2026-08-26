const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const messages = $('#messages');
const mapCanvas = $('#mapCanvas');
const aoiMenu = $('#aoiMenu');
const detailDrawer = $('#detailDrawer');
const backdrop = $('#backdrop');
const toast = $('#toast');
let purpose = '';
let aoiSelected = false;
let assessmentComplete = false;
let running = false;
let candidateMode = false;
let exportFormat = 'SVG';
let uploadType = 'Population';
let selectedScenario = '100';
let selectedProximityThreshold = 1000;
let selectedAOI = null;
const aoiData = {
  'phaya-thai': {name:'Phaya Thai District, Bangkok', short:'Phaya Thai District', level:'District', mapLabel:'PHAYA THAI'},
  'warin-chamrap': {name:'Warin Chamrap District, Ubon Ratchathani', short:'Warin Chamrap District', level:'District', mapLabel:'WARIN CHAMRAP'},
  'kham-nam-saep': {name:'Kham Nam Saep sub-district, Warin Chamrap District, Ubon Ratchathani', short:'Kham Nam Saep sub-district', level:'sub-district', mapLabel:'KHAM NAM SAEP'}
};
const currentAOI=()=>selectedAOI?aoiData[selectedAOI]:null;
const safeName=s=>(s||'Thailand_AOI').replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'');
const scenarioData = {
  '20': {people:8420, peopleLabel:'8,420', children:'1,770', older:'1,250', support:'420', mobility:'670', atRisk:1, density:'16.6', probability:'5% annual chance'},
  '50': {people:12760, peopleLabel:'12,760', children:'2,680', older:'1,890', support:'640', mobility:'1,010', atRisk:2, density:'11.0', probability:'2% annual chance'},
  '100': {people:18640, peopleLabel:'18,640', children:'3,920', older:'2,760', support:'930', mobility:'1,480', atRisk:3, density:'7.5', probability:'1% annual chance'}
};
const riskLevels = {
  '20': {high:['C-06'],medium:['C-02','C-04'],low:['C-01','C-03','C-05','C-07','C-08']},
  '50': {high:['C-06','C-07'],medium:['C-02','C-04','C-08'],low:['C-01','C-03','C-05']},
  '100': {high:['C-06','C-07','C-08'],medium:['C-02','C-04'],low:['C-01','C-03','C-05']}
};
const vulnerabilityZones = {
  'V-01': {name:'Zone V1 · Child-support concentration',populationShare:.24,indicator:'Children 0–14',indicatorKey:'children',note:'Coordinate schools, caregivers, child-friendly facilities and family reunification.'},
  'V-02': {name:'Zone V2 · Older-people concentration',populationShare:.19,indicator:'Older people 65+',indicatorKey:'older',note:'Review mobility assistance, medication continuity and accessible transport.'},
  'V-03': {name:'Zone V3 · Disability-support concentration',populationShare:.16,indicator:'Disability-related support needs',indicatorKey:'support',note:'Plan accessible communication, transport and continuity for assistive devices.'},
  'V-04': {name:'Zone V4 · Low-mobility concentration',populationShare:.21,indicator:'Low-mobility households',indicatorKey:'mobility',note:'Validate households without transport, pickup points and assistance teams.'}
};

const centreData = {
  'C-01': {name:'Risk Point R-01',risk:'Low',code:'L',driver:'Outside strongest displayed flood overlap',evidence:'Mock hazard and exposure intersection',confidence:'Method not agreed',ai:'Low is relative to this mocked scenario. It does not mean safe and cannot identify an evacuation destination.'},
  'C-02': {name:'Risk Point R-02',risk:'Medium',code:'M',driver:'Some flood/exposure overlap',evidence:'Mock hazard and exposure intersection',confidence:'Method not agreed',ai:'Medium indicates a mocked intermediate class. Review source data, thresholds and local conditions.'},
  'C-03': {name:'Risk Point R-03',risk:'Low',code:'L',driver:'Lower displayed overlap',evidence:'Mock hazard and exposure intersection',confidence:'Not available',ai:'Low does not establish safety, route usability or suitability for people.'},
  'C-04': {name:'Risk Point R-04',risk:'Medium',code:'M',driver:'Some flood/exposure overlap',evidence:'Mock hazard and exposure intersection',confidence:'Method not agreed',ai:'This point requires production hazard, exposure and vulnerability evidence.'},
  'C-05': {name:'Risk Point R-05',risk:'Low',code:'L',driver:'Lower displayed overlap',evidence:'Mock hazard and exposure intersection',confidence:'Not available',ai:'Do not interpret green as an approved safe place.'},
  'C-06': {name:'Risk Point R-06',risk:'High',code:'H',driver:'Displayed flood extent intersects the point',evidence:'Mock hazard and exposure intersection',confidence:'Method not agreed',ai:'High indicates priority for evidence review in this simulation—not a current warning.'},
  'C-07': {name:'Risk Point R-07',risk:'High',code:'H',driver:'Displayed flood and access overlap',evidence:'Mock hazard, exposure and route inputs',confidence:'Not available',ai:'Production classification requires approved thresholds and data.'},
  'C-08': {name:'Risk Point R-08',risk:'Medium',code:'M',driver:'Displayed flood extent near point',evidence:'Mock hazard and exposure intersection',confidence:'Method not agreed',ai:'This medium point is illustrative and requires an approved production method before use.'}
};

const candidateData = {
  'P-01': {name:'Candidate Stadium A',type:'Synthetic stadium example',zones:'V1 · child-support concentration',movement:'Family coordination, child-friendly transport and reunification planning.'},
  'P-02': {name:'Candidate School B',type:'Synthetic school example',zones:'V2 · older-people concentration',movement:'Mobility assistance, medication continuity and accessible transport planning.'},
  'P-03': {name:'Community Hall C',type:'Synthetic community-hall example',zones:'V3 · disability-support concentration',movement:'Accessible vehicles, communication support and assistance-team planning.'},
  'P-04': {name:'Government Facility D',type:'Synthetic government-facility example',zones:'V4 · low-mobility concentration',movement:'Pickup points, assisted movement and transport coordination.'},
  'P-05': {name:'Open Assembly Area E',type:'Synthetic open-area example',zones:'V1 + V4 · mixed support focus',movement:'Family movement, staging and low-mobility transport coordination.'}
};

const detailContent = {
  people: {title:'Potentially exposed population', eyebrow:'SELECTED THAILAND AOI · AGGREGATED ESTIMATE', html:`<div class="drawer-body-hero"><strong>18,640</strong><span>people estimated within the illustrative RP100 extent</span></div><div class="detail-grid"><div class="detail-card"><b>15,900</b><small>Estimated residents</small></div><div class="detail-card"><b>2,740</b><small>Estimated daytime population</small></div></div><h3>Planner interpretation</h3><div class="ai-note"><b>AI summary:</b> Do not assume everyone can move independently. Confirm daytime population, accessible transport, pickup points and centre capacity before setting movement targets.</div><ul class="detail-list"><li>Population reference <span>Illustrative 2026</span></li><li>Display geography <span>Aggregated grid/district</span></li><li>Individual records <span>Not displayed</span></li><li>Uncertainty <span>Requires data-owner validation</span></li></ul>`},
  coverage: {title:'Shelter proximity and population gaps', eyebrow:'PROXIMITY PLANNING · ILLUSTRATIVE', html:''},
  children: {title:'Children potentially exposed', eyebrow:'SOCIAL SUPPORT CONTEXT', html:`<div class="drawer-body-hero"><strong>3,920</strong><span>illustrative estimate · ages 0–14</span></div><div class="ai-note"><b>Planning implication:</b> Coordinate schools and caregivers, child-friendly facilities and family reunification. Children may already be at school during daytime, so avoid assuming residential location equals pickup location.</div>`},
  older: {title:'Older people potentially exposed', eyebrow:'SOCIAL SUPPORT CONTEXT', html:`<div class="drawer-body-hero"><strong>2,760</strong><span>illustrative estimate · ages 65+</span></div><div class="ai-note"><b>Planning implication:</b> Validate mobility assistance, medication continuity, electricity-dependent care and accessible transport. Age alone does not determine vulnerability.</div>`},
  support: {title:'Disability-related support needs', eyebrow:'AGGREGATED · PRIVACY-LIMITED', html:`<div class="drawer-body-hero"><strong>930</strong><span>illustrative aggregated planning estimate</span></div><div class="ai-note"><b>Planning implication:</b> Prepare accessible communication and transport, continuity for assistive devices and trained support. Individual coordination belongs in a protected authorised system—not this view.</div>`},
  mobility: {title:'Low-mobility households', eyebrow:'AGGREGATED · MAY OVERLAP', html:`<div class="drawer-body-hero"><strong>1,480</strong><span>illustrative households that may need movement support</span></div><div class="ai-note"><b>Planning implication:</b> Validate households without transport and estimate accessible vehicles, pickup points and assistance teams. This category may overlap other groups.</div>`},
  centres: {title:'Risk-map simulation report', eyebrow:'HIGH / MEDIUM / LOW · MOCKED', html:`<div class="drawer-body-hero"><strong>8 risk points</strong><span>3 high · 3 medium · 2 low · illustrative classification</span><span class="status-badge badge-risk">NOT A SAFE-PLACE MAP</span></div><div class="detail-grid"><div class="detail-card"><b>3 · H</b><small>High risk points</small></div><div class="detail-card"><b>3 · M</b><small>Medium risk points</small></div><div class="detail-card"><b>2 · L</b><small>Low risk points</small></div><div class="detail-card"><b>Illustrative</b><small>Method status</small></div></div><div class="ai-note"><b>Interpretation:</b> Colours communicate scenario risk class only. Green/low does not mean safe. Thresholds, hazard data and exposure inputs must be approved before production use.</div><ul class="detail-list"><li>Risk Point R-06 <span>High · H</span></li><li>Risk Point R-07 <span>High · H</span></li><li>Risk Point R-02 <span>Medium · M</span></li><li>Risk Point R-08 <span>Medium · M</span></li><li>Risk Point R-01 <span>Low · L · not safe</span></li></ul>`},
  safeplaces: {title:'Where could people move?', eyebrow:'VIEWPOINT 1 · FIVE CANDIDATE LOCATIONS', html:`<div class="drawer-body-hero"><strong>5 candidate places</strong><span>illustrative locations linked to vulnerable-people movement information</span><span class="status-badge badge-candidate">FIRST-PHASE PLANNING VIEW</span></div><div class="ai-note"><b>Planning interpretation:</b> Compare the five candidate locations with nearby aggregated vulnerable-population zones and movement-support needs. This first phase does not assess suitability, capacity or official shelter status.</div><ul class="detail-list"><li>Candidate Stadium A <span>V1 · child-support movement</span></li><li>Candidate School B <span>V2 · older-people movement</span></li><li>Community Hall C <span>V3 · accessible movement</span></li><li>Government Facility D <span>V4 · low-mobility movement</span></li><li>Open Assembly Area E <span>V1 + V4 · mixed support focus</span></li></ul><div class="detail-actions"><button data-detail="people">View population context</button><button class="primary" data-detail="children">View vulnerable-people information</button></div>`},
  evidence: {title:'Sources, methods and limitations', eyebrow:'ASSESSMENT GRP-DEMO-24AUG-001', html:`<div class="drawer-body-hero"><strong>Traceability bundle</strong><span>Illustrative prototype evidence—not an approved scientific record</span></div><h3>Governed calculation concept</h3><ul class="detail-list"><li>AOI boundary <span>Selected district/sub-district · mocked geometry · EPSG:4326</span></li><li>Hazard <span>Illustrative RP100 extent · 1% annual chance</span></li><li>Centres <span>Demo registry · 14 records</span></li><li>Method <span>Deterministic geometry intersection</span></li><li>Population <span>Aggregated demo estimate</span></li><li>Review state <span>Provisional · not approved</span></li></ul><h3>Known limitations</h3><div class="ai-note">The reported-ready production data is not connected to this static mock. AOI names may be real, but geometry, facility assessment, population, capacity, roads and results remain illustrative. Outside an extent does not establish safety. The AI explains scripted governed outputs and must not invent missing evidence.</div>`},
  buildings: {title:'Building-height footprint dataset', eyebrow:'URBAN PLANNING · DOWNLOADABLE DEMO LAYER', html:`<div class="drawer-body-hero"><strong>3,180</strong><span>illustrative building footprints in the selected AOI</span></div><div class="detail-grid"><div class="detail-card"><b>2,480</b><small>Height/floor attributes available</small></div><div class="detail-card"><b>700</b><small>Height unknown</small></div><div class="detail-card"><b>78%</b><small>Attribute coverage</small></div><div class="detail-card"><b>GeoJSON</b><small>Prototype download format</small></div></div><h3>Included fields</h3><ul class="detail-list"><li>building_id <span>Demonstration identifier</span></li><li>geometry <span>Building footprint polygon</span></li><li>height_m <span>Height in metres where available</span></li><li>floors <span>Recorded/estimated floor count</span></li><li>height_source <span>Source and method</span></li><li>confidence <span>Attribute quality flag</span></li><li>reference_date <span>Illustrative 2026</span></li><li>building name/use/ownership <span>Where available · otherwise null</span></li><li>hazard intersection <span>RP scenario-specific derived field</span></li><li>exposed footprint area <span>Method/version required</span></li><li>administrative area <span>Selected Thailand district/sub-district · real name, mocked geometry</span></li><li>derivation method/version <span>demo-building-export-v0.1</span></li><li>data dictionary / limitations <span>Included with package</span></li></ul><div class="ai-note"><b>AI urban-planner note:</b> Download the footprint layer as an input to an approved zoning or risk-map method. Building height alone does not calculate risk; combine it with hazard, exposure, vulnerability, occupancy and method assumptions.</div><div class="detail-actions"><button data-detail="evidence">View metadata</button><button class="primary" data-action="building-export">Download GeoJSON →</button></div>`},
  candidate: {title:'User-nominated candidate location', eyebrow:'FIRST-PHASE LOCATION COMPARISON', html:`<div class="drawer-body-hero"><strong>Candidate POI A</strong><span>user-placed illustrative location</span><span class="status-badge badge-candidate">MOVEMENT-PLANNING INFORMATION</span></div><h3>First-phase information</h3><ul class="detail-list"><li>Nearby vulnerable-population zone <span>Use the V1–V4 map</span></li><li>Movement-support focus <span>Identify transport, pickup and assistance needs</span></li><li>Individual/household locations <span>Not displayed</span></li><li>Suitability, capacity and official status <span>Not assessed in this first phase</span></li></ul><div class="ai-note"><b>Planning use:</b> Compare the location with aggregated vulnerable-population patterns. Do not interpret it as a safe or approved shelter.</div><div class="detail-actions"><button data-detail="safeplaces">Compare five candidates</button><button class="primary" data-detail="people">View vulnerable-people map</button></div>`}
};

function scrollChat(){messages.scrollTop=messages.scrollHeight;}
function userMessage(text){const e=document.createElement('div');e.className='message user';e.innerHTML=`<div class="bubble"><p>${text}</p></div>`;messages.appendChild(e);scrollChat();}
function aiMessage(html){const e=document.createElement('div');e.className='message assistant';e.innerHTML=`<div class="avatar">AI</div><div class="bubble">${html}</div>`;messages.appendChild(e);scrollChat();return e;}
function showToast(text){$('#toastText').textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600);}
function openAOI(){aoiMenu.classList.add('open');}
function closeAOI(){aoiMenu.classList.remove('open');}

function choosePurpose(value){
  purpose=value;
  const labels={budget:'Build a preparedness investment case',preparedness:'Review flood preparedness',improvement:'Review a candidate evacuation place',urban:'Download building-height footprints for risk mapping',riskmap:'Download a district or sub-district risk map'};
  const selectedLabel=labels[value]||'Review evacuation planning';
  userMessage(selectedLabel);
  const focus={budget:'strategic evidence for preparedness funding discussions',preparedness:'preparedness risk and follow-up',urban:'building-height footprints for urban risk-map analysis',riskmap:'a downloadable AOI risk-map package',improvement:'candidate locations and vulnerable-people movement information'}[value]||'evacuation-planning evidence';
  aiMessage(`<p>Understood. I’ll keep the workflow focused on <b>${focus}</b>.</p><p>Select any Thailand district or sub-district. The examples use real administrative names, while boundaries and results are clearly mocked.</p><button class="inline-action" data-action="select-aoi">Select Thailand district or sub-district</button>`);
  openAOI();
}

function selectAOI(id){
  selectedAOI=id;aoiSelected=true;const a=currentAOI();closeAOI();mapCanvas.classList.add('aoi-selected');
  $('#aoiLabel').innerHTML=`${a.name} <small>${a.level}</small>`;
  $('#globalAOI').textContent=a.name;$('#selectedAOIMapLabel').textContent=a.mapLabel;
  $('#scenarioScope').textContent=`${a.short.toUpperCase()} · ${a.level.toUpperCase()} · MOCK GEOMETRY`;
  $('#exportAOI').textContent=`${a.name} · ${a.level}`;
  selectScenario(selectedScenario);
  userMessage(`Use ${a.name} (${a.level}).`);
  const urban=purpose==='urban';
  aiMessage(`<p><strong>AOI selected:</strong> ${a.name} · ${a.level}.</p><p><b>Prototype truth note:</b> this is a real administrative name; the displayed boundary, flood geometry and result values are mocked.</p><p>${urban?'I can prepare the illustrative building-footprint layer with height, floor and quality attributes for download.':'Choose the 20-, 50- or 100-year flood extent. These are static planning scenarios—not forecasts or current warnings.'}</p><div class="config-card"><div class="config-row"><small>Purpose</small><b>${purpose?({budget:'Preparedness investment planning',preparedness:'Preparedness review',improvement:'Candidate-place review',urban:'Urban risk-map data preparation',riskmap:'AOI risk-map download'}[purpose]):'Preparedness review'}</b></div><div class="config-row"><small>AOI coverage</small><b>Thailand nationwide · district and sub-district levels</b></div>${urban?'<div class="config-row"><small>Dataset</small><b>Building footprints + height/floor attributes</b></div>':'<div class="config-row"><small>Flood scenario</small><div class="scenario-options"><button data-scenario="20"><b>20-year</b><small>5% annual chance</small></button><button data-scenario="50"><b>50-year</b><small>2% annual chance</small></button><button class="active" data-scenario="100"><b>100-year</b><small>1% annual chance</small></button></div></div>'}<div class="config-row"><small>Output</small><b>${urban?'Downloadable GeoJSON + metadata + coverage gaps':purpose==='riskmap'?'Downloadable SVG/GeoJSON risk map + metadata':'Evacuation planning<br><small>Additional: H/M/L risk points · people · risk report · map download</small>'}</b></div><button class="run-btn" id="${urban?'runUrban':'runAssessment'}">${urban?'Prepare building dataset':'Confirm scenario & run assessment'}</button></div>`);
  setTimeout(()=>urban?$('#runUrban')?.addEventListener('click',runUrban):$('#runAssessment')?.addEventListener('click',runAssessment),0);
}

function selectScenario(year){
  selectedScenario=year;
  $$('[data-scenario]').forEach(b=>b.classList.toggle('active',b.dataset.scenario===year));
  $('#scenarioTitle').textContent=`${year}-year flood extent`;
  const a=currentAOI();$('#scenarioScope').textContent=`${a?a.short.toUpperCase():'THAILAND AOI'} · RP${year} · MOCK RESULTS`;
  $('#globalScenario').textContent=`RP${year} · ${scenarioData[year].probability.replace(' annual chance',' AEP')}`;
  $('#exportScenario').textContent=`RP${year} · ${scenarioData[year].probability.replace(' annual chance',' AEP')}`;
  const desc=$('.scenario-card span');if(desc)desc.textContent=`${scenarioData[year].probability} · Static planning scenario`;
  if(aoiSelected)refreshScenarioUI();
}

function proximityThresholdLabel(value=selectedProximityThreshold){return value===500?'500 m':value===1000?'1 km':'2 km';}
function getProximityStats(){
  const d=scenarioData[selectedScenario],base=[1980,5420,7090,4150],ratio=d.people/18640;
  const bands=base.slice(0,3).map(value=>Math.round(value*ratio));bands.push(d.people-bands.reduce((sum,value)=>sum+value,0));
  const within=selectedProximityThreshold===500?bands[0]:selectedProximityThreshold===1000?bands[0]+bands[1]:bands[0]+bands[1]+bands[2];
  return{bands,within,outside:d.people-within,priority:{500:4,1000:3,2000:1}[selectedProximityThreshold]};
}
function buildProximityCoverageHTML(){
  const d=scenarioData[selectedScenario],s=getProximityStats(),label=proximityThresholdLabel(),percent=value=>`${(value/d.people*100).toFixed(1)}%`;
  return `<div class="drawer-body-hero proximity-hero"><strong>${s.outside.toLocaleString()}</strong><span>people are farther than ${label} from a candidate shelter</span><span class="status-badge badge-candidate">ILLUSTRATIVE PROXIMITY GAP</span></div><p class="proximity-context">Of ${d.peopleLabel} people within the displayed RP${selectedScenario} flood extent · straight-line distance · illustrative analysis</p><div class="proximity-threshold"><small>SELECT PROXIMITY THRESHOLD</small><div><button data-proximity-threshold="500" class="${selectedProximityThreshold===500?'active':''}">500 m</button><button data-proximity-threshold="1000" class="${selectedProximityThreshold===1000?'active':''}">1 km</button><button data-proximity-threshold="2000" class="${selectedProximityThreshold===2000?'active':''}">2 km</button></div><p>The selected threshold is a planning assumption—not an official universal standard.</p></div><div class="detail-grid proximity-kpis"><div class="detail-card"><b>${d.peopleLabel}</b><small>Exposed people*</small></div><div class="detail-card"><b>4 indicators</b><small>Aggregated vulnerability</small></div><div class="detail-card"><b>14</b><small>Candidate shelter records*</small></div><div class="detail-card"><b>${s.outside.toLocaleString()}</b><small>Beyond ${label}*</small></div><div class="detail-card"><b>${s.priority}</b><small>Priority areas*</small></div></div><h3>Proximity distribution</h3><div class="distance-band-table"><div class="distance-head"><b>Distance to nearest candidate shelter</b><b>People</b><b>Percentage</b></div><div><span>Within 500 m</span><b>${s.bands[0].toLocaleString()}</b><em>${percent(s.bands[0])}</em></div><div><span>500 m–1 km</span><b>${s.bands[1].toLocaleString()}</b><em>${percent(s.bands[1])}</em></div><div><span>1–2 km</span><b>${s.bands[2].toLocaleString()}</b><em>${percent(s.bands[2])}</em></div><div><span>More than 2 km</span><b>${s.bands[3].toLocaleString()}</b><em>${percent(s.bands[3])}</em></div></div><h3>Map layers for this analysis</h3><div class="proximity-layer-list"><span>≈ Flood extent</span><span>▦ Population-density grid</span><span>V Vulnerable-population hotspots</span><span>⌂ Candidate shelter points</span><span>◎ Selected proximity radius</span><span>! Areas outside threshold</span></div><div class="ai-note"><b>Planning summary:</b> Several high-density and vulnerable-population areas are located beyond the selected ${label} proximity threshold. These areas should be prioritised for further shelter planning or additional candidate-site investigation. This analysis considers proximity only; shelter capacity, accessibility, route safety and official approval are not included.</div><div class="proximity-warning"><b>Planning support only.</b> Candidate shelters are not confirmed safe or approved. Distance is calculated as straight-line proximity. Shelter capacity, accessibility, road conditions and evacuation-route safety are not included.</div><p class="micro">*Mock values. Fourteen inventory records are represented as supporting data; five synthetic candidate examples are currently displayed on the map.</p>`;
}
function refreshProximityCoverage(){
  const d=scenarioData[selectedScenario],s=getProximityStats(),label=proximityThresholdLabel(),card=$('.coverage-card');
  if(card){$('span',card).textContent='Shelter proximity and population gaps';$('b',card).textContent=`${s.outside.toLocaleString()} people are farther than ${label} ›`;$('small',card).textContent=`Of ${d.peopleLabel} people in RP${selectedScenario} extent · straight-line distance · illustrative`;}
  detailContent.coverage.title='Shelter proximity and population gaps';detailContent.coverage.eyebrow=`RP${selectedScenario} · ${label.toUpperCase()} · STRAIGHT-LINE · ILLUSTRATIVE`;detailContent.coverage.html=buildProximityCoverageHTML();
}
function selectProximityThreshold(value){selectedProximityThreshold=Number(value);refreshProximityCoverage();openDetail('coverage');showToast(`Proximity threshold updated to ${proximityThresholdLabel()}`);}

function refreshScenarioUI(){
  const d=scenarioData[selectedScenario];const a=currentAOI();
  detailContent.people.eyebrow=`${a.name.toUpperCase()} · ${a.level.toUpperCase()} · ILLUSTRATIVE`;
  detailContent.evidence.eyebrow=`${a.short.toUpperCase()} · MOCK DATA CONTRACT`;
  mapCanvas.classList.remove('scenario-20','scenario-50','scenario-100');mapCanvas.classList.add(`scenario-${selectedScenario}`);
  $('#panelScenario').textContent=`${a.short.toUpperCase()} · ${a.level.toUpperCase()} · RP${selectedScenario} · PROVISIONAL`;
  const levels=riskLevels[selectedScenario];const kpis=$$('.kpi-row button');$('b',kpis[0]).textContent='5';$('b',kpis[1]).textContent='4';$('b',kpis[2]).textContent='4';$('b',kpis[3]).textContent=d.peopleLabel;
  Object.entries({high:levels.high,medium:levels.medium,low:levels.low}).forEach(([level,ids])=>ids.forEach(id=>{const marker=$(`[data-center="${id}"]`,$('#analysisLayers'));if(marker){marker.classList.remove('risk-high','risk-medium','risk-low');marker.classList.add(`risk-${level}`);$('text',marker).textContent={high:'H',medium:'M',low:'L'}[level];}}));
  const peoplePanel=$('[data-tab-content="people"]');$('.section-title span',peoplePanel).textContent=d.peopleLabel;
  const values=[d.children,d.older,d.support,d.mobility];$$('.people-grid b',peoplePanel).forEach((b,i)=>b.textContent=values[i]);
  const chartValues={children:d.children,older:d.older,support:d.support,mobility:d.mobility},numericValues=Object.fromEntries(Object.entries(chartValues).map(([key,value])=>[key,Number(value.replace(/,/g,''))])),maxValue=Math.max(...Object.values(numericValues));
  $$('[data-vulnerability-bar]',peoplePanel).forEach(row=>{const key=row.dataset.vulnerabilityBar,value=chartValues[key],numeric=numericValues[key];$('b',row).textContent=value;$('i',row).style.width=`${(numeric/maxValue*100).toFixed(1)}%`;row.setAttribute('aria-label',`${$('span',row).textContent}: ${value} illustrative`);});
  $('#vulnerabilityChart').setAttribute('aria-label',`Illustrative vulnerable-people indicators for RP${selectedScenario}`);
  refreshProximityCoverage();
  detailContent.centres.html=`<div class="drawer-body-hero"><strong>8 risk points</strong><span>${levels.high.length} high · ${levels.medium.length} medium · ${levels.low.length} low · RP${selectedScenario}</span><span class="status-badge badge-risk">NOT A SAFE-PLACE MAP</span></div><div class="detail-grid"><div class="detail-card"><b>${levels.high.length} · H</b><small>High risk points</small></div><div class="detail-card"><b>${levels.medium.length} · M</b><small>Medium risk points</small></div><div class="detail-card"><b>${levels.low.length} · L</b><small>Low risk points</small></div><div class="detail-card"><b>Illustrative</b><small>Method status</small></div></div><div class="ai-note"><b>Risk report:</b> Colours show mocked RP${selectedScenario} scenario classes. They do not show safe places. Green/low still requires evidence and must not be used as a shelter recommendation.</div><ul class="detail-list"><li>Classification method <span>Mock H/M/L thresholds · approval required</span></li><li>Hazard source <span>Reported ready · not connected</span></li><li>Exposure source <span>Reported ready · not connected</span></li><li>First-phase status <span>Illustrative planning information</span></li><li>Download <span>SVG / GeoJSON / JSON manifest</span></li></ul><div class="detail-actions"><button data-action="planning-view">Back to planning</button><button class="primary" data-action="risk-download">Download risk map</button></div>`;
  detailContent.evidence.html=`<div class="drawer-body-hero"><strong>Traceability bundle</strong><span>Illustrative RP${selectedScenario} prototype evidence—not an approved scientific record</span></div><h3>Layer and result metadata</h3><ul class="detail-list"><li>AOI <span>${a.name} · ${a.level} · real name</span></li><li>AOI boundary <span>Mocked in prototype · production boundary adapter confirmed feasible</span></li><li>Source organisation / dataset <span>Data reported ready · production source metadata to connect</span></li><li>Source URL / feature ID <span>Not available · SYN-DEMO identifiers</span></li><li>Data vintage / imagery date <span>Illustrative · no authoritative date</span></li><li>Scenario / model version <span>RP${selectedScenario} demo extent · model not agreed</span></li><li>Evidence type <span>Modeled/derived demonstration</span></li><li>CRS <span>EPSG:4326 demo geometry</span></li><li>Resolution / scale <span>Not available</span></li><li>Licence / usage restriction <span>Prototype only · not for operational use</span></li><li>Method version <span>risk-classification-demo-v0.1</span></li><li>Population <span>${d.peopleLabel} · illustrative aggregated estimate</span></li><li>Known limitations <span>Prototype does not yet connect the reported-ready production data</span></li><li>Review/approval workflow <span>Out of scope for this first phase</span></li></ul><div class="ai-note">Every production result must replace synthetic evidence with approved source, vintage, method, licence and validation records.</div>`;
  detailContent.people.html=`<div class="drawer-body-hero"><strong>${d.peopleLabel}</strong><span>people estimated within the illustrative RP${selectedScenario} extent</span></div><div class="detail-grid"><div class="detail-card"><b>${Math.round(d.people*.85).toLocaleString()}</b><small>Estimated residents</small></div><div class="detail-card"><b>${Math.round(d.people*.15).toLocaleString()}</b><small>Estimated daytime population</small></div></div><h3>Planner interpretation</h3><div class="ai-note"><b>AI summary:</b> Do not assume everyone can move independently. Confirm the selected scenario, population source, support indicators and risk-classification method before setting planning targets.</div>`;
  detailContent.children.html=`<div class="drawer-body-hero"><strong>${d.children}</strong><span>illustrative estimate · ages 0–14 · RP${selectedScenario}</span></div><div class="ai-note"><b>Planning implication:</b> Coordinate schools, caregivers, child-friendly facilities and family reunification.</div>`;
  detailContent.older.html=`<div class="drawer-body-hero"><strong>${d.older}</strong><span>illustrative estimate · ages 65+ · RP${selectedScenario}</span></div><div class="ai-note"><b>Planning implication:</b> Plan for mobility assistance, medication continuity and accessible transport.</div>`;
  detailContent.support.html=`<div class="drawer-body-hero"><strong>${d.support}</strong><span>illustrative aggregated support-needs estimate · RP${selectedScenario}</span></div><div class="ai-note"><b>Planning implication:</b> Prepare accessible communication, transport and continuity for assistive devices.</div>`;
  detailContent.mobility.html=`<div class="drawer-body-hero"><strong>${d.mobility}</strong><span>illustrative low-mobility households · RP${selectedScenario}</span></div><div class="ai-note"><b>Planning implication:</b> Identify households needing transport, pickup points and assistance teams.</div>`;
}

function requireAOI(){if(aoiSelected)return true;aiMessage('<p>Select an area of interest first so I do not apply data to the wrong place.</p><button class="inline-action" data-action="select-aoi">Select AOI</button>');openAOI();return false;}

function runUrban(){
  if(running||!requireAOI())return;running=true;userMessage('Prepare the building-height footprint dataset.');
  const msg=aiMessage(`<p>I’m preparing the illustrative urban-planning data layer.</p><div class="analysis-steps"><div class="step" id="u1"><span>·</span>Clip building footprints to the selected AOI</div><div class="step" id="u2"><span>·</span>Join height and floor attributes</div><div class="step" id="u3"><span>·</span>Calculate coverage and quality flags</div><div class="step" id="u4"><span>·</span>Package GeoJSON with metadata</div></div>`);
  ['u1','u2','u3','u4'].forEach((id,i)=>setTimeout(()=>{const s=$('#'+id,msg);if(s){s.classList.add('done');$('span',s).textContent='✓';}},300+i*380));
  setTimeout(()=>{running=false;mapCanvas.classList.add('building-visible');$('#layerCount').textContent='3';aiMessage(`<div class="ai-summary"><p><strong>Building dataset ready.</strong> The illustrative AOI contains <b>3,180 building footprints</b>. Height or floor attributes are available for <b>2,480 records (78%)</b>; 700 remain unknown.</p><p>The download includes geometry, height in metres, floor count, source, reference date and confidence flags. An urban planner can use it as an input to an approved risk-map method, but building height alone does not calculate risk.</p><p><b>Open the dataset details to review fields and download GeoJSON.</b></p></div>`);openDetail('buildings');},1900);
}

function runAssessment(){
  if(running||!requireAOI())return;running=true;userMessage(`Run the RP${selectedScenario} evacuation-planning assessment.`);
  const msg=aiMessage(`<p>I’m running the illustrative governed workflow.</p><div class="analysis-steps"><div class="step" id="p1"><span>·</span>Validate AOI, scenario and planning inputs</div><div class="step" id="p2"><span>·</span>Screen candidate evacuation places</div><div class="step" id="p3"><span>·</span>Aggregate vulnerable-people indicators</div><div class="step" id="p4"><span>·</span>Prepare evidence and investment-brief inputs</div></div>`);
  ['p1','p2','p3','p4'].forEach((id,i)=>setTimeout(()=>{const s=$('#'+id,msg);if(s){s.classList.add('done');$('span',s).textContent='✓';}},350+i*420));
  setTimeout(()=>{
    assessmentComplete=true;running=false;refreshScenarioUI();mapCanvas.classList.add('results-visible');showInfoPanel(false);$('#layerCount').textContent='7';
    const d=scenarioData[selectedScenario];const a=currentAOI();
    aiMessage(`<div class="ai-summary"><p><strong>${a.name} · RP${selectedScenario} evacuation-planning review ready.</strong><br><small>Real AOI name · mocked geometry, candidates and population values</small></p><p><b>Viewpoint 1 — Where could people move?</b> Five candidate evacuation places are shown with nearby vulnerable-population zones and movement-planning information. Suitability and capacity are not assessed in this first phase.</p><p><b>Viewpoint 2 — Vulnerable people.</b> The displayed total of <b>${d.peopleLabel} people is illustrative</b>, with four aggregated support indicators for planning assisted movement.</p><p>Review the five candidate locations together with the vulnerable-people map, then generate the editable <b>preparedness investment brief</b>.</p><p>The red/yellow/green <b>risk map is available as further information</b> through View risk map; it is not the main planning result.</p></div>`);
  },2200);
}

function openCentre(id){
  const c=centreData[id];if(!c)return;const levels=riskLevels[selectedScenario];const level=levels.high.includes(id)?'High':levels.medium.includes(id)?'Medium':'Low';const code={High:'H',Medium:'M',Low:'L'}[level];
  $('#drawerEyebrow').textContent=`${id} · RP${selectedScenario} · MOCK RISK POINT`;
  $('#drawerTitle').textContent=c.name;
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>${level} · ${code}</strong><span>scenario risk class · colour plus letter label</span><span class="status-badge ${level==='High'?'badge-risk':'badge-candidate'}">SUPPORTING MAP INFORMATION</span></div><div class="detail-grid"><div class="detail-card"><b>Illustrative</b><small>Method status</small></div><div class="detail-card"><b>${id}</b><small>Mock feature ID</small></div></div><h3>Risk-point information</h3><ul class="detail-list"><li>AOI / scenario <span>${currentAOI().short} · RP${selectedScenario}</span></li><li>Risk driver <span>${c.driver}</span></li><li>Calculation basis <span>${c.evidence}</span></li><li>Method confidence <span>${c.confidence}</span></li><li>Operational meaning <span>${level==='Low'?'Lower modeled risk · not safe':'Priority for review · not a warning'}</span></li></ul><div class="ai-note"><b>AI interpretation:</b> ${c.ai}</div><div class="detail-actions"><button data-detail="evidence">Methods & limits</button><button class="primary" data-action="planning-view">Back to planning</button></div>`;
  openDrawer();
}
function openVulnerabilityZone(id){
  const zone=vulnerabilityZones[id],d=scenarioData[selectedScenario],a=currentAOI();if(!zone||!a)return;
  const zonePopulation=Math.round(d.people*zone.populationShare).toLocaleString();
  $('#drawerEyebrow').textContent=`${id} · AGGREGATED ZONE · RP${selectedScenario} · ILLUSTRATIVE`;
  $('#drawerTitle').textContent=zone.name;
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>${zonePopulation}</strong><span>illustrative people in this aggregated display zone</span><span class="status-badge badge-vulnerable">NOT INDIVIDUAL LOCATIONS</span></div><div class="detail-grid"><div class="detail-card"><b>${d[zone.indicatorKey]}</b><small>${zone.indicator} · AOI-wide illustrative total</small></div><div class="detail-card"><b>Aggregated</b><small>Spatial display method</small></div></div><h3>Map interpretation</h3><ul class="detail-list"><li>AOI / scenario <span>${a.short} · RP${selectedScenario}</span></li><li>Zone geometry <span>Mocked demonstration polygon</span></li><li>Population source <span>Illustrative · production source not connected</span></li><li>Categories <span>May overlap · do not sum</span></li><li>Individual/household locations <span>Not displayed</span></li></ul><div class="ai-note"><b>Planning implication:</b> ${zone.note}</div>`;
  openDrawer();
}
function openCandidatePlace(id){
  const c=candidateData[id];if(!c)return;$('#drawerEyebrow').textContent=`${id} · CANDIDATE LOCATION · ILLUSTRATIVE`;$('#drawerTitle').textContent=c.name;
  $('#drawerBody').innerHTML=`<div class="drawer-body-hero"><strong>${id}</strong><span>${c.type}</span><span class="status-badge badge-candidate">MOVEMENT-PLANNING INFORMATION</span></div><div class="detail-grid"><div class="detail-card"><b>${c.zones.split(' · ')[0]}</b><small>Nearby vulnerable zone</small></div><div class="detail-card"><b>First phase</b><small>Location comparison</small></div></div><h3>Moving vulnerable people</h3><ul class="detail-list"><li>Nearby aggregated zone <span>${c.zones}</span></li><li>Movement-planning focus <span>${c.movement}</span></li><li>Displayed flood relationship <span>Illustrative map context</span></li><li>Individual or household locations <span>Not displayed</span></li><li>Suitability, capacity and official status <span>Not assessed in this first phase</span></li></ul><div class="ai-note"><b>Planner note:</b> Use this candidate as a location reference for discussing how vulnerable groups might move. It is not a statement that the location is safe, suitable or approved.</div><div class="detail-actions"><button data-detail="safeplaces">Compare all five candidates</button><button class="primary" data-detail="people">View vulnerable-people map</button></div>`;openDrawer();
}
function openDetail(key){const d=detailContent[key];if(!d)return;$('#drawerEyebrow').textContent=d.eyebrow;$('#drawerTitle').textContent=d.title;$('#drawerBody').innerHTML=d.html;openDrawer();}
function openDrawer(){detailDrawer.classList.add('open');detailDrawer.setAttribute('aria-hidden','false');backdrop.classList.add('open');}
function closeDrawer(){detailDrawer.classList.remove('open');detailDrawer.setAttribute('aria-hidden','true');backdrop.classList.remove('open');}

function switchTab(name){
  $$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  $$('[data-tab-content]').forEach(c=>c.classList.toggle('active',c.dataset.tabContent===name));
  mapCanvas.classList.toggle('vulnerable-view',name==='people');
  if(name==='people'&&assessmentComplete)showToast('Vulnerable-people map layer shown');
}
function hideInfoPanel(){
  mapCanvas.classList.add('panel-collapsed');
  showToast('Map expanded · planning information can be reopened');
}
function showInfoPanel(announce=true){
  $('#assessmentPanel').style.display='';
  mapCanvas.classList.remove('panel-collapsed');
  if(announce)showToast('Planning information restored');
}
function openModal(id){$('#'+id).classList.add('open');}
function closeModals(){$$('.modal').forEach(m=>m.classList.remove('open'));}

function promptLocationQuestion(){const input=$('#chatInput');input.value='Where could people move?';input.focus();showToast('Ask the assistant in human language');}
function startCandidate(){
  if(!assessmentComplete){if(!requireAOI())return;aiMessage('<p>Complete the risk-map simulation before screening a candidate point, so it uses the same AOI and scenario.</p>');return;}
  candidateMode=true;mapCanvas.classList.add('candidate-mode');userMessage('I want to assess a candidate evacuation-centre location.');
  aiMessage('<p>Click anywhere inside the highlighted map area to place a demonstration candidate POI. I will screen available evidence, but I will not rank or certify it as safe.</p>');showToast('Candidate mode: click the map to place a point');
}
function placeCandidate(){
  if(!candidateMode)return;candidateMode=false;mapCanvas.classList.remove('candidate-mode');mapCanvas.classList.add('candidate-visible');$('#layerCount').textContent='8';
  userMessage('Place the candidate point here.');
  aiMessage('<p><strong>Candidate POI added.</strong> It is shown as an illustrative location beside the vulnerable-people map. Suitability, capacity, services, ownership and live access are not assessed in this first phase.</p>');
  openDetail('candidate');
}

function selectUploadType(btn){$$('[data-upload-type]').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');uploadType=btn.dataset.uploadType;}
function demoFile(){$('#fileState').classList.add('visible');$('#rerunUpload').disabled=false;}
function rerunUpload(){closeModals();userMessage(`Use the demonstration ${uploadType.toLowerCase()} file and rerun.`);aiMessage(`<p>The ${uploadType.toLowerCase()} file passed the prototype schema check and was added as a <b>versioned local overlay</b>. The governed source remains available for comparison.</p><p>The demonstration rerun is complete. No headline value changed because this mock file contains matching illustrative records.</p>`);showToast(`${uploadType} demo file validated and applied`);}

function generateReport(){
  const selected=$$('#reportModal input:checked').map(i=>i.parentElement.textContent.trim()),reportPurpose=$('#reportPurpose').value;
  const d=scenarioData[selectedScenario],aoi=currentAOI(),levels=riskLevels[selectedScenario],proximity=getProximityStats(),threshold=proximityThresholdLabel();
  const include=name=>selected.includes(name),section=(name,content)=>include(name)?content:'';
  const html=`<html><body style="font-family:Arial;line-height:1.45;color:#203536"><h1>Preparedness investment brief</h1><p><b>Purpose:</b> ${reportPurpose}</p><p><b>AOI:</b> ${aoi.name} · ${aoi.level}</p><p><b>Scenario:</b> RP${selectedScenario} (${d.probability})</p><p><b>Selected proximity threshold:</b> ${threshold} · straight-line distance</p><p><b>First-phase scope:</b> Five candidate locations and vulnerable-people movement information; no in-app review or approval state.</p><p><b>Prototype status:</b> Real AOI name · mocked geometry and values</p>${section('Executive summary',`<h2>Executive summary</h2><p>This brief turns population, vulnerability and shelter-proximity gaps into strategic guidance for funding discussions. It supports preparation of an investment case; it is not an automated funding decision or an official shelter assessment.</p>`)}${section('Planning problem and supporting evidence',`<h2>Planning problem and supporting evidence</h2><p>The displayed RP${selectedScenario} extent contains an illustrative ${d.peopleLabel} people. Five candidate examples are shown for planning comparison, while 14 illustrative candidate-shelter records support the proximity concept. Candidate capacity, accessibility, route safety and official status are not confirmed.</p>`)}${section('Population and vulnerability context',`<h2>Population and vulnerability context</h2><p>Illustrative indicators include ${d.children} children, ${d.older} older people, ${d.support} disability-related support needs and ${d.mobility} low-mobility households. Categories may overlap and must not be summed. No individual or household locations are included.</p>`)}${section('Shelter-proximity gaps',`<h2>Shelter-proximity gaps</h2><p>An illustrative ${proximity.outside.toLocaleString()} people are farther than ${threshold} from a candidate shelter. ${proximity.priority} priority areas are indicated. Distance is straight-line proximity—not walking distance, travel time or a safe route.</p>`)}${section('Priority preparedness actions',`<h2>Priority preparedness actions</h2><ul><li>Investigate additional candidate sites near high-density and vulnerable-population gaps.</li><li>Compare candidate locations with population and vulnerable-people movement needs.</li><li>Assess safe routes, transport assistance and pickup arrangements.</li><li>Confirm authoritative population, vulnerability and flood evidence.</li></ul>`)}${section('Indicative investment options',`<h2>Indicative investment options</h2><ul><li>Candidate-site assessment and field verification.</li><li>Accessible transport, pickup points and evacuation assistance.</li><li>Water, sanitation, backup power, communications and medical support.</li><li>Access improvements, signage, staffing, training and community engagement.</li></ul><p>Options are indicative and require costing and prioritisation in a later phase.</p>`)}${section('Evidence and limitations',`<h2>Evidence and limitations</h2><p>Production data is reported ready but is not connected to this static mock. Geometry, candidates, population, proximity and results are illustrative. Shelter capacity, accessibility, road conditions, route safety and official approval are not included. Suitability assessment and responsible-authority decisions belong to later phases.</p>`)}${section('Supporting map appendix',`<h2>Supporting map appendix</h2><p>RP${selectedScenario} supporting risk information: ${levels.high.length} high/red, ${levels.medium.length} medium/yellow and ${levels.low.length} low/green mocked points. Low/green does not mean safe. Include the exported map and provenance package when available.</p>`)}<h2>Included sections</h2><ul>${selected.map(name=>`<li>${name}</li>`).join('')}</ul><p><b>Follow-up planning owner:</b> ____________________</p></body></html>`;
  const blob=new Blob([html],{type:'application/msword'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${safeName(aoi.short)}_RP${selectedScenario}_Preparedness_Investment_Brief.doc`;link.click();URL.revokeObjectURL(link.href);
  closeModals();userMessage(`Generate an editable investment brief for: ${reportPurpose}.`);aiMessage(`<p>I prepared an editable <b>Preparedness investment brief</b> with: ${selected.join(', ')}.</p><p>It translates population, vulnerability and shelter-proximity evidence into strategic guidance while preserving limitations and human-review status.</p>`);showToast('Editable investment brief generated');
}
function downloadBuildingData(){
  const aoi=currentAOI();const data={type:'FeatureCollection',name:`${safeName(aoi.short)}_Building_Height_Footprints_MOCK`,metadata:{aoi_name:aoi.name,aoi_level:aoi.level,real_aoi_name:true,geometry_is_mock:true,not_spatially_valid_for_operational_use:true,illustrative:true,crs:'EPSG:4326',coverage_percent:78,derivation_method:'demo-building-export-v0.1',licence:'prototype only',warning:'Mock geometry—not for scientific or operational use',data_dictionary:{height_m:'Illustrative height in metres; null when unknown',floors:'Illustrative recorded/estimated floors; null when unknown',hazard_intersection:'Derived against selected return-period demo extent',exposed_footprint_area_m2:'Derived demo area; method approval required'}},features:[
    {type:'Feature',properties:{building_id:'BLD-DEMO-001',source:'synthetic prototype',source_date:'not available',name:null,use:null,ownership:null,height_m:12.5,floors:3,height_source:'illustrative',confidence:'demo-high',reference_date:'2026-demo',admin_area:`${aoi.name} · MOCK`,hazard_scenario:`RP${selectedScenario}`,hazard_intersection:false,exposed_footprint_area_m2:0,derivation_method:'demo-building-export-v0.1'},geometry:{type:'Polygon',coordinates:[[[100.530,13.780],[100.531,13.780],[100.531,13.781],[100.530,13.781],[100.530,13.780]]]}},
    {type:'Feature',properties:{building_id:'BLD-DEMO-002',height_m:24.0,floors:6,height_source:'illustrative',confidence:'demo-medium',reference_date:'2026-demo'},geometry:{type:'Polygon',coordinates:[[[100.532,13.782],[100.533,13.782],[100.533,13.783],[100.532,13.783],[100.532,13.782]]]}},
    {type:'Feature',properties:{building_id:'BLD-DEMO-003',height_m:null,floors:null,height_source:'unknown',confidence:'missing',reference_date:'2026-demo'},geometry:{type:'Polygon',coordinates:[[[100.534,13.779],[100.535,13.779],[100.535,13.780],[100.534,13.780],[100.534,13.779]]]}}
  ]};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/geo+json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${safeName(aoi.short)}_Building_Height_Footprints_MOCK.geojson`;a.click();URL.revokeObjectURL(a.href);showToast('Building-height footprint GeoJSON downloaded');
}
function showPlanningView(){mapCanvas.classList.remove('risk-view');$('#legendTitle').textContent='Planning-map legend';$('#downloadRiskMap').textContent='View risk map';closeDrawer();switchTab('centres');showToast('Returned to evacuation-planning view');}
function showRiskMap(){
  if(!assessmentComplete){if(!requireAOI())return;aiMessage('<p>Run the evacuation-planning assessment first, then open the red/yellow/green risk map as further information.</p>');return;}
  if(mapCanvas.classList.contains('risk-view'))return showPlanningView();mapCanvas.classList.remove('vulnerable-view');mapCanvas.classList.add('risk-view');$('#legendTitle').textContent='Risk-map legend';$('#downloadRiskMap').textContent='Planning view';userMessage('Show the risk map as further information.');aiMessage('<p>The secondary risk-map view shows high/red, medium/yellow and low/green points. It supports the candidate-place and vulnerable-people review but does not replace either viewpoint. Low/green does not mean safe.</p>');openDetail('centres');
}
function openRiskMap(){
  if(!aoiSelected){closeModals();aiMessage('<p>Select a Thailand district or sub-district before downloading a risk map.</p><button class="inline-action" data-action="select-aoi">Select district or sub-district</button>');openAOI();return;}
  const a=currentAOI();$('#exportAOI').textContent=`${a.name} · ${a.level}`;$('#exportScenario').textContent=`RP${selectedScenario} · ${scenarioData[selectedScenario].probability.replace(' annual chance',' AEP')}`;openModal('exportModal');
}
function prepareExport(){
  if(!aoiSelected)return openRiskMap();const aoi=currentAOI();const base=`${safeName(aoi.short)}_RP${selectedScenario}_Risk_Map_MOCK`;let content,type,ext;const levels=riskLevels[selectedScenario];
  const coords={'C-01':[100.565,13.795],'C-02':[100.570,13.785],'C-03':[100.560,13.775],'C-04':[100.575,13.770],'C-05':[100.566,13.762],'C-06':[100.535,13.795],'C-07':[100.540,13.785],'C-08':[100.530,13.780]};
  const riskFeatures=Object.entries(levels).flatMap(([level,ids])=>ids.map(id=>({type:'Feature',properties:{feature_type:'risk_point',point_id:id,risk_level:level,risk_code:{high:'H',medium:'M',low:'L'}[level],mock_result:true,safe_place:false},geometry:{type:'Point',coordinates:coords[id]}})));
  const manifest={title:'GRP AOI risk-map prototype',aoi_name:aoi.name,aoi_level:aoi.level,scenario:`RP${selectedScenario}`,annual_exceedance_probability:scenarioData[selectedScenario].probability,legend:{high:'Red / H',medium:'Yellow / M',low:'Green / L — lower modeled risk, not safe'},safe_place_map:false,real_aoi_name:true,aoi_boundary:'mocked in prototype',hazard_geometry:'mocked in prototype',risk_points:'mocked in prototype',result_values:'illustrative',first_phase_status:'illustrative planning information',method_version:'risk-map-download-demo-v0.1',production_note:'Pin and Daniel confirmed nationwide district/sub-district scope; reported-ready data is not connected in this static mock.',warning:'Not for operational use; low/green does not mean safe'};
  if(exportFormat==='SVG'){
    content=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#edf2ef"/><rect width="1200" height="100" fill="#0d3b43"/><text x="55" y="48" font-family="Arial" font-size="25" font-weight="700" fill="white">SERVIR GRP · PROVISIONAL RISK MAP</text><text x="55" y="78" font-family="Arial" font-size="15" fill="#bcd6d2">${aoi.name} · ${aoi.level} · RP${selectedScenario}</text><path d="M180 205 L850 150 L1040 340 L920 650 L300 700 L125 465 Z" fill="#dcefe8" stroke="#087b7b" stroke-width="8"/><path d="M470 140 C620 250 385 330 590 430 C760 515 560 625 720 710" fill="none" stroke="#1595bc" stroke-width="110" opacity=".35"/><text x="600" y="380" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#075f61">${aoi.short}</text><g font-family="Arial" font-size="18" font-weight="700" text-anchor="middle"><circle cx="380" cy="350" r="22" fill="#c94f3c"/><text x="380" y="356" fill="white">H</text><circle cx="530" cy="505" r="22" fill="#d39a24"/><text x="530" y="511" fill="white">M</text><circle cx="780" cy="440" r="22" fill="#31906f"/><text x="780" y="446" fill="white">L</text></g><g font-family="Arial" font-size="15" font-weight="700"><text x="930" y="175" fill="#b84433">● H · HIGH</text><text x="930" y="205" fill="#8a610d">● M · MEDIUM</text><text x="930" y="235" fill="#237557">● L · LOW (NOT SAFE)</text></g><rect x="55" y="720" width="1090" height="52" rx="8" fill="#fff0d9"/><text x="600" y="752" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="#8a5e21">REAL AOI NAME · MOCKED BOUNDARY, FLOOD GEOMETRY AND RESULTS · NOT FOR OPERATIONAL USE</text></svg>`;type='image/svg+xml';ext='svg';
  } else if(exportFormat==='GeoJSON'){
    content=JSON.stringify({type:'FeatureCollection',name:base,metadata:manifest,features:[{type:'Feature',properties:{feature_type:'AOI boundary',mock_geometry:true,aoi_name:aoi.name,aoi_level:aoi.level},geometry:{type:'Polygon',coordinates:[[[100.50,13.75],[100.58,13.75],[100.58,13.82],[100.50,13.82],[100.50,13.75]]]}},{type:'Feature',properties:{feature_type:'Flood extent',scenario:`RP${selectedScenario}`,mock_geometry:true},geometry:{type:'Polygon',coordinates:[[[100.52,13.76],[100.55,13.76],[100.56,13.81],[100.53,13.81],[100.52,13.76]]]}},...riskFeatures]},null,2);type='application/geo+json';ext='geojson';
  } else {content=JSON.stringify(manifest,null,2);type='application/json';ext='json';}
  const blob=new Blob([content],{type});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${base}.${ext}`;link.click();URL.revokeObjectURL(link.href);closeModals();showToast(`${exportFormat} AOI risk map downloaded`);
}

function send(){
  const input=$('#chatInput');const text=input.value.trim();if(!text)return;input.value='';userMessage(text);const q=text.toLowerCase();
  setTimeout(()=>{
    if(q.includes('building footprint')||q.includes('building height')||q.includes('urban')||q.includes('zoning')){purpose='urban';if(aoiSelected)runUrban();else{aiMessage('<p>I can prepare a building-footprint layer with height, floor, source and confidence attributes for urban risk-map analysis. Select the AOI first.</p><button class="inline-action" data-action="select-aoi">Select AOI</button>');openAOI();}}
    else if(q.includes('safe')||q.includes('where could')||q.includes('where can')||q.includes('move people')||q.includes('evacuat')){aiMessage('<p>I found <b>five candidate evacuation places</b> in the mocked planning screen for comparison. They show where people could potentially move, but none is officially verified safe.</p><p>Compare each candidate with nearby vulnerable-population zones and movement-support needs. Suitability and capacity are not assessed in this first phase.</p><button class="inline-action" data-action="safe-query">View candidate places</button>');}
    else if(q.includes('upload')||q.includes('own data'))openModal('uploadModal');
    else if(q.includes('risk map'))showRiskMap();
    else if(q.includes('export')||q.includes('geojson')||q.includes('shape')||q.includes('tiff'))openRiskMap();
    else if(q.includes('report')||q.includes('budget')||q.includes('investment')||q.includes('funding')){if(assessmentComplete)openModal('reportModal');else aiMessage('<p>Complete an assessment first so the report has traceable evidence.</p>');}
    else if(q.includes('people')||q.includes('vulnerab')||q.includes('age')){if(assessmentComplete){switchTab('people');aiMessage(`<p>The map now shows four <b>aggregated vulnerable-population zones</b> for ${currentAOI().short} · RP${selectedScenario}. Select V1–V4 to inspect illustrative indicators and limitations. No individual or household locations are displayed.</p>`);}else aiMessage('<p>Select the AOI and run the assessment first.</p>');}
    else if(q.includes('point')||q.includes('risk')){if(assessmentComplete){switchTab('centres');openDetail('centres');}else if(aoiSelected)aiMessage('<p>Confirm and run the risk-map simulation from the planning card.</p>');else openAOI();}
    else if(q.includes('forecast')||q.includes('warning'))aiMessage('<p>This prototype uses a static RP100 planning scenario. It has no event date, lead time or official warning status.</p>');
    else aiMessage('<p>I can help select a district/sub-district, generate a red/yellow/green risk-map simulation, explain risk points, create the risk report, download the map, or separately discuss candidate evacuation places when you ask.</p>');
  },280);
}

document.addEventListener('click',e=>{
  const purposeBtn=e.target.closest('[data-purpose]');if(purposeBtn)choosePurpose(purposeBtn.dataset.purpose);
  const scenarioBtn=e.target.closest('[data-scenario]');if(scenarioBtn)selectScenario(scenarioBtn.dataset.scenario);
  const proximityBtn=e.target.closest('[data-proximity-threshold]');if(proximityBtn)selectProximityThreshold(proximityBtn.dataset.proximityThreshold);
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='select-aoi')openAOI();if(action==='candidate')startCandidate();if(action==='safe-query'){switchTab('centres');openDetail('safeplaces');}if(action==='planning-view')showPlanningView();if(action==='risk-download')openRiskMap();if(action==='building-export')downloadBuildingData();if(action==='centre-report'||action==='candidate-report'){closeDrawer();openModal('reportModal');}if(action==='centre-guidance'){closeDrawer();switchTab('guidance');}
  const aoi=e.target.closest('[data-aoi]');if(aoi)selectAOI(aoi.dataset.aoi);
  const candidatePlace=e.target.closest('[data-candidate-id]');if(candidatePlace)openCandidatePlace(candidatePlace.dataset.candidateId);
  const vulnerability=e.target.closest('[data-vulnerability-id]');if(vulnerability)openVulnerabilityZone(vulnerability.dataset.vulnerabilityId);
  const centre=e.target.closest('[data-center]');if(centre&&centre.dataset.center!=='candidate')openCentre(centre.dataset.center);if(centre?.dataset.center==='candidate')openDetail('candidate');
  const detail=e.target.closest('[data-detail]');if(detail)openDetail(detail.dataset.detail);
  const tab=e.target.closest('[data-tab]');if(tab)switchTab(tab.dataset.tab);
  const uploadBtn=e.target.closest('[data-upload-type]');if(uploadBtn)selectUploadType(uploadBtn);
  const format=e.target.closest('[data-format]');if(format){$$('[data-format]').forEach(b=>b.classList.remove('selected'));format.classList.add('selected');exportFormat=format.dataset.format;$('#downloadExport').textContent=`Download ${exportFormat} risk map →`;}
  if(e.target.closest('[data-close-modal]'))closeModals();
});
$('#aoiSelector').addEventListener('click',()=>aoiMenu.classList.toggle('open'));
$('#aoiSearch').addEventListener('input',e=>{$$('[data-aoi]',aoiMenu).forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase().trim()));});
$('#candidateTool').addEventListener('click',promptLocationQuestion);
$('#uploadTool').addEventListener('click',()=>openModal('uploadModal'));
$('#attachBtn').addEventListener('click',()=>openModal('uploadModal'));
$('#exportTool').addEventListener('click',showRiskMap);
$('#downloadRiskMap').addEventListener('click',showRiskMap);
$('#createReport').addEventListener('click',()=>openModal('reportModal'));
$('#mapArt').addEventListener('click',e=>{if(candidateMode&& !e.target.closest('[data-center]'))placeCandidate();});
$('#demoFile').addEventListener('click',demoFile);
$('#rerunUpload').addEventListener('click',rerunUpload);
$('#generateReport').addEventListener('click',generateReport);
$('#downloadExport').addEventListener('click',prepareExport);
$('#closeDrawer').addEventListener('click',closeDrawer);backdrop.addEventListener('click',closeDrawer);
$('#closePanel').addEventListener('click',hideInfoPanel);
$('#showPanel').addEventListener('click',()=>showInfoPanel());
$('#legendToggle').addEventListener('click',e=>{const legend=$('#legend');legend.classList.toggle('collapsed');e.target.textContent=legend.classList.contains('collapsed')?'+':'−';});
$('#newChat').addEventListener('click',()=>location.reload());
$('#sendBtn').addEventListener('click',send);$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
