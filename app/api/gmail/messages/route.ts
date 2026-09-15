import {NextResponse} from 'next/server'
import {gmailClient} from '@/lib/google'

export const runtime='nodejs'

export async function GET(){
  try{
    const gmail=await gmailClient()
    if(!gmail) return NextResponse.json({error:'Gmail is not connected'},{status:401})
    const list=await gmail.users.messages.list({userId:'me',maxResults:10,labelIds:['INBOX']})
    const ids=list.data.messages||[]
    const messages=await Promise.all(ids.map(async item=>{
      if(!item.id) return null
      const detail=await gmail.users.messages.get({userId:'me',id:item.id,format:'metadata',metadataHeaders:['From','Subject','Date']})
      const headers=detail.data.payload?.headers||[]
      const get=(name:string)=>headers.find(h=>h.name?.toLowerCase()===name.toLowerCase())?.value||''
      return {id:item.id,threadId:item.threadId||'',from:get('From'),subject:get('Subject'),date:get('Date'),snippet:detail.data.snippet||''}
    }))
    return NextResponse.json({messages:messages.filter(Boolean)})
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Gmail request failed'},{status:500})}
}
