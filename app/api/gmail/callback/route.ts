import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {encrypt} from '@/lib/security'
import {oauthClient} from '@/lib/google'

export const runtime='nodejs'

export async function GET(req:Request){
  const url=new URL(req.url)
  const code=url.searchParams.get('code')
  const state=url.searchParams.get('state')
  const store=await cookies()
  const savedState=store.get('gmail_oauth_state')?.value
  if(!code||!state||!savedState||state!==savedState) return NextResponse.json({error:'Invalid or expired OAuth state'},{status:400})
  try{
    const client=oauthClient()
    const {tokens}=await client.getToken(code)
    const response=NextResponse.redirect(new URL('/',req.url))
    response.cookies.set('gmail_session',encrypt(JSON.stringify(tokens)),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    response.cookies.set('gmail_oauth_state','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0})
    return response
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'OAuth callback failed'},{status:500})
  }
}
