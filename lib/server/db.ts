import { Pool, type PoolClient, type QueryResultRow } from 'pg'

import { databaseUrl, loadAppEnv } from './env'

declare global {
  var __apPhysicsPgPool: Pool | undefined
}

export function getPool(): Pool {
  loadAppEnv()
  if (!globalThis.__apPhysicsPgPool) {
    globalThis.__apPhysicsPgPool = new Pool({
      connectionString: databaseUrl(),
    })
  }
  return globalThis.__apPhysicsPgPool
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, values)
  return result.rows
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
