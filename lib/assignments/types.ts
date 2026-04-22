export type AssignmentStatus = 'draft' | 'in_progress' | 'ready_for_review'

export type AssignmentBreakdown = {
  requirements: string[]
  deliverable: string
  hiddenExpectations: string[]
}

export type AssignmentSection = {
  id: string
  title: string
  description: string
  targetWords: number
  guidance?: SectionGuidance
  researchGuidance?: ResearchGuidanceResponse
}

export type AssignmentStructureSection = {
  title: string
  word_count: number
  purpose: string
}

export type AssignmentStructureResponse = {
  sections: AssignmentStructureSection[]
}

export type AssignmentWorkspaceIntelligenceSection = {
  title: string
  word_count: number
  purpose: string
  guidance: SectionGuidance
  researchGuidance: ResearchGuidanceResponse
}

export type AssignmentWorkspaceIntelligenceResponse = {
  title?: string
  analysisText: string
  breakdown: AssignmentBreakdown
  outline: AssignmentWorkspaceIntelligenceSection[]
}

export type AssignmentChecklistItem = {
  id: string
  label: string
  completed: boolean
}

export type AssignmentReference = {
  id: string
  citation: string
  createdAt: string
}

export type SectionAnchor = {
  sectionId: string
  title: string
  start: number
  end: number
}

export type SectionGuidance = {
  key_points: string[]
  suggestions: string[]
  common_mistakes: string[]
}

export type ResearchGuidanceResponse = {
  angles: string[]
  keywords: string[]
  example_ideas: string[]
}

export type AssistAction =
  | 'academic-tone'
  | 'expand-idea'
  | 'simplify'
  | 'critical-depth'
  | 'add-example'
  | 'continue-writing'

export type ReviewResult = {
  status: 'needs_attention' | 'on_track' | 'nearly_ready'
  checks: {
    structureComplete: boolean
    academicTone: boolean
    clarity: boolean
    referencesIncluded: boolean
  }
  highlights: string[]
}

export type AssignmentReviewResponse = {
  scores: {
    structure: number
    clarity: number
    critical_thinking: number
    referencing: number
  }
  issues: string[]
  suggestions: string[]
}

export type AssignmentUpload = {
  fileName: string
  mimeType: string
  size: number
  base64: string
}

export type ParsedAssignmentSeed = {
  title?: string
  analysisText: string
  breakdown: AssignmentBreakdown
  outline: AssignmentSection[]
}

export type AssignmentAnalysis = {
  task_type: string
  requirements: string[]
  key_topics: string[]
  rubric_points: string[]
}

export type Assignment = {
  id: string
  userId: string
  title: string
  upload: AssignmentUpload
  analysisText: string
  wordCountTarget: number
  deadline: string
  status: AssignmentStatus
  breakdown: AssignmentBreakdown
  outline: AssignmentSection[]
  document: string
  sectionAnchors: SectionAnchor[]
  checklist: AssignmentChecklistItem[]
  references: AssignmentReference[]
  review: ReviewResult
  progressPercent: number
  createdAt: string
  updatedAt: string
}

export type CreateAssignmentInput = {
  userId: string
  title: string
  upload: AssignmentUpload
  parsed?: ParsedAssignmentSeed
  wordCountTarget: number
  deadline: string
}
