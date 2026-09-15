import {NextResponse} from 'next/server'
import {randomBytes} from 'node:crypto'
import {authUrl} from '@/lib/google'

export const runtime='nodejs'

export async function GET(){
  try{
    const state=randomBytes(24).toString('hex')
    const url=authUrl(state)
    const response=NextResponse.redirect(url)
    response.cookies.set('gmail_oauth_state',state,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600})
    return response
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'OAuth configuration error'},{status:500})
  }
}
