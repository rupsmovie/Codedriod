const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Language Config ──────────────────────────────────
const LANGS = {
  python:     { ext:'py',   run:(f)=>`python3 "${f}"` },
  javascript: { ext:'js',   run:(f)=>`node "${f}"` },
  typescript: { ext:'ts',   run:(f)=>`npx ts-node "${f}"` },
  c:          { ext:'c',    run:(f)=>`gcc "${f}" -o "${f}.out" -lm -lpthread && "${f}.out"` },
  cpp:        { ext:'cpp',  run:(f)=>`g++ "${f}" -o "${f}.out" -std=c++17 && "${f}.out"` },
  java:       { ext:'java', run:(f)=>`cd "${path.dirname(f)}" && javac "${path.basename(f)}" && java "${path.basename(f,'.java')}"` },
  bash:       { ext:'sh',   run:(f)=>`bash "${f}"` },
  golang:     { ext:'go',   run:(f)=>`go run "${f}"` },
  ruby:       { ext:'rb',   run:(f)=>`ruby "${f}"` },
  php:        { ext:'php',  run:(f)=>`php "${f}"` },
  lua:        { ext:'lua',  run:(f)=>`lua "${f}"` },
  rust:       { ext:'rs',   run:(f)=>`rustc "${f}" -o "${f}.out" && "${f}.out"` },
  r:          { ext:'r',    run:(f)=>`Rscript "${f}"` },
  kotlin:     { ext:'kt',   run:(f)=>`cd "${path.dirname(f)}" && kotlinc "${path.basename(f)}" -include-runtime -d out.jar 2>&1 && java -jar out.jar` },
  swift:      { ext:'swift',run:(f)=>`swift "${f}"` },
  python2:    { ext:'py',   run:(f)=>`python2 "${f}"` },
  perl:       { ext:'pl',   run:(f)=>`perl "${f}"` },
  scala:      { ext:'scala',run:(f)=>`scala "${f}"` },
};

// ── Helpers ──────────────────────────────────────────
function runCmd(cmd, opts={}, timeout=30000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout, maxBuffer:10*1024*1024, ...opts }, (err,stdout,stderr) => {
      resolve({ output:(stdout+stderr).trim(), exitCode:err?.code??0 });
    });
  });
}

function runCmdWithStdin(cmd, stdin, opts={}, timeout=20000) {
  return new Promise((resolve) => {
    const proc = exec(cmd, { timeout, maxBuffer:10*1024*1024, ...opts }, (err,stdout,stderr) => {
      resolve({ output:(stdout+stderr).trim(), exitCode:err?.code??0 });
    });
    if (stdin) { proc.stdin?.write(stdin); proc.stdin?.end(); }
  });
}

// ── Health ───────────────────────────────────────────
app.get('/health', async (req,res) => {
  const tools = await runCmd('python3 --version 2>&1; node --version; gcc --version 2>&1 | head -1; java -version 2>&1 | head -1; go version 2>&1; rustc --version 2>&1; ruby --version 2>&1');
  res.json({
    status:'ok', node:process.version,
    languages:Object.keys(LANGS),
    uptime:Math.round(process.uptime()),
    memory:{ free:Math.round(os.freemem()/1024/1024)+'MB', total:Math.round(os.totalmem()/1024/1024)+'MB' },
    platform:os.platform(), arch:os.arch(),
    tools:tools.output
  });
});

// ── Execute Code ─────────────────────────────────────
app.post('/execute', async (req,res) => {
  const { language, filename, code, stdin='', timeout=20000, args=[] } = req.body;
  const cfg = LANGS[language];
  if (!cfg) return res.json({ output:`❌ Language '${language}' not supported\nAvailable: ${Object.keys(LANGS).join(', ')}`, exitCode:1 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'cdr-'));
  const file = path.join(tmpDir, filename||`main.${cfg.ext}`);
  fs.writeFileSync(file, code);

  const result = await runCmdWithStdin(cfg.run(file), stdin, { cwd:tmpDir }, timeout);
  try { fs.rmSync(tmpDir, {recursive:true, force:true}); } catch {}
  res.json({ ...result, language, filename });
});

// ── Execute Project (multiple files) ─────────────────
app.post('/execute-project', async (req,res) => {
  const { files, mainFile, language, stdin='', timeout=30000 } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'cdr-proj-'));

  for (const f of files) {
    const fp = path.join(tmpDir, f.name);
    fs.mkdirSync(path.dirname(fp), {recursive:true});
    fs.writeFileSync(fp, f.content);
  }

  const cfg = LANGS[language];
  if (!cfg) return res.json({ output:'Language not supported', exitCode:1 });

  const mainPath = path.join(tmpDir, mainFile);
  const result = await runCmdWithStdin(cfg.run(mainPath), stdin, {cwd:tmpDir}, timeout);
  try { fs.rmSync(tmpDir, {recursive:true, force:true}); } catch {}
  res.json(result);
});

// ── Terminal Command ──────────────────────────────────
const BLOCKED = ['rm -rf /', 'mkfs', ':(){ :|:& };:', 'dd if=/dev/zero of=/dev/'];
app.post('/terminal', async (req,res) => {
  const { command, cwd='/tmp', timeout=30000, env={} } = req.body;
  if (BLOCKED.some(b=>command.includes(b))) return res.json({output:'⛔ Command blocked for safety',exitCode:1});
  const result = await runCmd(command, { cwd, env:{...process.env,...env} }, timeout);
  res.json(result);
});

// ── Package Manager ───────────────────────────────────
app.post('/install', async (req,res) => {
  const { manager, packages, flags='' } = req.body;
  if (!packages?.length) return res.json({output:'No packages specified',exitCode:1});

  const managers = {
    pip:    `pip3 install ${packages.join(' ')} ${flags} 2>&1`,
    pip2:   `pip2 install ${packages.join(' ')} ${flags} 2>&1`,
    npm:    `npm install ${packages.join(' ')} ${flags} 2>&1`,
    npx:    `npx ${packages.join(' ')} ${flags} 2>&1`,
    gem:    `gem install ${packages.join(' ')} 2>&1`,
    cargo:  `cargo install ${packages.join(' ')} 2>&1`,
    apt:    `apt-get install -y ${packages.join(' ')} 2>&1`,
    go:     `go install ${packages.map(p=>p+'@latest').join(' ')} 2>&1`,
    composer: `composer require ${packages.join(' ')} 2>&1`,
  };

  const cmd = managers[manager];
  if (!cmd) return res.json({output:`Unknown manager: ${manager}. Available: ${Object.keys(managers).join(', ')}`,exitCode:1});

  const result = await runCmd(cmd, {}, 120000);
  res.json(result);
});

// ── Package Search ────────────────────────────────────
app.post('/search', async (req,res) => {
  const { manager, query } = req.body;
  let result;
  if (manager==='pip') result = await runCmd(`pip3 search ${query} 2>&1 || pip3 index versions ${query} 2>&1`);
  else if (manager==='npm') result = await runCmd(`npm search ${query} --json 2>&1 | head -50`);
  else result = { output:`Search not available for ${manager}`, exitCode:0 };
  res.json(result);
});

// ── Pip List / npm list ───────────────────────────────
app.get('/packages/:manager', async (req,res) => {
  const { manager } = req.params;
  let result;
  if (manager==='pip') result = await runCmd('pip3 list --format=columns 2>&1');
  else if (manager==='npm') result = await runCmd('npm list -g --depth=0 2>&1');
  else if (manager==='gem') result = await runCmd('gem list 2>&1');
  else if (manager==='cargo') result = await runCmd('cargo install --list 2>&1');
  else result = { output:'Unknown manager', exitCode:1 };
  res.json(result);
});

// ── Git Operations ────────────────────────────────────
app.post('/git', async (req,res) => {
  const { op, cwd='/tmp', params={} } = req.body;
  const ops = {
    status:   `git status`,
    log:      `git log --oneline --graph --decorate -20`,
    diff:     `git diff ${params.file||''}`,
    diff_cached: `git diff --cached`,
    add:      `git add ${params.files||'.'}`,
    commit:   `git commit -m "${(params.message||'Update').replace(/"/g,"'")}"`,
    push:     `git push origin ${params.branch||'main'} ${params.token?`https://${params.token}@github.com`:''} 2>&1`,
    pull:     `git pull`,
    fetch:    `git fetch --all`,
    clone:    `git clone "${params.url}" . 2>&1`,
    branch:   `git branch -a`,
    checkout: `git checkout ${params.branch}`,
    merge:    `git merge ${params.branch}`,
    stash:    `git stash`,
    pop:      `git stash pop`,
    reset:    `git reset --hard HEAD`,
    init:     `git init && git add . && git commit -m "Initial commit"`,
    remote:   `git remote -v`,
    tag:      `git tag ${params.tag||''}`,
    blame:    `git blame ${params.file||''} 2>&1`,
  };
  const cmd = ops[op];
  if (!cmd) return res.json({output:`Unknown op: ${op}`,exitCode:1});
  const result = await runCmd(cmd, {cwd, env:{...process.env,GIT_TERMINAL_PROMPT:'0'}}, 60000);
  res.json(result);
});

// ── File System ───────────────────────────────────────
app.post('/fs', async (req,res) => {
  const { op, filePath, content, encoding='utf8', dest } = req.body;
  try {
    if (op==='read')   { const d=fs.readFileSync(filePath,encoding); res.json({content:d,exitCode:0}); }
    else if (op==='write')  { fs.mkdirSync(path.dirname(filePath),{recursive:true}); fs.writeFileSync(filePath,content||'',encoding); res.json({output:'OK',exitCode:0}); }
    else if (op==='list')   { const items=fs.readdirSync(filePath).map(n=>{const s=fs.statSync(path.join(filePath,n));return{name:n,isDir:s.isDirectory(),size:s.size,modified:s.mtime};}); res.json({items,exitCode:0}); }
    else if (op==='delete') { fs.rmSync(filePath,{recursive:true,force:true}); res.json({output:'Deleted',exitCode:0}); }
    else if (op==='mkdir')  { fs.mkdirSync(filePath,{recursive:true}); res.json({output:'Created',exitCode:0}); }
    else if (op==='rename') { fs.renameSync(filePath,dest); res.json({output:'Renamed',exitCode:0}); }
    else if (op==='copy')   { fs.copyFileSync(filePath,dest); res.json({output:'Copied',exitCode:0}); }
    else if (op==='exists') { res.json({exists:fs.existsSync(filePath),exitCode:0}); }
    else if (op==='stat')   { const s=fs.statSync(filePath); res.json({size:s.size,modified:s.mtime,isDir:s.isDirectory(),exitCode:0}); }
    else res.json({output:'Unknown op',exitCode:1});
  } catch(e) { res.json({output:e.message,exitCode:1}); }
});

// ── Format Code ───────────────────────────────────────
app.post('/format', async (req,res) => {
  const { code, language } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'fmt-'));
  const exts = {python:'py',javascript:'js',typescript:'ts',css:'css',html:'html',json:'json'};
  const file = path.join(tmpDir, `code.${exts[language]||'txt'}`);
  fs.writeFileSync(file, code);
  let cmd = '';
  if (language==='python') cmd=`black "${file}" 2>&1 && cat "${file}"`;
  else if (['javascript','typescript'].includes(language)) cmd=`npx prettier --write "${file}" 2>&1 && cat "${file}"`;
  else if (language==='json') { try { const formatted=JSON.stringify(JSON.parse(code),null,2); try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}; return res.json({code:formatted,exitCode:0}); } catch(e){return res.json({code,exitCode:1,error:e.message});} }
  else { try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}; return res.json({code,exitCode:0}); }
  exec(cmd,{timeout:15000},(err,stdout,stderr)=>{
    try{const f=fs.readFileSync(file,'utf8');fs.rmSync(tmpDir,{recursive:true,force:true});res.json({code:f,exitCode:0});}
    catch{res.json({code,exitCode:1,error:stderr});}
  });
});

// ── Lint Code ─────────────────────────────────────────
app.post('/lint', async (req,res) => {
  const { code, language } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'lint-'));
  const file = path.join(tmpDir, `code.${language==='python'?'py':language==='javascript'?'js':'ts'}`);
  fs.writeFileSync(file, code);
  let result = {output:'',exitCode:0};
  if (language==='python') result = await runCmd(`python3 -m py_compile "${file}" 2>&1 && echo "✓ No syntax errors"`);
  else if (language==='javascript') result = await runCmd(`npx --yes acorn --ecmaVersion=2022 "${file}" > /dev/null && echo "✓ Valid JS" || echo "Syntax error"`);
  try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}
  res.json(result);
});

// ── Run Tests ─────────────────────────────────────────
app.post('/test', async (req,res) => {
  const { code, language, testCode, timeout=30000 } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(),'test-'));
  const cfg = LANGS[language];
  if (!cfg) return res.json({output:'Language not supported',exitCode:1});

  const file = path.join(tmpDir, `main.${cfg.ext}`);
  const testFile = path.join(tmpDir, `test.${cfg.ext}`);
  fs.writeFileSync(file, code);
  fs.writeFileSync(testFile, testCode);

  let cmd;
  if (language==='python') cmd=`cd "${tmpDir}" && python3 -m pytest test.py -v 2>&1`;
  else if (language==='javascript') cmd=`cd "${tmpDir}" && node test.js 2>&1`;
  else cmd=`${cfg.run(testFile)}`;

  const result = await runCmd(cmd, {}, timeout);
  try{fs.rmSync(tmpDir,{recursive:true,force:true})}catch{}
  res.json(result);
});

// ── System Info ───────────────────────────────────────
app.get('/sysinfo', async (req,res) => {
  const [tools, disk, net] = await Promise.all([
    runCmd('python3 --version 2>&1; node --version 2>&1; gcc --version 2>&1|head -1; java -version 2>&1|head -1; go version 2>&1; rustc --version 2>&1; ruby --version 2>&1; php --version 2>&1|head -1'),
    runCmd('df -h / 2>&1|tail -1'),
    runCmd('curl -s --max-time 3 https://api.ipify.org 2>/dev/null || echo "N/A"'),
  ]);
  res.json({
    tools:tools.output, disk:disk.output,
    publicIP:net.output.trim(),
    os:`${os.type()} ${os.release()}`,
    cpu:os.cpus()[0]?.model,
    cores:os.cpus().length,
    mem:`${Math.round(os.freemem()/1024/1024)}MB free / ${Math.round(os.totalmem()/1024/1024)}MB total`,
    uptime:`${Math.round(os.uptime()/3600)}h ${Math.round((os.uptime()%3600)/60)}m`,
    nodeVersion:process.version,
    cwd:process.cwd(),
  });
});

// ── Script Runner (bash scripts) ─────────────────────
app.post('/script', async (req,res) => {
  const { script, args=[], cwd='/tmp', timeout=60000 } = req.body;
  const tmpFile = path.join(os.tmpdir(), `script_${Date.now()}.sh`);
  fs.writeFileSync(tmpFile, script, {mode:0o755});
  const result = await runCmd(`bash "${tmpFile}" ${args.join(' ')}`, {cwd}, timeout);
  try{fs.unlinkSync(tmpFile);}catch{}
  res.json(result);
});

// ── HTTP Forward (CORS proxy) ─────────────────────────
app.post('/proxy', async (req,res) => {
  const { url, method='GET', headers={}, body } = req.body;
  try {
    const opts = { method, headers };
    if (body) opts.body = body;
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type')||'';
    let data;
    if (ct.includes('json')) data = await r.json();
    else data = await r.text();
    res.json({ status:r.status, statusText:r.statusText, data, headers:Object.fromEntries(r.headers.entries()) });
  } catch(e) { res.json({error:e.message,status:0}); }
});

// ── WebSocket Terminal ────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path:'/ws' });

wss.on('connection', (ws) => {
  let cwd = process.env.HOME || '/tmp';
  let shell = null;

  ws.send(JSON.stringify({type:'ready', data:`\r\n⚡ CodeDroid Terminal v3.0\r\nType 'help' for available commands\r\n$ `}));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'command') {
        const cmd = msg.command?.trim();
        if (!cmd) { ws.send(JSON.stringify({type:'output',data:'$ '})); return; }
        if (BLOCKED.some(b=>cmd.includes(b))) { ws.send(JSON.stringify({type:'output',data:'⛔ Blocked\r\n$ '})); return; }

        // Built-in commands
        if (cmd === 'help') {
          const helpText = [
            '📦 PACKAGE MANAGERS:',
            '  pip install <pkg>     — Python packages',
            '  npm install <pkg>     — Node packages',
            '  gem install <pkg>     — Ruby gems',
            '  cargo install <pkg>   — Rust crates',
            '  apt install <pkg>     — System packages',
            '',
            '🔧 TOOLS:',
            '  python3 file.py       — Run Python',
            '  node file.js          — Run JavaScript',
            '  gcc file.c -o out     — Compile C',
            '  g++ file.cpp -o out   — Compile C++',
            '  go run file.go        — Run Go',
            '  rustc file.rs         — Compile Rust',
            '',
            '📁 FILE OPS:',
            '  ls, cd, pwd, mkdir, rm, cp, mv, cat, touch',
            '',
            '🌐 NETWORK:',
            '  curl, wget, ping',
            '',
            '🔍 SEARCH:',
            '  grep, find, which',
          ].join('\r\n');
          ws.send(JSON.stringify({type:'output',data:helpText+'\r\n$ '})); return;
        }

        if (cmd.startsWith('cd ')) {
          const dir = cmd.slice(3).trim().replace(/^~/, process.env.HOME||'/tmp');
          const newDir = path.isAbsolute(dir) ? dir : path.join(cwd, dir);
          try { fs.accessSync(newDir); cwd=newDir; ws.send(JSON.stringify({type:'output',data:`$ `})); }
          catch { ws.send(JSON.stringify({type:'output',data:`cd: ${dir}: No such file or directory\r\n$ `})); }
          return;
        }

        if (cmd === 'pwd') { ws.send(JSON.stringify({type:'output',data:`${cwd}\r\n$ `})); return; }
        if (cmd === 'clear') { ws.send(JSON.stringify({type:'clear'})); ws.send(JSON.stringify({type:'output',data:'$ '})); return; }

        exec(cmd, { cwd, timeout:60000, maxBuffer:5*1024*1024, env:{...process.env,TERM:'xterm-256color',FORCE_COLOR:'1'} }, (err,stdout,stderr) => {
          const out = stdout + stderr;
          ws.send(JSON.stringify({type:'output', data:(out||'')+'\r\n$ ', cwd}));
        });
      }
    } catch(e) { ws.send(JSON.stringify({type:'error',data:e.message})); }
  });

  ws.on('close', () => { if(shell) shell.kill(); });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n⚡ CodeDroid Ultra Server v3.0`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Languages: ${Object.keys(LANGS).join(', ')}`);
  console.log(`✅ Ready!\n`);
});
