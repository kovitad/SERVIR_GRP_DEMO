(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const workspace = $('#assuranceWorkspace');
  const content = $('#assuranceContent');
  const status = $('#assuranceConnection');
  let result = null;
  let active = 'answer';
  let busy = false;
  let history = null;
  let historyLoading = false;
  let historyError = '';
  let selectedTraceId = null;
  let historyLanguage = 'all';
  let historyStatus = 'all';
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;

  const copy = {
    en:{
      assurance:'AI assurance', back:'Back to planning', live:'LIVE OBSERVABILITY', unavailable:'LIVE SERVICE UNAVAILABLE',
      explain:'Explain with AI', runHint:'Run the Phaya Thai RP100 assessment first.', running:'Generating and tracing the explanation…',
      answer:'Planning explanation', trace:'Trace detail', evaluation:'Evaluation', compare:'Compare versions', dashboard:'Assurance dashboard',
      human:'AI output requires authorised human review.', evidence:'Governed evidence', limitations:'Limitations', actions:'Reviewer feedback',
      helpful:'Helpful', notHelpful:'Not helpful', openLangfuse:'Open this trace in Langfuse', noRun:'No live trace yet',
      noRunBody:'Complete the Phaya Thai RP100 assessment and select Explain with AI. The backend will generate an answer and write the request, operations, evaluations and metrics to Langfuse.',
      failure:'The observable AI request failed', retry:'Try again', operation:'Operation', duration:'Duration', status:'Status',
      checks:'Deterministic checks', judges:'Narrow AI judges', calibration:'Judge results are AI-generated and require calibration against human labels.',
      baseline:'Baseline', candidate:'Current live run', release:'Release recommendation', proceed:'REVIEW BEFORE RELEASE',
      metric:'Metric', traced:'Traced request', latency:'Total latency', tokens:'Total tokens', cost:'Estimated request cost', quality:'Checks passed',
      governance:'Governance', masking:'Restricted pilot context only', retention:'Requires owner confirmation', model:'Model', versions:'Versions',
      liveNote:'Real OpenAI response · real Langfuse trace · illustrative GRP evidence', feedbackSaved:'Feedback recorded in Langfuse',
      inputOutput:'Input / output', traceId:'Trace ID', tokensWord:'tokens', evidenceIncomplete:'Evidence IDs incomplete', usefulnessUnknown:'Action usefulness: unknown',
      realTrace:'Real trace', reviewCalibration:'Review the live trace and calibrate all narrow judges against human-labelled cases before a release decision.',
      pilotCoverage:'100% of this pilot run', liveRequest:'live request', estimateBilling:'estimate · verify provider billing', deterministic:'deterministic',
      access:'Access', privateProject:'Configured Langfuse project', humanReview:'Human review', required:'Required', maskingLabel:'Masking', retentionLabel:'Retention',
      success:'success', pass:'pass', fail:'fail', unknown:'unknown',
      exportedRuns:'Exported runs', feedbackCoverage:'Feedback coverage', groundednessReview:'Groundedness review', workflowCompleteness:'Workflow completeness',
      staticExport:'Static Langfuse export', eventPeriod:'Event period', aiOff:'AI disabled by admin', allLanguages:'All languages', allStatuses:'All statuses', complete:'Complete', incomplete:'Incomplete',
      traceExplorer:'Trace explorer', reviewQueue:'Human-review queue', missing:'missing', noMatching:'No traces match these filters.', sourceNotice:'Pilot export · illustrative GRP evidence · not live monitoring'
    },
    th:{
      assurance:'การรับรอง AI', back:'กลับสู่การวางแผน', live:'การติดตามผลแบบสด', unavailable:'บริการแบบสดไม่พร้อมใช้งาน',
      explain:'อธิบายด้วย AI', runHint:'โปรดประเมินเขตพญาไท RP100 ให้เสร็จก่อน', running:'กำลังสร้างคำอธิบายและบันทึกการติดตาม…',
      answer:'คำอธิบายเพื่อการวางแผน', trace:'รายละเอียดการติดตาม', evaluation:'การประเมิน', compare:'เปรียบเทียบรุ่น', dashboard:'แดชบอร์ดการรับรอง',
      human:'ผลลัพธ์จาก AI ต้องผ่านการตรวจสอบโดยผู้มีอำนาจ', evidence:'หลักฐานที่กำกับดูแล', limitations:'ข้อจำกัด', actions:'ความคิดเห็นของผู้ตรวจสอบ',
      helpful:'มีประโยชน์', notHelpful:'ไม่มีประโยชน์', openLangfuse:'เปิดการติดตามนี้ใน Langfuse', noRun:'ยังไม่มีการติดตามแบบสด',
      noRunBody:'ทำการประเมินเขตพญาไท RP100 ให้เสร็จแล้วเลือก อธิบายด้วย AI ระบบเบื้องหลังจะสร้างคำตอบและบันทึกขั้นตอน การประเมิน และตัวชี้วัดใน Langfuse',
      failure:'คำขอ AI ที่ติดตามได้ล้มเหลว', retry:'ลองอีกครั้ง', operation:'ขั้นตอน', duration:'ระยะเวลา', status:'สถานะ',
      checks:'การตรวจสอบแบบกำหนดแน่นอน', judges:'ผู้ประเมิน AI แบบเกณฑ์แคบ', calibration:'ผลจากผู้ประเมิน AI ต้องสอบเทียบกับป้ายกำกับจากมนุษย์',
      baseline:'ค่าฐาน', candidate:'การทำงานสดปัจจุบัน', release:'คำแนะนำการเผยแพร่', proceed:'ทบทวนก่อนเผยแพร่',
      metric:'ตัวชี้วัด', traced:'คำขอที่ติดตามแล้ว', latency:'เวลาโดยรวม', tokens:'โทเค็นทั้งหมด', cost:'ค่าใช้จ่ายโดยประมาณ', quality:'รายการตรวจสอบที่ผ่าน',
      governance:'การกำกับดูแล', masking:'ใช้เฉพาะบริบทนำร่องที่จำกัด', retention:'ต้องให้เจ้าของระบบยืนยัน', model:'โมเดล', versions:'รุ่น',
      liveNote:'คำตอบ OpenAI จริง · การติดตาม Langfuse จริง · หลักฐาน GRP เพื่อการสาธิต', feedbackSaved:'บันทึกความคิดเห็นใน Langfuse แล้ว',
      inputOutput:'ข้อมูลนำเข้า / ผลลัพธ์', traceId:'รหัสการติดตาม', tokensWord:'โทเค็น', evidenceIncomplete:'รหัสหลักฐานไม่ครบถ้วน', usefulnessUnknown:'ประโยชน์ของการดำเนินการ: ไม่ทราบ',
      realTrace:'การติดตามจริง', reviewCalibration:'ตรวจสอบการติดตามแบบสดและสอบเทียบผู้ประเมินแบบเกณฑ์แคบทั้งหมดกับกรณีที่มนุษย์ติดป้ายก่อนตัดสินใจเผยแพร่',
      pilotCoverage:'100% ของการทำงานนำร่องนี้', liveRequest:'คำขอแบบสด', estimateBilling:'ค่าประมาณ · ตรวจสอบกับใบเรียกเก็บของผู้ให้บริการ', deterministic:'แบบกำหนดแน่นอน',
      access:'การเข้าถึง', privateProject:'โครงการ Langfuse ที่กำหนดค่าแล้ว', humanReview:'การตรวจสอบโดยมนุษย์', required:'จำเป็น', maskingLabel:'การปกปิดข้อมูล', retentionLabel:'การเก็บรักษา',
      success:'สำเร็จ', pass:'ผ่าน', fail:'ไม่ผ่าน', unknown:'ไม่ทราบ',
      exportedRuns:'รายการจากไฟล์ส่งออก', feedbackCoverage:'ความครอบคลุมข้อคิดเห็น', groundednessReview:'ทบทวนการยึดโยงหลักฐาน', workflowCompleteness:'ความครบถ้วนของขั้นตอน',
      staticExport:'ไฟล์ส่งออก Langfuse แบบคงที่', eventPeriod:'ช่วงเวลาเหตุการณ์', aiOff:'ผู้ดูแลระบบปิด AI', allLanguages:'ทุกภาษา', allStatuses:'ทุกสถานะ', complete:'ครบถ้วน', incomplete:'ไม่ครบถ้วน',
      traceExplorer:'สำรวจการติดตาม', reviewQueue:'คิวตรวจสอบโดยมนุษย์', missing:'ขาดหาย', noMatching:'ไม่มีการติดตามที่ตรงกับตัวกรอง', sourceNotice:'ข้อมูลนำร่องจากไฟล์ส่งออก · หลักฐาน GRP เพื่อการสาธิต · ไม่ใช่การติดตามสด'
    }
  };
  const lang = () => window.GRP_I18N?.getLanguage() === 'th' ? 'th' : 'en';
  const t = key => copy[lang()][key] || key;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const verdict = value => `<span class="assurance-verdict ${escape(value)}">${escape(t(value))}</span>`;
  const fmtTime = ms => ms < 1000 ? `${ms} ms` : `${(ms/1000).toFixed(2)} s`;
  const operationName = name => ({th:{validate:'ตรวจสอบข้อมูลนำเข้า','retrieve-evidence':'เรียกหลักฐาน','read-deterministic-results':'อ่านผลลัพธ์แบบกำหนดแน่นอน','generate-explanation':'สร้างคำอธิบาย','judge-groundedness':'ประเมินความยึดโยงกับหลักฐาน','judge-question_relevance':'ประเมินความตรงกับคำถาม','judge-action_usefulness':'ประเมินประโยชน์ของการดำเนินการ','evaluate-answer':'สรุปการประเมิน'}}[lang()]?.[name]||name);
  const notify = text => { const toast=$('#toast'), target=$('#toastText'); if(target) target.textContent=text; toast?.classList.add('show'); setTimeout(()=>toast?.classList.remove('show'),2600); };

  async function api(path, body) {
    const response = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.detail || data.error || `HTTP ${response.status}`);
    return data;
  }

  function open(tab='answer') {
    window.dispatchEvent(new Event('grp-close-transient-ui'));
    active=tab; workspace.classList.add('open'); workspace.setAttribute('aria-hidden','false'); workspace.scrollTop=0;
    if(window.GRP_AUTH?.role==='admin')loadHistory();
    render();
  }
  function close() { workspace.classList.remove('open'); workspace.setAttribute('aria-hidden','true'); }

  async function loadHistory(force=false){
    if(window.GRP_AUTH?.role!=='admin'||historyLoading||(history&&!force))return;
    historyLoading=true; historyError='';
    if(workspace.classList.contains('open'))render();
    try{
      const response=await fetch('/api/admin/assurance/dashboard',{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
      history=data;
      const priority=data.traces.find(trace=>trace.judges.groundedness==='fail')||data.traces.find(trace=>!trace.complete)||data.traces[0];
      if(!selectedTraceId)selectedTraceId=priority?.traceId||null;
    }catch(error){historyError=error.message;}
    finally{historyLoading=false;if(workspace.classList.contains('open'))render();}
  }

  async function checkStatus(){
    try {
      const r=await fetch('/api/observability/status',{cache:'no-store'}),d=await r.json(),ready=d.liveReady&&d.mode==='live';
      status.textContent=ready?t('live'):d.reason==='admin-disabled'||d.reason==='environment-locked'?t('aiOff'):t('unavailable');status.className=ready?'live':'error';
      const button=$('#explainWithAI');if(button){button.disabled=!ready;button.textContent=ready?t('explain'):t('aiOff');button.title=ready?t('explain'):'An administrator must enable a short AI access window.';}
    }catch { status.textContent=t('unavailable');status.className='error';const button=$('#explainWithAI');if(button)button.disabled=true; }
  }

  async function run(){
    const context=window.GRP_CONTEXT?.();
    if(!context?.assessmentComplete || context.aoi!=='phaya-thai' || context.scenario!=='100'){ notify(t('runHint')); return; }
    busy=true; active='answer'; open(); render();
    try {
      result=await api('/api/observability/explain',{aoi:context.aoi,scenario:context.scenario,thresholdMetres:1000,language:lang(),sessionId});
      render();
    } catch(error) { result={error:error.message}; render(); }
    finally { busy=false; render(); }
  }

  async function sendFeedback(value){
    if(!result?.traceId)return;
    try { await api('/api/observability/feedback',{traceId:result.traceId,value}); notify(t('feedbackSaved')); $$('.feedback-btn').forEach(b=>b.classList.toggle('selected',b.dataset.feedback===value)); }
    catch(error){ notify(error.message); }
  }

  function shell(body){
    const admin=window.GRP_AUTH?.role==='admin';
    const tabs=admin?[['dashboard',t('dashboard')],['trace',t('trace')],['evaluation',t('evaluation')],['answer',t('answer')],['compare',t('compare')]]:[['answer',t('answer')]];
    if(!tabs.some(([id])=>id===active))active='answer';
    content.innerHTML=`<div class="assurance-tabs" role="tablist">${tabs.map(([id,label])=>`<button role="tab" aria-selected="${active===id}" class="${active===id?'active':''}" data-assurance-tab="${id}">${escape(label)}</button>`).join('')}</div><div class="assurance-body">${body}</div>`;
  }

  function empty(){
    const admin=window.GRP_AUTH?.role==='admin';
    shell(`<section class="assurance-empty"><span>◎</span><h2>${escape(t('noRun'))}</h2><p>${escape(t('noRunBody'))}</p><button class="primary" ${admin?'data-go-planning':'data-observability-run'}>${escape(admin?t('back'):t('explain'))}</button></section>`);
  }

  function renderAnswer(){
    const admin=window.GRP_AUTH?.role==='admin';
    const traceSummary=admin&&result.metrics&&result.langfuse?`<section class="assurance-card trace-summary"><b>${escape(t('traceId'))}</b><code>${escape(result.traceId)}</code><span>${fmtTime(result.metrics.latencyMs)} · ${result.metrics.totalTokens} ${escape(t('tokensWord'))} · $${result.metrics.estimatedCost.toFixed(6)}</span><a href="${escape(result.langfuse.dashboardUrl)}" target="_blank" rel="noopener noreferrer">${escape(t('openLangfuse'))} ↗</a></section>`:'';
    shell(`<div class="assurance-grid"><section class="assurance-card answer-card"><div class="card-kicker">${escape(t('liveNote'))}</div><h2>${escape(result.question)}</h2><div class="live-answer">${escape(result.answer).replace(/\n+/g,'</p><p>')}</div><div class="human-warning">! ${escape(t('human'))}</div><h3>${escape(t('limitations'))}</h3><ul>${result.limitations.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><div class="feedback"><b>${escape(t('actions'))}</b><button class="feedback-btn" data-feedback="up">👍 ${escape(t('helpful'))}</button><button class="feedback-btn" data-feedback="down">👎 ${escape(t('notHelpful'))}</button></div></section><aside><section class="assurance-card"><h3>${escape(t('evidence'))}</h3>${result.evidence.map(e=>`<div class="evidence-row"><b>${escape(e.id)}</b><span>${escape(e.title)}</span><small>${escape(e.version)} · ${Number(e.value).toLocaleString()} ${escape(e.unit)}</small></div>`).join('')}</section>${traceSummary}</aside></div>`);
  }

  function renderTrace(){
    shell(`<div class="assurance-grid"><section class="assurance-card"><div class="card-kicker">Trace ${escape(result.traceId)}</div><h2>${escape(t('trace'))}</h2><div class="trace-timeline">${result.operations.map((o,i)=>`<article><i>${i+1}</i><div><b>${escape(operationName(o.name))}</b><small>${escape(o.startTime)} → ${escape(o.endTime)}</small><details><summary>${escape(t('inputOutput'))}</summary><pre>${escape(JSON.stringify({input:o.input,output:o.output},null,2))}</pre></details></div><span>${fmtTime(o.durationMs)}<em>${escape(t(o.status))}</em></span></article>`).join('')}</div></section><aside><section class="assurance-card"><h3>${escape(t('versions'))}</h3>${Object.entries(result.versions).map(([k,v])=>`<div class="version-row"><span>${escape(k)}</span><code>${escape(v)}</code></div>`).join('')}</section><section class="assurance-card"><h3>Langfuse</h3><p>${escape(result.langfuse.projectName||'Project')} · ${result.langfuse.ingested?'ingested':'not ingested'}</p><a class="assurance-link" href="${escape(result.langfuse.dashboardUrl)}" target="_blank" rel="noopener noreferrer">${escape(t('openLangfuse'))} ↗</a></section></aside></div>`);
  }

  function renderEvaluation(){
    shell(`<div class="assurance-grid"><section class="assurance-card"><h2>${escape(t('checks'))}</h2>${result.checks.map(x=>`<article class="eval-row">${verdict(x.verdict)}<div><b>${escape(x.label)}</b><p>${escape(x.reason)}</p></div></article>`).join('')}</section><aside><section class="assurance-card"><h2>${escape(t('judges'))}</h2>${result.judges.map(x=>`<article class="eval-row">${verdict(x.verdict)}<div><b>${escape(x.criterion)}</b><p>${escape(x.reason)}</p></div></article>`).join('')}<div class="calibration-note">! ${escape(t('calibration'))}</div></section></aside></div>`);
  }

  function renderCompare(){
    const passed=result.checks.filter(x=>x.verdict==='pass').length+result.judges.filter(x=>x.verdict==='pass').length;
    shell(`<section class="assurance-card"><h2>${escape(t('compare'))}</h2><div class="compare-grid"><div><span>${escape(t('baseline'))}</span><h3>grp-observability-baseline-v0.9</h3><b>5 / 7 checks</b><small>3.4 s · 1,720 ${escape(t('tokensWord'))} · $0.012</small><ul><li>${escape(t('evidenceIncomplete'))}</li><li>${escape(t('usefulnessUnknown'))}</li></ul></div><div class="candidate"><span>${escape(t('candidate'))}</span><h3>${escape(result.versions.workflow)}</h3><b>${passed} / 7 checks</b><small>${fmtTime(result.metrics.latencyMs)} · ${result.metrics.totalTokens} ${escape(t('tokensWord'))} · $${result.metrics.estimatedCost.toFixed(6)}</small><ul><li>${escape(t('realTrace'))} ${escape(result.traceId.slice(0,8))}</li><li>${escape(result.metrics.model)}</li></ul></div></div><div class="release-call"><span>${escape(t('release'))}</span><b>${escape(t('proceed'))}</b><p>${escape(t('reviewCalibration'))}</p></div></section>`);
  }

  const criterionLabel=name=>({figures_match:'Figures match assessment',evidence_resolves:'Evidence IDs and versions resolve',schema_valid:'Output schema is valid',limitations_present:'Mandatory limitations are present',groundedness:'Groundedness',question_relevance:'Question relevance',action_usefulness:'Action usefulness'}[name]||name.replaceAll('_',' '));
  const scoreValue=value=>value===1?'pass':value===0?'fail':(value||'missing');
  const historyTraces=()=>history?.traces.filter(trace=>(historyLanguage==='all'||trace.language===historyLanguage)&&(historyStatus==='all'||(historyStatus==='complete')===trace.complete))||[];
  const selectedHistoryTrace=()=>history?.traces.find(trace=>trace.traceId===selectedTraceId)||history?.traces[0]||null;
  const counts=(traces,getter)=>traces.reduce((out,trace)=>{const value=getter(trace)||'missing';out[value]=(out[value]||0)+1;return out;},{pass:0,fail:0,unknown:0,missing:0});
  const qualityBar=(label,resultCounts,total)=>`<div class="quality-bar"><div><b>${escape(label)}</b><span>${resultCounts.pass||0} ${escape(t('pass'))} · ${resultCounts.fail||0} ${escape(t('fail'))} · ${resultCounts.unknown||0} ${escape(t('unknown'))} · ${resultCounts.missing||0} ${escape(t('missing'))}</span></div><div class="quality-track">${['pass','fail','unknown','missing'].map(state=>`<i class="${state}" style="width:${total?(resultCounts[state]||0)/total*100:0}%"></i>`).join('')}</div></div>`;
  const traceRow=trace=>`<tr class="${trace.traceId===selectedTraceId?'selected':''}"><td><button data-history-trace="${escape(trace.traceId)}"><b>${escape(trace.traceId.slice(0,8))}</b><small>${escape(trace.timestamp.replace(' ',' · ').slice(0,21))}</small></button></td><td><span class="language-chip">${escape(trace.language.toUpperCase())}</span></td><td>${fmtTime(trace.durationMs)}</td><td>${trace.tokens.toLocaleString()}</td><td>$${trace.cost.toFixed(4)}</td><td>${verdict(trace.judges.groundedness||'missing')}</td><td>${verdict(trace.complete?'pass':'unknown')}</td><td><button class="view-trace" data-history-trace="${escape(trace.traceId)}">View →</button></td></tr>`;

  function historySource(){
    if(historyLoading)return `<section class="history-source loading"><span class="spinner">◌</span><b>Loading assurance export…</b></section>`;
    if(historyError)return `<section class="history-source error"><b>Dashboard data unavailable</b><span>${escape(historyError)}</span><button data-history-refresh>Retry</button></section>`;
    return `<section class="history-source"><div><b>${escape(t('staticExport'))}</b><span>${escape(history?.source.file)} · downloaded ${escape(history?.source.exportDate)}</span></div><div><b>${escape(t('eventPeriod'))}</b><span>${escape(history?.source.eventStart.slice(0,16))} → ${escape(history?.source.eventEnd.slice(0,16))}</span></div><em>${escape(t('sourceNotice'))}</em><button data-history-refresh>Refresh</button></section>`;
  }

  function aiAccessPanel(){
    const access=history?.aiAccess;if(!access)return '';
    const on=access.liveReady,locked=!access.masterAllowed,transportBlocked=access.reason==='https-required';
    const expires=access.expiresAt?access.expiresAt.replace('T',' ').slice(0,16)+' UTC':'—';
    return `<section class="ai-access-control ${on?'on':locked||transportBlocked?'locked':'off'}"><div><span>PERSONAL API COST CONTROL</span><h2>AI generation ${on?'ON':'OFF'}</h2><p>${locked?'Server environment lock is active. Admin cannot enable AI until the server setting is changed and restarted.':transportBlocked?'Public HTTP detected. AI generation is blocked until the application uses HTTPS.':on?`Automatically disables at ${escape(expires)} or when the request budget is used.`:'The server permits AI, but runtime access is disabled.'}</p></div><dl><div><dt>Environment master</dt><dd>${locked?'LOCKED':'ALLOWED'}</dd></div><div><dt>Runtime window</dt><dd>${on?`${access.windowMinutes} minutes`:'OFF'}</dd></div><div><dt>Requests remaining</dt><dd>${access.remainingRequests} / ${access.requestBudget}</dd></div></dl><div class="ai-access-actions">${locked?`<code>AI_FEATURE_ALLOWED=false</code><small>Set true in the server .env and restart only when a controlled demo is planned.</small>`:transportBlocked?`<code>HTTPS REQUIRED</code><small>Configure a DNS name and Caddy HTTPS before enabling personal-token access.</small>`:on?`<button data-ai-access="disable">Disable now</button>`:`<button class="enable" data-ai-access="enable">Enable ${access.windowMinutes} min · ${access.requestBudget} requests</button>`}</div></section>`;
  }

  async function changeAIAccess(action){
    try{const data=await api('/api/admin/ai-access',{action});history.aiAccess=data.status;render();checkStatus();notify(action==='enable'?'AI access enabled for a limited window':'AI access disabled');}
    catch(error){notify(error.message);if(error.message.includes('locked'))loadHistory(true);}
  }

  function renderHistoryDashboard(){
    if(!history){shell(`${historySource()}${!historyLoading&&historyError?'':`<section class="assurance-empty"><span class="spinner">◌</span><h2>Loading dashboard</h2></section>`}`);return;}
    const traces=historyTraces(), all=history.traces;
    const deterministicPassed=traces.filter(trace=>Object.values(trace.checks).every(value=>value===1)).length;
    const feedback=traces.filter(trace=>trace.feedback===0||trace.feedback===1).length;
    const complete=traces.filter(trace=>trace.complete).length;
    const grounded=counts(traces,trace=>trace.judges.groundedness);
    const latencies=traces.map(trace=>trace.durationMs).sort((a,b)=>a-b);
    const p95=latencies.length?latencies[Math.max(0,Math.ceil(latencies.length*.95)-1)]:0;
    const cost=traces.reduce((sum,trace)=>sum+trace.cost,0), tokens=traces.reduce((sum,trace)=>sum+trace.tokens,0);
    const relevance=counts(traces,trace=>trace.judges.question_relevance), usefulness=counts(traces,trace=>trace.judges.action_usefulness);
    const runtimeUsers=history.runtimeUsage?.users||[];
    const userRows=[{username:'Unattributed (pre-login export)',role:'legacy',requests:all.length,feedback:all.filter(trace=>trace.feedback===0||trace.feedback===1).length,tokens:all.reduce((sum,trace)=>sum+trace.tokens,0),cost:all.reduce((sum,trace)=>sum+trace.cost,0),averageLatencyMs:Math.round(all.reduce((sum,trace)=>sum+trace.durationMs,0)/all.length),lastActive:history.source.eventEnd},...runtimeUsers];
    shell(`${historySource()}${aiAccessPanel()}<div class="history-filters"><label>Language<select data-history-language><option value="all">${escape(t('allLanguages'))}</option><option value="en" ${historyLanguage==='en'?'selected':''}>English</option><option value="th" ${historyLanguage==='th'?'selected':''}>ไทย</option></select></label><label>Status<select data-history-status><option value="all">${escape(t('allStatuses'))}</option><option value="complete" ${historyStatus==='complete'?'selected':''}>${escape(t('complete'))}</option><option value="incomplete" ${historyStatus==='incomplete'?'selected':''}>${escape(t('incomplete'))}</option></select></label><span>${traces.length} / ${all.length} traces</span></div><div class="dashboard-grid history-metrics"><section class="metric-card"><span>${escape(t('exportedRuns'))}</span><b>${traces.length}</b><small>1 preflight excluded</small></section><section class="metric-card"><span>${escape(t('quality'))}</span><b>${deterministicPassed}/${traces.length}</b><small>${escape(t('deterministic'))}</small></section><section class="metric-card warning"><span>${escape(t('groundednessReview'))}</span><b>${grounded.fail+grounded.unknown}</b><small>${grounded.fail} fail · ${grounded.unknown} unknown</small></section><section class="metric-card"><span>${escape(t('feedbackCoverage'))}</span><b>${feedback}/${traces.length}</b><small>${traces.length?Math.round(feedback/traces.length*100):0}% labelled</small></section><section class="metric-card"><span>P95 ${escape(t('latency'))}</span><b>${fmtTime(p95)}</b><small>End-to-end export timing</small></section><section class="metric-card"><span>${escape(t('cost'))}</span><b>$${cost.toFixed(4)}</b><small>${tokens.toLocaleString()} ${escape(t('tokensWord'))}</small></section></div><div class="history-dashboard-grid"><section class="assurance-card quality-overview"><h2>Evaluation overview</h2>${qualityBar(criterionLabel('groundedness'),grounded,traces.length)}${qualityBar(criterionLabel('question_relevance'),relevance,traces.length)}${qualityBar(criterionLabel('action_usefulness'),usefulness,traces.length)}<div class="calibration-note">! ${escape(t('calibration'))}</div></section><section class="assurance-card assurance-callout ${grounded.fail?'danger':'warning'}"><span>ASSURANCE STATE</span><h2>${grounded.fail?'Action required':'Review required'}</h2><b>${grounded.fail} groundedness fail · ${grounded.unknown} unknown</b><p>Deterministic checks passed, but judge uncertainty must not be presented as an all-green result. Human calibration is required.</p><button data-assurance-tab="evaluation">Open evaluation →</button></section></div><section class="assurance-card user-usage"><div class="section-heading"><div><p class="card-kicker">ADMIN ONLY · AUTHENTICATED ACTIVITY</p><h2>User usage</h2></div><span>${runtimeUsers.length} authenticated user${runtimeUsers.length===1?'':'s'} since backend start</span></div><div class="usage-notice">The 31 August export predates login tracking, so its six runs are shown as unattributed. New requests are attributed server-side to the authenticated username and sent to Langfuse as <code>userId</code>.</div><div class="trace-table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>AI requests</th><th>Feedback</th><th>Tokens</th><th>Cost</th><th>Avg latency</th><th>Last active</th></tr></thead><tbody>${userRows.map(user=>`<tr><td><b>${escape(user.username)}</b></td><td><span class="language-chip">${escape(user.role)}</span></td><td>${user.requests}</td><td>${user.feedback}</td><td>${Number(user.tokens).toLocaleString()}</td><td>$${Number(user.cost).toFixed(4)}</td><td>${user.requests?fmtTime(user.averageLatencyMs):'—'}</td><td>${escape(String(user.lastActive||'—').replace('T',' ').slice(0,16))}</td></tr>`).join('')}</tbody></table></div><p class="usage-footnote">Runtime usage is held in memory for this controlled prototype and resets when the backend restarts. Use an approved analytics store for production reporting.</p></section><section class="assurance-card trace-explorer"><div class="section-heading"><div><p class="card-kicker">31 AUGUST EXPORT</p><h2>${escape(t('traceExplorer'))}</h2></div><span>${complete}/${traces.length} complete workflows</span></div>${traces.length?`<div class="trace-table-wrap"><table><thead><tr><th>Trace</th><th>Lang</th><th>Latency</th><th>Tokens</th><th>Cost</th><th>Groundedness</th><th>Workflow</th><th></th></tr></thead><tbody>${traces.map(traceRow).join('')}</tbody></table></div>`:`<p>${escape(t('noMatching'))}</p>`}</section>`);
  }

  function renderHistoryTrace(){
    const trace=selectedHistoryTrace();
    if(!trace){shell(historySource());return;}
    shell(`${historySource()}<div class="trace-selector"><label>Selected trace<select data-history-trace-select>${history.traces.map(item=>`<option value="${escape(item.traceId)}" ${item.traceId===trace.traceId?'selected':''}>${escape(item.traceId.slice(0,8))} · ${escape(item.language.toUpperCase())} · ${escape(item.judges.groundedness||'missing')}</option>`).join('')}</select></label><span>${trace.complete?verdict('pass'):verdict('unknown')} ${trace.complete?escape(t('complete')):`${trace.missingOperations.length} ${escape(t('missing'))}`}</span></div><div class="assurance-grid"><section class="assurance-card"><div class="card-kicker">TRACE ${escape(trace.traceId)}</div><h2>${escape(t('trace'))}</h2><div class="trace-timeline">${trace.operations.map((operation,index)=>`<article><i>${index+1}</i><div><b>${escape(operationName(operation.name))}</b><small>${escape(operation.type)} · ${escape(operation.startTime)} → ${escape(operation.endTime||'not completed')}</small><details><summary>${escape(t('inputOutput'))}</summary><pre>${escape(JSON.stringify({input:operation.input,output:operation.output},null,2))}</pre></details></div><span>${operation.latencyMs==null?'—':fmtTime(operation.latencyMs)}<em>${operation.endTime?escape(t('success')):escape(t('missing'))}</em></span></article>`).join('')}</div></section><aside><section class="assurance-card trace-facts"><h3>Trace facts</h3><div><span>Language</span><b>${escape(trace.language.toUpperCase())}</b></div><div><span>Release</span><b>${escape(trace.release)}</b></div><div><span>Model</span><b>${escape(trace.model||'—')}</b></div><div><span>Duration</span><b>${fmtTime(trace.durationMs)}</b></div><div><span>Tokens</span><b>${trace.tokens.toLocaleString()}</b></div><div><span>Cost</span><b>$${trace.cost.toFixed(6)}</b></div></section>${trace.missingOperations.length?`<section class="assurance-card missing-operations"><h3>Missing operations</h3>${trace.missingOperations.map(name=>`<span>${escape(name)}</span>`).join('')}</section>`:''}<button class="assurance-link-button" data-assurance-tab="evaluation">Review evaluation →</button></aside></div>`);
  }

  function renderHistoryEvaluation(){
    const trace=selectedHistoryTrace();
    if(!trace){shell(historySource());return;}
    const review=history.traces.filter(item=>!item.complete||item.judges.groundedness!=='pass'||item.feedback===0);
    shell(`${historySource()}<div class="evaluation-summary"><section class="assurance-card"><div class="section-heading"><div><p class="card-kicker">SELECTED TRACE ${escape(trace.traceId.slice(0,8))}</p><h2>${escape(t('checks'))}</h2></div><button data-assurance-tab="trace">View trace →</button></div>${Object.entries(trace.checks).map(([name,value])=>`<article class="eval-row">${verdict(scoreValue(value))}<div><b>${escape(criterionLabel(name))}</b><p>${escape(trace.reasons['deterministic.'+name]||'No evaluator reason recorded.')}</p></div></article>`).join('')}</section><section class="assurance-card"><h2>${escape(t('judges'))}</h2>${Object.entries(trace.judges).map(([name,value])=>`<article class="eval-row">${verdict(scoreValue(value))}<div><b>${escape(criterionLabel(name))}</b><p>${escape(trace.reasons['judge.'+name]||'No evaluator reason recorded in the export.')}</p></div></article>`).join('')}<div class="calibration-note">! ${escape(t('calibration'))}</div></section></div><section class="assurance-card review-queue"><div class="section-heading"><div><p class="card-kicker">PRIORITISED CASES</p><h2>${escape(t('reviewQueue'))}</h2></div><span>${review.length} of ${history.traces.length} require review</span></div><div class="review-list">${review.map(item=>{const issues=[];if(item.judges.groundedness==='fail')issues.push('Groundedness failed');if(item.judges.groundedness==='unknown')issues.push('Groundedness unknown');if(!item.complete)issues.push('Incomplete trace');if(item.feedback===0)issues.push('Negative feedback');return `<button data-history-trace="${escape(item.traceId)}" data-open-evaluation><span>${verdict(item.judges.groundedness||'missing')}</span><p><b>${escape(item.traceId.slice(0,8))} · ${escape(item.language.toUpperCase())}</b><small>${escape(issues.join(' · '))}</small></p><em>Review →</em></button>`;}).join('')}</div></section>`);
  }

  function renderLiveDashboard(){
    const pass=result.checks.filter(x=>x.verdict==='pass').length;
    shell(`<div class="dashboard-grid"><section class="metric-card"><span>${escape(t('traced'))}</span><b>1</b><small>${escape(t('pilotCoverage'))}</small></section><section class="metric-card"><span>${escape(t('latency'))}</span><b>${fmtTime(result.metrics.latencyMs)}</b><small>${escape(t('liveRequest'))}</small></section><section class="metric-card"><span>${escape(t('tokens'))}</span><b>${result.metrics.totalTokens.toLocaleString()}</b><small>${result.metrics.inputTokens} in · ${result.metrics.outputTokens} out</small></section><section class="metric-card"><span>${escape(t('cost'))}</span><b>$${result.metrics.estimatedCost.toFixed(6)}</b><small>${escape(t('estimateBilling'))}</small></section><section class="metric-card"><span>${escape(t('quality'))}</span><b>${pass}/4</b><small>${escape(t('deterministic'))}</small></section><section class="metric-card"><span>${escape(t('model'))}</span><b>${escape(result.metrics.model)}</b><small>${escape(result.versions.prompt)}</small></section><section class="assurance-card governance-card"><h2>${escape(t('governance'))}</h2><div><span>${escape(t('access'))}</span><b>${escape(t('privateProject'))}</b></div><div><span>${escape(t('maskingLabel'))}</span><b>${escape(t('masking'))}</b></div><div><span>${escape(t('retentionLabel'))}</span><b>${escape(t('retention'))}</b></div><div><span>${escape(t('humanReview'))}</span><b>${escape(t('required'))}</b></div></section></div>`);
  }

  function render(){
    const admin=window.GRP_AUTH?.role==='admin';
    if(!admin)active='answer';
    $('#assuranceTitle').textContent=t('assurance'); $('#assuranceBack').textContent=`← ${t('back')}`; checkStatus();
    if(admin&&active==='dashboard'){renderHistoryDashboard();return;}
    if(admin&&active==='trace'){renderHistoryTrace();return;}
    if(admin&&active==='evaluation'){renderHistoryEvaluation();return;}
    if(busy){ shell(`<section class="assurance-empty"><span class="spinner">◌</span><h2>${escape(t('running'))}</h2><p>OpenAI → governed checks → narrow judges → Langfuse</p></section>`); return; }
    if(result?.error){ shell(`<section class="assurance-empty error-state"><span>!</span><h2>${escape(t('failure'))}</h2><p>${escape(result.error)}</p><button class="primary" data-observability-run>${escape(t('retry'))}</button></section>`); return; }
    if(!result){empty();return;}
    ({answer:renderAnswer,compare:renderCompare,dashboard:renderLiveDashboard}[active]||renderAnswer)();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#aiAssuranceBtn'))open(window.GRP_AUTH?.role==='admin'?'dashboard':'answer');
    if(e.target.closest('#explainWithAI')||e.target.closest('[data-observability-run]'))run();
    if(e.target.closest('#assuranceBack')||e.target.closest('[data-go-planning]'))close();
    if(e.target.closest('[data-history-refresh]'))loadHistory(true);
    const aiAccess=e.target.closest('[data-ai-access]');if(aiAccess)changeAIAccess(aiAccess.dataset.aiAccess);
    const historyTrace=e.target.closest('[data-history-trace]');
    if(historyTrace){selectedTraceId=historyTrace.dataset.historyTrace;active=historyTrace.hasAttribute('data-open-evaluation')?'evaluation':'trace';workspace.scrollTop=0;render();}
    const tab=e.target.closest('[data-assurance-tab]'); if(tab){active=tab.dataset.assuranceTab;workspace.scrollTop=0;render();}
    const feedback=e.target.closest('[data-feedback]'); if(feedback)sendFeedback(feedback.dataset.feedback);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&workspace.classList.contains('open'))close();});
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-history-language]')){historyLanguage=e.target.value;render();}
    if(e.target.matches('[data-history-status]')){historyStatus=e.target.value;render();}
    if(e.target.matches('[data-history-trace-select]')){selectedTraceId=e.target.value;render();}
  });
  window.addEventListener('languagechange',()=>{ if(workspace.classList.contains('open'))render(); checkStatus(); });
  window.addEventListener('grp-authenticated',event=>{checkStatus();if(event.detail?.role==='admin')loadHistory();});
  checkStatus();
})();
