import { api } from './api'

export async function fetchVolunteerSummary() {
  const res = await api.get('/api/corporate/volunteers/summary')
  return res.data
}

export async function fetchVolunteerEvents(params = {}) {
  const res = await api.get('/api/corporate/volunteers/events', { params })
  return res.data?.events ?? []
}

export async function fetchVolunteerEvent(id) {
  const res = await api.get(`/api/corporate/volunteers/events/${id}`)
  return res.data
}

export async function createVolunteerEvent(payload) {
  const res = await api.post('/api/corporate/volunteers/events', payload)
  return res.data
}

export async function updateVolunteerEvent(id, payload) {
  const res = await api.patch(`/api/corporate/volunteers/events/${id}`, payload)
  return res.data
}

export async function fetchVolunteerSignups(eventId) {
  const params = eventId ? { eventId } : {}
  const res = await api.get('/api/corporate/volunteers/signups', { params })
  return res.data?.signups ?? []
}

export async function fetchVolunteerCalendar() {
  const res = await api.get('/api/corporate/volunteers/calendar')
  return res.data?.events ?? []
}

export async function registerForVolunteerEvent(eventId) {
  const res = await api.post(`/api/corporate/volunteers/events/${eventId}/register`)
  return res.data
}

export async function cancelVolunteerRegistration(eventId) {
  const res = await api.delete(`/api/corporate/volunteers/events/${eventId}/register`)
  return res.data
}

export async function fetchEventQr(eventId) {
  const res = await api.get(`/api/corporate/volunteers/events/${eventId}/qr`)
  return res.data
}

export async function checkInWithToken(token) {
  const res = await api.post('/api/corporate/volunteers/check-in', { token })
  return res.data
}

export async function recordManualAttendance(eventId, signupIds) {
  const res = await api.post(`/api/corporate/volunteers/events/${eventId}/attendance/manual`, { signupIds })
  return res.data
}

export async function issueVolunteerCertificate(signupId) {
  const res = await api.post(`/api/corporate/volunteers/signups/${signupId}/certificate`)
  return res.data
}
