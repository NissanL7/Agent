'use client'
import {useEffect,useState} from 'react'

const agents=[['GPT-OSS','General reasoning','gpt'],['DeepSeek','Deep reasoning','deepseek'],['Qwen','Coding & analysis','qwen']] as const
type Provider=typeof agents[number][2]

function formatAnswer(text:string){return text.replace(/\r/g,'').split('\n').map((line,i)=>{
 if(/^#{1,3} /.test(line)) return <h3 key={i}>{line.replace(/^#{1,3} /,'')}</h3>
 if(/^---+$/.test(line.trim())) return <hr key={i}/>
 if(/^[-*] /.test(line.trim())) return <li key={i}>{line.trim().slice(2)}</li>
 if(/^\d+\. /.test(line.trim())) return <li key={i}>{line.trim().replace(/^\d+\. /,'')}</li>
 if(/^\|/.test(line.trim())) return <div className="tableLine" key={i}>{line}</div>
 if(!line.trim()) return <div className="space" key={i}/>
 return <p key={i}>{line}</p>
})}

export default function Home(){
 const [task,setTask]=useState('');const [provider,setProvider]=useState<Provider>('gpt');const [result,setResult]=useState('');const [model,setModel]=useState('');const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(false)
 const [gmail,setGmail]=useState<boolean|null>(null);const [inbox,setInbox]=useState<Array<{id:string,from:string,subject:string,date:string,snippet:string}>>([])
 useEffect(()=>{fetch('/api/gmail/status').then(r=>r.json()).then(x=>setGmail(Boolean(x.connected))).catch(()=>setGmail(false))},[])
 async function run(){if(!task.trim()||busy)return;setBusy(true);setResult('');try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,prompt:task})});const data=await res.json();if(!res.ok)throw new Error(data.error||'AI request failed');setModel(data.model||'Hugging Face');setResult(data.text||'No response returned.');setTask('')}catch(e){setResult(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}}
 async function loadInbox(){const res=await fetch('/api/gmail/messages');const data=await res.json();if(!res.ok){setResult(data.error||'Gmail request failed');return}setInbox(data.messages||[])}
 async function copy(){if(!result)return;await navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),1200)}
 return <main className="shell">
  <header className="top"><div className="brand"><div className="logo">N</div><div><div className="brandTitle">Nissan AI Command Center</div><div className="muted">Multi-model AI workspace</div></div></div><div className="topActions"><span className="live"><span className="liveDot"/> LIVE</span><span className="badge">Hugging Face</span></div></header>
  <section className="hero"><div><div className="eyebrow">AI ORCHESTRATION</div><h1>One command. Multiple minds.</h1><p className="muted">Choose an open model and run your prompt through Hugging Face.</p></div><div className="heroOrb">✦</div></section>
  <section className="agents">{agents.map(([name,desc,id])=><button className={`agent ${provider===id?'selected':''}`} key={name} onClick={()=>setProvider(id)}><div className="agentTop"><span className="modelIcon">{id==='gpt'?'✦':id==='deepseek'?'◈':'⌁'}</span><span><b>{name}</b><small>{desc}</small></span>{provider===id&&<span className="selectedMark">✓</span>}</div></button>)}</section>
  <div className="grid"><section className="card command"><div className="sectionHead"><div><div className="eyebrow">COMMAND</div><h2>Ask your AI</h2></div><span className="providerPill">{agents.find(a=>a[2]===provider)?.[0]}</span></div><div className="composer"><textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="Ask anything… e.g. Explain photosynthesis for Class 10 in simple words" onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run()}}}/><div className="composerBottom"><span className="hint">Ctrl + Enter to run</span><button className="primary" onClick={run} disabled={busy||!task.trim()}>{busy?'Thinking…':'Run task  →'}</button></div></div>{result&&<div className="result"><div className="resultHead"><div><span className="resultDot"/> <b>AI Response</b><span className="modelName">{model}</span></div><button className="copy" onClick={copy}>{copied?'Copied ✓':'Copy'}</button></div><div className="answer">{formatAnswer(result)}</div></div>}
   {gmail&&<div className="gmailBox"><b>Gmail <span className="muted">Connected</span></b><button className="secondary" onClick={loadInbox}>Load latest emails</button>{inbox.map(m=><div key={m.id} className="email"><b>{m.subject||'(No subject)'}</b><span className="muted">{m.from}</span><span>{m.snippet}</span></div>)}</div>}
  </section><aside className="card side"><div className="eyebrow">SYSTEM</div><h3>Connections</h3><div className="connection"><span className="connIcon">HF</span><div><b>Hugging Face</b><small>Inference Providers</small></div><span className="check">●</span></div>{agents.map(([name,,id])=><button className="sideModel" key={id} onClick={()=>setProvider(id)}><span>{name}</span><small>Available via HF</small></button>)}<div className="divider"/>{gmail?<button className="sideModel" onClick={loadInbox}><span>Gmail</span><small>OAuth • connected</small></button>:<a className="connect" href="/api/gmail/auth"><span>Gmail</span><small>Connect with OAuth →</small></a>}<div className="security">Server-side AI connection</div></aside></div>
  <footer>Built for Nissan • AI Command Center V2</footer>
 </main>
}
