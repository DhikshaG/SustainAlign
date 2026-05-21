import { env } from '../../config/env.js'
import { LocalDiskStorage } from './local.js'

const MIME_BY_CATEGORY = {
  ngo_verification: ['application/pdf', 'image/png', 'image/jpeg'],
  ngo_evidence: ['application/pdf', 'image/png', 'image/jpeg'],
  project_evidence: ['application/pdf', 'image/png', 'image/jpeg'],
  project_update: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
  invoice: ['application/pdf', 'image/png', 'image/jpeg'],
  compliance: ['application/pdf', 'image/png', 'image/jpeg'],
  report: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
  ],
  public_document: ['application/pdf', 'image/png', 'image/jpeg'],
  logo: ['image/png', 'image/jpeg', 'image/webp'],
  gallery_image: ['image/png', 'image/jpeg', 'image/webp'],
  gallery_video: ['video/mp4', 'video/webm', 'video/quicktime'],
  image: ['image/png', 'image/jpeg', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
}

export const FILE_CATEGORIES = Object.keys(MIME_BY_CATEGORY)

export function isAllowedMime(category, mime) {
  const allowed = MIME_BY_CATEGORY[category]
  if (!allowed) return false
  return allowed.includes(mime)
}

let provider

export function getStorage() {
  if (!provider) {
    if (env.STORAGE_PROVIDER !== 'local') {
      throw new Error(`Unsupported STORAGE_PROVIDER: ${env.STORAGE_PROVIDER}`)
    }
    provider = new LocalDiskStorage()
  }
  return provider
}
