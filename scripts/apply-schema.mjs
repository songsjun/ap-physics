#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import nextEnv from '@next/env'
import pg from 'pg'

const { loadEnvConfig } = nextEnv
const { Pool } = pg

const DEFAULT_DATABASE_URL = 'postgres://localhost:5432/ap_physics'

loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)

function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? DEFAULT_DATABASE_URL
}

const pool = new Pool({ connectionString: databaseUrl() })

try {
  const schema = await readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8')
  await pool.query(schema)
  console.log('Applied db/schema.sql')
} finally {
  await pool.end()
}
