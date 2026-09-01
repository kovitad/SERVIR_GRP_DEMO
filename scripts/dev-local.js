const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const envFile = path.join(root, '.env');
const host = '127.0.0.1';
const port = Number(process.env.DEV_PORT || 8080);
const backendPort = Number(process.env.DEV_BACKEND_PORT || 3000);

function loadEnv(file) {
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0,index).trim();
    let value = line.slice(index+1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value=value.slice(1,-1);
    values[key]=value;
  }
  return values;
}

if (!fs.existsSync(envFile)) {
  console.error('Missing .env. Copy .env.example to .env and configure the controlled pilot first.');
  process.exit(1);
}

const childEnv = {...process.env,...loadEnv(envFile),PORT:String(backendPort),NODE_ENV:'development'};
const backend = spawn(process.execPath,[path.join(root,'backend','server.js')],{env:childEnv,stdio:'inherit'});
backend.on('exit',code=>{if(code && code!==0){console.error(`Backend exited with code ${code}`);process.exitCode=code;}});

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};

function proxy(req,res){
  const upstream=http.request({hostname:host,port:backendPort,path:req.url,method:req.method,headers:{...req.headers,host:`${host}:${backendPort}`}},up=>{
    res.writeHead(up.statusCode||502,{...up.headers,'cache-control':'no-store'});up.pipe(res);
  });
  upstream.on('error',error=>{res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Local observability backend unavailable.',detail:error.message}));});
  req.pipe(upstream);
}

function staticFile(req,res){
  const requestPath=decodeURIComponent(new URL(req.url,`http://${host}`).pathname);
  const relative=requestPath==='/'?'index.html':requestPath.replace(/^\/+/, '');
  let file=path.resolve(publicDir,relative);
  if(!file.startsWith(publicDir+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(publicDir,'index.html');
  const headers={'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':path.basename(file)==='index.html'?'no-store':'no-cache'};
  res.writeHead(200,headers);
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
}

const server=http.createServer((req,res)=>req.url.startsWith('/api/')?proxy(req,res):staticFile(req,res));
server.listen(port,host,()=>{
  console.log(`\nGRP local pilot: http://${host}:${port}`);
  console.log(`Protected status: http://${host}:${port}/api/observability/status (sign in first)`);
  console.log('Press Ctrl+C to stop both services.\n');
});

function shutdown(){server.close(()=>{});if(!backend.killed)backend.kill();setTimeout(()=>process.exit(0),100).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);process.on('exit',()=>{if(!backend.killed)backend.kill();});
