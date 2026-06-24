export function authLog(event, data = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...data,
  }))
}
