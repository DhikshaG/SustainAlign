export const volunteerData = {
  summary: { campaigns: 6, volunteers: 342, hoursLogged: 4280, eventsUpcoming: 3 },
  campaigns: [
    {
      id: 'vc-001',
      title: 'Tree Plantation Drive 2026',
      date: '2026-02-15',
      location: 'Pune',
      slots: 50,
      enrolled: 38,
      status: 'open',
    },
    {
      id: 'vc-002',
      title: 'Digital Literacy Workshop',
      date: '2026-02-22',
      location: 'Bangalore',
      slots: 30,
      enrolled: 30,
      status: 'full',
    },
    {
      id: 'vc-003',
      title: 'Health Camp Support',
      date: '2026-03-05',
      location: 'Chennai',
      slots: 25,
      enrolled: 12,
      status: 'open',
    },
  ],
  signups: [
    { name: 'Rahul Mehta', department: 'Engineering', campaign: 'Tree Plantation', hours: 8, status: 'confirmed' },
    { name: 'Sneha Patel', department: 'HR', campaign: 'Digital Literacy', hours: 12, status: 'confirmed' },
    { name: 'Amit Kumar', department: 'Finance', campaign: 'Health Camp', hours: 4, status: 'pending' },
    { name: 'Priya Nair', department: 'Marketing', campaign: 'Tree Plantation', hours: 6, status: 'confirmed' },
  ],
  events: [
    { id: 'ev-1', title: 'Annual Volunteer Day', date: '2026-04-22', type: 'company-wide' },
    { id: 'ev-2', title: 'NGO Partner Meet', date: '2026-03-18', type: 'internal' },
    { id: 'ev-3', title: 'CSR Week Kickoff', date: '2026-02-01', type: 'celebration' },
  ],
}
