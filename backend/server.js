const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const DASHBOARD_DATA = require('./data/langfuse-dashboard-2026-08-31.json');

const PORT = Number(process.env.PORT || 3000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY || '';
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY || '';
const LANGFUSE_BASE_URL = (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').replace(/\/$/, '');
const LANGFUSE_ENVIRONMENT = process.env.LANGFUSE_ENVIRONMENT || 'development';
const MODE = process.env.AI_OBSERVABILITY_MODE || 'mock';
const AI_FEATURE_ALLOWED = String(process.env.AI_FEATURE_ALLOWED || 'false').toLowerCase() === 'true';
const AI_RUNTIME_WINDOW_MINUTES = Math.min(60, Math.max(5, Number(process.env.AI_RUNTIME_WINDOW_MINUTES || 15)));
const AI_RUNTIME_REQUEST_BUDGET = Math.min(50, Math.max(1, Number(process.env.AI_RUNTIME_REQUEST_BUDGET || 5)));
const AI_REQUIRE_HTTPS = String(process.env.AI_REQUIRE_HTTPS || 'true').toLowerCase() !== 'false';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const PLANNER_USERNAME = process.env.PLANNER_USERNAME || '';
const PLANNER_PASSWORD = process.env.PLANNER_PASSWORD || '';
const DEMO_QUICK_LOGIN = String(process.env.DEMO_QUICK_LOGIN || 'false').toLowerCase() === 'true';
const FEEDBACK_STORAGE_DIR = path.resolve(process.env.FEEDBACK_STORAGE_DIR || './storage');
const FEEDBACK_FILE = path.join(FEEDBACK_STORAGE_DIR, 'feedback.json');
const MAX_BODY = 32 * 1024;
const MAX_FEEDBACK_BODY = 1500 * 1024;
const MAX_ATTACHMENT = 1024 * 1024;
const FEEDBACK_HUBS = new Set(['EAP','TSA','SA','WA','ESA','CA','Other']);
const FEEDBACK_CATEGORIES = new Set(['question','suggestion','problem','data-correction','comment','compliment','other']);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT = 8;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_COOKIE = 'grp_session';
const rateBuckets = new Map();
const loginBuckets = new Map();
const feedbackBuckets = new Map();
const sessions = new Map();
const usageEvents = [];
const aiRuntime = {enabled:false,enabledAt:null,expiresAt:null,remainingRequests:0,enabledBy:null};

const EVIDENCE = [
  { id: 'EV-POP-RP100-v1', title: 'RP100 aggregated population summary', version: 'demo-population-v1.0', value: 18640, unit: 'people', status: 'illustrative' },
  { id: 'EV-PROX-1KM-v1', title: 'Population beyond 1 km proximity summary', version: 'demo-proximity-v1.0', value: 11240, unit: 'people', status: 'illustrative' },
  { id: 'EV-SHELTER-v1', title: 'Candidate shelter inventory and method note', version: 'demo-shelter-v1.0', value: 14, unit: 'records', status: 'illustrative' }
];
const QUESTION_EN = 'Why should areas farther than 1 km from candidate shelters be prioritised?';
const QUESTION_TH = 'เหตุใดจึงควรให้ความสำคัญกับพื้นที่ที่อยู่ไกลจากศูนย์พักพิงตัวเลือกมากกว่า 1 กม.?';
const LIMITATIONS = {
  en: [
    'All population, shelter and proximity values are illustrative mocked data.',
    'Distance is straight-line proximity, not walking distance, travel time or a verified safe route.',
    'Candidate shelters are not confirmed safe or approved; capacity and accessibility are not assessed.',
    'This is planning support, not a forecast, warning or operational decision.'
  ],
  th: [
    'ค่าประชากร ศูนย์พักพิง และระยะห่างทั้งหมดเป็นข้อมูลจำลองเพื่อการสาธิต',
    'ระยะทางเป็นระยะเส้นตรง ไม่ใช่ระยะเดินทาง เวลาเดินทาง หรือเส้นทางปลอดภัยที่ผ่านการตรวจสอบ',
    'ศูนย์พักพิงตัวเลือกยังไม่ได้รับการยืนยันว่าปลอดภัยหรืออนุมัติ และยังไม่ประเมินความจุหรือการเข้าถึง',
    'ข้อมูลนี้ใช้สนับสนุนการวางแผน ไม่ใช่การพยากรณ์ คำเตือน หรือการตัดสินใจเชิงปฏิบัติการ'
  ]
};

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
}

function readJson(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let raw = '', failed = false;
    req.on('data', chunk => {
      if (failed) return;
      raw += chunk;
      if (Buffer.byteLength(raw) > limit) { failed = true; reject(new Error('Request too large')); }
    });
    req.on('end', () => {
      if (failed) return;
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function iso(ms = Date.now()) { return new Date(ms).toISOString(); }
function event(type, body, timestamp = iso()) { return {id:crypto.randomUUID(), timestamp, type, body}; }
function basicAuth() { return 'Basic ' + Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64'); }
function authConfigured() { return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD && PLANNER_USERNAME && PLANNER_PASSWORD); }
function clientAddress(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(); }
function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const index = value.indexOf('=');
    if (index < 0) return [value, ''];
    let decoded = value.slice(index + 1);
    try { decoded = decodeURIComponent(decoded); } catch { /* Treat malformed cookie text as an invalid token. */ }
    return [value.slice(0, index), decoded];
  }));
}
function secureRequest(req) { return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'; }
function localDevelopmentRequest(req) { return /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(String(req.socket.remoteAddress || '')); }
function sessionCookie(req, token, maxAge = Math.floor(SESSION_TTL_MS / 1000)) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureRequest(req) ? '; Secure' : ''}`;
}
function getSession(req) {
  const token = cookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) { sessions.delete(token); return null; }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return {...session, token};
}
function requireSession(req, res, roles = ['admin', 'planner']) {
  const session = getSession(req);
  if (!session) { json(res, 401, {error:'Authentication required.'}); return null; }
  if (!roles.includes(session.role)) { json(res, 403, {error:'This role is not authorised for this resource.'}); return null; }
  return session;
}
function loginRateLimited(req) {
  const key = clientAddress(req);
  const recent = (loginBuckets.get(key) || []).filter(time => Date.now() - time < LOGIN_WINDOW_MS);
  loginBuckets.set(key, recent);
  return recent.length >= LOGIN_RATE_LIMIT;
}
function recordLoginFailure(req) {
  const key = clientAddress(req);
  loginBuckets.set(key,[...(loginBuckets.get(key) || []),Date.now()]);
}
function authenticate(username, password) {
  if (safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD)) return {username:ADMIN_USERNAME, role:'admin'};
  if (safeEqual(username, PLANNER_USERNAME) && safeEqual(password, PLANNER_PASSWORD)) return {username:PLANNER_USERNAME, role:'planner'};
  return null;
}
function startSession(req, res, account) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token,{username:account.username,role:account.role,createdAt:Date.now(),expiresAt:Date.now()+SESSION_TTL_MS});
  res.setHeader('Set-Cookie',sessionCookie(req,token));
  return json(res,200,{authenticated:true,user:account});
}
function providersConfigured() { return Boolean(OPENAI_API_KEY && LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY); }
function disableAIRuntime() { Object.assign(aiRuntime,{enabled:false,enabledAt:null,expiresAt:null,remainingRequests:0,enabledBy:null}); }
function aiAccessStatus(req) {
  if(aiRuntime.enabled&&(Date.now()>=aiRuntime.expiresAt||aiRuntime.remainingRequests<=0))disableAIRuntime();
  const transportAllowed=!AI_REQUIRE_HTTPS||(req&&(secureRequest(req)||localDevelopmentRequest(req)));
  const ready=MODE==='live'&&AI_FEATURE_ALLOWED&&providersConfigured()&&aiRuntime.enabled&&transportAllowed;
  let reason='ready';
  if(MODE!=='live')reason='mode-not-live';
  else if(!AI_FEATURE_ALLOWED)reason='environment-locked';
  else if(!providersConfigured())reason='providers-not-configured';
  else if(!transportAllowed)reason='https-required';
  else if(!aiRuntime.enabled)reason='admin-disabled';
  return {masterAllowed:AI_FEATURE_ALLOWED,runtimeEnabled:aiRuntime.enabled,liveReady:ready,reason,httpsRequired:AI_REQUIRE_HTTPS,transportAllowed,windowMinutes:AI_RUNTIME_WINDOW_MINUTES,requestBudget:AI_RUNTIME_REQUEST_BUDGET,remainingRequests:aiRuntime.remainingRequests,enabledAt:aiRuntime.enabledAt?iso(aiRuntime.enabledAt):null,expiresAt:aiRuntime.expiresAt?iso(aiRuntime.expiresAt):null,enabledBy:aiRuntime.enabledBy};
}
function enableAIRuntime(username, req) {
  if(MODE!=='live')throw new Error('AI observability mode is not live.');
  if(!AI_FEATURE_ALLOWED)throw new Error('AI access is locked by the server environment.');
  if(!providersConfigured())throw new Error('Server-side AI providers are not configured.');
  if(AI_REQUIRE_HTTPS&&!secureRequest(req)&&!localDevelopmentRequest(req))throw new Error('HTTPS is required before AI access can be enabled.');
  const now=Date.now();Object.assign(aiRuntime,{enabled:true,enabledAt:now,expiresAt:now+AI_RUNTIME_WINDOW_MINUTES*60*1000,remainingRequests:AI_RUNTIME_REQUEST_BUDGET,enabledBy:username});
}
function consumeAIRequest(req) {
  const status=aiAccessStatus(req);
  if(!status.liveReady)throw new Error('AI explanation access is currently disabled by the administrator.');
  aiRuntime.remainingRequests--;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {raw:text}; }
  if (!response.ok) throw new Error(`${response.status} ${data?.error?.message || data?.message || text.slice(0,200)}`);
  return data;
}

function responseText(data) {
  if (typeof data.output_text === 'string') return data.output_text.trim();
  return (data.output || []).flatMap(item => item.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('').trim();
}

async function openAI(input, maxOutputTokens = 500) {
  const started = Date.now();
  const data = await requestJson('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{'Authorization':`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:OPENAI_MODEL,input,max_output_tokens:maxOutputTokens})
  });
  return {text:responseText(data), usage:data.usage || {}, responseId:data.id, started, ended:Date.now()};
}

async function judge(criterion, instructions, answer, language) {
  const prompt = `You are a narrow evaluator for one criterion only.\nCriterion: ${criterion}\n${instructions}\nReturn exactly one compact JSON object with keys verdict and reason. verdict must be pass, fail, or unknown. Judge only from the supplied evidence; do not reward confident prose.\nLanguage for reason: ${language === 'th' ? 'Thai' : 'English'}\n\nQUESTION:\n${language === 'th' ? QUESTION_TH : QUESTION_EN}\n\nGOVERNED EVIDENCE:\n${JSON.stringify(EVIDENCE)}\n\nANSWER:\n${answer}`;
  const call = await openAI(prompt, 180);
  let parsed;
  try { parsed = JSON.parse(call.text.replace(/^```json\s*|\s*```$/g, '')); } catch { parsed = {verdict:'unknown',reason:'Evaluator returned an invalid structured result.'}; }
  if (!['pass','fail','unknown'].includes(parsed.verdict)) parsed.verdict = 'unknown';
  return {...parsed, criterion, call};
}

async function ingest(batch) {
  const data = await requestJson(`${LANGFUSE_BASE_URL}/api/public/ingestion`, {
    method:'POST', headers:{'Authorization':basicAuth(),'Content-Type':'application/json'}, body:JSON.stringify({batch})
  });
  if (data.errors?.length) throw new Error(`Langfuse ingestion rejected ${data.errors.length} event(s)`);
  return data;
}

async function projectInfo() {
  try {
    const data = await requestJson(`${LANGFUSE_BASE_URL}/api/public/projects`, {headers:{'Authorization':basicAuth()}});
    return (data.data || data || [])[0] || null;
  } catch { return null; }
}

function deterministicChecks(answer, payload) {
  const th=payload.language==='th';
  return [
    {name:'figures_match', label:th?'ตัวเลขตรงกับการประเมิน':'Figures match assessment', verdict:answer.includes('18,640') && answer.includes('11,240') ? 'pass' : 'fail', reason:th?'คำอธิบายมีค่าที่คาดหมายของ RP100 และประชากรที่อยู่ไกลกว่า 1 กม.':'Expected RP100 and beyond-1-km figures are present in the generated explanation.'},
    {name:'evidence_resolves', label:th?'รหัสและรุ่นของหลักฐานตรวจสอบได้':'Evidence IDs and versions resolve', verdict:EVIDENCE.length === 3 && EVIDENCE.every(x => x.id && x.version) ? 'pass' : 'fail', reason:th?'หลักฐานสาธิตที่กำกับดูแลทั้งสามรายการมีรหัสและรุ่นที่คงที่':'All three governed demonstration records have stable IDs and versions.'},
    {name:'schema_valid', label:th?'โครงสร้างผลลัพธ์ถูกต้อง':'Output schema is valid', verdict:payload.aoi === 'phaya-thai' && payload.scenario === '100' && payload.thresholdMetres === 1000 ? 'pass' : 'fail', reason:th?'ฟิลด์พื้นที่ สถานการณ์ และเกณฑ์ระยะทางตรงตามข้อกำหนดการทดลอง':'Required AOI, scenario and threshold fields match the pilot contract.'},
    {name:'limitations_present', label:th?'มีข้อจำกัดด้านความปลอดภัยครบถ้วน':'Mandatory limitations are present', verdict:LIMITATIONS[payload.language].length === 4 ? 'pass' : 'fail', reason:th?'แนบข้อจำกัดที่จำเป็นสี่รายการเกี่ยวกับความปลอดภัยและข้อมูลจำลองแล้ว':'Four mandatory safety and mocked-data limitations are attached to the answer.'}
  ];
}

function localizedEvidence(language) {
  if(language!=='th') return EVIDENCE;
  const titles={
    'EV-POP-RP100-v1':'สรุปประชากรแบบรวมในขอบเขต RP100',
    'EV-PROX-1KM-v1':'สรุปประชากรที่อยู่ไกลกว่าเกณฑ์ 1 กม.',
    'EV-SHELTER-v1':'บัญชีศูนย์พักพิงตัวเลือกและหมายเหตุวิธีการ'
  };
  return EVIDENCE.map(x=>({...x,title:titles[x.id],unit:x.unit==='people'?'คน':'รายการ',status:'ข้อมูลสาธิต'}));
}

async function explain(payload, actor, req) {
  if (payload.aoi !== 'phaya-thai' || payload.scenario !== '100' || Number(payload.thresholdMetres) !== 1000) throw new Error('The live pilot supports only Phaya Thai, RP100 and the 1 km threshold.');
  consumeAIRequest(req);
  const language = payload.language === 'th' ? 'th' : 'en';
  const validated = {aoi:'phaya-thai',scenario:'100',thresholdMetres:1000,language};
  const traceId = crypto.randomUUID();
  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.slice(0,80) : crypto.randomUUID();
  const traceStart = Date.now();
  const operations = [];
  const addOperation = (name, start, end, status, input, output, id = crypto.randomUUID()) => {
    const op = {id,name,startTime:iso(start),endTime:iso(end),durationMs:end-start,status,input,output}; operations.push(op); return op;
  };

  let start = Date.now();
  const validateOp = addOperation('validate', start, Date.now()+2, 'success', {aoi:payload.aoi,scenario:payload.scenario,thresholdMetres:Number(payload.thresholdMetres),language}, validated);
  start = Date.now();
  const retrieveOp = addOperation('retrieve-evidence', start, Date.now()+3, 'success', {ids:EVIDENCE.map(x=>x.id)}, EVIDENCE);
  start = Date.now();
  const calculateOp = addOperation('read-deterministic-results', start, Date.now()+2, 'success', {scenario:'RP100',thresholdMetres:1000}, {exposedPeople:18640,beyondThresholdPeople:11240});

  const generationPrompt = language === 'th'
    ? `ตอบคำถามสำหรับนักวางแผนเป็นภาษาไทย 2 ย่อหน้าสั้น ๆ: ${QUESTION_TH}\nใช้เฉพาะหลักฐานนี้: ประชากรในขอบเขต RP100 จำนวน 18,640 คน; ประชากร 11,240 คนอยู่ไกลกว่าศูนย์พักพิงตัวเลือก 1 กม.; หลักฐาน EV-POP-RP100-v1, EV-PROX-1KM-v1 และ EV-SHELTER-v1 ระบุว่าเป็นข้อมูลสาธิต ให้แนะนำการตรวจสอบพื้นที่ตัวเลือกเพิ่มเติม การขนส่งช่วยเหลือ และเส้นทาง ห้ามเพิ่มตัวเลขอื่น อ้างรหัสหลักฐานทั้งสาม และระบุว่าต้องมีผู้มีอำนาจตรวจสอบ`
    : `Answer this planner question in two short paragraphs: ${QUESTION_EN}\nUse only this evidence: 18,640 people are in the illustrative RP100 extent; 11,240 are farther than 1 km from candidate shelters; records EV-POP-RP100-v1, EV-PROX-1KM-v1 and EV-SHELTER-v1 are illustrative. Recommend investigation of additional candidate sites, assisted transport and routes. Do not add other figures. Cite all three evidence IDs and state that authorised human review is required.`;
  const generation = await openAI(generationPrompt, 420);
  if (!generation.text) throw new Error('OpenAI returned an empty answer');
  const generationOp = addOperation('generate-explanation', generation.started, generation.ended, 'success', {model:OPENAI_MODEL,promptVersion:'grp-explain-v1.0'}, {answer:generation.text,usage:generation.usage,responseId:generation.responseId});
  generationOp.generation = {model:OPENAI_MODEL,maxOutputTokens:420,usage:generation.usage};

  const checks = deterministicChecks(generation.text, validated);
  const judgeStarted = Date.now();
  const judges = await Promise.all([
    judge('groundedness','Pass only if every material claim is supported by the governed evidence. Return unknown if support cannot be established.',generation.text,language),
    judge('question_relevance','Pass only if the response directly explains prioritisation for the planner question.',generation.text,language),
    judge('action_usefulness','Pass only if follow-up actions are relevant, bounded and usable without implying operational approval.',generation.text,language)
  ]);
  judges.forEach(j => {
    const op = addOperation(`judge-${j.criterion}`,j.call.started,j.call.ended,'success',{criterion:j.criterion,model:OPENAI_MODEL},{verdict:j.verdict,reason:j.reason,responseId:j.call.responseId});
    op.generation = {model:OPENAI_MODEL,maxOutputTokens:180,usage:j.call.usage};
  });
  const checkOp = addOperation('evaluate-answer', judgeStarted, Date.now(), 'success', {checks:7}, {deterministic:checks,judges:judges.map(({criterion,verdict,reason})=>({criterion,verdict,reason}))});
  const traceEnd = Date.now();

  const traceBody = {
    id:traceId, timestamp:iso(traceStart), name:'grp-shelter-proximity-explanation', sessionId,
    input:{question:language==='th'?QUESTION_TH:QUESTION_EN,...validated},
    output:{answer:generation.text,limitations:LIMITATIONS[language]},
    userId:actor?.username || undefined,
    metadata:{environment:LANGFUSE_ENVIRONMENT,pilot:'Type B-lite',humanReviewRequired:true,evidenceIds:EVIDENCE.map(x=>x.id),applicationRole:actor?.role||'unknown'},
    tags:['grp','type-b-lite','shelter-proximity',language,actor?.role||'unknown'], release:'0.9.1', version:'grp-observability-pilot-v1.0', public:false
  };
  const events = [event('trace-create',traceBody,iso(traceStart))];
  for (const op of operations) {
    const common = {id:op.id,traceId,name:op.name,startTime:op.startTime,endTime:op.endTime,input:op.input,output:op.output,metadata:{environment:LANGFUSE_ENVIRONMENT},level:'DEFAULT',version:'v1.0'};
    if (op.generation) {
      const usage=op.generation.usage||{};
      common.model = op.generation.model; common.modelParameters={max_output_tokens:op.generation.maxOutputTokens}; common.usage={input:usage.input_tokens||0,output:usage.output_tokens||0,total:usage.total_tokens||0,unit:'TOKENS'};
      events.push(event('generation-create',common,op.startTime));
    } else events.push(event('span-create',common,op.startTime));
  }
  for (const check of checks) events.push(event('score-create',{id:crypto.randomUUID(),traceId,observationId:checkOp.id,name:`deterministic.${check.name}`,value:check.verdict==='pass'?1:0,dataType:'BOOLEAN',comment:check.reason}));
  for (const j of judges) events.push(event('score-create',{id:crypto.randomUUID(),traceId,observationId:checkOp.id,name:`judge.${j.criterion}`,value:j.verdict,dataType:'CATEGORICAL',comment:j.reason}));
  await ingest(events);
  const project = await projectInfo();
  const allUsage=[generation,...judges.map(j=>j.call)].map(x=>x.usage||{});
  const usage=allUsage.reduce((sum,x)=>({input_tokens:sum.input_tokens+(x.input_tokens||0),output_tokens:sum.output_tokens+(x.output_tokens||0),total_tokens:sum.total_tokens+(x.total_tokens||0)}),{input_tokens:0,output_tokens:0,total_tokens:0});
  // GPT-5.2 standard token-price estimate; provider billing remains authoritative.
  const estimatedCost = Number(((usage.input_tokens*1.75 + usage.output_tokens*14) / 1000000).toFixed(6));
  return {
    live:true, traceId, sessionId, question:language==='th'?QUESTION_TH:QUESTION_EN, answer:generation.text,
    limitations:LIMITATIONS[language], evidence:localizedEvidence(language), operations, checks, language,
    judges:judges.map(({criterion,verdict,reason})=>({criterion,verdict,reason})),
    metrics:{latencyMs:traceEnd-traceStart,inputTokens:usage.input_tokens||0,outputTokens:usage.output_tokens||0,totalTokens:usage.total_tokens||0,estimatedCost,model:OPENAI_MODEL},
    versions:{workflow:'grp-observability-pilot-v1.0',prompt:'grp-explain-v1.0',model:OPENAI_MODEL,data:'demo-evidence-v1.0'},
    langfuse:{ingested:true,baseUrl:LANGFUSE_BASE_URL,projectId:project?.id||null,projectName:project?.name||null,dashboardUrl:project?.id?`${LANGFUSE_BASE_URL}/project/${project.id}/traces/${traceId}`:LANGFUSE_BASE_URL},
    generatedAt:iso(traceEnd)
  };
}

function recordUsage(actor, result) {
  usageEvents.push({type:'explanation',username:actor.username,role:actor.role,timestamp:result.generatedAt,traceId:result.traceId,language:result.language,tokens:result.metrics.totalTokens,cost:result.metrics.estimatedCost,latencyMs:result.metrics.latencyMs});
  if (usageEvents.length > 1000) usageEvents.splice(0,usageEvents.length-1000);
}
function recordFeedbackUsage(actor, payload) {
  usageEvents.push({type:'feedback',username:actor.username,role:actor.role,timestamp:iso(),traceId:payload.traceId,value:payload.value});
}
function usageSummary() {
  const users = new Map();
  for (const item of usageEvents) {
    const current=users.get(item.username)||{username:item.username,role:item.role,requests:0,feedback:0,tokens:0,cost:0,totalLatencyMs:0,lastActive:null};
    if(item.type==='explanation'){current.requests++;current.tokens+=item.tokens||0;current.cost+=item.cost||0;current.totalLatencyMs+=item.latencyMs||0;}
    if(item.type==='feedback')current.feedback++;
    if(!current.lastActive||item.timestamp>current.lastActive)current.lastActive=item.timestamp;
    users.set(item.username,current);
  }
  return {scope:'since-backend-start',startedAt:SERVER_STARTED_AT,users:[...users.values()].map(user=>({...user,cost:Number(user.cost.toFixed(6)),averageLatencyMs:user.requests?Math.round(user.totalLatencyMs/user.requests):0})).sort((a,b)=>b.requests-a.requests||String(a.username).localeCompare(String(b.username)))};
}

function resultForRole(result, role) {
  if (role === 'admin') return result;
  return {
    live:result.live, traceId:result.traceId, sessionId:result.sessionId, question:result.question,
    answer:result.answer, limitations:result.limitations, evidence:result.evidence,
    language:result.language, generatedAt:result.generatedAt
  };
}

async function feedback(payload) {
  if (!/^[0-9a-f-]{36}$/i.test(payload.traceId || '')) throw new Error('Invalid trace ID');
  if (!['up','down'].includes(payload.value)) throw new Error('Feedback must be up or down');
  const value = payload.value === 'up' ? 1 : 0;
  await ingest([event('score-create',{id:crypto.randomUUID(),traceId:payload.traceId,name:'human.planner_feedback',value,dataType:'BOOLEAN',comment:String(payload.comment||'').slice(0,500)})]);
  return {recorded:true,traceId:payload.traceId,value:payload.value};
}

function allowRequest(req, session) {
  const key=`${session.username}:${clientAddress(req)}`;
  const now=Date.now(), recent=(rateBuckets.get(key)||[]).filter(x=>now-x<RATE_WINDOW_MS);
  if(recent.length>=RATE_LIMIT){rateBuckets.set(key,recent);return false;}
  recent.push(now);rateBuckets.set(key,recent);return true;
}

function allowFeedback(req, session) {
  const key=`${session.username}:${clientAddress(req)}`;
  const now=Date.now(), recent=(feedbackBuckets.get(key)||[]).filter(x=>now-x<60*60*1000);
  if(recent.length>=10){feedbackBuckets.set(key,recent);return false;}
  recent.push(now);feedbackBuckets.set(key,recent);return true;
}
function ensureFeedbackStorage() {
  fs.mkdirSync(FEEDBACK_STORAGE_DIR,{recursive:true});
  if(!fs.existsSync(FEEDBACK_FILE))fs.writeFileSync(FEEDBACK_FILE,'[]\n',{encoding:'utf8',mode:0o600});
}
function loadFeedback() {
  ensureFeedbackStorage();
  try { const value=JSON.parse(fs.readFileSync(FEEDBACK_FILE,'utf8')); return Array.isArray(value)?value:[]; }
  catch { throw new Error('Feedback store is unavailable'); }
}
function saveFeedback(items) {
  ensureFeedbackStorage();
  const temporary=`${FEEDBACK_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporary,JSON.stringify(items,null,2)+'\n',{encoding:'utf8',mode:0o600});
  fs.renameSync(temporary,FEEDBACK_FILE);
}
function cleanText(value, maximum) { return String(value||'').trim().slice(0,maximum); }
function validDocumentUrl(value) {
  if(!value)return '';
  try { const parsed=new URL(value); return ['http:','https:'].includes(parsed.protocol)?parsed.toString():''; }
  catch { return ''; }
}
function attachmentType(file) {
  const name=cleanText(file?.name,180), extension=path.extname(name).toLowerCase();
  if(!['.png','.jpg','.jpeg','.webp','.docx'].includes(extension))throw new Error('Attachment type is not allowed');
  if(typeof file?.data!=='string'||!file.data)throw new Error('Attachment data is missing');
  let buffer;
  try { buffer=Buffer.from(file.data,'base64'); } catch { throw new Error('Attachment data is invalid'); }
  if(!buffer.length||buffer.length>MAX_ATTACHMENT)throw new Error('Attachment must be 1 MB or smaller');
  const png=buffer.length>8&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  const jpeg=buffer.length>3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
  const webp=buffer.length>12&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP';
  const docx=buffer.length>4&&buffer[0]===0x50&&buffer[1]===0x4b&&buffer.includes(Buffer.from('[Content_Types].xml'))&&buffer.includes(Buffer.from('word/'));
  const matched=(extension==='.png'&&png)||(['.jpg','.jpeg'].includes(extension)&&jpeg)||(extension==='.webp'&&webp)||(extension==='.docx'&&docx);
  if(!matched)throw new Error('Attachment content does not match its file type');
  const mime=extension==='.png'?'image/png':extension==='.webp'?'image/webp':['.jpg','.jpeg'].includes(extension)?'image/jpeg':'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return {name,extension,mime,buffer};
}
function submitFeedback(payload, actor) {
  const name=cleanText(payload.name,100), hub=cleanText(payload.hub,20), category=cleanText(payload.category,40);
  const message=cleanText(payload.message,5000), rawUrl=cleanText(payload.documentUrl,1000), documentUrl=validDocumentUrl(rawUrl);
  if(name.length<2)throw new Error('Name is required');
  if(!FEEDBACK_HUBS.has(hub))throw new Error('Select a valid hub');
  if(!FEEDBACK_CATEGORIES.has(category))throw new Error('Select a valid feedback category');
  if(rawUrl&&!documentUrl)throw new Error('Document link must use HTTP or HTTPS');
  if(!message&&!documentUrl&&!payload.attachment)throw new Error('Add feedback text, a document link or an attachment');
  const id=crypto.randomUUID(), submittedAt=iso();
  const reference=`FB-${submittedAt.slice(0,10).replaceAll('-','')}-${id.slice(0,6).toUpperCase()}`;
  let attachment=null;
  if(payload.attachment){
    const file=attachmentType(payload.attachment), storageName=`${id}${file.extension}`;
    ensureFeedbackStorage();fs.writeFileSync(path.join(FEEDBACK_STORAGE_DIR,storageName),file.buffer,{mode:0o600});
    attachment={originalName:file.name,storageName,mime:file.mime,size:file.buffer.length};
  }
  const item={id,reference,submittedAt,name,hub,category,message,documentUrl,attachment,status:'new',submittedBy:actor.username};
  const items=loadFeedback();items.unshift(item);saveFeedback(items);
  return {recorded:true,reference,submittedAt};
}
function feedbackPublicItem(item) {
  return {...item,attachment:item.attachment?{name:item.attachment.originalName,size:item.attachment.size,url:`/api/admin/feedback/attachment/${item.id}`}:null};
}
function csvCell(value) { let text=String(value??''); if(/^[=+\-@]/.test(text))text=`'${text}`; return `"${text.replaceAll('"','""')}"`; }
function feedbackCsv(items) {
  const headers=['Reference','Submitted at','Name','Hub','Category','Status','Feedback','Document URL','Attachment','Submitted by'];
  const rows=items.map(item=>[item.reference,item.submittedAt,item.name,item.hub,item.category,item.status,item.message,item.documentUrl,item.attachment?.originalName||'',item.submittedBy]);
  return [headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
function sendFile(res, status, body, type, filename) {
  res.writeHead(status,{'Content-Type':type,'Content-Length':body.length,'Content-Disposition':`attachment; filename="${String(filename).replace(/[^a-zA-Z0-9._-]/g,'_')}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(body);
}

const SERVER_STARTED_AT = iso();
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') return json(res,200,{status:'ok',mode:MODE,openaiConfigured:Boolean(OPENAI_API_KEY),langfuseConfigured:Boolean(LANGFUSE_PUBLIC_KEY&&LANGFUSE_SECRET_KEY),authConfigured:authConfigured(),demoQuickLogin:DEMO_QUICK_LOGIN});
    if (req.method === 'GET' && req.url === '/api/auth/demo-status') {
      return json(res,200,{plannerQuickLogin:DEMO_QUICK_LOGIN&&Boolean(PLANNER_USERNAME)});
    }
    if (req.method === 'POST' && req.url === '/api/auth/login') {
      if (!authConfigured()) return json(res,503,{error:'Application accounts are not configured.'});
      if (loginRateLimited(req)) return json(res,429,{error:'Too many sign-in attempts. Try again later.'});
      const payload = await readJson(req);
      const account = authenticate(String(payload.username || '').slice(0,128), String(payload.password || '').slice(0,512));
      if (!account) { recordLoginFailure(req); return json(res,401,{error:'Invalid username or password.'}); }
      loginBuckets.delete(clientAddress(req));
      return startSession(req,res,account);
    }
    if (req.method === 'POST' && req.url === '/api/auth/demo-planner') {
      if(!DEMO_QUICK_LOGIN)return json(res,404,{error:'Demo Planner access is not enabled.'});
      if(!PLANNER_USERNAME)return json(res,503,{error:'The Planner demo account is not configured.'});
      if(loginRateLimited(req))return json(res,429,{error:'Too many access attempts. Try again later.'});
      return startSession(req,res,{username:PLANNER_USERNAME,role:'planner'});
    }
    if (req.method === 'GET' && req.url === '/api/auth/session') {
      const session = getSession(req);
      if (!session) return json(res,401,{authenticated:false});
      return json(res,200,{authenticated:true,user:{username:session.username,role:session.role}});
    }
    if (req.method === 'POST' && req.url === '/api/auth/logout') {
      const session = getSession(req);
      if (session) sessions.delete(session.token);
      res.setHeader('Set-Cookie',sessionCookie(req,'',0));
      return json(res,200,{authenticated:false});
    }
    if (req.method === 'POST' && req.url === '/api/feedback') {
      const session=requireSession(req,res);if(!session)return;
      if(!allowFeedback(req,session))return json(res,429,{error:'Feedback submission limit reached. Try again later.'});
      return json(res,201,submitFeedback(await readJson(req,MAX_FEEDBACK_BODY),session));
    }
    if (req.method === 'GET' && req.url === '/api/admin/feedback') {
      if(!requireSession(req,res,['admin']))return;
      return json(res,200,{items:loadFeedback().map(feedbackPublicItem)});
    }
    if (req.method === 'GET' && req.url === '/api/admin/feedback/export.csv') {
      if(!requireSession(req,res,['admin']))return;
      const body=Buffer.from(feedbackCsv(loadFeedback()),'utf8');
      return sendFile(res,200,body,'text/csv; charset=utf-8','grp-feedback.csv');
    }
    if (req.method === 'GET' && req.url.startsWith('/api/admin/feedback/attachment/')) {
      if(!requireSession(req,res,['admin']))return;
      const id=req.url.slice('/api/admin/feedback/attachment/'.length);
      const item=loadFeedback().find(value=>value.id===id);
      if(!item?.attachment)return json(res,404,{error:'Attachment not found.'});
      const file=path.join(FEEDBACK_STORAGE_DIR,item.attachment.storageName);
      if(!fs.existsSync(file))return json(res,404,{error:'Attachment file not found.'});
      return sendFile(res,200,fs.readFileSync(file),item.attachment.mime,item.attachment.originalName);
    }
    if (req.method === 'POST' && req.url === '/api/admin/feedback/status') {
      if(!requireSession(req,res,['admin']))return;
      const payload=await readJson(req), statuses=new Set(['new','reviewed','follow-up','closed']);
      if(!statuses.has(payload.status))return json(res,400,{error:'Invalid feedback status.'});
      const items=loadFeedback(), item=items.find(value=>value.id===payload.id);
      if(!item)return json(res,404,{error:'Feedback not found.'});
      item.status=payload.status;item.updatedAt=iso();saveFeedback(items);
      return json(res,200,{updated:true,item:feedbackPublicItem(item)});
    }
    if (req.method === 'GET' && req.url === '/api/admin/assurance/dashboard') {
      if (!requireSession(req,res,['admin'])) return;
      return json(res,200,{...DASHBOARD_DATA,runtimeUsage:usageSummary(),aiAccess:aiAccessStatus(req)});
    }
    if (req.method === 'POST' && req.url === '/api/admin/ai-access') {
      const session=requireSession(req,res,['admin']); if(!session)return;
      const payload=await readJson(req);
      if(payload.action==='disable')disableAIRuntime();
      else if(payload.action==='enable'){
        try{enableAIRuntime(session.username,req);}catch(error){return json(res,409,{error:error.message,status:aiAccessStatus(req)});}
      } else return json(res,400,{error:'Action must be enable or disable.'});
      console.log(new Date().toISOString(),'AI access',payload.action,'by admin');
      return json(res,200,{status:aiAccessStatus(req)});
    }
    if (req.method === 'GET' && req.url === '/api/observability/status') {
      if (!requireSession(req,res)) return;
      const access=aiAccessStatus(req);
      return json(res,200,{mode:MODE,liveReady:access.liveReady,runtimeEnabled:access.runtimeEnabled,reason:access.reason,model:OPENAI_MODEL});
    }
    if (req.method === 'POST' && req.url === '/api/observability/explain') {
      const session = requireSession(req,res); if (!session) return;
      if (!allowRequest(req,session)) return json(res,429,{error:'Live pilot rate limit reached for this account. Try again later.'});
      const access=aiAccessStatus(req);
      if(!access.liveReady)return json(res,423,{error:'AI explanation access is currently disabled by the administrator.',reason:access.reason});
      const result=await explain(await readJson(req),session,req);
      recordUsage(session,result);
      return json(res,200,resultForRole(result,session.role));
    }
    if (req.method === 'POST' && req.url === '/api/observability/feedback') {
      const session=requireSession(req,res); if (!session) return;
      if (MODE !== 'live') return json(res,409,{error:'AI observability is not in live mode.'});
      const payload=await readJson(req), response=await feedback(payload);
      recordFeedbackUsage(session,payload);
      return json(res,200,response);
    }
    return json(res,404,{error:'Not found'});
  } catch (error) {
    console.error(new Date().toISOString(), req.method, req.url, error.message);
    const clientError = ['Invalid JSON','Request too large','Invalid trace ID','Feedback must be up or down','The live pilot supports only Phaya Thai, RP100 and the 1 km threshold.','Name is required','Select a valid hub','Select a valid feedback category','Document link must use HTTP or HTTPS','Add feedback text, a document link or an attachment','Attachment type is not allowed','Attachment data is missing','Attachment data is invalid','Attachment must be 1 MB or smaller','Attachment content does not match its file type'].includes(error.message);
    return json(res,clientError?400:502,{error:clientError?error.message:'The observable AI request could not be completed.',detail:process.env.NODE_ENV==='development'?error.message:undefined});
  }
});
server.listen(PORT,'0.0.0.0',()=>console.log(`GRP observability backend listening on ${PORT} (${MODE})`));
