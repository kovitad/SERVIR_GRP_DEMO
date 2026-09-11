(() => {
  'use strict';
  const data = window.MVP1_MOCK;
  const state = { role: new URLSearchParams(location.search).get('role') || 'planner', scenario: new URLSearchParams(location.search).get('state') || 'happy', story: 'US-01', screen: location.hash.slice(1) || 'launcher', rp: '100', filter: 'all' };
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const realEvidence = text => /requires|real |golden|determin|parity|restore|physical|implementation/i.test(text);

  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2600); }
  function role() { return data.roles[state.role] || data.roles.planner; }
  function setRole(next) {
    state.role=next;
    $$('#roleChoices button').forEach(b=>b.classList.toggle('selected',b.dataset.role===next));
    const actor=next==='signedout'?{name:'Signed out',role:'Visitor',initials:'—'}:role();
    $('#userInitials').textContent=actor.initials; $('#userName').textContent=actor.name; $('#userRole').textContent=actor.role;
    renderSupport();
  }
  function setStory(id) {
    state.story=id;
    const story=data.stories[id];
    if(!story)return;
    $('#criteriaStory').textContent=id; $('#criteriaTitle').textContent=story.title; $('#criteriaScreens').textContent=story.screens; $('#criteriaDecisions').textContent=story.decisions;
    $('#criteriaList').innerHTML=story.criteria.map(text=>`<div class="criterion ${realEvidence(text)?'real':'ux'}"><i></i><span>${escapeHtml(text)}</span></div>`).join('');
  }
  function showScreen(name, story) {
    const defaultStories={signin:'US-01',sources:'US-03',configure:'US-06',results:'US-09',downloads:'US-11',support:'US-12'};
    if(name==='mcp')setAlignmentCriteria(); else if(story)setStory(story); else if(defaultStories[name])setStory(defaultStories[name]);
    state.screen=name;
    $$('[data-screen-panel]').forEach(p=>p.hidden=p.dataset.screenPanel!==name);
    $$('.side-nav [data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
    history.replaceState(null,'',`${location.pathname}${location.search}#${name}`);
    window.scrollTo({top:0,behavior:'instant'});
    $('#mainContent').focus({preventScroll:true});
    if(name==='mcp')renderMcp();
    if(name==='signin')renderAuth();
    if(name==='results')renderResults();
    if(name==='downloads')renderDownloads();
    if(name==='support')renderSupport();
  }
  function setAlignmentCriteria() {
    $('#criteriaStory').textContent='MCP-ALIGN'; $('#criteriaTitle').textContent='Confirm the Hub–platform responsibility boundary'; $('#criteriaScreens').textContent='Capability map; evidence pack; receipt; refusal and outage states'; $('#criteriaDecisions').textContent='Jordan/SIG connection, data, analytics, contribution and receipt privacy';
    const items=['Current capabilities and declared gaps are visibly separated','Hub and MCP ownership is presented as a hypothesis','MCP token remains outside the browser experience','Grounding is separated from scientific approval','Evidence tiers, missing evidence and receipt scope are explicit','Live tool contracts and privacy require workshop evidence'];
    $('#criteriaList').innerHTML=items.map(text=>`<div class="criterion ${realEvidence(text)?'real':'ux'}"><i></i><span>${escapeHtml(text)}</span></div>`).join('');
  }
  function renderStoryGrid() {
    $('#storyGrid').innerHTML=Object.entries(data.stories).map(([id,s])=>`<button data-story-card="${id}"><b>${id}</b><small>${escapeHtml(s.title)}</small></button>`).join('');
    $$('[data-story-card]').forEach(b=>b.addEventListener('click',()=>{setStory(b.dataset.storyCard);$('#criteriaPanel').classList.remove('closed');$('.layout').classList.remove('criteria-closed');}));
  }
  function renderAuth() {
    const card=$('#authCard');
    if(state.role==='unauthorized'||state.scenario==='cross-hub') {
      card.innerHTML=`<p class="eyebrow">IDENTITY CONFIRMED</p><h2>Access not authorized</h2><p>Your account is not currently assigned to this workspace. No private workspace information has been displayed.</p><div class="warning callout" style="display:block"><b>Support reference</b><p>AUTH-20260904-018</p></div><button class="quiet full" data-return-launcher>Return</button>`;
    } else if(state.role==='planner'||state.role==='support'||state.role==='developer') {
      card.innerHTML=`<p class="eyebrow">AUTHORIZED ACCESS</p><h2>Sign in to your workspace</h2><p>Continue through your approved organization identity provider.</p><button class="primary full" id="signInButton">Continue with organization account</button><p class="micro">Production requires OIDC, verified Hub claims, durable sessions and revocation. This click is simulated.</p>`;
      $('#signInButton').addEventListener('click',()=>state.role==='support'?showScreen('support','US-12'):state.role==='developer'?showScreen('mcp'):showScreen('sources','US-03'));
    } else {
      card.innerHTML=`<p class="eyebrow">AUTHORIZED ACCESS</p><h2>Sign in to your workspace</h2><p>Continue through your approved organization identity provider.</p><button class="primary full" id="signInButton">Continue with organization account</button><p class="micro">No private workspace data is visible while signed out.</p>`;
      $('#signInButton').addEventListener('click',()=>{setRole('planner');toast('Simulated identity verified');showScreen('sources','US-03');});
    }
    $('[data-return-launcher]')?.addEventListener('click',()=>showScreen('launcher','US-01'));
  }
  function renderMcp() {
    const counts={available:data.mcpCapabilities.filter(x=>x.state==='available').length,gap:data.mcpCapabilities.filter(x=>x.state==='gap').length,hub:data.mcpCapabilities.filter(x=>x.state==='hub').length};
    $('#mcpContent').innerHTML=`<div class="mcp-summary"><div class="kpi"><b>${counts.available}</b><small>SIG capability patterns available</small></div><div class="kpi"><b>${counts.gap}</b><small>Unconfirmed or declared gaps</small></div><div class="kpi"><b>${counts.hub}</b><small>Capabilities expected in Hub application</small></div></div>
      <section class="mcp-capabilities"><div class="mcp-row header"><span>MVP NEED</span><span>PROPOSED OWNER</span><span>CURRENT UNDERSTANDING</span><span>STATE</span></div>${data.mcpCapabilities.map(x=>`<div class="mcp-row"><b>${escapeHtml(x.need)}</b><span>${escapeHtml(x.owner)}</span><span>${escapeHtml(x.position)}</span><span class="mcp-state ${x.state}">${x.state==='available'?'AVAILABLE':x.state==='hub'?'HUB':x.state==='decision'?'DECIDE':'GAP/TBC'}</span></div>`).join('')}</section>
      <div class="ownership-flow"><div class="ownership-node"><b>Planner browser</b><p>Business workflow and evidence views. No MCP token or raw tool JSON.</p></div><span class="flow-arrow">→</span><div class="ownership-node"><b>Hub backend</b><p>OIDC, Hub authorization, private data, assessment and server-held MCP credential.</p></div><span class="flow-arrow">→</span><div class="ownership-node"><b>SIG MCP</b><p>Evidence discovery, packs, groundedness checks and durable receipts.</p></div><span class="flow-arrow">→</span><div class="ownership-node"><b>Sources</b><p>Registered archives and feeds; Thailand/JRC coverage must be confirmed.</p></div></div>
      <div class="launcher-grid" style="margin-top:18px"><section class="card"><p class="eyebrow">DEVELOPER READINESS</p><h2>Before Jordan training</h2><div class="developer-checks"><label>□ Runbook reviewed</label><label>□ VPN/access approved</label><label>□ Endpoint received</label><label>□ Token delivered securely</label><label>□ platform_capabilities called</label><label>□ Declared gaps recorded</label><label>□ Test pack created</label><label>□ Receipt reopened</label></div></section><section class="card"><p class="eyebrow">CRITICAL BOUNDARY</p><h2>Do not treat grounding as scientific approval</h2><p><b>Evidence traceability check passed</b> means claims resolve to the pack. It does not mean the source, GIS method or operational decision is correct.</p><button class="primary full" id="viewEvidencePack">Preview evidence pack and receipt</button></section></div>`;
    $('#viewEvidencePack').addEventListener('click',evidencePackModal);
  }
  function sourceCard(origin,title,provider,status,extra='') {
    return `<article class="source-card"><header><span class="origin">${escapeHtml(origin)}</span><span class="status ${status==='Available'?'':'tbc'}">${escapeHtml(status)}</span></header><h3>${escapeHtml(title)}</h3><p>Provider: ${escapeHtml(provider)}</p>${extra}</article>`;
  }
  function renderSources() {
    $('#sourceContent').innerHTML=`
      <section class="source-group"><h2>Flood hazard</h2><div class="source-cards">${sourceCard('PLATFORM-PROVIDED','JRC flood-hazard layers','European Commission Joint Research Centre','Available','<p>RP10, RP20, RP50, RP75, RP100, RP200 and RP500 · edition TBC</p>')}${sourceCard('SAVED LOCAL','September flood planning study','Bangkok Metropolitan Administration','Available','<p>Saved 4 Sep 2026 · illustrative</p>')}</div></section>
      <section class="source-group"><h2>Evacuation centers</h2><div class="source-cards">${sourceCard('PLATFORM-PROVIDED','Thailand evacuation-center register','TBC — DDPM must not be assumed','Needs decision')}${sourceCard('SAVED LOCAL',data.sources.centers.title,data.sources.centers.provider,'Available',`<p>Data date: ${data.sources.centers.dataDate} · ID: ${data.sources.centers.id}</p>`)}</div></section>
      <section class="source-group"><h2>Vulnerable people</h2><div class="source-cards">${sourceCard('PLATFORM-PROVIDED',data.sources.vulnerability.title,'TBC','Needs decision','<p>Normalized index, 0–1 · not a population count</p>')}${sourceCard('SAVED LOCAL','No current local dataset','—','Unavailable','<p>Upload type remains TBC for MVP 1.</p>')}</div></section>`;
  }
  function openModal(html) { $('#modalContent').innerHTML=html; $('#modal').showModal(); $('[data-close-dialog]')?.addEventListener('click',()=>$('#modal').close()); }
  function uploadModal() {
    const failed=state.scenario==='upload-error';
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-03 · STEP 1 OF 3</p><h2>Upload local dataset</h2></div><button data-close-dialog aria-label="Close">×</button></div><div class="steps"><span class="active"></span><span></span><span></span></div><label class="field"><span>Dataset type</span><select><option>Evacuation centers</option><option>Flood scenario</option><option disabled>Vulnerable people — TBC</option><option disabled>Administrative boundary — TBC</option></select></label><label class="field"><span>Agency/provider</span><input value="Bangkok Metropolitan Administration"></label><label class="field"><span>Dataset title</span><input value="Phaya Thai evacuation-center register"></label><label class="field"><span>Data date</span><input type="date" value="2026-08-15"></label><label class="field"><span>Demonstration file</span><select><option>${failed?'centers-without-crs.geojson':'phaya-thai-centers.geojson'}</option></select><small>Proposed baseline: GeoJSON or zipped Shapefile · maximum 25 MB (TBC)</small></label><button class="primary full" id="simulateValidation">Simulate validation →</button></div>`);
    $('#simulateValidation').addEventListener('click',()=>validationModal(failed));
  }
  function validationModal(failed) {
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-03 · VALIDATION RESULT</p><h2>${failed?'Validation failed':'Usable with warnings'}</h2></div><button data-close-dialog>×</button></div><div class="steps"><span class="active"></span><span class="active"></span><span></span></div><div class="validation-list"><div><span>File signature and readability</span><b>Passed</b></div><div><span>Coordinate reference system</span><b>${failed?'Missing':'EPSG:4326'}</b></div><div><span>Geographic extent</span><b>${failed?'Not checked':'Intersects supported area'}</b></div><div><span>Required fields</span><b>${failed?'Not checked':'Passed'}</b></div><div><span>Records</span><b>${failed?'—':'14 read · 2 warnings'}</b></div></div><div class="warning callout" style="display:block"><b>${failed?'Blocking error':'Warnings retained'}</b><p>${failed?'The platform cannot reliably place this data on the map. Export it with a declared CRS and upload again.':'CTR-003 has no coordinates. CTR-004 has invalid geometry. Both remain Unable to assess.'}</p></div>${failed?'<button class="primary full" id="tryAgain">Choose another file</button>':'<button class="primary full" id="saveDataset">Save current dataset →</button>'}</div>`);
    $('#tryAgain')?.addEventListener('click',uploadModal);
    $('#saveDataset')?.addEventListener('click',saveModal);
  }
  function saveModal() {
    const failed=state.scenario==='replace-error';
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-04 · CURRENT DATASET</p><h2>${failed?'Replace current dataset?':'Save current dataset?'}</h2></div><button data-close-dialog>×</button></div><p>This item will be linked to the authenticated Thailand Planning workspace and remain available in later sessions.</p><div class="warning callout" style="display:block"><b>One-current-item rule</b><p>MVP 1 does not provide version history, rollback or side-by-side comparison.</p></div>${failed?'<label><input type="checkbox" id="replaceConfirm"> I understand that the current item will be replaced only after a successful save.</label>':''}<button class="primary full" id="confirmSave" style="margin-top:16px">${failed?'Simulate replacement':'Save dataset'}</button></div>`);
    $('#confirmSave').addEventListener('click',()=>{
      if(failed&&!$('#replaceConfirm').checked){toast('Confirm the replacement rule first');return;}
      openModal(`<div class="modal-body"><p class="eyebrow">US-04</p><h2>${failed?'Replacement was not completed':'Dataset saved'}</h2><p>${failed?'The proposed replacement could not be saved. Your current usable dataset remains unchanged.':'The current local dataset is available to authorized workspace users.'}</p><div class="validation-list"><div><span>Dataset ID</span><b>${data.sources.centers.id}</b></div><div><span>Current item</span><b>BMA register · 15 Aug 2026</b></div><div><span>Status</span><b>${failed?'Previous item preserved':'Available'}</b></div></div><button class="primary full" data-close-dialog>Done</button></div>`);
      $('[data-close-dialog]').addEventListener('click',()=>$('#modal').close());
    });
  }
  function renderScenarioOptions() {
    $('#scenarioOptions').innerHTML=data.scenarios.map(s=>`<button type="button" class="scenario-option ${s.value===state.rp?'selected':''}" data-rp="${s.value}"><b>RP${s.value}</b><small>${s.annual} annual chance</small></button>`).join('');
    $$('.scenario-option').forEach(b=>b.addEventListener('click',()=>{state.rp=b.dataset.rp;renderScenarioOptions();}));
  }
  function confirmationModal() {
    const hazard={...data.sources.hazard,title:`JRC RP${state.rp} flood-hazard layer`,id:`JRC-FLOOD-RP${state.rp}-TBC`};
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-06 · CONFIRM INPUTS</p><h2>Review and run assessment</h2></div><button data-close-dialog>×</button></div><div class="validation-list"><div><span>Area</span><b>${data.assessment.area}</b></div><div><span>Flood</span><b>${hazard.title}</b></div><div><span>Centers</span><b>${data.sources.centers.title}</b></div><div><span>Vulnerability</span><b>${data.sources.vulnerability.title}</b></div><div><span>Exposure method</span><b>${data.assessment.methods.exposure}</b></div></div><label><input type="checkbox" id="limitsConfirm"> I understand this identifies potential exposure and does not declare a center safe or suitable.</label><button class="primary full" id="runAssessment" style="margin-top:16px">Run assessment</button></div>`);
    $('#runAssessment').addEventListener('click',()=>{if(!$('#limitsConfirm').checked){toast('Confirm the decision-support limitation first');return;}$('#modal').close();if(state.scenario==='calculation-error')showFailure();else{toast('Simulated assessment complete');showScreen('results','US-07');}});
  }
  function showFailure() {
    openModal(`<div class="modal-body"><p class="eyebrow">US-07 · CONTROLLED FAILURE</p><h2>Assessment failed</h2><p>The flood-exposure calculation could not be completed. No result values were created.</p><div class="validation-list"><div><span>Assessment</span><b>ASM-TH-20260904-002</b></div><div><span>Support reference</span><b>TRC-8A73F090</b></div><div><span>Category</span><b>Analytical failure</b></div></div><button class="primary full" id="failureSupport">Open support view</button></div>`);
    $('#failureSupport').addEventListener('click',()=>{$('#modal').close();setRole('support');showScreen('support','US-12');});
  }
  function counts() { const scenario=data.scenarios.find(s=>s.value===state.rp)||data.scenarios[4]; return {exposed:scenario.counts[0],clear:scenario.counts[1],unable:scenario.counts[2],total:scenario.counts.reduce((a,b)=>a+b,0)}; }
  function statusLabel(status) { return status==='exposed'?'Potentially exposed':status==='clear'?'Not exposed under selected scenario':'Unable to assess'; }
  function renderResults() {
    const c=counts(), vulnerabilityFailed=state.scenario==='vulnerability-error';
    const mcpNotice=state.scenario==='mcp-gap'?'<div class="warning callout" style="display:block;margin-top:14px"><b>Evidence request declined</b><p>The requested JRC source is not registered in the current platform catalogue. Use an approved caller-supplied source or agree a source-onboarding path.</p></div>':state.scenario==='verification-error'?'<div class="warning callout" style="display:block;margin-top:14px"><b>Draft cannot be released</b><p>The claim “Center CTR-001 is safe” is unsupported. Remove it or provide approved evidence. The exposure result itself remains unchanged.</p></div>':state.scenario==='mcp-unavailable'?'<div class="warning callout" style="display:block;margin-top:14px"><b>Assessment completed · evidence receipt unavailable</b><p>Hub analysis completed, but the MCP evidence service could not be reached. No evidence pack or receipt was created. Policy for viewing/downloading this result is TBC.</p></div>':'';
    $('#resultContent').innerHTML=`<div class="result-header"><div><p class="eyebrow">EPIC 3–4 · US-07–US-10</p><h1>${data.assessment.area} · JRC RP${state.rp}</h1><p>${data.assessment.id} · ${data.assessment.status}</p></div><div class="result-warning"><b>Planning evidence only</b><br>Not a forecast or determination of safety, suitability or official approval.</div></div>
      ${mcpNotice}${vulnerabilityFailed?'<div class="warning callout" style="display:block;margin-top:14px"><b>Vulnerability information unavailable</b><p>Center exposure completed, but the raster has incomplete coverage. Refinement decision R-06: should center-only results remain viewable?</p></div>':''}
      <div class="kpis"><div class="kpi"><b>${c.total}</b><small>In-scope centers</small></div><div class="kpi"><b>${c.exposed}</b><small>▲ Potentially exposed</small></div><div class="kpi"><b>${c.clear}</b><small>○ Not exposed under scenario</small></div><div class="kpi"><b>${c.unable}</b><small>? Unable to assess</small></div></div>
      <div class="results-grid"><div><div class="result-map" id="resultMap"><div class="flood-shape"></div>${vulnerabilityFailed?'':'<div class="vulnerability-shape"></div>'}${allCenters().filter(x=>x.x!==null).map(x=>`<button class="marker ${x.status}" data-center-marker="${x.id}" style="left:${x.x}%;top:${x.y}%" aria-label="${escapeHtml(x.name)} · ${statusLabel(x.status)}">${x.id.slice(-2)}</button>`).join('')}<div class="map-legend"><b>Layers</b><span>Blue · JRC RP${state.rp} flood layer</span><span>Purple hatch · Vulnerability index</span><span>▲ Red · Potentially exposed</span><span>○ Green · Not exposed</span></div></div><section class="card chart-card"><h2>Normalized vulnerability index distribution</h2><p class="micro">Area share—not number of people. Provider and aggregation method TBC.</p>${vulnerabilityFailed?'<p><b>Unavailable due to incomplete raster coverage.</b></p>':`<div class="bars">${data.vulnerabilityBands.map(b=>`<div class="bar"><span>${b.label}</span><div><i style="width:${b.value*3}%"></i></div><b>${b.value}%</b></div>`).join('')}</div>`}</section></div>
      <section class="center-panel"><header><b>Evacuation centers</b><div class="center-filters"><button class="selected" data-filter="all">All ${c.total}</button><button data-filter="exposed">Exposed ${c.exposed}</button><button data-filter="clear">Not exposed ${c.clear}</button><button data-filter="unable">Unable ${c.unable}</button></div></header><div class="center-list" id="centerList"></div></section></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="quiet" id="evidenceButton">Review sources & limitations</button><button class="quiet" id="packButton" ${state.scenario==='mcp-unavailable'?'disabled':''}>Evidence pack</button><button class="quiet" id="receiptButton" ${['mcp-unavailable','mcp-gap','verification-error'].includes(state.scenario)?'disabled':''}>Evidence receipt</button><button class="primary" id="toDownloads">Download evidence →</button></div>`;
    renderCenterList();
    $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderCenterList();}));
    $$('[data-center-marker]').forEach(b=>b.addEventListener('click',()=>openCenter(b.dataset.centerMarker)));
    $('#evidenceButton').addEventListener('click',evidenceModal); $('#packButton').addEventListener('click',evidencePackModal); $('#receiptButton').addEventListener('click',receiptModal); $('#toDownloads').addEventListener('click',()=>showScreen('downloads','US-11'));
  }
  function allCenters() {
    const c=counts(), assessable=data.centers.filter(x=>x.status!=='unable').sort((a,b)=>(b.status==='exposed')-(a.status==='exposed'));
    const exposedIds=new Set(assessable.slice(0,c.exposed).map(x=>x.id));
    return data.centers.map(x=>({...x,status:x.status==='unable'?'unable':exposedIds.has(x.id)?'exposed':'clear'}));
  }
  function visibleCenters() {
    const items=allCenters();
    return state.filter==='all'?items:items.filter(x=>x.status===state.filter);
  }
  function renderCenterList() {
    $('#centerList').innerHTML=visibleCenters().map(c=>`<button class="center-row" data-center-row="${c.id}"><i class="${c.status}">${c.status==='exposed'?'▲':c.status==='clear'?'○':'?'}</i><span><b>${escapeHtml(c.name)}</b><small>${c.id} · ${statusLabel(c.status)}</small></span></button>`).join('');
    $$('[data-center-row]').forEach(b=>b.addEventListener('click',()=>openCenter(b.dataset.centerRow)));
  }
  function openCenter(id) {
    const base=data.centers.find(x=>x.id===id), current=visibleCenters().find(x=>x.id===id)||base;
    const reason=current.status==='exposed'?'Geometry intersects the selected flood exposure area.':current.status==='clear'?'Valid geometry does not intersect the selected flood exposure area.':base.reason;
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-10 · CENTER EVIDENCE</p><h2>${escapeHtml(base.name)}</h2></div><button data-close-dialog>×</button></div><div class="validation-list"><div><span>Center ID</span><b>${base.id}</b></div><div><span>Status</span><b>${statusLabel(current.status)}</b></div><div><span>Reason</span><b>${escapeHtml(reason)}</b></div><div><span>Flood source</span><b>JRC RP${state.rp} · edition TBC</b></div><div><span>Center source</span><b>BMA register · 15 Aug 2026</b></div><div><span>Method</span><b>${data.assessment.methods.exposure}</b></div></div><div class="warning callout" style="display:block"><b>Not assessed</b><p>Capacity, building condition, accessibility, route viability, suitability and official approval.</p></div></div>`);
  }
  function evidenceModal() {
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">US-10 · PROVENANCE</p><h2>Sources, methods and limitations</h2></div><button data-close-dialog>×</button></div><div class="validation-list"><div><span>Boundary</span><b>Provider/edition TBC · Unverified</b></div><div><span>Flood</span><b>JRC RP${state.rp} · edition TBC</b></div><div><span>Centers</span><b>BMA · saved local</b></div><div><span>Vulnerability</span><b>Provider TBC · normalized index</b></div><div><span>Exposure method</span><b>${data.assessment.methods.exposure}</b></div><div><span>Result contract</span><b>${data.assessment.methods.contract}</b></div></div><p class="micro">Missing provenance remains Unverified rather than being presented as authoritative.</p></div>`);
  }
  function evidencePackModal() {
    const p=data.evidencePack;
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">MCP EVIDENCE PACK · SIMULATED</p><h2>Governed evidence for the assessment</h2></div><button data-close-dialog>×</button></div><p><b>Question</b><br>${escapeHtml(p.question)}</p><div class="artifact-chain"><div class="artifact"><small>ASSESSMENT</small><b>${data.assessment.id}</b></div><span>→</span><div class="artifact"><small>PACK</small><b>${p.id}</b></div><span>→</span><div class="artifact"><small>DRAFT</small><b>${p.reportId}</b></div></div><div class="validation-list"><div><span>JRC RP${state.rp} flood layer</span><b><i class="evidence-tier">PLATFORM-REGISTERED · TBC</i></b></div><div><span>BMA center register</span><b><i class="evidence-tier">CALLER-SUPPLIED</i></b></div><div><span>Center exposure result</span><b>${data.assessment.methods.exposure}</b></div></div><h3>What is missing</h3><div class="gap-list">${p.gaps.map(g=>`<span>${escapeHtml(g)}</span>`).join('')}</div><div class="warning callout" style="display:block;margin-top:14px"><b>Prototype boundary</b><p>No real MCP call occurred. Evidence tiers, identifiers and visibility must be confirmed with Jordan.</p></div><button class="primary full" id="openReceiptFromPack">Preview receipt →</button></div>`);
    $('#openReceiptFromPack').addEventListener('click',receiptModal);
  }
  function receiptModal() {
    const p=data.evidencePack;
    openModal(`<div class="modal-body"><div class="modal-head"><div><p class="eyebrow">DURABLE RECEIPT · SIMULATED</p><h2>Evidence receipt</h2></div><button data-close-dialog>×</button></div><div class="artifact-chain"><div class="artifact"><small>ASSESSMENT ID</small><b>${data.assessment.id}</b></div><span>→</span><div class="artifact"><small>PACK ID</small><b>${p.id}</b></div><span>→</span><div class="artifact"><small>RECEIPT ID</small><b>${p.receiptId}</b></div></div><div class="validation-list"><div><span>Evidence traceability verdict</span><b>Passed · illustrative</b></div><div><span>Scientific approval</span><b>Not established</b></div><div><span>Human review</span><b>Required</b></div><div><span>Human override</span><b>None declared</b></div><div><span>Receipt visibility</span><b>TBC with SIG/security</b></div></div><div class="warning callout" style="display:block"><b>What this receipt means</b><p>Claims are traceable to the recorded evidence pack. It does not prove that sources are correct, the GIS method is approved, or any center is safe or suitable.</p></div></div>`);
  }
  function renderDownloads() {
    const failed=state.scenario==='export-error',c=counts();
    $('#downloadContent').innerHTML=`${failed?'<div class="warning callout" style="display:block"><b>Download could not be prepared</b><p>The assessment remains available. No incomplete file was created. Support reference: EXPORT-20260904-006</p></div>':''}<div class="download-grid">
      <article class="download-card"><p class="eyebrow">PROPOSED PDF</p><h2>One-page assessment summary</h2><p>Area, scenario, center counts, vulnerability metric, sources, methods, warnings, limitations and support reference.</p><div class="document-preview"><p>SERVIR GLOBAL RISK PLATFORM</p><h3>Flood-exposure planning summary</h3><b>${data.assessment.area} · RP${state.rp}</b><hr><p>${c.total} centers · ${c.exposed} potentially exposed · ${c.unable} unable to assess</p><div class="preview-map"></div><p>Planning support only · ${data.assessment.id}</p></div><button class="primary full download-action" ${failed?'disabled':''}>Preview one-page summary</button></article>
      <article class="download-card"><p class="eyebrow">PROPOSED PDF / PNG</p><h2>Evacuation map</h2><p>Boundary, JRC flood layer, all valid center geometries, vulnerability overlay, readable legends and support reference.</p><div class="document-preview"><h3>Evacuation planning map</h3><b>${data.assessment.area}</b><div class="preview-map" style="height:68%;margin-top:8px"></div><p>▲ Potentially exposed · ○ Not exposed · ? Unable</p><p>${data.assessment.traceId}</p></div><button class="primary full download-action" ${failed?'disabled':''}>Preview evacuation map</button></article></div><div class="warning callout" style="display:block;margin-top:16px"><b>Explicitly out of scope</b><p>Automatic full funding pitch deck, funding recommendation and publishing private results.</p></div>`;
    $$('.download-action').forEach(b=>b.addEventListener('click',()=>toast('Preview only — real renderer spike required')));
  }
  function renderSupport() {
    const content=$('#supportContent'); if(!content)return;
    if(state.role!=='support') { content.innerHTML=`<div class="card"><h2>Support authorization required</h2><p>Your current role cannot access operational assessment records.</p><p class="micro">Hiding this screen is not sufficient. Production requires server-side authorization.</p><button class="primary" id="simulateSupport">Simulate authorized support role</button></div>`; $('#simulateSupport')?.addEventListener('click',()=>{setRole('support');renderSupport();}); return; }
    content.innerHTML=`<div class="card"><label class="field"><span>Assessment or support reference</span><div class="support-search"><input id="supportSearch" value="${data.assessment.id}"><button class="primary" id="supportFind">Find assessment</button></div></label></div><div class="support-grid" id="supportResult"><section class="card"><h2>Diagnostic timeline</h2><p>${data.assessment.id} · ${data.assessment.traceId}</p><ul class="timeline"><li><span>11:04:38</span><b>Authorization</b><em>Passed</em></li><li><span>11:04:39</span><b>Input resolution</b><em>Passed</em></li><li><span>11:04:42</span><b>Center exposure</b><em>Passed · 2 warnings</em></li><li><span>11:04:51</span><b>Vulnerability</b><em>${state.scenario==='vulnerability-error'?'Unavailable':'Passed'}</em></li><li><span>11:04:57</span><b>Result storage</b><em>Passed</em></li><li><span>11:05:04</span><b>Assessment</b><em>Completed</em></li>${state.scenario==='export-error'?'<li><span>11:07:18</span><b>PDF export</b><em style="color:#b54842">Failed</em></li>':''}</ul><p class="micro">No passwords, tokens, cookies, raw files or unrestricted stack traces are shown.</p></section><aside class="card"><h2>Lean service health</h2><div class="health-row"><span>Application process</span><b>Healthy</b></div><div class="health-row"><span>Disk capacity</span><b>61% used</b></div><div class="health-row"><span>SQLite integrity</span><b>Healthy · mock</b></div><div class="health-row"><span>Dataset integrity</span><b>Healthy · mock</b></div><div class="health-row"><span>Last backup</span><b>4 Sep · success</b></div><div class="health-row"><span>Last restore test</span><b style="color:#b36b16">Requires exercise</b></div><div class="health-row"><span>RPO / RTO</span><b style="color:#b36b16">TBC</b></div></aside></div>`;
    $('#supportFind').addEventListener('click',()=>toast('Assessment found · controlled fields only'));
  }

  $$('.side-nav [data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen,b.dataset.story)));
  $('#criteriaToggle').addEventListener('click',()=>{const closed=$('#criteriaPanel').classList.toggle('closed');$('.layout').classList.toggle('criteria-closed',closed);$('#criteriaToggle').setAttribute('aria-pressed',String(!closed));});
  $('#closeCriteria').addEventListener('click',()=>{$('#criteriaPanel').classList.add('closed');$('.layout').classList.add('criteria-closed');$('#criteriaToggle').setAttribute('aria-pressed','false');});
  $('#userButton').addEventListener('click',()=>toast(`${state.role==='signedout'?'Signed out':role().name} · simulated role`));
  $('#scenarioSelect').value=state.scenario;
  $('#scenarioSelect').addEventListener('change',e=>state.scenario=e.target.value);
  $$('#roleChoices button').forEach(b=>b.addEventListener('click',()=>setRole(b.dataset.role)));
  $('#startJourney').addEventListener('click',()=>showScreen('signin','US-01'));
  $('#openUpload').addEventListener('click',uploadModal);
  $('#reviewRun').addEventListener('click',confirmationModal);
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close();});
  renderStoryGrid(); renderSources(); renderScenarioOptions(); setRole(state.role); setStory(state.story); showScreen(state.screen);
})();
