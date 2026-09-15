import {NextResponse} from 'next/server'
import {gmailClient} from '@/lib/google'

export const runtime='nodejs'

export async function GET(){
  try{
    const gmail=await gmailClient()
    return NextResponse.json({connected:Boolean(gmail)})
  }catch{return NextResponse.json({connected:false})}
}
