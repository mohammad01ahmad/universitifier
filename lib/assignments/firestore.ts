'use client'

import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, } from 'firebase/firestore'
import { db } from '@/lib/Database/Firebase'
import { buildAssignmentStateFromSeed, calculateProgress, createSeededAssignmentState, deriveAssignmentTitle, evaluateReview, } from '@/lib/assignments/intelligence'
import type { Assignment, AssignmentChecklistItem, AssignmentReference, CreateAssignmentInput } from '@/lib/assignments/types'

const assignmentsCollection = collection(db, 'assignments')

const sortAssignments = (assignments: Assignment[]) =>
  assignments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

const normalizeAssignment = (id: string, data: Record<string, unknown>) =>
  ({
    id,
    ...data,
  }) as Assignment

export const createAssignment = async (input: CreateAssignmentInput) => {
  const now = new Date().toISOString()
  const intelligenceSeed = [input.title, input.upload.fileName].filter(Boolean).join(' ').trim()
  const seeded = input.parsed
    ? buildAssignmentStateFromSeed({
      ...input.parsed,
      wordCountTarget: input.wordCountTarget,
    })
    : createSeededAssignmentState(intelligenceSeed, input.wordCountTarget)

  const assignmentPayload: Omit<Assignment, 'id'> = {
    userId: input.userId,
    title: input.title.trim() || input.parsed?.title?.trim() || deriveAssignmentTitle(input.upload.fileName),
    upload: input.upload,
    analysisText: seeded.analysisText,
    wordCountTarget: input.wordCountTarget,
    deadline: input.deadline,
    status: 'draft',
    breakdown: seeded.breakdown,
    outline: seeded.outline,
    document: seeded.document,
    sectionAnchors: seeded.sectionAnchors,
    checklist: seeded.checklist,
    references: seeded.references,
    review: seeded.review,
    progressPercent: seeded.progressPercent,
    createdAt: now,
    updatedAt: now,
  }

  const reference = await addDoc(assignmentsCollection, assignmentPayload)
  return reference.id
}

export const fetchAssignmentsForUser = async (userId: string) => {
  const snapshot = await getDocs(query(assignmentsCollection, where('userId', '==', userId)))
  const assignments = snapshot.docs
    .map((documentSnapshot) => normalizeAssignment(documentSnapshot.id, documentSnapshot.data()))

  return sortAssignments(assignments)
}

export const fetchAssignmentById = async (assignmentId: string) => {
  const snapshot = await getDoc(doc(db, 'assignments', assignmentId))
  if (!snapshot.exists()) return null

  return normalizeAssignment(snapshot.id, snapshot.data())
}

export const updateAssignment = async (
  assignmentId: string,
  updates: Partial<Assignment>
) => {
  await updateDoc(doc(db, 'assignments', assignmentId), {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export const recomputeAssignmentState = ({
  assignment,
  document,
  checklist,
  references,
  sectionAnchors,
}: {
  assignment: Assignment
  document?: string
  checklist?: AssignmentChecklistItem[]
  references?: AssignmentReference[]
  sectionAnchors?: Assignment['sectionAnchors']
}) => {
  const nextDocument = document ?? assignment.document
  const nextChecklist = checklist ?? assignment.checklist
  const nextReferences = references ?? assignment.references
  const nextAnchors = sectionAnchors ?? assignment.sectionAnchors

  const review = evaluateReview({
    document: nextDocument,
    outline: assignment.outline,
    references: nextReferences,
    sectionAnchors: nextAnchors,
    wordCountTarget: assignment.wordCountTarget,
  })

  const progressPercent = calculateProgress({
    checklist: nextChecklist,
    document: nextDocument,
    wordCountTarget: assignment.wordCountTarget,
    references: nextReferences,
    review,
  })

  const status: Assignment['status'] =
    progressPercent >= 80 ? 'ready_for_review' : progressPercent >= 35 ? 'in_progress' : 'draft'

  return {
    review,
    progressPercent,
    status,
  }
}
