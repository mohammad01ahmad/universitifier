'use client'

import type { AssignmentUpload, ParsedAssignmentSeed } from '@/lib/assignments/types'

export const parseAssignmentWithGemini = async ({
  title,
  upload,
  wordCountTarget,
}: {
  title: string
  upload: AssignmentUpload
  wordCountTarget: number
}) => {
  const response = await fetch('/api/v1/assignments/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      upload,
      wordCountTarget,
    }),
  })

  const data = await response.json() as ParsedAssignmentSeed & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse assignment with Gemini.')
  }

  return data
}
