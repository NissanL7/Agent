import {NextResponse} from 'next/server'

export const runtime='nodejs'

type Provider='openai'|'anthropic'|'qwen'

async function readError(res:Response){
  const text=await res.text()
  return text.slice(0,1000)
}

export async function POST(req:Request){
  try{
    const body=await req.json() as {provider?:Provider,prompt?:string}
    const provider=body.provider||'openai'
    const prompt=body.prompt?.trim()
    if(!prompt) return NextResponse.json({error:'Prompt is required'}, {status:400})

    if(provider==='openai'){
      if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:'OPENAI_API_KEY is not configured'}, {status:503})
      const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.4',input:prompt})})
      if(!res.ok) return NextResponse.json({error:await readError(res)},{status:502})
      const data=await res.json()
      return NextResponse.json({provider,model:data.model||process.env.OPENAI_MODEL||'gpt-5.4',text:data.output_text||''})
    }

    if(provider==='anthropic'){
      if(!process.env.ANTHROPIC_API_KEY) return NextResponse.json({error:'ANTHROPIC_API_KEY is not configured'}, {status:503})
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5',max_tokens:2048,messages:[{role:'user',content:prompt}]})})
      if(!res.ok) return NextResponse.json({error:await readError(res)},{status:502})
      const data=await res.json()
      const text=Array.isArray(data.content)?data.content.filter((x:{type?:string})=>x.type==='text').map((x:{text?:string})=>x.text||'').join('\n'):''
      return NextResponse.json({provider,model:data.model||process.env.ANTHROPIC_MODEL||'claude-sonnet-5',text})
    }

    if(!process.env.QWEN_API_KEY) return NextResponse.json({error:'QWEN_API_KEY is not configured'}, {status:503})
    const base=(process.env.QWEN_BASE_URL||'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/$/,'')
    const res=await fetch(`${base}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${process.env.QWEN_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.QWEN_MODEL||'qwen3.7-plus',messages:[{role:'user',content:prompt}]})})
    if(!res.ok) return NextResponse.json({error:await readError(res)},{status:502})
    const data=await res.json()
    return NextResponse.json({provider,model:data.model||process.env.QWEN_MODEL||'qwen3.7-plus',text:data.choices?.[0]?.message?.content||''})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unexpected server error'},{status:500})
  }
}
