import { toast } from 'sonner'

/** Shown under success toasts when an MR action is pending manager approval. */
export const MR_PENDING_MANAGER_APPROVAL_DESC =
  'Sent to your manager for approval. It will be active once they approve.'

export function toastMrPendingManagerApproval(title: string) {
  toast.success(title, { description: MR_PENDING_MANAGER_APPROVAL_DESC })
}
