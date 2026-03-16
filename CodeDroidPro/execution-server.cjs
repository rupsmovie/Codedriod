const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const LANGS = {
  python:     { ext:'py',   run: (f) => `python3 "${f}"` },
  javascript: { ext:'js',   run: (f) => `node "${f}"` },
  c:          { ext:'c',    run: (f) => `gcc "${f}" -o "${f}.out" -lm && "${f}.out"` },
  cpp:        { ext:'cpp',  run: (f) => `g++ "${f}" -o "${f}.out" && "${f}.out"` },
  java:       { ext:'java', run: (f) => `cd "$(dirname ${f})" && javac "$(basename ${f})" && java "$(basename ${f} .java)"` },
  bash:       { ext:'sh',   run: (f) => `bash "${f}"` },
  golang:     { ext:'go',   run: (f) => `go run "${f}"` },
  ruby:       { ext:'rb',   run: (f) => `ruby "${f}"` },
  php:        { ext:'php',  run: (f) => `php "${f}"` },
  lua:        { ext:'lua',  run: (f) => `lua "${f}"` },
  rust:       { ext:'rs',   run: (f) => `rustc "${f}" -o "${f}.out" && "${f}.out"` },
};

app.get('/health', (req, res) => res.json({ status:'ok', node: process.version }));

app.post('/execute', (req, res) => {
  const { language, filename, code, stdin = '', timeout = 15000 } = req.body;
  const cfg = LANGS[language];
  if (!cfg) return res.json({ output: `Language '${language}' not supported`, exitCode: 1 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdr-'));
  const file = path.join(tmpDir, filename || `main.${cfg.ext}`);
  fs.writeFileSync(file, code);

  const proc = exec(cfg.run(file), { timeout, maxBuffer: 10*1024*1024 }, (err, stdout, stderr) => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    res.json({ output: (stdout + stderr).trim() || '(no output)', exitCode: err?.code ?? 0 });
  });

  if (stdin) { proc.stdin?.write(stdin); proc.stdin?.end(); }
});

app.listen(3001, () => console.log('🚀 CodeDroid Execution Server: PORT 3001'));
