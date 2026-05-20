export const communicationsData = {
  threads: [
    {
      id: 't-1',
      ngo: 'Green Earth Foundation',
      subject: 'Q4 Milestone Update',
      lastMessage: 'Monsoon planting phase completed in Nashik.',
      unread: 2,
      updated: '2026-01-10',
    },
    {
      id: 't-2',
      ngo: 'EduRise India',
      subject: 'Board Approval Request',
      lastMessage: 'Please review phase 2 expansion proposal.',
      unread: 1,
      updated: '2026-01-08',
    },
    {
      id: 't-3',
      ngo: 'SkillBuild Foundation',
      subject: 'Timeline Revision',
      lastMessage: 'Proposing 6-week extension for milestone 2.',
      unread: 0,
      updated: '2026-01-05',
    },
  ],
  notifications: [
    { id: 'n-1', type: 'approval', title: 'Project approval pending', body: 'Digital Classrooms needs board sign-off', read: false, date: '2026-01-12' },
    { id: 'n-2', type: 'compliance', title: 'UC overdue', body: 'SkillBuild Q3 certificate missing', read: false, date: '2026-01-11' },
    { id: 'n-3', type: 'project', title: 'Milestone completed', body: 'Mobile Health: 500 camps target met', read: true, date: '2026-01-09' },
    { id: 'n-4', type: 'ngo', title: 'New NGO match', body: 'AI recommends Clean Water Mission for Odisha', read: true, date: '2026-01-07' },
  ],
  approvals: [
    { id: 'a-1', title: 'Phase 2 - Digital Classrooms', requester: 'CSR Head', amount: '₹14L', status: 'pending', date: '2026-01-08' },
    { id: 'a-2', title: 'Clean Water Odisha - New Project', requester: 'CSR Head', amount: '₹22L', status: 'pending', date: '2026-01-02' },
    { id: 'a-3', title: 'Green Maharashtra - Tranche 3', requester: 'Finance', amount: '₹8L', status: 'approved', date: '2025-12-15' },
  ],
  comments: [
    { id: 'c-1', author: 'CSR Head', text: 'Recommend fast-tracking Health For All renewal.', project: 'Mobile Health TN', date: '2026-01-11' },
    { id: 'c-2', author: 'Finance', text: 'Budget reallocation needed for SkillBuild delay.', project: 'Skill Development', date: '2026-01-09' },
  ],
}
