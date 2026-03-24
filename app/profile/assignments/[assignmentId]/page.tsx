'use client'

import { useParams } from 'next/navigation'

import { AssignmentWorkspace } from '@/components/assignments/AssignmentWorkspace'

export default function AssignmentWorkspacePage() {
  const params = useParams<{ assignmentId: string }>()

  return <AssignmentWorkspace assignmentId={params.assignmentId} />
}
