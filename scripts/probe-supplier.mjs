#!/usr/bin/env node
/**
 * Supplier contract probe.
 *
 * Purpose: turn every DOCS-ONLY row in docs/SUPPLIER_CONTRACT.md into an
 * OBSERVED row backed by a recorded fixture. Read-only endpoints only.
 *
 * Usage:
 *   SUPPLIER_API_KEY=... node scripts/probe-supplier.mjs
 *
 * Guarantees:
 * - The key is read from the environment and never printed. Only a masked
 *   form appears in output.
 * - Fixtures are written to test/fixtures/supplier/. Review them before
 *   committing: strip customer emails, delivered account credentials and any
 *   other PII first.
 * - No write endpoint is called. Purchases cost real money and are not
 *   automated here.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.env.SUPPLIER_API_BASE ?? 'https://api.irmarket.store'
const KEY = process.env.SUPPLIER_API_KEY
const OUT_DIR = join(process.cwd(), 'test', 'fixtures', 'supplier')
const TIMEOUT_MS = Number(process.env.SUPPLIER_TIMEOUT_MS ?? 8000)

const READ_ONLY_ENDPOINTS = [
  { name: 'me', path: '/api/buyer/me' },
  { name: 'balance', path: '/api/buyer/balance' },
  { name: 'products', path: '/api/buyer/products' },
]

function maskSecret(value) {
  if (typeof value !== 'string' || value.length === 0) return '<empty>'
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 4)}...${value.slice(-2)}`
}

function fail(message) {
  console.error(`probe failed: ${message}`)
  process.exit(1)
}

if (!KEY) {
  fail('SUPPLIER_API_KEY is not set. Never hardcode it; export it for this shell only.')
}

console.log(`base    : ${BASE}`)
console.log(`api key : ${maskSecret(KEY)} (masked, never logged in full)`)
console.log(`fixtures: ${OUT_DIR}`)
console.log('')

await mkdir(OUT_DIR, { recursive: true })

let failures = 0

for (const endpoint of READ_ONLY_ENDPOINTS) {
  const url = `${BASE}${endpoint.path}`
  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      // Documented auth scheme: X-API-Key header. The ?key= query variant is
      // deliberately not used because it leaks into access logs.
      headers: { 'X-API-Key': KEY, Accept: 'application/json' },
      signal: controller.signal,
    })

    const elapsedMs = Date.now() - startedAt
    const bodyText = await response.text()
    let parsed
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      parsed = { __rawBody: bodyText.slice(0, 2000) }
    }

    const fixture = {
      recordedAt: new Date().toISOString(),
      request: { method: 'GET', url, authHeader: 'X-API-Key: <redacted>' },
      response: {
        status: response.status,
        elapsedMs,
        headers: {
          'content-type': response.headers.get('content-type'),
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'retry-after': response.headers.get('retry-after'),
        },
        body: parsed,
      },
    }

    await writeFile(
      join(OUT_DIR, `${endpoint.name}.json`),
      `${JSON.stringify(fixture, null, 2)}\n`,
      'utf8',
    )

    const status = response.ok ? 'OK  ' : 'FAIL'
    console.log(`${status} ${response.status} ${endpoint.path} (${elapsedMs}ms) -> ${endpoint.name}.json`)
    if (!response.ok) failures += 1
  } catch (error) {
    failures += 1
    const reason = error?.name === 'AbortError' ? `timeout after ${TIMEOUT_MS}ms` : String(error?.message ?? error)
    console.log(`FAIL --- ${endpoint.path} (${reason})`)
  } finally {
    clearTimeout(timer)
  }
}

console.log('')
console.log('Next steps:')
console.log('1. Inspect each fixture and remove PII before committing.')
console.log('2. Update docs/SUPPLIER_CONTRACT.md: flip DOCS-ONLY rows to OBSERVED.')
console.log('3. Record any field that exists in the response but not in the docs.')

process.exit(failures === 0 ? 0 : 1)
