import { PageHeader } from '../../components/corporate/PageHeader'
import { ApprovalInbox } from '../../components/workflow/ApprovalInbox'

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Approval Inbox"
        description="Review NGO reports and other submissions awaiting your action."
      />
      <ApprovalInbox />
    </>
  )
}
