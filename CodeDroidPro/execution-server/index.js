const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const LANGS = {
  python:     { ext:'py',  run:(f)=>`python3 "${f}"` },
  javascript: { ext:'js',  run:(f)=>`node "${f}"` },
  typescript: { ext:'ts',  run:(f)=>`npx ts-node "${f}"` },
  c:          { ext:'c',   run:(f)=>`gcc "${f}" -o "${f}.out" -lm -lpthread && "${f}.out"` },
  cpp:        { ext:'cpp', run:(f)=>`g++ "${f}" -o "${f}.out" -std=c++17 && "${f}.out"` },
  java:       { ext:'java',run:(f)=>`cd "${path.dirname(f)}" && javac "${path.basename(f)}" && java "${path.basename(f,'.java')}"` },
  bash:       { ext:'sh',  run:(f)=>`bash "${f}"` },
  golang:     { ext:'go',  run:(f)=>`go run "${f}"` },
  ruby:       { ext:'rb',  run:(f)=>`ruby "${f}"` },
  php:        { ext:'php', run:(f)=>`php "${f}"` },
  lua:        { ext:'lua', run:(f)=>`lua "${f}"` },
  rust:       { ext:'rs',  run:(f)=>`rustc "${f}" -o "${f}.out" 2>&1 && "${f}.out"` },
  r:          { ext:'r',   run:(f)=>`Rscript "${f}"` },
  kotlin:     { ext:'kt',  run:(f)=>`cd "${path.dirname(f)}" && kotlinc "${path.basename(f)}" -include-runtime -d out.jar 2>&1 && java -jar out.jar` },
  swift:      { ext:'swift',run:(f)=>`swift "${f}"` },
};

app.get('/health', (req,res) => res.json({
  status:'ok', node:process.version,
  languages:Object.keys(LANGS),
  uptime:process.uptime(),
  platform:os.platform(),
  memory:{ free:os.freemem(), total:os.totalmem() }
}));

app.post('/execute', (req,res) => {
  const { language, filename, code, stdin='', timeout=20000, args=[] } = req.body;
  const cfg = LANGS[language];
  if (!cfg) return res.json({ output:`❌ '${language}' not supported. Available: ${Object.keys(LANGS).join(', ')}`, exitCode:1 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'cdr-'));
  const file = path.join(tmpDir, filename||`main.${cfg.ext}`);
  fs.writeFileSync(file, code);

  const proc = exec(cfg.run(file), {
    timeout, maxBuffer:10*1024*1024,
    env:{...process.env, PYTHONDONTWRITEBYTECODE:'1'}
  }, (err,stdout,stderr) => {
    try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}
    const output = (stdout+stderr).trim()||'(no output)';
    res.json({ output, exitCode:err?.code??0, language, filename });
  });

  if (stdin && proc.stdin) { proc.stdin.write(stdin); proc.stdin.end(); }
});

app.post('/execute-project', (req,res) => {
  const { files, mainFile, language, stdin='', timeout=30000 } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'cdr-proj-'));

  files.forEach(f => {
    const fp = path.join(tmpDir, f.name);
    fs.mkdirSync(path.dirname(fp),{recursive:true});
    fs.writeFileSync(fp, f.content);
  });

  const cfg = LANGS[language];
  if (!cfg) return res.json({ output:`Language not supported`, exitCode:1 });
  const mainPath = path.join(tmpDir, mainFile);

  const proc = exec(cfg.run(mainPath), {
    cwd:tmpDir, timeout, maxBuffer:10*1024*1024
  }, (err,stdout,stderr) => {
    try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}
    res.json({ output:(stdout+stderr).trim()||'(no output)', exitCode:err?.code??0 });
  });
  if (stdin && proc.stdin) { proc.stdin.write(stdin); proc.stdin.end(); }
});

app.post('/install', (req,res) => {
  const { language, packages } = req.body;
  if (!packages?.length) return res.json({ output:'No packages', exitCode:1 });
  let cmd = language==='python'
    ? `pip3 install ${packages.join(' ')} 2>&1`
    : `npm install -g ${packages.join(' ')} 2>&1`;
  exec(cmd, {timeout:120000,maxBuffer:5*1024*1024}, (err,stdout,stderr) => {
    res.json({ output:(stdout+stderr).trim(), exitCode:err?.code??0 });
  });
});

app.post('/terminal', (req,res) => {
  const { command, cwd='/tmp', timeout=30000 } = req.body;
  const blocked = ['rm -rf /','mkfs',':(){ :|:& }'];
  if (blocked.some(b=>command.includes(b))) return res.json({output:'⛔ Blocked',exitCode:1});
  exec(command, {cwd,timeout,maxBuffer:5*1024*1024}, (err,stdout,stderr) => {
    res.json({ output:(stdout+stderr).trim()||'(no output)', exitCode:err?.code??0 });
  });
});

app.post('/git', (req,res) => {
  const { op, cwd='/tmp', params={} } = req.body;
  const ops = {
    status:  `git status --short`,
    log:     `git log --oneline -20`,
    diff:    `git diff`,
    add:     `git add ${params.files||'.'}`,
    commit:  `git commit -m "${(params.message||'Update').replace(/"/g,"'")}"`,
    push:    `git push origin ${params.branch||'main'}`,
    pull:    `git pull`,
    clone:   `git clone "${params.url}" .`,
    branch:  `git branch -a`,
    checkout:`git checkout ${params.branch||'main'}`,
    init:    `git init && git add . && git commit -m "Initial commit"`,
    stash:   `git stash`,
    pop:     `git stash pop`,
  };
  const cmd = ops[op];
  if (!cmd) return res.json({output:`Unknown op: ${op}`,exitCode:1});
  exec(cmd, {cwd,timeout:30000,maxBuffer:2*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}},
    (err,stdout,stderr) => res.json({output:(stdout+stderr).trim(),exitCode:err?.code??0}));
});

app.get('/sysinfo', (req,res) => {
  exec('python3 --version 2>&1; node --version; gcc --version 2>&1 | head -1; java -version 2>&1 | head -1; go version 2>&1; rustc --version 2>&1',
    {timeout:10000}, (err,stdout,stderr) => {
    res.json({ tools:(stdout+stderr).trim(), os:`${os.type()} ${os.release()}`,
      cpu:os.cpus()[0]?.model, cores:os.cpus().length,
      mem:`${Math.round(os.freemem()/1024/1024)}MB free / ${Math.round(os.totalmem()/1024/1024)}MB total`,
      uptime:`${Math.round(os.uptime()/3600)}h ${Math.round((os.uptime()%3600)/60)}m` });
  });
});

app.post('/format', (req,res) => {
  const { code, language } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'fmt-'));
  const ext = {python:'py',javascript:'js',typescript:'ts',css:'css',html:'html',json:'json'}[language]||'txt';
  const file = path.join(tmpDir,`code.${ext}`);
  fs.writeFileSync(file,code);
  let cmd = '';
  if (language==='python') cmd=`black "${file}" 2>&1 && cat "${file}"`;
  else if (['javascript','typescript'].includes(language)) cmd=`npx prettier --write "${file}" 2>&1 && cat "${file}"`;
  else { try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{} return res.json({code,exitCode:0}); }
  exec(cmd,{timeout:15000,maxBuffer:2*1024*1024},(err,stdout,stderr)=>{
    try{const formatted=fs.readFileSync(file,'utf8');fs.rmSync(tmpDir,{recursive:true,force:true});res.json({code:formatted,exitCode:0});}
    catch{res.json({code,exitCode:1,error:stderr});}
  });
});

const server = http.createServer(app);

const wss = new WebSocketServer({server, path:'/ws'});
const sessions = new Map();

wss.on('connection', (ws) => {
  const sid = Date.now().toString();
  let cwd = '/tmp';
  sessions.set(sid, {ws,cwd});

  ws.send(JSON.stringify({type:'ready',data:'🚀 CodeDroid Terminal v2.0\r\nType commands below:\r\n$ '}));

  ws.on('message', (raw) => {
    try {
      const {type,command,newCwd} = JSON.parse(raw);
      if (type==='cd') { cwd=newCwd||'/tmp'; ws.send(JSON.stringify({type:'output',data:`Changed to: ${cwd}\r\n$ `})); return; }
      if (type==='command') {
        const blocked=['rm -rf /','mkfs'];
        if (blocked.some(b=>command.includes(b))) { ws.send(JSON.stringify({type:'output',data:'⛔ Blocked\r\n$ '})); return; }
        if (command.trim().startsWith('cd ')) {
          const dir = command.trim().slice(3).trim();
          const newDir = path.resolve(cwd, dir);
          try { fs.accessSync(newDir); cwd=newDir; ws.send(JSON.stringify({type:'output',data:`$ `})); }
          catch { ws.send(JSON.stringify({type:'output',data:`cd: ${dir}: No such file\r\n$ `})); }
          return;
        }
        exec(command, {cwd,timeout:30000,maxBuffer:2*1024*1024,env:{...process.env,TERM:'xterm'}},
          (err,stdout,stderr) => {
          const out = (stdout+stderr)||'';
          ws.send(JSON.stringify({type:'output',data:out+(out.endsWith('\n')?'':'\r\n')+'$ '}));
        });
      }
    } catch(e) { ws.send(JSON.stringify({type:'error',data:e.message})); }
  });

  ws.on('close', () => sessions.delete(sid));
});

const PORT = process.env.PORT||3001;
server.listen(PORT, () => {
  console.log(`🚀 CodeDroid Execution Server v2.0 — PORT ${PORT}`);
  console.log(`Languages: ${Object.keys(LANGS).join(', ')}`);
});
