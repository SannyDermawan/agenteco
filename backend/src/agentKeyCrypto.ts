import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM encryption for a hosted buyer agent's own private key.
 *
 * This is a hackathon-appropriate custodial trade-off, not production
 * crypto-security: AGENT_KEY_ENCRYPTION_SECRET lives in a plain .env file
 * next to the database credentials. Fine for testnet demo funds a buyer
 * explicitly deposits knowing AgentEco's backend holds the key; never
 * acceptable for real value without a proper KMS/HSM.
 */
function getKey(): Buffer {
  const secret = process.env.AGENT_KEY_ENCRYPTION_SECRET
  if (!secret) throw new Error('Missing AGENT_KEY_ENCRYPTION_SECRET in .env')
  // Accepts either a 32-byte hex string or any passphrase (hashed down to exactly 32 bytes).
  if (/^[0-9a-fA-F]{64}$/.test(secret)) return Buffer.from(secret, 'hex')
  return createHash('sha256').update(secret).digest()
}

export function encryptAgentKey(privateKey: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join(':')
}

export function decryptAgentKey(encrypted: string): `0x${string}` {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) throw new Error('Malformed encrypted agent key')

  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, 'hex')), decipher.final()])
  return plaintext.toString('utf8') as `0x${string}`
}
