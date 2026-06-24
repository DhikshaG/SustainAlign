const base = process.env.API_URL || 'http://127.0.0.1:3001'

async function loginCorporate(email, password = 'Demo@12345') {
  const r = await fetch(`${base}/api/auth/corporate/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const j = await r.json()
  if (!j.ok) throw new Error(`login failed ${email}: ${j.message}`)
  return j.data
}

async function loginNgo(email) {
  const r = await fetch(`${base}/api/auth/ngo/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Demo@12345' }),
  })
  const j = await r.json()
  if (!j.ok) throw new Error(`ngo login failed: ${j.message}`)
  return j.data
}

async function req(path, token, options = {}) {
  const r = await fetch(`${base}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, body: j }
}

async function main() {
  const acme = await loginCorporate('admin@acme.com')
  const me = await req('/api/auth/me', acme.access_token)
  console.assert(me.body.data?.permissions?.length > 0, 'me should include permissions')
  console.log('OK /me permissions:', me.body.data.permissions.length)

  const compliance = await req('/api/corporate/compliance/summary', acme.access_token)
  console.assert(compliance.status === 200, 'super_admin compliance')
  console.log('OK compliance 200 for super_admin')

  const notif = await req('/api/notifications', acme.access_token)
  console.assert(notif.status === 200 && notif.body.data?.notifications, 'notifications list')
  console.log('OK notifications unread:', notif.body.data.unreadCount)

  const fo = await loginNgo('field_officer@greenearth.org')
  const foMe = await req('/api/auth/me', fo.access_token)
  console.assert(foMe.body.data?.role === 'field_officer', 'field_officer role')
  console.assert(!foMe.body.data?.permissions?.includes('finance:read'), 'no finance perm')
  console.log('OK field_officer permissions')

  const pdf = Buffer.from('%PDF-1.4 test')
  const form = new FormData()
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'test.pdf')
  form.append('category', 'compliance')
  const upload = await req('/api/files/upload', acme.access_token, { method: 'POST', body: form })
  console.assert(upload.status === 200, `upload ${upload.status} ${upload.body?.message}`)
  console.log('OK file upload:', upload.body.data?.id)

  const activity = await req('/api/activity?limit=10', acme.access_token)
  const hasUpload = activity.body.data?.activity?.some((a) => a.action === 'file.upload')
  console.assert(hasUpload, 'activity should include file.upload')
  console.log('OK activity log includes file.upload')

  console.log('\nAll Step 0 API checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
