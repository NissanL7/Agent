import {google} from 'googleapis'
import {cookies} from 'next/headers'
import {decrypt} from './security'

const scopes=['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send']

export function oauthClient(){
  const redirect=process.env.GOOGLE_REDIRECT_URI
  if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!redirect) throw new Error('Google OAuth environment variables are not configured')
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,redirect)
}

export function authUrl(state:string){
  return oauthClient().generateAuthUrl({access_type:'offline',prompt:'consent',scope:scopes,state})
}

export async function gmailClient(){
  const store=await cookies()
  const token=store.get('gmail_session')?.value
  if(!token) return null
  const client=oauthClient()
  client.setCredentials(JSON.parse(decrypt(token)))
  return google.gmail({version:'v1',auth:client})
}
