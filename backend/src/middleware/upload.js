import multer from 'multer'
import { env } from '../config/env.js'
import { FILE_CATEGORIES, isAllowedMime } from '../lib/storage/index.js'

/**
 * Create a configured multer instance for file uploads.
 *
 * Options:
 *   - category: string (required for fileFilter validation)
 *   - maxFiles: number (default 1)
 *   - maxFileSizeMB: number (defaults to env.MAX_FILE_SIZE_MB)
 */
export function createUpload({ category, maxFiles = 1, maxFileSizeMB } = {}) {
  const maxSize = (maxFileSizeMB ?? env.MAX_FILE_SIZE_MB) * 1024 * 1024

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSize,
      // Guard against multipart bomb attacks
      fieldSize: 1 * 1024,          // 1 KB per non-file field
      fields: 20,                   // max 20 fields
      parts: maxFiles + 20,         // parts = files + fields
      files: maxFiles,
    },
    // Validate MIME type against the storage whitelist (if category is known)
    fileFilter: category
      ? (_req, file, cb) => {
          if (!isAllowedMime(category, file.mimetype)) {
            cb(new Error(`File type "${file.mimetype}" is not allowed for category "${category}"`))
            return
          }
          cb(null, true)
        }
      : (_req, _file, cb) => cb(null, true),
  })
}

/**
 * Convenience: a pre-configured upload for the generic /api/files/upload route.
 * The caller must pass `category` in req.body or req.query; validation is done
 * downstream in the route handler via storeFile(). This middleware does NOT
 * filter by category (unknown at multer time), but still enforces size/parts limits.
 */
export const genericUpload = createUpload()

/**
 * Convenience: upload for NGO verification documents (PDF + images only).
 */
export const ngoVerificationUpload = createUpload({
  category: 'ngo_verification',
  maxFiles: 10,  // up to 10 verification docs at once
})
