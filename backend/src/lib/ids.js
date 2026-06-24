import { randomUUID } from 'node:crypto'

export function newId() {
  return randomUUID()
}

export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'org'
}

export async function uniqueSlug(base, existsFn) {
  let slug = slugify(base)
  let candidate = slug
  let i = 1
  while (await existsFn(candidate)) {
    candidate = `${slug}-${i++}`
  }
  return candidate
}
