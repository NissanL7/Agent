import {NextResponse} from 'next/server'

export const runtime='nodejs'

type Provider='gpt'|'deepseek'|'qwen'

const MODELS:Record<Provider,string>={
  gpt:process.env.HF_GPT_MODEL||'openai/gpt-oss-120b:fastest',
  deepseek:process.env.HF_DEEPSEEK_MODEL||'deepseek-ai/DeepSeek-R1:fastest',
  qwen:process.env.HF_QWEN_MODEL||'Qwen/Qwen3-Coder-480B-A35B-Instruct:fastest'
}

async function readError(res:Response){
  const text=await res.text()
  return text.slice(0,1200)
}

export async function POST(req:Request){
  try{
    const body=await req.json() as {provider?:Provider,prompt?:string}
    const provider=body.provider||'gpt'
    const prompt=body.prompt?.trim()
    if(!prompt) return NextResponse.json({error:'Prompt is required'}, {status:400})
    if(!['gpt','deepseek','qwen'].includes(provider)) return NextResponse.json({error:'Unknown Hugging Face model slot'}, {status:400})
    if(!process.env.HF_TOKEN) return NextResponse.json({error:'HF_TOKEN is not configured in Render. Add your Hugging Face fine-grained token with Inference Providers permission.'}, {status:503})

    const model=MODELS[provider]
    const res=await fetch('https://router.huggingface.co/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.HF_TOKEN}`,'Content-Type':'application/json'},
      body:JSON.stringify({model,messages:[{role:'user',content:prompt}],stream:false})
    })
    if(!res.ok) return NextResponse.json({error:await readError(res)},{status:502})
    const data=await res.json()
    const text=data.choices?.[0]?.message?.content||''
    return NextResponse.json({provider,model:data.model||model,text})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unexpected server error'},{status:500})
  }
}
