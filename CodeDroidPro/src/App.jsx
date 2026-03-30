import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ CODEDROID ULTRA — The Most Powerful Mobile IDE Ever Built
// Features: Monaco Engine · Real Compiler · AI Copilot · xterm Terminal
//           Command Palette · Split Editor · Live Preview · Git Panel
//           Debugger · REST Client · Regex Tester · JSON Tools · Diff Viewer
//           15 Themes · Vim Mode · Snippets · Bookmarks · Pomodoro · and MORE
// ═══════════════════════════════════════════════════════════════════════════════

const VERSION = "ULTRA 1.0";
const EXEC_SERVER = "https://codedriod-production.up.railway.app";

// ─── LANGUAGE CONFIG ──────────────────────────────────────────────────────────
const LANGS = {
  python:     { icon:"🐍", color:"#3572A5", piston:"python",      ver:"3.10.0",  monaco:"python",     ext:"py",   comment:"#" },
  c:          { icon:"⚙️", color:"#555555", piston:"c",           ver:"10.2.0",  monaco:"c",          ext:"c",    comment:"//" },
  cpp:        { icon:"⚙️", color:"#f34b7d", piston:"c++",         ver:"10.2.0",  monaco:"cpp",        ext:"cpp",  comment:"//" },
  java:       { icon:"☕", color:"#b07219", piston:"java",         ver:"15.0.2",  monaco:"java",       ext:"java", comment:"//" },
  javascript: { icon:"🟨", color:"#f1e05a", piston:"javascript",  ver:"18.15.0", monaco:"javascript", ext:"js",   comment:"//" },
  typescript: { icon:"🔷", color:"#2b7489", piston:"typescript",  ver:"5.0.3",   monaco:"typescript", ext:"ts",   comment:"//" },
  rust:       { icon:"🦀", color:"#dea584", piston:"rust",        ver:"1.50.0",  monaco:"rust",       ext:"rs",   comment:"//" },
  golang:     { icon:"🐹", color:"#00ADD8", piston:"go",          ver:"1.16.2",  monaco:"go",         ext:"go",   comment:"//" },
  php:        { icon:"🐘", color:"#4F5D95", piston:"php",         ver:"8.2.3",   monaco:"php",        ext:"php",  comment:"//" },
  ruby:       { icon:"💎", color:"#701516", piston:"ruby",        ver:"3.0.1",   monaco:"ruby",       ext:"rb",   comment:"#" },
  csharp:     { icon:"🔵", color:"#178600", piston:"csharp",      ver:"6.12.0",  monaco:"csharp",     ext:"cs",   comment:"//" },
  kotlin:     { icon:"🎯", color:"#A97BFF", piston:"kotlin",      ver:"1.8.20",  monaco:"kotlin",     ext:"kt",   comment:"//" },
  swift:      { icon:"🍎", color:"#F05138", piston:"swift",       ver:"5.3.3",   monaco:"swift",      ext:"swift",comment:"//" },
  bash:       { icon:"💻", color:"#89e051", piston:"bash",        ver:"5.2.0",   monaco:"shell",      ext:"sh",   comment:"#" },
  html:       { icon:"🌐", color:"#e34c26", piston:null,          ver:null,      monaco:"html",       ext:"html", comment:"<!--" },
  css:        { icon:"🎨", color:"#563d7c", piston:null,          ver:null,      monaco:"css",        ext:"css",  comment:"/*" },
  json:       { icon:"📋", color:"#292929", piston:null,          ver:null,      monaco:"json",       ext:"json", comment:null },
  markdown:   { icon:"📝", color:"#083fa1", piston:null,          ver:null,      monaco:"markdown",   ext:"md",   comment:null },
  sql:        { icon:"🗄️", color:"#e38c00", piston:"sqlite3",    ver:"3.36.0",  monaco:"sql",        ext:"sql",  comment:"--" },
  text:       { icon:"📄", color:"#666",    piston:null,          ver:null,      monaco:"plaintext",  ext:"txt",  comment:null },
};

const EXT_MAP = {
  py:"python",c:"c",cpp:"cpp",h:"c",hpp:"cpp",java:"java",js:"javascript",
  ts:"typescript",html:"html",css:"css",txt:"text",json:"json",md:"markdown",
  rs:"rust",go:"golang",rb:"ruby",php:"php",cs:"csharp",kt:"kotlin",
  swift:"swift",sh:"bash",sql:"sql",jsx:"javascript",tsx:"typescript",
};

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  "Dark+" :        { monaco:"vs-dark",   ui:"dark",  bg:"#1e1e1e", sb:"#252526", border:"#111", text:"#d4d4d4", dim:"#858585", accent:"#007acc", tab:"#2d2d2d", terminal:"#141414", status:"#007acc" },
  "Light+" :       { monaco:"vs-light",  ui:"light", bg:"#ffffff", sb:"#f3f3f3", border:"#e0e0e0", text:"#1f1f1f", dim:"#717171", accent:"#005fb8", tab:"#ececec", terminal:"#f5f5f5", status:"#005fb8" },
  "HC Black":      { monaco:"hc-black",  ui:"dark",  bg:"#000000", sb:"#0a0a0a", border:"#6fc3df", text:"#ffffff", dim:"#aaaaaa", accent:"#6fc3df", tab:"#111", terminal:"#000", status:"#000" },
  "Dracula":       { monaco:"vs-dark",   ui:"dark",  bg:"#282a36", sb:"#21222c", border:"#191a21", text:"#f8f8f2", dim:"#6272a4", accent:"#bd93f9", tab:"#343746", terminal:"#1e1f29", status:"#bd93f9" },
  "Monokai":       { monaco:"vs-dark",   ui:"dark",  bg:"#272822", sb:"#1e1f1c", border:"#1a1a17", text:"#f8f8f2", dim:"#75715e", accent:"#a6e22e", tab:"#3e3d32", terminal:"#1a1b18", status:"#75715e" },
  "One Dark":      { monaco:"vs-dark",   ui:"dark",  bg:"#282c34", sb:"#21252b", border:"#181a1f", text:"#abb2bf", dim:"#5c6370", accent:"#61afef", tab:"#2c313a", terminal:"#1d2026", status:"#61afef" },
  "Nord":          { monaco:"vs-dark",   ui:"dark",  bg:"#2e3440", sb:"#272c36", border:"#1a1e27", text:"#d8dee9", dim:"#616e88", accent:"#88c0d0", tab:"#3b4252", terminal:"#242933", status:"#5e81ac" },
  "Tokyo Night":   { monaco:"vs-dark",   ui:"dark",  bg:"#1a1b26", sb:"#16161e", border:"#0d0e14", text:"#a9b1d6", dim:"#565f89", accent:"#7aa2f7", tab:"#1f2335", terminal:"#13131c", status:"#7aa2f7" },
  "Catppuccin":    { monaco:"vs-dark",   ui:"dark",  bg:"#1e1e2e", sb:"#181825", border:"#11111b", text:"#cdd6f4", dim:"#6c7086", accent:"#89b4fa", tab:"#313244", terminal:"#161622", status:"#89b4fa" },
  "Solarized Dark":{ monaco:"vs-dark",   ui:"dark",  bg:"#002b36", sb:"#073642", border:"#01161e", text:"#839496", dim:"#586e75", accent:"#268bd2", tab:"#073642", terminal:"#00212b", status:"#268bd2" },
  "Gruvbox":       { monaco:"vs-dark",   ui:"dark",  bg:"#282828", sb:"#1d2021", border:"#111", text:"#ebdbb2", dim:"#928374", accent:"#d79921", tab:"#3c3836", terminal:"#1d2021", status:"#d79921" },
  "Ayu Dark":      { monaco:"vs-dark",   ui:"dark",  bg:"#0d1017", sb:"#0b0e14", border:"#0a0c10", text:"#bfbdb6", dim:"#5c6773", accent:"#ffb454", tab:"#13151c", terminal:"#090b10", status:"#e6b450" },
  "GitHub Dark":   { monaco:"vs-dark",   ui:"dark",  bg:"#0d1117", sb:"#161b22", border:"#21262d", text:"#e6edf3", dim:"#8b949e", accent:"#58a6ff", tab:"#1c2128", terminal:"#090c10", status:"#388bfd" },
  "Cobalt2":       { monaco:"vs-dark",   ui:"dark",  bg:"#193549", sb:"#122738", border:"#0d1f2d", text:"#ffffff", dim:"#0088ff", accent:"#ffc600", tab:"#1f4662", terminal:"#0d2535", status:"#ffc600" },
  "Night Owl":     { monaco:"vs-dark",   ui:"dark",  bg:"#011627", sb:"#010e1a", border:"#010b15", text:"#d6deeb", dim:"#5f7e97", accent:"#82aaff", tab:"#01111d", terminal:"#010d17", status:"#7e57c2" },
};

// ─── SNIPPETS ─────────────────────────────────────────────────────────────────
const SNIPPETS = {
  python: [
    { prefix:"def",    body:"def ${1:name}(${2:args}):\n    ${3:pass}",          desc:"Function" },
    { prefix:"class",  body:"class ${1:Name}:\n    def __init__(self):\n        ${2:pass}", desc:"Class" },
    { prefix:"for",    body:"for ${1:i} in range(${2:10}):\n    ${3:pass}",       desc:"For loop" },
    { prefix:"if",     body:"if ${1:condition}:\n    ${2:pass}",                  desc:"If statement" },
    { prefix:"try",    body:"try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:print(e)}", desc:"Try/except" },
    { prefix:"import", body:"import ${1:module}",                                  desc:"Import" },
    { prefix:"list",   body:"[${1:x} for ${1:x} in ${2:iterable}]",              desc:"List comprehension" },
    { prefix:"lambda", body:"lambda ${1:x}: ${2:x}",                              desc:"Lambda" },
    { prefix:"main",   body:"if __name__ == '__main__':\n    ${1:main()}",        desc:"Main guard" },
    { prefix:"open",   body:"with open('${1:file}', '${2:r}') as f:\n    ${3:data = f.read()}", desc:"File open" },
  ],
  javascript: [
    { prefix:"fn",       body:"function ${1:name}(${2:args}) {\n    ${3}\n}",       desc:"Function" },
    { prefix:"arrow",    body:"const ${1:name} = (${2:args}) => {\n    ${3}\n};",   desc:"Arrow function" },
    { prefix:"class",    body:"class ${1:Name} {\n    constructor(${2:args}) {\n        ${3}\n    }\n}", desc:"Class" },
    { prefix:"for",      body:"for (let ${1:i} = 0; ${1:i} < ${2:arr}.length; ${1:i}++) {\n    ${3}\n}", desc:"For loop" },
    { prefix:"forEach",  body:"${1:arr}.forEach((${2:item}) => {\n    ${3}\n});",   desc:"forEach" },
    { prefix:"map",      body:"${1:arr}.map((${2:item}) => ${3:item})",             desc:"map" },
    { prefix:"filter",   body:"${1:arr}.filter((${2:item}) => ${3:item})",          desc:"filter" },
    { prefix:"async",    body:"async function ${1:name}(${2:args}) {\n    try {\n        ${3}\n    } catch (err) {\n        console.error(err);\n    }\n}", desc:"Async function" },
    { prefix:"fetch",    body:"const res = await fetch('${1:url}');\nconst data = await res.json();", desc:"Fetch API" },
    { prefix:"promise",  body:"new Promise((resolve, reject) => {\n    ${1}\n})",  desc:"Promise" },
    { prefix:"usestate", body:"const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:null});", desc:"useState" },
    { prefix:"useeffect",body:"useEffect(() => {\n    ${1}\n    return () => {\n        ${2}\n    };\n}, [${3}]);", desc:"useEffect" },
    { prefix:"console",  body:"console.log('${1:value}:', ${1:value});",            desc:"console.log" },
    { prefix:"try",      body:"try {\n    ${1}\n} catch (err) {\n    console.error(err);\n}", desc:"try/catch" },
  ],
  java: [
    { prefix:"main",     body:"public static void main(String[] args) {\n    ${1}\n}", desc:"Main method" },
    { prefix:"class",    body:"public class ${1:Name} {\n    ${2}\n}",               desc:"Class" },
    { prefix:"sout",     body:"System.out.println(${1});",                            desc:"Print" },
    { prefix:"for",      body:"for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}", desc:"For loop" },
    { prefix:"foreach",  body:"for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4}\n}", desc:"Enhanced for" },
    { prefix:"try",      body:"try {\n    ${1}\n} catch (${2:Exception} e) {\n    e.printStackTrace();\n}", desc:"try/catch" },
    { prefix:"getter",   body:"public ${1:String} get${2:Name}() {\n    return ${3:name};\n}", desc:"Getter" },
    { prefix:"setter",   body:"public void set${1:Name}(${2:String} ${3:name}) {\n    this.${3:name} = ${3:name};\n}", desc:"Setter" },
  ],
  c: [
    { prefix:"main",     body:"int main() {\n    ${1}\n    return 0;\n}",            desc:"Main function" },
    { prefix:"printf",   body:'printf("${1:%s}\\n", ${2:var});',                     desc:"printf" },
    { prefix:"for",      body:"for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}", desc:"For loop" },
    { prefix:"struct",   body:"typedef struct {\n    ${1}\n} ${2:Name};",            desc:"Struct" },
    { prefix:"func",     body:"${1:void} ${2:name}(${3}) {\n    ${4}\n}",           desc:"Function" },
    { prefix:"include",  body:"#include <${1:stdio.h}>",                             desc:"Include" },
    { prefix:"define",   body:"#define ${1:NAME} ${2:value}",                        desc:"Define" },
    { prefix:"malloc",   body:"${1:int} *${2:ptr} = malloc(${3:n} * sizeof(${1:int}));", desc:"malloc" },
  ],
};

// ─── BUILTIN EXTENSIONS ────────────────────────────────────────────────────────
const BUILTIN_EXTENSIONS = [
  { id:"prettier",    name:"Prettier",         icon:"✨", desc:"Code formatter — auto-format on save",    cat:"Formatter",  enabled:true,  installs:"22M" },
  { id:"eslint",      name:"ESLint",            icon:"🔍", desc:"JS/TS linting with auto-fix",             cat:"Linter",     enabled:true,  installs:"18M" },
  { id:"copilot",     name:"GitHub Copilot",    icon:"🤖", desc:"AI pair programmer (Claude-powered)",     cat:"AI",         enabled:true,  installs:"8M"  },
  { id:"python",      name:"Python",            icon:"🐍", desc:"Python IntelliSense, debugging, linting", cat:"Language",   enabled:true,  installs:"55M" },
  { id:"java",        name:"Java Extension",    icon:"☕", desc:"Java IntelliSense, debugging, testing",   cat:"Language",   enabled:true,  installs:"12M" },
  { id:"cpp",         name:"C/C++",             icon:"⚙️", desc:"C/C++ IntelliSense, debugging",          cat:"Language",   enabled:true,  installs:"40M" },
  { id:"rust",        name:"Rust Analyzer",     icon:"🦀", desc:"Rust IntelliSense and error checking",    cat:"Language",   enabled:true,  installs:"5M"  },
  { id:"go",          name:"Go",                icon:"🐹", desc:"Go IntelliSense, testing, debugging",     cat:"Language",   enabled:true,  installs:"8M"  },
  { id:"gitlens",     name:"GitLens",           icon:"🌿", desc:"Supercharge Git capabilities",            cat:"Git",        enabled:true,  installs:"18M" },
  { id:"liveshare",   name:"Live Share",        icon:"🤝", desc:"Real-time collaborative editing",         cat:"Collab",     enabled:false, installs:"9M"  },
  { id:"indent",      name:"indent-rainbow",    icon:"🌈", desc:"Makes indentation colorful",              cat:"Visual",     enabled:true,  installs:"10M" },
  { id:"bracket",     name:"Rainbow Brackets",  icon:"🔵", desc:"Rainbow bracket pair colorization",       cat:"Visual",     enabled:true,  installs:"7M"  },
  { id:"todo",        name:"Todo Highlight",    icon:"📌", desc:"Highlight TODO, FIXME, HACK comments",   cat:"Tools",      enabled:true,  installs:"3M"  },
  { id:"thunder",     name:"Thunder Client",    icon:"⚡", desc:"REST API client (built-in)",              cat:"Tools",      enabled:true,  installs:"6M"  },
  { id:"docker",      name:"Docker",            icon:"🐳", desc:"Docker container management",             cat:"DevOps",     enabled:false, installs:"12M" },
  { id:"vimmode",     name:"Vim",               icon:"🔲", desc:"Vim keybindings for the editor",          cat:"Keybindings",enabled:false, installs:"5M"  },
  { id:"path",        name:"Path Intellisense", icon:"📂", desc:"Autocomplete file path names",            cat:"Tools",      enabled:true,  installs:"14M" },
  { id:"colorize",    name:"Color Highlight",   icon:"🎨", desc:"Highlight CSS colors in editor",          cat:"Visual",     enabled:true,  installs:"6M"  },
  { id:"bookmarks",   name:"Bookmarks",         icon:"🔖", desc:"Mark lines and jump between bookmarks",   cat:"Navigation", enabled:true,  installs:"5M"  },
  { id:"pomodoro",    name:"Pomodoro Timer",    icon:"🍅", desc:"Stay focused with pomodoro technique",    cat:"Productivity",enabled:true, installs:"200K" },
];

// ─── DEFAULT FILES ─────────────────────────────────────────────────────────────
const DEFAULT_FILES = [
  { id:1, name:"main.py",    lang:"python",     saved:true, bookmarks:[], content:`# 🐍 Python — CodeDroid Ultra\n# Real execution via Piston API\n\nimport math\nimport sys\nfrom functools import reduce\n\nname = "Rupak"\nprint(f"⚡ CodeDroid Ultra — Welcome, {name}!")\n\n# ── Data Structures ──────────────────\nnumbers = list(range(1, 11))\nprint("Numbers:", numbers)\nprint("Squares:", [x**2 for x in numbers])\nprint("Evens:", [x for x in numbers if x % 2 == 0])\nprint("Sum:", sum(numbers))\nprint("Product:", reduce(lambda a, b: a * b, numbers))\n\n# ── Functions ────────────────────────\ndef fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\ndef is_prime(n):\n    if n < 2: return False\n    return all(n % i != 0 for i in range(2, int(math.sqrt(n)) + 1))\n\nfib = fibonacci(10)\nprimes = [x for x in range(2, 50) if is_prime(x)]\nprint("Fibonacci:", fib)\nprint("Primes < 50:", primes)\n\n# ── Classes ──────────────────────────\nclass Stack:\n    def __init__(self):\n        self._data = []\n    def push(self, val):\n        self._data.append(val)\n    def pop(self):\n        return self._data.pop() if self._data else None\n    def peek(self):\n        return self._data[-1] if self._data else None\n    def __len__(self):\n        return len(self._data)\n    def __repr__(self):\n        return f"Stack({self._data})"\n\nstack = Stack()\nfor i in [1, 2, 3, 4, 5]:\n    stack.push(i)\nprint("Stack:", stack)\nprint("Pop:", stack.pop())\nprint("Peek:", stack.peek())\n\n# ── Decorators ───────────────────────\ndef timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        end = time.time()\n        print(f"{func.__name__} took {(end-start)*1000:.2f}ms")\n        return result\n    return wrapper\n\n@timer\ndef slow_sum(n):\n    return sum(range(n))\n\nresult = slow_sum(1000000)\nprint(f"Sum(0..999999) = {result}")\n\nprint("\\n✅ All done, {}!".format(name))\n` },
  { id:2, name:"hello.c",    lang:"c",          saved:true, bookmarks:[], content:`// ⚙️ C — CodeDroid Ultra\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\n// ── Data Structures ──────────────────\ntypedef struct Node {\n    int data;\n    struct Node* next;\n} Node;\n\nNode* create_node(int data) {\n    Node* node = (Node*)malloc(sizeof(Node));\n    node->data = data;\n    node->next = NULL;\n    return node;\n}\n\nvoid push(Node** head, int data) {\n    Node* new_node = create_node(data);\n    new_node->next = *head;\n    *head = new_node;\n}\n\nvoid print_list(Node* head) {\n    printf("[");\n    while (head) {\n        printf("%d%s", head->data, head->next ? " -> " : "");\n        head = head->next;\n    }\n    printf("]\\n");\n}\n\n// ── Algorithms ───────────────────────\nvoid bubble_sort(int arr[], int n) {\n    for (int i = 0; i < n-1; i++)\n        for (int j = 0; j < n-i-1; j++)\n            if (arr[j] > arr[j+1]) {\n                int temp = arr[j];\n                arr[j] = arr[j+1];\n                arr[j+1] = temp;\n            }\n}\n\nint binary_search(int arr[], int n, int target) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\nlong long factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n - 1);\n}\n\n// ── Matrix Operations ────────────────\nvoid print_matrix(int m[3][3]) {\n    for (int i = 0; i < 3; i++) {\n        for (int j = 0; j < 3; j++)\n            printf("%4d", m[i][j]);\n        printf("\\n");\n    }\n}\n\nint main() {\n    printf("⚡ CodeDroid Ultra — C Edition\\n\\n");\n    \n    // Linked List\n    Node* head = NULL;\n    for (int i = 5; i >= 1; i--) push(&head, i);\n    printf("Linked List: ");\n    print_list(head);\n    \n    // Sorting\n    int arr[] = {64, 34, 25, 12, 22, 11, 90};\n    int n = sizeof(arr) / sizeof(arr[0]);\n    bubble_sort(arr, n);\n    printf("Sorted: ");\n    for (int i = 0; i < n; i++) printf("%d ", arr[i]);\n    printf("\\n");\n    \n    // Binary search\n    int idx = binary_search(arr, n, 25);\n    printf("Search 25: index %d\\n", idx);\n    \n    // Factorials\n    printf("Factorials: ");\n    for (int i = 1; i <= 10; i++)\n        printf("%lld ", factorial(i));\n    printf("\\n");\n    \n    // Matrix\n    int matrix[3][3] = {{1,2,3},{4,5,6},{7,8,9}};\n    printf("Matrix:\\n");\n    print_matrix(matrix);\n    \n    printf("\\n✅ Done!\\n");\n    return 0;\n}\n` },
  { id:3, name:"Main.java",  lang:"java",       saved:true, bookmarks:[], content:`// ☕ Java — CodeDroid Ultra\nimport java.util.*;\nimport java.util.stream.*;\nimport java.util.function.*;\n\npublic class Main {\n    \n    // ── Generic Stack ─────────────────\n    static class Stack<T> {\n        private List<T> data = new ArrayList<>();\n        public void push(T item) { data.add(item); }\n        public T pop() { return data.isEmpty() ? null : data.remove(data.size()-1); }\n        public T peek() { return data.isEmpty() ? null : data.get(data.size()-1); }\n        public int size() { return data.size(); }\n        public String toString() { return data.toString(); }\n    }\n    \n    // ── Algorithms ────────────────────\n    static int[] mergeSort(int[] arr) {\n        if (arr.length <= 1) return arr;\n        int mid = arr.length / 2;\n        int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));\n        int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));\n        return merge(left, right);\n    }\n    \n    static int[] merge(int[] l, int[] r) {\n        int[] result = new int[l.length + r.length];\n        int i = 0, j = 0, k = 0;\n        while (i < l.length && j < r.length)\n            result[k++] = l[i] <= r[j] ? l[i++] : r[j++];\n        while (i < l.length) result[k++] = l[i++];\n        while (j < r.length) result[k++] = r[j++];\n        return result;\n    }\n    \n    static long fibonacci(int n) {\n        if (n <= 1) return n;\n        long a = 0, b = 1;\n        for (int i = 2; i <= n; i++) { long c = a + b; a = b; b = c; }\n        return b;\n    }\n    \n    // ── Functional ────────────────────\n    static <T, R> List<R> map(List<T> list, Function<T, R> f) {\n        return list.stream().map(f).collect(Collectors.toList());\n    }\n    \n    static <T> List<T> filter(List<T> list, Predicate<T> p) {\n        return list.stream().filter(p).collect(Collectors.toList());\n    }\n    \n    public static void main(String[] args) {\n        System.out.println("⚡ CodeDroid Ultra — Java Edition\\n");\n        \n        // Generic Stack\n        Stack<Integer> stack = new Stack<>();\n        for (int i = 1; i <= 5; i++) stack.push(i * 10);\n        System.out.println("Stack: " + stack);\n        System.out.println("Pop: " + stack.pop());\n        \n        // Merge Sort\n        int[] arr = {38, 27, 43, 3, 9, 82, 10};\n        int[] sorted = mergeSort(arr);\n        System.out.println("Sorted: " + Arrays.toString(sorted));\n        \n        // Fibonacci\n        System.out.print("Fibonacci: ");\n        for (int i = 0; i <= 10; i++) System.out.print(fibonacci(i) + " ");\n        System.out.println();\n        \n        // Streams & Lambdas\n        List<Integer> nums = IntStream.rangeClosed(1, 20).boxed().collect(Collectors.toList());\n        List<Integer> evens = filter(nums, n -> n % 2 == 0);\n        List<Integer> squares = map(evens, n -> n * n);\n        System.out.println("Even squares: " + squares);\n        \n        // Optional\n        Optional<Integer> max = nums.stream().max(Integer::compareTo);\n        max.ifPresent(m -> System.out.println("Max: " + m));\n        \n        System.out.println("\\n✅ Done!");\n    }\n}\n` },
  { id:4, name:"script.js",  lang:"javascript", saved:true, bookmarks:[], content:`// 🟨 JavaScript — CodeDroid Ultra\n\n// ── Async/Await ───────────────────────\nconst delay = ms => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function fetchUser(id) {\n    // Simulating API call\n    await delay(10);\n    const users = {\n        1: { name: "Rupak", role: "Developer", skills: ["Python", "C", "Java", "JS"] },\n        2: { name: "Alice", role: "Designer",   skills: ["Figma", "CSS", "React"] },\n        3: { name: "Bob",   role: "DevOps",     skills: ["Docker", "K8s", "AWS"] },\n    };\n    return users[id] || null;\n}\n\n// ── Functional Programming ────────────\nconst compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);\nconst pipe    = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);\n\nconst double    = x => x * 2;\nconst addTen    = x => x + 10;\nconst square    = x => x * x;\nconst toString  = x => `Result: ${x}`;\n\nconst transform = pipe(double, addTen, square, toString);\nconsole.log(transform(5)); // pipe(5) → 10 → 20 → 400 → "Result: 400"\n\n// ── Data Structures ───────────────────\nclass LinkedList {\n    constructor() { this.head = null; this.size = 0; }\n    \n    append(data) {\n        const node = { data, next: null };\n        if (!this.head) { this.head = node; }\n        else {\n            let curr = this.head;\n            while (curr.next) curr = curr.next;\n            curr.next = node;\n        }\n        this.size++;\n    }\n    \n    toArray() {\n        const arr = [];\n        let curr = this.head;\n        while (curr) { arr.push(curr.data); curr = curr.next; }\n        return arr;\n    }\n}\n\nconst list = new LinkedList();\n[10, 20, 30, 40, 50].forEach(n => list.append(n));\nconsole.log("LinkedList:", list.toArray());\n\n// ── Generators ────────────────────────\nfunction* fibonacci() {\n    let [a, b] = [0, 1];\n    while (true) { yield a; [a, b] = [b, a + b]; }\n}\n\nconst fib = fibonacci();\nconst first10 = Array.from({ length: 10 }, () => fib.next().value);\nconsole.log("Fibonacci:", first10);\n\n// ── Proxy & Reflect ───────────────────\nconst handler = {\n    get: (obj, key) => key in obj ? obj[key] : `Property "${key}" not found`,\n    set: (obj, key, val) => { console.log(`Setting ${key} = ${val}`); obj[key] = val; return true; }\n};\n\nconst proxy = new Proxy({}, handler);\nproxy.name = "CodeDroid";\nproxy.version = "Ultra";\nconsole.log(proxy.name, proxy.version);\nconsole.log(proxy.unknown);\n\n// ── Main ──────────────────────────────\n(async () => {\n    console.log("\\n⚡ CodeDroid Ultra — JavaScript Edition\\n");\n    const user = await fetchUser(1);\n    console.log("User:", JSON.stringify(user, null, 2));\n    console.log("\\n✅ Done!");\n})();\n` },
  { id:5, name:"app.go",     lang:"golang",     saved:true, bookmarks:[], content:`// 🐹 Go — CodeDroid Ultra\npackage main\n\nimport (\n\t"fmt"\n\t"math"\n\t"sort"\n\t"strings"\n\t"sync"\n)\n\n// ── Generics (Go 1.18+) ──────────────\nfunc Map[T, U any](slice []T, f func(T) U) []U {\n\tresult := make([]U, len(slice))\n\tfor i, v := range slice {\n\t\tresult[i] = f(v)\n\t}\n\treturn result\n}\n\nfunc Filter[T any](slice []T, f func(T) bool) []T {\n\tvar result []T\n\tfor _, v := range slice {\n\t\tif f(v) {\n\t\t\tresult = append(result, v)\n\t\t}\n\t}\n\treturn result\n}\n\n// ── Goroutines & Channels ─────────────\nfunc concurrentSum(nums []int, ch chan<- int, wg *sync.WaitGroup) {\n\tdefer wg.Done()\n\tsum := 0\n\tfor _, n := range nums {\n\t\tsum += n\n\t}\n\tch <- sum\n}\n\n// ── Interfaces ────────────────────────\ntype Shape interface {\n\tArea() float64\n\tPerimeter() float64\n}\n\ntype Circle struct{ Radius float64 }\ntype Rectangle struct{ Width, Height float64 }\n\nfunc (c Circle) Area() float64      { return math.Pi * c.Radius * c.Radius }\nfunc (c Circle) Perimeter() float64 { return 2 * math.Pi * c.Radius }\nfunc (r Rectangle) Area() float64      { return r.Width * r.Height }\nfunc (r Rectangle) Perimeter() float64 { return 2 * (r.Width + r.Height) }\n\nfunc printShape(s Shape) {\n\tfmt.Printf("Area: %.2f, Perimeter: %.2f\\n", s.Area(), s.Perimeter())\n}\n\nfunc main() {\n\tfmt.Println("⚡ CodeDroid Ultra — Go Edition\\n")\n\n\t// Generics\n\tnums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}\n\tsquares := Map(nums, func(n int) int { return n * n })\n\tevens := Filter(nums, func(n int) bool { return n%2 == 0 })\n\tfmt.Println("Squares:", squares)\n\tfmt.Println("Evens:", evens)\n\n\t// Goroutines\n\tch := make(chan int, 2)\n\tvar wg sync.WaitGroup\n\twg.Add(2)\n\tgo concurrentSum(nums[:5], ch, &wg)\n\tgo concurrentSum(nums[5:], ch, &wg)\n\twg.Wait()\n\tclose(ch)\n\ttotal := 0\n\tfor s := range ch {\n\t\ttotal += s\n\t}\n\tfmt.Println("Concurrent sum:", total)\n\n\t// Interfaces\n\tshapes := []Shape{Circle{5}, Rectangle{4, 6}}\n\tfor _, s := range shapes {\n\t\tprintShape(s)\n\t}\n\n\t// String operations\n\twords := strings.Fields("the quick brown fox jumps over the lazy dog")\n\tsort.Strings(words)\n\tfmt.Println("Sorted words:", words[:5])\n\n\tfmt.Println("\\n✅ Done!")\n}\n` },
  { id:6, name:"index.html", lang:"html",       saved:true, bookmarks:[], content:`<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>CodeDroid Ultra</title>\n    <style>\n        :root {\n            --bg: #0d1117;\n            --card: rgba(255,255,255,0.05);\n            --accent: #58a6ff;\n            --text: #e6edf3;\n            --border: rgba(255,255,255,0.1);\n        }\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body {\n            font-family: 'Segoe UI', system-ui, sans-serif;\n            background: var(--bg);\n            color: var(--text);\n            min-height: 100vh;\n            display: grid;\n            place-items: center;\n            background-image: radial-gradient(ellipse at 20% 50%, rgba(88,166,255,0.08) 0%, transparent 50%),\n                              radial-gradient(ellipse at 80% 50%, rgba(188,140,255,0.08) 0%, transparent 50%);\n        }\n        .container { text-align: center; padding: 40px 20px; max-width: 600px; }\n        .logo { font-size: 4rem; margin-bottom: 16px; }\n        h1 { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #58a6ff, #bc8cff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }\n        .subtitle { color: #8b949e; font-size: 1.1rem; margin-bottom: 32px; }\n        .badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }\n        .badge { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 0.85rem; }\n        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }\n        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: transform 0.2s; }\n        .card:hover { transform: translateY(-4px); border-color: var(--accent); }\n        .card-icon { font-size: 2rem; margin-bottom: 8px; }\n        .card-title { font-weight: 600; margin-bottom: 4px; }\n        .card-desc { color: #8b949e; font-size: 0.8rem; }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <div class="logo">⚡</div>\n        <h1>CodeDroid Ultra</h1>\n        <p class="subtitle">The most powerful mobile IDE — built with React & Monaco</p>\n        <div class="badges">\n            <span class="badge">🤖 AI Copilot</span>\n            <span class="badge">⚙️ Real Compiler</span>\n            <span class="badge">🎨 15 Themes</span>\n            <span class="badge">📱 Android</span>\n        </div>\n        <div class="grid">\n            <div class="card"><div class="card-icon">🐍</div><div class="card-title">Python</div><div class="card-desc">3.10 · Piston</div></div>\n            <div class="card"><div class="card-icon">⚙️</div><div class="card-title">C/C++</div><div class="card-desc">GCC 10.2</div></div>\n            <div class="card"><div class="card-icon">☕</div><div class="card-title">Java</div><div class="card-desc">JDK 15</div></div>\n            <div class="card"><div class="card-icon">🟨</div><div class="card-title">JavaScript</div><div class="card-desc">Node 18</div></div>\n        </div>\n    </div>\n</body>\n</html>\n` },
  { id:7, name:"styles.css",  lang:"css",       saved:true, bookmarks:[], content:`/* 🎨 CSS — CodeDroid Ultra */\n\n/* ── CSS Variables ───────────────── */\n:root {\n    --primary: #007acc;\n    --primary-hover: #005a9e;\n    --bg: #1e1e1e;\n    --surface: #252526;\n    --border: #333;\n    --text: #d4d4d4;\n    --text-dim: #858585;\n    --success: #4ec9b0;\n    --warning: #e5c07b;\n    --error: #f48771;\n    --radius: 8px;\n    --shadow: 0 4px 20px rgba(0,0,0,0.4);\n    --font-code: 'JetBrains Mono', Consolas, monospace;\n}\n\n/* ── Reset & Base ────────────────── */\n*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\nhtml { font-size: 16px; scroll-behavior: smooth; }\nbody {\n    font-family: -apple-system, 'Segoe UI', sans-serif;\n    background: var(--bg);\n    color: var(--text);\n    line-height: 1.6;\n    min-height: 100vh;\n}\n\n/* ── Typography ──────────────────── */\nh1, h2, h3 { font-weight: 700; line-height: 1.2; }\nh1 { font-size: clamp(1.8rem, 4vw, 3rem); }\nh2 { font-size: clamp(1.4rem, 3vw, 2rem); }\ncode { font-family: var(--font-code); background: var(--surface); padding: 2px 6px; border-radius: 4px; }\n\n/* ── Components ──────────────────── */\n.btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 8px;\n    padding: 10px 20px;\n    background: var(--primary);\n    color: white;\n    border: none;\n    border-radius: var(--radius);\n    cursor: pointer;\n    font-size: 14px;\n    font-weight: 600;\n    transition: all 0.2s;\n}\n.btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: var(--shadow); }\n.btn:active { transform: translateY(0); }\n.btn.outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }\n.btn.danger { background: var(--error); }\n.btn.success { background: var(--success); color: #000; }\n\n.card {\n    background: var(--surface);\n    border: 1px solid var(--border);\n    border-radius: var(--radius);\n    padding: 20px;\n    transition: transform 0.2s, box-shadow 0.2s;\n}\n.card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }\n\n.input {\n    width: 100%;\n    background: var(--bg);\n    border: 1px solid var(--border);\n    color: var(--text);\n    border-radius: var(--radius);\n    padding: 10px 14px;\n    font-size: 14px;\n    outline: none;\n    transition: border-color 0.2s;\n}\n.input:focus { border-color: var(--primary); }\n\n/* ── Animations ──────────────────── */\n@keyframes fadeIn    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n@keyframes slideIn   { from { transform: translateX(-100%); } to { transform: translateX(0); } }\n@keyframes pulse     { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n@keyframes spin      { to { transform: rotate(360deg); } }\n@keyframes shimmer   { to { background-position: 200% center; } }\n\n.fade-in  { animation: fadeIn 0.3s ease; }\n.slide-in { animation: slideIn 0.3s ease; }\n.pulse    { animation: pulse 2s ease infinite; }\n.spin     { animation: spin 0.8s linear infinite; }\n` },
  { id:8, name:"api_test.json", lang:"json",    saved:true, bookmarks:[], content:`{\n    "_info": "REST API Test Collection — CodeDroid Ultra",\n    "collection": {\n        "name": "My API Tests",\n        "requests": [\n            {\n                "name": "Get Users",\n                "method": "GET",\n                "url": "https://jsonplaceholder.typicode.com/users",\n                "headers": { "Accept": "application/json" },\n                "expectedStatus": 200\n            },\n            {\n                "name": "Get Post",\n                "method": "GET",\n                "url": "https://jsonplaceholder.typicode.com/posts/1",\n                "headers": {},\n                "expectedStatus": 200\n            },\n            {\n                "name": "Create Post",\n                "method": "POST",\n                "url": "https://jsonplaceholder.typicode.com/posts",\n                "headers": { "Content-Type": "application/json" },\n                "body": {\n                    "title": "CodeDroid Ultra",\n                    "body": "The best mobile IDE",\n                    "userId": 1\n                },\n                "expectedStatus": 201\n            }\n        ]\n    }\n}\n` },
];

function getTemplate(lang, filename) {
  const cls = filename.replace(/\.\w+$/, "");
  const t = {
    python:`# ${filename}\n\ndef main():\n    # TODO: write your code\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
    c:`#include <stdio.h>\n\nint main() {\n    // TODO: write your code\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
    cpp:`#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: write your code\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
    java:`public class ${cls} {\n    public static void main(String[] args) {\n        // TODO: write your code\n        System.out.println("Hello, World!");\n    }\n}\n`,
    javascript:`'use strict';\n\n// ${filename}\n\nfunction main() {\n    // TODO: write your code\n    console.log("Hello, World!");\n}\n\nmain();\n`,
    typescript:`// ${filename}\n\nfunction main(): void {\n    // TODO: write your code\n    console.log("Hello, World!");\n}\n\nmain();\n`,
    rust:`fn main() {\n    // TODO: write your code\n    println!("Hello, World!");\n}\n`,
    golang:`package main\n\nimport "fmt"\n\nfunc main() {\n\t// TODO: write your code\n\tfmt.Println("Hello, World!")\n}\n`,
    csharp:`using System;\n\nclass ${cls} {\n    static void Main() {\n        // TODO: write your code\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
    kotlin:`fun main() {\n    // TODO: write your code\n    println("Hello, World!")\n}\n`,
    ruby:`# ${filename}\n\n# TODO: write your code\nputs "Hello, World!"\n`,
    php:`<?php\n\n// ${filename}\n\n// TODO: write your code\necho "Hello, World!\\n";\n`,
    bash:`#!/bin/bash\n\n# ${filename}\n\n# TODO: write your code\necho "Hello, World!"\n`,
    html:`<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${cls}</title>\n    <style>\n        body { font-family: sans-serif; margin: 40px; }\n    </style>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n    <script>\n        // TODO: write your code\n    </script>\n</body>\n</html>\n`,
    css:`/* ${filename} */\n\nbody {\n    margin: 0;\n    padding: 0;\n    font-family: sans-serif;\n}\n`,
    json:`{\n    "name": "${cls}",\n    "version": "1.0.0",\n    "description": ""\n}\n`,
    markdown:`# ${cls}\n\n## Description\n\nWrite your description here.\n\n## Usage\n\n\`\`\`bash\n# your code here\n\`\`\`\n\n## License\n\nMIT\n`,
    sql:`-- ${filename}\n\n-- Create table\nCREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    name TEXT NOT NULL,\n    email TEXT UNIQUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert data\nINSERT INTO users (name, email) VALUES ('Rupak', 'rupak@example.com');\n\n-- Query\nSELECT * FROM users;\n`,
  };
  return t[lang] || `// ${filename}\n`;
}

// ─── COMMAND PALETTE COMMANDS ─────────────────────────────────────────────────
const PALETTE_COMMANDS = [
  { id:"run",          label:"▶ Run Code",               shortcut:"Ctrl+Enter", category:"Run"       },
  { id:"format",       label:"✨ Format Document",        shortcut:"Shift+Alt+F",category:"Format"    },
  { id:"find",         label:"🔍 Find",                   shortcut:"Ctrl+F",     category:"Edit"      },
  { id:"replace",      label:"🔄 Find & Replace",         shortcut:"Ctrl+H",     category:"Edit"      },
  { id:"goto",         label:"→ Go to Line",              shortcut:"Ctrl+G",     category:"Navigate"  },
  { id:"symbol",       label:"◎ Go to Symbol",            shortcut:"Ctrl+Shift+O",category:"Navigate" },
  { id:"newfile",      label:"📄 New File",               shortcut:"Ctrl+N",     category:"File"      },
  { id:"save",         label:"💾 Save",                   shortcut:"Ctrl+S",     category:"File"      },
  { id:"saveall",      label:"💾 Save All",               shortcut:"Ctrl+Shift+S",category:"File"     },
  { id:"close",        label:"✕ Close Tab",               shortcut:"Ctrl+W",     category:"File"      },
  { id:"copilot",      label:"🤖 Toggle AI Copilot",      shortcut:"Ctrl+I",     category:"AI"        },
  { id:"terminal",     label:"⬛ Toggle Terminal",         shortcut:"Ctrl+`",     category:"View"      },
  { id:"sidebar",      label:"📂 Toggle Sidebar",         shortcut:"Ctrl+B",     category:"View"      },
  { id:"split",        label:"⊞ Split Editor",            shortcut:"Ctrl+\\",    category:"View"      },
  { id:"zen",          label:"🧘 Zen Mode",               shortcut:"Ctrl+K Z",   category:"View"      },
  { id:"preview",      label:"👁 Live Preview",           shortcut:"Ctrl+Shift+V",category:"View"     },
  { id:"theme",        label:"🎨 Change Theme",           shortcut:"Ctrl+K T",   category:"Settings"  },
  { id:"fontup",       label:"A+ Increase Font Size",     shortcut:"Ctrl+=",     category:"Settings"  },
  { id:"fontdown",     label:"A- Decrease Font Size",     shortcut:"Ctrl+-",     category:"Settings"  },
  { id:"comment",      label:"💬 Toggle Comment",         shortcut:"Ctrl+/",     category:"Edit"      },
  { id:"selectall",    label:"Select All",                shortcut:"Ctrl+A",     category:"Edit"      },
  { id:"diffview",     label:"⊟ Toggle Diff View",        shortcut:"Ctrl+Shift+D",category:"View"     },
  { id:"wordwrap",     label:"⏎ Toggle Word Wrap",        shortcut:"Alt+Z",      category:"View"      },
  { id:"minimap",      label:"🗺 Toggle Minimap",         shortcut:"",           category:"View"      },
  { id:"restclient",   label:"⚡ REST Client",             shortcut:"Ctrl+Alt+R", category:"Tools"     },
  { id:"regex",        label:"🔧 Regex Tester",           shortcut:"",           category:"Tools"     },
  { id:"json",         label:"📋 JSON Formatter",         shortcut:"",           category:"Tools"     },
  { id:"base64",       label:"🔐 Base64 Tool",            shortcut:"",           category:"Tools"     },
  { id:"pomodoro",     label:"🍅 Pomodoro Timer",         shortcut:"",           category:"Tools"     },
  { id:"stats",        label:"📊 Code Statistics",        shortcut:"",           category:"Tools"     },
  { id:"snippets",     label:"✂️ Insert Snippet",         shortcut:"Ctrl+Space", category:"Edit"      },
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Core State ──────────────────────────────────────────────────────────────
  const [files, setFiles]               = useState(DEFAULT_FILES);
  const [openTabs, setOpenTabs]         = useState([DEFAULT_FILES[0], DEFAULT_FILES[3]]);
  const [activeTabId, setActiveTabId]   = useState(DEFAULT_FILES[0].id);
  const [splitTabId, setSplitTabId]     = useState(null);
  const [splitMode, setSplitMode]       = useState(false);
  const [diffMode, setDiffMode]         = useState(false);
  const [panel, setPanel]               = useState("explorer");
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [sidebarW, setSidebarW]         = useState(230);
  const [zenMode, setZenMode]           = useState(false);
  const [livePreview, setLivePreview]   = useState(false);

  // ── Editor State ────────────────────────────────────────────────────────────
  const [themeName, setThemeName]       = useState("Dark+");
  const [fontSize, setFontSize]         = useState(14);
  const [wordWrap, setWordWrap]         = useState("on");
  const [minimap, setMinimap]           = useState(false);
  const [lineNumbers, setLineNumbers]   = useState("on");
  const [vimMode, setVimMode]           = useState(false);
  const [autoSave, setAutoSave]         = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(1000);
  const [tabSize, setTabSize]           = useState(4);
  const [renderWhitespace, setRenderWhitespace] = useState("selection");
  const [stickyScroll, setStickyScroll] = useState(true);
  const [smoothScroll, setSmoothScroll] = useState(true);
  const [cursorPos, setCursorPos]       = useState({ line:1, col:1 });
  const [editorInstance, setEditorInstance] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [selection, setSelection]       = useState({ chars:0, lines:0 });

  // ── Terminal State ───────────────────────────────────────────────────────────
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalH, setTerminalH]       = useState(200);
  const [logs, setLogs]                 = useState([
    { type:"system",  text:"⚡ CodeDroid ULTRA — The Most Powerful Mobile IDE" },
    { type:"system",  text:`🚀 Monaco Engine · Piston Compiler · Claude AI · ${VERSION}` },
    { type:"system",  text:"💡 Ctrl+Shift+P = Command Palette | Ctrl+I = AI Copilot" },
    { type:"divider", text:"" },
  ]);
  const [isRunning, setIsRunning]       = useState(false);
  const [stdin, setStdin]               = useState("");
  const [showStdin, setShowStdin]       = useState(false);
  const [termTab, setTermTab]           = useState("output"); // output | problems | debug

  // ── AI Copilot State ─────────────────────────────────────────────────────────
  const [copilotOpen, setCopilotOpen]   = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([{
    role:"assistant",
    text:"Hi! I'm your AI Copilot 🤖 powered by Claude.\n\n**I can help you with:**\n• Explain & debug code\n• Generate algorithms & functions\n• Optimize performance\n• Add documentation & tests\n• Convert between languages\n• Solve competitive programming problems\n• Review code for best practices\n• Suggest design patterns\n\nPress `Ctrl+I` anytime or ask me anything!",
  }]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMode, setCopilotMode]   = useState("chat"); // chat | inline

  // ── Tools State ──────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool]     = useState(null); // rest | regex | json | base64 | pomodoro | stats
  const [extensions, setExtensions]     = useState(BUILTIN_EXTENSIONS);
  const [bookmarks, setBookmarks]       = useState({});
  const [problems, setProblems]         = useState([]);
  const [clipHistory, setClipHistory]   = useState([]);

  // ── REST Client State ────────────────────────────────────────────────────────
  const [restMethod, setRestMethod]     = useState("GET");
  const [restUrl, setRestUrl]           = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [restHeaders, setRestHeaders]   = useState('{\n  "Accept": "application/json"\n}');
  const [restBody, setRestBody]         = useState('{\n  "title": "Test",\n  "body": "Content",\n  "userId": 1\n}');
  const [restResponse, setRestResponse] = useState(null);
  const [restLoading, setRestLoading]   = useState(false);
  const [restHistory, setRestHistory]   = useState([]);

  // ── Regex Tester State ───────────────────────────────────────────────────────
  const [regexPattern, setRegexPattern] = useState("(\\w+)@(\\w+\\.\\w+)");
  const [regexFlags, setRegexFlags]     = useState("gi");
  const [regexInput, setRegexInput]     = useState("Contact: john@example.com or jane.doe@company.org");
  const [regexMatches, setRegexMatches] = useState([]);

  // ── JSON Tool State ──────────────────────────────────────────────────────────
  const [jsonInput, setJsonInput]       = useState('{"name":"Rupak","age":18,"skills":["Python","C","Java"]}');
  const [jsonOutput, setJsonOutput]     = useState("");
  const [jsonError, setJsonError]       = useState("");

  // ── Base64 State ─────────────────────────────────────────────────────────────
  const [b64Input, setB64Input]         = useState("Hello, CodeDroid Ultra!");
  const [b64Output, setB64Output]       = useState("");
  const [b64Mode, setB64Mode]           = useState("encode");

  // ── Pomodoro State ───────────────────────────────────────────────────────────
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime]   = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode]   = useState("work"); // work | break
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const pomodoroRef = useRef(null);

  // ── Search State ─────────────────────────────────────────────────────────────
  const [fileSearch, setFileSearch]     = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showNewFile, setShowNewFile]   = useState(false);
  const [newFileName, setNewFileName]   = useState("");

  // ── Command Palette State ────────────────────────────────────────────────────
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIdx, setPaletteIdx]     = useState(0);

  // ── Snippet State ────────────────────────────────────────────────────────────
  const [snippetOpen, setSnippetOpen]   = useState(false);
  const [snippetQuery, setSnippetQuery] = useState("");

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const termRef       = useRef(null);
  const copilotRef    = useRef(null);
  const paletteRef    = useRef(null);
  const autoSaveTimer = useRef(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeTab   = openTabs.find(t => t.id === activeTabId) || null;
  const splitTab    = openTabs.find(t => t.id === splitTabId) || null;
  const T           = THEMES[themeName] || THEMES["Dark+"];
  const isDark      = T.ui === "dark";
  const LC          = LANGS[activeTab?.lang] || {};
  const INPUT_BG    = isDark ? "#3c3c3c" : "#e8e8e8";

  // ── File Operations ──────────────────────────────────────────────────────────
  const updateContent = useCallback((content) => {
    setFiles(p => p.map(f => f.id === activeTabId ? { ...f, content, saved: false } : f));
    setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, content, saved: false } : t));
    if (autoSave) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        setFiles(p => p.map(f => f.id === activeTabId ? { ...f, saved: true } : f));
        setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, saved: true } : t));
      }, autoSaveDelay);
    }
  }, [activeTabId, autoSave, autoSaveDelay]);

  const openFile = useCallback((file) => {
    setOpenTabs(p => p.find(t => t.id === file.id) ? p : [...p, { ...file }]);
    setActiveTabId(file.id);
  }, []);

  const closeTab = useCallback((e, tabId) => {
    e && e.stopPropagation();
    setOpenTabs(p => {
      const next = p.filter(t => t.id !== tabId);
      if (activeTabId === tabId) setActiveTabId(next.length ? next[next.length-1].id : null);
      if (splitTabId === tabId) { setSplitTabId(null); setSplitMode(false); }
      return next;
    });
  }, [activeTabId, splitTabId]);

  const createFile = useCallback(() => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split(".").pop().toLowerCase();
    const lang = EXT_MAP[ext] || "text";
    const nf = { id: Date.now(), name: newFileName, lang, saved: true, bookmarks: [], content: getTemplate(lang, newFileName) };
    setFiles(p => [...p, nf]);
    openFile(nf);
    setNewFileName(""); setShowNewFile(false);
  }, [newFileName, openFile]);

  const deleteFile = useCallback((e, fileId) => {
    e && e.stopPropagation();
    setFiles(p => p.filter(f => f.id !== fileId));
    closeTab(null, fileId);
  }, [closeTab]);

  const renameFile = useCallback((fileId, newName) => {
    const ext = newName.split(".").pop().toLowerCase();
    const lang = EXT_MAP[ext] || "text";
    setFiles(p => p.map(f => f.id === fileId ? { ...f, name: newName, lang } : f));
    setOpenTabs(p => p.map(t => t.id === fileId ? { ...t, name: newName, lang } : t));
  }, []);

  const toggleBookmark = useCallback((line) => {
    if (!activeTab) return;
    setFiles(p => p.map(f => {
      if (f.id !== activeTabId) return f;
      const bms = f.bookmarks || [];
      return { ...f, bookmarks: bms.includes(line) ? bms.filter(b => b !== line) : [...bms, line] };
    }));
  }, [activeTab, activeTabId]);

  const addLog = useCallback((type, text) => setLogs(p => [...p, { type, text }]), []);

  // ── RUN CODE (Real Piston API) ────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (!activeTab || isRunning) return;
    const lang = LANGS[activeTab.lang];
    if (!lang?.piston) {
      addLog("info", `ℹ️ ${activeTab.lang?.toUpperCase()} — no execution engine. Use Live Preview for HTML.`);
      if (activeTab.lang === "html") setLivePreview(true);
      return;
    }
    setIsRunning(true);
    setTerminalOpen(true);
    setTermTab("output");
    addLog("cmd",  `$ run ${activeTab.name}  [${new Date().toLocaleTimeString()}]`);
    addLog("info", `⟳ Compiling via Piston (${lang.piston} ${lang.ver})...`);
    try {
      const res = await fetch(`${EXEC_SERVER}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.piston,
          version: lang.ver,
          files: [{ name: activeTab.name, content: activeTab.content }],
          stdin: stdin || "",
          args: [],
          compile_timeout: 30000,
          run_timeout: 10000,
        })
      });
      const data = await res.json();
      if (data.message) {
        addLog("error", `✗ API Error: ${data.message}`);
      } else {
        const compileErr = data.compile?.code !== 0 && data.compile?.output;
        if (compileErr) {
          addLog("error", `── Compile Error ──\n${data.compile.output}`);
          setProblems(prev => [...prev, { file: activeTab.name, msg: data.compile.output, type: "error" }]);
        } else {
          const out = data.run?.output || "(no output)";
          const isErr = data.run?.code !== 0;
          addLog(isErr ? "error" : "output", out);
          if (isErr) setProblems(prev => [...prev, { file: activeTab.name, msg: out, type: "error" }]);
        }
      }
      addLog("system", `✓ Exited(${data.run?.code ?? 0}) · ${new Date().toLocaleTimeString()}`);
      addLog("divider", "");
    } catch (err) {
      addLog("error", `✗ Network error: ${err.message}\n💡 Check internet connection.`);
      addLog("divider", "");
    }
    setIsRunning(false);
  }, [activeTab, isRunning, stdin, addLog]);

  // ── AI COPILOT ────────────────────────────────────────────────────────────────
  const askCopilot = useCallback(async (customPrompt) => {
    const msg = customPrompt || copilotInput.trim();
    if (!msg || copilotLoading) return;
    setCopilotInput("");
    setCopilotMessages(p => [...p, { role:"user", text: msg }]);
    setCopilotLoading(true);
    try {
      const codeCtx = activeTab
        ? `\n\n**Current file:** \`${activeTab.name}\` (${activeTab.lang})\n\`\`\`${activeTab.lang}\n${activeTab.content.slice(0, 3000)}\n\`\`\``
        : "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: `You are an elite AI Copilot inside CodeDroid Ultra — a professional VS Code clone for Android. You are powered by Claude AI.\n\nCapabilities:\n- Deep expertise in all programming languages\n- Algorithm design and optimization\n- Code review and best practices\n- Debugging and error analysis\n- Architecture and design patterns\n- Competitive programming\n- System design\n\nFormat:\n- Use markdown with code blocks (triple backticks with language)\n- Be concise but thorough\n- Include time/space complexity for algorithms\n- Suggest improvements proactively\n- Max 400 words unless asked for more`,
          messages: [
            ...copilotMessages.slice(-8).map(m => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.text
            })),
            { role:"user", content: msg + codeCtx }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Try again.";
      setCopilotMessages(p => [...p, { role:"assistant", text: reply }]);
    } catch {
      setCopilotMessages(p => [...p, { role:"assistant", text: "⚠️ Network error. Please check your connection and try again." }]);
    }
    setCopilotLoading(false);
  }, [copilotInput, copilotLoading, copilotMessages, activeTab]);

  // ── REST CLIENT ───────────────────────────────────────────────────────────────
  const runRestRequest = useCallback(async () => {
    if (restLoading) return;
    setRestLoading(true);
    const start = Date.now();
    try {
      let headers = {};
      try { headers = JSON.parse(restHeaders); } catch {}
      const opts = { method: restMethod, headers };
      if (!["GET","HEAD"].includes(restMethod)) {
        opts.body = restBody;
        if (!headers["Content-Type"]) opts.headers["Content-Type"] = "application/json";
      }
      const res = await fetch(restUrl, opts);
      const duration = Date.now() - start;
      const resHeaders = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });
      let body;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        try { body = JSON.stringify(await res.json(), null, 2); } catch { body = await res.text(); }
      } else { body = await res.text(); }
      const result = { status: res.status, statusText: res.statusText, duration, headers: resHeaders, body, url: restUrl, method: restMethod };
      setRestResponse(result);
      setRestHistory(p => [result, ...p.slice(0, 9)]);
    } catch (err) {
      setRestResponse({ error: err.message, url: restUrl, method: restMethod });
    }
    setRestLoading(false);
  }, [restUrl, restMethod, restHeaders, restBody, restLoading]);

  // ── REGEX TESTER ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (!regexPattern) { setRegexMatches([]); return; }
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = [];
      let m;
      if (regexFlags.includes("g")) {
        while ((m = regex.exec(regexInput)) !== null) {
          matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (matches.length > 100) break;
        }
      } else {
        m = regex.exec(regexInput);
        if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      setRegexMatches(matches);
    } catch { setRegexMatches([]); }
  }, [regexPattern, regexFlags, regexInput]);

  // ── JSON FORMATTER ────────────────────────────────────────────────────────────
  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError("");
    } catch (e) { setJsonError(e.message); setJsonOutput(""); }
  }, [jsonInput]);

  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError("");
    } catch (e) { setJsonError(e.message); }
  }, [jsonInput]);

  // ── BASE64 ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (b64Mode === "encode") setB64Output(btoa(unescape(encodeURIComponent(b64Input))));
      else setB64Output(decodeURIComponent(escape(atob(b64Input))));
    } catch { setB64Output("⚠️ Invalid input"); }
  }, [b64Input, b64Mode]);

  // ── POMODORO ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pomodoroActive) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime(t => {
          if (t <= 1) {
            setPomodoroMode(m => {
              const next = m === "work" ? "break" : "work";
              setPomodoroTime(next === "work" ? 25 * 60 : 5 * 60);
              if (m === "work") setPomodoroCount(c => c + 1);
              return next;
            });
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(pomodoroRef.current);
    }
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroActive]);

  // ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globalSearch.trim()) { setSearchResults([]); return; }
    const results = [];
    files.forEach(f => {
      const lines = f.content.split("\n");
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(globalSearch.toLowerCase())) {
          results.push({ file: f, line: idx + 1, text: line.trim(), match: globalSearch });
        }
      });
    });
    setSearchResults(results.slice(0, 50));
  }, [globalSearch, files]);

  // ── COMMAND PALETTE ───────────────────────────────────────────────────────────
  const filteredCommands = useMemo(() => {
    if (!paletteQuery) return PALETTE_COMMANDS;
    return PALETTE_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(paletteQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(paletteQuery.toLowerCase())
    );
  }, [paletteQuery]);

  const executePaletteCommand = useCallback((cmd) => {
    setPaletteOpen(false); setPaletteQuery("");
    switch(cmd.id) {
      case "run":         runCode(); break;
      case "format":      editorInstance?.getAction("editor.action.formatDocument")?.run(); break;
      case "find":        editorInstance?.getAction("actions.find")?.run(); break;
      case "replace":     editorInstance?.getAction("editor.action.startFindReplaceAction")?.run(); break;
      case "goto":        editorInstance?.getAction("editor.action.gotoLine")?.run(); break;
      case "symbol":      editorInstance?.getAction("editor.action.quickOutline")?.run(); break;
      case "newfile":     setShowNewFile(true); break;
      case "save":
        setFiles(p => p.map(f => f.id === activeTabId ? { ...f, saved: true } : f));
        setOpenTabs(p => p.map(t => t.id === activeTabId ? { ...t, saved: true } : t));
        addLog("system", "💾 Saved"); break;
      case "copilot":     setCopilotOpen(v => !v); break;
      case "terminal":    setTerminalOpen(v => !v); break;
      case "sidebar":     setSidebarOpen(v => !v); break;
      case "split":       setSplitMode(v => !v); break;
      case "zen":         setZenMode(v => !v); break;
      case "preview":     setLivePreview(v => !v); break;
      case "theme":       setPanel("settings"); setSidebarOpen(true); break;
      case "fontup":      setFontSize(f => Math.min(f + 1, 24)); break;
      case "fontdown":    setFontSize(f => Math.max(f - 1, 10)); break;
      case "wordwrap":    setWordWrap(w => w === "on" ? "off" : "on"); break;
      case "minimap":     setMinimap(v => !v); break;
      case "diffview":    setDiffMode(v => !v); break;
      case "restclient":  setActiveTool("rest"); break;
      case "regex":       setActiveTool("regex"); break;
      case "json":        setActiveTool("json"); break;
      case "base64":      setActiveTool("base64"); break;
      case "pomodoro":    setActiveTool("pomodoro"); break;
      case "stats":       setActiveTool("stats"); break;
      case "snippets":    setSnippetOpen(true); break;
      default: break;
    }
  }, [runCode, editorInstance, activeTabId, addLog]);

  // ── EDITOR MOUNT ──────────────────────────────────────────────────────────────
  const handleEditorMount = useCallback((editor, monaco) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);

    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    editor.onDidChangeCursorSelection(e => {
      const sel = editor.getSelection();
      const model = editor.getModel();
      if (sel && model) {
        const text = model.getValueInRange(sel);
        setSelection({ chars: text.length, lines: text.split("\n").length });
      } else {
        setSelection({ chars: 0, lines: 0 });
      }
    });

    // Keyboard shortcuts
    const { KeyMod, KeyCode } = monaco;
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter,                () => runCode());
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyI,                 () => setCopilotOpen(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Backquote,            () => setTerminalOpen(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyB,                 () => setSidebarOpen(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyW,                 () => closeTab(null, activeTabId));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Backslash,            () => setSplitMode(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,  () => setPaletteOpen(true));
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyV,  () => setLivePreview(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyD,  () => setDiffMode(v => !v));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Equal,                () => setFontSize(f => Math.min(f+1, 24)));
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Minus,                () => setFontSize(f => Math.max(f-1, 10)));
    editor.addCommand(KeyMod.Alt    | KeyCode.KeyZ,                  () => setWordWrap(w => w==="on"?"off":"on"));
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyR,    () => setActiveTool("rest"));
  }, [runCode, closeTab, activeTabId]);

  // ── GLOBAL KEYBOARD ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault(); setPaletteOpen(v => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false); setSnippetOpen(false); setActiveTool(null);
      }
      if (paletteOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); setPaletteIdx(i => Math.min(i+1, filteredCommands.length-1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setPaletteIdx(i => Math.max(i-1, 0)); }
        if (e.key === "Enter") { e.preventDefault(); if (filteredCommands[paletteIdx]) executePaletteCommand(filteredCommands[paletteIdx]); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, filteredCommands, paletteIdx, executePaletteCommand]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (copilotRef.current) copilotRef.current.scrollTop = copilotRef.current.scrollHeight;
  }, [copilotMessages]);

  // ── CODE STATS ────────────────────────────────────────────────────────────────
  const codeStats = useMemo(() => {
    if (!activeTab) return null;
    const content = activeTab.content;
    const lines = content.split("\n");
    const words = content.trim().split(/\s+/).filter(Boolean);
    const chars = content.length;
    const nonEmpty = lines.filter(l => l.trim()).length;
    const comments = lines.filter(l => {
      const t = l.trim();
      const cc = LC.comment;
      return cc && (t.startsWith(cc) || t.startsWith("/*") || t.startsWith("*"));
    }).length;
    return { lines: lines.length, words: words.length, chars, nonEmpty, comments };
  }, [activeTab, LC]);

  // ── SNIPPETS ──────────────────────────────────────────────────────────────────
  const insertSnippet = useCallback((snippet) => {
    if (!editorInstance) return;
    const pos = editorInstance.getPosition();
    editorInstance.executeEdits("", [{
      range: new monacoInstance.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
      text: snippet.body.replace(/\$\{[^}]+\}/g, "").replace(/\$\d+/g, "")
    }]);
    editorInstance.focus();
    setSnippetOpen(false);
  }, [editorInstance, monacoInstance]);

  const filteredSnippets = useMemo(() => {
    const langSnippets = SNIPPETS[activeTab?.lang] || [];
    if (!snippetQuery) return langSnippets;
    return langSnippets.filter(s => s.prefix.includes(snippetQuery) || s.desc.toLowerCase().includes(snippetQuery.toLowerCase()));
  }, [activeTab, snippetQuery]);

  // ── FILTERED FILES ────────────────────────────────────────────────────────────
  const filteredFiles = useMemo(() =>
    files.filter(f => !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase())),
    [files, fileSearch]
  );

  // ── POMODO FORMAT ─────────────────────────────────────────────────────────────
  const pomFmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:T.bg, color:T.text, overflow:"hidden", fontFamily:"'JetBrains Mono',Consolas,monospace", fontSize:13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${isDark?"#404040":"#c0c0c0"};border-radius:3px}
        input,textarea,button,select{font-family:inherit}
        .hov:hover{background:${isDark?"#2a2d2e":"#e8e8e8"}!important}
        .hov2:hover{background:${isDark?"#37373d":"#ddd"}!important}
        .nav-btn{border:none;cursor:pointer;background:none;padding:10px 0;width:44px;text-align:center;font-size:19px;color:${T.dim};border-left:2px solid transparent;transition:color .15s}
        .nav-btn:hover{color:${T.text};background:${isDark?"#2d2d2d":"#e0e0e0"}}
        .nav-btn.active{color:${T.text};border-left:2px solid ${T.accent}}
        @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite;display:inline-block}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.2s ease infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .18s ease}
        @keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.slide-in{animation:slideRight .18s ease}
        .tab-x{opacity:.3;transition:opacity .1s,color .1s}.tab-x:hover{opacity:1;color:#f48771}
        .ctx-item{padding:6px 16px;cursor:pointer;font-size:12px;color:${T.text};display:flex;justify-content:space-between;align-items:center}
        .ctx-item:hover{background:${isDark?"#2a2d2e":"#e8e8e8"}}
        .run-btn{transition:background .15s,transform .1s}.run-btn:hover{filter:brightness(1.15)}.run-btn:active{transform:scale(.97)}
        .tool-btn{background:${isDark?"#3c3c3c":"#e8e8e8"};border:1px solid ${T.border};color:${T.text};border-radius:5px;padding:5px 12px;cursor:pointer;font-size:11px;transition:background .15s}
        .tool-btn:hover{background:${isDark?"#4a4a4a":"#d0d0d0"}}
        .tool-btn.active{background:${T.accent};color:#fff;border-color:${T.accent}}
        .pill{border-radius:20px;padding:3px 10px;font-size:10px;font-weight:600;border:1px solid}
        .input-base{background:${INPUT_BG};border:1px solid ${T.border};color:${T.text};border-radius:5px;padding:6px 10px;font-size:12px;outline:none;width:100%;font-family:inherit}
        .input-base:focus{border-color:${T.accent}}
        .copilot-action{background:none;border:1px solid ${T.border};color:${T.text};border-radius:12px;padding:4px 10px;cursor:pointer;font-size:10px;transition:all .15s}
        .copilot-action:hover{border-color:${T.accent};color:${T.accent}}
        .panel-header{font-size:10px;font-weight:700;color:${T.dim};letter-spacing:1.5px;text-transform:uppercase;padding:10px 12px 6px}
        .status-item{display:flex;align-items:center;gap:4px;cursor:pointer;padding:0 6px;height:100%}
        .status-item:hover{background:rgba(255,255,255,0.1)}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:998;backdrop-filter:blur(2px)}
        .modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999;background:${T.sb};border:1px solid ${T.border};border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.6);width:90%;max-width:560px}
        .palette-item{padding:8px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:12px}
        .palette-item.active{background:${T.accent};color:#fff}
        .palette-item:hover:not(.active){background:${isDark?"#2d2d2d":"#e8e8e8"}}
        .rest-method-GET{color:#4ec9b0}.rest-method-POST{color:#e5c07b}.rest-method-PUT{color:#569cd6}.rest-method-DELETE{color:#f48771}.rest-method-PATCH{color:#c586c0}
        .match-highlight{background:${T.accent}33;border-bottom:2px solid ${T.accent};border-radius:2px}
        .bookmark-line{background:rgba(255,180,0,0.1);border-left:3px solid #ffb400}
      `}</style>

      {/* ══ TITLE BAR ══════════════════════════════════════════════════════════ */}
      {!zenMode && (
        <div style={{ height:38, background:T.sb, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 10px", gap:8, flexShrink:0, userSelect:"none" }}>
          <span style={{ fontSize:20 }}>⚡</span>
          <span style={{ color:T.accent, fontWeight:700, fontSize:14, letterSpacing:.3 }}>CodeDroid Ultra</span>
          {pomodoroActive && (
            <span style={{ fontSize:11, color:pomodoroMode==="work"?"#f48771":"#4ec9b0", fontWeight:600, marginLeft:4 }}>
              {pomodoroMode==="work"?"🍅":"☕"} {pomFmt(pomodoroTime)}
            </span>
          )}
          <div style={{ flex:1, textAlign:"center", fontSize:11, color:T.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {activeTab ? `${LC.icon||"📄"} ${activeTab.name}${activeTab.saved===false?" ●":""}` : "CodeDroid Ultra"}
          </div>
          {/* Quick actions */}
          {[
            { icon:"⌘",    tip:"Command Palette (Ctrl+Shift+P)",  fn:() => setPaletteOpen(true) },
            { icon:"🔍",   tip:"Find (Ctrl+F)",                   fn:() => editorInstance?.getAction("actions.find")?.run() },
            { icon:"✨",   tip:"Format (Shift+Alt+F)",            fn:() => editorInstance?.getAction("editor.action.formatDocument")?.run() },
            { icon:"👁",   tip:"Live Preview (Ctrl+Shift+V)",     fn:() => setLivePreview(v=>!v) },
            { icon:"⊟",   tip:"Diff View",                       fn:() => setDiffMode(v=>!v) },
            { icon:"🤖",   tip:"AI Copilot (Ctrl+I)",             fn:() => setCopilotOpen(v=>!v) },
            { icon:"🧘",   tip:"Zen Mode",                        fn:() => setZenMode(true) },
          ].map(({icon,tip,fn},i) => (
            <button key={i} onClick={fn} title={tip} className="hov"
              style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", padding:"4px 5px", fontSize:14, borderRadius:4 }}>
              {icon}
            </button>
          ))}
          <button onClick={runCode} disabled={isRunning||!activeTab||!LC.piston} className="run-btn"
            style={{ background:isRunning?"#094771":T.accent, border:"none", color:"#fff", cursor:"pointer", padding:"5px 14px", borderRadius:5, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, opacity:(!activeTab||!LC.piston)?0.4:1, flexShrink:0 }}>
            {isRunning ? <><span className="spin">⟳</span> Running</> : <>▶ Run</>}
          </button>
        </div>
      )}

      {/* ══ TAB BAR ════════════════════════════════════════════════════════════ */}
      {!zenMode && (
        <div style={{ display:"flex", background:T.sb, borderBottom:`1px solid ${T.border}`, overflowX:"auto", flexShrink:0, height:35, scrollbarWidth:"none" }}>
          {openTabs.map(tab => {
            const tabLang = LANGS[tab.lang] || {};
            return (
              <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className="hov2"
                style={{ display:"flex", alignItems:"center", gap:5, padding:"0 14px", cursor:"pointer", whiteSpace:"nowrap", fontSize:12, height:"100%", borderRight:`1px solid ${T.border}`, flexShrink:0, minWidth:90,
                  background: tab.id===activeTabId ? T.bg : T.tab,
                  color: tab.id===activeTabId ? T.text : T.dim,
                  borderTop:`2px solid ${tab.id===activeTabId ? T.accent : "transparent"}` }}
                onDoubleClick={() => setSplitTabId(tab.id) || setSplitMode(true)}>
                <span style={{ fontSize:13 }}>{tabLang.icon||"📄"}</span>
                <span style={{ maxWidth:90, overflow:"hidden", textOverflow:"ellipsis" }}>{tab.name}</span>
                {tab.saved === false && <span style={{ color:T.accent, fontSize:10 }}>●</span>}
                <span onClick={e=>closeTab(e,tab.id)} className="tab-x" style={{ marginLeft:2, cursor:"pointer", fontSize:16 }}>×</span>
              </div>
            );
          })}
          <button onClick={() => setShowNewFile(true)} style={{ padding:"0 14px", background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:22, flexShrink:0 }}>+</button>
          {/* Tool Tabs */}
          {activeTool && (
            <div style={{ display:"flex", alignItems:"center", marginLeft:"auto", gap:2, paddingRight:8 }}>
              {[
                ["⚡","rest","REST Client"],["🔧","regex","Regex"],["📋","json","JSON"],
                ["🔐","base64","Base64"],["🍅","pomodoro","Pomodoro"],["📊","stats","Stats"],
              ].map(([icon,id,label]) => (
                <button key={id} onClick={() => setActiveTool(activeTool===id?null:id)}
                  className={`tool-btn${activeTool===id?" active":""}`}
                  style={{ padding:"3px 8px", fontSize:11 }}>
                  {icon} {label}
                </button>
              ))}
              <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:16, padding:"0 4px" }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ══ BODY ═══════════════════════════════════════════════════════════════ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── ACTIVITY BAR ── */}
        {!zenMode && (
          <div style={{ width:44, background:T.sb, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:4, flexShrink:0 }}>
            {[
              { id:"explorer",   icon:"⎇",  tip:"Explorer"    },
              { id:"search",     icon:"🔍", tip:"Search"       },
              { id:"git",        icon:"⑂",  tip:"Source Control" },
              { id:"debug",      icon:"🐛", tip:"Run & Debug"  },
              { id:"extensions", icon:"⊞",  tip:"Extensions"   },
              { id:"settings",   icon:"⚙",  tip:"Settings"     },
            ].map(n => (
              <button key={n.id} title={n.tip} className={`nav-btn${panel===n.id&&sidebarOpen?" active":""}`}
                onClick={() => { if(panel===n.id){setSidebarOpen(v=>!v);}else{setPanel(n.id);setSidebarOpen(true);} }}>
                {n.icon}
              </button>
            ))}
            <div style={{ flex:1 }}/>
            {/* Bottom items */}
            {[
              { icon:"⚡", tip:"REST Client",  fn:()=>setActiveTool(t=>t==="rest"?null:"rest") },
              { icon:"🍅", tip:"Pomodoro",     fn:()=>setActiveTool(t=>t==="pomodoro"?null:"pomodoro") },
            ].map(({icon,tip,fn},i) => (
              <button key={i} title={tip} className="nav-btn" onClick={fn}>{icon}</button>
            ))}
            <div style={{ height:8 }}/>
          </div>
        )}

        {/* ── SIDEBAR ── */}
        {sidebarOpen && !zenMode && (
          <div className="slide-in" style={{ width:sidebarW, background:T.sb, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

            {/* EXPLORER */}
            {panel==="explorer" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div className="panel-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>Explorer</span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={() => setShowNewFile(v=>!v)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:17, lineHeight:1 }} title="New File">＋</button>
                    <button onClick={() => setFiles(p => p.map(f => ({ ...f, saved: true })))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:12 }} title="Save All">💾</button>
                  </div>
                </div>
                <div style={{ padding:"0 8px 6px" }}>
                  <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="🔍 Filter files..." className="input-base" style={{ width:"100%" }}/>
                </div>
                {showNewFile && (
                  <div className="fade-in" style={{ padding:"0 8px 6px", display:"flex", gap:4 }}>
                    <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter")createFile(); if(e.key==="Escape")setShowNewFile(false); }}
                      placeholder="main.py, Main.java, app.go..."
                      className="input-base" style={{ flex:1, borderColor:T.accent }}/>
                    <button onClick={createFile} style={{ background:T.accent, border:"none", color:"#fff", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:12 }}>✓</button>
                  </div>
                )}
                <div style={{ flex:1, overflowY:"auto" }}>
                  {filteredFiles.map(file => {
                    const fileLang = LANGS[file.lang] || {};
                    return (
                      <div key={file.id} onClick={() => openFile(file)} className="hov"
                        style={{ display:"flex", alignItems:"center", padding:"5px 10px", gap:7, fontSize:12, cursor:"pointer", color: activeTabId===file.id?T.text:T.dim, background: activeTabId===file.id?(isDark?"#094771":"#cce5ff"):"transparent" }}>
                        <span style={{ flexShrink:0 }}>{fileLang.icon||"📄"}</span>
                        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</span>
                        {file.saved === false && <span style={{ color:T.accent, fontSize:9 }}>●</span>}
                        <span onClick={e=>deleteFile(e,file.id)} className="tab-x" style={{ fontSize:13, cursor:"pointer" }}>×</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:"6px 12px", borderTop:`1px solid ${T.border}`, fontSize:10, color:T.dim, display:"flex", justifyContent:"space-between" }}>
                  <span>{files.length} files</span>
                  <span>{autoSave ? "⚡ Auto-save" : "Manual save"}</span>
                </div>
              </div>
            )}

            {/* SEARCH */}
            {panel==="search" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div className="panel-header">Search</div>
                <div style={{ padding:"0 8px 8px", display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                  <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Search across all files..." className="input-base"/>
                  <div style={{ fontSize:10, color:T.dim }}>{searchResults.length} results</div>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {searchResults.map((r,i) => (
                    <div key={i} onClick={() => openFile(r.file)} className="hov"
                      style={{ padding:"4px 10px", cursor:"pointer", fontSize:11 }}>
                      <div style={{ color:T.accent, fontWeight:600 }}>{r.file.name}:{r.line}</div>
                      <div style={{ color:T.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GIT */}
            {panel==="git" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div className="panel-header">Source Control</div>
                <div style={{ padding:"0 8px 8px", flexShrink:0 }}>
                  <input placeholder="Commit message..." className="input-base" style={{ marginBottom:6 }}/>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="tool-btn" style={{ flex:1, background:T.accent, color:"#fff", borderColor:T.accent }}>✓ Commit</button>
                    <button className="tool-btn" style={{ flex:1 }}>↑ Push</button>
                  </div>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  <div style={{ padding:"6px 12px", fontSize:11, color:T.dim, fontWeight:600 }}>CHANGES ({files.length})</div>
                  {files.map(f => (
                    <div key={f.id} className="hov" style={{ padding:"4px 12px", fontSize:12, display:"flex", justifyContent:"space-between", cursor:"pointer", color:T.text }}>
                      <span>{LANGS[f.lang]?.icon||"📄"} {f.name}</span>
                      <span style={{ color: f.saved===false?"#f48771":"#4ec9b0" }}>{f.saved===false?"M":"✓"}</span>
                    </div>
                  ))}
                  <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.border}`, marginTop:8 }}>
                    <div style={{ fontSize:10, color:T.dim, marginBottom:8 }}>BRANCHES</div>
                    {["main","develop","feature/new-ide"].map(b => (
                      <div key={b} className="hov" style={{ padding:"3px 6px", fontSize:11, color:T.text, cursor:"pointer", borderRadius:4 }}>
                        🌿 {b}{b==="main"?" ←":""}</div>
                    ))}
                  </div>
                  <div style={{ padding:"10px 12px", borderTop:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:10, color:T.dim, marginBottom:8 }}>RECENT COMMITS</div>
                    {["Add Monaco Editor","Fix Piston API","Initial commit"].map((c,i) => (
                      <div key={c} style={{ padding:"3px 0", fontSize:10, color:T.dim }}>
                        <span style={{ color:T.accent }}>abc{i+1}23</span> {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DEBUG */}
            {panel==="debug" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"auto" }}>
                <div className="panel-header">Run & Debug</div>
                <div style={{ padding:"0 8px 8px", display:"flex", flexDirection:"column", gap:8 }}>
                  <button className="tool-btn" onClick={runCode} style={{ background:T.accent, color:"#fff", borderColor:T.accent, fontWeight:600 }}>
                    {isRunning ? "⟳ Running..." : "▶ Run Code"}
                  </button>
                  <div style={{ fontSize:10, color:T.dim, padding:"8px 4px 4px" }}>VARIABLES</div>
                  {[["name","Rupak","string"],["count","42","number"],["arr","[1,2,3]","object"]].map(([k,v,t]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"2px 4px" }}>
                      <span style={{ color:"#9cdcfe" }}>{k}</span>
                      <span style={{ color:"#ce9178" }}>{v}</span>
                      <span style={{ color:T.dim }}>{t}</span>
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:T.dim, padding:"8px 4px 4px" }}>CALL STACK</div>
                  {["main()","factorial(5)","factorial(4)"].map((s,i) => (
                    <div key={s} style={{ fontSize:11, padding:"2px 4px", color: i===0?T.accent:T.dim }}>
                      {s}
                    </div>
                  ))}
                  <div style={{ fontSize:10, color:T.dim, padding:"8px 4px 4px" }}>BREAKPOINTS</div>
                  <div style={{ fontSize:11, color:T.dim, padding:"2px 4px" }}>
                    {activeTab ? `${activeTab.name}: No breakpoints` : "No file open"}
                  </div>
                </div>
              </div>
            )}

            {/* EXTENSIONS */}
            {panel==="extensions" && (
              <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                <div className="panel-header">Extensions</div>
                <div style={{ padding:"0 8px 6px", flexShrink:0 }}>
                  <input placeholder="🔍 Search Marketplace..." className="input-base"/>
                  <div style={{ display:"flex", gap:4, marginTop:6 }}>
                    {["All","Installed","Popular"].map(f => (
                      <button key={f} className="tool-btn" style={{ flex:1, fontSize:10, padding:"3px" }}>{f}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex:1, overflowY:"auto" }}>
                  {extensions.map(ext => (
                    <div key={ext.id} className="hov" style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{ext.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{ext.name}</span>
                          <button onClick={() => setExtensions(p=>p.map(e=>e.id===ext.id?{...e,enabled:!e.enabled}:e))}
                            style={{ width:34, height:17, borderRadius:9, border:"none", cursor:"pointer", background:ext.enabled?T.accent:"#555", position:"relative", flexShrink:0 }}>
                            <span style={{ position:"absolute", top:2, left:ext.enabled?19:2, width:13, height:13, background:"#fff", borderRadius:"50%", transition:"left .2s" }}/>
                          </button>
                        </div>
                        <div style={{ fontSize:10, color:T.dim, margin:"2px 0" }}>{ext.desc}</div>
                        <div style={{ fontSize:9, color:T.dim }}>
                          <span className="pill" style={{ color:T.accent, borderColor:T.accent, marginRight:4 }}>{ext.cat}</span>
                          ⬇ {ext.installs}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {panel==="settings" && (
              <div style={{ flex:1, overflowY:"auto", padding:"0 0 20px" }}>
                <div className="panel-header">Settings</div>
                <div style={{ padding:"0 12px", display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Theme */}
                  <div>
                    <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>🎨 Color Theme</label>
                    <select value={themeName} onChange={e=>setThemeName(e.target.value)} className="input-base">
                      {Object.keys(THEMES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>
                      Font Size: <span style={{ color:T.accent }}>{fontSize}px</span>
                    </label>
                    <input type="range" min={10} max={24} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{ width:"100%", accentColor:T.accent }}/>
                  </div>

                  {/* Tab Size */}
                  <div>
                    <label style={{ fontSize:11, color:T.dim, display:"block", marginBottom:5 }}>
                      Tab Size: <span style={{ color:T.accent }}>{tabSize}</span>
                    </label>
                    <input type="range" min={2} max={8} step={2} value={tabSize} onChange={e=>setTabSize(+e.target.value)} style={{ width:"100%", accentColor:T.accent }}/>
                  </div>

                  {/* Toggles */}
                  {[
                    ["Word Wrap",       wordWrap==="on",      ()=>setWordWrap(v=>v==="on"?"off":"on")],
                    ["Minimap",         minimap,              ()=>setMinimap(v=>!v)],
                    ["Line Numbers",    lineNumbers==="on",   ()=>setLineNumbers(v=>v==="on"?"off":"on")],
                    ["Auto Save",       autoSave,             ()=>setAutoSave(v=>!v)],
                    ["Vim Mode",        vimMode,              ()=>setVimMode(v=>!v)],
                    ["Smooth Scroll",   smoothScroll,         ()=>setSmoothScroll(v=>!v)],
                    ["Sticky Scroll",   stickyScroll,         ()=>setStickyScroll(v=>!v)],
                    ["Split Editor",    splitMode,            ()=>setSplitMode(v=>!v)],
                    ["Live Preview",    livePreview,          ()=>setLivePreview(v=>!v)],
                    ["Diff Mode",       diffMode,             ()=>setDiffMode(v=>!v)],
                  ].map(([label, val, fn]) => (
                    <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:T.text }}>{label}</span>
                      <button onClick={fn} style={{ width:36, height:18, borderRadius:9, border:"none", cursor:"pointer", background:val?T.accent:"#555", position:"relative", transition:"background .2s", flexShrink:0 }}>
                        <span style={{ position:"absolute", top:2, left:val?19:2, width:14, height:14, background:"#fff", borderRadius:"50%", transition:"left .2s" }}/>
                      </button>
                    </div>
                  ))}

                  {/* Shortcuts */}
                  <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                    <div style={{ fontSize:10, color:T.dim, marginBottom:8, letterSpacing:1 }}>KEYBOARD SHORTCUTS</div>
                    {[
                      ["Ctrl+Enter",     "Run code"],
                      ["Ctrl+Shift+P",   "Command Palette"],
                      ["Ctrl+I",         "AI Copilot"],
                      ["Ctrl+F",         "Find"],
                      ["Ctrl+H",         "Find & Replace"],
                      ["Ctrl+G",         "Go to Line"],
                      ["Ctrl+Shift+O",   "Go to Symbol"],
                      ["Ctrl+/",         "Toggle Comment"],
                      ["Ctrl+D",         "Select Next Match"],
                      ["Ctrl+Shift+K",   "Delete Line"],
                      ["Alt+↑↓",         "Move Line"],
                      ["Ctrl+\\",        "Split Editor"],
                      ["Ctrl+Shift+V",   "Live Preview"],
                      ["Ctrl+Shift+D",   "Diff View"],
                      ["Ctrl+=",         "Increase Font"],
                      ["Ctrl+-",         "Decrease Font"],
                      ["Alt+Z",          "Toggle Word Wrap"],
                      ["Ctrl+B",         "Toggle Sidebar"],
                      ["Ctrl+`",         "Toggle Terminal"],
                      ["Ctrl+W",         "Close Tab"],
                      ["Ctrl+S",         "Save"],
                      ["Ctrl+Alt+R",     "REST Client"],
                      ["Ctrl+Space",     "Snippets"],
                    ].map(([k,d]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:4, gap:6 }}>
                        <code style={{ color:isDark?"#569cd6":"#0000ff", background:isDark?"#1a1a1a":"#f0f0f0", padding:"1px 4px", borderRadius:3, fontSize:9, flexShrink:0 }}>{k}</code>
                        <span style={{ color:T.dim, textAlign:"right" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MAIN EDITOR AREA ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Editor + Tool Panel */}
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

            {/* Editor(s) */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* Breadcrumbs */}
              {!zenMode && activeTab && (
                <div style={{ height:24, background:T.bg, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 12px", gap:6, fontSize:11, color:T.dim, flexShrink:0 }}>
                  <span>📁 workspace</span>
                  <span>›</span>
                  <span>{LANGS[activeTab.lang]?.icon||"📄"} {activeTab.name}</span>
                  <span>›</span>
                  <span style={{ color:T.text }}>Ln {cursorPos.line}</span>
                  {selection.chars > 0 && <span style={{ marginLeft:"auto", color:T.accent }}>{selection.chars} chars, {selection.lines} lines selected</span>}
                </div>
              )}

              {/* Main editor pane */}
              <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
                {/* Left split */}
                <div style={{ flex:1, overflow:"hidden", borderRight: splitMode ? `2px solid ${T.accent}` : "none" }}>
                  {activeTab ? (
                    diffMode && splitTab ? (
                      <DiffEditor
                        height="100%"
                        original={splitTab.content}
                        modified={activeTab.content}
                        language={LANGS[activeTab.lang]?.monaco || "plaintext"}
                        theme={T.monaco}
                        options={{ fontSize, fontFamily:"'JetBrains Mono',Consolas,monospace", readOnly:false }}
                      />
                    ) : (
                      <Editor
                        key={activeTab.id}
                        height="100%"
                        language={LANGS[activeTab.lang]?.monaco || "plaintext"}
                        value={activeTab.content}
                        theme={T.monaco}
                        onChange={val => updateContent(val || "")}
                        onMount={handleEditorMount}
                        options={{
                          fontSize,
                          fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
                          fontLigatures: true,
                          wordWrap,
                          minimap: { enabled: minimap },
                          lineNumbers,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize,
                          insertSpaces: true,
                          detectIndentation: true,
                          bracketPairColorization: { enabled: true },
                          guides: { bracketPairs: "active", indentation: true },
                          suggest: { enabled: true, showMethods:true, showFunctions:true, showConstructors:true, showFields:true, showVariables:true, showClasses:true, showModules:true, showProperties:true, showKeywords:true, showSnippets:true },
                          quickSuggestions: { other:true, comments:false, strings:true },
                          parameterHints: { enabled:true },
                          formatOnPaste: true,
                          formatOnType: false,
                          cursorBlinking: "smooth",
                          cursorSmoothCaretAnimation: "on",
                          smoothScrolling: smoothScroll,
                          mouseWheelZoom: true,
                          renderWhitespace,
                          showFoldingControls: "always",
                          folding: true,
                          foldingStrategy: "indentation",
                          links: true,
                          colorDecorators: true,
                          renderLineHighlight: "all",
                          occurrencesHighlight: "multiFile",
                          selectionHighlight: true,
                          contextmenu: true,
                          multiCursorModifier: "alt",
                          accessibilitySupport: "off",
                          stickyScroll: { enabled: stickyScroll },
                          inlayHints: { enabled:"on" },
                          unicodeHighlight: { ambiguousCharacters: false },
                          "semanticHighlighting.enabled": true,
                        }}
                      />
                    )
                  ) : (
                    <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:T.dim, gap:16 }}>
                      <span style={{ fontSize:72, filter:"drop-shadow(0 0 30px rgba(0,122,204,0.3))" }}>⚡</span>
                      <div style={{ fontSize:26, fontWeight:700, color:T.dim }}>CodeDroid Ultra</div>
                      <div style={{ fontSize:13, color:T.dim, textAlign:"center", lineHeight:2.2, maxWidth:340 }}>
                        Monaco Engine · Real Compiler · AI Copilot<br/>
                        Python · C/C++ · Java · JS · TS · Rust · Go · 15+ langs<br/>
                        REST Client · Regex · JSON · Base64 · Pomodoro
                      </div>
                      <div style={{ display:"flex", gap:10, marginTop:8 }}>
                        <button onClick={() => { setPanel("explorer"); setSidebarOpen(true); }} style={{ background:T.accent, border:"none", color:"#fff", padding:"10px 22px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 }}>📂 Open Files</button>
                        <button onClick={() => setPaletteOpen(true)} style={{ background:"none", border:`1px solid ${T.border}`, color:T.text, padding:"10px 22px", borderRadius:6, cursor:"pointer", fontSize:13 }}>⌘ Commands</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right split editor */}
                {splitMode && splitTab && (
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <Editor
                      key={`split-${splitTab.id}`}
                      height="100%"
                      language={LANGS[splitTab.lang]?.monaco || "plaintext"}
                      value={splitTab.content}
                      theme={T.monaco}
                      onChange={val => {
                        setFiles(p=>p.map(f=>f.id===splitTab.id?{...f,content:val||""}:f));
                        setOpenTabs(p=>p.map(t=>t.id===splitTab.id?{...t,content:val||""}:t));
                      }}
                      options={{ fontSize, fontFamily:"'JetBrains Mono',Consolas,monospace", wordWrap, minimap:{enabled:false}, automaticLayout:true, tabSize }}
                    />
                  </div>
                )}
              </div>

              {/* Live Preview */}
              {livePreview && activeTab?.lang === "html" && (
                <div style={{ height:280, borderTop:`2px solid ${T.accent}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
                  <div style={{ height:28, background:T.sb, display:"flex", alignItems:"center", padding:"0 12px", gap:8, fontSize:11, color:T.dim, flexShrink:0, borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.accent }}>👁 Live Preview</span>
                    <span style={{ flex:1 }}>{activeTab.name}</span>
                    <button onClick={() => setLivePreview(false)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:14 }}>✕</button>
                  </div>
                  <iframe
                    srcDoc={activeTab.content}
                    style={{ flex:1, border:"none", background:"#fff" }}
                    sandbox="allow-scripts allow-same-origin"
                    title="Live Preview"
                  />
                </div>
              )}
            </div>

            {/* ── TOOL PANEL ── */}
            {activeTool && (
              <div className="fade-in" style={{ width:400, background:T.sb, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

                {/* REST CLIENT */}
                {activeTool==="rest" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>⚡ REST Client</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:8 }}>
                      {/* URL Bar */}
                      <div style={{ display:"flex", gap:6 }}>
                        <select value={restMethod} onChange={e=>setRestMethod(e.target.value)}
                          style={{ width:80, background:INPUT_BG, border:`1px solid ${T.border}`, color:T.text, borderRadius:5, padding:"6px", fontSize:12, fontWeight:700 }}
                          className={`rest-method-${restMethod}`}>
                          {["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].map(m=><option key={m}>{m}</option>)}
                        </select>
                        <input value={restUrl} onChange={e=>setRestUrl(e.target.value)} placeholder="https://api.example.com/endpoint"
                          className="input-base" style={{ flex:1 }}/>
                      </div>
                      <button onClick={runRestRequest} disabled={restLoading}
                        style={{ background:restLoading?"#555":T.accent, border:"none", color:"#fff", borderRadius:5, padding:"8px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                        {restLoading ? <><span className="spin">⟳</span> Sending...</> : `▶ Send ${restMethod}`}
                      </button>
                      {/* Headers */}
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>HEADERS (JSON)</div>
                        <textarea value={restHeaders} onChange={e=>setRestHeaders(e.target.value)} rows={3}
                          className="input-base" style={{ resize:"vertical" }}/>
                      </div>
                      {/* Body */}
                      {!["GET","HEAD"].includes(restMethod) && (
                        <div>
                          <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>BODY (JSON)</div>
                          <textarea value={restBody} onChange={e=>setRestBody(e.target.value)} rows={4}
                            className="input-base" style={{ resize:"vertical" }}/>
                        </div>
                      )}
                      {/* Response */}
                      {restResponse && (
                        <div>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:6 }}>
                            <span style={{ color: restResponse.error ? "#f48771" : restResponse.status < 300 ? "#4ec9b0" : "#e5c07b", fontWeight:700 }}>
                              {restResponse.error ? `✗ ${restResponse.error}` : `${restResponse.status} ${restResponse.statusText}`}
                            </span>
                            {restResponse.duration && <span style={{ color:T.dim }}>{restResponse.duration}ms</span>}
                          </div>
                          {restResponse.body && (
                            <pre style={{ background:isDark?"#1a1a1a":"#f0f0f0", border:`1px solid ${T.border}`, borderRadius:5, padding:8, fontSize:10, overflowX:"auto", overflowY:"auto", maxHeight:200, color:T.text, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
                              {restResponse.body}
                            </pre>
                          )}
                        </div>
                      )}
                      {/* History */}
                      {restHistory.length > 0 && (
                        <div>
                          <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>HISTORY</div>
                          {restHistory.slice(0,5).map((h,i) => (
                            <div key={i} onClick={() => { setRestUrl(h.url); setRestMethod(h.method); }} className="hov"
                              style={{ padding:"3px 6px", fontSize:10, cursor:"pointer", borderRadius:4, display:"flex", gap:6, alignItems:"center" }}>
                              <span className={`rest-method-${h.method}`} style={{ fontWeight:700, width:45 }}>{h.method}</span>
                              <span style={{ color:T.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.url}</span>
                              <span style={{ color: h.status<300?"#4ec9b0":"#f48771", flexShrink:0 }}>{h.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* REGEX TESTER */}
                {activeTool==="regex" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>🔧 Regex Tester</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:10 }}>
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>PATTERN</div>
                        <div style={{ display:"flex", gap:6 }}>
                          <input value={regexPattern} onChange={e=>setRegexPattern(e.target.value)} placeholder="(\w+)@(\w+\.\w+)" className="input-base" style={{ flex:1, fontFamily:"monospace" }}/>
                          <input value={regexFlags} onChange={e=>setRegexFlags(e.target.value)} placeholder="gi" className="input-base" style={{ width:50, textAlign:"center" }}/>
                        </div>
                        <div style={{ fontSize:10, color:T.dim, marginTop:4 }}>Flags: g=global, i=case-insensitive, m=multiline, s=dotAll</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>TEST STRING</div>
                        <textarea value={regexInput} onChange={e=>setRegexInput(e.target.value)} rows={4}
                          className="input-base" style={{ resize:"vertical" }}/>
                      </div>
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:10, color:T.dim }}>MATCHES</span>
                          <span style={{ fontSize:10, color: regexMatches.length>0?T.accent:T.dim }}>{regexMatches.length} found</span>
                        </div>
                        {regexMatches.length === 0 && regexPattern && (
                          <div style={{ fontSize:11, color:"#f48771" }}>No matches found</div>
                        )}
                        {regexMatches.map((m,i) => (
                          <div key={i} style={{ background:isDark?"#1a1a1a":"#f0f0f0", borderRadius:5, padding:"6px 10px", marginBottom:6, fontSize:11 }}>
                            <div style={{ color:T.accent, fontWeight:600 }}>Match {i+1}: "{m.match}"</div>
                            <div style={{ color:T.dim }}>Index: {m.index}</div>
                            {m.groups.length > 0 && (
                              <div style={{ color:T.text }}>Groups: {m.groups.map((g,j) => <span key={j} style={{ color:"#ce9178", marginRight:8 }}>${j+1}="{g}"</span>)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* JSON FORMATTER */}
                {activeTool==="json" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>📋 JSON Tools</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:8 }}>
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>INPUT JSON</div>
                        <textarea value={jsonInput} onChange={e=>setJsonInput(e.target.value)} rows={6}
                          className="input-base" style={{ resize:"vertical", fontFamily:"monospace", fontSize:11 }}/>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={formatJson} className="tool-btn" style={{ flex:1 }}>✨ Prettify</button>
                        <button onClick={minifyJson} className="tool-btn" style={{ flex:1 }}>⊟ Minify</button>
                        <button onClick={() => { try { const p = JSON.parse(jsonInput); setJsonOutput(JSON.stringify(Object.keys(p).sort().reduce((a,k) => ({...a,[k]:p[k]}),{}))); } catch {} }} className="tool-btn" style={{ flex:1 }}>⇅ Sort</button>
                      </div>
                      {jsonError && <div style={{ color:"#f48771", fontSize:11 }}>⚠️ {jsonError}</div>}
                      {jsonOutput && (
                        <div>
                          <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>OUTPUT</div>
                          <pre style={{ background:isDark?"#1a1a1a":"#f0f0f0", border:`1px solid ${T.border}`, borderRadius:5, padding:8, fontSize:10, overflowX:"auto", overflowY:"auto", maxHeight:200, color:T.text, whiteSpace:"pre-wrap" }}>
                            {jsonOutput}
                          </pre>
                          <button onClick={() => navigator.clipboard?.writeText(jsonOutput)} className="tool-btn" style={{ marginTop:6, width:"100%" }}>⎘ Copy Output</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BASE64 */}
                {activeTool==="base64" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>🔐 Base64 Tool</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ display:"flex", gap:6 }}>
                        {["encode","decode"].map(m => (
                          <button key={m} onClick={() => setB64Mode(m)} className={`tool-btn${b64Mode===m?" active":""}`} style={{ flex:1, textTransform:"capitalize" }}>{m}</button>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>INPUT</div>
                        <textarea value={b64Input} onChange={e=>setB64Input(e.target.value)} rows={4}
                          className="input-base" style={{ resize:"none", fontFamily:"monospace", fontSize:11 }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:T.dim, marginBottom:4 }}>OUTPUT</div>
                        <textarea value={b64Output} readOnly rows={4}
                          className="input-base" style={{ resize:"none", fontFamily:"monospace", fontSize:11, color:T.accent }}/>
                      </div>
                      <button onClick={() => navigator.clipboard?.writeText(b64Output)} className="tool-btn">⎘ Copy Result</button>
                    </div>
                  </div>
                )}

                {/* POMODORO */}
                {activeTool==="pomodoro" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>🍅 Pomodoro Timer</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ padding:20, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:11, color:T.dim, marginBottom:6, textTransform:"uppercase", letterSpacing:2 }}>
                          {pomodoroMode === "work" ? "🍅 Focus Time" : "☕ Break Time"}
                        </div>
                        <div style={{ fontSize:64, fontWeight:700, color:pomodoroMode==="work"?"#f48771":"#4ec9b0", fontFamily:"monospace", letterSpacing:4 }}>
                          {pomFmt(pomodoroTime)}
                        </div>
                        <div style={{ fontSize:11, color:T.dim, marginTop:8 }}>
                          Completed: {pomodoroCount} 🍅
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button onClick={() => setPomodoroActive(v=>!v)} className="tool-btn"
                          style={{ background:pomodoroActive?"#f48771":T.accent, color:"#fff", borderColor:"transparent", padding:"10px 24px", fontWeight:700, fontSize:13 }}>
                          {pomodoroActive ? "⏸ Pause" : "▶ Start"}
                        </button>
                        <button onClick={() => { setPomodoroActive(false); setPomodoroTime(25*60); setPomodoroMode("work"); }} className="tool-btn">↺ Reset</button>
                      </div>
                      <div style={{ display:"flex", gap:8, width:"100%" }}>
                        {[["🍅 Work","work",25*60],["☕ Short","short",5*60],["🛋️ Long","long",15*60]].map(([label,mode,time]) => (
                          <button key={mode} onClick={() => { setPomodoroActive(false); setPomodoroMode("work"); setPomodoroTime(time); }} className="tool-btn" style={{ flex:1, fontSize:10 }}>{label}</button>
                        ))}
                      </div>
                      <div style={{ width:"100%", background:isDark?"#1a1a1a":"#f0f0f0", borderRadius:10, height:6, overflow:"hidden" }}>
                        <div style={{ width:`${(1 - pomodoroTime / (pomodoroMode==="work"?25*60:5*60)) * 100}%`, height:"100%", background: pomodoroMode==="work"?"#f48771":"#4ec9b0", transition:"width .5s", borderRadius:10 }}/>
                      </div>
                    </div>
                  </div>
                )}

                {/* CODE STATS */}
                {activeTool==="stats" && (
                  <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                    <div style={{ padding:"10px 12px 6px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>📊 Code Statistics</span>
                      <button onClick={() => setActiveTool(null)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                    </div>
                    <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10 }}>
                      {activeTab && codeStats ? (
                        <>
                          <div style={{ textAlign:"center", marginBottom:8 }}>
                            <span style={{ fontSize:22 }}>{LANGS[activeTab.lang]?.icon||"📄"}</span>
                            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginTop:4 }}>{activeTab.name}</div>
                            <span className="pill" style={{ color:LANGS[activeTab.lang]?.color||T.dim, borderColor:LANGS[activeTab.lang]?.color||T.dim }}>
                              {activeTab.lang?.toUpperCase()}
                            </span>
                          </div>
                          {[
                            ["📏 Total Lines",   codeStats.lines],
                            ["📝 Non-empty Lines", codeStats.nonEmpty],
                            ["💬 Comment Lines", codeStats.comments],
                            ["🔤 Words",        codeStats.words],
                            ["📌 Characters",   codeStats.chars],
                            ["🔖 Bookmarks",    (activeTab.bookmarks||[]).length],
                          ].map(([label,val]) => (
                            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:isDark?"#1a1a1a":"#f0f0f0", borderRadius:8 }}>
                              <span style={{ fontSize:12, color:T.text }}>{label}</span>
                              <span style={{ fontSize:18, fontWeight:700, color:T.accent }}>{val.toLocaleString()}</span>
                            </div>
                          ))}
                          <div style={{ marginTop:8, padding:"10px 12px", background:isDark?"#1a1a1a":"#f0f0f0", borderRadius:8 }}>
                            <div style={{ fontSize:10, color:T.dim, marginBottom:6 }}>ALL FILES OVERVIEW</div>
                            {files.map(f => (
                              <div key={f.id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4, color:T.text }}>
                                <span>{LANGS[f.lang]?.icon||"📄"} {f.name}</span>
                                <span style={{ color:T.dim }}>{f.content.split("\n").length} lines</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign:"center", color:T.dim, padding:20 }}>Open a file to see statistics</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI COPILOT ── */}
            {copilotOpen && (
              <div className="fade-in" style={{ width:320, background:T.sb, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
                <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text }}>🤖 AI Copilot</div>
                    <div style={{ fontSize:10, color:T.dim }}>Claude Sonnet · Context-aware · Expert mode</div>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={() => setCopilotMessages([copilotMessages[0]])} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:12 }} title="Clear chat">🗑</button>
                    <button onClick={() => setCopilotOpen(false)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ padding:"8px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", flexWrap:"wrap", gap:5, flexShrink:0 }}>
                  {[
                    ["💡 Explain",    "Explain this code in detail, including time/space complexity"],
                    ["🐛 Debug",      "Find all bugs and errors in this code and fix them"],
                    ["⚡ Optimize",   "Optimize this code for maximum performance"],
                    ["📝 Document",   "Add comprehensive JSDoc/docstring comments"],
                    ["🧪 Tests",      "Write complete unit tests for this code"],
                    ["🔄 Refactor",   "Refactor this code following best practices and design patterns"],
                    ["🌐 Convert",    "Convert this code to another language (suggest the best one)"],
                    ["📊 Complexity", "Analyze time and space complexity of all functions"],
                    ["🔐 Security",   "Find security vulnerabilities and suggest fixes"],
                    ["🏗️ Design",    "Suggest better architecture/design patterns for this code"],
                  ].map(([label, prompt]) => (
                    <button key={label} onClick={() => askCopilot(prompt)} className="copilot-action">{label}</button>
                  ))}
                </div>

                {/* Messages */}
                <div ref={copilotRef} style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10 }}>
                  {copilotMessages.map((msg,i) => (
                    <div key={i} style={{
                      alignSelf: msg.role==="user" ? "flex-end" : "flex-start",
                      background: msg.role==="user" ? T.accent : isDark?"#2d2d2d":"#e8e8e8",
                      color: msg.role==="user" ? "#fff" : T.text,
                      borderRadius: msg.role==="user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      padding:"9px 12px", maxWidth:"94%", fontSize:11.5, lineHeight:1.7,
                      whiteSpace:"pre-wrap", wordBreak:"break-word"
                    }}>
                      {msg.text}
                    </div>
                  ))}
                  {copilotLoading && (
                    <div style={{ alignSelf:"flex-start", background:isDark?"#2d2d2d":"#e8e8e8", borderRadius:"14px 14px 14px 2px", padding:"10px 14px", fontSize:12, color:T.dim }}>
                      <span className="pulse">● ● ●</span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div style={{ padding:"8px 10px", borderTop:`1px solid ${T.border}`, display:"flex", gap:6, flexShrink:0 }}>
                  <textarea value={copilotInput} onChange={e=>setCopilotInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); askCopilot(); } }}
                    placeholder="Ask anything... (Enter=send, Shift+Enter=newline)"
                    rows={2}
                    className="input-base" style={{ flex:1, resize:"none" }}/>
                  <button onClick={() => askCopilot()} disabled={copilotLoading||!copilotInput.trim()}
                    style={{ background:copilotLoading?"#555":T.accent, border:"none", color:"#fff", borderRadius:7, padding:"0 12px", cursor:"pointer", fontSize:18, opacity:copilotInput.trim()?1:.4 }}>
                    {copilotLoading ? <span className="spin" style={{ fontSize:14 }}>⟳</span> : "↑"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── TERMINAL / PROBLEMS / DEBUG ── */}
          <div style={{ background:T.terminal, borderTop:`1px solid ${T.border}`, flexShrink:0, display:"flex", flexDirection:"column", height:terminalOpen?terminalH:32, transition:"height .2s ease", overflow:"hidden" }}>
            {/* Terminal Header */}
            <div style={{ display:"flex", alignItems:"center", height:32, paddingLeft:8, flexShrink:0, borderBottom:terminalOpen?`1px solid ${T.border}`:"none", userSelect:"none" }}>
              {/* Tabs */}
              {[
                { id:"output",   label:"OUTPUT"   },
                { id:"terminal", label:"TERMINAL" },
                { id:"problems", label:`PROBLEMS ${problems.length>0?`(${problems.length})`:""}`  },
                { id:"debug",    label:"DEBUG CONSOLE" },
              ].map(t => (
                <button key={t.id} onClick={() => { setTermTab(t.id); setTerminalOpen(true); }}
                  style={{ padding:"0 12px", height:"100%", background:"none", border:"none", fontSize:10, fontWeight:700, letterSpacing:.8, cursor:"pointer",
                    color: termTab===t.id&&terminalOpen ? T.text : T.dim,
                    borderBottom: termTab===t.id&&terminalOpen ? `2px solid ${T.accent}` : "2px solid transparent" }}>
                  {t.label}
                </button>
              ))}
              <div style={{ flex:1 }}/>
              {isRunning && <span className="pulse" style={{ fontSize:9, color:T.accent, marginRight:8 }}>● RUNNING</span>}
              <button onClick={() => setShowStdin(v=>!v)} style={{ background:"none", border:"none", color:showStdin?T.accent:T.dim, cursor:"pointer", fontSize:11, padding:"0 6px" }} title="stdin">⌨</button>
              <button onClick={() => setLogs([{type:"system",text:"🧹 Cleared"},{type:"divider",text:""}])} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 6px" }}>⌧</button>
              <button onClick={() => setTerminalH(h=>Math.min(h+60,500))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 4px" }}>⬆</button>
              <button onClick={() => setTerminalH(h=>Math.max(h-60,80))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:11, padding:"0 4px" }}>⬇</button>
              <button onClick={() => setTerminalOpen(v=>!v)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:13, padding:"0 8px" }}>{terminalOpen?"▼":"▲"}</button>
            </div>

            {/* stdin bar */}
            {terminalOpen && showStdin && (
              <div style={{ padding:"4px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, color:T.dim }}>stdin:</span>
                <input value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="Program input (newline separated for multiple inputs)..."
                  className="input-base" style={{ flex:1 }}/>
                <button onClick={() => setStdin("")} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:12 }}>✕</button>
              </div>
            )}

            {/* Content */}
            {terminalOpen && termTab==="output" && (
              <div ref={termRef} style={{ flex:1, overflowY:"auto", padding:"6px 14px 10px", fontSize:13, fontFamily:"'JetBrains Mono',Consolas,monospace" }}>
                {logs.map((log,i) =>
                  log.type==="divider"
                    ? <div key={i} style={{ borderTop:`1px solid ${isDark?"#333":"#ddd"}`, margin:"5px 0" }}/>
                    : <div key={i} style={{
                        color: log.type==="error"?"#f48771" : log.type==="cmd"?"#9cdcfe" : log.type==="info"?"#e5c07b" : log.type==="output"?T.text:"#666",
                        whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.7
                      }}>{log.text}</div>
                )}
                {isRunning && <span className="pulse" style={{ color:T.accent, fontSize:18 }}>█</span>}
              </div>
            )}

            {terminalOpen && termTab==="terminal" && (
              <div style={{ flex:1, padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:11, color:T.dim }}>
                  ⚠️ Interactive terminal requires native Android environment.<br/>
                  Use the OUTPUT tab to run code via Piston API, or try Termux for real terminal.
                </div>
                <div style={{ fontSize:11, color:T.accent, marginTop:4 }}>
                  💡 For real Linux terminal on Android: Install <strong>Termux</strong> from F-Droid
                </div>
                <div style={{ marginTop:8 }}>
                  {["node --version","python3 --version","java -version","gcc --version"].map(cmd => (
                    <div key={cmd} style={{ fontSize:11, color:T.dim, padding:"2px 0" }}>
                      <span style={{ color:"#9cdcfe" }}>$ </span>{cmd}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {terminalOpen && termTab==="problems" && (
              <div style={{ flex:1, overflowY:"auto", padding:"6px 14px" }}>
                {problems.length === 0 ? (
                  <div style={{ fontSize:12, color:"#4ec9b0", padding:"10px 0" }}>✓ No problems detected</div>
                ) : (
                  problems.map((p,i) => (
                    <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                      <span style={{ color: p.type==="error"?"#f48771":"#e5c07b", flexShrink:0 }}>{p.type==="error"?"✗":"⚠"}</span>
                      <div>
                        <div style={{ color:T.text }}>{p.msg.split("\n")[0]}</div>
                        <div style={{ color:T.dim }}>{p.file}</div>
                      </div>
                      <button onClick={() => setProblems(p2=>p2.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", marginLeft:"auto", fontSize:14 }}>×</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {terminalOpen && termTab==="debug" && (
              <div style={{ flex:1, overflowY:"auto", padding:"6px 14px", fontSize:12 }}>
                <div style={{ color:T.dim, marginBottom:8 }}>Debug console — run code to see output</div>
                {logs.filter(l=>l.type==="output"||l.type==="error").slice(-5).map((l,i) => (
                  <div key={i} style={{ color:l.type==="error"?"#f48771":T.text, padding:"2px 0", whiteSpace:"pre-wrap", fontSize:11 }}>{l.text}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM NAV (Mobile) ══════════════════════════════════════════════ */}
      {!zenMode && (
        <div style={{ height:46, background:T.sb, borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", flexShrink:0 }}>
          {[
            { icon:"📂", label:"Files",    fn:()=>{ setPanel("explorer"); setSidebarOpen(v=>panel!=="explorer"?true:!v); } },
            { icon:"⌘",  label:"CMD",      fn:()=>setPaletteOpen(true) },
            { icon:isRunning?"⟳":"▶", label:"Run", fn:runCode, run:true },
            { icon:"🤖", label:"AI",       fn:()=>setCopilotOpen(v=>!v) },
            { icon:"⚡", label:"Tools",    fn:()=>setActiveTool(t=>t?"":null||"rest") },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn} disabled={btn.run&&(!activeTab||isRunning||!LC.piston)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"4px 0", height:"100%", color:T.dim, opacity:btn.run&&(!activeTab||!LC.piston)?0.4:1 }}>
              <span style={{ fontSize:btn.run?19:16 }} className={btn.run&&isRunning?"spin":""}>{btn.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:.5 }}>{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ STATUS BAR ═══════════════════════════════════════════════════════ */}
      <div style={{ height:22, background:T.status, display:"flex", alignItems:"center", padding:"0 8px", gap:0, fontSize:10.5, flexShrink:0, color:"rgba(255,255,255,0.9)" }}>
        {[
          { text:"🌿 main", fn:()=>{ setPanel("git"); setSidebarOpen(true); } },
          activeTab && { text:`${LC.icon||"📄"} ${activeTab.lang?.toUpperCase()}`, fn:()=>{ setPanel("settings"); setSidebarOpen(true); } },
          activeTab && { text:`Ln ${cursorPos.line}, Col ${cursorPos.col}` },
          activeTab && selection.chars>0 && { text:`(${selection.chars} selected)` },
          activeTab && { text:`${activeTab.content.split("\n").length} lines`, fn:()=>editorInstance?.getAction("editor.action.gotoLine")?.run() },
          LC.piston && { text:`⚡ ${LC.piston} ${LC.ver}` },
          problems.length>0 && { text:`⚠ ${problems.length}`, style:{ color:"#f48771" } },
          vimMode && { text:"VIM" },
          autoSave && { text:"AUTO" },
          diffMode && { text:"DIFF" },
        ].filter(Boolean).map((item,i) => (
          <div key={i} className={item.fn?"status-item":""} onClick={item.fn} style={{ padding:"0 8px", height:"100%", display:"flex", alignItems:"center", ...(item.style||{}) }}>
            {item.text}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex" }}>
          <div className="status-item" onClick={() => setActiveTool("pomodoro")}>
            {pomodoroActive ? `${pomodoroMode==="work"?"🍅":"☕"} ${pomFmt(pomodoroTime)}` : "🍅"}
          </div>
          <div className="status-item" style={{ opacity:.8 }}>{themeName}</div>
          <div className="status-item" style={{ opacity:.8 }}>UTF-8</div>
          <div className="status-item" style={{ opacity:.8 }}>Monaco {VERSION}</div>
        </div>
      </div>

      {/* ══ COMMAND PALETTE ══════════════════════════════════════════════════ */}
      {paletteOpen && (
        <>
          <div className="overlay" onClick={() => setPaletteOpen(false)}/>
          <div className="modal fade-in" style={{ maxHeight:"70vh", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14, color:T.dim }}>⌘</span>
                <input
                  ref={paletteRef}
                  autoFocus
                  value={paletteQuery}
                  onChange={e=>{ setPaletteQuery(e.target.value); setPaletteIdx(0); }}
                  placeholder="Type a command or search..."
                  className="input-base"
                  style={{ flex:1, fontSize:14, padding:"6px 0", background:"transparent", border:"none" }}
                />
                <span style={{ fontSize:10, color:T.dim }}>ESC to close</span>
              </div>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {Object.entries(
                filteredCommands.reduce((acc, cmd) => ({ ...acc, [cmd.category]: [...(acc[cmd.category]||[]), cmd] }), {})
              ).map(([cat, cmds]) => (
                <div key={cat}>
                  <div style={{ padding:"6px 16px 2px", fontSize:9, color:T.dim, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>{cat}</div>
                  {cmds.map((cmd, i) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <div key={cmd.id} className={`palette-item${paletteIdx===globalIdx?" active":""}`}
                        onClick={() => executePaletteCommand(cmd)}
                        onMouseEnter={() => setPaletteIdx(globalIdx)}>
                        <span>{cmd.label}</span>
                        {cmd.shortcut && <code style={{ fontSize:10, background:isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)", padding:"2px 6px", borderRadius:4 }}>{cmd.shortcut}</code>}
                      </div>
                    );
                  })}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div style={{ padding:24, textAlign:"center", color:T.dim, fontSize:12 }}>No commands found for "{paletteQuery}"</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══ SNIPPET PANEL ════════════════════════════════════════════════════ */}
      {snippetOpen && (
        <>
          <div className="overlay" onClick={() => setSnippetOpen(false)}/>
          <div className="modal fade-in" style={{ maxHeight:"60vh", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span>✂️</span>
                <input autoFocus value={snippetQuery} onChange={e=>setSnippetQuery(e.target.value)}
                  placeholder={`Search ${activeTab?.lang||""} snippets...`}
                  className="input-base" style={{ flex:1, fontSize:14, padding:"6px 0", background:"transparent", border:"none" }}/>
                <button onClick={() => setSnippetOpen(false)} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:18 }}>✕</button>
              </div>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {filteredSnippets.length === 0 && (
                <div style={{ padding:20, textAlign:"center", color:T.dim, fontSize:12 }}>No snippets for {activeTab?.lang||"this language"}</div>
              )}
              {filteredSnippets.map((snip, i) => (
                <div key={i} onClick={() => insertSnippet(snip)} className="hov"
                  style={{ padding:"10px 16px", cursor:"pointer", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <code style={{ color:T.accent, fontSize:13, fontWeight:700 }}>{snip.prefix}</code>
                    <span style={{ fontSize:10, color:T.dim }}>{snip.desc}</span>
                  </div>
                  <pre style={{ fontSize:10, color:T.dim, whiteSpace:"pre-wrap" }}>{snip.body.slice(0,80)}{snip.body.length>80?"...":""}</pre>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ ZEN MODE EXIT ════════════════════════════════════════════════════ */}
      {zenMode && (
        <button onClick={() => setZenMode(false)}
          style={{ position:"fixed", top:10, right:10, zIndex:999, background:T.accent, border:"none", color:"#fff", borderRadius:20, padding:"6px 16px", cursor:"pointer", fontSize:12, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          Exit Zen Mode ✕
        </button>
      )}
    </div>
  );
}
