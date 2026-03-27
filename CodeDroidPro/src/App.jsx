
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";

const EXEC = "https://codedriod-production.up.railway.app";
const CLAUDE = "https://api.anthropic.com/v1/messages";

const LANGS = {
  python:    {icon:"🐍",run:"python",    ver:"3.10", monaco:"python",     color:"#3572A5",ext:"py"},
  c:         {icon:"⚙️",run:"c",         ver:"gcc",  monaco:"c",          color:"#555555",ext:"c"},
  cpp:       {icon:"⚙️",run:"cpp",       ver:"g++",  monaco:"cpp",        color:"#f34b7d",ext:"cpp"},
  java:      {icon:"☕",run:"java",       ver:"15",   monaco:"java",       color:"#b07219",ext:"java"},
  javascript:{icon:"🟨",run:"javascript",ver:"18",   monaco:"javascript", color:"#f1e05a",ext:"js"},
  typescript:{icon:"🔷",run:"typescript",ver:"5",    monaco:"typescript", color:"#2b7489",ext:"ts"},
  rust:      {icon:"🦀",run:"rust",      ver:"1.50", monaco:"rust",       color:"#dea584",ext:"rs"},
  golang:    {icon:"🐹",run:"golang",    ver:"1.16", monaco:"go",         color:"#00ADD8",ext:"go"},
  php:       {icon:"🐘",run:"php",       ver:"8.2",  monaco:"php",        color:"#4F5D95",ext:"php"},
  ruby:      {icon:"💎",run:"ruby",      ver:"3.0",  monaco:"ruby",       color:"#701516",ext:"rb"},
  kotlin:    {icon:"🎯",run:"kotlin",    ver:"1.8",  monaco:"kotlin",     color:"#A97BFF",ext:"kt"},
  bash:      {icon:"💻",run:"bash",      ver:"5.2",  monaco:"shell",      color:"#89e051",ext:"sh"},
  lua:       {icon:"🌙",run:"lua",       ver:"5.4",  monaco:"lua",        color:"#000080",ext:"lua"},
  r:         {icon:"📊",run:"r",         ver:"4.1",  monaco:"r",          color:"#198CE7",ext:"r"},
  swift:     {icon:"🍎",run:"swift",     ver:"5.3",  monaco:"swift",      color:"#F05138",ext:"swift"},
  html:      {icon:"🌐",run:null,        ver:null,   monaco:"html",       color:"#e34c26",ext:"html"},
  css:       {icon:"🎨",run:null,        ver:null,   monaco:"css",        color:"#563d7c",ext:"css"},
  json:      {icon:"📋",run:null,        ver:null,   monaco:"json",       color:"#292929",ext:"json"},
  markdown:  {icon:"📝",run:null,        ver:null,   monaco:"markdown",   color:"#083fa1",ext:"md"},
  sql:       {icon:"🗄️",run:"sqlite3",  ver:"3.36", monaco:"sql",        color:"#e38c00",ext:"sql"},
};

const LANG_EXT = {py:"python",c:"c",cpp:"cpp",h:"c",hpp:"cpp",java:"java",js:"javascript",ts:"typescript",html:"html",css:"css",txt:"text",json:"json",md:"markdown",rs:"rust",go:"golang",rb:"ruby",php:"php",kt:"kotlin",sh:"bash",lua:"lua",r:"r",swift:"swift",sql:"sql"};

const THEMES = {
  "VS Dark":      {vs:"vs-dark", bg:"#1e1e1e",sb:"#252526",border:"#333",text:"#d4d4d4",dim:"#858585",accent:"#007acc",tab:"#2d2d2d",term:"#141414",status:"#007acc",hover:"#2a2d2e"},
  "VS Light":     {vs:"vs-light",bg:"#ffffff",sb:"#f3f3f3",border:"#e0e0e0",text:"#1f1f1f",dim:"#717171",accent:"#005fb8",tab:"#ececec",term:"#f5f5f5",status:"#005fb8",hover:"#e8e8e8"},
  "Monokai":      {vs:"vs-dark", bg:"#272822",sb:"#1e1f1c",border:"#1a1a17",text:"#f8f8f2",dim:"#75715e",accent:"#a6e22e",tab:"#3e3d32",term:"#1a1b18",status:"#75715e",hover:"#3e3d32"},
  "Dracula":      {vs:"vs-dark", bg:"#282a36",sb:"#21222c",border:"#191a21",text:"#f8f8f2",dim:"#6272a4",accent:"#bd93f9",tab:"#343746",term:"#1e1f29",status:"#bd93f9",hover:"#343746"},
  "One Dark":     {vs:"vs-dark", bg:"#282c34",sb:"#21252b",border:"#181a1f",text:"#abb2bf",dim:"#5c6370",accent:"#61afef",tab:"#2c313a",term:"#1d2026",status:"#61afef",hover:"#2c313a"},
  "Nord":         {vs:"vs-dark", bg:"#2e3440",sb:"#272c36",border:"#222730",text:"#d8dee9",dim:"#4c566a",accent:"#88c0d0",tab:"#3b4252",term:"#242933",status:"#5e81ac",hover:"#3b4252"},
  "Tokyo Night":  {vs:"vs-dark", bg:"#1a1b2e",sb:"#16161e",border:"#101014",text:"#c0caf5",dim:"#565f89",accent:"#7aa2f7",tab:"#1f2335",term:"#13131d",status:"#7aa2f7",hover:"#1f2335"},
  "Catppuccin":   {vs:"vs-dark", bg:"#1e1e2e",sb:"#181825",border:"#11111b",text:"#cdd6f4",dim:"#585b70",accent:"#cba6f7",tab:"#1e1e2e",term:"#181825",status:"#cba6f7",hover:"#313244"},
  "Gruvbox":      {vs:"vs-dark", bg:"#282828",sb:"#1d2021",border:"#1d2021",text:"#ebdbb2",dim:"#928374",accent:"#b8bb26",tab:"#3c3836",term:"#1d2021",status:"#b8bb26",hover:"#3c3836"},
  "Solarized":    {vs:"vs-dark", bg:"#002b36",sb:"#073642",border:"#004052",text:"#839496",dim:"#586e75",accent:"#268bd2",tab:"#073642",term:"#002b36",status:"#268bd2",hover:"#073642"},
  "High Contrast":{vs:"hc-black",bg:"#000000",sb:"#0d0d0d",border:"#6fc3df",text:"#ffffff",dim:"#aaaaaa",accent:"#6fc3df",tab:"#0d0d0d",term:"#000000",status:"#6fc3df",hover:"#111"},
  "GitHub Dark":  {vs:"vs-dark", bg:"#0d1117",sb:"#161b22",border:"#21262d",text:"#c9d1d9",dim:"#8b949e",accent:"#58a6ff",tab:"#161b22",term:"#0d1117",status:"#238636",hover:"#21262d"},
};

const SNIPPETS = {
  python:[
    {p:"def",  b:"def ${1:name}(${2:args}):\n    ${3:pass}",d:"Function"},
    {p:"class",b:"class ${1:Name}:\n    def __init__(self):\n        ${2:pass}",d:"Class"},
    {p:"if",   b:"if ${1:condition}:\n    ${2:pass}",d:"If"},
    {p:"for",  b:"for ${1:i} in range(${2:10}):\n    ${3:pass}",d:"For loop"},
    {p:"while",b:"while ${1:condition}:\n    ${2:pass}",d:"While"},
    {p:"try",  b:"try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:print(e)}",d:"Try/except"},
    {p:"with", b:"with open('${1:file}', '${2:r}') as f:\n    ${3:data = f.read()}",d:"With open"},
    {p:"list", b:"[${1:x} for ${1:x} in ${2:iterable}]",d:"List comprehension"},
    {p:"dict", b:"{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:items}}",d:"Dict comprehension"},
    {p:"lam",  b:"lambda ${1:x}: ${2:x}",d:"Lambda"},
    {p:"main", b:'if __name__ == "__main__":\n    ${1:main()}',d:"Main guard"},
    {p:"imp",  b:"import ${1:module}",d:"Import"},
    {p:"from", b:"from ${1:module} import ${2:name}",d:"From import"},
    {p:"dc",   b:'"""${1:docstring}"""',d:"Docstring"},
    {p:"pr",   b:"print(${1:value})",d:"Print"},
  ],
  javascript:[
    {p:"fn",   b:"const ${1:name} = (${2:args}) => {\n    ${3}\n};",d:"Arrow function"},
    {p:"afn",  b:"const ${1:name} = async (${2:args}) => {\n    ${3}\n};",d:"Async arrow"},
    {p:"cl",   b:"class ${1:Name} {\n    constructor(${2}) {\n        ${3}\n    }\n}",d:"Class"},
    {p:"if",   b:"if (${1:condition}) {\n    ${2}\n}",d:"If"},
    {p:"for",  b:"for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}",d:"For loop"},
    {p:"fof",  b:"for (const ${1:item} of ${2:items}) {\n    ${3}\n}",d:"For...of"},
    {p:"try",  b:"try {\n    ${1}\n} catch (${2:err}) {\n    console.error(${2:err});\n}",d:"Try/catch"},
    {p:"imp",  b:"import ${1:module} from '${2:path}';",d:"Import"},
    {p:"exp",  b:"export default ${1:name};",d:"Export default"},
    {p:"pr",   b:"console.log(${1:value});",d:"Console.log"},
    {p:"fe",   b:"fetch('${1:url}')\n    .then(r => r.json())\n    .then(data => ${2:console.log(data)})\n    .catch(err => console.error(err));",d:"Fetch"},
    {p:"us",   b:"const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:null});",d:"useState"},
    {p:"ue",   b:"useEffect(() => {\n    ${1}\n}, [${2}]);",d:"useEffect"},
    {p:"pro",  b:"new Promise((resolve, reject) => {\n    ${1}\n});",d:"Promise"},
  ],
  java:[
    {p:"main", b:"public static void main(String[] args) {\n    ${1}\n}",d:"Main method"},
    {p:"sout", b:"System.out.println(${1});",d:"Print"},
    {p:"for",  b:"for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}",d:"For loop"},
    {p:"fore", b:"for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4}\n}",d:"Enhanced for"},
    {p:"cls",  b:"public class ${1:Name} {\n    ${2}\n}",d:"Class"},
    {p:"if",   b:"if (${1:condition}) {\n    ${2}\n}",d:"If"},
    {p:"try",  b:"try {\n    ${1}\n} catch (${2:Exception} e) {\n    e.printStackTrace();\n}",d:"Try/catch"},
    {p:"intf", b:"public interface ${1:Name} {\n    ${2}\n}",d:"Interface"},
    {p:"arr",  b:"${1:int}[] ${2:arr} = new ${1:int}[${3:10}];",d:"Array"},
    {p:"al",   b:"ArrayList<${1:Type}> ${2:list} = new ArrayList<>();",d:"ArrayList"},
  ],
  cpp:[
    {p:"main", b:"int main() {\n    ${1}\n    return 0;\n}",d:"Main"},
    {p:"cls",  b:"class ${1:Name} {\npublic:\n    ${1:Name}() {}\n    ${2}\n};",d:"Class"},
    {p:"for",  b:"for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}",d:"For loop"},
    {p:"rfor", b:"for (auto& ${1:x} : ${2:vec}) {\n    ${3}\n}",d:"Range for"},
    {p:"vec",  b:"vector<${1:int}> ${2:v};",d:"Vector"},
    {p:"pr",   b:'cout << ${1:value} << endl;',d:"Cout"},
    {p:"inc",  b:"#include <${1:iostream}>",d:"Include"},
  ],
};

const DEFAULT_FILES = [
  {id:1,name:"main.py",lang:"python",content:'# 🐍 Python — CodeDroid Pro\nprint("Hello, World!")\n\nname = "Developer"\nprint(f"Welcome, {name}! 🚀")\n\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n    print()\n\nfibonacci(10)\n\nclass Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x): self.items.append(x)\n    def pop(self): return self.items.pop() if self.items else None\n    def peek(self): return self.items[-1] if self.items else None\n    def __len__(self): return len(self.items)\n\ns = Stack()\nfor i in range(5): s.push(i * i)\nprint("Stack:", [s.pop() for _ in range(len(s))])\n'},
  {id:2,name:"hello.c",lang:"c",content:'#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n    int data;\n    struct Node* next;\n} Node;\n\nNode* newNode(int d) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->data = d; n->next = NULL;\n    return n;\n}\n\nvoid printList(Node* h) {\n    while(h) { printf("%d -> ", h->data); h = h->next; }\n    printf("NULL\\n");\n}\n\nint main() {\n    printf("Hello, World!\\n");\n    Node *head = newNode(1);\n    head->next = newNode(2);\n    head->next->next = newNode(3);\n    printList(head);\n    return 0;\n}\n'},
  {id:3,name:"Main.java",lang:"java",content:'import java.util.*;\nimport java.util.stream.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        List<Integer> nums = IntStream.rangeClosed(1, 10)\n            .boxed().collect(Collectors.toList());\n        \n        System.out.println("Numbers: " + nums);\n        \n        int sum = nums.stream().mapToInt(Integer::intValue).sum();\n        System.out.println("Sum: " + sum);\n        \n        List<Integer> evens = nums.stream()\n            .filter(n -> n % 2 == 0)\n            .collect(Collectors.toList());\n        System.out.println("Evens: " + evens);\n    }\n}\n'},
  {id:4,name:"script.js",lang:"javascript",content:'// 🟨 JavaScript — Modern\nconst greet = name => `Hello, ${name}! 🚀`;\nconsole.log(greet("World"));\n\n// Async/Await\nconst delay = ms => new Promise(r => setTimeout(r, ms));\n\nasync function main() {\n    const nums = Array.from({length:10}, (_,i) => i+1);\n    console.log("Numbers:", nums);\n    \n    const doubled = nums.map(x => x * 2);\n    console.log("Doubled:", doubled);\n    \n    const sum = nums.reduce((a, b) => a + b, 0);\n    console.log("Sum:", sum);\n    \n    // Destructuring\n    const [first, second, ...rest] = nums;\n    console.log(`First: ${first}, Second: ${second}, Rest: [${rest}]`);\n}\n\nmain();\n'},
  {id:5,name:"index.html",lang:"html",content:'<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>CodeDroid Pro</title>\n    <style>\n        * { margin:0; padding:0; box-sizing:border-box; }\n        body {\n            font-family: "Segoe UI", sans-serif;\n            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);\n            color: #fff; min-height: 100vh;\n            display: flex; align-items: center; justify-content: center;\n        }\n        .card {\n            background: rgba(255,255,255,0.05);\n            backdrop-filter: blur(20px);\n            border: 1px solid rgba(255,255,255,0.1);\n            border-radius: 20px; padding: 40px; text-align: center;\n            animation: float 3s ease-in-out infinite;\n            max-width: 400px;\n        }\n        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }\n        h1 { color: #89b4fa; font-size: 2rem; margin-bottom:10px; }\n        p { color: #a6e3a1; margin-bottom:8px; }\n        .badge { display:inline-block; background:#007acc; color:white;\n                 padding:4px 14px; border-radius:20px; font-size:.8rem; margin-top:10px; }\n    </style>\n</head>\n<body>\n    <div class="card">\n        <h1>⚡ CodeDroid Pro</h1>\n        <p>Full VS Code on Android</p>\n        <p>Monaco + AI + Real Compiler</p>\n        <span class="badge">Production Ready</span>\n    </div>\n</body>\n</html>\n'},
  {id:6,name:"app.go",lang:"golang",content:'package main\n\nimport (\n\t"fmt"\n\t"math"\n\t"sort"\n)\n\nfunc sieve(n int) []int {\n\tisComposite := make([]bool, n+1)\n\tvar primes []int\n\tfor i := 2; i <= n; i++ {\n\t\tif !isComposite[i] {\n\t\t\tprimes = append(primes, i)\n\t\t\tfor j := i * i; j <= n; j += i {\n\t\t\t\tisComposite[j] = true\n\t\t\t}\n\t\t}\n\t}\n\treturn primes\n}\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n\tprimes := sieve(50)\n\tfmt.Println("Primes <= 50:", primes)\n\t\n\tnums := []float64{3, 1, 4, 1, 5, 9, 2, 6}\n\tsort.Float64s(nums)\n\tvar sum float64\n\tfor _, v := range nums { sum += v }\n\tmean := sum / float64(len(nums))\n\tfmt.Printf("Sorted: %v\\nMean: %.2f\\n", nums, mean)\n\t_ = math.Pi\n}\n'},
  {id:7,name:"main.rs",lang:"rust",content:'use std::collections::HashMap;\n\nfn fibonacci(n: u64) -> u64 {\n    match n {\n        0 => 0,\n        1 => 1,\n        _ => fibonacci(n-1) + fibonacci(n-2),\n    }\n}\n\nfn main() {\n    println!("Hello, World! 🦀");\n    \n    let fibs: Vec<u64> = (0..10).map(fibonacci).collect();\n    println!("Fibonacci: {:?}", fibs);\n    \n    let mut scores: HashMap<&str, i32> = HashMap::new();\n    scores.insert("Alice", 95);\n    scores.insert("Bob", 87);\n    scores.insert("Charlie", 92);\n    \n    for (name, score) in &scores {\n        println!("{}: {}", name, score);\n    }\n    \n    let max = scores.values().max().unwrap();\n    println!("Top score: {}", max);\n}\n'},
  {id:8,name:"style.css",lang:"css",content:':root {\n    --primary: #007acc;\n    --bg: #1e1e1e;\n    --surface: #252526;\n    --text: #d4d4d4;\n    --accent: #4ec9b0;\n    --danger: #f48771;\n    --success: #4ec9b0;\n    --warning: #e5c07b;\n}\n\n* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n    font-family: "JetBrains Mono", monospace;\n    background: var(--bg);\n    color: var(--text);\n    line-height: 1.6;\n}\n\n.btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 8px;\n    padding: 10px 20px;\n    background: var(--primary);\n    color: white;\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 14px;\n    transition: all 0.2s ease;\n}\n\n.btn:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 4px 12px rgba(0,122,204,0.4);\n}\n\n.card {\n    background: var(--surface);\n    border: 1px solid rgba(255,255,255,0.1);\n    border-radius: 12px;\n    padding: 24px;\n    transition: transform 0.2s;\n}\n\n.card:hover { transform: translateY(-4px); }\n'},
  {id:9,name:"data.json",lang:"json",content:'{\n  "app": "CodeDroid Pro",\n  "version": "2.0.0",\n  "description": "Full VS Code on Android",\n  "features": [\n    "Monaco Editor",\n    "Real Compiler (Railway)",\n    "AI Copilot (Claude)",\n    "AI Agent Mode",\n    "Voice Coding",\n    "12 Themes",\n    "WebSocket Terminal",\n    "GitHub Integration",\n    "Package Manager",\n    "20+ Languages"\n  ],\n  "server": "https://codedriod-production.up.railway.app",\n  "author": "Rupak",\n  "license": "MIT"\n}\n'},
  {id:10,name:"README.md",lang:"markdown",content:'# ⚡ CodeDroid Pro v2.0\n\n> **Full VS Code on Android** — Monaco + Claude AI + Real Compiler\n\n## 🚀 Features\n\n| Feature | Status |\n|---------|--------|\n| Monaco Editor | ✅ |\n| Real Compiler (20+ langs) | ✅ |\n| AI Copilot (Claude) | ✅ |\n| AI Agent Mode | ✅ |\n| Voice Coding | ✅ |\n| WebSocket Terminal | ✅ |\n| GitHub Integration | ✅ |\n| Package Manager | ✅ |\n| REST Client | ✅ |\n| 12 Themes | ✅ |\n\n## ⌨️ Shortcuts\n\n| Key | Action |\n|-----|--------|\n| `Ctrl+Enter` | Run code |\n| `Ctrl+I` | AI Copilot |\n| `Ctrl+Shift+P` | Command Palette |\n| `Ctrl+Shift+A` | AI Agent Mode |\n| `Ctrl+Shift+V` | Voice Coding |\n| `Ctrl+T` | New Terminal Tab |\n| `Ctrl+\\\\` | Split Editor |\n| `Ctrl+Shift+G` | GitHub Panel |\n\n## 📦 Setup\n\n1. Settings → Add Anthropic API Key\n2. Settings → Add GitHub Token\n3. Run any file with ▶ button\n'},
];

function getTemplate(lang, name) {
  const cls = name.replace(/\.\w+$/,'');
  return ({
    python:`# ${name}\n\ndef main():\n    print("Hello!")\n\nif __name__ == "__main__":\n    main()\n`,
    c:`#include <stdio.h>\n\nint main() {\n    printf("Hello!\\n");\n    return 0;\n}\n`,
    cpp:`#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello!" << endl;\n    return 0;\n}\n`,
    java:`public class ${cls} {\n    public static void main(String[] args) {\n        System.out.println("Hello!");\n    }\n}\n`,
    javascript:`// ${name}\nconsole.log("Hello!");\n`,
    typescript:`// ${name}\nconst msg: string = "Hello!";\nconsole.log(msg);\n`,
    rust:`fn main() {\n    println!("Hello!");\n}\n`,
    golang:`package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello!")\n}\n`,
    kotlin:`fun main() {\n    println("Hello!")\n}\n`,
    bash:`#!/bin/bash\necho "Hello!"\n`,
    html:`<!DOCTYPE html>\n<html>\n<head><title>${cls}</title></head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>\n`,
    css:`/* ${name} */\nbody { margin: 0; }\n`,
    json:`{\n  "name": "${cls}",\n  "version": "1.0.0"\n}\n`,
    markdown:`# ${cls}\n\nWrite here...\n`,
    lua:`print("Hello!")\n`,
    r:`cat("Hello!\n")\n`,
    ruby:`puts "Hello!"\n`,
    php:`<?php\necho "Hello!";\n`,
    sql:`SELECT 'Hello, World!' AS greeting;\n`,
    swift:`print("Hello!")\n`,
  })[lang] || `// ${name}\n`;
}

// ─── Storage helpers ────────────────────────────────────────────
const LS = {
  get:(k,d=null)=>{ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
  str:(k,d='')=>{ try{return localStorage.getItem(k)||d;}catch{return d;} },
  setStr:(k,v)=>{ try{localStorage.setItem(k,v);}catch{} },
};

// ─── Modal component ────────────────────────────────────────────
function Modal({open,onClose,title,children,w=600,T}) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:12}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:T.sb,border:`1px solid ${T.border}`,borderRadius:10,width:'100%',maxWidth:w,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 25px 80px rgba(0,0,0,.6)'}}>
        <div style={{padding:'13px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:14,color:T.text}}>{title}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:14}}>{children}</div>
      </div>
    </div>
  );
}

function Toggle({val,onChange,T}) {
  return (
    <button onClick={()=>onChange(!val)}
      style={{width:40,height:20,borderRadius:10,border:'none',cursor:'pointer',background:val?T.accent:'#555',position:'relative',transition:'background .2s',flexShrink:0}}>
      <span style={{position:'absolute',top:2,left:val?22:2,width:16,height:16,background:'#fff',borderRadius:'50%',transition:'left .2s'}}/>
    </button>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  // Files & Tabs
  const [files, setFiles]             = useState(()=>LS.get('cdr_files',DEFAULT_FILES));
  const [openTabs, setOpenTabs]       = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [splitTabId, setSplitTabId]   = useState(null);
  const [splitMode, setSplitMode]     = useState(false);

  // UI Layout
  const [panel, setPanel]             = useState('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarW, setSidebarW]       = useState(240);
  const [rightPanel, setRightPanel]   = useState(null);
  const [rightPanelW, setRightPanelW] = useState(320);
  const [bottomPanel, setBottomPanel] = useState('terminal');
  const [termOpen, setTermOpen]       = useState(true);
  const [termH, setTermH]             = useState(200);
  const [zenMode, setZenMode]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [diffMode, setDiffMode]       = useState(false);

  // Editor settings
  const [themeName, setThemeName]     = useState(()=>LS.str('cdr_theme','VS Dark'));
  const [fontSize, setFontSize]       = useState(()=>LS.get('cdr_fontsize',14));
  const [tabSize, setTabSize]         = useState(4);
  const [wordWrap, setWordWrap]       = useState('on');
  const [minimap, setMinimap]         = useState(false);
  const [lineNums, setLineNums]       = useState('on');
  const [autoSave, setAutoSave]       = useState(true);
  const [formatOnSave, setFormatOnSave] = useState(false);
  const [stickyScroll, setStickyScroll] = useState(true);
  const [vimMode, setVimMode]         = useState(false);
  const [renderWS, setRenderWS]       = useState('selection');
  const [breadcrumbs, setBreadcrumbs] = useState(true);
  const [ligatures, setLigatures]     = useState(true);

  // API Keys
  const [apiKey, setApiKey]           = useState(()=>LS.str('cdr_apikey',''));
  const [ghToken, setGhToken]         = useState(()=>LS.str('cdr_ghtoken',''));
  const [showApiKey, setShowApiKey]   = useState(false);
  const [showGhToken, setShowGhToken] = useState(false);

  // Execution
  const [logs, setLogs]               = useState([
    {t:'sys',s:'⚡ CodeDroid Pro v2.0 — Ultimate Android IDE'},
    {t:'sys',s:'🚀 Monaco · Railway Compiler · Claude AI · 20 Languages'},
    {t:'sys',s:'💡 Ctrl+Enter=Run | Ctrl+I=AI | Ctrl+Shift+P=Commands | Ctrl+Shift+A=Agent'},
    {t:'div',s:''},
  ]);
  const [isRunning, setIsRunning]     = useState(false);
  const [stdin, setStdin]             = useState('');
  const [showStdin, setShowStdin]     = useState(false);
  const [execStats, setExecStats]     = useState(null);

  // Terminal tabs
  const [termTabs, setTermTabs]       = useState([{id:1,name:'bash',logs:[],input:''}]);
  const [activeTermTab, setActiveTermTab] = useState(1);
  const [termInput, setTermInput]     = useState('');
  const [termHistory, setTermHistory] = useState([]);
  const [termHistIdx, setTermHistIdx] = useState(-1);
  const wsRef                         = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // AI Copilot
  const [copilotMsgs, setCopilotMsgs] = useState([{role:'ai',text:'Hi! 🤖 AI Copilot ready!\n\nI can see your current file in real-time.\n\n• 💡 Explain & debug\n• ⚡ Optimize code\n• 🧪 Generate tests\n• 📝 Write docs\n• 🔄 Refactor\n• 🐛 Fix bugs\n• 🚀 Generate features\n\nJust ask, or use quick buttons below!'}]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  // AI Agent Mode
  const [agentOpen, setAgentOpen]     = useState(false);
  const [agentTask, setAgentTask]     = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs]     = useState([]);
  const [agentMaxSteps, setAgentMaxSteps] = useState(5);

  // Voice coding
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef                = useRef(null);

  // File ops
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [fileSearch, setFileSearch]   = useState('');
  const [bookmarks, setBookmarks]     = useState({});

  // Global search/replace
  const [gSearch, setGSearch]         = useState('');
  const [gReplace, setGReplace]       = useState('');

  // REST Client
  const [restMethod, setRestMethod]   = useState('GET');
  const [restUrl, setRestUrl]         = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [restHeaders, setRestHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [restBody, setRestBody]       = useState('');
  const [restResponse, setRestResponse] = useState(null);
  const [restLoading, setRestLoading] = useState(false);
  const [restHistory, setRestHistory] = useState([]);
  const [restTab, setRestTab]         = useState('headers');

  // Tools
  const [regexPat, setRegexPat]       = useState('\\d+');
  const [regexFlags, setRegexFlags]   = useState('g');
  const [regexInput, setRegexInput]   = useState('Hello 123 World 456 test 789');
  const [jsonInput, setJsonInput]     = useState('{"name":"Rupak","skills":["Python","C","Java"]}');
  const [b64Input, setB64Input]       = useState('');
  const [b64Out, setB64Out]           = useState('');
  const [b64Mode, setB64Mode]         = useState('encode');
  const [colorVal, setColorVal]       = useState('#007acc');
  const [diffOrig, setDiffOrig]       = useState('');
  const [diffMod, setDiffMod]         = useState('');
  const [pkgLang, setPkgLang]         = useState('python');
  const [pkgInput, setPkgInput]       = useState('');
  const [pkgLog, setPkgLog]           = useState('');
  const [pkgLoading, setPkgLoading]   = useState(false);
  const [sysInfo, setSysInfo]         = useState(null);

  // GitHub
  const [ghOp, setGhOp]               = useState('status');
  const [ghCwd, setGhCwd]             = useState('/workspaces');
  const [ghParams, setGhParams]       = useState({});
  const [ghOutput, setGhOutput]       = useState('');
  const [ghLoading, setGhLoading]     = useState(false);
  const [ghCloneUrl, setGhCloneUrl]   = useState('');
  const [ghCommitMsg, setGhCommitMsg] = useState('');
  const [ghBranch, setGhBranch]       = useState('main');

  // UI
  const [cmdOpen, setCmdOpen]         = useState(false);
  const [cmdQ, setCmdQ]               = useState('');
  const [ctxMenu, setCtxMenu]         = useState(null);
  const [notifications, setNotifs]    = useState([]);
  const [cursorPos, setCursorPos]     = useState({line:1,col:1});
  const [activeModal, setActiveModal] = useState(null);
  const [snippetModal, setSnippetModal] = useState(false);
  const [keybindModal, setKeybindModal] = useState(false);
  const [problems, setProblems]       = useState([]);
  const [isResizingSB, setIsResizingSB] = useState(false);
  const [isResizingRP, setIsResizingRP] = useState(false);
  const [isResizingBP, setIsResizingBP] = useState(false);

  const T       = THEMES[themeName] || THEMES['VS Dark'];
  const isDark  = T.vs !== 'vs-light';
  const edRef   = useRef(null);
  const moRef   = useRef(null);
  const termRef = useRef(null);
  const cpRef   = useRef(null);
  const agRef   = useRef(null);
  const cmdRef  = useRef(null);
  const autoSaveTimer = useRef(null);

  const activeTab = useMemo(()=>openTabs.find(t=>t.id===activeTabId)||null,[openTabs,activeTabId]);
  const splitTab  = useMemo(()=>splitTabId?files.find(f=>f.id===splitTabId):null,[files,splitTabId]);
  const LC        = useMemo(()=>LANGS[activeTab?.lang]||{},[activeTab]);

  // ── Persist files ────────────────────────────────
  useEffect(()=>{ LS.set('cdr_files',files); },[files]);
  useEffect(()=>{ LS.setStr('cdr_theme',themeName); },[themeName]);
  useEffect(()=>{ LS.set('cdr_fontsize',fontSize); },[fontSize]);

  // ── Notifications ────────────────────────────────
  const notify = useCallback((msg,type='info')=>{
    const id = Date.now();
    setNotifs(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setNotifs(p=>p.filter(n=>n.id!==id)),3500);
  },[]);

  // ── WebSocket Terminal ───────────────────────────
  const connectWS = useCallback(()=>{
    if (wsRef.current?.readyState===1) return;
    try {
      const ws = new WebSocket(`${EXEC.replace('https','wss').replace('http','ws')}/ws`);
      ws.onopen = ()=>{ setWsConnected(true); notify('🔌 Terminal connected','success'); };
      ws.onclose = ()=>{ setWsConnected(false); wsRef.current=null; };
      ws.onerror = ()=>{ setWsConnected(false); };
      ws.onmessage = (e)=>{
        try {
          const {type,data} = JSON.parse(e.data);
          if (type==='output'||type==='ready'||type==='error') {
            setTermTabs(p=>p.map(t=>t.id===activeTermTab?{...t,logs:[...t.logs,{t:type==='error'?'err':'out',s:data}]}:t));
          }
        } catch {}
      };
      wsRef.current = ws;
    } catch(e) { notify('WebSocket failed: '+e.message,'error'); }
  },[notify, activeTermTab]);

  const sendWsCmd = useCallback((cmd)=>{
    if (wsRef.current?.readyState===1) {
      wsRef.current.send(JSON.stringify({type:'command',command:cmd}));
      setTermHistory(p=>[cmd,...p.slice(0,49)]);
      setTermHistIdx(-1);
    } else {
      // Fallback to HTTP
      fetch(`${EXEC}/terminal`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd})})
        .then(r=>r.json())
        .then(d=>setTermTabs(p=>p.map(t=>t.id===activeTermTab?{...t,logs:[...t.logs,{t:d.exitCode?'err':'out',s:d.output}]}:t)))
        .catch(e=>setTermTabs(p=>p.map(t=>t.id===activeTermTab?{...t,logs:[...t.logs,{t:'err',s:e.message}]}:t)));
    }
  },[activeTermTab]);

  useEffect(()=>{ connectWS(); },[]);

  // ── File operations ──────────────────────────────
  const updateContent = useCallback((content)=>{
    setFiles(p=>p.map(f=>f.id===activeTabId?{...f,content,modified:true}:f));
    setOpenTabs(p=>p.map(t=>t.id===activeTabId?{...t,content,modified:true}:t));
    if(autoSave){
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current=setTimeout(()=>{
        setFiles(p=>p.map(f=>f.id===activeTabId?{...f,modified:false}:f));
        setOpenTabs(p=>p.map(t=>t.id===activeTabId?{...t,modified:false}:t));
      },1500);
    }
  },[activeTabId,autoSave]);

  const openFile = useCallback((file)=>{
    setOpenTabs(p=>p.find(t=>t.id===file.id)?p:[...p,{...file}]);
    setActiveTabId(file.id);
  },[]);

  const closeTab = useCallback((e,tabId)=>{
    e&&e.stopPropagation();
    setOpenTabs(p=>{
      const next=p.filter(t=>t.id!==tabId);
      if(activeTabId===tabId) setActiveTabId(next.length?next[next.length-1].id:null);
      return next;
    });
    if(splitTabId===tabId) setSplitTabId(null);
  },[activeTabId,splitTabId]);

  const createFile = useCallback(()=>{
    if(!newFileName.trim()) return;
    const ext=newFileName.split('.').pop().toLowerCase();
    const lang=LANG_EXT[ext]||'text';
    const nf={id:Date.now(),name:newFileName,lang,content:getTemplate(lang,newFileName),modified:false};
    setFiles(p=>[...p,nf]);
    openFile(nf);
    setNewFileName(''); setShowNewFile(false);
    notify(`Created ${newFileName}`,'success');
  },[newFileName,openFile,notify]);

  const deleteFile = useCallback((e,fileId)=>{
    e&&e.stopPropagation();
    const f=files.find(x=>x.id===fileId);
    setFiles(p=>p.filter(f=>f.id!==fileId));
    closeTab(null,fileId);
    notify(`Deleted ${f?.name}`,'info');
  },[files,closeTab,notify]);

  const duplicateFile = useCallback((file)=>{
    const ext=file.name.split('.').pop();
    const base=file.name.replace(`.${ext}`,'');
    const nf={...file,id:Date.now(),name:`${base}_copy.${ext}`,modified:false};
    setFiles(p=>[...p,nf]);
    openFile(nf);
    notify(`Duplicated as ${nf.name}`,'success');
  },[openFile,notify]);

  const addLog = useCallback((t,s)=>setLogs(p=>[...p,{t,s}]),[]);

  // ── REAL Code Execution ──────────────────────────
  const runCode = useCallback(async()=>{
    if(!activeTab||isRunning) return;
    if(!LANGS[activeTab.lang]?.run){
      if(activeTab.lang==='html'){setShowPreview(true);return;}
      notify(`${activeTab.lang} — preview only`,'info');
      setShowPreview(true); return;
    }
    setIsRunning(true); setTermOpen(true); setBottomPanel('terminal');
    const t0=Date.now();
    addLog('cmd',`$ run ${activeTab.name}  [${new Date().toLocaleTimeString()}]`);
    addLog('info',`⟳ Executing ${activeTab.lang.toUpperCase()} via Railway...`);
    try {
      const res = await fetch(`${EXEC}/execute`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({language:activeTab.lang,filename:activeTab.name,code:activeTab.content,stdin,timeout:20000})
      });
      const data=await res.json();
      const elapsed=Date.now()-t0;
      const isErr=data.exitCode!==0;
      addLog(isErr?'err':'out', data.output||'(no output)');
      setExecStats({time:elapsed,exitCode:data.exitCode??0,lang:activeTab.lang});
      addLog('sys',`✓ Exited(${data.exitCode??0}) · ${elapsed}ms · ${new Date().toLocaleTimeString()}`);
      addLog('div','');
      // Auto error fix suggestion
      if(isErr&&apiKey) {
        addLog('sys','💡 AI can fix this error — click "Debug" in Copilot');
      }
    } catch(err){
      addLog('err',`✗ Cannot reach execution server: ${err.message}\nMake sure Railway server is running!`);
      addLog('div','');
    }
    setIsRunning(false);
  },[activeTab,isRunning,stdin,addLog,notify,apiKey]);

  // ── AI Copilot ───────────────────────────────────
  const askCopilot = useCallback(async(overrideMsg)=>{
    const msg=overrideMsg||copilotInput.trim();
    if(!msg||copilotLoading) return;
    if(!apiKey){
      setCopilotMsgs(p=>[...p,{role:'ai',text:'⚠️ No API Key!\n\nGo to Settings → 🔑 API Key\nGet free key at: platform.anthropic.com'}]);
      return;
    }
    setCopilotInput('');
    setCopilotMsgs(p=>[...p,{role:'user',text:msg}]);
    setCopilotLoading(true);
    try {
      const ctx=activeTab
        ?`File: ${activeTab.name} (${activeTab.lang}) — ${activeTab.content.split('\n').length} lines\n\`\`\`${activeTab.lang}\n${activeTab.content.slice(0,3000)}\n\`\`\`\n\n`:'';
      const execCtx=execStats?`Last execution: exit(${execStats.exitCode}) in ${execStats.time}ms\n`:'';
      const res=await fetch(CLAUDE,{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',max_tokens:2000,
          system:'You are an expert AI Copilot in CodeDroid Pro — a full VS Code clone on Android. Be concise, expert, practical. Use ``` for code. Max 400 words unless asked for more. Always suggest runnable code.',
          messages:[
            ...copilotMsgs.slice(-8).map(m=>({role:m.role==='ai'?'assistant':'user',content:m.text})),
            {role:'user',content:ctx+execCtx+msg}
          ]
        })
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||data.error?.message||'Try again.';
      setCopilotMsgs(p=>[...p,{role:'ai',text:reply}]);
    } catch(e){
      setCopilotMsgs(p=>[...p,{role:'ai',text:`⚠️ Error: ${e.message}`}]);
    }
    setCopilotLoading(false);
  },[copilotInput,copilotLoading,copilotMsgs,activeTab,execStats,apiKey]);

  // ── AI AGENT MODE ────────────────────────────────
  const runAgent = useCallback(async()=>{
    if(!agentTask.trim()||agentRunning) return;
    if(!apiKey){ notify('API Key required for Agent mode!','error'); return; }
    setAgentRunning(true);
    setAgentLogs([{t:'sys',s:`🤖 Agent starting: "${agentTask}"`},{t:'div',s:''}]);

    let context = '';
    let currentCode = activeTab?.content||'';
    let currentLang = activeTab?.lang||'python';
    let step = 0;

    const agLog=(t,s)=>setAgentLogs(p=>[...p,{t,s}]);

    while(step < agentMaxSteps) {
      step++;
      agLog('sys',`\n── Step ${step}/${agentMaxSteps} ──`);

      try {
        // Ask AI what to do
        const res=await fetch(CLAUDE,{
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body:JSON.stringify({
            model:'claude-sonnet-4-20250514',max_tokens:2000,
            system:`You are an autonomous coding agent in CodeDroid Pro IDE. Your job is to complete the user's task step by step.

You must respond with ONLY a JSON object (no markdown):
{
  "thought": "what you're thinking",
  "action": "write_code|run_code|fix_error|done",
  "language": "python/javascript/c/etc",
  "filename": "filename.ext",
  "code": "the complete code",
  "message": "what you did"
}

Actions:
- write_code: Write new code to solve the task
- run_code: Run the current code
- fix_error: Fix errors in the code
- done: Task is complete`,
            messages:[
              {role:'user',content:`Task: ${agentTask}\n\nCurrent code (${currentLang}):\n\`\`\`\n${currentCode}\n\`\`\`\n\nPrevious context:\n${context}\n\nWhat's your next step?`}
            ]
          })
        });
        const data=await res.json();
        let plan;
        try { plan=JSON.parse(data.content?.[0]?.text||'{}'); }
        catch { plan={action:'done',message:'Could not parse response',code:currentCode,language:currentLang,filename:activeTab?.name||'main.py'}; }

        agLog('info',`💭 ${plan.thought||'Thinking...'}`);
        agLog('out',`⚡ Action: ${plan.action}`);

        if(plan.action==='done'){
          agLog('sys','✅ Task completed!');
          agLog('out',plan.message||'Done!');
          if(plan.code&&activeTab) {
            updateContent(plan.code);
            notify('Agent completed the task!','success');
          }
          break;
        }

        if(plan.code) {
          currentCode=plan.code;
          currentLang=plan.language||currentLang;
          // Update the file
          if(activeTab) {
            updateContent(plan.code);
            setFiles(p=>p.map(f=>f.id===activeTabId?{...f,lang:currentLang}:f));
          }
          agLog('out',`📝 Code written (${plan.code.split('\n').length} lines)`);
        }

        if(plan.action==='run_code'||plan.action==='fix_error'||plan.action==='write_code') {
          agLog('info','▶ Running code...');
          try {
            const execRes=await fetch(`${EXEC}/execute`,{
              method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({language:currentLang,filename:plan.filename||'main.py',code:currentCode,timeout:15000})
            });
            const execData=await execRes.json();
            agLog(execData.exitCode?'err':'out',`Output:\n${execData.output}`);
            context+=`\nStep ${step}: Ran code, exit(${execData.exitCode}), output: ${execData.output.slice(0,200)}`;
            if(execData.exitCode===0){
              agLog('sys','✅ Code ran successfully!');
              if(step===agentMaxSteps||plan.action!=='fix_error'){
                agLog('sys','🎉 Agent mission accomplished!');
                notify('Agent completed task successfully!','success');
                break;
              }
            } else {
              context+=`\nError: ${execData.output.slice(0,300)}`;
            }
          } catch(e) {
            agLog('err',`Execution error: ${e.message}`);
            context+=`\nExecution failed: ${e.message}`;
          }
        }

        agLog('out',plan.message||'');
        await new Promise(r=>setTimeout(r,500));

      } catch(e) {
        agLog('err',`Agent error: ${e.message}`);
        break;
      }
    }

    if(step>=agentMaxSteps) agLog('sys',`⚠️ Max steps (${agentMaxSteps}) reached`);
    setAgentRunning(false);
  },[agentTask,agentRunning,agentMaxSteps,activeTab,activeTabId,apiKey,updateContent,notify]);

  // ── Voice Coding ─────────────────────────────────
  const toggleVoice = useCallback(()=>{
    if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
      notify('Voice not supported in this browser','error'); return;
    }
    if(voiceActive){
      recognitionRef.current?.stop();
      setVoiceActive(false); return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();
    r.continuous=true; r.interimResults=true; r.lang='en-US';
    r.onresult=(e)=>{
      const t=Array.from(e.results).map(r=>r[0].transcript).join('');
      setVoiceTranscript(t);
      if(e.results[e.results.length-1].isFinal){
        setCopilotInput(t);
        setVoiceTranscript('');
      }
    };
    r.onerror=(e)=>{ notify(`Voice error: ${e.error}`,'error'); setVoiceActive(false); };
    r.onend=()=>setVoiceActive(false);
    recognitionRef.current=r;
    r.start();
    setVoiceActive(true);
    notify('🎤 Listening... speak your code request','info');
  },[voiceActive,notify]);

  // ── REST Client ──────────────────────────────────
  const sendRest = useCallback(async()=>{
    if(!restUrl||restLoading) return;
    setRestLoading(true); setBottomPanel('rest'); setTermOpen(true);
    try {
      let headers={};
      try{headers=JSON.parse(restHeaders);}catch{}
      const opts={method:restMethod,headers};
      if(restBody&&restMethod!=='GET') opts.body=restBody;
      const t0=Date.now();
      const res=await fetch(restUrl,opts);
      const elapsed=Date.now()-t0;
      const ct=res.headers.get('content-type')||'';
      let body;
      if(ct.includes('json')){const j=await res.json();body=JSON.stringify(j,null,2);}
      else body=await res.text();
      const response={status:res.status,statusText:res.statusText,body,time:elapsed,headers:Object.fromEntries(res.headers.entries())};
      setRestResponse(response);
      setRestHistory(p=>[{method:restMethod,url:restUrl,status:res.status,time:elapsed},...p.slice(0,9)]);
      notify(`${res.status} ${res.statusText} · ${elapsed}ms`,res.ok?'success':'error');
    } catch(e){
      setRestResponse({error:e.message,status:0,body:`Error: ${e.message}`});
      notify(`Failed: ${e.message}`,'error');
    }
    setRestLoading(false);
  },[restUrl,restMethod,restHeaders,restBody,restLoading,notify]);

  // ── Git Operations ───────────────────────────────
  const doGit = useCallback(async(op,params={})=>{
    setGhLoading(true);
    try {
      const res=await fetch(`${EXEC}/git`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({op,cwd:ghCwd,params})
      });
      const data=await res.json();
      setGhOutput(data.output);
      notify(`git ${op} done`,'success');
    } catch(e){
      setGhOutput(`Error: ${e.message}`);
      notify(`git failed: ${e.message}`,'error');
    }
    setGhLoading(false);
  },[ghCwd,notify]);

  // ── Package Manager ──────────────────────────────
  const installPkg = useCallback(async()=>{
    if(!pkgInput.trim()||pkgLoading) return;
    setPkgLoading(true);
    setPkgLog(`Installing ${pkgInput}...`);
    try {
      const res=await fetch(`${EXEC}/install`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({language:pkgLang,packages:pkgInput.trim().split(/\s+/)})
      });
      const data=await res.json();
      setPkgLog(data.output);
      notify(`Install ${data.exitCode===0?'success':'failed'}: ${pkgInput}`,data.exitCode===0?'success':'error');
    } catch(e){
      setPkgLog(`Error: ${e.message}`);
    }
    setPkgLoading(false);
  },[pkgInput,pkgLang,pkgLoading,notify]);

  // ── System Info ──────────────────────────────────
  const loadSysInfo = useCallback(async()=>{
    try {
      const [health,sysinfo]=await Promise.all([
        fetch(`${EXEC}/health`).then(r=>r.json()),
        fetch(`${EXEC}/sysinfo`).then(r=>r.json()),
      ]);
      setSysInfo({...health,...sysinfo});
    } catch(e){ notify('Cannot reach server','error'); }
  },[notify]);

  // ── Monaco mount ─────────────────────────────────
  const handleEditorMount = useCallback((editor,monaco)=>{
    edRef.current=editor;
    moRef.current=monaco;
    editor.onDidChangeCursorPosition(e=>setCursorPos({line:e.position.lineNumber,col:e.position.column}));

    // Shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>runCode());
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyI,()=>setRightPanel(p=>p==='copilot'?null:'copilot'));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Backquote,()=>setTermOpen(v=>!v));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyB,()=>setSidebarOpen(v=>!v));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyW,()=>closeTab(null,activeTabId));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Backslash,()=>setSplitMode(v=>!v));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyMod.Shift|monaco.KeyCode.KeyP,()=>{setCmdOpen(true);setTimeout(()=>cmdRef.current?.focus(),50);});
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyMod.Shift|monaco.KeyCode.KeyA,()=>setAgentOpen(true));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyMod.Shift|monaco.KeyCode.KeyV,()=>toggleVoice());
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyMod.Shift|monaco.KeyCode.KeyZ,()=>setZenMode(v=>!v));
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyMod.Shift|monaco.KeyCode.KeyG,()=>{setPanel('git');setSidebarOpen(true);});
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyT,()=>{
      const id=Date.now();
      setTermTabs(p=>[...p,{id,name:`bash ${p.length+1}`,logs:[],input:''}]);
      setActiveTermTab(id);
      setTermOpen(true);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyS,()=>{
      setFiles(p=>p.map(f=>f.id===activeTabId?{...f,modified:false}:f));
      setOpenTabs(p=>p.map(t=>t.id===activeTabId?{...t,modified:false}:t));
      if(formatOnSave) editor.getAction('editor.action.formatDocument')?.run();
      notify('💾 Saved','success');
    });

    // Snippets
    const lang=activeTab?.lang;
    if(lang&&SNIPPETS[lang]){
      const monacoLang=LANGS[lang]?.monaco||lang;
      monaco.languages.registerCompletionItemProvider(monacoLang,{
        provideCompletionItems:(model,pos)=>{
          const word=model.getWordUntilPosition(pos);
          const range={startLineNumber:pos.lineNumber,endLineNumber:pos.lineNumber,startColumn:word.startColumn,endColumn:word.endColumn};
          return {suggestions:SNIPPETS[lang].map(s=>({
            label:s.p,kind:monaco.languages.CompletionItemKind.Snippet,
            documentation:s.d,insertText:s.b,
            insertTextRules:monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          }))};
        }
      });
    }
  },[runCode,closeTab,activeTabId,activeTab,formatOnSave,notify,toggleVoice]);

  // ── Commands ─────────────────────────────────────
  const CMDS = useMemo(()=>[
    {id:'run',       label:'▶ Run Code',            key:'Ctrl+Enter',    fn:()=>runCode()},
    {id:'copilot',   label:'🤖 Toggle AI Copilot',  key:'Ctrl+I',        fn:()=>setRightPanel(p=>p==='copilot'?null:'copilot')},
    {id:'agent',     label:'🦾 AI Agent Mode',       key:'Ctrl+Shift+A',  fn:()=>setAgentOpen(true)},
    {id:'voice',     label:'🎤 Voice Coding',         key:'Ctrl+Shift+V',  fn:toggleVoice},
    {id:'find',      label:'🔍 Find',                key:'Ctrl+F',        fn:()=>edRef.current?.getAction('actions.find')?.run()},
    {id:'replace',   label:'↔ Find & Replace',       key:'Ctrl+H',        fn:()=>edRef.current?.getAction('editor.action.startFindReplaceAction')?.run()},
    {id:'format',    label:'✨ Format Document',      key:'Shift+Alt+F',   fn:()=>edRef.current?.getAction('editor.action.formatDocument')?.run()},
    {id:'goto',      label:'→ Go to Line',           key:'Ctrl+G',        fn:()=>edRef.current?.getAction('editor.action.gotoLine')?.run()},
    {id:'symbols',   label:'@ Go to Symbol',         key:'Ctrl+Shift+O',  fn:()=>edRef.current?.getAction('editor.action.quickOutline')?.run()},
    {id:'zen',       label:'🧘 Zen Mode',             key:'Ctrl+Shift+Z',  fn:()=>setZenMode(v=>!v)},
    {id:'split',     label:'⟛ Split Editor',         key:'Ctrl+\\',       fn:()=>setSplitMode(v=>!v)},
    {id:'sidebar',   label:'◀ Toggle Sidebar',       key:'Ctrl+B',        fn:()=>setSidebarOpen(v=>!v)},
    {id:'terminal',  label:'⬛ Toggle Terminal',      key:'Ctrl+`',        fn:()=>setTermOpen(v=>!v)},
    {id:'newterm',   label:'+ New Terminal Tab',     key:'Ctrl+T',        fn:()=>{const id=Date.now();setTermTabs(p=>[...p,{id,name:`bash ${p.length+1}`,logs:[],input:''}]);setActiveTermTab(id);setTermOpen(true);}},
    {id:'preview',   label:'🌐 HTML Preview',         key:'',              fn:()=>setShowPreview(v=>!v)},
    {id:'rest',      label:'⚡ REST Client',          key:'',              fn:()=>{setBottomPanel('rest');setTermOpen(true);}},
    {id:'git',       label:'🌿 Git Panel',            key:'Ctrl+Shift+G',  fn:()=>{setPanel('git');setSidebarOpen(true);}},
    {id:'packages',  label:'📦 Package Manager',     key:'',              fn:()=>setActiveModal('packages')},
    {id:'regex',     label:'🔍 Regex Tester',         key:'',              fn:()=>setActiveModal('regex')},
    {id:'json',      label:'📋 JSON Tools',           key:'',              fn:()=>setActiveModal('json')},
    {id:'base64',    label:'🔐 Base64 Tools',         key:'',              fn:()=>setActiveModal('base64')},
    {id:'color',     label:'🎨 Color Picker',         key:'',              fn:()=>setActiveModal('color')},
    {id:'diff',      label:'🔄 Diff Viewer',          key:'',              fn:()=>setActiveModal('diff')},
    {id:'sysinfo',   label:'🖥 System Info',          key:'',              fn:()=>{loadSysInfo();setActiveModal('sysinfo');}},
    {id:'stats',     label:'📊 Code Statistics',      key:'',              fn:()=>setActiveModal('stats')},
    {id:'snippets',  label:'🧩 Snippets',             key:'',              fn:()=>setSnippetModal(true)},
    {id:'keybinds',  label:'⌨ Keyboard Shortcuts',    key:'',              fn:()=>setKeybindModal(true)},
    {id:'newfile',   label:'📄 New File',             key:'Ctrl+N',        fn:()=>setShowNewFile(true)},
    {id:'theme',     label:'🎨 Change Theme',         key:'',              fn:()=>{setPanel('settings');setSidebarOpen(true);}},
    {id:'vim',       label:'⌨ Toggle Vim Mode',       key:'',              fn:()=>setVimMode(v=>!v)},
    {id:'autosave',  label:'💾 Toggle Auto Save',      key:'',              fn:()=>setAutoSave(v=>!v)},
    {id:'minimap',   label:'🗺 Toggle Minimap',        key:'',              fn:()=>setMinimap(v=>!v)},
    {id:'wordwrap',  label:'↵ Toggle Word Wrap',       key:'',              fn:()=>setWordWrap(v=>v==='on'?'off':'on')},
    {id:'wsterm',    label:'🔌 Connect WebSocket',    key:'',              fn:connectWS},
  ],[runCode,toggleVoice,loadSysInfo,connectWS]);

  const filteredCmds=useMemo(()=>cmdQ?CMDS.filter(c=>c.label.toLowerCase().includes(cmdQ.toLowerCase())):CMDS,[CMDS,cmdQ]);

  // ── Resize handlers ──────────────────────────────
  const startResize=(setter,setActive,axis,min,max,invert=false)=>useCallback((e)=>{
    e.preventDefault();
    setActive(true);
    const start=axis==='x'?(e.clientX||e.touches?.[0]?.clientX):(e.clientY||e.touches?.[0]?.clientY);
    const startVal=axis==='x'?(axis==='x'&&invert?rightPanelW:sidebarW):termH;
    const onMove=(ev)=>{
      const cur=axis==='x'?(ev.clientX||ev.touches?.[0]?.clientX):(ev.clientY||ev.touches?.[0]?.clientY);
      const delta=invert?start-cur:cur-start;
      setter(v=>Math.max(min,Math.min(max,startVal+delta)));
    };
    const onUp=()=>{setActive(false);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);window.removeEventListener('touchmove',onMove);window.removeEventListener('touchend',onUp);};
    window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);
    window.addEventListener('touchmove',onMove);window.addEventListener('touchend',onUp);
  },[]);

  const startResizeSB = useCallback((e)=>{
    e.preventDefault(); setIsResizingSB(true);
    const sx=e.clientX||e.touches?.[0]?.clientX, sv=sidebarW;
    const mv=(ev)=>{ const x=ev.clientX||ev.touches?.[0]?.clientX; setSidebarW(Math.max(160,Math.min(500,sv+(x-sx)))); };
    const up=()=>{ setIsResizingSB(false); window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',mv); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',mv); window.addEventListener('touchend',up);
  },[sidebarW]);

  const startResizeRP = useCallback((e)=>{
    e.preventDefault(); setIsResizingRP(true);
    const sx=e.clientX||e.touches?.[0]?.clientX, sv=rightPanelW;
    const mv=(ev)=>{ const x=ev.clientX||ev.touches?.[0]?.clientX; setRightPanelW(Math.max(220,Math.min(600,sv+(sx-x)))); };
    const up=()=>{ setIsResizingRP(false); window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',mv); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',mv); window.addEventListener('touchend',up);
  },[rightPanelW]);

  const startResizeBP = useCallback((e)=>{
    e.preventDefault(); setIsResizingBP(true);
    const sy=e.clientY||e.touches?.[0]?.clientY, sv=termH;
    const mv=(ev)=>{ const y=ev.clientY||ev.touches?.[0]?.clientY; setTermH(Math.max(80,Math.min(600,sv+(sy-y)))); };
    const up=()=>{ setIsResizingBP(false); window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); window.removeEventListener('touchmove',mv); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',mv); window.addEventListener('touchend',up);
  },[termH]);

  // ── Computed ─────────────────────────────────────
  const regexResult = useMemo(()=>{
    try {
      const re=new RegExp(regexPat,regexFlags.includes('g')?regexFlags:regexFlags+'g');
      const matches=[...regexInput.matchAll(re)];
      return {matches,error:null};
    } catch(e){ return {matches:[],error:e.message}; }
  },[regexPat,regexFlags,regexInput]);

  const jsonResult = useMemo(()=>{
    try{return {parsed:JSON.parse(jsonInput),error:null};}
    catch(e){return {parsed:null,error:e.message};}
  },[jsonInput]);

  const colorInfo = useMemo(()=>{
    const h=colorVal.replace('#','');
    if(h.length!==6) return null;
    const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
    const rn=r/255,gn=g/255,bn=b/255,mx=Math.max(rn,gn,bn),mn=Math.min(rn,gn,bn),l=(mx+mn)/2;
    let hs=0,hh=0;
    if(mx!==mn){const d=mx-mn;hs=l>.5?d/(2-mx-mn):d/(mx+mn);hh=mx===rn?(gn-bn)/d+(gn<bn?6:0):mx===gn?(bn-rn)/d+2:(rn-gn)/d+4;}
    return {hex:colorVal,rgb:`rgb(${r},${g},${b})`,rgba:`rgba(${r},${g},${b},1)`,hsl:`hsl(${Math.round(hh/6*360)},${Math.round(hs*100)}%,${Math.round(l*100)}%)`};
  },[colorVal]);

  const filteredFiles = useMemo(()=>files.filter(f=>!fileSearch||f.name.toLowerCase().includes(fileSearch.toLowerCase())),[files,fileSearch]);

  useEffect(()=>{ if(termRef.current) termRef.current.scrollTop=termRef.current.scrollHeight; },[logs]);
  useEffect(()=>{ if(cpRef.current) cpRef.current.scrollTop=cpRef.current.scrollHeight; },[copilotMsgs]);
  useEffect(()=>{ if(agRef.current) agRef.current.scrollTop=agRef.current.scrollHeight; },[agentLogs]);

  // Open first file
  useEffect(()=>{ if(files.length&&!openTabs.length) openFile(files[0]); },[]);

  const inp={background:isDark?'#3c3c3c':'#e8e8e8',border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:'6px 10px',fontSize:12,outline:'none',fontFamily:'inherit',width:'100%'};
  const btn=(x={})=>({border:'none',cursor:'pointer',borderRadius:5,fontSize:12,padding:'6px 12px',fontFamily:'inherit',...x});

  const activeTermTabData = termTabs.find(t=>t.id===activeTermTab)||termTabs[0];

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────
  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:T.bg,color:T.text,overflow:'hidden',fontFamily:"'JetBrains Mono',Consolas,monospace",fontSize:13,cursor:isResizingSB||isResizingRP?'col-resize':isResizingBP?'row-resize':'default'}}
      onClick={()=>ctxMenu&&setCtxMenu(null)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:#404040;border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#555}
        input,textarea,button,select{font-family:inherit}
        .hov:hover{background:${T.hover}!important}
        .nav-btn{border:none;cursor:pointer;background:none;padding:10px 0;width:44px;text-align:center;font-size:19px;color:${T.dim};border-left:2px solid transparent;transition:all .15s}
        .nav-btn:hover{color:${T.text};background:${T.hover}}
        .nav-btn.active{color:${T.text};border-left:2px solid ${T.accent};background:${T.hover}}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite;display:inline-block}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.2s ease infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .18s ease}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}.slide-in{animation:slideIn .2s ease}
        @keyframes notif{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        .tab-x{opacity:.3;transition:opacity .1s}.tab-x:hover{opacity:1;color:#f48771}
        .ctx-item:hover{background:${T.hover};cursor:pointer}
        .file-row:hover{background:${T.hover}!important}
        .cmd-item:hover{background:${T.hover}}
        .resize-h{cursor:col-resize;width:4px;background:transparent;flex-shrink:0;transition:background .15s}
        .resize-h:hover,.resize-h.active{background:${T.accent}}
        .resize-v{cursor:row-resize;height:4px;background:transparent;flex-shrink:0;transition:background .15s}
        .resize-v:hover,.resize-v.active{background:${T.accent}}
        .voice-active{animation:pulse 1s ease infinite;color:#f48771!important}
        .run-btn:hover{background:#1177bb!important;transform:translateY(-1px)}
        .run-btn:active{transform:scale(.97)}
        .match-hl{background:#ff9900;color:#000;border-radius:2px;padding:0 1px}
        mark.match-hl{background:#ff990066}
        textarea:focus,input:focus{outline:1px solid ${T.accent}!important}
      `}</style>

      {/* ══ NOTIFICATIONS ══ */}
      <div style={{position:'fixed',top:8,right:8,zIndex:9999,display:'flex',flexDirection:'column',gap:5,pointerEvents:'none'}}>
        {notifications.map(n=>(
          <div key={n.id} style={{background:n.type==='success'?'#1c4532':n.type==='error'?'#4c1a1a':'#1a2744',border:`1px solid ${n.type==='success'?'#4ec9b0':n.type==='error'?'#f48771':T.accent}`,color:n.type==='success'?'#4ec9b0':n.type==='error'?'#f48771':T.text,padding:'7px 14px',borderRadius:6,fontSize:11,fontWeight:600,boxShadow:'0 4px 12px rgba(0,0,0,.4)',animation:'notif .3s ease'}}>
            {n.type==='success'?'✓':n.type==='error'?'✗':'ℹ'} {n.msg}
          </div>
        ))}
      </div>

      {/* ══ COMMAND PALETTE ══ */}
      {cmdOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',zIndex:3000,display:'flex',justifyContent:'center',paddingTop:60}}
          onClick={e=>e.target===e.currentTarget&&(setCmdOpen(false),setCmdQ(''))}>
          <div className="fade-in" style={{width:'100%',maxWidth:620,background:T.sb,border:`1px solid ${T.border}`,borderRadius:8,maxHeight:480,display:'flex',flexDirection:'column',boxShadow:'0 25px 80px rgba(0,0,0,.7)'}}>
            <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:8}}>
              <span style={{color:T.dim}}>⌨</span>
              <input ref={cmdRef} value={cmdQ} onChange={e=>setCmdQ(e.target.value)}
                onKeyDown={e=>{if(e.key==='Escape'){setCmdOpen(false);setCmdQ('');}if(e.key==='Enter'&&filteredCmds[0]){filteredCmds[0].fn();setCmdOpen(false);setCmdQ('');} }}
                placeholder="Type a command or search..."
                style={{flex:1,background:'none',border:'none',color:T.text,fontSize:14,outline:'none'}} autoFocus/>
              <span style={{fontSize:10,color:T.dim}}>ESC</span>
            </div>
            <div style={{overflowY:'auto'}}>
              {filteredCmds.slice(0,20).map((cmd,i)=>(
                <div key={cmd.id} className="cmd-item"
                  onClick={()=>{cmd.fn();setCmdOpen(false);setCmdQ('');}}
                  style={{padding:'9px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',borderBottom:`1px solid ${T.border}22`}}>
                  <span style={{fontSize:13,color:T.text}}>{cmd.label}</span>
                  {cmd.key&&<code style={{fontSize:10,color:T.dim,background:T.bg,padding:'2px 6px',borderRadius:3}}>{cmd.key}</code>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ AI AGENT MODAL ══ */}
      {agentOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:12}}>
          <div className="fade-in" style={{width:'100%',maxWidth:700,background:T.sb,border:`1px solid ${T.border}`,borderRadius:10,display:'flex',flexDirection:'column',maxHeight:'85vh',boxShadow:'0 25px 80px rgba(0,0,0,.7)'}}>
            <div style={{padding:'13px 16px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:T.text}}>🦾 AI Agent Mode</div>
                <div style={{fontSize:11,color:T.dim}}>Autonomous coding — AI writes, runs, and fixes code by itself</div>
              </div>
              <button onClick={()=>setAgentOpen(false)} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:22}}>×</button>
            </div>

            <div style={{padding:12,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <textarea value={agentTask} onChange={e=>setAgentTask(e.target.value)}
                placeholder="Describe what you want the AI to build/fix/create... e.g. 'Create a Python sorting algorithm with 5 different methods and benchmark them'"
                rows={3} style={{...inp,resize:'none',marginBottom:8}}/>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <label style={{fontSize:11,color:T.dim}}>Max Steps:</label>
                <input type="range" min={2} max={10} value={agentMaxSteps} onChange={e=>setAgentMaxSteps(+e.target.value)} style={{width:100,accentColor:T.accent}}/>
                <span style={{fontSize:11,color:T.accent,fontWeight:700}}>{agentMaxSteps}</span>
                <button onClick={runAgent} disabled={agentRunning||!agentTask.trim()||!apiKey}
                  style={{...btn({background:agentRunning?'#555':T.accent,color:'#fff',fontWeight:700,padding:'7px 18px'}),marginLeft:'auto'}}>
                  {agentRunning?<><span className="spin">⟳</span> Running...</>:'🚀 Start Agent'}
                </button>
                {agentRunning&&<button onClick={()=>setAgentRunning(false)} style={{...btn({background:'#f48771',color:'#fff'})}}>⏹ Stop</button>}
              </div>
              {!apiKey&&<div style={{fontSize:11,color:'#f48771',marginTop:6}}>⚠️ API Key required — go to Settings</div>}
            </div>

            <div ref={agRef} style={{flex:1,overflowY:'auto',padding:12,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
              {agentLogs.length===0&&(
                <div style={{color:T.dim,textAlign:'center',padding:30}}>
                  <div style={{fontSize:40,marginBottom:12}}>🦾</div>
                  <div>Describe a task and let AI handle it completely!</div>
                  <div style={{marginTop:8,fontSize:11}}>Examples:</div>
                  {['Build a Flask REST API with CRUD operations','Sort 1M numbers in Python using 3 algorithms and compare','Create a binary search tree in C with all operations','Write a scraper that gets top 10 Hacker News posts'].map(t=>(
                    <div key={t} onClick={()=>setAgentTask(t)} style={{background:T.hover,padding:'6px 10px',borderRadius:5,margin:'4px 0',cursor:'pointer',fontSize:11,color:T.text,textAlign:'left'}} className="hov">
                      → {t}
                    </div>
                  ))}
                </div>
              )}
              {agentLogs.map((l,i)=>
                l.t==='div'?<div key={i} style={{borderTop:`1px solid ${T.border}`,margin:'5px 0'}}/>:
                <div key={i} style={{color:l.t==='err'?'#f48771':l.t==='sys'?T.accent:l.t==='info'?'#e5c07b':T.text,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.7,marginBottom:2}}>
                  {l.s}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TITLE BAR ══ */}
      {!zenMode&&(
        <div style={{height:38,background:T.sb,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 10px',gap:6,flexShrink:0,userSelect:'none'}}>
          <span style={{fontSize:19}}>⚡</span>
          <span style={{color:T.accent,fontWeight:700,fontSize:14}}>CodeDroid Pro</span>
          <span style={{fontSize:10,color:T.dim,background:T.bg,padding:'1px 6px',borderRadius:8}}>v2.0</span>

          {breadcrumbs&&activeTab&&(
            <span style={{fontSize:11,color:T.dim,flex:1,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {LANGS[activeTab.lang]?.icon} {activeTab.name}
              {activeTab.modified&&<span style={{color:'#e5c07b',marginLeft:4}}>●</span>}
            </span>
          )}
          {!breadcrumbs&&<div style={{flex:1}}/>}

          {/* WebSocket status */}
          <div title={wsConnected?'Terminal connected':'Terminal disconnected'} style={{width:7,height:7,borderRadius:'50%',background:wsConnected?'#4ec9b0':'#555',flexShrink:0}}/>

          {/* Voice indicator */}
          {voiceActive&&<span style={{fontSize:11,color:'#f48771',animation:'pulse 1s ease infinite'}}>🎤 {voiceTranscript.slice(-20)}</span>}

          {[
            {icon:'⌨',  tip:'Command Palette (Ctrl+Shift+P)', fn:()=>{setCmdOpen(true);setTimeout(()=>cmdRef.current?.focus(),50);}},
            {icon:'🔍', tip:'Find (Ctrl+F)',                  fn:()=>edRef.current?.getAction('actions.find')?.run()},
            {icon:'✨', tip:'Format',                         fn:()=>edRef.current?.getAction('editor.action.formatDocument')?.run()},
            {icon:'🦾', tip:'AI Agent (Ctrl+Shift+A)',        fn:()=>setAgentOpen(true)},
            {icon:voiceActive?'🔴':'🎤', tip:'Voice Coding (Ctrl+Shift+V)', fn:toggleVoice},
            {icon:'🌐', tip:'Preview',                        fn:()=>setShowPreview(v=>!v)},
            {icon:'🤖', tip:'AI Copilot (Ctrl+I)',            fn:()=>setRightPanel(p=>p==='copilot'?null:'copilot')},
          ].map(({icon,tip,fn})=>(
            <button key={tip} onClick={fn} title={tip} className="hov"
              style={{background:'none',border:'none',color:T.dim,cursor:'pointer',padding:'4px 6px',fontSize:14,borderRadius:4}}>
              {icon}
            </button>
          ))}

          <button onClick={runCode} disabled={isRunning||!activeTab||!LANGS[activeTab?.lang]?.run} className="run-btn"
            style={{background:isRunning?'#094771':T.accent,border:'none',color:'#fff',cursor:'pointer',padding:'5px 14px',borderRadius:5,display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,opacity:(!activeTab||!LANGS[activeTab?.lang]?.run)?0.4:1,flexShrink:0,transition:'all .15s'}}>
            {isRunning?<><span className="spin">⟳</span>Running</>:<>▶ Run</>}
          </button>
        </div>
      )}

      {/* ══ TAB BAR ══ */}
      {!zenMode&&(
        <div style={{display:'flex',background:T.sb,borderBottom:`1px solid ${T.border}`,overflowX:'auto',flexShrink:0,height:34,scrollbarWidth:'none'}}>
          {openTabs.map(tab=>(
            <div key={tab.id} onClick={()=>setActiveTabId(tab.id)}
              onContextMenu={e=>{e.preventDefault();setCtxMenu({x:e.clientX,y:e.clientY,tab});}}
              className="hov"
              style={{display:'flex',alignItems:'center',gap:5,padding:'0 13px',cursor:'pointer',whiteSpace:'nowrap',fontSize:12,height:'100%',borderRight:`1px solid ${T.border}`,flexShrink:0,minWidth:90,background:tab.id===activeTabId?T.bg:T.tab,color:tab.id===activeTabId?T.text:T.dim,borderTop:`2px solid ${tab.id===activeTabId?T.accent:'transparent'}`}}>
              <span>{LANGS[tab.lang]?.icon||'📄'}</span>
              <span style={{maxWidth:90,overflow:'hidden',textOverflow:'ellipsis'}}>{tab.name}</span>
              {tab.modified&&<span style={{color:'#e5c07b',fontSize:14}}>●</span>}
              <span onClick={e=>closeTab(e,tab.id)} className="tab-x" style={{marginLeft:2,cursor:'pointer',fontSize:16}}>×</span>
            </div>
          ))}
          <button onClick={()=>setShowNewFile(true)} title="New File (Ctrl+N)"
            style={{padding:'0 13px',background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:22,flexShrink:0}}>+</button>
        </div>
      )}

      {/* ══ BODY ══ */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ── ACTIVITY BAR ── */}
        {!zenMode&&(
          <div style={{width:44,background:T.sb,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:2,flexShrink:0}}>
            {[
              {id:'explorer',icon:'⎇', tip:'Explorer'},
              {id:'search',  icon:'🔍',tip:'Search'},
              {id:'git',     icon:'⑂', tip:'Git'},
              {id:'packages',icon:'📦',tip:'Packages'},
              {id:'ext',     icon:'⊞', tip:'Extensions'},
              {id:'debug',   icon:'🐛',tip:'Debug'},
              {id:'settings',icon:'⚙', tip:'Settings'},
            ].map(n=>(
              <button key={n.id} title={n.tip} className={`nav-btn${panel===n.id&&sidebarOpen?' active':''}`}
                onClick={()=>{if(panel===n.id){setSidebarOpen(v=>!v);}else{setPanel(n.id);setSidebarOpen(true);if(n.id==='packages')setActiveModal('packages');}}}>
                {n.icon}
              </button>
            ))}
            <div style={{flex:1}}/>
            <button onClick={()=>setZenMode(v=>!v)} title="Zen Mode" className="nav-btn" style={{marginBottom:4}}>🧘</button>
          </div>
        )}

        {/* ── SIDEBAR ── */}
        {sidebarOpen&&!zenMode&&(
          <>
            <div className="fade-in" style={{width:sidebarW,background:T.sb,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>

              {/* EXPLORER */}
              {panel==='explorer'&&(
                <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                  <div style={{padding:'10px 12px 4px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase'}}>Explorer</span>
                    <div style={{display:'flex',gap:4}}>
                      <button onClick={()=>setShowNewFile(v=>!v)} title="New File" style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:16,padding:'0 3px'}}>📄</button>
                      <button onClick={()=>setFiles(DEFAULT_FILES)} title="Reset files" style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:14,padding:'0 3px'}}>↺</button>
                    </div>
                  </div>
                  <div style={{padding:'0 8px 6px',flexShrink:0}}>
                    <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="🔍 Filter files..." style={{...inp}}/>
                  </div>
                  {showNewFile&&(
                    <div className="fade-in" style={{padding:'2px 8px 6px',display:'flex',gap:4,flexShrink:0}}>
                      <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter')createFile();if(e.key==='Escape')setShowNewFile(false);}}
                        placeholder="main.py, App.java, app.go..."
                        style={{...inp,flex:1,borderColor:T.accent}}/>
                      <button onClick={createFile} style={{...btn({background:T.accent,color:'#fff'})}}>✓</button>
                    </div>
                  )}
                  <div style={{flex:1,overflowY:'auto',paddingBottom:6}}>
                    <div style={{padding:'4px 12px 2px',fontSize:10,color:T.dim,letterSpacing:1}}>OPEN FILES ({files.length})</div>
                    {filteredFiles.map(file=>(
                      <div key={file.id} className="file-row"
                        onClick={()=>openFile(file)}
                        onContextMenu={e=>{e.preventDefault();setCtxMenu({x:e.clientX,y:e.clientY,file});}}
                        style={{display:'flex',alignItems:'center',padding:'5px 10px 5px 14px',gap:6,fontSize:12,cursor:'pointer',color:activeTabId===file.id?T.text:T.dim,background:activeTabId===file.id?(isDark?'#094771':'#cce5ff'):'transparent'}}>
                        <span style={{fontSize:13,flexShrink:0}}>{LANGS[file.lang]?.icon||'📄'}</span>
                        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.name}</span>
                        {file.modified&&<span style={{color:'#e5c07b',fontSize:11}}>●</span>}
                        <span onClick={e=>deleteFile(e,file.id)} className="tab-x" style={{fontSize:13,cursor:'pointer',padding:'0 3px'}}>×</span>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:'6px 12px',borderTop:`1px solid ${T.border}`,fontSize:10,color:T.dim,display:'flex',justifyContent:'space-between',flexShrink:0}}>
                    <span>{files.length} files</span>
                    <span>{autoSave?'💾 auto':'manual'}</span>
                  </div>
                </div>
              )}

              {/* GLOBAL SEARCH */}
              {panel==='search'&&(
                <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
                  <div style={{padding:'10px 12px 8px',flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Global Search</div>
                    <input value={gSearch} onChange={e=>setGSearch(e.target.value)} placeholder="Search in all files..." style={{...inp,marginBottom:6}}/>
                    <input value={gReplace} onChange={e=>setGReplace(e.target.value)} placeholder="Replace with..." style={{...inp,marginBottom:6}}/>
                    {gReplace&&<button onClick={()=>{if(!gSearch)return;setFiles(p=>p.map(f=>({...f,content:f.content.split(gSearch).join(gReplace)})));notify(`Replaced all "${gSearch}"→"${gReplace}"`,'success');}} style={{...btn({background:T.accent,color:'#fff',width:'100%'})}}>Replace All</button>}
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:'0 8px'}}>
                    {gSearch&&files.map(f=>{
                      const count=f.content.split(gSearch).length-1;
                      if(!count) return null;
                      return (
                        <div key={f.id} onClick={()=>openFile(f)} className="hov" style={{padding:'6px 8px',borderRadius:4,cursor:'pointer',marginBottom:4}}>
                          <div style={{fontSize:12,color:T.text,display:'flex',justifyContent:'space-between'}}>
                            <span>{LANGS[f.lang]?.icon} {f.name}</span>
                            <span style={{background:T.accent,color:'#fff',borderRadius:10,padding:'0 6px',fontSize:10}}>{count}</span>
                          </div>
                          {f.content.split('\n').filter(l=>l.includes(gSearch)).slice(0,2).map((l,i)=>(
                            <div key={i} style={{fontSize:10,color:T.dim,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{l.trim().slice(0,60)}</div>
                          ))}
                        </div>
                      );
                    })}
                    {gSearch&&!files.some(f=>f.content.includes(gSearch))&&<div style={{color:T.dim,fontSize:12,padding:20,textAlign:'center'}}>No results</div>}
                  </div>
                </div>
              )}

              {/* GIT */}
              {panel==='git'&&(
                <div style={{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto'}}>
                  <div style={{padding:'10px 12px 8px',flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Source Control</div>
                    <input value={ghCwd} onChange={e=>setGhCwd(e.target.value)} placeholder="/workspaces/project" style={{...inp,marginBottom:6}}/>
                  </div>
                  <div style={{padding:'0 10px 10px',display:'flex',flexDirection:'column',gap:6}}>
                    {/* Quick actions */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                      {[['status','📋'],['log','📜'],['diff','🔍'],['pull','⬇'],['push','⬆'],['branch','🌿']].map(([op,icon])=>(
                        <button key={op} onClick={()=>doGit(op)} disabled={ghLoading}
                          style={{...btn({background:T.tab,color:T.text})}}>
                          {ghLoading?<span className="spin">⟳</span>:icon} {op}
                        </button>
                      ))}
                    </div>
                    {/* Clone */}
                    <div style={{fontSize:11,color:T.dim,marginTop:4}}>Clone repo:</div>
                    <input value={ghCloneUrl} onChange={e=>setGhCloneUrl(e.target.value)} placeholder="https://github.com/user/repo" style={{...inp}}/>
                    <button onClick={()=>doGit('clone',{url:ghCloneUrl})} style={{...btn({background:T.accent,color:'#fff'})}}>⬇ Clone</button>
                    {/* Commit */}
                    <div style={{fontSize:11,color:T.dim,marginTop:4}}>Commit:</div>
                    <input value={ghCommitMsg} onChange={e=>setGhCommitMsg(e.target.value)} placeholder="Commit message..." style={{...inp}}/>
                    <div style={{display:'flex',gap:5}}>
                      <button onClick={()=>doGit('add')} style={{flex:1,...btn({background:T.tab,color:T.text})}}>+ Stage</button>
                      <button onClick={()=>doGit('commit',{message:ghCommitMsg})} style={{flex:1,...btn({background:'#238636',color:'#fff'})}}>✓ Commit</button>
                    </div>
                    <div style={{fontSize:11,color:T.dim}}>Branch:</div>
                    <input value={ghBranch} onChange={e=>setGhBranch(e.target.value)} placeholder="main" style={{...inp}}/>
                    <button onClick={()=>doGit('checkout',{branch:ghBranch})} style={{...btn({background:T.tab,color:T.text})}}>⎇ Checkout</button>
                    {/* Output */}
                    {ghOutput&&(
                      <textarea readOnly value={ghOutput} rows={6}
                        style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:11,marginTop:4}}/>
                    )}
                  </div>
                </div>
              )}

              {/* EXTENSIONS */}
              {panel==='ext'&&(
                <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
                  <div style={{padding:'10px 12px 6px',flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>Extensions</div>
                    <input placeholder="🔍 Search..." style={{...inp}}/>
                  </div>
                  <div style={{flex:1,overflowY:'auto'}}>
                    {[
                      {i:'✨',n:'Prettier',d:'Formatter',on:true},{i:'🔍',n:'ESLint',d:'JS Linter',on:true},
                      {i:'🐍',n:'Python',d:'Python support',on:true},{i:'☕',n:'Java',d:'Java support',on:true},
                      {i:'⚙️',n:'C/C++',d:'C/C++ IntelliSense',on:true},{i:'🦀',n:'Rust Analyzer',d:'Rust support',on:true},
                      {i:'🐹',n:'Go',d:'Go support',on:true},{i:'🤖',n:'AI Copilot',d:'Claude AI',on:true},
                      {i:'🌿',n:'GitLens',d:'Git supercharged',on:false},{i:'🌈',n:'indent-rainbow',d:'Colorize indent',on:true},
                      {i:'🔵',n:'Bracket Pair',d:'Colorize brackets',on:true},{i:'⚡',n:'Thunder Client',d:'REST API client',on:true},
                      {i:'🐳',n:'Docker',d:'Docker support',on:false},{i:'📊',n:'CSV Viewer',d:'View CSV files',on:true},
                      {i:'🎨',n:'Color Highlight',d:'Highlight colors',on:true},{i:'📌',n:'Todo Highlight',d:'TODO/FIXME',on:true},
                    ].map((e,i)=>(
                      <div key={i} style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',gap:10,alignItems:'flex-start'}}>
                        <span style={{fontSize:22,flexShrink:0}}>{e.i}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:600,color:T.text}}>{e.n}</div>
                          <div style={{fontSize:10,color:T.dim}}>{e.d}</div>
                        </div>
                        <div style={{width:8,height:8,borderRadius:'50%',background:e.on?'#4ec9b0':'#555',marginTop:4,flexShrink:0}}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEBUG */}
              {panel==='debug'&&(
                <div style={{padding:12,display:'flex',flexDirection:'column',gap:10,height:'100%',overflowY:'auto'}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase'}}>Debug</div>
                  <button onClick={()=>runCode()} style={{...btn({background:'#4ec9b0',color:'#000',fontWeight:700})}}>▶ Start Debugging</button>
                  {[['BREAKPOINTS (0)','No breakpoints set'],['VARIABLES','Not paused'],['CALL STACK','Not paused'],['WATCH','']].map(([title,content])=>(
                    <div key={title} style={{background:T.bg,borderRadius:6,padding:10,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:11,color:T.dim,marginBottom:6}}>{title}</div>
                      {content?<div style={{color:T.dim,fontSize:11}}>{content}</div>:<input placeholder="+ Add expression..." style={{...inp,fontSize:11}}/>}
                    </div>
                  ))}
                </div>
              )}

              {/* SETTINGS */}
              {panel==='settings'&&(
                <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:'uppercase'}}>Settings</div>

                  {/* API Keys */}
                  <div style={{background:T.bg,padding:10,borderRadius:7,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.accent,marginBottom:8}}>🔑 API Keys</div>
                    <div style={{fontSize:10,color:T.dim,marginBottom:5}}>Anthropic API Key (for AI Copilot):</div>
                    <div style={{display:'flex',gap:4,marginBottom:4}}>
                      <input type={showApiKey?'text':'password'} value={apiKey}
                        onChange={e=>{setApiKey(e.target.value);LS.setStr('cdr_apikey',e.target.value);}}
                        placeholder="sk-ant-api03-..." style={{...inp,flex:1,fontSize:10}}/>
                      <button onClick={()=>setShowApiKey(v=>!v)} style={{...btn({background:T.tab,color:T.dim,padding:'4px 8px'})}}>{showApiKey?'🙈':'👁'}</button>
                    </div>
                    {apiKey?<div style={{fontSize:10,color:'#4ec9b0'}}>✓ AI Copilot ready</div>:<div style={{fontSize:10,color:'#f48771'}}>✗ Get key: platform.anthropic.com</div>}

                    <div style={{fontSize:10,color:T.dim,marginBottom:5,marginTop:10}}>GitHub Token (for git push):</div>
                    <div style={{display:'flex',gap:4,marginBottom:4}}>
                      <input type={showGhToken?'text':'password'} value={ghToken}
                        onChange={e=>{setGhToken(e.target.value);LS.setStr('cdr_ghtoken',e.target.value);}}
                        placeholder="ghp_..." style={{...inp,flex:1,fontSize:10}}/>
                      <button onClick={()=>setShowGhToken(v=>!v)} style={{...btn({background:T.tab,color:T.dim,padding:'4px 8px'})}}>{showGhToken?'🙈':'👁'}</button>
                    </div>
                    {ghToken?<div style={{fontSize:10,color:'#4ec9b0'}}>✓ GitHub ready</div>:<div style={{fontSize:10,color:'#e5c07b'}}>⚠ Get token: github.com/settings/tokens</div>}
                  </div>

                  {/* Theme */}
                  <div>
                    <label style={{fontSize:11,color:T.dim,display:'block',marginBottom:5}}>Color Theme</label>
                    <select value={themeName} onChange={e=>setThemeName(e.target.value)} style={{...inp}}>
                      {Object.keys(THEMES).map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Theme preview */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {Object.entries(THEMES).map(([name,theme])=>(
                      <div key={name} onClick={()=>setThemeName(name)}
                        style={{width:28,height:28,borderRadius:5,background:theme.bg,border:`2px solid ${themeName===name?T.accent:T.border}`,cursor:'pointer',position:'relative',overflow:'hidden'}}
                        title={name}>
                        <div style={{position:'absolute',bottom:0,left:0,right:0,height:6,background:theme.status}}/>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{fontSize:11,color:T.dim,display:'block',marginBottom:5}}>Font Size: <span style={{color:T.accent}}>{fontSize}px</span></label>
                    <input type="range" min={10} max={24} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{width:'100%',accentColor:T.accent}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:T.dim,display:'block',marginBottom:5}}>Tab Size: <span style={{color:T.accent}}>{tabSize}</span></label>
                    <input type="range" min={2} max={8} step={2} value={tabSize} onChange={e=>setTabSize(+e.target.value)} style={{width:'100%',accentColor:T.accent}}/>
                  </div>

                  {[
                    ['Word Wrap',      wordWrap==='on',    ()=>setWordWrap(v=>v==='on'?'off':'on')],
                    ['Minimap',        minimap,            ()=>setMinimap(v=>!v)],
                    ['Line Numbers',   lineNums==='on',    ()=>setLineNums(v=>v==='on'?'off':'on')],
                    ['Sticky Scroll',  stickyScroll,       ()=>setStickyScroll(v=>!v)],
                    ['Breadcrumbs',    breadcrumbs,        ()=>setBreadcrumbs(v=>!v)],
                    ['Auto Save',      autoSave,           ()=>setAutoSave(v=>!v)],
                    ['Format on Save', formatOnSave,       ()=>setFormatOnSave(v=>!v)],
                    ['Vim Mode',       vimMode,            ()=>setVimMode(v=>!v)],
                    ['Font Ligatures', ligatures,          ()=>setLigatures(v=>!v)],
                  ].map(([label,val,fn])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:T.text}}>{label}</span>
                      <Toggle val={val} onChange={fn} T={T}/>
                    </div>
                  ))}

                  <div>
                    <label style={{fontSize:11,color:T.dim,display:'block',marginBottom:5}}>Whitespace</label>
                    <select value={renderWS} onChange={e=>setRenderWS(e.target.value)} style={{...inp}}>
                      {['none','selection','all','boundary','trailing'].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>

                  {/* Server info */}
                  <div style={{background:T.bg,padding:10,borderRadius:7,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.accent,marginBottom:6}}>🖥 Server</div>
                    <div style={{fontSize:10,color:T.dim,wordBreak:'break-all'}}>{EXEC}</div>
                    <button onClick={()=>{fetch(`${EXEC}/health`).then(r=>r.json()).then(d=>notify(`Server OK — ${d.node}`,'success')).catch(()=>notify('Server unreachable','error'));}}
                      style={{...btn({background:T.tab,color:T.text,fontSize:11,marginTop:6,width:'100%'})}}>🔍 Test Connection</button>
                    <button onClick={connectWS} style={{...btn({background:wsConnected?'#4ec9b0':T.accent,color:'#fff',fontSize:11,marginTop:4,width:'100%'})}}>
                      {wsConnected?'🔌 WS Connected':'🔌 Connect WebSocket'}
                    </button>
                  </div>

                  {/* Quick tools */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                    {[['🔍 Regex',()=>setActiveModal('regex')],['📋 JSON',()=>setActiveModal('json')],['🔐 Base64',()=>setActiveModal('base64')],['🎨 Color',()=>setActiveModal('color')],['🔄 Diff',()=>setActiveModal('diff')],['📊 Stats',()=>setActiveModal('stats')]].map(([l,f])=>(
                      <button key={l} onClick={f} style={{...btn({background:T.tab,color:T.text,padding:'7px 4px',fontSize:11})}}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar resize handle */}
            <div className={`resize-h${isResizingSB?' active':''}`}
              onMouseDown={startResizeSB} onTouchStart={startResizeSB}
              style={{width:4,background:'transparent',flexShrink:0,cursor:'col-resize',transition:'background .15s',zIndex:10}}
              onMouseEnter={e=>e.currentTarget.style.background=T.accent}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>
          </>
        )}

        {/* ── EDITOR + BOTTOM PANEL ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>

          {/* Editor area */}
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>

            {/* Live HTML Preview */}
            {showPreview&&activeTab?.lang==='html'&&(
              <div style={{width:'42%',borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',flexShrink:0}}>
                <div style={{height:28,background:T.sb,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 10px',gap:8,flexShrink:0}}>
                  <span style={{fontSize:11,color:T.dim,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>🌐 Live Preview</span>
                  <button onClick={()=>setShowPreview(false)} style={{marginLeft:'auto',background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:16}}>×</button>
                </div>
                <iframe srcDoc={activeTab.content} style={{flex:1,border:'none',background:'#fff'}} sandbox="allow-scripts allow-same-origin" title="preview"/>
              </div>
            )}

            {/* Monaco Editor(s) */}
            <div style={{flex:1,display:'flex',overflow:'hidden'}}>
              {activeTab?(
                <>
                  <div style={{flex:1,overflow:'hidden'}}>
                    <Editor
                      key={`${activeTab.id}-${themeName}`}
                      height="100%"
                      language={LANGS[activeTab.lang]?.monaco||'plaintext'}
                      value={activeTab.content}
                      theme={T.vs}
                      onChange={val=>updateContent(val||'')}
                      onMount={handleEditorMount}
                      options={{
                        fontSize,tabSize,
                        fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",
                        fontLigatures:ligatures,
                        wordWrap,minimap:{enabled:minimap},
                        lineNumbers:lineNums,
                        scrollBeyondLastLine:false,
                        automaticLayout:true,
                        insertSpaces:true,detectIndentation:true,
                        bracketPairColorization:{enabled:true},
                        guides:{bracketPairs:true,indentation:true},
                        suggest:{enabled:true,showSnippets:true},
                        quickSuggestions:{other:true,comments:false,strings:true},
                        parameterHints:{enabled:true},
                        formatOnPaste:true,
                        cursorBlinking:'smooth',cursorSmoothCaretAnimation:'on',
                        smoothScrolling:true,mouseWheelZoom:true,
                        renderWhitespace:renderWS,
                        showFoldingControls:'always',folding:true,
                        links:true,colorDecorators:true,
                        renderLineHighlight:'all',
                        occurrencesHighlight:'multiFile',
                        selectionHighlight:true,contextmenu:true,
                        multiCursorModifier:'ctrlCmd',
                        accessibilitySupport:'off',
                        stickyScroll:{enabled:stickyScroll},
                        inlayHints:{enabled:'on'},
                        padding:{top:12,bottom:12},
                      }}
                    />
                  </div>

                  {/* Split Editor */}
                  {splitMode&&(
                    <>
                      <div style={{width:4,background:T.border,flexShrink:0,cursor:'col-resize'}}/>
                      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
                        <div style={{height:28,background:T.sb,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 10px',gap:6,flexShrink:0}}>
                          <span style={{fontSize:11,color:T.dim}}>Split:</span>
                          <select value={splitTabId||''} onChange={e=>setSplitTabId(+e.target.value||null)}
                            style={{flex:1,background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:3,padding:'2px 6px',fontSize:11}}>
                            <option value=''>Select file...</option>
                            {files.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                          <button onClick={()=>setSplitMode(false)} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:16}}>×</button>
                        </div>
                        {splitTab?(
                          <Editor
                            key={`split-${splitTab.id}-${themeName}`}
                            height="100%"
                            language={LANGS[splitTab.lang]?.monaco||'plaintext'}
                            value={splitTab.content}
                            theme={T.vs}
                            onChange={val=>setFiles(p=>p.map(f=>f.id===splitTab.id?{...f,content:val||''}:f))}
                            options={{fontSize,tabSize,fontFamily:"'JetBrains Mono',Consolas,monospace",wordWrap,minimap:{enabled:false},lineNumbers:lineNums,automaticLayout:true,bracketPairColorization:{enabled:true},scrollBeyondLastLine:false}}
                          />
                        ):<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:T.dim,fontSize:12}}>Select a file above</div>}
                      </div>
                    </>
                  )}
                </>
              ):(
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:T.dim,gap:16}}>
                  <span style={{fontSize:72,filter:'drop-shadow(0 0 20px #007acc44)'}}>⚡</span>
                  <div style={{fontSize:26,fontWeight:700,color:T.text}}>CodeDroid Pro v2.0</div>
                  <div style={{fontSize:13,color:T.dim,textAlign:'center',lineHeight:2,maxWidth:360}}>
                    Real VS Code on Android<br/>
                    Monaco · Railway Compiler · Claude AI<br/>
                    20 Languages · AI Agent · Voice Coding
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                    {[
                      ['📂 Open File',()=>{setPanel('explorer');setSidebarOpen(true);}],
                      ['📄 New File',()=>setShowNewFile(true)],
                      ['🦾 AI Agent',()=>setAgentOpen(true)],
                      ['⌨ Commands',()=>{setCmdOpen(true);setTimeout(()=>cmdRef.current?.focus(),50);}],
                    ].map(([l,f])=>(
                      <button key={l} onClick={f} style={{...btn({background:T.tab,color:T.text,padding:'12px 16px',fontSize:13,fontWeight:600})}}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTTOM PANEL ── */}
          <div style={{background:T.term,borderTop:`1px solid ${T.border}`,flexShrink:0,display:'flex',flexDirection:'column',height:termOpen?termH:32,overflow:'hidden',position:'relative'}}>

            {/* Resize handle */}
            <div style={{position:'absolute',top:0,left:0,right:0,height:4,cursor:'row-resize',zIndex:10}}
              onMouseDown={startResizeBP} onTouchStart={startResizeBP}
              onMouseEnter={e=>e.currentTarget.style.background=T.accent}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>

            {/* Panel tabs */}
            <div style={{display:'flex',alignItems:'center',height:32,flexShrink:0,borderBottom:termOpen?`1px solid ${T.border}`:'none',userSelect:'none',paddingTop:2}}>
              {[
                {id:'terminal',label:'⬛ Terminal'},
                {id:'rest',    label:'⚡ REST'},
                {id:'problems',label:`⚠ Problems${problems.length?` (${problems.length})`:''}` },
                {id:'output',  label:'📤 Output'},
              ].map(p=>(
                <button key={p.id} onClick={()=>{setBottomPanel(p.id);setTermOpen(true);}}
                  style={{padding:'0 12px',height:'100%',background:'none',border:'none',cursor:'pointer',fontSize:11,fontWeight:600,color:bottomPanel===p.id?T.text:T.dim,borderBottom:`2px solid ${bottomPanel===p.id?T.accent:'transparent'}`,transition:'all .15s'}}>
                  {p.label}
                </button>
              ))}
              <div style={{flex:1}}/>
              {execStats&&bottomPanel==='terminal'&&<span style={{fontSize:10,color:T.dim,padding:'0 8px'}}>⚡ {execStats.lang} · {execStats.time}ms · exit({execStats.exitCode})</span>}
              {bottomPanel==='terminal'&&(
                <>
                  <button onClick={()=>setShowStdin(v=>!v)} style={{background:'none',border:'none',color:showStdin?T.accent:T.dim,cursor:'pointer',fontSize:11,padding:'0 6px'}} title="stdin">⌨ stdin</button>
                  <button onClick={()=>setLogs([{t:'sys',s:'🧹 Cleared'},{t:'div',s:''}])} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:11,padding:'0 6px'}}>⌧</button>
                </>
              )}
              <button onClick={()=>setTermH(h=>Math.min(h+60,600))} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:11,padding:'0 5px'}}>⬆</button>
              <button onClick={()=>setTermH(h=>Math.max(h-60,80))} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:11,padding:'0 5px'}}>⬇</button>
              <button onClick={()=>setTermOpen(v=>!v)} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:11,padding:'0 8px'}}>{termOpen?'▼':'▲'}</button>
            </div>

            {termOpen&&(
              <>
                {showStdin&&bottomPanel==='terminal'&&(
                  <div style={{padding:'4px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                    <span style={{fontSize:11,color:T.dim,flexShrink:0}}>stdin:</span>
                    <input value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="Input for program..."
                      style={{...inp}} />
                    <button onClick={()=>setStdin('')} style={{...btn({background:T.tab,color:T.dim,padding:'4px 8px'})}}>×</button>
                  </div>
                )}

                {/* TERMINAL */}
                {bottomPanel==='terminal'&&(
                  <>
                    {/* Terminal tabs */}
                    <div style={{display:'flex',background:T.bg,borderBottom:`1px solid ${T.border}`,height:24,alignItems:'center',flexShrink:0,overflowX:'auto',scrollbarWidth:'none'}}>
                      {termTabs.map(t=>(
                        <div key={t.id} onClick={()=>setActiveTermTab(t.id)}
                          style={{display:'flex',alignItems:'center',gap:4,padding:'0 10px',height:'100%',fontSize:11,cursor:'pointer',color:activeTermTab===t.id?T.text:T.dim,background:activeTermTab===t.id?T.tab:'transparent',borderRight:`1px solid ${T.border}`,flexShrink:0}}>
                          {t.name}
                          {termTabs.length>1&&<span onClick={e=>{e.stopPropagation();setTermTabs(p=>{const n=p.filter(x=>x.id!==t.id);setActiveTermTab(n[n.length-1]?.id||1);return n;});}} style={{opacity:.5,cursor:'pointer'}}>×</span>}
                        </div>
                      ))}
                      <button onClick={()=>{const id=Date.now();setTermTabs(p=>[...p,{id,name:`bash ${p.length+1}`,logs:[],input:''}]);setActiveTermTab(id);}} style={{padding:'0 8px',background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:16}}>+</button>
                      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'0 8px'}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:wsConnected?'#4ec9b0':'#555'}} title={wsConnected?'WS connected':'WS disconnected'}/>
                        <span style={{fontSize:9,color:T.dim}}>{wsConnected?'live':'http'}</span>
                      </div>
                    </div>

                    {/* Terminal output */}
                    <div ref={termRef} style={{flex:1,overflowY:'auto',padding:'6px 14px 4px',fontSize:13,fontFamily:"'JetBrains Mono',Consolas,monospace"}}>
                      {logs.map((l,i)=>
                        l.t==='div'?<div key={i} style={{borderTop:`1px solid ${T.border}`,margin:'4px 0'}}/>:
                        <div key={i} style={{color:l.t==='err'?'#f48771':l.t==='cmd'?'#9cdcfe':l.t==='info'?'#e5c07b':l.t==='out'?T.text:'#555',whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.7}}>
                          {l.s}
                        </div>
                      )}
                      {isRunning&&<span className="pulse" style={{color:T.accent,fontSize:16}}>█</span>}
                    </div>

                    {/* Terminal input */}
                    <div style={{display:'flex',alignItems:'center',padding:'4px 10px',borderTop:`1px solid ${T.border}`,gap:6,flexShrink:0}}>
                      <span style={{color:T.accent,fontSize:12,flexShrink:0}}>$</span>
                      <input value={termInput} onChange={e=>setTermInput(e.target.value)}
                        onKeyDown={e=>{
                          if(e.key==='Enter'&&termInput.trim()){
                            setTermTabs(p=>p.map(t=>t.id===activeTermTab?{...t,logs:[...t.logs,{t:'cmd',s:`$ ${termInput}`}]}:t));
                            sendWsCmd(termInput);
                            setTermInput('');
                          }
                          if(e.key==='ArrowUp'){const h=termHistory[termHistIdx+1];if(h){setTermInput(h);setTermHistIdx(i=>i+1);}}
                          if(e.key==='ArrowDown'){const h=termHistory[termHistIdx-1];if(h){setTermInput(h);setTermHistIdx(i=>i-1);}else{setTermInput('');setTermHistIdx(-1);}}
                        }}
                        placeholder="Enter command... (↑↓ history)"
                        style={{flex:1,background:'none',border:'none',color:T.text,fontSize:12,outline:'none',fontFamily:"'JetBrains Mono',monospace"}}
                      />
                    </div>
                  </>
                )}

                {/* REST CLIENT */}
                {bottomPanel==='rest'&&(
                  <div style={{flex:1,overflowY:'auto',padding:10,display:'flex',flexDirection:'column',gap:7}}>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <select value={restMethod} onChange={e=>setRestMethod(e.target.value)}
                        style={{...inp,width:90,fontWeight:700,color:restMethod==='GET'?'#4ec9b0':restMethod==='POST'?'#e5c07b':restMethod==='DELETE'?'#f48771':'#9cdcfe'}}>
                        {['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].map(m=><option key={m}>{m}</option>)}
                      </select>
                      <input value={restUrl} onChange={e=>setRestUrl(e.target.value)} placeholder="https://api.example.com/endpoint"
                        style={{...inp,flex:1}} onKeyDown={e=>e.key==='Enter'&&sendRest()}/>
                      <button onClick={sendRest} disabled={restLoading}
                        style={{...btn({background:T.accent,color:'#fff',fontWeight:700,padding:'6px 16px',flexShrink:0})}}>
                        {restLoading?<span className="spin">⟳</span>:'Send'}
                      </button>
                    </div>

                    {/* Tabs */}
                    <div style={{display:'flex',gap:1,flexShrink:0}}>
                      {['headers','body','response','history'].map(t=>(
                        <button key={t} onClick={()=>setRestTab(t)}
                          style={{...btn({background:restTab===t?T.accent:T.tab,color:restTab===t?'#fff':T.dim,padding:'4px 10px',fontSize:11,borderRadius:'4px 4px 0 0'}),textTransform:'capitalize'}}>
                          {t}
                        </button>
                      ))}
                    </div>

                    {restTab==='headers'&&<textarea value={restHeaders} onChange={e=>setRestHeaders(e.target.value)} rows={5} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>}
                    {restTab==='body'&&<textarea value={restBody} onChange={e=>setRestBody(e.target.value)} rows={5} placeholder='{"key": "value"}' style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>}
                    {restTab==='response'&&(
                      <div style={{display:'flex',flexDirection:'column',gap:5,flex:1}}>
                        {restResponse&&<div style={{fontSize:11,fontWeight:700,color:restResponse.status>=200&&restResponse.status<300?'#4ec9b0':'#f48771'}}>
                          {restResponse.status} {restResponse.statusText} {restResponse.time&&`· ${restResponse.time}ms`}
                        </div>}
                        <textarea readOnly value={restResponse?(restResponse.body||restResponse.error||''):'Response will appear here...'} rows={7}
                          style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>
                      </div>
                    )}
                    {restTab==='history'&&(
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        {restHistory.length===0&&<div style={{color:T.dim,fontSize:12,textAlign:'center',padding:20}}>No requests yet</div>}
                        {restHistory.map((h,i)=>(
                          <div key={i} onClick={()=>{setRestMethod(h.method);setRestUrl(h.url);setRestTab('headers');}} className="hov"
                            style={{padding:'6px 10px',borderRadius:5,cursor:'pointer',display:'flex',justifyContent:'space-between',background:T.bg}}>
                            <span style={{fontSize:11,color:T.text}}><span style={{color:h.status<300?'#4ec9b0':'#f48771',fontWeight:700}}>{h.method}</span> {h.url.slice(0,40)}</span>
                            <span style={{fontSize:10,color:T.dim}}>{h.status} · {h.time}ms</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PROBLEMS */}
                {bottomPanel==='problems'&&(
                  <div style={{flex:1,overflowY:'auto',padding:12}}>
                    {problems.length===0?<div style={{color:T.dim,fontSize:12,textAlign:'center',padding:20}}>✓ No problems detected</div>:
                    problems.map((p,i)=>(
                      <div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12,display:'flex',gap:8}}>
                        <span style={{color:p.type==='error'?'#f48771':'#e5c07b'}}>{p.type==='error'?'✗':'⚠'}</span>
                        <span style={{color:T.text,flex:1}}>{p.message}</span>
                        <span style={{color:T.dim,fontSize:10}}>Ln {p.line}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* OUTPUT */}
                {bottomPanel==='output'&&(
                  <div style={{flex:1,overflowY:'auto',padding:12,fontSize:12,color:T.dim,fontFamily:"'JetBrains Mono',monospace"}}>
                    <div>[CodeDroid Pro] Build output appears here...</div>
                    {execStats&&<div style={{color:'#4ec9b0',marginTop:4}}>[Run] {execStats.lang} · {execStats.time}ms · exit({execStats.exitCode})</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        {rightPanel==='copilot'&&(
          <>
            {/* Resize handle */}
            <div style={{width:4,cursor:'col-resize',background:'transparent',flexShrink:0,zIndex:10,transition:'background .15s'}}
              onMouseDown={startResizeRP} onTouchStart={startResizeRP}
              onMouseEnter={e=>e.currentTarget.style.background=T.accent}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>

            <div className="slide-in" style={{width:rightPanelW,background:T.sb,borderLeft:`1px solid ${T.border}`,display:'flex',flexDirection:'column',flexShrink:0}}>
              <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>🤖 AI Copilot</div>
                  <div style={{fontSize:10,color:T.dim}}>Claude AI · {activeTab?.name||'No file'} · {apiKey?'✓ Ready':'✗ No key'}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>setAgentOpen(true)} title="Agent Mode" style={{background:'none',border:'none',color:T.accent,cursor:'pointer',fontSize:16}}>🦾</button>
                  <button onClick={()=>setRightPanel(null)} style={{background:'none',border:'none',color:T.dim,cursor:'pointer',fontSize:20}}>×</button>
                </div>
              </div>

              {/* API key warning */}
              {!apiKey&&(
                <div style={{padding:'8px 12px',background:'#4c1a1a',borderBottom:`1px solid #f48771`,fontSize:11,color:'#f48771',flexShrink:0}}>
                  ⚠️ No API Key! <span onClick={()=>{setPanel('settings');setSidebarOpen(true);setRightPanel(null);}} style={{textDecoration:'underline',cursor:'pointer',color:'#9cdcfe'}}>Settings → API Key</span>
                </div>
              )}

              {/* Quick actions */}
              <div style={{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,display:'flex',flexWrap:'wrap',gap:4,flexShrink:0}}>
                {[
                  ['💡 Explain','Explain this code clearly and simply'],
                  ['🐛 Debug','Find and fix all bugs with explanations'],
                  ['⚡ Optimize','Optimize for performance and memory'],
                  ['📝 Docs','Add comprehensive documentation and comments'],
                  ['🧪 Tests','Generate thorough unit tests'],
                  ['🔄 Refactor','Refactor and improve code structure'],
                  ['🔍 Review','Do a thorough code review with suggestions'],
                  ['🚀 Improve','How can I make this code production-ready?'],
                ].map(([l,p])=>(
                  <button key={l} onClick={()=>askCopilot(p)}
                    style={{background:'none',border:`1px solid ${T.border}`,color:T.text,borderRadius:11,padding:'3px 9px',cursor:'pointer',fontSize:10,transition:'all .15s'}}
                    className="hov">{l}</button>
                ))}
              </div>

              {/* Messages */}
              <div ref={cpRef} style={{flex:1,overflowY:'auto',padding:10,display:'flex',flexDirection:'column',gap:10}}>
                {copilotMsgs.map((msg,i)=>(
                  <div key={i} style={{
                    alignSelf:msg.role==='user'?'flex-end':'flex-start',
                    background:msg.role==='user'?T.accent:(isDark?'#2d2d2d':'#e8e8e8'),
                    color:msg.role==='user'?'#fff':T.text,
                    borderRadius:msg.role==='user'?'14px 14px 2px 14px':'14px 14px 14px 2px',
                    padding:'10px 12px',maxWidth:'95%',fontSize:12,lineHeight:1.7,
                    whiteSpace:'pre-wrap',wordBreak:'break-word',
                    boxShadow:'0 2px 8px rgba(0,0,0,.15)'
                  }}>{msg.text}</div>
                ))}
                {copilotLoading&&(
                  <div style={{alignSelf:'flex-start',background:isDark?'#2d2d2d':'#e8e8e8',borderRadius:'14px 14px 14px 2px',padding:'12px 16px',fontSize:12,color:T.dim}}>
                    <span className="pulse">● ● ●</span>
                  </div>
                )}
              </div>

              {/* Voice input indicator */}
              {voiceActive&&(
                <div style={{padding:'6px 12px',background:'#4c1a1a',borderTop:`1px solid #f48771`,fontSize:11,color:'#f48771',flexShrink:0}}>
                  🎤 Listening: {voiceTranscript||'...speak now...'}
                </div>
              )}

              {/* Input */}
              <div style={{padding:'8px 10px',borderTop:`1px solid ${T.border}`,display:'flex',gap:6,flexShrink:0}}>
                <textarea value={copilotInput} onChange={e=>setCopilotInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askCopilot();}}}
                  placeholder="Ask anything... (Enter=send, Shift+Enter=newline)"
                  rows={2}
                  style={{...inp,flex:1,resize:'none'}}/>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  <button onClick={()=>askCopilot()} disabled={copilotLoading||!copilotInput.trim()}
                    style={{...btn({background:copilotLoading?'#555':T.accent,color:'#fff',padding:'0 10px',fontSize:18}),opacity:copilotInput.trim()?1:.4,flex:1}}>
                    {copilotLoading?<span className="spin" style={{fontSize:14}}>⟳</span>:'↑'}
                  </button>
                  <button onClick={toggleVoice} style={{...btn({background:voiceActive?'#f48771':T.tab,color:voiceActive?'#fff':T.dim,padding:'4px',fontSize:14})}}>🎤</button>
                </div>
              </div>

              <button onClick={()=>setCopilotMsgs([{role:'ai',text:'Chat cleared! How can I help? 🤖'}])}
                style={{margin:'0 10px 8px',...btn({background:'none',color:T.dim,fontSize:11,border:`1px solid ${T.border}`})}}>
                🗑 Clear conversation
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══ CONTEXT MENU ══ */}
      {ctxMenu&&(
        <div style={{position:'fixed',top:ctxMenu.y,left:ctxMenu.x,zIndex:999,background:T.sb,border:`1px solid ${T.border}`,borderRadius:8,padding:'4px 0',minWidth:200,boxShadow:'0 12px 40px rgba(0,0,0,.6)'}}>
          {(ctxMenu.tab?[
            ['▶ Run',()=>runCode()],
            ['⟛ Split',()=>{setSplitMode(true);setSplitTabId(ctxMenu.tab.id);}],
            ['⎘ Duplicate',()=>duplicateFile(ctxMenu.tab)],
            ['─',null],
            ['🗑 Close',()=>closeTab(null,ctxMenu.tab.id)],
          ]:ctxMenu.file?[
            ['📂 Open',()=>openFile(ctxMenu.file)],
            ['⟛ Open in Split',()=>{setSplitMode(true);setSplitTabId(ctxMenu.file.id);}],
            ['⎘ Duplicate',()=>duplicateFile(ctxMenu.file)],
            ['📊 Stats',()=>setActiveModal('stats')],
            ['─',null],
            ['🗑 Delete',()=>deleteFile(null,ctxMenu.file.id)],
          ]:[]).map(([l,f],i)=>
            l==='─'?<div key={i} style={{borderTop:`1px solid ${T.border}`,margin:'3px 0'}}/>:
            <div key={i} className="ctx-item" onClick={()=>{setCtxMenu(null);f&&f();}}
              style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:T.text}}>{l}</div>
          )}
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* PACKAGES */}
      <Modal open={activeModal==='packages'} onClose={()=>setActiveModal(null)} title="📦 Package Manager" w={500} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',gap:6}}>
            {['python','javascript','typescript'].map(l=>(
              <button key={l} onClick={()=>setPkgLang(l)}
                style={{...btn({background:pkgLang===l?T.accent:T.tab,color:pkgLang===l?'#fff':T.text,flex:1})}}>
                {LANGS[l]?.icon} {l}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:6}}>
            <input value={pkgInput} onChange={e=>setPkgInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&installPkg()}
              placeholder={pkgLang==='python'?'numpy pandas requests flask...':'react axios lodash...'}
              style={{...inp,flex:1}}/>
            <button onClick={installPkg} disabled={pkgLoading||!pkgInput.trim()}
              style={{...btn({background:T.accent,color:'#fff',fontWeight:700,padding:'6px 16px',flexShrink:0})}}>
              {pkgLoading?<span className="spin">⟳</span>:'Install'}
            </button>
          </div>
          {pkgLog&&<textarea readOnly value={pkgLog} rows={8} style={{...inp,fontFamily:"'JetBrains Mono',monospace",fontSize:11,resize:'vertical'}}/>}
          <div style={{fontSize:11,color:T.dim}}>
            💡 Popular: {pkgLang==='python'?'numpy, pandas, requests, flask, django, matplotlib, scikit-learn':'react, axios, lodash, moment, express, typescript'}
          </div>
        </div>
      </Modal>

      {/* REGEX */}
      <Modal open={activeModal==='regex'} onClose={()=>setActiveModal(null)} title="🔍 Regex Tester" w={700} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',gap:8}}>
            <input value={regexPat} onChange={e=>setRegexPat(e.target.value)} placeholder="Pattern..." style={{...inp,flex:1,fontFamily:"'JetBrains Mono',monospace"}}/>
            <input value={regexFlags} onChange={e=>setRegexFlags(e.target.value)} placeholder="flags" style={{...inp,width:70}}/>
          </div>
          {regexResult.error&&<div style={{color:'#f48771',fontSize:12}}>⚠ {regexResult.error}</div>}
          <textarea value={regexInput} onChange={e=>setRegexInput(e.target.value)} rows={5} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace"}}/>
          <div style={{background:T.bg,padding:12,borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,lineHeight:1.8,fontFamily:"'JetBrains Mono',monospace",whiteSpace:'pre-wrap'}}>
            {regexResult.matches.length===0?regexInput:(() => {
              let last=0; const parts=[];
              regexResult.matches.forEach((m,i)=>{ parts.push(<span key={`t${i}`}>{regexInput.slice(last,m.index)}</span>); parts.push(<mark key={`m${i}`} className="match-hl">{m[0]}</mark>); last=m.index+m[0].length; });
              parts.push(<span key="end">{regexInput.slice(last)}</span>);
              return parts;
            })()}
          </div>
          <div style={{fontSize:12,color:T.dim}}>
            {regexResult.matches.length>0?<span style={{color:'#4ec9b0',fontWeight:700}}>{regexResult.matches.length} match{regexResult.matches.length!==1?'es':''}: {regexResult.matches.map(m=>m[0]).slice(0,10).join(', ')}</span>:<span style={{color:'#f48771'}}>No matches</span>}
          </div>
        </div>
      </Modal>

      {/* JSON */}
      <Modal open={activeModal==='json'} onClose={()=>setActiveModal(null)} title="📋 JSON Tools" w={700} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <textarea value={jsonInput} onChange={e=>setJsonInput(e.target.value)} rows={7} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
          {jsonResult.error&&<div style={{color:'#f48771',fontSize:12}}>⚠ {jsonResult.error}</div>}
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {[
              ['✨ Format',()=>{if(jsonResult.parsed)setJsonInput(JSON.stringify(jsonResult.parsed,null,2));}],
              ['⚡ Minify',()=>{if(jsonResult.parsed)setJsonInput(JSON.stringify(jsonResult.parsed));}],
              ['✓ Validate',()=>notify(jsonResult.error?`Invalid: ${jsonResult.error}`:'✓ Valid JSON!',jsonResult.error?'error':'success')],
              ['📋 Copy',()=>{navigator.clipboard?.writeText(jsonInput);notify('Copied!','success');}],
              ['📝 To File',()=>{if(jsonResult.parsed){const nf={id:Date.now(),name:'data.json',lang:'json',content:jsonInput,modified:false};setFiles(p=>[...p,nf]);openFile(nf);notify('Opened as data.json','success');}}],
              ['🗑 Clear',()=>setJsonInput('')],
            ].map(([l,f])=>(
              <button key={l} onClick={f} style={{...btn({background:T.tab,color:T.text})}}>{l}</button>
            ))}
          </div>
          {jsonResult.parsed&&(
            <div style={{background:T.bg,padding:10,borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,color:T.dim}}>
              Type: {Array.isArray(jsonResult.parsed)?'array':'object'} · Keys: {Array.isArray(jsonResult.parsed)?jsonResult.parsed.length:Object.keys(jsonResult.parsed).length} · Size: {JSON.stringify(jsonResult.parsed).length} chars
            </div>
          )}
        </div>
      </Modal>

      {/* BASE64 */}
      <Modal open={activeModal==='base64'} onClose={()=>setActiveModal(null)} title="🔐 Base64 / Encode Tools" w={600} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',gap:5}}>
            {[['encode','Encode'],['decode','Decode'],['url','URL Encode'],['jwt','JWT Decode']].map(([m,l])=>(
              <button key={m} onClick={()=>setB64Mode(m)} style={{flex:1,...btn({background:b64Mode===m?T.accent:T.tab,color:b64Mode===m?'#fff':T.text})}}>{l}</button>
            ))}
          </div>
          <textarea value={b64Input} onChange={e=>setB64Input(e.target.value)} rows={4} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
          <button onClick={()=>{
            if(b64Mode==='encode') setB64Out(btoa(unescape(encodeURIComponent(b64Input))));
            else if(b64Mode==='decode'){try{setB64Out(decodeURIComponent(escape(atob(b64Input))));}catch{setB64Out('Invalid base64');}}
            else if(b64Mode==='url') setB64Out(encodeURIComponent(b64Input));
            else if(b64Mode==='jwt'){
              try{const[,payload]=b64Input.split('.');const d=JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));setB64Out(JSON.stringify(d,null,2));}
              catch{setB64Out('Invalid JWT');}
            }
          }} style={{...btn({background:T.accent,color:'#fff',fontWeight:700})}}>▶ Process</button>
          {b64Out&&<textarea readOnly value={b64Out} rows={5} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>}
        </div>
      </Modal>

      {/* COLOR PICKER */}
      <Modal open={activeModal==='color'} onClose={()=>setActiveModal(null)} title="🎨 Color Picker" w={400} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:12,alignItems:'center'}}>
          <input type="color" value={colorVal} onChange={e=>setColorVal(e.target.value)} style={{width:140,height:140,border:'none',borderRadius:12,cursor:'pointer',background:'none'}}/>
          <input value={colorVal} onChange={e=>setColorVal(e.target.value)} style={{...inp,textAlign:'center',fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,letterSpacing:2,width:200}}/>
          {colorInfo&&(
            <div style={{width:'100%',display:'flex',flexDirection:'column',gap:7}}>
              {[['HEX',colorInfo.hex],['RGB',colorInfo.rgb],['RGBA',colorInfo.rgba],['HSL',colorInfo.hsl]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
                  <span style={{fontSize:11,color:T.dim,fontWeight:700,width:40}}>{l}</span>
                  <span style={{fontSize:12,color:T.text,fontFamily:"'JetBrains Mono',monospace",flex:1,textAlign:'center'}}>{v}</span>
                  <button onClick={()=>{navigator.clipboard?.writeText(v);notify('Copied!','success');}} style={{...btn({background:'none',color:T.dim,padding:'2px 8px',fontSize:11})}}>📋</button>
                </div>
              ))}
              <div style={{height:50,borderRadius:8,background:`linear-gradient(to right, #000, ${colorInfo.hex}, #fff)`,border:`1px solid ${T.border}`}}/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5}}>
                {['#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ffffff','#888888','#000000'].map(c=>(
                  <div key={c} onClick={()=>setColorVal(c)} style={{height:28,borderRadius:5,background:c,border:`2px solid ${colorVal===c?T.accent:T.border}`,cursor:'pointer'}}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* DIFF VIEWER */}
      <Modal open={activeModal==='diff'} onClose={()=>setActiveModal(null)} title="🔄 Diff Viewer" w={800} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <div style={{fontSize:11,color:T.dim,marginBottom:4}}>Original</div>
              <textarea value={diffOrig} onChange={e=>setDiffOrig(e.target.value)} rows={8} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T.dim,marginBottom:4}}>Modified</div>
              <textarea value={diffMod} onChange={e=>setDiffMod(e.target.value)} rows={8} style={{...inp,resize:'vertical',fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
            </div>
          </div>
          {diffOrig&&diffMod&&(
            <DiffEditor height={200} original={diffOrig} modified={diffMod} theme={T.vs}
              options={{readOnly:true,minimap:{enabled:false},fontSize:12,renderSideBySide:true}}/>
          )}
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{if(activeTab){setDiffOrig(activeTab.content);notify('Loaded as original','info');}}} style={{...btn({background:T.tab,color:T.text})}}>Load Current as Original</button>
            <button onClick={()=>{setDiffOrig('');setDiffMod('');}} style={{...btn({background:T.tab,color:T.dim})}}>Clear</button>
          </div>
        </div>
      </Modal>

      {/* CODE STATS */}
      <Modal open={activeModal==='stats'} onClose={()=>setActiveModal(null)} title="📊 Code Statistics" w={500} T={T}>
        {activeTab?(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[
                ['Lines',activeTab.content.split('\n').length,'#4ec9b0'],
                ['Words',activeTab.content.trim().split(/\s+/).filter(Boolean).length,'#9cdcfe'],
                ['Chars',activeTab.content.length,'#e5c07b'],
                ['Blank',activeTab.content.split('\n').filter(l=>!l.trim()).length,'#858585'],
                ['Code',activeTab.content.split('\n').filter(l=>l.trim()&&!l.trim().startsWith('//')&&!l.trim().startsWith('#')).length,'#ce9178'],
                ['Comments',activeTab.content.split('\n').filter(l=>l.trim().startsWith('//')||l.trim().startsWith('#')).length,'#6a9955'],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:T.bg,padding:14,borderRadius:8,border:`1px solid ${T.border}`,textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:11,color:T.dim,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{background:T.bg,padding:12,borderRadius:8,border:`1px solid ${T.border}`}}>
              {[
                ['File',activeTab.name],
                ['Language',activeTab.lang.toUpperCase()],
                ['Size',`${(activeTab.content.length/1024).toFixed(2)} KB`],
                ['Avg line',`${Math.round(activeTab.content.length/activeTab.content.split('\n').length)} chars`],
                ['Longest',`${Math.max(...activeTab.content.split('\n').map(l=>l.length))} chars`],
                ['Indented',`${activeTab.content.split('\n').filter(l=>l.startsWith('    ')||l.startsWith('\t')).length} lines`],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:T.dim}}>{k}</span>
                  <span style={{color:T.text,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ):<div style={{color:T.dim,textAlign:'center',padding:30}}>Open a file to see statistics</div>}
      </Modal>

      {/* SYSINFO */}
      <Modal open={activeModal==='sysinfo'} onClose={()=>setActiveModal(null)} title="🖥 System Info" w={500} T={T}>
        {sysInfo?(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[
              ['Status',sysInfo.status],
              ['Node.js',sysInfo.node],
              ['Platform',sysInfo.platform],
              ['OS',sysInfo.os||'-'],
              ['CPU',sysInfo.cpu||'-'],
              ['Cores',sysInfo.cores||'-'],
              ['Memory',sysInfo.mem||'-'],
              ['Uptime',sysInfo.uptime||'-'],
              ['Languages',sysInfo.languages?.join(', ')],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:T.bg,borderRadius:5,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:11,color:T.dim}}>{k}</span>
                <span style={{fontSize:11,color:T.text,fontFamily:"'JetBrains Mono',monospace",maxWidth:'60%',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis'}}>{v}</span>
              </div>
            ))}
            {sysInfo.tools&&<textarea readOnly value={sysInfo.tools} rows={6} style={{...inp,fontFamily:"'JetBrains Mono',monospace",fontSize:11,resize:'none'}}/>}
          </div>
        ):<div style={{color:T.dim,textAlign:'center',padding:30}}>Loading system info...</div>}
      </Modal>

      {/* SNIPPETS */}
      <Modal open={snippetModal} onClose={()=>setSnippetModal(false)} title="🧩 Snippet Manager" w={650} T={T}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {Object.entries(SNIPPETS).map(([lang,snips])=>(
            <div key={lang}>
              <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:7,textTransform:'uppercase'}}>{LANGS[lang]?.icon} {lang}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {snips.map((s,i)=>(
                  <div key={i} style={{background:T.bg,padding:9,borderRadius:6,border:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <code style={{color:T.accent,fontSize:12,fontWeight:700}}>{s.p}</code>
                      <span style={{color:T.dim,fontSize:10}}>{s.d}</span>
                    </div>
                    <pre style={{color:T.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",whiteSpace:'pre-wrap',margin:0,maxHeight:60,overflow:'hidden'}}>{s.b}</pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* KEYBINDS */}
      <Modal open={keybindModal} onClose={()=>setKeybindModal(false)} title="⌨ All Keyboard Shortcuts" w={650} T={T}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
          {[
            ['Ctrl+Enter','Run code'],['Ctrl+I','AI Copilot'],['Ctrl+Shift+P','Command Palette'],
            ['Ctrl+Shift+A','AI Agent Mode'],['Ctrl+Shift+V','Voice Coding'],['Ctrl+T','New terminal tab'],
            ['Ctrl+F','Find'],['Ctrl+H','Find & Replace'],['Ctrl+G','Go to line'],
            ['Ctrl+Shift+O','Go to Symbol'],['Ctrl+/','Toggle comment'],['Ctrl+D','Select next'],
            ['Ctrl+Shift+K','Delete line'],['Alt+↑↓','Move line'],['Ctrl+\\','Split editor'],
            ['Ctrl+B','Sidebar'],['Ctrl+`','Terminal'],['Ctrl+Shift+Z','Zen Mode'],
            ['Ctrl+Shift+G','Git panel'],['Ctrl+W','Close tab'],['Ctrl+S','Save'],
            ['Ctrl+N','New file'],['Shift+Alt+F','Format'],['Ctrl+Space','IntelliSense'],
            ['Ctrl+Click','Multi-cursor'],['Alt+Click','Add cursor'],['Ctrl+A','Select all'],
            ['F2','Rename symbol'],['F12','Go to definition'],['Ctrl+Z','Undo'],['Ctrl+Y','Redo'],
          ].map(([k,d])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 9px',background:T.bg,borderRadius:4,gap:6}}>
              <code style={{color:isDark?'#569cd6':'#0000ff',background:T.sb,padding:'1px 5px',borderRadius:3,fontSize:9,flexShrink:0}}>{k}</code>
              <span style={{color:T.dim,fontSize:11,textAlign:'right'}}>{d}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* ══ BOTTOM NAV ══ */}
      {!zenMode&&(
        <div style={{height:48,background:T.sb,borderTop:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'space-around',flexShrink:0}}>
          {[
            {icon:'📂',label:'Files',fn:()=>{setPanel('explorer');setSidebarOpen(v=>panel!=='explorer'?true:!v);}},
            {icon:'🔍',label:'Search',fn:()=>{setPanel('search');setSidebarOpen(v=>panel!=='search'?true:!v);}},
            {icon:isRunning?'⟳':'▶',label:'Run',fn:runCode,run:true},
            {icon:'🤖',label:'AI',fn:()=>setRightPanel(p=>p==='copilot'?null:'copilot')},
            {icon:'🦾',label:'Agent',fn:()=>setAgentOpen(true)},
            {icon:'⚡',label:'REST',fn:()=>{setBottomPanel('rest');setTermOpen(true);}},
            {icon:'⚙️',label:'Settings',fn:()=>{setPanel('settings');setSidebarOpen(true);}},
          ].map(btn=>(
            <button key={btn.label} onClick={btn.fn}
              disabled={btn.run&&(!activeTab||isRunning||!LANGS[activeTab?.lang]?.run)}
              style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'none',border:'none',cursor:'pointer',padding:'4px 0',height:'100%',color:T.dim,opacity:btn.run&&(!activeTab||!LANGS[activeTab?.lang]?.run)?0.4:1,transition:'color .15s'}}>
              <span style={{fontSize:btn.run?19:15}} className={btn.run&&isRunning?'spin':''}>{btn.icon}</span>
              <span style={{fontSize:9,fontWeight:600,letterSpacing:.5}}>{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ STATUS BAR ══ */}
      <div style={{height:22,background:T.status,display:'flex',alignItems:'center',padding:'0 12px',gap:12,fontSize:11,flexShrink:0,color:'rgba(255,255,255,0.9)',userSelect:'none'}}>
        <span>🌿 main</span>
        {activeTab&&(
          <>
            <span style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:LANGS[activeTab.lang]?.color||'#888'}}/>
              {activeTab.lang.toUpperCase()}
            </span>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{activeTab.content.split('\n').length} lines</span>
            {LANGS[activeTab.lang]?.run&&<span>⚡ Railway</span>}
            {activeTab.modified&&<span style={{color:'#e5c07b'}}>● Modified</span>}
          </>
        )}
        <span style={{marginLeft:'auto',display:'flex',gap:10}}>
          {autoSave&&<span>💾</span>}
          {vimMode&&<span>VIM</span>}
          {zenMode&&<span>🧘</span>}
          {voiceActive&&<span style={{color:'#f48771'}}>🎤</span>}
          <span style={{width:6,height:6,borderRadius:'50%',background:wsConnected?'#4ec9b0':'#555',display:'inline-block',margin:'0 2px'}}/>
          <span>{themeName}</span>
          <span>Monaco</span>
          <span>UTF-8</span>
        </span>
      </div>
    </div>
  );
}
