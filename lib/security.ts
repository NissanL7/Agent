import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto'

const key=()=>createHash('sha256').update(process.env.SESSION_SECRET||'').digest()

export function encrypt(value:string){
  if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured')
  const iv=randomBytes(12)
  const cipher=createCipheriv('aes-256-gcm',key(),iv)
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()])
  const tag=cipher.getAuthTag()
  return Buffer.concat([iv,tag,encrypted]).toString('base64url')
}

export function decrypt(value:string){
  if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured')
  const raw=Buffer.from(value,'base64url')
  const iv=raw.subarray(0,12), tag=raw.subarray(12,28), encrypted=raw.subarray(28)
  const decipher=createDecipheriv('aes-256-gcm',key(),iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted),decipher.final()]).toString('utf8')
}
