import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

const PISTON_API = "https://emkc.org/api/v2/piston";

const LANG_CONFIG = {
  python:     { icon:"🐍", pistonLang:"python",      pistonVer:"3.10.0",  monacoLang:"python"     },
  c:          { icon:"⚙️", pistonLang:"c",           pistonVer:"10.2.0",  monacoLang:"c"          },
  cpp:        { icon:"⚙️", pistonLang:"c++",         pistonVer:"10.2.0",  monacoLang:"cpp"        },
  java:       { icon:"☕", pistonLang:"java",         pistonVer:"15.0.2",  monacoLang:"java"       },
  javascript: { icon:"🟨", pistonLang:"javascript",  pistonVer:"18.15.0", monacoLang:"javascript" },
  typescript: { icon:"🔷", pistonLang:"typescript",  pistonVer:"5.0.3",   monacoLang:"typescript" },
  rust:       { icon:"🦀", pistonLang:"rust",        pistonVer:"1.50.0",  monacoLang:"rust"       },
  golang:     { icon:"🐹", pistonLang:"go",          pistonVer:"1.16.2",  monacoLang:"go"         },
  php:        { icon:"🐘", pistonLang:"php",         pistonVer:"8.2.3",   monacoLang:"php"        },
  ruby:       { icon:"💎", pistonLang:"ruby",        pistonVer:"3.0.1",   monacoLang:"ruby"       },
  html:       { icon:"🌐", pistonLang:null,          pistonVer:null,      monacoLang:"html"       },
  css:        { icon:"🎨", pistonLang:null,          pistonVer:null,      monacoLang:"css"        },
  json:       { icon:"📋", pistonLang:null,          pistonVer:null,      monacoLang:"json"       },
  markdown:   { icon:"📝", pistonLang:null,          pistonVer:null,      monacoLang:"markdown"   },
  text:       { icon:"📄", pistonLang:null,          pistonVer:null,      monacoLang:"plaintext"  },
};

const LANG_MAP = {
  py:"python",c:"c",cpp:"cpp",h:"c",hpp:"cpp",java:"java",
  js:"javascript",ts:"typescript",html:"html",css:"css",
  txt:"text",json:"json",md:"markdown",rs:"rust",
  go:"golang",rb:"ruby",php:"php"
};

const VS_THEMES = ["vs-dark","vs-light","hc-black"];

const DEFAULT_FILES = [
  { id:1, name:"main.py", language:"python", content:`# 🐍 Python - CodeDroid Pro\nprint("Hello, World!")\n\nname = "Rupak"\nprint(f"Welcome to CodeDroid Pro, {name}! 🚀")\n\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)\n\nfor i in range(1, 8):\n    print(f"  {i}! = {factorial(i)}")\n\nclass Developer:\n    def __init__(self, name, lang):\n        self.name = name\n        self.lang = lang\n    def introduce(self):\n        return f"I am {self.name}, coding in {self.lang}!"\n\ndev = Developer(name, "Python")\nprint(dev.introduce())\n` },
  { id:2, name:"hello.c", language:"c", content:`#include <stdio.h>\n#include <string.h>\n\nlong long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    printf("Hello, World!\\n");\n    char name[] = "Rupak";\n    printf("Welcome, %s!\\n", name);\n    for (int i = 1; i <= 7; i++) {\n        printf("  %d! = %lld\\n", i, factorial(i));\n    }\n    return 0;\n}\n` },
  { id:3, name:"Main.java", language:"java", content:`public class Main {\n    static long factorial(int n) {\n        return n <= 1 ? 1 : n * factorial(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        System.out.println("Welcome, Rupak!");\n        for (int i = 1; i <= 7; i++) {\n            System.out.printf("  %d! = %d%n", i, factorial(i));\n        }\n    }\n}\n` },
  { id:4, name:"script.js", language:"javascript", content:`// 🟨 JavaScript\nconsole.log("Hello, World!");\n\nconst name = "Rupak";\nconsole.log(\`Welcome, \${name}!\`);\n\nconst factorial = n => n <= 1 ? 1 : n * factorial(n-1);\n\nfor (let i = 1; i <= 7; i++) {\n    console.log(\`  \${i}! = \${factorial(i)}\`);\n}\n\nclass Developer {\n    constructor(name, lang) {\n        this.name = name;\n        this.lang = lang;\n    }\n    introduce() {\n        return \`I am \${this.name}, coding in \${this.lang}!\`;\n    }\n}\nconsole.log(new Developer(name, "JavaScript").introduce());\n` },
  { id:5, name:"index.html", language:"html", content:`<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>CodeDroid Pro</title>\n    <style>\n        * { margin:0; padding:0; box-sizing:border-box; }\n        body {\n            font-family: 'Segoe UI', sans-serif;\n            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);\n            color: #fff; min-height: 100vh;\n            display: flex; align-items: center; justify-content: center;\n        }\n        .card {\n            background: rgba(255,255,255,0.05);\n            backdrop-filter: blur(20px);\n            border: 1px solid rgba(255,255,255,0.1);\n            border-radius: 20px; padding: 40px; text-align: center;\n        }\n        h1 { color: #89b4fa; font-size: 2rem; margin-bottom: 10px; }\n        p { color: #a6e3a1; }\n    </style>\n</head>\n<body>\n    <div class="card">\n        <h1>⚡ CodeDroid Pro</h1>\n        <p>Full VS Code on Android</p>\n    </div>\n</body>\n</html>\n` },
];

function getTemplate(lang, filename) {
  const cls = filename.replace(/\.\w+$/, "");
  return ({
    python: `# ${filename}\n\ndef main():\n    print("Hello!")\n\nif __name__ == "__main__":\n    main()\n`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}\n`,
    java: `public class ${cls} {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}\n`,
    javascript: `// ${filename}\nconsole.log("Hello!");\n`,
    typescript: `// ${filename}\nconst msg: string = "Hello!";\nconsole.log(msg);\n`,
    rust: `fn main() {\n    println!("Hello!");\n}\n`,
    golang: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello!")\n}\n`,
    html: `<!DOCTYPE html>\n<html>\n<head><title>${cls}</title></head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>\n`,
    css: `/* ${filename} */\nbody { margin: 0; }\n`,
    json: `{\n  "name": "${cls}",\n  "version": "1.0.0"\n}\n`,
    markdown: `# ${cls}\n\nWrite here...\n`,
  })[lang] || `// ${filename}\n`;
}

export default function App() {
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [openTabs, setOpenTabs] = useState([DEFAULT_FILES[0]]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [panel, setPanel] = useState("explorer");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalH, setTerminalH] = useState(200);
  const [vsTheme, setVsTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState("on");
  const [minimap, setMinimap] = useState(false);
  const [lineNumbers, setLineNumbers] = useState("on");
  const [logs, setLogs] = useState([
    { type:"system", text:"⚡ CodeDroid Pro — Real VS Code Engine" },
    { type:"system", text:"🚀 Monaco Editor + Piston Compiler + AI Copilot" },
    { type:"system", text:"💡 Ctrl+Enter = Run | Ctrl+I = Copilot | Ctrl+` = Terminal" },
    { type:"divider" }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([
    { role:"assistant", text:"Hi! I'm your AI Copilot 🤖\n\nPowered by Claude AI. I can:\n• Explain & debug your code\n• Generate functions & algorithms\n• Optimize for performance\n• Add documentation\n• Answer any coding question\n\nPress Ctrl+I anytime or ask me anything!" }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [cursorPos, setCursorPos] = useState({ line:1, col:1 });
  const [searchPanel, setSearchPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [extensions] = useState([
    { id:"prettier",  name:"Prettier",        icon:"✨", desc:"Code formatter",          enabled:true  },
    { id:"eslint",    name:"ESLint",           icon:"🔍", desc:"JS/TS Linter",            enabled:true  },
    { id:"python",    name:"Python",           icon:"🐍", desc:"Python language support", enabled:true  },
    { id:"java",      name:"Java",             icon:"☕", desc:"Java language support",   enabled:true  },
    { id:"cpp",       name:"C/C++",            icon:"⚙️", desc:"C/C++ support",          enabled:true  },
    { id:"gitlens",   name:"GitLens",          icon:"🌿", desc:"Git supercharged",        enabled:false },
    { id:"copilot",   name:"GitHub Copilot",   icon:"🤖", desc:"AI pair programmer",      enabled:true  },
    { id:"indent",    name:"indent-rainbow",   icon:"🌈", desc:"Colorize indentation",    enabled:true  },
    { id:"bracket",   name:"Bracket Pair",     icon:"🔵", desc:"Colorize brackets",       enabled:true  },
    { id:"thunder",   name:"Thunder Client",   icon:"⚡", desc:"REST API client",         enabled:false },
    { id:"docker",    name:"Docker",           icon:"🐳", desc:"Docker support",          enabled:false },
    { id:"rust",      name:"Rust Analyzer",    icon:"🦀", desc:"Rust language support",   enabled:true  },
  ]);

  const termRef = useRef(null);
  const copilotRef = useRef(null);

  const activeTab = openTabs.find(t => t.id === activeTabId) || null;
  const LC = LANG_CONFIG[activeTab?.language] || {};

  const updateContent = useCallback((content) => {
    setFiles(p => p.map(f => f.id === activeTabId ? { ...f, content } : f));
    setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, content } : t));
  }, [activeTabId]);

  const openFile = useCallback((file) => {
    setOpenTabs(p => p.find(t => t.id === file.id) ? p : [...p, file]);
    setActiveTabId(file.id);
  }, []);

  const closeTab = useCallback((e, tabId) => {
    e && e.stopPropagation();
    setOpenTabs(p => {
      const next = p.filter(t => t.id !== tabId);
      if (activeTabId === tabId) setActiveTabId(next.length ? next[next.length-1].id : null);
      return next;
    });
  }, [activeTabId]);

  const createFile = useCallback(() => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split(".").pop().toLowerCase();
    const lang = LANG_MAP[ext] || "text";
    const nf = { id: Date.now(), name: newFileName, language: lang, content: getTemplate(lang, newFileName) };
    setFiles(p => [...p, nf]);
    openFile(nf);
    setNewFileName(""); setShowNewFile(false);
  }, [newFileName, openFile]);

  const deleteFile = useCallback((e, fileId) => {
    e && e.stopPropagation();
    setFiles(p => p.filter(f => f.id !== fileId));
    closeTab(null, fileId);
  }, [closeTab]);

  const addLog = (type, text) => setLogs(p => [...p, { type, text }]);

  // REAL CODE EXECUTION via Piston API
  const runCode = useCallback(async () => {
    if (!activeTab || isRunning) return;
    const cfg = LANG_CONFIG[activeTab.language];
    if (!cfg?.pistonLang) {
      addLog("info", `ℹ️ ${activeTab.language.toUpperCase()} execution not supported. Open in browser for HTML/CSS.`);
      return;
    }
    setIsRunning(true); setTerminalOpen(true);
    addLog("cmd", `$ run ${activeTab.name}  [${new Date().toLocaleTimeString()}]`);
    addLog("info", `⟳ Compiling ${activeTab.language.toUpperCase()} via Piston API...`);
    try {
      const res = await fetch(`${PISTON_API}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: cfg.pistonLang,
          version: cfg.pistonVer,
          files: [{ name: activeTab.name, content: activeTab.content }],
          stdin: stdin || "",
          args: [],
          compile_timeout: 30000,
          run_timeout: 10000,
        })
      });
      const data = await res.json();
      const out = data.run?.output || data.compile?.output || "";
      const isErr = (data.run?.code !== 0) || (data.compile?.code !== 0) || data.message;
      if (data.message) {
        addLog("error", `✗ API Error: ${data.message}`);
      } else {
        if (data.compile?.output && data.compile.code !== 0) {
          addLog("error", `Compile Error:\n${data.compile.output}`);
        } else {
          addLog(isErr ? "error" : "output", out || "(no output)");
        }
      }
      addLog("system", `✓ Exited(${data.run?.code ?? data.compile?.code ?? 0}) · ${new Date().toLocaleTimeString()}`);
      addLog("divider", "");
    } catch (err) {
      addLog("error", `✗ Network error: ${err.message}`);
      addLog("divider", "");
    }
    setIsRunning(false);
  }, [activeTab, isRunning, stdin]);

  // AI COPILOT
  const askCopilot = useCallback(async () => {
    if (!copilotInput.trim() || copilotLoading) return;
    const userMsg = copilotInput.trim();
    setCopilotInput("");
    setCopilotMessages(p => [...p, { role:"user", text: userMsg }]);
    setCopilotLoading(true);
    try {
      const ctx = activeTab
        ? `Current file: ${activeTab.name} (${activeTab.language})\n\`\`\`${activeTab.language}\n${activeTab.content.slice(0, 2000)}\n\`\`\`\n\n`
        : "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are an expert coding AI Copilot inside CodeDroid Pro — a VS Code clone on Android. Be concise, practical. Use triple backticks for code blocks.",
          messages: [
            ...copilotMessages.slice(-6).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
            { role: "user", content: ctx + userMsg }
          ]
        })
      });
      const data = await res.json();
      setCopilotMessages(p => [...p, { role:"assistant", text: data.content?.[0]?.text || "Sorry, try again." }]);
    } catch {
      setCopilotMessages(p => [...p, { role:"assistant", text: "⚠️ Network error. Try again." }]);
    }
    setCopilotLoading(false);
  }, [copilotInput, copilotLoading, copilotMessages, activeTab]);

  // FIND & REPLACE using Monaco
  const doFind = () => {
    if (editorInstance) editorInstance.getAction("actions.find")?.run();
  };

  const doReplace = () => {
    if (editorInstance) editorInstance.getAction("editor.action.startFindReplaceAction")?.run();
  };

  const doFormat = () => {
    if (editorInstance) editorInstance.getAction("editor.action.formatDocument")?.run();
  };

  const doGotoLine = () => {
    if (editorInstance) editorInstance.getAction("editor.action.gotoLine")?.run();
  };

  // Monaco editor mount
  const handleEditorMount = (editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => setCopilotOpen(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => setTerminalOpen(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => setSidebarOpen(v => !v));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => closeTab(null, activeTabId));
  };

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (copilotRef.current) copilotRef.current.scrollTop = copilotRef.current.scrollHeight;
  }, [copilotMessages]);

  const filteredFiles = files.filter(f => !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase()));
  const isDark = vsTheme !== "vs-light";
  const BG = isDark ? "#1e1e1e" : "#ffffff";
  const SB = isDark ? "#252526" : "#f3f3f3";
  const BORDER = isDark ? "#333" : "#e0e0e0";
  const TEXT = isDark ? "#d4d4d4" : "#1f1f1f";
  const DIM = isDark ? "#858585" : "#717171";
  const ACCENT = "#007acc";
  const TAB = isDark ? "#2d2d2d" : "#ececec";
  const HOVER = isDark ? "#2a2d2e" : "#e8e8e8";
  const TERMINAL_BG = isDark ? "#141414" : "#f5f5f5";

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:BG, color:TEXT, overflow:"hidden", fontFamily:"'JetBrains Mono',Consolas,monospace", fontSize:13 }}
      onClick={() => contextMenu && setContextMenu(null)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:#404040;border-radius:3px}
        input,textarea,button,select{font-family:inherit}
        .hov:hover{background:${HOVER}!important}
        .nav-btn{border:none;cursor:pointer;background:none;padding:10px 6px;width:44px;text-align:center;font-size:20px;color:${DIM};border-left:2px solid transparent;transition:all .15s}
        .nav-btn:hover{color:${TEXT};background:${HOVER}}
        .nav-btn.active{color:${TEXT};border-left:2px solid ${ACCENT}}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite;display:inline-block}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.2s ease infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .15s ease}
        .tab-x{opacity:.3;transition:opacity .1s}.tab-x:hover{opacity:1;color:#f48771}
        .ctx-item:hover{background:${HOVER}}
        .ext-row{padding:10px;border-bottom:1px solid ${BORDER};display:flex;align-items:center;gap:10px}
        .run-btn:hover{background:#1177bb!important}.run-btn:active{transform:scale(.97)}
        .copilot-quick:hover{background:${HOVER};border-color:${ACCENT}!important}
      `}</style>

      {/* ══ TITLE BAR ══ */}
      <div style={{ height:38, background:SB, borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", padding:"0 10px", gap:8, flexShrink:0, userSelect:"none" }}>
        <span style={{ fontSize:20 }}>⚡</span>
        <span style={{ color:ACCENT, fontWeight:700, fontSize:14 }}>CodeDroid Pro</span>
        <div style={{ flex:1, textAlign:"center", fontSize:11, color:DIM, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {activeTab ? `${LC.icon||"📄"} ${activeTab.name}` : "Welcome to CodeDroid Pro"}
        </div>
        {/* Quick actions */}
        {[
          { icon:"🔍", tip:"Find (Ctrl+F)",    fn: doFind },
          { icon:"↔",  tip:"Replace (Ctrl+H)", fn: doReplace },
          { icon:"✨",  tip:"Format Document",  fn: doFormat },
          { icon:"→|", tip:"Go to Line",        fn: doGotoLine },
          { icon:"🤖", tip:"Copilot (Ctrl+I)", fn: () => setCopilotOpen(v=>!v) },
        ].map(({icon,tip,fn}) => (
          <button key={tip} onClick={fn} title={tip}
            style={{ background:"none", border:"none", color:DIM, cursor:"pointer", padding:"4px 6px", fontSize:14, borderRadius:4 }}
            className="hov">{icon}</button>
        ))}
        <button onClick={runCode} disabled={isRunning || !activeTab || !LC.pistonLang} className="run-btn"
          style={{ background:isRunning?"#094771":ACCENT, border:"none", color:"#fff", cursor:"pointer", padding:"5px 14px", borderRadius:5, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, opacity:(!activeTab||!LC.pistonLang)?0.4:1, flexShrink:0 }}>
          {isRunning ? <><span className="spin">⟳</span> Running</> : <>▶ Run</>}
        </button>
      </div>

      {/* ══ TAB BAR ══ */}
      <div style={{ display:"flex", background:SB, borderBottom:`1px solid ${BORDER}`, overflowX:"auto", flexShrink:0, height:35, scrollbarWidth:"none" }}>
        {openTabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="hov"
            style={{ display:"flex", alignItems:"center", gap:5, padding:"0 14px", cursor:"pointer", whiteSpace:"nowrap", fontSize:12, height:"100%", borderRight:`1px solid ${BORDER}`, flexShrink:0, minWidth:90,
              background: tab.id===activeTabId ? BG : TAB,
              color: tab.id===activeTabId ? TEXT : DIM,
              borderTop:`2px solid ${tab.id===activeTabId ? ACCENT : "transparent"}` }}>
            <span>{LANG_CONFIG[tab.language]?.icon||"📄"}</span>
            <span style={{ maxWidth:90, overflow:"hidden", textOverflow:"ellipsis" }}>{tab.name}</span>
            <span onClick={e=>closeTab(e,tab.id)} className="tab-x" style={{ marginLeft:2, cursor:"pointer", fontSize:16 }}>×</span>
          </div>
        ))}
        <button onClick={() => setShowNewFile(true)} style={{ padding:"0 14px", background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:22, flexShrink:0 }}>+</button>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── ACTIVITY BAR ── */}
        <div style={{ width:44, background:SB, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:4, flexShrink:0 }}>
          {[
            { id:"explorer",   icon:"⎇",  tip:"Explorer"   },
            { id:"search",     icon:"🔍", tip:"Search"      },
            { id:"extensions", icon:"⊞",  tip:"Extensions"  },
            { id:"settings",   icon:"⚙",  tip:"Settings"    },
          ].map(n => (
            <button key={n.id} title={n.tip} className={`nav-btn${panel===n.id&&sidebarOpen?" active":""}`}
              onClick={() => { if(panel===n.id){ setSidebarOpen(v=>!v); } else { setPanel(n.id); setSidebarOpen(true); } }}>
              {n.icon}
            </button>
          ))}
        </div>

        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <div className="fade-in" style={{ width:230, background:SB, borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

            {/* EXPLORER */}
            {panel==="explorer" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div style={{ padding:"10px 12px 4px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:1.5, textTransform:"uppercase" }}>Explorer</span>
                  <button onClick={() => setShowNewFile(v=>!v)} style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:18 }}>＋</button>
                </div>
                <div style={{ padding:"0 8px 6px", flexShrink:0 }}>
                  <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="🔍 Search files..."
                    style={{ width:"100%", background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"4px 8px", fontSize:11 }}/>
                </div>
                {showNewFile && (
                  <div className="fade-in" style={{ padding:"2px 8px 6px", display:"flex", gap:4, flexShrink:0 }}>
                    <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter")createFile(); if(e.key==="Escape")setShowNewFile(false); }}
                      placeholder="main.py, Main.java, app.go..."
                      style={{ flex:1, background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${ACCENT}`, color:TEXT, borderRadius:3, padding:"4px 7px", fontSize:11 }}/>
                    <button onClick={createFile} style={{ background:ACCENT, border:"none", color:"#fff", borderRadius:3, padding:"4px 8px", cursor:"pointer", fontSize:11 }}>✓</button>
                  </div>
                )}
                <div style={{ flex:1, overflowY:"auto" }}>
                  {filteredFiles.map(file => (
                    <div key={file.id} onClick={() => openFile(file)}
                      onContextMenu={e=>{ e.preventDefault(); setContextMenu({ x:e.clientX, y:e.clientY, file }); }}
                      className="hov"
                      style={{ display:"flex", alignItems:"center", padding:"5px 10px", gap:7, fontSize:12, cursor:"pointer",
                        color: activeTabId===file.id ? TEXT : DIM,
                        background: activeTabId===file.id ? (isDark?"#094771":"#cce5ff") : "transparent" }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{LANG_CONFIG[file.language]?.icon||"📄"}</span>
                      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                      <span onClick={e=>deleteFile(e,file.id)} className="tab-x" style={{ fontSize:14, cursor:"pointer", padding:"0 3px" }}>×</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"6px 12px", borderTop:`1px solid ${BORDER}`, fontSize:10, color:DIM, flexShrink:0 }}>
                  {files.length} files · Monaco Engine
                </div>
              </div>
            )}

            {/* SEARCH */}
            {panel==="search" && (
              <div style={{ padding:10, display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:1.5, textTransform:"uppercase" }}>Search</div>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search in files..."
                  style={{ width:"100%", background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"5px 8px", fontSize:11 }}/>
                <input value={replaceQuery} onChange={e=>setReplaceQuery(e.target.value)} placeholder="Replace..."
                  style={{ width:"100%", background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"5px 8px", fontSize:11 }}/>
                <button onClick={doFind} style={{ background:ACCENT, border:"none", color:"#fff", borderRadius:4, padding:"6px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  🔍 Find in Editor
                </button>
                {searchQuery && (
                  <div style={{ fontSize:11, color:DIM }}>
                    {files.filter(f => f.content.includes(searchQuery)).map(f => (
                      <div key={f.id} onClick={() => openFile(f)} className="hov"
                        style={{ padding:"4px 6px", cursor:"pointer", borderRadius:4, color:TEXT }}>
                        📄 {f.name} ({f.content.split(searchQuery).length - 1} matches)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXTENSIONS */}
            {panel==="extensions" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
                <div style={{ padding:"10px 12px 6px", flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Extensions</div>
                  <input placeholder="🔍 Search extensions..." style={{ width:"100%", background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"4px 8px", fontSize:11 }}/>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {extensions.map(ext => (
                    <div key={ext.id} className="ext-row">
                      <span style={{ fontSize:22, flexShrink:0 }}>{ext.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:TEXT }}>{ext.name}</div>
                        <div style={{ fontSize:10, color:DIM }}>{ext.desc}</div>
                      </div>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:ext.enabled?"#4ec9b0":"#555", flexShrink:0 }}/>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {panel==="settings" && (
              <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:1.5, textTransform:"uppercase" }}>Settings</div>

                <div>
                  <label style={{ fontSize:11, color:DIM, display:"block", marginBottom:5 }}>Color Theme</label>
                  <select value={vsTheme} onChange={e=>setVsTheme(e.target.value)}
                    style={{ width:"100%", background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"5px 8px", fontSize:12 }}>
                    <option value="vs-dark">Dark+ (default dark)</option>
                    <option value="vs-light">Light+ (default light)</option>
                    <option value="hc-black">High Contrast Black</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize:11, color:DIM, display:"block", marginBottom:5 }}>
                    Font Size: <span style={{ color:ACCENT }}>{fontSize}px</span>
                  </label>
                  <input type="range" min={10} max={22} value={fontSize} onChange={e=>setFontSize(+e.target.value)}
                    style={{ width:"100%", accentColor:ACCENT }}/>
                </div>

                {[
                  ["Word Wrap", wordWrap==="on", () => setWordWrap(v => v==="on"?"off":"on")],
                  ["Minimap",   minimap,         () => setMinimap(v => !v)],
                  ["Line Numbers", lineNumbers==="on", () => setLineNumbers(v => v==="on"?"off":"on")],
                ].map(([label, val, fn]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:TEXT }}>{label}</span>
                    <button onClick={fn} style={{ width:38, height:19, borderRadius:10, border:"none", cursor:"pointer", background:val?ACCENT:"#555", position:"relative", transition:"background .2s" }}>
                      <span style={{ position:"absolute", top:2, left:val?21:2, width:15, height:15, background:"#fff", borderRadius:"50%", transition:"left .2s" }}/>
                    </button>
                  </div>
                ))}

                <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>
                  <div style={{ fontSize:10, color:DIM, marginBottom:8, letterSpacing:1 }}>KEYBOARD SHORTCUTS</div>
                  {[
                    ["Ctrl+Enter","Run code"],
                    ["Ctrl+I","AI Copilot"],
                    ["Ctrl+F","Find"],
                    ["Ctrl+H","Find & Replace"],
                    ["Ctrl+G","Go to line"],
                    ["Ctrl+/","Toggle comment"],
                    ["Ctrl+D","Select next occurrence"],
                    ["Ctrl+Shift+K","Delete line"],
                    ["Alt+↑↓","Move line"],
                    ["Ctrl+B","Toggle sidebar"],
                    ["Ctrl+`","Toggle terminal"],
                    ["Ctrl+Shift+P","Command palette"],
                    ["Ctrl+W","Close tab"],
                    ["Shift+Alt+F","Format document"],
                  ].map(([k,d]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:5, gap:6 }}>
                      <code style={{ color:isDark?"#569cd6":"#0000ff", background:isDark?"#1a1a1a":"#f0f0f0", padding:"1px 4px", borderRadius:3, fontSize:9, flexShrink:0 }}>{k}</code>
                      <span style={{ color:DIM, textAlign:"right" }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR + TERMINAL ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>

          {/* Monaco Editor */}
          <div style={{ flex:1, overflow:"hidden" }}>
            {activeTab ? (
              <Editor
                key={activeTab.id}
                height="100%"
                language={LANG_CONFIG[activeTab.language]?.monacoLang || "plaintext"}
                value={activeTab.content}
                theme={vsTheme}
                onChange={val => updateContent(val || "")}
                onMount={handleEditorMount}
                options={{
                  fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  fontLigatures: true,
                  wordWrap,
                  minimap: { enabled: minimap },
                  lineNumbers,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  insertSpaces: true,
                  detectIndentation: true,
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  suggest: { enabled: true },
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  mouseWheelZoom: true,
                  renderWhitespace: "selection",
                  showFoldingControls: "always",
                  folding: true,
                  links: true,
                  colorDecorators: true,
                  renderLineHighlight: "all",
                  occurrencesHighlight: "multiFile",
                  selectionHighlight: true,
                  codeLens: true,
                  contextmenu: true,
                  multiCursorModifier: "ctrlCmd",
                  accessibilitySupport: "off",
                }}
              />
            ) : (
              <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:DIM, gap:14 }}>
                <span style={{ fontSize:64 }}>⚡</span>
                <div style={{ fontSize:24, fontWeight:700, color:DIM }}>CodeDroid Pro</div>
                <div style={{ fontSize:13, color:DIM, textAlign:"center", lineHeight:2, maxWidth:280 }}>
                  Real VS Code Engine · Monaco Editor<br/>
                  Python · C/C++ · Java · JS · TS · Rust · Go<br/>
                  Real Compiler · AI Copilot · IntelliSense
                </div>
                <button onClick={() => { setPanel("explorer"); setSidebarOpen(true); }}
                  style={{ marginTop:8, background:ACCENT, border:"none", color:"#fff", padding:"10px 24px", borderRadius:5, cursor:"pointer", fontSize:14, fontWeight:600 }}>
                  📂 Open Explorer
                </button>
              </div>
            )}
          </div>

          {/* ── TERMINAL ── */}
          <div style={{ background:TERMINAL_BG, borderTop:`1px solid ${BORDER}`, flexShrink:0, display:"flex", flexDirection:"column", height:terminalOpen?terminalH:32, transition:"height .2s ease", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 12px", height:32, cursor:"pointer", userSelect:"none", flexShrink:0, borderBottom:terminalOpen?`1px solid ${BORDER}`:"none" }}>
              <span onClick={() => setTerminalOpen(v=>!v)} style={{ flex:1, display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:13 }}>⬛</span>
                <span style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:1.2, textTransform:"uppercase" }}>Terminal</span>
                {LC.pistonLang && <span style={{ fontSize:10, color:DIM }}>· {LC.pistonLang} {LC.pistonVer}</span>}
                {isRunning && <span className="pulse" style={{ fontSize:9, color:ACCENT }}>● RUNNING</span>}
              </span>
              <button onClick={() => setShowStdin(v=>!v)} title="stdin input"
                style={{ background:"none", border:"none", color:showStdin?ACCENT:DIM, cursor:"pointer", fontSize:11, padding:"2px 5px" }}>⌨ stdin</button>
              <button onClick={() => setLogs([{type:"system",text:"🧹 Terminal cleared"},{type:"divider",text:""}])}
                style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:11 }} title="Clear">⌧</button>
              <button onClick={() => setTerminalH(h => Math.min(h+60,500))} style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:11 }}>⬆</button>
              <button onClick={() => setTerminalH(h => Math.max(h-60,80))} style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:11 }}>⬇</button>
              <span onClick={() => setTerminalOpen(v=>!v)} style={{ color:DIM, fontSize:11, cursor:"pointer" }}>{terminalOpen?"▼":"▲"}</span>
            </div>

            {terminalOpen && showStdin && (
              <div style={{ padding:"4px 12px", borderBottom:`1px solid ${BORDER}`, display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, color:DIM, flexShrink:0 }}>stdin:</span>
                <input value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="Input for program (if needed)..."
                  style={{ flex:1, background:isDark?"#2d2d2d":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:4, padding:"3px 8px", fontSize:11 }}/>
              </div>
            )}

            {terminalOpen && (
              <div ref={termRef} style={{ flex:1, overflowY:"auto", padding:"6px 14px 10px", fontSize:13, fontFamily:"'JetBrains Mono',Consolas,monospace" }}>
                {logs.map((log, i) =>
                  log.type==="divider"
                    ? <div key={i} style={{ borderTop:`1px solid ${BORDER}`, margin:"5px 0" }}/>
                    : <div key={i} style={{
                        color: log.type==="error"?"#f48771" : log.type==="cmd"?"#9cdcfe" : log.type==="info"?"#e5c07b" : log.type==="output"?TEXT : DIM,
                        whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7
                      }}>{log.text}</div>
                )}
                {isRunning && <span className="pulse" style={{ color:ACCENT, fontSize:16 }}>█</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── AI COPILOT PANEL ── */}
        {copilotOpen && (
          <div className="fade-in" style={{ width:300, background:SB, borderLeft:`1px solid ${BORDER}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT }}>🤖 AI Copilot</div>
                <div style={{ fontSize:10, color:DIM }}>Claude AI · Context-aware</div>
              </div>
              <button onClick={() => setCopilotOpen(false)} style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:20 }}>✕</button>
            </div>

            {/* Quick actions */}
            <div style={{ padding:"8px 10px", borderBottom:`1px solid ${BORDER}`, display:"flex", flexWrap:"wrap", gap:5, flexShrink:0 }}>
              {[
                ["💡 Explain", "Explain this code clearly"],
                ["🐛 Debug",   "Find and fix all bugs"],
                ["⚡ Optimize","Optimize for performance"],
                ["📝 Docs",    "Add documentation"],
                ["🧪 Tests",   "Generate unit tests"],
                ["🔄 Refactor","Refactor and improve code structure"],
              ].map(([label, prompt]) => (
                <button key={label} onClick={() => setCopilotInput(prompt)} className="copilot-quick"
                  style={{ background:"none", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:12, padding:"3px 10px", cursor:"pointer", fontSize:10 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={copilotRef} style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
              {copilotMessages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role==="user" ? "flex-end" : "flex-start",
                  background: msg.role==="user" ? ACCENT : isDark?"#2d2d2d":"#e8e8e8",
                  color: msg.role==="user" ? "#fff" : TEXT,
                  borderRadius: msg.role==="user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  padding:"9px 12px", maxWidth:"92%", fontSize:12, lineHeight:1.65,
                  whiteSpace:"pre-wrap", wordBreak:"break-word"
                }}>
                  {msg.text}
                </div>
              ))}
              {copilotLoading && (
                <div style={{ alignSelf:"flex-start", background:isDark?"#2d2d2d":"#e8e8e8", borderRadius:"14px 14px 14px 2px", padding:"10px 14px", fontSize:12, color:DIM }}>
                  <span className="pulse">● ● ●</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding:"8px 10px", borderTop:`1px solid ${BORDER}`, display:"flex", gap:7, flexShrink:0 }}>
              <textarea value={copilotInput} onChange={e=>setCopilotInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); askCopilot(); } }}
                placeholder="Ask anything... (Enter to send, Shift+Enter newline)"
                rows={2}
                style={{ flex:1, background:isDark?"#3c3c3c":"#e8e8e8", border:`1px solid ${BORDER}`, color:TEXT, borderRadius:7, padding:"7px 9px", fontSize:12, resize:"none", outline:"none" }}/>
              <button onClick={askCopilot} disabled={copilotLoading || !copilotInput.trim()}
                style={{ background:copilotLoading?"#555":ACCENT, border:"none", color:"#fff", borderRadius:7, padding:"0 12px", cursor:"pointer", fontSize:18, opacity:copilotInput.trim()?1:.4 }}>
                {copilotLoading ? <span className="spin" style={{ fontSize:15 }}>⟳</span> : "↑"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ CONTEXT MENU ══ */}
      {contextMenu && (
        <div style={{ position:"fixed", top:contextMenu.y, left:contextMenu.x, zIndex:999, background:SB, border:`1px solid ${BORDER}`, borderRadius:7, padding:"4px 0", minWidth:190, boxShadow:"0 10px 30px rgba(0,0,0,.5)" }}>
          {[
            ["📂 Open","opn"],["✏️ Rename","ren"],["─","div"],["🗑 Delete","del"]
          ].map(([l,a],i) => a==="div"
            ? <div key={i} style={{ borderTop:`1px solid ${BORDER}`, margin:"3px 0" }}/>
            : <div key={i} className="ctx-item"
                onClick={() => { setContextMenu(null); if(a==="del"&&contextMenu.file) deleteFile(null,contextMenu.file.id); if(a==="opn"&&contextMenu.file) openFile(contextMenu.file); }}
                style={{ padding:"6px 16px", cursor:"pointer", fontSize:12, color:TEXT }}>{l}</div>
          )}
        </div>
      )}

      {/* ══ BOTTOM NAV (mobile) ══ */}
      <div style={{ height:46, background:SB, borderTop:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-around", flexShrink:0 }}>
        {[
          { icon:"📂", label:"Files",    fn:()=>{ setPanel("explorer"); setSidebarOpen(v=>panel!=="explorer"?true:!v); } },
          { icon:"✏️", label:"Editor",   fn:()=>setSidebarOpen(false) },
          { icon:isRunning?"⟳":"▶", label:"Run", fn:runCode, run:true },
          { icon:"🤖", label:"Copilot",  fn:()=>setCopilotOpen(v=>!v) },
          { icon:"⚙️", label:"Settings", fn:()=>{ setPanel("settings"); setSidebarOpen(true); } },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn} disabled={btn.run&&(!activeTab||isRunning||!LC.pistonLang)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 0", height:"100%", color:DIM, opacity:btn.run&&(!activeTab||!LC.pistonLang)?0.4:1 }}>
            <span style={{ fontSize:btn.run?19:16 }} className={btn.run&&isRunning?"spin":""}>{btn.icon}</span>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:.5 }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* ══ STATUS BAR ══ */}
      <div style={{ height:22, background:ACCENT, display:"flex", alignItems:"center", padding:"0 12px", gap:14, fontSize:11, flexShrink:0, color:"rgba(255,255,255,0.9)" }}>
        {activeTab && <>
          <span>🌿 main</span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#4ec9b0" }}/>
            {activeTab.language.toUpperCase()}
          </span>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          {LC.pistonLang && <span>⚡ {LC.pistonLang} {LC.pistonVer}</span>}
        </>}
        <span style={{ marginLeft:"auto" }}>Monaco Editor · UTF-8 · {vsTheme}</span>
      </div>
    </div>
  );
}
