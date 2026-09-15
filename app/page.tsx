'use client'
import {useState} from 'react'

const agents=[['GPT','Planner & general reasoning'],['Claude','Writing & review'],['Qwen','Analysis & coding']]

export default function Home(){
 const [task,setTask]=useState(''); const [result,setResult]=useState('')
 function run(){if(!task.trim())return;setResult('Task queued. AI provider connections will run here once API keys are configured.');setTask('')}
 return <main className="shell">
  <header className="top"><div className="brand"><div className="logo">N</div><div><div style={{fontWeight:800}}>Nissan AI Command Center</div><div className="muted" style={{fontSize:13}}>Multi-model AI workspace</div></div></div><span className="badge">V1 • Setup</span></header>
  <section className="agents">{agents.map(([name,desc])=><div className="agent" key={name}><div><span className="dot"/> <b>{name}</b></div><div className="muted" style={{fontSize:13,marginTop:8}}>{desc}</div></div>)}</section>
  <div className="grid"><section className="card"><h1 className="title">Command Center</h1><p className="muted">Give one task and the orchestrator will route it to the right AI.</p><div className="composer"><textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="Try: Draft a professional reply to my latest email..."/><button className="primary" onClick={run}>Run task</button></div>{result&&<div className="status">{result}</div>}</section>
   <aside className="card side"><b>Connections</b><button>🤖 GPT <span className="muted">API • not configured</span></button><button>🧠 Claude <span className="muted">API • not configured</span></button><button>⚡ Qwen <span className="muted">API • not configured</span></button><button>📧 Gmail <span className="muted">OAuth • not connected</span></button></aside>
  </div>
 </main>
}
