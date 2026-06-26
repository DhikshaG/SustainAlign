import { Router } from 'express'
import os from 'os'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sqlite, db } from '../db/index.js'
import { env } from '../config/env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
let pkgVersion = '0.0.0'
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))
  pkgVersion = pkg.version
} catch {}

const router = Router()

router.get('/health', async (_req, res) => {
  const checks = {}
  let allOk = true

  if (env.DB_DIALECT === 'pg') {
    try {
      const result = await db.execute('SELECT 1')
      checks.db = { ok: true, status: 'connected', dialect: 'pg' }
    } catch (err) {
      checks.db = { ok: false, status: 'disconnected', dialect: 'pg', error: err.message }
      allOk = false
    }
  } else {
    try {
      sqlite.prepare('SELECT 1').get()
      checks.db = { ok: true, status: 'connected', dialect: 'sqlite' }
    } catch (err) {
      checks.db = { ok: false, status: 'disconnected', dialect: 'sqlite', error: err.message }
      allOk = false
    }
  }

  try {
    const { rss, heapUsed, heapTotal } = process.memoryUsage()
    const memUsage = rss / (1024 * 1024)
    checks.memory = {
      ok: memUsage < 1024,
      status: memUsage < 512 ? 'normal' : 'warning',
      rssMb: Math.round(memUsage),
      heapUsedMb: Math.round(heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(heapTotal / (1024 * 1024)),
    }
    if (!checks.memory.ok) allOk = false
  } catch (err) {
    checks.memory = { ok: false, status: 'error', error: err.message }
    allOk = false
  }

  try {
    const free = os.freemem() / (1024 * 1024)
    const total = os.totalmem() / (1024 * 1024)
    const freePercent = (free / total) * 100
    checks.disk = {
      ok: freePercent > 10,
      status: freePercent > 20 ? 'normal' : 'low',
      freePercent: Math.round(freePercent),
      freeMb: Math.round(free),
      totalMb: Math.round(total),
    }
    if (!checks.disk.ok) allOk = false
  } catch {}

  checks.uptime = { seconds: Math.floor(process.uptime()) }

  checks.version = pkgVersion

  const status = allOk ? 'healthy' : 'degraded'

  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    status,
    checks,
    timestamp: new Date().toISOString(),
  })
})

export default router
