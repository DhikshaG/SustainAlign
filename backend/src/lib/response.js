export function ok(res, data = null, message = 'ok') {
  return res.json({ ok: true, message, data })
}

export function created(res, data = null, message = 'created') {
  return res.status(201).json({ ok: true, message, data })
}

export function fail(res, status, message, errors = null) {
  return res.status(status).json({ ok: false, message, errors })
}
