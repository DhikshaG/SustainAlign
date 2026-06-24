export function safeFilename(name) {
  if (!name || typeof name !== 'string') return 'download'
  return name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').substring(0, 200) || 'download'
}
