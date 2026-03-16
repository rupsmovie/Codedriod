
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";

// ═══════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════

const PISTON_API = "https://emkc.org/api/v2/piston";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const LANGUAGES = {
  python:     { icon:"🐍", piston:"python",     ver:"3.10.0",  monaco:"python",     color:"#3572A5", ext:"py"  },
  c:          { icon:"⚙️", piston:"c",          ver:"10.2.0",  monaco:"c",          color:"#555555", ext:"c"   },
  cpp:        { icon:"⚙️", piston:"c++",        ver:"10.2.0",  monaco:"cpp",        color:"#f34b7d", ext:"cpp" },
  java:       { icon:"☕", piston:"java",        ver:"15.0.2",  monaco:"java",       color:"#b07219", ext:"java"},
  javascript: { icon:"🟨", piston:"javascript", ver:"18.15.0", monaco:"javascript", color:"#f1e05a", ext:"js"  },
  typescript: { icon:"🔷", piston:"typescript", ver:"5.0.3",   monaco:"typescript", color:"#2b7489", ext:"ts"  },
  rust:       { icon:"🦀", piston:"rust",       ver:"1.50.0",  monaco:"rust",       color:"#dea584", ext:"rs"  },
  golang:     { icon:"🐹", piston:"go",         ver:"1.16.2",  monaco:"go",         color:"#00ADD8", ext:"go"  },
  php:        { icon:"🐘", piston:"php",        ver:"8.2.3",   monaco:"php",        color:"#4F5D95", ext:"php" },
  ruby:       { icon:"💎", piston:"ruby",       ver:"3.0.1",   monaco:"ruby",       color:"#701516", ext:"rb"  },
  kotlin:     { icon:"🎯", piston:"kotlin",     ver:"1.8.20",  monaco:"kotlin",     color:"#A97BFF", ext:"kt"  },
  bash:       { icon:"💻", piston:"bash",       ver:"5.2.0",   monaco:"shell",      color:"#89e051", ext:"sh"  },
  lua:        { icon:"🌙", piston:"lua",        ver:"5.4.4",   monaco:"lua",        color:"#000080", ext:"lua" },
  r:          { icon:"📊", piston:"r",          ver:"4.1.1",   monaco:"r",          color:"#198CE7", ext:"r"   },
  swift:      { icon:"🍎", piston:"swift",      ver:"5.3.3",   monaco:"swift",      color:"#F05138", ext:"swift"},
  html:       { icon:"🌐", piston:null,         ver:null,      monaco:"html",       color:"#e34c26", ext:"html"},
  css:        { icon:"🎨", piston:null,         ver:null,      monaco:"css",        color:"#563d7c", ext:"css" },
  json:       { icon:"📋", piston:null,         ver:null,      monaco:"json",       color:"#292929", ext:"json"},
  markdown:   { icon:"📝", piston:null,         ver:null,      monaco:"markdown",   color:"#083fa1", ext:"md"  },
  sql:        { icon:"🗄️", piston:"sqlite3",   ver:"3.36.0",  monaco:"sql",        color:"#e38c00", ext:"sql" },
  text:       { icon:"📄", piston:null,         ver:null,      monaco:"plaintext",  color:"#666",    ext:"txt" },
};

const LANG_MAP = {
  py:"python", c:"c", cpp:"cpp", h:"c", hpp:"cpp", java:"java",
  js:"javascript", ts:"typescript", html:"html", css:"css",
  txt:"text", json:"json", md:"markdown", rs:"rust", go:"golang",
  rb:"ruby", php:"php", kt:"kotlin", sh:"bash", lua:"lua",
  r:"r", swift:"swift", sql:"sql"
};

const THEMES = {
  "VS Dark":       { vs:"vs-dark",  bg:"#1e1e1e", sb:"#252526", border:"#333", text:"#d4d4d4", dim:"#858585", accent:"#007acc", tab:"#2d2d2d", terminal:"#141414", lineNum:"#3c3c3c", status:"#007acc", hover:"#2a2d2e", badge:"#007acc" },
  "VS Light":      { vs:"vs-light", bg:"#ffffff", sb:"#f3f3f3", border:"#e0e0e0", text:"#1f1f1f", dim:"#717171", accent:"#005fb8", tab:"#ececec", terminal:"#f5f5f5", lineNum:"#c5c5c5", status:"#005fb8", hover:"#e8e8e8", badge:"#005fb8" },
  "Monokai":       { vs:"vs-dark",  bg:"#272822", sb:"#1e1f1c", border:"#1a1a17", text:"#f8f8f2", dim:"#75715e", accent:"#a6e22e", tab:"#3e3d32", terminal:"#1a1b18", lineNum:"#3e3d32", status:"#75715e", hover:"#3e3d32", badge:"#a6e22e" },
  "Dracula":       { vs:"vs-dark",  bg:"#282a36", sb:"#21222c", border:"#191a21", text:"#f8f8f2", dim:"#6272a4", accent:"#bd93f9", tab:"#343746", terminal:"#1e1f29", lineNum:"#44475a", status:"#bd93f9", hover:"#343746", badge:"#bd93f9" },
  "One Dark":      { vs:"vs-dark",  bg:"#282c34", sb:"#21252b", border:"#181a1f", text:"#abb2bf", dim:"#5c6370", accent:"#61afef", tab:"#2c313a", terminal:"#1d2026", lineNum:"#3b4048", status:"#61afef", hover:"#2c313a", badge:"#61afef" },
  "Nord":          { vs:"vs-dark",  bg:"#2e3440", sb:"#272c36", border:"#222730", text:"#d8dee9", dim:"#4c566a", accent:"#88c0d0", tab:"#3b4252", terminal:"#242933", lineNum:"#434c5e", status:"#5e81ac", hover:"#3b4252", badge:"#88c0d0" },
  "Tokyo Night":   { vs:"vs-dark",  bg:"#1a1b2e", sb:"#16161e", border:"#101014", text:"#c0caf5", dim:"#565f89", accent:"#7aa2f7", tab:"#1f2335", terminal:"#13131d", lineNum:"#3b4261", status:"#7aa2f7", hover:"#1f2335", badge:"#7aa2f7" },
  "Catppuccin":    { vs:"vs-dark",  bg:"#1e1e2e", sb:"#181825", border:"#11111b", text:"#cdd6f4", dim:"#585b70", accent:"#cba6f7", tab:"#1e1e2e", terminal:"#181825", lineNum:"#45475a", status:"#cba6f7", hover:"#313244", badge:"#cba6f7" },
  "Gruvbox":       { vs:"vs-dark",  bg:"#282828", sb:"#1d2021", border:"#1d2021", text:"#ebdbb2", dim:"#928374", accent:"#b8bb26", tab:"#3c3836", terminal:"#1d2021", lineNum:"#504945", status:"#b8bb26", hover:"#3c3836", badge:"#b8bb26" },
  "Solarized":     { vs:"vs-dark",  bg:"#002b36", sb:"#073642", border:"#004052", text:"#839496", dim:"#586e75", accent:"#268bd2", tab:"#073642", terminal:"#002b36", lineNum:"#073642", status:"#268bd2", hover:"#073642", badge:"#268bd2" },
  "High Contrast": { vs:"hc-black", bg:"#000000", sb:"#0d0d0d", border:"#6fc3df", text:"#ffffff", dim:"#aaaaaa", accent:"#6fc3df", tab:"#0d0d0d", terminal:"#000000", lineNum:"#555", status:"#6fc3df", hover:"#111", badge:"#6fc3df" },
};

const SNIPPETS = {
  python: [
    { prefix:"def",  body:"def ${1:name}(${2:args}):\n    ${3:pass}", desc:"Function" },
    { prefix:"class",body:"class ${1:Name}:\n    def __init__(self):\n        ${2:pass}", desc:"Class" },
    { prefix:"for",  body:"for ${1:i} in range(${2:10}):\n    ${3:pass}", desc:"For loop" },
    { prefix:"try",  body:"try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:print(e)}", desc:"Try/except" },
    { prefix:"list", body:"[${1:x} for ${1:x} in ${2:iterable}]", desc:"List comprehension" },
  ],
  javascript: [
    { prefix:"fn",   body:"const ${1:name} = (${2:args}) => {\n    ${3}\n};", desc:"Arrow function" },
    { prefix:"cl",   body:"class ${1:Name} {\n    constructor(${2}) {\n        ${3}\n    }\n}", desc:"Class" },
    { prefix:"imp",  body:"import ${1:module} from '${2:path}';", desc:"Import" },
    { prefix:"try",  body:"try {\n    ${1}\n} catch (${2:err}) {\n    console.error(${2:err});\n}", desc:"Try/catch" },
    { prefix:"af",   body:"async (${1:args}) => {\n    ${2}\n}", desc:"Async arrow" },
  ],
  java: [
    { prefix:"main", body:"public static void main(String[] args) {\n    ${1}\n}", desc:"Main method" },
    { prefix:"sout", body:"System.out.println(${1});", desc:"Print" },
    { prefix:"for",  body:"for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}", desc:"For loop" },
    { prefix:"cls",  body:"public class ${1:Name} {\n    ${2}\n}", desc:"Class" },
  ],
};

const DEFAULT_FILES = [
  { id:1, name:"main.py",     language:"python",     content:"# 🐍 Python — CodeDroid Pro\nprint('Hello, World!')\n\nname = 'Rupak'\nprint(f'Welcome, {name}! 🚀')\n\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\n\nfor i in range(1, 8):\n    print(f'  {i}! = {factorial(i)}')\n\nclass Developer:\n    def __init__(self, name, lang):\n        self.name = name\n        self.lang = lang\n    def introduce(self):\n        return f'I am {self.name}, coding in {self.lang}!'\n\ndev = Developer(name, 'Python')\nprint(dev.introduce())\n" },
  { id:2, name:"hello.c",     language:"c",          content:"#include <stdio.h>\n#include <string.h>\n\nlong long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    printf(\"Hello, World!\\n\");\n    printf(\"Welcome, Rupak!\\n\");\n    for (int i = 1; i <= 7; i++)\n        printf(\"  %d! = %lld\\n\", i, factorial(i));\n    return 0;\n}\n" },
  { id:3, name:"Main.java",   language:"java",       content:"public class Main {\n    static long factorial(int n) {\n        return n <= 1 ? 1 : n * factorial(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n        System.out.println(\"Welcome, Rupak!\");\n        for (int i = 1; i <= 7; i++)\n            System.out.printf(\"  %d! = %d%n\", i, factorial(i));\n    }\n}\n" },
  { id:4, name:"script.js",   language:"javascript", content:"// 🟨 JavaScript\nconsole.log('Hello, World!');\n\nconst name = 'Rupak';\nconsole.log(`Welcome, ${name}!`);\n\nconst factorial = n => n <= 1 ? 1 : n * factorial(n - 1);\nfor (let i = 1; i <= 7; i++)\n    console.log(`  ${i}! = ${factorial(i)}`);\n\nclass Developer {\n    constructor(name, lang) { this.name = name; this.lang = lang; }\n    introduce() { return `I am ${this.name}, coding in ${this.lang}!`; }\n}\nconsole.log(new Developer(name, 'JavaScript').introduce());\n" },
  { id:5, name:"index.html",  language:"html",       content:"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>CodeDroid Pro</title>\n    <style>\n        * { margin:0; padding:0; box-sizing:border-box; }\n        body {\n            font-family: 'Segoe UI', sans-serif;\n            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);\n            color: #fff; min-height: 100vh;\n            display: flex; align-items: center; justify-content: center;\n        }\n        .card {\n            background: rgba(255,255,255,0.05);\n            backdrop-filter: blur(20px);\n            border: 1px solid rgba(255,255,255,0.1);\n            border-radius: 20px; padding: 40px; text-align: center;\n            animation: float 3s ease-in-out infinite;\n        }\n        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }\n        h1 { color: #89b4fa; font-size: 2.5rem; margin-bottom: 10px; }\n        p { color: #a6e3a1; font-size: 1.1rem; }\n        .badge { display:inline-block; background:#007acc; color:white; padding:4px 14px; border-radius:20px; font-size:.8rem; margin-top:16px; }\n    </style>\n</head>\n<body>\n    <div class=\"card\">\n        <h1>⚡ CodeDroid Pro</h1>\n        <p>Full VS Code on Android</p>\n        <span class=\"badge\">Monaco + AI Copilot</span>\n    </div>\n</body>\n</html>\n" },
  { id:6, name:"app.go",      language:"golang",     content:"package main\n\nimport (\n    \"fmt\"\n    \"math\"\n)\n\nfunc factorial(n int) int {\n    if n <= 1 { return 1 }\n    return n * factorial(n-1)\n}\n\nfunc isPrime(n int) bool {\n    if n < 2 { return false }\n    for i := 2; i <= int(math.Sqrt(float64(n))); i++ {\n        if n%i == 0 { return false }\n    }\n    return true\n}\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n    fmt.Println(\"Welcome, Rupak!\")\n    for i := 1; i <= 7; i++ {\n        fmt.Printf(\"  %d! = %d\\n\", i, factorial(i))\n    }\n    fmt.Println(\"Primes < 20:\")\n    for i := 2; i < 20; i++ {\n        if isPrime(i) { fmt.Printf(\"  %d\", i) }\n    }\n    fmt.Println()\n}\n" },
  { id:7, name:"main.rs",     language:"rust",       content:"fn factorial(n: u64) -> u64 {\n    if n <= 1 { 1 } else { n * factorial(n - 1) }\n}\n\nfn is_prime(n: u64) -> bool {\n    if n < 2 { return false; }\n    let sqrt = (n as f64).sqrt() as u64;\n    for i in 2..=sqrt {\n        if n % i == 0 { return false; }\n    }\n    true\n}\n\nfn main() {\n    println!(\"Hello, World!\");\n    println!(\"Welcome, Rupak! 🦀\");\n    for i in 1..=7 {\n        println!(\"  {}! = {}\", i, factorial(i));\n    }\n    let primes: Vec<u64> = (2..20).filter(|&x| is_prime(x)).collect();\n    println!(\"Primes < 20: {:?}\", primes);\n}\n" },
  { id:8, name:"style.css",   language:"css",        content:":root {\n    --primary: #007acc;\n    --bg: #1e1e1e;\n    --text: #d4d4d4;\n    --accent: #4ec9b0;\n    --danger: #f48771;\n    --success: #4ec9b0;\n}\n\n* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n    font-family: 'JetBrains Mono', monospace;\n    background: var(--bg);\n    color: var(--text);\n    line-height: 1.6;\n}\n\n.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }\n\n.btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 8px;\n    padding: 10px 20px;\n    background: var(--primary);\n    color: white;\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 14px;\n    transition: all 0.2s ease;\n}\n\n.btn:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 4px 12px rgba(0, 122, 204, 0.4);\n}\n\n.card {\n    background: rgba(255,255,255,0.05);\n    border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 12px;\n    padding: 24px;\n    transition: transform 0.2s;\n}\n\n.card:hover { transform: translateY(-4px); }\n" },
  { id:9, name:"data.json",   language:"json",       content:"{\n  \"app\": \"CodeDroid Pro\",\n  \"version\": \"2.0.0\",\n  \"features\": [\n    \"Monaco Editor\",\n    \"Real Compiler\",\n    \"AI Copilot\",\n    \"15 Themes\",\n    \"Live Preview\",\n    \"REST Client\",\n    \"Regex Tester\",\n    \"JSON Tools\"\n  ],\n  \"languages\": 20,\n  \"author\": \"Rupak\",\n  \"built_with\": \"React + Capacitor\"\n}\n" },
  { id:10, name:"README.md",  language:"markdown",   content:"# ⚡ CodeDroid Pro\n\n> Full VS Code clone on Android — Monaco Engine + AI Copilot\n\n## Features\n\n- 🎯 **Monaco Editor** — Real VS Code engine\n- ⚡ **Real Compiler** — Piston API (20+ languages)\n- 🤖 **AI Copilot** — Claude AI powered\n- 🎨 **15 Themes** — Dracula, Monokai, Nord...\n- 🌐 **Live Preview** — HTML/CSS/JS instant preview\n- 🔌 **REST Client** — Built-in API tester\n- 🔍 **Regex Tester** — Live match highlight\n- 📊 **JSON Tools** — Format, minify, validate\n\n## Keyboard Shortcuts\n\n| Shortcut | Action |\n|----------|--------|\n| `Ctrl+Enter` | Run code |\n| `Ctrl+I` | AI Copilot |\n| `Ctrl+Shift+P` | Command Palette |\n| `Ctrl+F` | Find |\n| `Ctrl+H` | Replace |\n| `Ctrl+G` | Go to line |\n| `Ctrl+B` | Toggle sidebar |\n\n## Languages\n\nPython, C, C++, Java, JavaScript, TypeScript,\nRust, Go, PHP, Ruby, Kotlin, Bash, Lua, R, Swift, SQL\n" },
];

function getTemplate(lang, filename) {
  const cls = filename.replace(/\.\w+$/, "");
  return ({
    python:     `# ${filename}\n\ndef main():\n    print("Hello!")\n\nif __name__ == "__main__":\n    main()\n`,
    c:          `#include <stdio.h>\n\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}\n`,
    cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}\n`,
    java:       `public class ${cls} {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}\n`,
    javascript: `// ${filename}\nconsole.log("Hello!");\n`,
    typescript: `// ${filename}\nconst msg: string = "Hello!";\nconsole.log(msg);\n`,
    rust:       `fn main() {\n    println!("Hello!");\n}\n`,
    golang:     `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello!")\n}\n`,
    kotlin:     `fun main() {\n    println("Hello!")\n}\n`,
    bash:       `#!/bin/bash\necho "Hello!"\n`,
    lua:        `print("Hello!")\n`,
    r:          `cat("Hello!\\n")\n`,
    php:        `<?php\necho "Hello!";\n?>\n`,
    ruby:       `puts "Hello!"\n`,
    swift:      `print("Hello!")\n`,
    sql:        `SELECT 'Hello, World!' AS greeting;\n`,
    html:       `<!DOCTYPE html>\n<html>\n<head><title>${cls}</title></head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>\n`,
    css:        `/* ${filename} */\nbody { margin: 0; background: #1e1e1e; color: #d4d4d4; }\n`,
    json:       `{\n  "name": "${cls}",\n  "version": "1.0.0"\n}\n`,
    markdown:   `# ${cls}\n\nWrite here...\n`,
  })[lang] || `// ${filename}\n`;
}

// ═══════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════

function Modal({ open, onClose, title, children, width = 600, T }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:T.sb, border:`1px solid ${T.border}`, borderRadius:10, width:"100%", maxWidth:width, maxHeight:"80vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:14, color:T.text }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:16 }}>{children}</div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, T }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width:40, height:20, borderRadius:10, border:"none", cursor:"pointer", background:value?T.accent:"#555", position:"relative", transition:"background .2s", flexShrink:0 }}>
      <span style={{ position:"absolute", top:2, left:value?22:2, width:16, height:16, background:"#fff", borderRadius:"50%", transition:"left .2s" }}/>
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════

export default function App() {
  // ── State ──────────────────────────────────────────────
  const [files, setFiles]               = useState(DEFAULT_FILES);
  const [openTabs, setOpenTabs]         = useState([DEFAULT_FILES[0]]);
  const [activeTabId, setActiveTabId]   = useState(1);
  const [panel, setPanel]               = useState("explorer");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [rightPanel, setRightPanel]     = useState(null);
  const [bottomPanel, setBottomPanel]   = useState("terminal");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalH, setTerminalH]       = useState(200);
  const [themeName, setThemeName]       = useState("VS Dark");
  const [fontSize, setFontSize]         = useState(14);
  const [wordWrap, setWordWrap]         = useState("on");
  const [minimap, setMinimap]           = useState(false);
  const [lineNumbers, setLineNumbers]   = useState("on");
  const [tabSize, setTabSize]           = useState(4);
  const [autoSave, setAutoSave]         = useState(true);
  const [zenMode, setZenMode]           = useState(false);
  const [splitMode, setSplitMode]       = useState(false);
  const [splitTabId, setSplitTabId]     = useState(null);
  const [vimMode, setVimMode]           = useState(false);
  const [diffMode, setDiffMode]         = useState(false);
  const [stickyScroll, setStickyScroll] = useState(true);
  const [breadcrumbs, setBreadcrumbs]   = useState(true);
  const [renderWhitespace, setRenderWhitespace] = useState("selection");
  const [formatOnSave, setFormatOnSave] = useState(true);

  // Execution
  const [logs, setLogs] = useState([
    { type:"system", text:"⚡ CodeDroid Pro v2.0 — Ultimate Android IDE" },
    { type:"system", text:"🚀 Monaco Editor · Piston Compiler · AI Copilot · 20 Languages" },
    { type:"system", text:"💡 Ctrl+Enter=Run | Ctrl+I=AI | Ctrl+Shift+P=Commands" },
    { type:"divider", text:"" }
  ]);
  const [isRunning, setIsRunning]   = useState(false);
  const [stdin, setStdin]           = useState("");
  const [showStdin, setShowStdin]   = useState(false);
  const [execStats, setExecStats]   = useState(null);
  const [terminalTabs, setTerminalTabs] = useState([{ id:1, name:"Terminal 1", logs:[] }]);
  const [activeTermId, setActiveTermId] = useState(1);

  // File ops
  const [newFileName, setNewFileName]   = useState("");
  const [showNewFile, setShowNewFile]   = useState(false);
  const [fileSearch, setFileSearch]     = useState("");
  const [renameFile, setRenameFile]     = useState(null);
  const [bookmarks, setBookmarks]       = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});

  // AI Copilot
  const [copilotMessages, setCopilotMessages] = useState([
    { role:"assistant", text:"Hi! I am your AI Copilot 🤖\n\nPowered by Claude AI. I can:\n• 💡 Explain & debug code\n• ⚡ Optimize performance\n• 🧪 Generate unit tests\n• 📝 Write documentation\n• 🔄 Refactor code\n• 🔍 Code review\n• 🚀 Generate entire functions/classes\n• 🐛 Find & fix bugs\n• 💬 Answer any coding question\n\nI see your current file in real-time. Just ask!" }
  ]);
  const [copilotInput, setCopilotInput]   = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMode, setCopilotMode]     = useState("chat");

  // Tools
  const [restMethod, setRestMethod]       = useState("GET");
  const [restUrl, setRestUrl]             = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [restHeaders, setRestHeaders]     = useState('{\n  "Content-Type": "application/json"\n}');
  const [restBody, setRestBody]           = useState("");
  const [restResponse, setRestResponse]   = useState(null);
  const [restLoading, setRestLoading]     = useState(false);
  const [restHistory, setRestHistory]     = useState([]);
  const [regexPattern, setRegexPattern]   = useState("\\d+");
  const [regexFlags, setRegexFlags]       = useState("g");
  const [regexInput, setRegexInput]       = useState("Hello 123 World 456! Today is 2024.");
  const [jsonInput, setJsonInput]         = useState('{"name":"Rupak","age":18,"skills":["Python","C","Java"]}');
  const [base64Input, setBase64Input]     = useState("");
  const [base64Output, setBase64Output]   = useState("");
  const [base64Mode, setBase64Mode]       = useState("encode");
  const [colorInput, setColorInput]       = useState("#007acc");
  const [jwtInput, setJwtInput]           = useState("");
  const [diffOriginal, setDiffOriginal]   = useState("");
  const [diffModified, setDiffModified]   = useState("");

  // Palettes & UI
  const [commandOpen, setCommandOpen]     = useState(false);
  const [commandQuery, setCommandQuery]   = useState("");
  const [contextMenu, setContextMenu]     = useState(null);
  const [cursorPos, setCursorPos]         = useState({ line:1, col:1 });
  const [clipHistory, setClipHistory]     = useState([]);
  const [globalSearch, setGlobalSearch]   = useState("");
  const [globalReplace, setGlobalReplace] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [problems, setProblems]           = useState([]);
  const [showPreview, setShowPreview]     = useState(false);
  const [codeStats, setCodeStats]         = useState(null);
  const [snippetModal, setSnippetModal]   = useState(false);
  const [keybindModal, setKeybindModal]   = useState(false);
  const [activeModal, setActiveModal]     = useState(null);

  const T = THEMES[themeName] || THEMES["VS Dark"];
  const isDark = T.vs !== "vs-light";

  const editorRef   = useRef(null);
  const monacoRef   = useRef(null);
  const termRef     = useRef(null);
  const copilotRef  = useRef(null);
  const cmdRef      = useRef(null);
  const autoSaveTimer = useRef(null);

  const activeTab  = useMemo(() => openTabs.find(t => t.id === activeTabId) || null, [openTabs, activeTabId]);
  const splitTab   = useMemo(() => splitTabId ? files.find(f => f.id === splitTabId) : null, [files, splitTabId]);
  const LC         = useMemo(() => LANGUAGES[activeTab?.language] || {}, [activeTab]);

  // ── Notifications ──────────────────────────────────────
  const notify = useCallback((msg, type = "info") => {
    const id = Date.now();
    setNotifications(p => [...p, { id, msg, type }]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 3000);
  }, []);

  // ── File operations ────────────────────────────────────
  const updateContent = useCallback((content) => {
    setFiles(p => p.map(f => f.id === activeTabId ? { ...f, content, modified: true } : f));
    setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, content, modified: true } : t));
    if (autoSave) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        setFiles(p => p.map(f => f.id === activeTabId ? { ...f, modified: false } : f));
        setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, modified: false } : t));
      }, 1500);
    }
    // Code stats
    const lines = content.split("\n").length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    setCodeStats({ lines, words, chars });
  }, [activeTabId, autoSave]);

  const openFile = useCallback((file) => {
    setOpenTabs(p => p.find(t => t.id === file.id) ? p : [...p, { ...file }]);
    setActiveTabId(file.id);
  }, []);

  const closeTab = useCallback((e, tabId) => {
    e && e.stopPropagation();
    setOpenTabs(p => {
      const next = p.filter(t => t.id !== tabId);
      if (activeTabId === tabId) setActiveTabId(next.length ? next[next.length - 1].id : null);
      return next;
    });
    if (splitTabId === tabId) setSplitTabId(null);
  }, [activeTabId, splitTabId]);

  const createFile = useCallback(() => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split(".").pop().toLowerCase();
    const lang = LANG_MAP[ext] || "text";
    const nf = { id: Date.now(), name: newFileName, language: lang, content: getTemplate(lang, newFileName), modified: false };
    setFiles(p => [...p, nf]);
    openFile(nf);
    setNewFileName(""); setShowNewFile(false);
    notify(`Created ${newFileName}`, "success");
  }, [newFileName, openFile, notify]);

  const deleteFile = useCallback((e, fileId) => {
    e && e.stopPropagation();
    const f = files.find(x => x.id === fileId);
    setFiles(p => p.filter(f => f.id !== fileId));
    closeTab(null, fileId);
    notify(`Deleted ${f?.name}`, "info");
  }, [files, closeTab, notify]);

  const duplicateFile = useCallback((file) => {
    const ext = file.name.split(".").pop();
    const base = file.name.replace(`.${ext}`, "");
    const nf = { ...file, id: Date.now(), name: `${base}_copy.${ext}`, modified: false };
    setFiles(p => [...p, nf]);
    openFile(nf);
    notify(`Duplicated as ${nf.name}`, "success");
  }, [openFile, notify]);

  const addLog = useCallback((type, text) => {
    setLogs(p => [...p, { type, text }]);
  }, []);

  // ── REAL Code Execution (Piston API) ──────────────────
  const runCode = useCallback(async () => {
    if (!activeTab || isRunning) return;
    const cfg = LANGUAGES[activeTab.language];
    if (!cfg?.piston) {
      if (activeTab.language === "html") { setShowPreview(true); return; }
      notify(`${activeTab.language} execution not supported`, "info"); return;
    }
    setIsRunning(true); setTerminalOpen(true); setBottomPanel("terminal");
    const startTime = Date.now();
    addLog("cmd",  `$ run ${activeTab.name}  [${new Date().toLocaleTimeString()}]`);
    addLog("info", `⟳ Compiling ${cfg.piston} ${cfg.ver}...`);
    try {
      const res = await fetch(`${PISTON_API}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: cfg.piston, version: cfg.ver,
          files: [{ name: activeTab.name, content: activeTab.content }],
          stdin: stdin || "", args: [],
          compile_timeout: 30000, run_timeout: 15000,
        })
      });
      const data = await res.json();
      const elapsed = Date.now() - startTime;
      if (data.message) {
        addLog("error", `✗ ${data.message}`);
      } else if (data.compile?.code !== 0 && data.compile?.output) {
        addLog("error", `Compile Error:\n${data.compile.output}`);
      } else {
        const out = data.run?.output || "(no output)";
        const isErr = data.run?.code !== 0;
        addLog(isErr ? "error" : "output", out);
        setExecStats({ time: elapsed, exitCode: data.run?.code ?? 0, lang: cfg.piston, ver: cfg.ver });
      }
      addLog("system", `✓ Exited(${data.run?.code ?? 0}) · ${elapsed}ms · ${new Date().toLocaleTimeString()}`);
      addLog("divider", "");
    } catch (err) {
      addLog("error", `✗ Network error: ${err.message}`);
      addLog("divider", "");
    }
    setIsRunning(false);
  }, [activeTab, isRunning, stdin, addLog, notify]);

  // ── AI Copilot ─────────────────────────────────────────
  const askCopilot = useCallback(async (overrideMsg) => {
    const msg = overrideMsg || copilotInput.trim();
    if (!msg || copilotLoading) return;
    setCopilotInput("");
    setCopilotMessages(p => [...p, { role:"user", text: msg }]);
    setCopilotLoading(true);
    try {
      const ctx = activeTab
        ? `File: ${activeTab.name} (${activeTab.language})\nLines: ${activeTab.content.split("\n").length}\n\`\`\`${activeTab.language}\n${activeTab.content.slice(0, 3000)}\n\`\`\`\n\n`
        : "";
      const lastExec = execStats ? `Last run: exited(${execStats.exitCode}) in ${execStats.time}ms\n` : "";
      const res = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "You are an expert AI Copilot inside CodeDroid Pro — a professional VS Code clone on Android. Be concise, expert-level, and practical. Use code blocks with language. Max 400 words unless asked for more.",
          messages: [
            ...copilotMessages.slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
            { role: "user", content: ctx + lastExec + msg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, try again.";
      setCopilotMessages(p => [...p, { role:"assistant", text: reply }]);
    } catch {
      setCopilotMessages(p => [...p, { role:"assistant", text:"⚠️ Network error. Check connection." }]);
    }
    setCopilotLoading(false);
  }, [copilotInput, copilotLoading, copilotMessages, activeTab, execStats]);

  // ── REST Client ────────────────────────────────────────
  const sendRequest = useCallback(async () => {
    if (!restUrl || restLoading) return;
    setRestLoading(true); setBottomPanel("rest");
    try {
      let headers = {};
      try { headers = JSON.parse(restHeaders); } catch {}
      const opts = { method: restMethod, headers };
      if (restBody && restMethod !== "GET") opts.body = restBody;
      const start = Date.now();
      const res = await fetch(restUrl, opts);
      const elapsed = Date.now() - start;
      let body;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const json = await res.json();
        body = JSON.stringify(json, null, 2);
      } else {
        body = await res.text();
      }
      const response = { status: res.status, statusText: res.statusText, body, time: elapsed, headers: Object.fromEntries(res.headers.entries()) };
      setRestResponse(response);
      setRestHistory(p => [{ method:restMethod, url:restUrl, status:res.status, time:elapsed }, ...p.slice(0,9)]);
      notify(`${res.status} ${res.statusText} · ${elapsed}ms`, res.ok ? "success" : "error");
    } catch (err) {
      setRestResponse({ error: err.message, status: 0, body: `Error: ${err.message}` });
      notify(`Request failed: ${err.message}`, "error");
    }
    setRestLoading(false);
  }, [restUrl, restMethod, restHeaders, restBody, restLoading, notify]);

  // ── Monaco mount ───────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onDidChangeCursorPosition(e => setCursorPos({ line: e.position.lineNumber, col: e.position.column }));
    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => setRightPanel(p => p === "copilot" ? null : "copilot"));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => setTerminalOpen(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => setSidebarOpen(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => closeTab(null, activeTabId));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => { setCommandOpen(true); setTimeout(() => cmdRef.current?.focus(), 50); });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => setZenMode(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backslash, () => setSplitMode(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      setFiles(p => p.map(f => f.id === activeTabId ? { ...f, modified: false } : f));
      setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, modified: false } : t));
      if (formatOnSave) editor.getAction("editor.action.formatDocument")?.run();
      notify("Saved", "success");
    });
    // Snippets
    const lang = activeTab?.language;
    if (lang && SNIPPETS[lang]) {
      const snips = SNIPPETS[lang];
      monaco.languages.registerCompletionItemProvider(LANGUAGES[lang]?.monaco || lang, {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
          return { suggestions: snips.map(s => ({ label: s.prefix, kind: monaco.languages.CompletionItemKind.Snippet, documentation: s.desc, insertText: s.body, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range })) };
        }
      });
    }
  }, [runCode, closeTab, activeTabId, activeTab, formatOnSave, notify]);

  // ── Command Palette ────────────────────────────────────
  const COMMANDS = useMemo(() => [
    { id:"run",         label:"▶ Run Code",              keys:"Ctrl+Enter",         fn: () => runCode() },
    { id:"copilot",     label:"🤖 Toggle AI Copilot",    keys:"Ctrl+I",             fn: () => setRightPanel(p => p==="copilot"?null:"copilot") },
    { id:"find",        label:"🔍 Find",                 keys:"Ctrl+F",             fn: () => editorRef.current?.getAction("actions.find")?.run() },
    { id:"replace",     label:"↔ Find & Replace",        keys:"Ctrl+H",             fn: () => editorRef.current?.getAction("editor.action.startFindReplaceAction")?.run() },
    { id:"format",      label:"✨ Format Document",       keys:"Shift+Alt+F",        fn: () => editorRef.current?.getAction("editor.action.formatDocument")?.run() },
    { id:"goto",        label:"→ Go to Line",            keys:"Ctrl+G",             fn: () => editorRef.current?.getAction("editor.action.gotoLine")?.run() },
    { id:"symbols",     label:"@ Go to Symbol",          keys:"Ctrl+Shift+O",       fn: () => editorRef.current?.getAction("editor.action.quickOutline")?.run() },
    { id:"zen",         label:"🧘 Toggle Zen Mode",       keys:"Ctrl+Shift+Z",       fn: () => setZenMode(v => !v) },
    { id:"split",       label:"⟛ Toggle Split Editor",   keys:"Ctrl+\\",            fn: () => setSplitMode(v => !v) },
    { id:"sidebar",     label:"◀ Toggle Sidebar",        keys:"Ctrl+B",             fn: () => setSidebarOpen(v => !v) },
    { id:"terminal",    label:"⬛ Toggle Terminal",       keys:"Ctrl+`",             fn: () => setTerminalOpen(v => !v) },
    { id:"preview",     label:"🌐 Toggle Preview",        keys:"",                   fn: () => setShowPreview(v => !v) },
    { id:"rest",        label:"⚡ REST Client",           keys:"",                   fn: () => setBottomPanel("rest") },
    { id:"regex",       label:"🔍 Regex Tester",          keys:"",                   fn: () => setActiveModal("regex") },
    { id:"json",        label:"📋 JSON Tools",            keys:"",                   fn: () => setActiveModal("json") },
    { id:"base64",      label:"🔐 Base64 Tools",          keys:"",                   fn: () => setActiveModal("base64") },
    { id:"color",       label:"🎨 Color Picker",          keys:"",                   fn: () => setActiveModal("color") },
    { id:"diff",        label:"🔄 Diff Viewer",           keys:"",                   fn: () => setActiveModal("diff") },
    { id:"stats",       label:"📊 Code Statistics",       keys:"",                   fn: () => setActiveModal("stats") },
    { id:"snippets",    label:"🧩 Snippet Manager",       keys:"",                   fn: () => setSnippetModal(true) },
    { id:"keybinds",    label:"⌨ Keyboard Shortcuts",     keys:"",                   fn: () => setKeybindModal(true) },
    { id:"newfile",     label:"📄 New File",              keys:"Ctrl+N",             fn: () => setShowNewFile(true) },
    { id:"theme",       label:"🎨 Change Theme",          keys:"",                   fn: () => { setPanel("settings"); setSidebarOpen(true); } },
    { id:"vim",         label:"⌨ Toggle Vim Mode",        keys:"",                   fn: () => setVimMode(v => !v) },
    { id:"autosave",    label:"💾 Toggle Auto Save",       keys:"",                   fn: () => setAutoSave(v => !v) },
    { id:"minimap",     label:"🗺 Toggle Minimap",         keys:"",                   fn: () => setMinimap(v => !v) },
    { id:"wordwrap",    label:"↵ Toggle Word Wrap",        keys:"",                   fn: () => setWordWrap(v => v==="on"?"off":"on") },
  ], [runCode]);

  const filteredCmds = useMemo(() =>
    commandQuery ? COMMANDS.filter(c => c.label.toLowerCase().includes(commandQuery.toLowerCase())) : COMMANDS,
    [COMMANDS, commandQuery]
  );

  // ── Regex tester ───────────────────────────────────────
  const regexMatches = useMemo(() => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const matches = [...regexInput.matchAll(new RegExp(regexPattern, regexFlags.includes("g") ? regexFlags : regexFlags + "g"))];
      return { matches, error: null, highlighted: regexInput.replace(re, m => `__MATCH__${m}__ENDMATCH__`) };
    } catch (e) {
      return { matches: [], error: e.message, highlighted: regexInput };
    }
  }, [regexPattern, regexFlags, regexInput]);

  // ── JSON tools ─────────────────────────────────────────
  const jsonResult = useMemo(() => {
    try { return { parsed: JSON.parse(jsonInput), error: null }; }
    catch (e) { return { parsed: null, error: e.message }; }
  }, [jsonInput]);

  // ── Color tools ────────────────────────────────────────
  const colorInfo = useMemo(() => {
    const hex = colorInput.replace("#", "");
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    return { hex: colorInput, rgb: `rgb(${r},${g},${b})`, rgba: `rgba(${r},${g},${b},1)`, hsl: (() => {
      const rn=r/255,gn=g/255,bn=b/255,mx=Math.max(rn,gn,bn),mn=Math.min(rn,gn,bn),l=(mx+mn)/2;
      if(mx===mn)return `hsl(0,0%,${Math.round(l*100)}%)`;
      const d=mx-mn,s=l>0.5?d/(2-mx-mn):d/(mx+mn);
      const h=mx===rn?(gn-bn)/d+(gn<bn?6:0):mx===gn?(bn-rn)/d+2:(rn-gn)/d+4;
      return `hsl(${Math.round(h/6*360)},${Math.round(s*100)}%,${Math.round(l*100)}%)`;
    })() };
  }, [colorInput]);

  // Scroll effects
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [logs]);
  useEffect(() => { if (copilotRef.current) copilotRef.current.scrollTop = copilotRef.current.scrollHeight; }, [copilotMessages]);

  const filteredFiles = useMemo(() =>
    files.filter(f => !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase())),
    [files, fileSearch]
  );

  // ── RENDER ─────────────────────────────────────────────
  const inp = { background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${T.border}`, color:T.text, borderRadius:5, padding:"6px 10px", fontSize:12, outline:"none", fontFamily:"inherit", width:"100%" };
  const btn = (extra={}) => ({ border:"none", cursor:"pointer", borderRadius:5, fontSize:12, padding:"6px 12px", fontFamily:"inherit", ...extra });

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:T.bg, color:T.text, overflow:"hidden", fontFamily:"'JetBrains Mono',Consolas,monospace", fontSize:13 }}
      onClick={() => contextMenu && setContextMenu(null)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:#404040;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#555}
        input,textarea,button,select{font-family:inherit}
        .hov:hover{background:${T.hover}!important}
        .nav-btn{border:none;cursor:pointer;background:none;padding:10px 0;width:44px;text-align:center;font-size:20px;color:${T.dim};border-left:2px solid transparent;transition:all .15s}
        .nav-btn:hover{color:${T.text};background:${T.hover}}
        .nav-btn.active{color:${T.text};border-left:2px solid ${T.accent};background:${T.hover}}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite;display:inline-block}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.2s ease infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .18s ease}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}.slide-in{animation:slideIn .2s ease}
        @keyframes notif{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        .tab-x{opacity:.3;transition:opacity .1s}.tab-x:hover{opacity:1;color:#f48771}
        .ctx-item:hover{background:${T.hover};cursor:pointer}
        .run-btn:hover{background:#1177bb!important;transform:translateY(-1px)}.run-btn:active{transform:scale(.97)}
        .tool-btn:hover{background:${T.hover}!important}
        .file-row:hover{background:${T.hover}!important}
        .cmd-item:hover{background:${T.hover}}
        .cmd-item.selected{background:${T.hover}}
        .badge{display:inline-block;background:${T.accent};color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;font-weight:700}
        .notif{animation:notif .3s ease}
        textarea:focus,input:focus{outline:1px solid ${T.accent}!important}
        .rest-status-ok{color:#4ec9b0}
        .rest-status-err{color:#f48771}
        .match-highlight{background:#ff9900;color:#000;border-radius:2px}
      `}</style>

      {/* ══ NOTIFICATIONS ══ */}
      <div style={{ position:"fixed", top:8, right:8, zIndex:2000, display:"flex", flexDirection:"column", gap:6, pointerEvents:"none" }}>
        {notifications.map(n => (
          <div key={n.id} className="notif" style={{ background: n.type==="success"?"#1c4532":n.type==="error"?"#4c1a1a":"#1a2744", border:`1px solid ${n.type==="success"?"#4ec9b0":n.type==="error"?"#f48771":T.accent}`, color: n.type==="success"?"#4ec9b0":n.type==="error"?"#f48771":T.text, padding:"7px 14px", borderRadius:6, fontSize:11, fontWeight:600, boxShadow:"0 4px 12px rgba(0,0,0,.4)" }}>
            {n.type==="success"?"✓":n.type==="error"?"✗":"ℹ"} {n.msg}
          </div>
        ))}
      </div>

      {/* ══ COMMAND PALETTE ══ */}
      {commandOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1500, display:"flex", justifyContent:"center", paddingTop:60 }}
          onClick={e => e.target===e.currentTarget && (setCommandOpen(false),setCommandQuery(""))}>
          <div className="fade-in" style={{ width:"100%", maxWidth:600, background:T.sb, border:`1px solid ${T.border}`, borderRadius:8, maxHeight:500, display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}>
            <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:T.dim }}>⌨</span>
              <input ref={cmdRef} value={commandQuery} onChange={e=>setCommandQuery(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Escape"){setCommandOpen(false);setCommandQuery("");} }}
                placeholder="Type a command..."
                style={{ flex:1, background:"none", border:"none", color:T.text, fontSize:14, outline:"none" }} autoFocus/>
              <span style={{ fontSize:10, color:T.dim }}>ESC to close</span>
            </div>
            <div style={{ overflowY:"auto" }}>
              {filteredCmds.map((cmd,i) => (
                <div key={cmd.id} className="cmd-item"
                  onClick={() => { cmd.fn(); setCommandOpen(false); setCommandQuery(""); }}
                  style={{ padding:"9px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                  <span style={{ fontSize:13, color:T.text }}>{cmd.label}</span>
                  {cmd.keys && <code style={{ fontSize:10, color:T.dim, background:T.bg, padding:"2px 6px", borderRadius:3 }}>{cmd.keys}</code>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TITLE BAR ══ */}
      {!zenMode && (
        <div style={{ height:38, background:T.sb, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 10px", gap:6, flexShrink:0, userSelect:"none" }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <span style={{ color:T.accent, fontWeight:700, fontSize:14, letterSpacing:.3 }}>CodeDroid Pro</span>
          <span style={{ fontSize:10, color:T.dim, background:T.bg, padding:"1px 6px", borderRadius:8, marginLeft:2 }}>v2.0</span>

          {/* Breadcrumb */}
          {breadcrumbs && activeTab && (
            <span style={{ fontSize:11, color:T.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, textAlign:"center" }}>
              {LANGUAGES[activeTab.language]?.icon} {activeTab.name}
              {activeTab.modified && <span style={{ color:"#e5c07b", marginLeft:4 }}>●</span>}
            </span>
          )}
          {!breadcrumbs && <div style={{ flex:1 }}/>}

          {/* Quick actions */}
          {[
            { icon:"⌨", tip:"Command Palette (Ctrl+Shift+P)", fn:()=>{setCommandOpen(true);setTimeout(()=>cmdRef.current?.focus(),50)} },
            { icon:"🔍", tip:"Find (Ctrl+F)", fn:()=>editorRef.current?.getAction("actions.find")?.run() },
            { icon:"✨", tip:"Format (Shift+Alt+F)", fn:()=>editorRef.current?.getAction("editor.action.formatDocument")?.run() },
            { icon:"🌐", tip:"Toggle Preview", fn:()=>setShowPreview(v=>!v) },
            { icon:"🤖", tip:"AI Copilot (Ctrl+I)", fn:()=>setRightPanel(p=>p==="copilot"?null:"copilot") },
          ].map(({icon,tip,fn}) => (
            <button key={tip} onClick={fn} title={tip} className="hov"
              style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", padding:"4px 7px", fontSize:14, borderRadius:4 }}>
              {icon}
            </button>
          ))}

          <button onClick={runCode} disabled={isRunning||!activeTab||!LC.piston} className="run-btn"
            style={{ background:isRunning?"#094771":T.accent, border:"none", color:"#fff", cursor:"pointer", padding:"5px 14px", borderRadius:5, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, opacity:(!activeTab||!LC.piston)?.4:1, flexShrink:0, transition:"all .15s" }}>
            {isRunning ? <><span className="spin">⟳</span>Running</> : <>▶ Run</>}
          </button>
        </div>
      )}

      {/* ══ TAB BAR ══ */}
      {!zenMode && (
        <div style={{ display:"flex", background:T.sb, borderBottom:`1px solid ${T.border}`, overflowX:"auto", flexShrink:0, height:35, scrollbarWidth:"none" }}>
          {openTabs.map(tab => (
            <div key={tab.id} onClick={()=>setActiveTabId(tab.id)} className="hov"
              onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,tab});}}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"0 14px", cursor:"pointer", whiteSpace:"nowrap", fontSize:12, height:"100%", borderRight:`1px solid ${T.border}`, flexShrink:0, minWidth:90,
                background:tab.id===activeTabId?T.bg:T.tab,
                color:tab.id===activeTabId?T.text:T.dim,
                borderTop:`2px solid ${tab.id===activeTabId?T.accent:"transparent"}` }}>
              <span>{LANGUAGES[tab.language]?.icon||"📄"}</span>
              <span style={{ maxWidth:90, overflow:"hidden", textOverflow:"ellipsis" }}>{tab.name}</span>
              {tab.modified && <span style={{ color:"#e5c07b", fontSize:16, lineHeight:1 }}>●</span>}
              <span onClick={e=>closeTab(e,tab.id)} className="tab-x" style={{ marginLeft:2, cursor:"pointer", fontSize:16 }}>×</span>
            </div>
          ))}
          <button onClick={()=>setShowNewFile(true)} title="New File (Ctrl+N)"
            style={{ padding:"0 14px", background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:22, flexShrink:0 }}>+</button>
        </div>
      )}

      {/* ══ MAIN BODY ══ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── ACTIVITY BAR ── */}
        {!zenMode && (
          <div style={{ width:44, background:T.sb, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:2, flexShrink:0 }}>
            {[
              { id:"explorer",   icon:"⎇",  tip:"Explorer"    },
              { id:"search",     icon:"🔍", tip:"Search"       },
              { id:"extensions", icon:"⊞",  tip:"Extensions"  },
              { id:"git",        icon:"⑂",  tip:"Source Ctrl" },
              { id:"debug",      icon:"🐛", tip:"Debug"        },
              { id:"settings",   icon:"⚙",  tip:"Settings"    },
            ].map(n => (
              <button key={n.id} title={n.tip} className={`nav-btn${panel===n.id&&sidebarOpen?" active":""}`}
                onClick={()=>{ if(panel===n.id){setSidebarOpen(v=>!v);}else{setPanel(n.id);setSidebarOpen(true);} }}>
                {n.icon}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <button onClick={()=>setZenMode(v=>!v)} title="Zen Mode (Ctrl+Shift+Z)" className="nav-btn" style={{ marginBottom:4 }}>🧘</button>
          </div>
        )}

        {/* ── SIDEBAR ── */}
        {sidebarOpen && !zenMode && (
          <div className="fade-in" style={{ width:240, background:T.sb, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

            {/* ─ EXPLORER ─ */}
            {panel==="explorer" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div style={{ padding:"10px 12px 4px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase" }}>Explorer</span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>setShowNewFile(v=>!v)} title="New File" style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:16, padding:"0 3px" }}>📄</button>
                    <button onClick={()=>notify("Folder feature coming soon!","info")} title="New Folder" style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:16, padding:"0 3px" }}>📁</button>
                    <button onClick={()=>{ setFiles(DEFAULT_FILES); notify("Reset to defaults","info"); }} title="Reset" style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:14, padding:"0 3px" }}>↺</button>
                  </div>
                </div>
                <div style={{ padding:"0 8px 6px", flexShrink:0 }}>
                  <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="🔍 Filter files..."
                    style={{ ...inp }}/>
                </div>
                {showNewFile && (
                  <div className="fade-in" style={{ padding:"2px 8px 6px", display:"flex", gap:4, flexShrink:0 }}>
                    <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter")createFile(); if(e.key==="Escape")setShowNewFile(false); }}
                      placeholder="main.py, App.java, app.go..."
                      style={{ ...inp, flex:1, borderColor:T.accent }}/>
                    <button onClick={createFile} style={{ ...btn({background:T.accent,color:"#fff"}) }}>✓</button>
                  </div>
                )}
                <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
                  <div style={{ padding:"4px 10px 2px", fontSize:10, color:T.dim, letterSpacing:1 }}>OPEN FILES ({files.length})</div>
                  {filteredFiles.map(file => (
                    <div key={file.id} className="file-row"
                      onClick={()=>openFile(file)}
                      onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,file});}}
                      style={{ display:"flex", alignItems:"center", padding:"5px 10px 5px 14px", gap:7, fontSize:12, cursor:"pointer",
                        color:activeTabId===file.id?T.text:T.dim,
                        background:activeTabId===file.id?(isDark?"#094771":"#cce5ff"):"transparent" }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{LANGUAGES[file.language]?.icon||"📄"}</span>
                      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                      {file.modified && <span style={{ color:"#e5c07b", fontSize:12 }}>●</span>}
                      {bookmarks[file.id]?.length > 0 && <span style={{ fontSize:9, color:T.accent }}>🔖{bookmarks[file.id].length}</span>}
                      <span style={{ display:"flex", gap:3, opacity:0 }} className="file-actions">
                        <span onClick={e=>{e.stopPropagation();duplicateFile(file);}} title="Duplicate" style={{ cursor:"pointer", fontSize:12 }}>⎘</span>
                        <span onClick={e=>deleteFile(e,file.id)} title="Delete" style={{ cursor:"pointer", fontSize:12, color:"#f48771" }}>×</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"6px 12px", borderTop:`1px solid ${T.border}`, fontSize:10, color:T.dim, display:"flex", justifyContent:"space-between" }}>
                  <span>{files.length} files</span>
                  <span>{autoSave ? "💾 auto-save" : "manual save"}</span>
                </div>
              </div>
            )}

            {/* ─ GLOBAL SEARCH ─ */}
            {panel==="search" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
                <div style={{ padding:"10px 12px 8px", flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Search</div>
                  <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Search in all files..."
                    style={{ ...inp, marginBottom:6 }}/>
                  <input value={globalReplace} onChange={e=>setGlobalReplace(e.target.value)} placeholder="Replace with..."
                    style={{ ...inp, marginBottom:6 }}/>
                  {globalReplace && (
                    <button onClick={()=>{
                      if(!globalSearch)return;
                      setFiles(p=>p.map(f=>({...f,content:f.content.split(globalSearch).join(globalReplace)})));
                      notify(`Replaced all "${globalSearch}" → "${globalReplace}"`, "success");
                    }} style={{ ...btn({background:T.accent,color:"#fff",width:"100%"}) }}>Replace All in Workspace</button>
                  )}
                </div>
                <div style={{ flex:1, overflowY:"auto", padding:"0 8px" }}>
                  {globalSearch && files.map(f => {
                    const count = f.content.split(globalSearch).length - 1;
                    if (!count) return null;
                    return (
                      <div key={f.id} onClick={()=>openFile(f)} className="hov"
                        style={{ padding:"6px 8px", borderRadius:4, cursor:"pointer", marginBottom:4 }}>
                        <div style={{ fontSize:12, color:T.text, display:"flex", justifyContent:"space-between" }}>
                          <span>{LANGUAGES[f.language]?.icon} {f.name}</span>
                          <span className="badge">{count}</span>
                        </div>
                        <div style={{ fontSize:10, color:T.dim, marginTop:3 }}>
                          {f.content.split("\n").filter(l=>l.includes(globalSearch)).slice(0,2).map((l,i)=>(
                            <div key={i} style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {l.trim().slice(0,60)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {globalSearch && !files.some(f=>f.content.includes(globalSearch)) && (
                    <div style={{ textAlign:"center", color:T.dim, fontSize:12, padding:20 }}>No results found</div>
                  )}
                </div>
              </div>
            )}

            {/* ─ EXTENSIONS ─ */}
            {panel==="extensions" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
                <div style={{ padding:"10px 12px 6px", flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Extensions</div>
                  <input placeholder="🔍 Search extensions..." style={{ ...inp }}/>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {[
                    {icon:"✨",name:"Prettier",         desc:"Code formatter",          on:true},
                    {icon:"🔍",name:"ESLint",           desc:"JavaScript linter",       on:true},
                    {icon:"🐍",name:"Python",           desc:"Python support",          on:true},
                    {icon:"☕",name:"Java",             desc:"Java language support",   on:true},
                    {icon:"⚙️",name:"C/C++",           desc:"C/C++ IntelliSense",      on:true},
                    {icon:"🦀",name:"Rust Analyzer",   desc:"Rust language support",   on:true},
                    {icon:"🐹",name:"Go",              desc:"Go language support",     on:true},
                    {icon:"🤖",name:"GitHub Copilot",  desc:"AI pair programmer",      on:true},
                    {icon:"🌿",name:"GitLens",         desc:"Git supercharged",        on:false},
                    {icon:"🌈",name:"indent-rainbow",  desc:"Colorize indentation",    on:true},
                    {icon:"🔵",name:"Bracket Pair",    desc:"Colorize brackets",       on:true},
                    {icon:"📌",name:"Todo Highlight",  desc:"Highlight TODO/FIXME",    on:true},
                    {icon:"⚡",name:"Thunder Client",  desc:"REST API client",         on:true},
                    {icon:"🐳",name:"Docker",          desc:"Docker support",          on:false},
                    {icon:"🔷",name:"TypeScript",      desc:"TS language support",     on:true},
                    {icon:"🎨",name:"Color Highlight",  desc:"Highlight CSS colors",    on:true},
                  ].map((ext,i) => (
                    <div key={i} style={{ padding:"10px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{ext.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{ext.name}</div>
                        <div style={{ fontSize:10, color:T.dim, marginTop:1 }}>{ext.desc}</div>
                      </div>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:ext.on?"#4ec9b0":"#555", marginTop:4, flexShrink:0 }}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─ GIT ─ */}
            {panel==="git" && (
              <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10, height:"100%", overflowY:"auto" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase" }}>Source Control</div>
                <div style={{ background:T.bg, borderRadius:6, padding:10, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.dim, marginBottom:8 }}>CHANGES ({files.filter(f=>f.modified).length})</div>
                  {files.filter(f=>f.modified).map(f=>(
                    <div key={f.id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"3px 0", color:T.text }}>
                      <span>{LANGUAGES[f.language]?.icon} {f.name}</span>
                      <span style={{ color:"#e5c07b", fontWeight:700 }}>M</span>
                    </div>
                  ))}
                  {files.filter(f=>f.modified).length===0 && <div style={{ color:T.dim, fontSize:11 }}>No changes</div>}
                </div>
                <textarea placeholder="Commit message..." rows={3}
                  style={{ ...inp, resize:"vertical" }}/>
                <button onClick={()=>{ setFiles(p=>p.map(f=>({...f,modified:false}))); setOpenTabs(p=>p.map(t=>({...t,modified:false}))); notify("Committed successfully!","success"); }}
                  style={{ ...btn({background:T.accent,color:"#fff"}) }}>✓ Commit</button>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  <button onClick={()=>notify("Pushing...","info")} style={{ ...btn({background:T.tab,color:T.text}) }}>⬆ Push</button>
                  <button onClick={()=>notify("Pulling...","info")} style={{ ...btn({background:T.tab,color:T.text}) }}>⬇ Pull</button>
                </div>
                <div style={{ fontSize:11, color:T.dim, padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
                  <div style={{ marginBottom:4 }}>🌿 Branch: <span style={{ color:T.accent }}>main</span></div>
                  <div>↑ Ahead 0 · ↓ Behind 0</div>
                </div>
              </div>
            )}

            {/* ─ DEBUG ─ */}
            {panel==="debug" && (
              <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10, height:"100%", overflowY:"auto" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase" }}>Debug</div>
                <button onClick={()=>notify("Debugger: Run and attach","info")} style={{ ...btn({background:"#4ec9b0",color:"#000",fontWeight:700}) }}>▶ Start Debugging</button>
                <div style={{ background:T.bg, borderRadius:6, padding:10, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>BREAKPOINTS (0)</div>
                  <div style={{ color:T.dim, fontSize:11 }}>No breakpoints set</div>
                </div>
                <div style={{ background:T.bg, borderRadius:6, padding:10, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>VARIABLES</div>
                  <div style={{ color:T.dim, fontSize:11 }}>Not paused</div>
                </div>
                <div style={{ background:T.bg, borderRadius:6, padding:10, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>CALL STACK</div>
                  <div style={{ color:T.dim, fontSize:11 }}>Not paused</div>
                </div>
                <div style={{ background:T.bg, borderRadius:6, padding:10, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, color:T.dim, marginBottom:6 }}>WATCH</div>
                  <input placeholder="+ Add expression..." style={{ ...inp, fontSize:11 }}/>
                </div>
              </div>
            )}

            {/* ─ SETTINGS ─ */}
            {panel==="settings" && (
              <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:1.5, textTransform:"uppercase" }}>Settings</div>

                <div>
                  <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>Color Theme</label>
                  <select value={themeName} onChange={e=>setThemeName(e.target.value)} style={{ ...inp }}>
                    {Object.keys(THEMES).map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>Font Size: <span style={{ color:T.accent }}>{fontSize}px</span></label>
                  <input type="range" min={10} max={24} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{ width:"100%", accentColor:T.accent }}/>
                </div>

                <div>
                  <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>Tab Size: <span style={{ color:T.accent }}>{tabSize}</span></label>
                  <input type="range" min={2} max={8} step={2} value={tabSize} onChange={e=>setTabSize(+e.target.value)} style={{ width:"100%", accentColor:T.accent }}/>
                </div>

                {[
                  ["Word Wrap",       wordWrap==="on",   ()=>setWordWrap(v=>v==="on"?"off":"on")],
                  ["Minimap",         minimap,           ()=>setMinimap(v=>!v)],
                  ["Line Numbers",    lineNumbers==="on",()=>setLineNumbers(v=>v==="on"?"off":"on")],
                  ["Sticky Scroll",   stickyScroll,      ()=>setStickyScroll(v=>!v)],
                  ["Breadcrumbs",     breadcrumbs,       ()=>setBreadcrumbs(v=>!v)],
                  ["Auto Save",       autoSave,          ()=>setAutoSave(v=>!v)],
                  ["Format on Save",  formatOnSave,      ()=>setFormatOnSave(v=>!v)],
                  ["Vim Mode",        vimMode,           ()=>setVimMode(v=>!v)],
                ].map(([label,val,fn]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:T.text }}>{label}</span>
                    <Toggle value={val} onChange={fn} T={T}/>
                  </div>
                ))}

                <div>
                  <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>Whitespace Render</label>
                  <select value={renderWhitespace} onChange={e=>setRenderWhitespace(e.target.value)} style={{ ...inp }}>
                    {["none","selection","all","boundary","trailing"].map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                  <div style={{ fontSize:10, color:T.dim, marginBottom:10, letterSpacing:1 }}>TOOLS</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                    {[
                      ["🔍 Regex",    ()=>setActiveModal("regex")],
                      ["📋 JSON",     ()=>setActiveModal("json")],
                      ["🔐 Base64",   ()=>setActiveModal("base64")],
                      ["🎨 Color",    ()=>setActiveModal("color")],
                      ["🔄 Diff",     ()=>setActiveModal("diff")],
                      ["📊 Stats",    ()=>setActiveModal("stats")],
                    ].map(([l,f])=>(
                      <button key={l} onClick={f} style={{ ...btn({background:T.tab,color:T.text,padding:"7px 4px",fontSize:11}) }}>{l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                  <div style={{ fontSize:10, color:T.dim, marginBottom:8, letterSpacing:1 }}>KEYBOARD SHORTCUTS</div>
                  {[
                    ["Ctrl+Enter","Run code"],["Ctrl+I","AI Copilot"],["Ctrl+Shift+P","Commands"],
                    ["Ctrl+F","Find"],["Ctrl+H","Replace"],["Ctrl+G","Go to line"],["Ctrl+Shift+O","Symbols"],
                    ["Ctrl+/","Comment"],["Ctrl+D","Select next"],["Ctrl+Shift+K","Delete line"],
                    ["Alt+↑↓","Move line"],["Ctrl+Shift+↑↓","Copy line"],["Ctrl+B","Sidebar"],
                    ["Ctrl+`","Terminal"],["Ctrl+Shift+Z","Zen Mode"],["Ctrl+\\","Split editor"],
                    ["Ctrl+W","Close tab"],["Ctrl+S","Save"],["Shift+Alt+F","Format"],
                    ["Ctrl+N","New file"],["Ctrl+Shift+F","Global search"],
                  ].map(([k,d])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:5, gap:6 }}>
                      <code style={{ color:isDark?"#569cd6":"#0000ff", background:T.bg, padding:"1px 4px", borderRadius:3, fontSize:9, flexShrink:0 }}>{k}</code>
                      <span style={{ color:T.dim, textAlign:"right" }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR COLUMN ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>

          {/* Editor area */}
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

            {/* Preview panel */}
            {showPreview && activeTab?.language === "html" && (
              <div style={{ width:"45%", borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
                <div style={{ height:30, background:T.sb, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 12px", gap:8 }}>
                  <span style={{ fontSize:11, color:T.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>🌐 Live Preview</span>
                  <button onClick={()=>setShowPreview(false)} style={{ marginLeft:"auto", background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:16 }}>×</button>
                </div>
                <iframe
                  srcDoc={activeTab.content}
                  style={{ flex:1, border:"none", background:"#fff" }}
                  sandbox="allow-scripts allow-same-origin"
                  title="preview"
                />
              </div>
            )}

            {/* Monaco Editor(s) */}
            <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
              {activeTab ? (
                <>
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <Editor
                      key={`${activeTab.id}-${themeName}`}
                      height="100%"
                      language={LANGUAGES[activeTab.language]?.monaco || "plaintext"}
                      value={activeTab.content}
                      theme={T.vs}
                      onChange={val => updateContent(val || "")}
                      onMount={handleEditorMount}
                      options={{
                        fontSize, tabSize,
                        fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
                        fontLigatures: true,
                        wordWrap, minimap: { enabled: minimap },
                        lineNumbers, scrollBeyondLastLine: false,
                        automaticLayout: true,
                        insertSpaces: true,
                        detectIndentation: true,
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true, indentation: true },
                        suggest: { enabled: true, showSnippets: true },
                        quickSuggestions: { other:true, comments:false, strings:true },
                        parameterHints: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: false,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        mouseWheelZoom: true,
                        renderWhitespace,
                        showFoldingControls: "always",
                        folding: true,
                        links: true,
                        colorDecorators: true,
                        renderLineHighlight: "all",
                        occurrencesHighlight: "multiFile",
                        selectionHighlight: true,
                        contextmenu: true,
                        multiCursorModifier: "ctrlCmd",
                        accessibilitySupport: "off",
                        stickyScroll: { enabled: stickyScroll },
                        inlayHints: { enabled: "on" },
                        unicodeHighlight: { nonBasicASCII: false },
                        "editor.vim": vimMode,
                      }}
                    />
                  </div>
                  {/* Split Editor */}
                  {splitMode && (
                    <div style={{ flex:1, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                      <div style={{ height:30, background:T.sb, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 10px", gap:6, flexShrink:0 }}>
                        <span style={{ fontSize:11, color:T.dim }}>Split:</span>
                        <select value={splitTabId||""} onChange={e=>setSplitTabId(+e.target.value||null)}
                          style={{ flex:1, background:T.tab, border:`1px solid ${T.border}`, color:T.text, borderRadius:3, padding:"2px 6px", fontSize:11 }}>
                          <option value="">Select file...</option>
                          {files.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <button onClick={()=>setSplitMode(false)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:16 }}>×</button>
                      </div>
                      {splitTab && (
                        <Editor
                          key={`split-${splitTab.id}-${themeName}`}
                          height="100%"
                          language={LANGUAGES[splitTab.language]?.monaco||"plaintext"}
                          value={splitTab.content}
                          theme={T.vs}
                          onChange={val=>{ setFiles(p=>p.map(f=>f.id===splitTab.id?{...f,content:val||""}:f)); }}
                          options={{ fontSize, tabSize, fontFamily:"'JetBrains Mono',Consolas,monospace", wordWrap, minimap:{enabled:false}, lineNumbers, automaticLayout:true, bracketPairColorization:{enabled:true}, scrollBeyondLastLine:false }}
                        />
                      )}
                      {!splitTab && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:T.dim, fontSize:12 }}>Select a file above</div>}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:T.dim, gap:16 }}>
                  <span style={{ fontSize:72, filter:"drop-shadow(0 0 20px #007acc44)" }}>⚡</span>
                  <div style={{ fontSize:26, fontWeight:700, color:T.text }}>CodeDroid Pro</div>
                  <div style={{ fontSize:13, color:T.dim, textAlign:"center", lineHeight:2, maxWidth:320 }}>
                    Real VS Code Engine on Android<br/>
                    Monaco · Piston · Claude AI · 20 Languages
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                    {[
                      ["📂 Open File",     ()=>{setPanel("explorer");setSidebarOpen(true);}],
                      ["📄 New File",      ()=>setShowNewFile(true)],
                      ["🤖 AI Copilot",   ()=>setRightPanel("copilot")],
                      ["⌨ Commands",      ()=>{setCommandOpen(true);setTimeout(()=>cmdRef.current?.focus(),50);}],
                    ].map(([l,f])=>(
                      <button key={l} onClick={f} style={{ ...btn({background:T.tab,color:T.text,padding:"10px 14px",fontSize:12}) }}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM PANEL ── */}
          <div style={{ background:T.terminal, borderTop:`1px solid ${T.border}`, flexShrink:0, display:"flex", flexDirection:"column", height:terminalOpen?terminalH:32, transition:"height .2s ease", overflow:"hidden" }}>
            {/* Panel tabs */}
            <div style={{ display:"flex", alignItems:"center", height:32, flexShrink:0, borderBottom:terminalOpen?`1px solid ${T.border}`:"none", userSelect:"none" }}>
              {[
                { id:"terminal", label:"⬛ Terminal" },
                { id:"rest",     label:"⚡ REST Client" },
                { id:"problems", label:`⚠ Problems${problems.length?` (${problems.length})`:""}` },
                { id:"output",   label:"📤 Output" },
              ].map(p => (
                <button key={p.id} onClick={()=>{setBottomPanel(p.id);setTerminalOpen(true);}}
                  style={{ padding:"0 14px", height:"100%", background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:600, color:bottomPanel===p.id?T.text:T.dim, borderBottom:`2px solid ${bottomPanel===p.id?T.accent:"transparent"}`, transition:"all .15s" }}>
                  {p.label}
                </button>
              ))}
              <div style={{ flex:1 }}/>
              {/* Execution stats */}
              {execStats && bottomPanel==="terminal" && (
                <span style={{ fontSize:10, color:T.dim, padding:"0 10px" }}>
                  ⚡ {execStats.lang} · {execStats.time}ms · exit({execStats.exitCode})
                </span>
              )}
              {bottomPanel==="terminal" && (
                <>
                  <button onClick={()=>setShowStdin(v=>!v)} style={{ background:"none", border:"none", color:showStdin?T.accent:T.dim, cursor:"pointer", fontSize:11, padding:"0 8px" }} title="stdin">⌨ stdin</button>
                  <button onClick={()=>setLogs([{type:"system",text:"🧹 Terminal cleared"},{type:"divider",text:""}])} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 6px" }}>⌧</button>
                </>
              )}
              <button onClick={()=>setTerminalH(h=>Math.min(h+60,600))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 6px" }}>⬆</button>
              <button onClick={()=>setTerminalH(h=>Math.max(h-60,80))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 6px" }}>⬇</button>
              <button onClick={()=>setTerminalOpen(v=>!v)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 8px" }}>
                {terminalOpen?"▼":"▲"}
              </button>
            </div>

            {terminalOpen && (
              <>
                {/* stdin input */}
                {showStdin && bottomPanel==="terminal" && (
                  <div style={{ padding:"4px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                    <span style={{ fontSize:11, color:T.dim, flexShrink:0 }}>stdin:</span>
                    <input value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="Program input (newline-separated for multiple)..."
                      style={{ ...inp }}/>
                    <button onClick={()=>setStdin("")} style={{ ...btn({background:T.tab,color:T.dim,padding:"4px 8px"}) }}>×</button>
                  </div>
                )}

                {/* TERMINAL */}
                {bottomPanel==="terminal" && (
                  <div ref={termRef} style={{ flex:1, overflowY:"auto", padding:"6px 14px 10px", fontSize:13, fontFamily:"'JetBrains Mono',Consolas,monospace" }}>
                    {logs.map((log,i) =>
                      log.type==="divider"
                        ? <div key={i} style={{ borderTop:`1px solid ${T.border}`, margin:"5px 0" }}/>
                        : <div key={i} style={{ color:log.type==="error"?"#f48771":log.type==="cmd"?"#9cdcfe":log.type==="info"?"#e5c07b":log.type==="output"?T.text:"#555", whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7 }}>{log.text}</div>
                    )}
                    {isRunning && <span className="pulse" style={{ color:T.accent, fontSize:16 }}>█</span>}
                  </div>
                )}

                {/* REST CLIENT */}
                {bottomPanel==="rest" && (
                  <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <select value={restMethod} onChange={e=>setRestMethod(e.target.value)}
                        style={{ ...inp, width:90, fontWeight:700, color:restMethod==="GET"?"#4ec9b0":restMethod==="POST"?"#e5c07b":restMethod==="DELETE"?"#f48771":"#9cdcfe" }}>
                        {["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].map(m=><option key={m}>{m}</option>)}
                      </select>
                      <input value={restUrl} onChange={e=>setRestUrl(e.target.value)} placeholder="https://api.example.com/endpoint"
                        style={{ ...inp, flex:1 }}
                        onKeyDown={e=>e.key==="Enter"&&sendRequest()}/>
                      <button onClick={sendRequest} disabled={restLoading}
                        style={{ ...btn({background:T.accent,color:"#fff",fontWeight:700,padding:"6px 16px",flexShrink:0}) }}>
                        {restLoading ? <span className="spin">⟳</span> : "Send"}
                      </button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, flex:1, minHeight:0 }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <div style={{ fontSize:11, color:T.dim, fontWeight:700 }}>Headers</div>
                        <textarea value={restHeaders} onChange={e=>setRestHeaders(e.target.value)} rows={4}
                          style={{ ...inp, resize:"none", flex:1, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}/>
                        {restMethod!=="GET" && <>
                          <div style={{ fontSize:11, color:T.dim, fontWeight:700 }}>Body</div>
                          <textarea value={restBody} onChange={e=>setRestBody(e.target.value)} placeholder='{"key": "value"}'
                            style={{ ...inp, resize:"none", flex:1, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}/>
                        </>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:11, color:T.dim, fontWeight:700 }}>Response</span>
                          {restResponse && (
                            <span className={`rest-status-${restResponse.status>=200&&restResponse.status<300?"ok":"err"}`} style={{ fontSize:11, fontWeight:700 }}>
                              {restResponse.status} {restResponse.statusText} {restResponse.time && `· ${restResponse.time}ms`}
                            </span>
                          )}
                        </div>
                        <textarea readOnly value={restResponse ? (restResponse.body || restResponse.error || "") : ""}
                          placeholder="Response will appear here..."
                          style={{ ...inp, resize:"none", flex:1, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}/>
                      </div>
                    </div>
                    {restHistory.length > 0 && (
                      <div style={{ flexShrink:0 }}>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>HISTORY</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {restHistory.slice(0,5).map((h,i)=>(
                            <button key={i} onClick={()=>{setRestMethod(h.method);setRestUrl(h.url);}}
                              style={{ ...btn({background:T.tab,color:T.dim,fontSize:10,padding:"3px 8px"}) }}>
                              <span style={{ color:h.status<300?"#4ec9b0":"#f48771" }}>{h.method}</span> {new URL(h.url).pathname.slice(0,20)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PROBLEMS */}
                {bottomPanel==="problems" && (
                  <div style={{ flex:1, overflowY:"auto", padding:12 }}>
                    {problems.length === 0 ? (
                      <div style={{ color:T.dim, fontSize:12, textAlign:"center", padding:20 }}>✓ No problems detected</div>
                    ) : problems.map((p,i) => (
                      <div key={i} style={{ padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                        <span style={{ color:p.type==="error"?"#f48771":"#e5c07b" }}>{p.type==="error"?"✗":"⚠"}</span>
                        <span style={{ color:T.text, marginLeft:8 }}>{p.message}</span>
                        <span style={{ color:T.dim, marginLeft:8, fontSize:10 }}>Ln {p.line}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* OUTPUT */}
                {bottomPanel==="output" && (
                  <div style={{ flex:1, overflowY:"auto", padding:12, fontSize:12, color:T.dim, fontFamily:"'JetBrains Mono',monospace" }}>
                    <div>[CodeDroid Pro] Build tools output will appear here...</div>
                    {execStats && <div style={{ color:"#4ec9b0", marginTop:4 }}>[Run] {execStats.lang} executed in {execStats.time}ms (exit {execStats.exitCode})</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (AI COPILOT) ── */}
        {rightPanel === "copilot" && (
          <div className="slide-in" style={{ width:320, background:T.sb, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>🤖 AI Copilot</div>
                <div style={{ fontSize:10, color:T.dim }}>Claude AI · Context-aware · {activeTab?.name||"No file"}</div>
              </div>
              <button onClick={()=>setRightPanel(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:20 }}>✕</button>
            </div>

            {/* Mode selector */}
            <div style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:4, flexShrink:0 }}>
              {[["chat","💬"],["explain","💡"],["review","🔍"]].map(([m,i])=>(
                <button key={m} onClick={()=>setCopilotMode(m)}
                  style={{ flex:1, ...btn({background:copilotMode===m?T.accent:T.tab,color:copilotMode===m?"#fff":T.dim,padding:"4px",fontSize:11}) }}>
                  {i} {m}
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ padding:"6px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", flexWrap:"wrap", gap:4, flexShrink:0 }}>
              {[
                ["💡 Explain","Explain this code in simple terms"],
                ["🐛 Debug",  "Find and fix all bugs"],
                ["⚡ Optimize","Optimize for better performance"],
                ["📝 Docs",   "Add comprehensive documentation"],
                ["🧪 Tests",  "Generate unit tests"],
                ["🔄 Refactor","Refactor and improve code structure"],
                ["🔍 Review", "Do a thorough code review"],
                ["🚀 Improve","How can I improve this code?"],
              ].map(([label,prompt])=>(
                <button key={label} onClick={()=>askCopilot(prompt)}
                  style={{ background:"none", border:`1px solid ${T.border}`, color:T.text, borderRadius:12, padding:"3px 9px", cursor:"pointer", fontSize:10, transition:"all .15s" }}
                  className="tool-btn">
                  {label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={copilotRef} style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
              {copilotMessages.map((msg,i)=>(
                <div key={i} style={{
                  alignSelf:msg.role==="user"?"flex-end":"flex-start",
                  background:msg.role==="user"?T.accent:(isDark?"#2d2d2d":"#e8e8e8"),
                  color:msg.role==="user"?"#fff":T.text,
                  borderRadius:msg.role==="user"?"14px 14px 2px 14px":"14px 14px 14px 2px",
                  padding:"10px 13px", maxWidth:"94%", fontSize:12, lineHeight:1.7,
                  whiteSpace:"pre-wrap", wordBreak:"break-word",
                  boxShadow:"0 2px 8px rgba(0,0,0,.15)"
                }}>{msg.text}</div>
              ))}
              {copilotLoading && (
                <div style={{ alignSelf:"flex-start", background:isDark?"#2d2d2d":"#e8e8e8", borderRadius:"14px 14px 14px 2px", padding:"12px 16px", fontSize:12, color:T.dim }}>
                  <span className="pulse">● ● ●</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding:"8px 10px", borderTop:`1px solid ${T.border}`, display:"flex", gap:7, flexShrink:0 }}>
              <textarea value={copilotInput} onChange={e=>setCopilotInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); askCopilot(); } }}
                placeholder="Ask anything... (Enter = send, Shift+Enter = newline)"
                rows={2}
                style={{ flex:1, ...inp, resize:"none" }}/>
              <button onClick={()=>askCopilot()} disabled={copilotLoading||!copilotInput.trim()}
                style={{ ...btn({background:copilotLoading?"#555":T.accent,color:"#fff",padding:"0 12px",fontSize:18}), opacity:copilotInput.trim()?1:.4 }}>
                {copilotLoading ? <span className="spin" style={{ fontSize:15 }}>⟳</span> : "↑"}
              </button>
            </div>

            {/* Clear chat */}
            <button onClick={()=>setCopilotMessages([{role:"assistant",text:"Chat cleared. How can I help?"}])}
              style={{ margin:"0 10px 8px", ...btn({background:"none",color:T.dim,fontSize:11,border:`1px solid ${T.border}`}) }}>
              🗑 Clear conversation
            </button>
          </div>
        )}
      </div>

      {/* ══ CONTEXT MENU ══ */}
      {contextMenu && (
        <div style={{ position:"fixed", top:contextMenu.y, left:contextMenu.x, zIndex:999, background:T.sb, border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 0", minWidth:200, boxShadow:"0 12px 40px rgba(0,0,0,.6)" }}>
          {(contextMenu.tab ? [
            ["▶ Run",              ()=>runCode()],
            ["⟛ Open in Split",   ()=>{setSplitMode(true);setSplitTabId(contextMenu.tab.id);}],
            ["⎘ Duplicate",        ()=>duplicateFile(contextMenu.tab)],
            ["─",                  null],
            ["🗑 Close",           ()=>closeTab(null,contextMenu.tab.id)],
          ] : contextMenu.file ? [
            ["📂 Open",            ()=>openFile(contextMenu.file)],
            ["⟛ Open in Split",   ()=>{setSplitMode(true);setSplitTabId(contextMenu.file.id);}],
            ["⎘ Duplicate",        ()=>duplicateFile(contextMenu.file)],
            ["─",                  null],
            ["🗑 Delete",          ()=>deleteFile(null,contextMenu.file.id)],
          ] : []).map(([l,f],i) =>
            l==="─"
              ? <div key={i} style={{ borderTop:`1px solid ${T.border}`, margin:"3px 0" }}/>
              : <div key={i} className="ctx-item" onClick={()=>{setContextMenu(null);f&&f();}}
                  style={{ padding:"7px 16px", cursor:"pointer", fontSize:12, color:T.text }}>{l}</div>
          )}
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Regex Tester */}
      <Modal open={activeModal==="regex"} onClose={()=>setActiveModal(null)} title="🔍 Regex Tester" width={700} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:8 }}>
            <input value={regexPattern} onChange={e=>setRegexPattern(e.target.value)} placeholder="Pattern..." style={{ ...inp, flex:1, fontFamily:"'JetBrains Mono',monospace" }}/>
            <input value={regexFlags} onChange={e=>setRegexFlags(e.target.value)} placeholder="flags" style={{ ...inp, width:80 }}/>
          </div>
          {regexMatches.error && <div style={{ color:"#f48771", fontSize:12 }}>⚠ {regexMatches.error}</div>}
          <textarea value={regexInput} onChange={e=>setRegexInput(e.target.value)} rows={5} placeholder="Test string..." style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace" }}/>
          <div style={{ background:T.bg, padding:12, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, lineHeight:1.8, fontFamily:"'JetBrains Mono',monospace" }}>
            {regexMatches.highlighted.split("__MATCH__").map((part,i)=>{
              if(i===0) return <span key={i}>{part}</span>;
              const [match, ...rest] = part.split("__ENDMATCH__");
              return <React.Fragment key={i}><mark className="match-highlight">{match}</mark><span>{rest.join("")}</span></React.Fragment>;
            })}
          </div>
          <div style={{ fontSize:12, color:T.dim }}>
            {regexMatches.matches.length > 0
              ? <><span style={{ color:"#4ec9b0", fontWeight:700 }}>{regexMatches.matches.length} match{regexMatches.matches.length>1?"es":""}</span>: {regexMatches.matches.map(m=>m[0]).join(", ")}</>
              : <span style={{ color:"#f48771" }}>No matches</span>
            }
          </div>
        </div>
      </Modal>

      {/* JSON Tools */}
      <Modal open={activeModal==="json"} onClose={()=>setActiveModal(null)} title="📋 JSON Tools" width={700} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <textarea value={jsonInput} onChange={e=>setJsonInput(e.target.value)} rows={6} placeholder="Paste JSON here..." style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}/>
          {jsonResult.error && <div style={{ color:"#f48771", fontSize:12 }}>⚠ {jsonResult.error}</div>}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[
              ["✨ Format",  ()=>{ if(jsonResult.parsed) setJsonInput(JSON.stringify(jsonResult.parsed,null,2)); }],
              ["⚡ Minify",  ()=>{ if(jsonResult.parsed) setJsonInput(JSON.stringify(jsonResult.parsed)); }],
              ["✓ Validate",()=>{ notify(jsonResult.error?`Invalid: ${jsonResult.error}`:"Valid JSON ✓", jsonResult.error?"error":"success"); }],
              ["📋 Copy",    ()=>{ navigator.clipboard?.writeText(jsonInput); notify("Copied!","success"); }],
              ["🗑 Clear",   ()=>setJsonInput("")],
            ].map(([l,f])=>(
              <button key={l} onClick={f} style={{ ...btn({background:T.tab,color:T.text}) }}>{l}</button>
            ))}
          </div>
          {jsonResult.parsed && (
            <div style={{ background:T.bg, padding:12, borderRadius:6, border:`1px solid ${T.border}`, fontSize:11, color:T.dim }}>
              Keys: {Object.keys(jsonResult.parsed).length} · Type: {Array.isArray(jsonResult.parsed)?"array":"object"} · Size: {JSON.stringify(jsonResult.parsed).length} chars
            </div>
          )}
        </div>
      </Modal>

      {/* Base64 Tools */}
      <Modal open={activeModal==="base64"} onClose={()=>setActiveModal(null)} title="🔐 Base64 / Tools" width={600} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", gap:6 }}>
            {[["encode","Encode"],["decode","Decode"],["jwt","JWT Decode"]].map(([m,l])=>(
              <button key={m} onClick={()=>setBase64Mode(m)} style={{ flex:1, ...btn({background:base64Mode===m?T.accent:T.tab,color:base64Mode===m?"#fff":T.text}) }}>{l}</button>
            ))}
          </div>
          <textarea value={base64Mode==="jwt"?jwtInput:base64Input}
            onChange={e=>base64Mode==="jwt"?setJwtInput(e.target.value):setBase64Input(e.target.value)}
            rows={4} placeholder={base64Mode==="encode"?"Text to encode...":base64Mode==="decode"?"Base64 to decode...":"JWT token..."}
            style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}/>
          <button onClick={()=>{
            if(base64Mode==="encode") setBase64Output(btoa(base64Input));
            else if(base64Mode==="decode") { try { setBase64Output(atob(base64Input)); } catch { setBase64Output("Invalid base64"); } }
            else if(base64Mode==="jwt") {
              try {
                const parts = jwtInput.split(".");
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                setBase64Output(JSON.stringify({header,payload},null,2));
              } catch { setBase64Output("Invalid JWT"); }
            }
          }} style={{ ...btn({background:T.accent,color:"#fff",fontWeight:700}) }}>▶ Process</button>
          {base64Output && (
            <textarea readOnly value={base64Output} rows={5} style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}/>
          )}
        </div>
      </Modal>

      {/* Color Picker */}
      <Modal open={activeModal==="color"} onClose={()=>setActiveModal(null)} title="🎨 Color Picker" width={400} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:14, alignItems:"center" }}>
          <input type="color" value={colorInput} onChange={e=>setColorInput(e.target.value)} style={{ width:120, height:120, border:"none", borderRadius:12, cursor:"pointer", background:"none" }}/>
          <input value={colorInput} onChange={e=>setColorInput(e.target.value)} style={{ ...inp, textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, letterSpacing:2, width:200 }}/>
          {colorInfo && (
            <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
              {[["HEX",colorInfo.hex],["RGB",colorInfo.rgb],["RGBA",colorInfo.rgba],["HSL",colorInfo.hsl]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:11, color:T.dim, fontWeight:700 }}>{l}</span>
                  <span style={{ fontSize:12, color:T.text, fontFamily:"'JetBrains Mono',monospace" }}>{v}</span>
                  <button onClick={()=>{navigator.clipboard?.writeText(v);notify("Copied!","success");}} style={{ ...btn({background:"none",color:T.dim,padding:"2px 8px",fontSize:11}) }}>📋</button>
                </div>
              ))}
              <div style={{ height:60, borderRadius:8, background:`linear-gradient(to right, #000, ${colorInfo.hex}, #fff)`, border:`1px solid ${T.border}` }}/>
            </div>
          )}
        </div>
      </Modal>

      {/* Diff Viewer */}
      <Modal open={activeModal==="diff"} onClose={()=>setActiveModal(null)} title="🔄 Diff Viewer" width={800} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>Original</div>
              <textarea value={diffOriginal} onChange={e=>setDiffOriginal(e.target.value)} rows={8}
                style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:T.dim, marginBottom:4 }}>Modified</div>
              <textarea value={diffModified} onChange={e=>setDiffModified(e.target.value)} rows={8}
                style={{ ...inp, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}/>
            </div>
          </div>
          {diffOriginal && diffModified && (
            <DiffEditor
              height={200}
              original={diffOriginal}
              modified={diffModified}
              theme={T.vs}
              options={{ readOnly:true, minimap:{enabled:false}, fontSize:12, renderSideBySide:true }}
            />
          )}
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>{if(activeTab){setDiffOriginal(activeTab.content);notify("Loaded current file as Original","info");}}} style={{ ...btn({background:T.tab,color:T.text}) }}>Load Current File as Original</button>
            <button onClick={()=>{setDiffOriginal("");setDiffModified("");}} style={{ ...btn({background:T.tab,color:T.dim}) }}>Clear</button>
          </div>
        </div>
      </Modal>

      {/* Code Stats */}
      <Modal open={activeModal==="stats"} onClose={()=>setActiveModal(null)} title="📊 Code Statistics" width={500} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {activeTab ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[
                  ["Lines", activeTab.content.split("\n").length, "#4ec9b0"],
                  ["Words", activeTab.content.trim().split(/\s+/).filter(Boolean).length, "#9cdcfe"],
                  ["Chars", activeTab.content.length, "#e5c07b"],
                  ["Blank Lines", activeTab.content.split("\n").filter(l=>!l.trim()).length, "#858585"],
                  ["Code Lines", activeTab.content.split("\n").filter(l=>l.trim()&&!l.trim().startsWith("//")&&!l.trim().startsWith("#")).length, "#ce9178"],
                  ["Comments", activeTab.content.split("\n").filter(l=>l.trim().startsWith("//")||l.trim().startsWith("#")).length, "#6a9955"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:T.bg, padding:14, borderRadius:8, border:`1px solid ${T.border}`, textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:T.dim, marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.bg, padding:12, borderRadius:8, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:11, color:T.dim, marginBottom:8 }}>FILE INFO</div>
                {[
                  ["File", activeTab.name],
                  ["Language", activeTab.language.toUpperCase()],
                  ["Size", `${(activeTab.content.length / 1024).toFixed(2)} KB`],
                  ["Avg line length", `${Math.round(activeTab.content.length / activeTab.content.split("\n").length)} chars`],
                  ["Longest line", `${Math.max(...activeTab.content.split("\n").map(l=>l.length))} chars`],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.dim }}>{k}</span>
                    <span style={{ color:T.text, fontFamily:"'JetBrains Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color:T.dim, textAlign:"center", padding:20 }}>Open a file to see stats</div>}
        </div>
      </Modal>

      {/* Snippet Manager */}
      <Modal open={snippetModal} onClose={()=>setSnippetModal(false)} title="🧩 Snippet Manager" width={600} T={T}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {Object.entries(SNIPPETS).map(([lang,snips])=>(
            <div key={lang}>
              <div style={{ fontSize:12, fontWeight:700, color:T.accent, marginBottom:6, textTransform:"uppercase" }}>
                {LANGUAGES[lang]?.icon} {lang}
              </div>
              {snips.map((s,i)=>(
                <div key={i} style={{ background:T.bg, padding:10, borderRadius:6, border:`1px solid ${T.border}`, marginBottom:6 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <code style={{ color:T.accent, fontSize:12, fontWeight:700 }}>{s.prefix}</code>
                    <span style={{ color:T.dim, fontSize:11 }}>{s.desc}</span>
                  </div>
                  <pre style={{ color:T.text, fontSize:11, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"pre-wrap", margin:0 }}>{s.body}</pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      {/* Keyboard Shortcuts */}
      <Modal open={keybindModal} onClose={()=>setKeybindModal(false)} title="⌨ All Keyboard Shortcuts" width={600} T={T}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {[
            ["Ctrl+Enter","Run code"],["Ctrl+I","AI Copilot"],["Ctrl+Shift+P","Command Palette"],
            ["Ctrl+F","Find"],["Ctrl+H","Find & Replace"],["Ctrl+G","Go to line"],
            ["Ctrl+Shift+O","Go to Symbol"],["Ctrl+/","Toggle comment"],["Ctrl+D","Select next occurrence"],
            ["Ctrl+Shift+K","Delete line"],["Alt+↑↓","Move line up/down"],["Ctrl+Shift+↑↓","Copy line"],
            ["Ctrl+B","Toggle sidebar"],["Ctrl+`","Toggle terminal"],["Ctrl+Shift+Z","Zen Mode"],
            ["Ctrl+\\","Split editor"],["Ctrl+W","Close tab"],["Ctrl+S","Save + Format"],
            ["Ctrl+N","New file"],["Shift+Alt+F","Format document"],["Ctrl+Space","IntelliSense"],
            ["Ctrl+Click","Multi-cursor"],["Alt+Click","Add cursor"],["Ctrl+A","Select all"],
            ["Ctrl+Z","Undo"],["Ctrl+Y","Redo"],["F2","Rename symbol"],
            ["F12","Go to definition"],["Shift+F12","Find references"],["Ctrl+Shift+F","Global search"],
          ].map(([k,d])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:T.bg, borderRadius:5, gap:6 }}>
              <code style={{ color:isDark?"#569cd6":"#0000ff", background:T.sb, padding:"2px 6px", borderRadius:3, fontSize:10, flexShrink:0 }}>{k}</code>
              <span style={{ color:T.dim, fontSize:11, textAlign:"right" }}>{d}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* ══ BOTTOM NAV (Mobile) ══ */}
      {!zenMode && (
        <div style={{ height:48, background:T.sb, borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", flexShrink:0 }}>
          {[
            { icon:"📂", label:"Files",    fn:()=>{setPanel("explorer");setSidebarOpen(v=>panel!=="explorer"?true:!v);} },
            { icon:"🔍", label:"Search",   fn:()=>{setPanel("search");setSidebarOpen(v=>panel!=="search"?true:!v);} },
            { icon:isRunning?"⟳":"▶", label:"Run",  fn:runCode, run:true },
            { icon:"🤖", label:"AI",       fn:()=>setRightPanel(p=>p==="copilot"?null:"copilot") },
            { icon:"⚡", label:"REST",     fn:()=>{setBottomPanel("rest");setTerminalOpen(true);} },
            { icon:"⚙️", label:"Settings", fn:()=>{setPanel("settings");setSidebarOpen(true);} },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn}
              disabled={btn.run&&(!activeTab||isRunning||!LC.piston)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 0", height:"100%", color:T.dim, opacity:btn.run&&(!activeTab||!LC.piston)?0.4:1, transition:"color .15s" }}>
              <span style={{ fontSize:btn.run?20:16 }} className={btn.run&&isRunning?"spin":""}>{btn.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:.5 }}>{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ STATUS BAR ══ */}
      <div style={{ height:22, background:T.status, display:"flex", alignItems:"center", padding:"0 12px", gap:12, fontSize:11, flexShrink:0, color:"rgba(255,255,255,0.9)", userSelect:"none" }}>
        <span>🌿 main</span>
        {activeTab && <>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:LANGUAGES[activeTab.language]?.color||"#888" }}/>
            {activeTab.language.toUpperCase()}
          </span>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{activeTab.content.split("\n").length} lines</span>
          {LC.piston && <span>⚡ {LC.piston} {LC.ver}</span>}
          {activeTab.modified && <span style={{ color:"#e5c07b" }}>● Modified</span>}
        </>}
        <span style={{ marginLeft:"auto", display:"flex", gap:10 }}>
          {autoSave && <span>💾 auto</span>}
          {vimMode && <span>⌨ VIM</span>}
          {zenMode && <span>🧘 zen</span>}
          <span>{themeName}</span>
          <span>Monaco</span>
          <span>UTF-8</span>
        </span>
      </div>
    </div>
  );
}
