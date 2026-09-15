'use client'
import {useEffect,useMemo,useState} from 'react'

type Provider='gpt'|'deepseek'|'qwen'
type ChatMessage={role:'user'|'assistant',content:string,model?:string,team?:boolean}
type Chat={id:string,title:string,updated:number,messages:ChatMessage[]}

const models:[string,string,Provider][]=[['GPT-OSS','General reasoning','gpt'],['DeepSeek','Deep reasoning','deepseek'],['Qwen','Coding & analysis','qwen']]

function newChat():Chat{return {id:crypto.randomUUID(),title:'New chat',updated:Date.now(),messages:[]}}
function renderMarkdown(text:string){
 const lines=text.replace(/\r/g,'').split('\n'); const out:React.ReactNode[]=[]; let inCode=false; let code:string[]=[]; let list:string[]=[]
 const flushList=()=>{if(list.length){out.push(<ul key={`ul-${out.length}`}>{list.map((x,i)=><li key={i}>{inline(x)}</li>)}</ul>);list=[]}}
 for(let i=0;i<lines.length;i++){
  const l=lines[i]
  if(l.startsWith('```')){flushList(); if(inCode){out.push(<pre className="code" key={`code-${i}`}><code>{code.join('\n')}</code></pre>);code=[];inCode=false}else inCode=true; continue}
  if(inCode){code.push(l);continue}
  if(/^[-*] /.test(l)){list.push(l.slice(2));continue}
  flushList()
  if(/^#{1,3} /.test(l)){out.push(<h3 key={i}>{l.replace(/^#{1,3} /,'')}</h3>);continue}
  if(/^---+$/.test(l.trim())){out.push(<hr key={i}/>);continue}
  if(!l.trim()){out.push(<div className="mdSpace" key={i}/>);continue}
  out.push(<p key={i}>{inline(l)}</p>)
 }
 flushList(); if(inCode)out.push(<pre className="code" key="open-code"><code>{code.join('\n')}</code></pre>); return out
}
function inline(s:string){
 const parts=s.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
 return parts.map((p,i)=>p.startsWith('`')?<code className="inlineCode" key={i}>{p.slice(1,-1)}</code>:p.startsWith('**')?<strong key={i}>{p.slice(2,-2)}</strong>:p.startsWith('*')?<em key={i}>{p.slice(1,-1)}</em>:p)
}

export default function Home(){
 const [chats,setChats]=useState<Chat[]>([]); const [activeId,setActiveId]=useState(''); const [task,setTask]=useState(''); const [provider,setProvider]=useState<Provider>('gpt'); const [orchestrate,setOrchestrate]=useState(true); const [busy,setBusy]=useState(false); const [sidebar,setSidebar]=useState(false); const [gmail,setGmail]=useState(false)
 const active=useMemo(()=>chats.find(c=>c.id===activeId)||null,[chats,activeId])
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('nissan-ai-chats')||'[]') as Chat[]; if(saved.length){setChats(saved);setActiveId(saved[0].id)}else{const c=newChat();setChats([c]);setActiveId(c.id)}}catch{const c=newChat();setChats([c]);setActiveId(c.id)};fetch('/api/gmail/status').then(r=>r.json()).then(x=>setGmail(Boolean(x.connected))).catch(()=>{})},[])
 useEffect(()=>{if(chats.length)localStorage.setItem('nissan-ai-chats',JSON.stringify(chats))},[chats])
 function createChat(){const c=newChat();setChats(x=>[c,...x]);setActiveId(c.id);setTask('');setSidebar(false)}
 function updateActive(messages:ChatMessage[]){setChats(old=>old.map(c=>c.id===activeId?{...c,messages,updated:Date.now(),title:c.title==='New chat'?(messages.find(m=>m.role==='user')?.content.slice(0,36)||'New chat'):c.title}:c))}
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
 return <main className="appShell">
  <button className="mobileMenu" onClick={()=>setSidebar(true)}>☰</button>
  {sidebar&&<div className="backdrop" onClick={()=>setSidebar(false)}/>} 
  <aside className={`sidebar ${sidebar?'open':''}`}>
   <div className="sideBrand"><div className="logo">N</div><div><b>Nissan AI</b><span>Command Center</span></div><button className="closeSide" onClick={()=>setSidebar(false)}>×</button></div>
   <button className="newChat" onClick={createChat}>＋ <span>New chat</span></button>
   <div className="historyLabel">RECENT</div>
   <div className="history">{chats.map(c=><button className={`historyItem ${c.id===activeId?'active':''}`} key={c.id} onClick={()=>{setActiveId(c.id);setSidebar(false)}}><span>◇</span><span>{c.title}</span></button>)}</div>
   <div className="sideBottom"><div className="sideStatus"><span className="statusDot"/> Hugging Face connected</div>{gmail?<a href="/api/gmail/messages" className="sideLink">✉ Gmail connected</a>:<a href="/api/gmail/auth" className="sideLink">✉ Connect Gmail</a>}<div className="userCard"><div className="avatar">N</div><div><b>Nissan</b><small>Personal workspace</small></div><span>•••</span></div></div>
  </aside>
  <section className="chatArea">
   <header className="chatHeader"><div className="headerTitle"><span className="mobileTitle">Nissan AI</span><span className="desktopTitle">{active?.title||'New chat'}</span></div><div className="headerActions"><button className={`teamToggle ${orchestrate?'on':''}`} onClick={()=>setOrchestrate(v=>!v)}><span>✦</span> {orchestrate?'AI Team':'Single AI'}</button><button onClick={clearHistory} title="Clear chat">⌫</button></div></header>
   <div className="messages">
    {active?.messages.length===0&&!busy&&<div className="welcome"><div className="welcomeIcon">✦</div><h1>How can I help you?</h1><p>Your AI workspace with multiple models working together.</p><div className="suggestions"><button onClick={()=>setTask('Explain this topic for a Class 10 student in simple words')}>Explain a topic</button><button onClick={()=>setTask('Help me build a practical coding project step by step')}>Build a project</button><button onClick={()=>setTask('Compare the best approaches and recommend one')}>Compare options</button></div></div>}
    {active?.messages.map((m,i)=><div className={`messageRow ${m.role}`} key={i}><div className="messageAvatar">{m.role==='user'?'N':'✦'}</div><div className="messageBody"><div className="messageMeta">{m.role==='user'?'You':m.team?'AI Team':m.model||'AI'}</div><div className="markdown">{renderMarkdown(m.content)}</div></div></div>)}
    {busy&&<div className="messageRow assistant"><div className="messageAvatar">✦</div><div className="messageBody"><div className="messageMeta">AI Team</div><div className="thinking"><span/> <span/> <span/> <b>Thinking across models…</b></div></div></div>}
   </div>
   <div className="composerWrap"><div className="composerBox"><textarea value={task} onChange={e=>setTask(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}}} placeholder={orchestrate?'Ask the AI team anything…':'Ask your AI anything…'} rows={1}/><div className="composerTools"><button className="tool">＋</button><div className="modeText">{orchestrate?'3 models will reason + review + synthesize':'Single model response'} · Enter to send</div><button className="send" disabled={!task.trim()||busy} onClick={run}>↑</button></div></div><div className="privacy">AI Team uses multiple Hugging Face models to improve the final answer.</div></div>
  </section>
 </main>
}
