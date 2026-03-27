'use client'

import type {
  AssignmentAnalysis,
  AssignmentReviewResponse,
  AssignmentStructureResponse,
  AssignmentUpload,
  ParsedAssignmentSeed,
  ResearchGuidanceResponse,
  SectionGuidance,
} from '@/lib/assignments/types'

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

export const analyzeAssignmentWithGemini = async ({
  title,
  uploads,
}: {
  title?: string
  uploads: AssignmentUpload[]
}) => {
  const response = await fetch('/api/v1/assignments/analyze-assignment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      uploads,
    }),
  })

  const data = await response.json() as AssignmentAnalysis & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to analyze assignment documents with Gemini.')
  }

  return data
}

export const generateStructureWithGemini = async ({
  analysis,
  wordCount,
}: {
  analysis: AssignmentAnalysis
  wordCount: number
}) => {
  const response = await fetch('/api/v1/assignments/generate-structure', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysis,
      wordCount,
    }),
  })

  const data = await response.json() as AssignmentStructureResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate assignment structure.')
  }

  return data
}

export const fetchSectionGuidance = async ({
  sectionTitle,
  assignmentContext,
  currentText,
}: {
  sectionTitle: string
  assignmentContext: string
  currentText: string
}) => {
  const response = await fetch('/api/v1/assignments/section-guidance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sectionTitle,
      assignmentContext,
      currentText,
    }),
  })

  const data = await response.json() as SectionGuidance & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch section guidance.')
  }

  return data
}

export const fetchResearchGuidance = async ({
  section,
  assignmentContext,
}: {
  section: string
  assignmentContext: string
}) => {
  const response = await fetch('/api/v1/assignments/research-guidance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section,
      assignmentContext,
    }),
  })

  const data = await response.json() as ResearchGuidanceResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch research guidance.')
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

export type UploadParseState = 'parsing' | 'parsed' | 'error'

export type ParsedUpload = {
  id: string
  upload: AssignmentUpload
  status: UploadParseState
  parsed?: ParsedAssignmentSeed
  error?: string
}

export const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))

const toTitleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

export const buildAggregatedParsedSeed = ({
  title,
  analysis,
  structure,
  parsedUploads,
}: {
  title: string
  analysis: AssignmentAnalysis
  structure: AssignmentStructureResponse
  parsedUploads: ParsedUpload[]
}): ParsedAssignmentSeed => {
  const parsedSeeds = parsedUploads
    .map((item) => item.parsed)
    .filter((item): item is ParsedAssignmentSeed => Boolean(item))

  const resolvedTitle =
    title.trim() ||
    parsedSeeds[0]?.title?.trim() ||
    parsedUploads[0]?.upload.fileName.replace(/\.[^.]+$/, '') ||
    'Untitled assignment'

  const combinedAnalysisText = uniqueStrings([
    ...parsedSeeds.map((item) => item.analysisText),
    analysis.task_type ? `Task type: ${analysis.task_type}` : '',
    analysis.key_topics.length > 0 ? `Key topics: ${analysis.key_topics.join(', ')}` : '',
    analysis.rubric_points.length > 0 ? `Rubric focus: ${analysis.rubric_points.join(', ')}` : '',
  ]).join('\n')

  const requirements = uniqueStrings([
    ...analysis.requirements,
    ...parsedSeeds.flatMap((item) => item.breakdown.requirements),
  ]).slice(0, 8)

  const hiddenExpectations = uniqueStrings([
    ...analysis.rubric_points,
    ...parsedSeeds.flatMap((item) => item.breakdown.hiddenExpectations),
  ]).slice(0, 6)

  return {
    title: resolvedTitle,
    analysisText: combinedAnalysisText || resolvedTitle,
    breakdown: {
      requirements: requirements.length > 0 ? requirements : ['Address the assignment task directly.'],
      deliverable: toTitleCase(analysis.task_type || parsedSeeds[0]?.breakdown.deliverable || 'essay'),
      hiddenExpectations:
      hiddenExpectations.length > 0
          ? hiddenExpectations
          : ['critical thinking', 'structure', 'references'],
    },
    outline: structure.sections.map((section, index) => ({
      id: `section-${index + 1}`,
      title: section.title,
      description: section.purpose,
      targetWords: section.word_count,
    })),
  }
}
