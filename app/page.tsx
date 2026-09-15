'use client'
import {useEffect,useState} from 'react'

const agents=[
 ['GPT-OSS','General reasoning','gpt'],
 ['DeepSeek','Deep reasoning','deepseek'],
 ['Qwen','Coding & analysis','qwen']
] as const

export default function Home(){
 const [task,setTask]=useState(''); const [provider,setProvider]=useState('gpt'); const [result,setResult]=useState(''); const [busy,setBusy]=useState(false)
 const [gmail,setGmail]=useState<boolean|null>(null); const [inbox,setInbox]=useState<Array<{id:string,from:string,subject:string,date:string,snippet:string}>>([])
 useEffect(()=>{fetch('/api/gmail/status').then(r=>r.json()).then(x=>setGmail(Boolean(x.connected))).catch(()=>setGmail(false))},[])
 async function run(){
  if(!task.trim()||busy)return
  setBusy(true);setResult('Running through Hugging Face…')
  try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,prompt:task})});const data=await res.json();if(!res.ok)throw new Error(data.error||'AI request failed');setResult(`${data.model}\n\n${data.text}`);setTask('')}catch(e){setResult(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}
 }
 async function loadInbox(){
  const res=await fetch('/api/gmail/messages'); const data=await res.json(); if(!res.ok){setResult(data.error||'Gmail request failed');return} setInbox(data.messages||[])
 }
 return <main className="shell">
  <header className="top"><div className="brand"><div className="logo">N</div><div><div style={{fontWeight:800}}>Nissan AI Command Center</div><div className="muted" style={{fontSize:13}}>Hugging Face multi-model workspace</div></div></div><span className="badge">V2 • HF backend</span></header>
  <section className="agents">{agents.map(([name,desc,id])=><button className="agent" key={name} onClick={()=>setProvider(id)} style={{textAlign:'left',color:'inherit'}}><div><span className="dot"/> <b>{name}</b>{provider===id&&<span className="badge" style={{marginLeft:8}}>selected</span>}</div><div className="muted" style={{fontSize:13,marginTop:8}}>{desc}</div></button>)}</section>
  <div className="grid"><section className="card"><h1 className="title">Command Center</h1><p className="muted">Run open models through Hugging Face Inference Providers. Your HF token stays server-side.</p><div className="composer"><textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="Try: Explain this topic in simple words…"/><button className="primary" onClick={run} disabled={busy}>{busy?'Running…':'Run task'}</button></div>{result&&<pre className="status" style={{whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{result}</pre>}
   {gmail&&<div className="card" style={{marginTop:16,padding:16}}><b>Gmail inbox</b><button className="primary" style={{height:42,marginTop:10}} onClick={loadInbox}>Load latest emails</button>{inbox.map(m=><div key={m.id} className="status"><b>{m.subject||'(No subject)'}</b><div className="muted">{m.from}</div><div style={{marginTop:4}}>{m.snippet}</div></div>)}</div>}
  </section>
   <aside className="card side"><b>Connections</b><button onClick={()=>setProvider('gpt')}>🤖 GPT-OSS <span className="muted">Hugging Face</span></button><button onClick={()=>setProvider('deepseek')}>🧠 DeepSeek <span className="muted">Hugging Face</span></button><button onClick={()=>setProvider('qwen')}>⚡ Qwen <span className="muted">Hugging Face</span></button>{gmail?<button onClick={loadInbox}>📧 Gmail <span className="muted">OAuth • connected</span></button>:<a className="connect" href="/api/gmail/auth">📧 Connect Gmail <span className="muted">OAuth</span></a>}</aside>
  </div>
 </main>
}
