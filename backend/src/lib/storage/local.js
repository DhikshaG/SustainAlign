import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../../config/env.js'

export class LocalDiskStorage {
  constructor(root = env.UPLOAD_ROOT) {
    this.root = path.resolve(root)
  }

  async upload(buffer, { tenantType, tenantId, category, originalName }) {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = path.join(tenantType, tenantId, category, `${Date.now()}-${safeName}`)
    const fullPath = path.join(this.root, key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return {
      key,
      url: `/api/files/download/${encodeURIComponent(key)}`,
      size: buffer.length,
    }
  }

  resolvePath(key) {
    const full = path.join(this.root, key)
    if (!full.startsWith(this.root)) {
      throw new Error('Invalid storage key')
    }
    return full
  }

  async delete(key) {
    try {
      await fs.unlink(this.resolvePath(key))
    } catch {
      // ignore missing
    }
  }

  getSignedUrl(key) {
    return `/api/files/download/${encodeURIComponent(key)}`
  }
}
