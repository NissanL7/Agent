'use client'
import {useEffect,useMemo,useRef,useState} from 'react'

type Provider='gpt'|'deepseek'|'qwen'
type ChatMessage={role:'user'|'assistant',content:string,model?:string,team?:boolean}
type Chat={id:string,title:string,updated:number,messages:ChatMessage[]}

const models:[string,string,Provider][]=[['GPT-OSS','General reasoning','gpt'],['DeepSeek','Deep reasoning','deepseek'],['Qwen','Coding & analysis','qwen']]

function newChat():Chat{return {id:crypto.randomUUID(),title:'New chat',updated:Date.now(),messages:[]}}

function renderMarkdown(text:string,onCopy:(text:string)=>void,copied:string){
 const lines=text.replace(/\r/g,'').split('\n'); const out:React.ReactNode[]=[]; let inCode=false; let code:string[]=[]; let codeLang=''; let list:string[]=[]
 const flushList=()=>{if(list.length){out.push(<ul key={`ul-${out.length}`}>{list.map((x,i)=><li key={i}>{inline(x)}</li>)}</ul>);list=[]}}
 for(let i=0;i<lines.length;i++){
  const l=lines[i]
  if(l.startsWith('```')){flushList(); if(inCode){const value=code.join('\n'); const key=`code-${i}`; out.push(<div className="codeWrap" key={key}><div className="codeHead"><span>{codeLang||'code'}</span><button onClick={()=>onCopy(value)}>{copied===value?'✓ Copied':'Copy code'}</button></div><pre className="code"><code>{value}</code></pre></div>);code=[];codeLang='';inCode=false}else{inCode=true;codeLang=l.slice(3).trim()||'code'} continue}
  if(inCode){code.push(l);continue}
  if(/^[-*] /.test(l)){list.push(l.slice(2));continue}
  flushList()
  if(/^#{1,3} /.test(l)){out.push(<h3 key={i}>{l.replace(/^#{1,3} /,'')}</h3>);continue}
  if(/^---+$/.test(l.trim())){out.push(<hr key={i}/>);continue}
  if(!l.trim()){out.push(<div className="mdSpace" key={i}/>);continue}
  out.push(<p key={i}>{inline(l)}</p>)
 }
 flushList(); if(inCode){const value=code.join('\n');out.push(<div className="codeWrap" key="open-code"><div className="codeHead"><span>{codeLang||'code'}</span><button onClick={()=>onCopy(value)}>{copied===value?'✓ Copied':'Copy code'}</button></div><pre className="code"><code>{value}</code></pre></div>)} return out
}
function inline(s:string){
 const parts=s.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
 return parts.map((p,i)=>p.startsWith('`')?<code className="inlineCode" key={i}>{p.slice(1,-1)}</code>:p.startsWith('**')?<strong key={i}>{p.slice(2,-2)}</strong>:p.startsWith('*')?<em key={i}>{p.slice(1,-1)}</em>:p)
}
function chatAsText(chat:Chat){return chat.messages.map(m=>`${m.role==='user'?'You':m.team?'Cross-model':m.model||'AI'}:\n${m.content}`).join('\n\n')}

export default function Home(){
 const [chats,setChats]=useState<Chat[]>([]); const [activeId,setActiveId]=useState(''); const [task,setTask]=useState(''); const [provider,setProvider]=useState<Provider>('gpt'); const [orchestrate,setOrchestrate]=useState(true); const [busy,setBusy]=useState(false); const [sidebar,setSidebar]=useState(false); const [gmail,setGmail]=useState(false); const [about,setAbout]=useState(false); const [copied,setCopied]=useState(''); const [toast,setToast]=useState(''); const bottomRef=useRef<HTMLDivElement>(null)
 const active=useMemo(()=>chats.find(c=>c.id===activeId)||null,[chats,activeId])
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('nissan-ai-chats')||'[]') as Chat[]; if(saved.length){setChats(saved);setActiveId(saved[0].id)}else{const c=newChat();setChats([c]);setActiveId(c.id)}}catch{const c=newChat();setChats([c]);setActiveId(c.id)};fetch('/api/gmail/status').then(r=>r.json()).then(x=>setGmail(Boolean(x.connected))).catch(()=>{})},[])
 useEffect(()=>{if(chats.length)localStorage.setItem('nissan-ai-chats',JSON.stringify(chats))},[chats])
 useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth',block:'end'})},[active?.messages.length,busy])
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),1800);return()=>clearTimeout(t)},[toast])
 function createChat(){const c=newChat();setChats(x=>[c,...x]);setActiveId(c.id);setTask('');setSidebar(false)}
 function updateActive(messages:ChatMessage[]){setChats(old=>old.map(c=>c.id===activeId?{...c,messages,updated:Date.now(),title:c.title==='New chat'?(messages.find(m=>m.role==='user')?.content.slice(0,36)||'New chat'):c.title}:c))}
 async function copyText(text:string,label='Copied'){try{await navigator.clipboard.writeText(text);setCopied(text);setToast(label);setTimeout(()=>setCopied(''),1800)}catch{setToast('Copy failed — select the text manually')}}
 async function run(){
  if(!task.trim()||busy||!active)return
  const prompt=task.trim(); const userMsg:ChatMessage={role:'user',content:prompt}; const history=active.messages
  updateActive([...history,userMsg]); setTask(''); setBusy(true)
  try{
   const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,prompt,messages:history.slice(-10).map(m=>({role:m.role,content:m.content})),mode:orchestrate?'orchestrate':'single'})})
   const data=await res.json(); if(!res.ok)throw new Error(data.error||'AI request failed')
   const assistant:ChatMessage={role:'assistant',content:data.text||'No response returned.',model:data.model,team:data.mode==='orchestrate'}
   updateActive([...history,userMsg,assistant])
  }catch(e){updateActive([...history,userMsg,{role:'assistant',content:e instanceof Error?e.message:'Request failed'}])}finally{setBusy(false)}
 }
 function clearHistory(){if(!active)return; if(confirm('Clear this chat?'))updateActive([])}
 function copyWholeChat(){if(!active?.messages.length)return;copyText(chatAsText(active),'Whole chat copied')}
 return <main className="appShell">
  <button className="mobileMenu" onClick={()=>setSidebar(true)} aria-label="Open menu">☰</button>
  {sidebar&&<div className="backdrop" onClick={()=>setSidebar(false)}/>} 
  <aside className={`sidebar ${sidebar?'open':''}`}>
   <div className="sideBrand"><div className="logo">N</div><div><b>Nissan AI</b><span>Command Center</span></div><button className="closeSide" onClick={()=>setSidebar(false)}>×</button></div>
   <button className="newChat" onClick={createChat}>＋ <span>New chat</span></button>
   <div className="historyLabel">RECENT</div>
   <div className="history">{chats.map(c=><button className={`historyItem ${c.id===activeId?'active':''}`} key={c.id} onClick={()=>{setActiveId(c.id);setSidebar(false)}}><span>◇</span><span>{c.title}</span></button>)}</div>
   <div className="sideBottom"><div className="sideStatus"><span className="statusDot"/> Hugging Face connected</div>{gmail?<a href="/api/gmail/messages" className="sideLink">✉ Gmail connected</a>:<a href="/api/gmail/auth" className="sideLink">✉ Connect Gmail</a>}<button className="sideLink aboutLink" onClick={()=>{setAbout(true);setSidebar(false)}}>ⓘ About project</button><div className="userCard"><div className="avatar">N</div><div><b>Nissan</b><small>Personal workspace</small></div><span>•••</span></div></div>
  </aside>
  <section className="chatArea">
   <header className="chatHeader"><div className="headerTitle"><span className="mobileTitle">Nissan AI</span><span className="desktopTitle">{active?.title||'New chat'}</span></div><div className="headerActions"><div className="modeSwitch"><button className={!orchestrate?'selected':''} onClick={()=>setOrchestrate(false)}>Single model</button><button className={orchestrate?'selected':''} onClick={()=>setOrchestrate(true)}>Cross-model</button></div>{active?.messages.length>0&&<button className="iconAction" onClick={copyWholeChat} title="Copy whole chat" aria-label="Copy whole chat">⧉</button>}<button className="iconAction" onClick={clearHistory} title="Clear chat" aria-label="Clear chat">⌫</button></div></header>
   {!orchestrate&&<div className="modelBar"><span>Model</span><select value={provider} onChange={e=>setProvider(e.target.value as Provider)}>{models.map(([name,desc,id])=><option value={id} key={id}>{name} — {desc}</option>)}</select><small>One model answers directly</small></div>}
   {orchestrate&&<div className="crossBar"><span>✦ Cross-model</span><b>DeepSeek</b><i>→</i><b>Qwen</b><i>→</i><b>GPT-OSS</b><small>reason · review · synthesize</small></div>}
   <div className="messages">
    {active?.messages.length===0&&!busy&&<div className="welcome"><div className="welcomeIcon">✦</div><h1>How can I help you?</h1><p>Choose a single model or let multiple models work together.</p><div className="suggestions"><button onClick={()=>setTask('Explain this topic for a Class 10 student in simple words')}>Explain a topic</button><button onClick={()=>setTask('Help me build a practical coding project step by step')}>Build a project</button><button onClick={()=>setTask('Compare the best approaches and recommend one')}>Compare options</button></div></div>}
    {active?.messages.map((m,i)=><div className={`messageRow ${m.role}`} key={i}><div className="messageAvatar">{m.role==='user'?'N':'✦'}</div><div className="messageBody"><div className="messageTop"><div className="messageMeta">{m.role==='user'?'You':m.team?'Cross-model':m.model||'AI'}</div>{m.role==='assistant'&&<button className="copyMessage" onClick={()=>copyText(m.content,'Response copied')} title="Copy response" aria-label="Copy response">⧉</button>}</div><div className="markdown">{renderMarkdown(m.content,(value)=>copyText(value,'Code copied'),copied)}</div></div></div>)}
    {busy&&<div className="messageRow assistant"><div className="messageAvatar">✦</div><div className="messageBody"><div className="messageMeta">{orchestrate?'Cross-model':'Single model'}</div><div className="thinking"><span/> <span/> <span/> <b>{orchestrate?'DeepSeek + Qwen → GPT-OSS…':'Thinking…'}</b></div></div></div>}
    <div ref={bottomRef}/>
   </div>
   <div className="composerWrap"><div className="composerBox"><textarea value={task} onChange={e=>setTask(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}}} placeholder={orchestrate?'Ask the cross-model team anything…':`Ask ${models.find(m=>m[2]===provider)?.[0]||'AI'} anything…`} rows={1} aria-label="Message"/><div className="composerTools"><button className="tool" onClick={()=>setTask(t=>t?`${t}\n`:'')} title="Add a new line">＋</button><div className="modeText">{orchestrate?'3 models: reason + review + synthesize':`Single: ${models.find(m=>m[2]===provider)?.[0]||'AI'}`} · Enter to send</div><span className="charCount">{task.length>0?task.length:''}</span><button className="send" disabled={!task.trim()||busy} onClick={run} aria-label="Send">↑</button></div></div><div className="privacy">Hugging Face Inference Providers powers the connected models.</div></div>
  </section>
  {toast&&<div className="toast">✓ {toast}</div>}
  {about&&<div className="aboutOverlay" onClick={()=>setAbout(false)}><section className="aboutCard" onClick={e=>e.stopPropagation()}><button className="aboutClose" onClick={()=>setAbout(false)}>×</button><div className="aboutLogo">N</div><div className="aboutEyebrow">ABOUT THE PROJECT</div><h2>Nissan AI Command Center</h2><p className="aboutLead">A personal multi-model AI workspace built to bring different AI models into one clean chat experience.</p><div className="aboutGrid"><div><b>Single model</b><span>Choose GPT-OSS, DeepSeek, or Qwen for a direct response.</span></div><div><b>Cross-model</b><span>DeepSeek reasons, Qwen reviews, and GPT-OSS synthesizes the final answer.</span></div><div><b>Chat history</b><span>Conversations are saved locally in this browser for quick access.</span></div><div><b>Connected tools</b><span>Hugging Face models and the project’s Gmail integration can work from the same workspace.</span></div></div><div className="aboutFooter"><span>Made by</span><strong>NissanL7</strong><small>Personal AI project · 2026</small></div></section></div>}
 </main>
}
