'use client'

import type {
  AssignmentReviewResponse,
  AssignmentUpload,
  ParsedAssignmentSeed,
  AssignmentWorkspaceIntelligenceResponse,
} from '@/lib/assignments/types'

export const createWorkspaceIntelligenceWithGemini = async ({
  title,
  uploads,
  wordCountTarget,
}: {
  title?: string
  uploads: AssignmentUpload[]
  wordCountTarget: number
}) => {
  const response = await fetch('/api/v1/assignments/create-workspace-intelligence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      uploads,
      wordCountTarget,
    }),
  })

  const data = await response.json() as AssignmentWorkspaceIntelligenceResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate assignment workspace intelligence.')
  }

  return data
}

export const fetchAssignmentReview = async ({
  assignmentText,
  rubric,
  structure,
}: {
  assignmentText: string
  rubric: string[]
  structure: Array<{ title: string; purpose?: string; word_count?: number }>
}) => {
  const response = await fetch('/api/v1/assignments/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assignmentText,
      rubric,
      structure,
    }),
  })

  const data = await response.json() as AssignmentReviewResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to review assignment.')
  }

  return data
}

// Function: Reads a file and returns its base64 representation.
export const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }

      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export type UploadParseState = 'uploaded' | 'error'

export type ParsedUpload = {
  id: string
  upload: AssignmentUpload
  status: UploadParseState
  error?: string
}

export const buildAggregatedParsedSeed = ({
  title,
  intelligence,
  uploads,
}: {
  title: string
  intelligence: AssignmentWorkspaceIntelligenceResponse
  uploads: ParsedUpload[]
}): ParsedAssignmentSeed => {
  const resolvedTitle =
    title.trim() ||
    intelligence.title?.trim() ||
    uploads[0]?.upload.fileName.replace(/\.[^.]+$/, '') ||
    'Untitled assignment'

  return {
    title: resolvedTitle,
    analysisText: intelligence.analysisText || resolvedTitle,
    breakdown: intelligence.breakdown,
    outline: intelligence.outline.map((section, index) => ({
      id: `section-${index + 1}`,
      title: section.title,
      description: section.purpose,
      targetWords: section.word_count,
      guidance: section.guidance,
      researchGuidance: section.researchGuidance,
    })),
  }
}
