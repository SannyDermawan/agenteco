export function log(message: string, prefix = 'KEEPER'): void {
  console.log(`[${prefix}] ${message}`)
}

export function logError(message: string, error?: unknown, prefix = 'KEEPER'): void {
  console.error(`[${prefix}] ${message}`, error instanceof Error ? error.message : error)
}
