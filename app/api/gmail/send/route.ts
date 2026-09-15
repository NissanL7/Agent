import {NextResponse} from 'next/server'
import {gmailClient} from '@/lib/google'

export const runtime='nodejs'

function base64url(input:string){return Buffer.from(input).toString('base64url')}

export async function POST(req:Request){
  try{
    const gmail=await gmailClient()
    if(!gmail) return NextResponse.json({error:'Gmail is not connected'},{status:401})
    const body=await req.json() as {to?:string,subject?:string,text?:string,approved?:boolean}
    if(body.approved!==true) return NextResponse.json({error:'Explicit approval is required before sending email'},{status:400})
    if(!body.to||!body.subject||!body.text) return NextResponse.json({error:'to, subject and text are required'},{status:400})
    const raw=[`To: ${body.to}`,`Subject: ${body.subject}`,'Content-Type: text/plain; charset="UTF-8"','',body.text].join('\r\n')
    const sent=await gmail.users.messages.send({userId:'me',requestBody:{raw:base64url(raw)}})
    return NextResponse.json({ok:true,id:sent.data.id||null})
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Gmail send failed'},{status:500})}
}
