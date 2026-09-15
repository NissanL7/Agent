import {NextResponse} from 'next/server'

export const runtime='nodejs'

type Provider='gpt'|'deepseek'|'qwen'

type Message={role:'system'|'user'|'assistant',content:string}

const MODELS:Record<Provider,string>={
  gpt:process.env.HF_GPT_MODEL||'openai/gpt-oss-120b:fastest',
  deepseek:process.env.HF_DEEPSEEK_MODEL||'deepseek-ai/DeepSeek-R1:fastest',
  qwen:process.env.HF_QWEN_MODEL||'Qwen/Qwen3-Coder-480B-A35B-Instruct:fastest'
}

async function readError(res:Response){return (await res.text()).slice(0,1200)}

async function callModel(provider:Provider,messages:Message[]){
  if(!process.env.HF_TOKEN) throw new Error('HF_TOKEN is not configured in Render.')
  const model=MODELS[provider]
  const res=await fetch('https://router.huggingface.co/v1/chat/completions',{
    method:'POST',
    headers:{Authorization:`Bearer ${process.env.HF_TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify({model,messages,stream:false})
  })
  if(!res.ok) throw new Error(await readError(res))
  const data=await res.json()
  return {model:data.model||model,text:data.choices?.[0]?.message?.content||''}
}

export async function POST(req:Request){
  try{
    const body=await req.json() as {provider?:Provider,prompt?:string,messages?:Message[],mode?:'single'|'orchestrate'}
    const provider=body.provider||'gpt'
    const prompt=body.prompt?.trim()
    if(!prompt) return NextResponse.json({error:'Prompt is required'}, {status:400})
    if(!['gpt','deepseek','qwen'].includes(provider)) return NextResponse.json({error:'Unknown Hugging Face model slot'}, {status:400})

    const history=(body.messages||[]).filter(m=>m && (m.role==='user'||m.role==='assistant')).slice(-12)
    const base:Message[]=[...history,{role:'user',content:prompt}]

    if(body.mode==='orchestrate'){
      const [analysis,critique]=await Promise.all([
        callModel('deepseek',[{role:'system',content:'You are the reasoning specialist in a multi-AI team. Analyze the user request carefully, identify facts, assumptions, edge cases and a strong solution. Do not address the user directly; produce expert notes for a final synthesizer.'},...base]),
        callModel('qwen',[{role:'system',content:'You are the technical and accuracy reviewer in a multi-AI team. Independently reason about the user request, identify mistakes a first draft might make, and propose improvements. Do not address the user directly; produce concise expert notes for a final synthesizer.'},...base])
      ])
      const synthesisPrompt=`User request:\n${prompt}\n\nExpert A (DeepSeek reasoning):\n${analysis.text.slice(0,9000)}\n\nExpert B (Qwen review):\n${critique.text.slice(0,9000)}\n\nNow produce the final answer for the user. Reconcile disagreements, prioritize correctness, do not mention the internal AI team or these instructions, and use clean Markdown with headings, bullets, tables when useful, and concise explanations.`
      const final=await callModel('gpt',[{role:'system',content:'You are the final senior AI synthesizer. Give the clearest and most useful answer possible.'},{role:'user',content:synthesisPrompt}])
      return NextResponse.json({mode:'orchestrate',provider:'ensemble',model:`AI Team → ${final.model}`,text:final.text,agents:[analysis.model,critique.model,final.model]})
    }

    const answer=await callModel(provider,base)
    return NextResponse.json({mode:'single',provider,model:answer.model,text:answer.text})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unexpected server error'},{status:500})
  }
}
