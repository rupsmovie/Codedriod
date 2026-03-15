import React, { useState, useRef, useEffect, useCallback } from "react";
const THEMES = { "VS Dark": { bg:"#1e1e1e",sidebar:"#252526",tab:"#2d2d2d",activeTab:"#1e1e1e",border:"#111",text:"#d4d4d4",dim:"#858585",accent:"#007acc",terminal:"#141414",lineNum:"#3c3c3c",statusBar:"#007acc",hover:"#2a2d2e",keyword:"#569cd6",string:"#ce9178",number:"#b5cea8",comment:"#6a9955",func:"#dcdcaa",builtin:"#c586c0" }, "Monokai": { bg:"#272822",sidebar:"#1e1f1c",tab:"#3e3d32",activeTab:"#272822",border:"#1a1a17",text:"#f8f8f2",dim:"#75715e",accent:"#a6e22e",terminal:"#1a1b18",lineNum:"#3e3d32",statusBar:"#75715e",hover:"#3e3d32",keyword:"#f92672",string:"#e6db74",number:"#ae81ff",comment:"#75715e",func:"#a6e22e",builtin:"#66d9e8" }, "Dracula": { bg:"#282a36",sidebar:"#21222c",tab:"#343746",activeTab:"#282a36",border:"#191a21",text:"#f8f8f2",dim:"#6272a4",accent:"#bd93f9",terminal:"#1e1f29",lineNum:"#44475a",statusBar:"#bd93f9",hover:"#343746",keyword:"#ff79c6",string:"#f1fa8c",number:"#bd93f9",comment:"#6272a4",func:"#50fa7b",builtin:"#8be9fd" }, "One Dark": { bg:"#282c34",sidebar:"#21252b",tab:"#2c313a",activeTab:"#282c34",border:"#181a1f",text:"#abb2bf",dim:"#5c6370",accent:"#61afef",terminal:"#1d2026",lineNum:"#3b4048",statusBar:"#61afef",hover:"#2c313a",keyword:"#c678dd",string:"#98c379",number:"#d19a66",comment:"#5c6370",func:"#61afef",builtin:"#56b6c2" } };
const LANG_MAP = { py:"python",c:"c",cpp:"cpp",h:"c",java:"java",js:"javascript",ts:"typescript",html:"html",css:"css",txt:"text",json:"json",md:"markdown" };
const LANG_ICON = { python:"🐍",c:"⚙️",cpp:"⚙️",java:"☕",javascript:"🟨",typescript:"🔷",html:"🌐",css:"🎨",text:"📄",json:"📋",markdown:"📝" };
const DEFAULT_FILES = [
  { id:1, name:"main.py", language:"python", content:"# Python\nprint('Hello, World!')\n\nname = 'Rupak'\nprint(f'Welcome, {name}!')\n\nfor i in range(1,6):\n    print(f'  [{i}] Hello')\n" },
  { id:2, name:"hello.c", language:"c", content:"#include <stdio.h>\nint main() {\n    printf('Hello, World!\\n');\n    return 0;\n}\n" },
  { id:3, name:"Main.java", language:"java", content:"public class Main {\n    public static void main(String[] args) {\n        System.out.println('Hello, World!');\n    }\n}\n" },
  { id:4, name:"script.js", language:"javascript", content:"console.log('Hello, World!');\nconst name = 'Rupak';\nconsole.log(`Welcome, ${name}!`);\n" },
  { id:5, name:"index.html", language:"html", content:"<!DOCTYPE html>\n<html>\n<head><title>CodeDroid</title></head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>\n" },
];
function getTemplate(lang,filename){const cls=filename.replace(/\.\w+$/,"");return({python:`# ${filename}\nprint("Hello!")\n`,c:`#include <stdio.h>\nint main(){\n    printf("Hello!\\n");\n    return 0;\n}\n`,cpp:`#include <iostream>\nusing namespace std;\nint main(){\n    cout<<"Hello!"<<endl;\n    return 0;\n}\n`,java:`public class ${cls}{\n    public static void main(String[] args){\n        System.out.println("Hello!");\n    }\n}\n`,javascript:`console.log("Hello!");\n`,html:`<!DOCTYPE html>\n<html>\n<head><title>${cls}</title></head>\n<body>\n<h1>Hello!</h1>\n</body>\n</html>\n`,css:`body{margin:0;}\n`,json:`{"name":"${cls}"}\n`})[lang]||`// ${filename}\n`;}
export default function App(){
  const [files,setFiles]=useState(DEFAULT_FILES);
  const [openTabs,setOpenTabs]=useState([DEFAULT_FILES[0]]);
  const [activeTabId,setActiveTabId]=useState(1);
  const [panel,setPanel]=useState("explorer");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [copilotOpen,setCopilotOpen]=useState(false);
  const [terminalOpen,setTerminalOpen]=useState(true);
  const [terminalH,setTerminalH]=useState(180);
  const [theme,setTheme]=useState("VS Dark");
  const [fontSize,setFontSize]=useState(13);
  const [wordWrap,setWordWrap]=useState(false);
  const [syntaxOn,setSyntaxOn]=useState(true);
  const [logs,setLogs]=useState([{type:"system",text:"⚡ CodeDroid Pro ready!"},{type:"system",text:"🤖 AI Copilot active | Ctrl+Enter = Run"},{type:"divider"}]);
  const [isRunning,setIsRunning]=useState(false);
  const [newFileName,setNewFileName]=useState("");
  const [showNewFile,setShowNewFile]=useState(false);
  const [findOpen,setFindOpen]=useState(false);
  const [findText,setFindText]=useState("");
  const [replaceText,setReplaceText]=useState("");
  const [cursorPos,setCursorPos]=useState({line:1,col:1});
  const [copilotMessages,setCopilotMessages]=useState([{role:"assistant",text:"Hi! I'm your AI Copilot 🤖\n\nI can:\n• Explain & debug your code\n• Generate functions\n• Optimize performance\n\nWhat do you need?"}]);
  const [copilotInput,setCopilotInput]=useState("");
  const [copilotLoading,setCopilotLoading]=useState(false);
  const [fileSearch,setFileSearch]=useState("");
  const [contextMenu,setContextMenu]=useState(null);
  const T=THEMES[theme];
  const textareaRef=useRef(null);
  const hlRef=useRef(null);
  const termRef=useRef(null);
  const copilotRef=useRef(null);
  const activeTab=openTabs.find(t=>t.id===activeTabId)||null;
  const updateContent=useCallback((content)=>{setFiles(p=>p.map(f=>f.id===activeTabId?{...f,content}:f));setOpenTabs(p=>p.map(t=>t.id===activeTabId?{...t,content}:t));},[activeTabId]);
  const openFile=useCallback((file)=>{setOpenTabs(p=>p.find(t=>t.id===file.id)?p:[...p,file]);setActiveTabId(file.id);},[]);
  const closeTab=useCallback((e,tabId)=>{e&&e.stopPropagation();setOpenTabs(p=>{const next=p.filter(t=>t.id!==tabId);if(activeTabId===tabId)setActiveTabId(next.length?next[next.length-1].id:null);return next;});},[activeTabId]);
  const createFile=useCallback(()=>{if(!newFileName.trim())return;const ext=newFileName.split(".").pop().toLowerCase();const lang=LANG_MAP[ext]||"text";const nf={id:Date.now(),name:newFileName,language:lang,content:getTemplate(lang,newFileName)};setFiles(p=>[...p,nf]);openFile(nf);setNewFileName("");setShowNewFile(false);},[newFileName,openFile]);
  const deleteFile=useCallback((e,fileId)=>{e&&e.stopPropagation();setFiles(p=>p.filter(f=>f.id!==fileId));closeTab(null,fileId);},[closeTab]);
  const addLog=(type,text)=>setLogs(p=>[...p,{type,text}]);
  const runCode=useCallback(async()=>{
    if(!activeTab||isRunning)return;
    setIsRunning(true);setTerminalOpen(true);
    setLogs(p=>[...p,{type:"cmd",text:`$ run ${activeTab.name} [${new Date().toLocaleTimeString()}]`},{type:"info",text:"⟳ AI Engine executing..."}]);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Execute this ${activeTab.language} code. Return ONLY terminal output, no explanation, no markdown. Show exact errors with line numbers.\n\nFile: ${activeTab.name}\n\n${activeTab.content}`}]})});
      const data=await res.json();
      const out=data.content?.[0]?.text?.trim()||"(no output)";
      const isErr=/error|exception|traceback/i.test(out);
      setLogs(p=>[...p.filter(l=>!l.text?.includes("⟳")),{type:isErr?"error":"output",text:out},{type:"system",text:`✓ Exited(${isErr?1:0})`},{type:"divider"}]);
    }catch{setLogs(p=>[...p.filter(l=>!l.text?.includes("⟳")),{type:"error",text:"✗ Network error."},{type:"divider"}]);}
    setIsRunning(false);
  },[activeTab,isRunning]);
  const askCopilot=useCallback(async()=>{
    if(!copilotInput.trim()||copilotLoading)return;
    const userMsg=copilotInput.trim();setCopilotInput("");
    setCopilotMessages(p=>[...p,{role:"user",text:userMsg}]);setCopilotLoading(true);
    try{
      const ctx=activeTab?`File: ${activeTab.name} (${activeTab.language})\nCode:\n\`\`\`\n${activeTab.content.slice(0,1500)}\n\`\`\`\n\n`:"";
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:"You are a coding AI Copilot in CodeDroid Pro mobile IDE. Be concise and helpful. Use triple backticks for code.",messages:[...copilotMessages.slice(-4).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text})),{role:"user",content:ctx+userMsg}]})});
      const data=await res.json();
      setCopilotMessages(p=>[...p,{role:"assistant",text:data.content?.[0]?.text||"Try again."}]);
    }catch{setCopilotMessages(p=>[...p,{role:"assistant",text:"⚠️ Network error."}]);}
    setCopilotLoading(false);
  },[copilotInput,copilotLoading,copilotMessages,activeTab]);
  const handleKeyDown=useCallback((e)=>{
    const ta=e.target;const s=ta.selectionStart,en=ta.selectionEnd;const c=activeTab?.content||"";
    if(e.key==="Tab"){e.preventDefault();if(e.shiftKey){const before=c.substring(0,s);const ls=before.lastIndexOf("\n")+1;if(c.substring(ls,ls+4)==="    "){updateContent(c.substring(0,ls)+c.substring(ls+4));setTimeout(()=>{ta.selectionStart=ta.selectionEnd=Math.max(ls,s-4);},0);}}else{updateContent(c.substring(0,s)+"    "+c.substring(en));setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+4;},0);}}
    if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();runCode();}
    if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();addLog("system","💾 Saved");}
    if((e.ctrlKey||e.metaKey)&&e.key==="f"){e.preventDefault();setFindOpen(v=>!v);}
    if((e.ctrlKey||e.metaKey)&&e.key==="i"){e.preventDefault();setCopilotOpen(v=>!v);}
    if((e.ctrlKey||e.metaKey)&&e.key==="b"){e.preventDefault();setSidebarOpen(v=>!v);}
    if((e.ctrlKey||e.metaKey)&&e.key==="`"){e.preventDefault();setTerminalOpen(v=>!v);}
    if((e.ctrlKey||e.metaKey)&&e.key==="w"){e.preventDefault();closeTab(null,activeTabId);}
    if((e.ctrlKey||e.metaKey)&&e.key==="/"){e.preventDefault();const lines=c.split("\n");let chars=0,sl=-1,el=-1;for(let i=0;i<lines.length;i++){if(sl===-1&&chars+lines[i].length>=s)sl=i;if(chars+lines[i].length>=en){el=i;break;}chars+=lines[i].length+1;}if(sl===-1)sl=lines.length-1;if(el===-1)el=lines.length-1;const cc=activeTab?.language==="python"?"#":"//";const allC=lines.slice(sl,el+1).every(l=>l.trimStart().startsWith(cc));const nl=[...lines];for(let i=sl;i<=el;i++){nl[i]=allC?nl[i].replace(new RegExp(`^(\\s*)${cc.replace("/","\\/")} ?`),"$1"):cc+" "+nl[i];}updateContent(nl.join("\n"));}
    if((e.ctrlKey||e.metaKey)&&e.key==="d"){e.preventDefault();const lines=c.split("\n");const li=c.substring(0,s).split("\n").length-1;lines.splice(li+1,0,lines[li]);updateContent(lines.join("\n"));}
    if(e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();const lines=c.split("\n");const li=c.substring(0,s).split("\n").length-1;const t2=li+(e.key==="ArrowUp"?-1:1);if(t2>=0&&t2<lines.length){[lines[li],lines[t2]]=[lines[t2],lines[li]];updateContent(lines.join("\n"));}}
    const pairs={"(":")","{":"}","[":"]",'"':'"',"'":"'"};
    if(pairs[e.key]&&s===en){e.preventDefault();updateContent(c.substring(0,s)+e.key+pairs[e.key]+c.substring(en));setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+1;},0);}
  },[activeTab,activeTabId,runCode,updateContent,closeTab]);
  const syncScroll=(e)=>{if(hlRef.current){hlRef.current.scrollTop=e.target.scrollTop;hlRef.current.scrollLeft=e.target.scrollLeft;}const ln=document.getElementById("lnp");if(ln)ln.scrollTop=e.target.scrollTop;};
  const updateCursor=(e)=>{const v=e.target.value,p=e.target.selectionStart;const l=v.substring(0,p).split("\n");setCursorPos({line:l.length,col:l[l.length-1].length+1});};
  useEffect(()=>{if(termRef.current)termRef.current.scrollTop=termRef.current.scrollHeight;},[logs]);
  useEffect(()=>{if(copilotRef.current)copilotRef.current.scrollTop=copilotRef.current.scrollHeight;},[copilotMessages]);
  const lineCount=activeTab?activeTab.content.split("\n").length:0;
  const lnNums=Array.from({length:lineCount},(_,i)=>i+1).join("\n");
  const filteredFiles=files.filter(f=>!fileSearch||f.name.toLowerCase().includes(fileSearch.toLowerCase()));
  const findCount=activeTab&&findText?activeTab.content.split(findText).length-1:0;
  const doReplace=(all)=>{if(!activeTab||!findText)return;updateContent(all?activeTab.content.split(findText).join(replaceText):activeTab.content.replace(findText,replaceText));};
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:T.bg,color:T.text,overflow:"hidden",fontFamily:"'JetBrains Mono',Consolas,monospace",fontSize}} onClick={()=>contextMenu&&setContextMenu(null)}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#404040;border-radius:3px}input,textarea,button{font-family:inherit}.hov:hover{background:${T.hover}!important}.nav-btn{border:none;cursor:pointer;background:none;padding:8px;width:44px;text-align:center;font-size:18px;color:${T.dim};border-left:2px solid transparent}.nav-btn:hover{color:${T.text}}.nav-btn.active{color:${T.text};border-left:2px solid ${T.accent}}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin .8s linear infinite;display:inline-block}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.pulse{animation:pulse 1.2s ease infinite}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .15s ease}.ctx-item:hover{background:${T.hover}}.tab-x{opacity:.4}.tab-x:hover{opacity:1;color:#f48771}`}</style>
      {/* TITLE BAR */}
      <div style={{height:36,background:T.sidebar,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 8px",gap:6,flexShrink:0}}>
        <span style={{fontSize:18}}>⚡</span>
        <span style={{color:T.accent,fontWeight:700,fontSize:13}}>CodeDroid Pro</span>
        <div style={{flex:1,textAlign:"center",fontSize:11,color:T.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeTab?`${LANG_ICON[activeTab.language]||"📄"} ${activeTab.name}`:"No file open"}</div>
        {[{icon:"🔍",action:()=>setFindOpen(v=>!v)},{icon:"🤖",action:()=>setCopilotOpen(v=>!v)}].map(({icon,action},i)=>(
          <button key={i} onClick={action} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",padding:"4px 6px",fontSize:14}}>{icon}</button>
        ))}
        <button onClick={runCode} disabled={isRunning||!activeTab} style={{background:isRunning?"#094771":T.accent,border:"none",color:"#fff",cursor:activeTab?"pointer":"not-allowed",padding:"5px 12px",borderRadius:5,display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,opacity:activeTab?1:.4}}>
          {isRunning?<><span className="spin">⟳</span> Running</>:<>▶ Run</>}
        </button>
      </div>
      {/* FIND BAR */}
      {findOpen&&(
        <div className="fade-in" style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"5px 10px",display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",flexShrink:0}}>
          <input value={findText} onChange={e=>setFindText(e.target.value)} placeholder="Find..." autoFocus style={{width:130,background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"3px 7px",fontSize:11}}/>
          <span style={{fontSize:10,color:T.dim}}>{findText?`${findCount} found`:""}</span>
          <input value={replaceText} onChange={e=>setReplaceText(e.target.value)} placeholder="Replace..." style={{width:130,background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"3px 7px",fontSize:11}}/>
          <button onClick={()=>doReplace(false)} style={{background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Replace</button>
          <button onClick={()=>doReplace(true)} style={{background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"3px 8px",cursor:"pointer",fontSize:11}}>All</button>
          <button onClick={()=>setFindOpen(false)} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:16,marginLeft:"auto"}}>✕</button>
        </div>
      )}
      {/* TAB BAR */}
      <div style={{display:"flex",background:T.sidebar,borderBottom:`1px solid ${T.border}`,overflowX:"auto",flexShrink:0,height:33,scrollbarWidth:"none"}}>
        {openTabs.map(tab=>(
          <div key={tab.id} onClick={()=>setActiveTabId(tab.id)} className="hov" style={{display:"flex",alignItems:"center",gap:5,padding:"0 12px",cursor:"pointer",whiteSpace:"nowrap",fontSize:12,height:"100%",borderRight:`1px solid ${T.border}`,flexShrink:0,background:tab.id===activeTabId?T.activeTab:T.tab,color:tab.id===activeTabId?T.text:T.dim,borderTop:`2px solid ${tab.id===activeTabId?T.accent:"transparent"}`}}>
            <span>{LANG_ICON[tab.language]||"📄"}</span>
            <span style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis"}}>{tab.name}</span>
            <span onClick={e=>closeTab(e,tab.id)} className="tab-x" style={{marginLeft:2,cursor:"pointer",fontSize:14}}>×</span>
          </div>
        ))}
        <button onClick={()=>setShowNewFile(true)} style={{padding:"0 12px",background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:20}}>+</button>
      </div>
      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* ACTIVITY BAR */}
        <div style={{width:44,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:4,flexShrink:0}}>
          {[{id:"explorer",icon:"⎇"},{id:"settings",icon:"⚙"}].map(n=>(
            <button key={n.id} className={`nav-btn${panel===n.id&&sidebarOpen?" active":""}`} onClick={()=>{if(panel===n.id){setSidebarOpen(v=>!v);}else{setPanel(n.id);setSidebarOpen(true);}}}>
              {n.icon}
            </button>
          ))}
        </div>
        {/* SIDEBAR */}
        {sidebarOpen&&(
          <div className="fade-in" style={{width:210,background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
            {panel==="explorer"&&(
              <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
                <div style={{padding:"10px 12px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:"uppercase"}}>Explorer</span>
                  <button onClick={()=>setShowNewFile(v=>!v)} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:17}}>＋</button>
                </div>
                <div style={{padding:"0 8px 6px"}}>
                  <input value={fileSearch} onChange={e=>setFileSearch(e.target.value)} placeholder="🔍 Search files..." style={{width:"100%",background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"4px 8px",fontSize:11}}/>
                </div>
                {showNewFile&&(
                  <div style={{padding:"2px 8px 6px",display:"flex",gap:4}}>
                    <input autoFocus value={newFileName} onChange={e=>setNewFileName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")createFile();if(e.key==="Escape")setShowNewFile(false);}} placeholder="main.py, Main.java..." style={{flex:1,background:T.tab,border:`1px solid ${T.accent}`,color:T.text,borderRadius:3,padding:"4px 7px",fontSize:11}}/>
                    <button onClick={createFile} style={{background:T.accent,border:"none",color:"#fff",borderRadius:3,padding:"4px 8px",cursor:"pointer",fontSize:11}}>✓</button>
                  </div>
                )}
                <div style={{flex:1,overflowY:"auto"}}>
                  {filteredFiles.map(file=>(
                    <div key={file.id} onClick={()=>openFile(file)} onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,file});}} className="hov" style={{display:"flex",alignItems:"center",padding:"5px 10px",gap:6,fontSize:12,cursor:"pointer",color:activeTabId===file.id?T.text:T.dim,background:activeTabId===file.id?"#094771":"transparent"}}>
                      <span>{LANG_ICON[file.language]||"📄"}</span>
                      <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>
                      <span onClick={e=>deleteFile(e,file.id)} className="tab-x" style={{fontSize:13,cursor:"pointer"}}>×</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:"6px 12px",borderTop:`1px solid ${T.border}`,fontSize:10,color:T.dim}}>{files.length} files</div>
              </div>
            )}
            {panel==="settings"&&(
              <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:1.5,textTransform:"uppercase"}}>Settings</div>
                <div>
                  <label style={{fontSize:11,color:T.dim,display:"block",marginBottom:5}}>Theme</label>
                  <select value={theme} onChange={e=>setTheme(e.target.value)} style={{width:"100%",background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:4,padding:"5px 8px",fontSize:12}}>
                    {Object.keys(THEMES).map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:T.dim,display:"block",marginBottom:5}}>Font Size: <span style={{color:T.accent}}>{fontSize}px</span></label>
                  <input type="range" min={10} max={20} value={fontSize} onChange={e=>setFontSize(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/>
                </div>
                {[["Syntax",syntaxOn,()=>setSyntaxOn(v=>!v)],["Word Wrap",wordWrap,()=>setWordWrap(v=>!v)]].map(([l,v,f])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:T.text}}>{l}</span>
                    <button onClick={f} style={{width:36,height:18,borderRadius:9,border:"none",cursor:"pointer",background:v?T.accent:"#555",position:"relative"}}>
                      <span style={{position:"absolute",top:2,left:v?19:2,width:14,height:14,background:"#fff",borderRadius:"50%",transition:"left .2s"}}/>
                    </button>
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                  <div style={{fontSize:10,color:T.dim,marginBottom:8}}>SHORTCUTS</div>
                  {[["Ctrl+Enter","Run"],["Tab","Indent"],["Shift+Tab","Unindent"],["Ctrl+/","Comment"],["Ctrl+D","Duplicate"],["Alt+↑↓","Move line"],["Ctrl+F","Find"],["Ctrl+I","Copilot"],["Ctrl+W","Close tab"]].map(([k,d])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4}}>
                      <code style={{color:T.keyword,background:T.bg,padding:"1px 3px",borderRadius:2,fontSize:9}}>{k}</code>
                      <span style={{color:T.dim}}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* EDITOR COLUMN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            {activeTab?(
              <div style={{flex:1,display:"flex",overflow:"hidden"}}>
                <div id="lnp" style={{background:T.bg,color:T.lineNum,fontSize,lineHeight:"21px",padding:"12px 6px 12px 8px",textAlign:"right",userSelect:"none",width:lineCount>=100?44:36,flexShrink:0,whiteSpace:"pre",overflowY:"hidden",fontFamily:"inherit",borderRight:`1px solid ${T.border}`,pointerEvents:"none"}}>{lnNums}</div>
                <div style={{flex:1,position:"relative",overflow:"hidden"}}>
                  <textarea ref={textareaRef} value={activeTab.content}
                    onChange={e=>{updateContent(e.target.value);const ln=document.getElementById("lnp");if(ln)ln.scrollTop=e.target.scrollTop;}}
                    onScroll={syncScroll} onClick={updateCursor} onKeyUp={updateCursor} onKeyDown={handleKeyDown}
                    onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,editor:true});}}
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",background:T.bg,color:T.text,fontSize,lineHeight:"21px",padding:"12px",fontFamily:"inherit",whiteSpace:wordWrap?"pre-wrap":"pre",overflowX:wordWrap?"hidden":"auto",overflowY:"auto",resize:"none",outline:"none",border:"none",caretColor:"#aeafad",tabSize:4}}
                    spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"/>
                </div>
              </div>
            ):(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.dim,gap:12}}>
                <span style={{fontSize:56}}>⚡</span>
                <div style={{fontSize:20,fontWeight:700}}>CodeDroid Pro</div>
                <div style={{fontSize:12,textAlign:"center",lineHeight:1.9}}>AI-Powered Mobile IDE<br/>Python · C · Java · JS · HTML</div>
                <button onClick={()=>{setPanel("explorer");setSidebarOpen(true);}} style={{background:T.accent,border:"none",color:"#fff",padding:"8px 20px",borderRadius:5,cursor:"pointer",fontSize:13,fontWeight:600}}>📂 Open Explorer</button>
              </div>
            )}
          </div>
          {/* TERMINAL */}
          <div style={{background:T.terminal,borderTop:`1px solid ${T.border}`,flexShrink:0,display:"flex",flexDirection:"column",height:terminalOpen?terminalH:30,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 10px",height:30,userSelect:"none",flexShrink:0,borderBottom:terminalOpen?`1px solid ${T.border}`:"none"}}>
              <span onClick={()=>setTerminalOpen(v=>!v)} style={{flex:1,display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <span>⬛</span>
                <span style={{fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:1}}>Terminal</span>
                {isRunning&&<span className="pulse" style={{fontSize:9,color:T.accent}}>● RUNNING</span>}
              </span>
              <button onClick={()=>setLogs([{type:"system",text:"🧹 Cleared"},{type:"divider"}])} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:11}}>⌧</button>
              <button onClick={()=>setTerminalH(h=>Math.min(h+50,400))} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:11}}>⬆</button>
              <button onClick={()=>setTerminalH(h=>Math.max(h-50,80))} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:11}}>⬇</button>
              <span onClick={()=>setTerminalOpen(v=>!v)} style={{color:T.dim,fontSize:11,cursor:"pointer"}}>{terminalOpen?"▼":"▲"}</span>
            </div>
            {terminalOpen&&(
              <div ref={termRef} style={{flex:1,overflowY:"auto",padding:"6px 14px",fontSize:Math.max(10,fontSize-1)}}>
                {logs.map((log,i)=>log.type==="divider"?<div key={i} style={{borderTop:`1px solid ${T.border}`,margin:"3px 0"}}/>:<div key={i} style={{color:log.type==="error"?"#f48771":log.type==="cmd"?"#9cdcfe":log.type==="info"?"#e5c07b":log.type==="output"?T.text:"#555",whiteSpace:"pre-wrap",wordBreak:"break-word",lineHeight:1.7}}>{log.text}</div>)}
                {isRunning&&<span className="pulse" style={{color:T.accent}}>█</span>}
              </div>
            )}
          </div>
        </div>
        {/* COPILOT PANEL */}
        {copilotOpen&&(
          <div className="fade-in" style={{width:270,background:T.sidebar,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:700}}>🤖 AI Copilot</div><div style={{fontSize:10,color:T.dim}}>Claude AI</div></div>
              <button onClick={()=>setCopilotOpen(false)} style={{background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",flexWrap:"wrap",gap:4}}>
              {[["Explain","Explain this code"],["Debug","Find bugs"],["Optimize","Optimize this"],["Docs","Add comments"]].map(([l,p])=>(
                <button key={l} onClick={()=>setCopilotInput(p)} style={{background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:10,padding:"3px 9px",cursor:"pointer",fontSize:10}}>{l}</button>
              ))}
            </div>
            <div ref={copilotRef} style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8}}>
              {copilotMessages.map((msg,i)=>(
                <div key={i} style={{alignSelf:msg.role==="user"?"flex-end":"flex-start",background:msg.role==="user"?T.accent:"#2d2d2d",color:msg.role==="user"?"#fff":T.text,borderRadius:msg.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"7px 10px",maxWidth:"90%",fontSize:11,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.text}</div>
              ))}
              {copilotLoading&&<div style={{alignSelf:"flex-start",background:"#2d2d2d",borderRadius:"12px 12px 12px 2px",padding:"8px 12px",fontSize:11,color:T.dim}}><span className="pulse">● ● ●</span></div>}
            </div>
            <div style={{padding:"7px 8px",borderTop:`1px solid ${T.border}`,display:"flex",gap:5}}>
              <textarea value={copilotInput} onChange={e=>setCopilotInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();askCopilot();}}} placeholder="Ask anything... (Enter)" rows={2} style={{flex:1,background:T.tab,border:`1px solid ${T.border}`,color:T.text,borderRadius:5,padding:"5px 7px",fontSize:11,resize:"none",outline:"none"}}/>
              <button onClick={askCopilot} disabled={copilotLoading||!copilotInput.trim()} style={{background:T.accent,border:"none",color:"#fff",borderRadius:5,padding:"0 10px",cursor:"pointer",fontSize:16,opacity:copilotInput.trim()?1:.4}}>{copilotLoading?<span className="spin" style={{fontSize:13}}>⟳</span>:"↑"}</button>
            </div>
          </div>
        )}
      </div>
      {/* CONTEXT MENU */}
      {contextMenu&&(
        <div style={{position:"fixed",top:contextMenu.y,left:contextMenu.x,zIndex:999,background:T.sidebar,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 0",minWidth:170,boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
          {(contextMenu.editor?[["▶ Run","run"],["⎘ Copy","copy"],["─","div"],["✏ Duplicate","dup"],["💬 Comment","cmt"],["🤖 Copilot","cop"]]:
            [["📂 Open","opn"],["🗑 Delete","del"]]).map(([l,a],i)=>a==="div"?<div key={i} style={{borderTop:`1px solid ${T.border}`,margin:"3px 0"}}/>:(
            <div key={i} className="ctx-item" onClick={()=>{setContextMenu(null);if(a==="run")runCode();else if(a==="cop")setCopilotOpen(true);else if(a==="del"&&contextMenu.file)deleteFile(null,contextMenu.file.id);else if(a==="opn"&&contextMenu.file)openFile(contextMenu.file);}} style={{padding:"5px 14px",cursor:"pointer",fontSize:12,color:T.text}}>{l}</div>
          ))}
        </div>
      )}
      {/* BOTTOM NAV */}
      <div style={{height:44,background:T.sidebar,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",flexShrink:0}}>
        {[{icon:"📂",label:"Files",action:()=>{setPanel("explorer");setSidebarOpen(v=>panel!=="explorer"?true:!v);}},{icon:"✏️",label:"Editor",action:()=>setSidebarOpen(false)},{icon:isRunning?"⟳":"▶",label:"Run",action:runCode,run:true},{icon:"🤖",label:"AI",action:()=>setCopilotOpen(v=>!v)},{icon:"⚙️",label:"More",action:()=>{setPanel("settings");setSidebarOpen(true);}}].map(btn=>(
          <button key={btn.label} onClick={btn.action} disabled={btn.run&&(!activeTab||isRunning)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 0",height:"100%",color:T.dim,opacity:btn.run&&!activeTab?.id?0.4:1}}>
            <span style={{fontSize:btn.run?17:15}} className={btn.run&&isRunning?"spin":""}>{btn.icon}</span>
            <span style={{fontSize:9,fontWeight:600}}>{btn.label}</span>
          </button>
        ))}
      </div>
      {/* STATUS BAR */}
      <div style={{height:20,background:T.statusBar,display:"flex",alignItems:"center",padding:"0 10px",gap:10,fontSize:10,color:"rgba(255,255,255,0.85)"}}>
        {activeTab&&<><span>🌿 main</span><span>{activeTab.language.toUpperCase()}</span><span>Ln {cursorPos.line}, Col {cursorPos.col}</span><span>{lineCount} lines</span></>}
        <span style={{marginLeft:"auto"}}>{theme} · UTF-8</span>
      </div>
    </div>
  );
}
