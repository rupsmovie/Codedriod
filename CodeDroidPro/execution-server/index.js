const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const LANGS = {
  python:     { ext:'py',   run: (f) => `python3 "${f}"` },
  javascript: { ext:'js',   run: (f) => `node "${f}"` },
  c:          { ext:'c',    run: (f) => `gcc "${f}" -o "${f}.out" -lm && "${f}.out"` },
  cpp:        { ext:'cpp',  run: (f) => `g++ "${f}" -o "${f}.out" && "${f}.out"` },
  java:       { ext:'java', run: (f) => {
    const dir = path.dirname(f);
    const base = path.basename(f, '.java');
    return `cd "${dir}" && javac "${path.basename(f)}" && java "${base}"`;
  }},
  bash:       { ext:'sh',   run: (f) => `bash "${f}"` },
  golang:     { ext:'go',   run: (f) => `go run "${f}"` },
  ruby:       { ext:'rb',   run: (f) => `ruby "${f}"` },
  php:        { ext:'php',  run: (f) => `php "${f}"` },
  lua:        { ext:'lua',  run: (f) => `lua "${f}"` },
  typescript: { ext:'ts',   run: (f) => `npx ts-node "${f}"` },
  rust:       { ext:'rs',   run: (f) => `rustc "${f}" -o "${f}.out" && "${f}.out"` },
  r:          { ext:'r',    run: (f) => `Rscript "${f}"` },
  kotlin:     { ext:'kt',   run: (f) => `kotlinc "${f}" -include-runtime -d "${f}.jar" && java -jar "${f}.jar"` },
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    node: process.version,
    languages: Object.keys(LANGS),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: os.platform()
  });
});

// Execute code
app.post('/execute', (req, res) => {
  const { language, filename, code, stdin = '', timeout = 15000, env = {} } = req.body;
  const cfg = LANGS[language];
  if (!cfg) return res.json({ output: `❌ Language '${language}' not supported\nSupported: ${Object.keys(LANGS).join(', ')}`, exitCode: 1 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdr-'));
  const file = path.join(tmpDir, filename || `main.${cfg.ext}`);
  
  try {
    fs.writeFileSync(file, code);
  } catch(e) {
    return res.json({ output: `File write error: ${e.message}`, exitCode: 1 });
  }

  const proc = exec(cfg.run(file), { 
    timeout, 
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, ...env }
  }, (err, stdout, stderr) => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    const output = (stdout + stderr).trim() || '(no output)';
    const exitCode = err?.code ?? 0;
    res.json({ output, exitCode, language, filename });
  });

  if (stdin && proc.stdin) {
    proc.stdin.write(stdin);
    proc.stdin.end();
  }
});

// Install packages
app.post('/install', (req, res) => {
  const { language, packages } = req.body;
  if (!packages?.length) return res.json({ output: 'No packages specified', exitCode: 1 });
  
  let cmd;
  if (language === 'python') cmd = `pip3 install ${packages.join(' ')} --quiet 2>&1`;
  else if (language === 'javascript') cmd = `npm install -g ${packages.join(' ')} 2>&1`;
  else return res.json({ output: `Package install not supported for ${language}`, exitCode: 1 });

  exec(cmd, { timeout: 120000, maxBuffer: 5 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ output: (stdout + stderr).trim(), exitCode: err?.code ?? 0 });
  });
});

// Run terminal command
app.post('/terminal', (req, res) => {
  const { command, cwd = '/tmp', timeout = 30000 } = req.body;
  const forbidden = ['rm -rf /', 'mkfs', 'dd if=', ':(){:|:&};:'];
  if (forbidden.some(f => command.includes(f))) {
    return res.json({ output: '⛔ Forbidden command', exitCode: 1 });
  }
  exec(command, { cwd, timeout, maxBuffer: 5 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ output: (stdout + stderr).trim() || '(no output)', exitCode: err?.code ?? 0 });
  });
});

// Git operations
app.post('/git', (req, res) => {
  const { operation, cwd, params = {} } = req.body;
  const ops = {
    status:  `git status --short`,
    log:     `git log --oneline -10`,
    diff:    `git diff`,
    add:     `git add ${params.files || '.'}`,
    commit:  `git commit -m "${params.message || 'Update'}"`,
    push:    `git push origin ${params.branch || 'main'}`,
    pull:    `git pull`,
    branch:  `git branch`,
    checkout:`git checkout ${params.branch}`,
  };
  const cmd = ops[operation];
  if (!cmd) return res.json({ output: `Unknown operation: ${operation}`, exitCode: 1 });
  exec(cmd, { cwd: cwd || '/tmp', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({ output: (stdout + stderr).trim(), exitCode: err?.code ?? 0 });
  });
});

// File system operations
app.post('/fs', (req, res) => {
  const { operation, path: filePath, content, encoding = 'utf8' } = req.body;
  try {
    if (operation === 'read') {
      const data = fs.readFileSync(filePath, encoding);
      res.json({ content: data, exitCode: 0 });
    } else if (operation === 'write') {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, encoding);
      res.json({ output: 'Written', exitCode: 0 });
    } else if (operation === 'list') {
      const items = fs.readdirSync(filePath);
      res.json({ items, exitCode: 0 });
    } else if (operation === 'delete') {
      fs.rmSync(filePath, { recursive: true, force: true });
      res.json({ output: 'Deleted', exitCode: 0 });
    } else if (operation === 'mkdir') {
      fs.mkdirSync(filePath, { recursive: true });
      res.json({ output: 'Created', exitCode: 0 });
    }
  } catch(e) {
    res.json({ output: e.message, exitCode: 1 });
  }
});

// System info
app.get('/sysinfo', (req, res) => {
  exec('python3 --version && node --version && java -version 2>&1 && gcc --version | head -1 && go version', 
    {}, (err, stdout, stderr) => {
    res.json({ info: (stdout + stderr).trim(), uptime: os.uptime(), freemem: os.freemem(), totalmem: os.totalmem() });
  });
});

const server = http.createServer(app);

// WebSocket terminal
const wss = new WebSocketServer({ server, path: '/terminal-ws' });
wss.on('connection', (ws) => {
  let shell = null;
  ws.send(JSON.stringify({ type: 'ready', msg: '🚀 CodeDroid Terminal Ready\r\n$ ' }));
  
  ws.on('message', (data) => {
    try {
      const { type, command, cols, rows } = JSON.parse(data);
      if (type === 'command') {
        const forbidden = ['rm -rf /', 'mkfs'];
        if (forbidden.some(f => command.includes(f))) {
          ws.send(JSON.stringify({ type: 'output', data: '⛔ Forbidden\r\n$ ' }));
          return;
        }
        exec(command, { timeout: 30000, maxBuffer: 2*1024*1024 }, (err, stdout, stderr) => {
          const out = (stdout + stderr).trim();
          ws.send(JSON.stringify({ type: 'output', data: (out || '(no output)') + '\r\n$ ' }));
        });
      }
    } catch(e) {
      ws.send(JSON.stringify({ type: 'error', data: e.message }));
    }
  });
  
  ws.on('close', () => { if(shell) shell.kill(); });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 CodeDroid Pro Execution Server v2.0`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/terminal-ws`);
  console.log(`⚡ Languages: ${Object.keys(LANGS).join(', ')}`);
});
