const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const LANG_CONFIG = {
  python:     { ext:'py',   compile: null,                run: (f) => `python3 ${f}` },
  c:          { ext:'c',    compile: (f,o) => `gcc ${f} -o ${o} -lm`, run: (f,o) => o },
  cpp:        { ext:'cpp',  compile: (f,o) => `g++ ${f} -o ${o}`,     run: (f,o) => o },
  java:       { ext:'java', compile: (f,d) => `javac -d ${d} ${f}`,   run: (f,d,n) => `java -cp ${d} ${n}` },
  javascript: { ext:'js',   compile: null,                run: (f) => `node ${f}` },
  typescript: { ext:'ts',   compile: null,                run: (f) => `npx ts-node ${f}` },
  bash:       { ext:'sh',   compile: null,                run: (f) => `bash ${f}` },
  rust:       { ext:'rs',   compile: (f,o) => `rustc ${f} -o ${o}`,   run: (f,o) => o },
  golang:     { ext:'go',   compile: null,                run: (f) => `go run ${f}` },
  php:        { ext:'php',  compile: null,                run: (f) => `php ${f}` },
  ruby:       { ext:'rb',   compile: null,                run: (f) => `ruby ${f}` },
  lua:        { ext:'lua',  compile: null,                run: (f) => `lua ${f}` },
  r:          { ext:'r',    compile: null,                run: (f) => `Rscript ${f}` },
};

app.post('/execute', async (req, res) => {
  const { language, filename, code, stdin = '', timeout = 15000, install = [] } = req.body;
  const cfg = LANG_CONFIG[language];
  if (!cfg) return res.json({ output: `Language '${language}' not supported`, exitCode: 1 });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codedroid-'));
  const className = filename?.replace(/\.\w+$/, '') || 'Main';
  const srcFile = path.join(tmpDir, filename || `main.${cfg.ext}`);
  const binFile = path.join(tmpDir, 'output');

  try {
    // Install packages if needed
    if (install.length > 0) {
      if (language === 'python') {
        await runCmd(`pip3 install ${install.join(' ')} -q`, tmpDir, 30000);
      } else if (language === 'javascript') {
        await runCmd(`npm install ${install.join(' ')} 2>&1`, tmpDir, 60000);
      }
    }

    fs.writeFileSync(srcFile, code);

    // Compile if needed
    if (cfg.compile) {
      let compileCmd;
      if (language === 'java') {
        compileCmd = cfg.compile(srcFile, tmpDir);
      } else {
        compileCmd = cfg.compile(srcFile, binFile);
      }
      const compileResult = await runCmd(compileCmd, tmpDir, 30000);
      if (compileResult.exitCode !== 0) {
        cleanup(tmpDir);
        return res.json({ output: compileResult.output || compileResult.error, exitCode: compileResult.exitCode, stage: 'compile' });
      }
    }

    // Run
    let runCmd2;
    if (language === 'java') {
      runCmd2 = cfg.run(srcFile, tmpDir, className);
    } else if (cfg.compile) {
      runCmd2 = cfg.run(srcFile, binFile);
    } else {
      runCmd2 = cfg.run(srcFile);
    }

    const runResult = await runCmdWithStdin(runCmd2, stdin, tmpDir, timeout);
    cleanup(tmpDir);
    res.json({ output: runResult.output, exitCode: runResult.exitCode, stage: 'run' });

  } catch (err) {
    cleanup(tmpDir);
    res.json({ output: `Server error: ${err.message}`, exitCode: 1 });
  }
});

app.post('/install', async (req, res) => {
  const { language, packages } = req.body;
  try {
    let cmd = language === 'python' ? `pip3 install ${packages.join(' ')}` : `npm install -g ${packages.join(' ')}`;
    const result = await runCmd(cmd, '/tmp', 60000);
    res.json(result);
  } catch(e) { res.json({ output: e.message, exitCode: 1 }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', languages: Object.keys(LANG_CONFIG) }));

function runCmd(command, cwd, timeout) {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ output: (stdout + stderr).trim(), exitCode: err?.code || 0 });
    });
  });
}

function runCmdWithStdin(command, stdin, cwd, timeout) {
  return new Promise((resolve) => {
    const proc = exec(command, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ output: (stdout + (stderr||'')).trim(), exitCode: err?.code ?? 0 });
    });
    if (stdin) { proc.stdin.write(stdin); proc.stdin.end(); }
  });
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 CodeDroid Execution Server running on port ${PORT}`));
