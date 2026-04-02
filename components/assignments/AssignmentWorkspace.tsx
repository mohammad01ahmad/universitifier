'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, ClipboardCheck, FileSearch, GraduationCap, LibraryBig, Loader2, PencilLine, Sparkles, WandSparkles, X } from 'lucide-react'
import type { Editor as TinyMCEEditorInstance } from 'tinymce'
import { Button } from '@/components/ui/button'
import { ReferenceGenerator } from '@/components/ReferenceGenerator'
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser'
import { applyAssistAction, computeSectionAnchors, extractSectionText, getActiveSectionId } from '@/lib/assignments/intelligence'
import { fetchAssignmentById, persistAssignmentSectionIntelligence, recomputeAssignmentState, renameAssignmentOutlineSection, updateAssignment } from '@/lib/assignments/firestore'
import { fetchAssignmentReview, fetchResearchGuidance, fetchSectionGuidance } from '@/lib/assignments/parser'
import type { Assignment, AssignmentReference, AssignmentReviewResponse, AssistAction, ResearchGuidanceResponse, SectionGuidance } from '@/lib/assignments/types'
import AssignmentHeader from './AssignmentHeader'

const TinyMCEEditor = dynamic(
  () => import('@tinymce/tinymce-react').then((mod) => mod.Editor),
  { ssr: false }
)

const assistActions: { id: AssistAction; label: string }[] = [
  { id: 'academic-tone', label: 'Improve Academic Tone' },
  { id: 'expand-idea', label: 'Expand This Idea' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'critical-depth', label: 'Make More Critical' },
  { id: 'add-example', label: 'Add Example' },
  { id: 'continue-writing', label: 'Continue Writing' },
]

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

const htmlToPlainText = (value: string) => {
  const withLineBreaks = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|section|article)>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  return withLineBreaks.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const plainTextToHtml = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return '<p></p>'

  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

const normalizeEditorContent = (value: string) => {
  if (!value.trim()) return '<p></p>'
  return /<\/?[a-z][\s\S]*>/i.test(value) ? value : plainTextToHtml(value)
}

const findTextNodeContaining = (root: Node, target: string) => {
  const ownerDocument = root.ownerDocument
  if (!ownerDocument) return null

  const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()

  while (current) {
    const textContent = current.textContent ?? ''
    const startIndex = textContent.indexOf(target)

    if (startIndex > -1) {
      return { node: current, startIndex }
    }

    current = walker.nextNode()
  }

  return null
}

const getSelectionOffsets = (editor: TinyMCEEditorInstance) => {
  const body = editor.getBody()
  const selection = editor.selection.getRng()
  const ownerDocument = body?.ownerDocument

  if (!body || !selection || !ownerDocument) {
    return { start: 0, end: 0 }
  }

  const startRange = ownerDocument.createRange()
  startRange.selectNodeContents(body)
  startRange.setEnd(selection.startContainer, selection.startOffset)

  const endRange = ownerDocument.createRange()
  endRange.selectNodeContents(body)
  endRange.setEnd(selection.endContainer, selection.endOffset)

  return {
    start: startRange.toString().length,
    end: endRange.toString().length,
  }
}

const replaceSectionTitle = ({
  document,
  anchors,
  sectionId,
  nextTitle,
}: {
  document: string
  anchors: Assignment['sectionAnchors']
  sectionId: string
  nextTitle: string
}) => {
  const anchor = anchors.find((item) => item.sectionId === sectionId)
  if (!anchor) return document

  const currentSectionText = document.slice(anchor.start, anchor.end)
  const normalizedSectionText = currentSectionText.replace(/^\s+/, '')
  const nextSectionText = normalizedSectionText.replace(/^[^\n]+/, nextTitle)

  return `${document.slice(0, anchor.start)}${nextSectionText}${document.slice(anchor.end)}`
}

const buildSmartChecklist = ({
  assignment,
  document,
  sectionAnchors,
  references,
  review,
}: {
  assignment: Assignment
  document: string
  sectionAnchors: Assignment['sectionAnchors']
  references: AssignmentReference[]
  review: Assignment['review']
}) =>
  assignment.checklist.map((item) => {
    if (item.id === 'check-intro') {
      const intro = assignment.outline[0]
      const introWords = intro ? countWords(extractSectionText(document, sectionAnchors, intro.id)) : 0
      return { ...item, completed: item.completed || introWords >= 90 }
    }

    if (item.id === 'check-body-1') {
      const firstBody = assignment.outline[1]
      const bodyWords = firstBody ? countWords(extractSectionText(document, sectionAnchors, firstBody.id)) : 0
      return { ...item, completed: item.completed || bodyWords >= 140 }
    }

    if (item.id === 'check-body-2') {
      const criticalSection = assignment.outline[3] ?? assignment.outline[2]
      const criticalWords = criticalSection
        ? countWords(extractSectionText(document, sectionAnchors, criticalSection.id))
        : 0
      return { ...item, completed: item.completed || criticalWords >= 140 }
    }

    if (item.id === 'check-refs') {
      return { ...item, completed: references.length > 0 }
    }

    if (item.id === 'check-review') {
      return { ...item, completed: review.status === 'nearly_ready' }
    }

    return item
  })

export function AssignmentWorkspace({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const { user, loading } = useAuthenticatedUser()
  const editorRef = useRef<TinyMCEEditorInstance | null>(null)
  const pendingSectionJumpRef = useRef<string | null>(null)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [editorContent, setEditorContent] = useState('<p></p>')
  const [loadingAssignment, setLoadingAssignment] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeSectionId, setActiveSectionId] = useState('')
  const [assistMessage, setAssistMessage] = useState('')
  const [sectionGuidance, setSectionGuidance] = useState<SectionGuidance | null>(null)
  const [researchGuidance, setResearchGuidance] = useState<ResearchGuidanceResponse | null>(null)
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidanceError, setGuidanceError] = useState('')
  const [reviewResult, setReviewResult] = useState<AssignmentReviewResponse | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [editingSectionId, setEditingSectionId] = useState('')
  const [editingSectionTitle, setEditingSectionTitle] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, router, user])

  useEffect(() => {
    const loadAssignment = async () => {
      if (!user) return

      setLoadingAssignment(true)
      setError('')

      try {
        const nextAssignment = await fetchAssignmentById(assignmentId)

        if (!nextAssignment || nextAssignment.userId !== user.uid) {
          setError('This assignment could not be found in your workspace.')
          setLoadingAssignment(false)
          return
        }

        setAssignment(nextAssignment)
        setEditorContent(normalizeEditorContent(nextAssignment.document))
        setActiveSectionId(nextAssignment.outline[0]?.id ?? '')
      } catch (loadError) {
        console.error(loadError)
        setError('We could not load this assignment right now.')
      } finally {
        setLoadingAssignment(false)
      }
    }

    void loadAssignment()
  }, [assignmentId, user])

  const documentText = useMemo(() => htmlToPlainText(editorContent), [editorContent])

  const liveAssignment = useMemo(() => {
    if (!assignment) return null

    const sectionAnchors = computeSectionAnchors(documentText, assignment.outline)
    const previewReview = recomputeAssignmentState({
      assignment,
      document: documentText,
      sectionAnchors,
    }).review
    const checklist = buildSmartChecklist({
      assignment,
      document: documentText,
      sectionAnchors,
      references: assignment.references,
      review: previewReview,
    })
    const derived = recomputeAssignmentState({
      assignment,
      document: documentText,
      checklist,
      sectionAnchors,
    })

    return {
      ...assignment,
      document: documentText,
      sectionAnchors,
      checklist,
      review: derived.review,
      progressPercent: derived.progressPercent,
      status: derived.status,
    }
  }, [assignment, documentText])

  const activeSection =
    liveAssignment?.outline.find((section) => section.id === activeSectionId) ?? liveAssignment?.outline[0]
  const activeSectionText =
    liveAssignment && activeSection
      ? extractSectionText(liveAssignment.document, liveAssignment.sectionAnchors, activeSection.id)
      : ''
  const assignmentContext =
    liveAssignment
      ? [
        liveAssignment.title,
        liveAssignment.analysisText,
        ...liveAssignment.breakdown.requirements,
        ...liveAssignment.breakdown.hiddenExpectations,
      ].filter(Boolean).join('\n')
      : ''

  useEffect(() => {
    if (!assignment || editorContent === normalizeEditorContent(assignment.document)) return

    const timeoutId = window.setTimeout(async () => {
      const sectionAnchors = computeSectionAnchors(documentText, assignment.outline)
      const previewReview = recomputeAssignmentState({
        assignment,
        document: documentText,
        sectionAnchors,
      }).review
      const checklist = buildSmartChecklist({
        assignment,
        document: documentText,
        sectionAnchors,
        references: assignment.references,
        review: previewReview,
      })
      const derived = recomputeAssignmentState({
        assignment,
        document: documentText,
        checklist,
        sectionAnchors,
      })

      setSaveState('saving')

      try {
        await updateAssignment(assignment.id, {
          document: editorContent,
          sectionAnchors,
          checklist,
          review: derived.review,
          progressPercent: derived.progressPercent,
          status: derived.status,
        })

        setAssignment((current) =>
          current
            ? {
              ...current,
              document: editorContent,
              sectionAnchors,
              checklist,
              review: derived.review,
              progressPercent: derived.progressPercent,
              status: derived.status,
              updatedAt: new Date().toISOString(),
            }
            : current
        )
        setSaveState('saved')
      } catch (saveError) {
        console.error(saveError)
        setSaveState('idle')
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [assignment, documentText, editorContent])

  useEffect(() => {
    if (!assignment || !liveAssignment || !activeSection) return

    if (activeSection.guidance && activeSection.researchGuidance) {
      setSectionGuidance(activeSection.guidance)
      setResearchGuidance(activeSection.researchGuidance)
      setGuidanceError('')
      setGuidanceLoading(false)
      return
    }

    let cancelled = false

    const loadGuidance = async () => {
      setGuidanceLoading(true)
      setGuidanceError('')

      try {
        const nextSectionGuidance = activeSection.guidance ?? await fetchSectionGuidance({
          sectionTitle: activeSection.title,
          assignmentContext,
          currentText: activeSectionText,
        })
        const nextResearchGuidance = activeSection.researchGuidance ?? await fetchResearchGuidance({
          section: activeSection.title,
          assignmentContext,
        })

        if (cancelled) return

        const nextOutline = await persistAssignmentSectionIntelligence({
          assignmentId: liveAssignment.id,
          outline: assignment.outline,
          sectionId: activeSection.id,
          ...(activeSection.guidance ? {} : { guidance: nextSectionGuidance }),
          ...(activeSection.researchGuidance ? {} : { researchGuidance: nextResearchGuidance }),
        })

        if (cancelled) return

        setAssignment((current) =>
          current
            ? {
              ...current,
              outline: nextOutline,
              updatedAt: new Date().toISOString(),
            }
            : current
        )
        setSectionGuidance(nextSectionGuidance)
        setResearchGuidance(nextResearchGuidance)
      } catch (loadError) {
        if (cancelled) return
        console.error(loadError)
        setGuidanceError(
          loadError instanceof Error ? loadError.message : 'We could not load section guidance right now.'
        )
        setSectionGuidance(null)
        setResearchGuidance(null)
      } finally {
        if (!cancelled) {
          setGuidanceLoading(false)
        }
      }
    }

    void loadGuidance()

    return () => {
      cancelled = true
    }
  }, [activeSection, activeSectionText, assignment, assignmentContext, liveAssignment])

  const syncChecklist = async (nextChecklist: Assignment['checklist']) => {
    if (!assignment || !liveAssignment) return

    const derived = recomputeAssignmentState({
      assignment,
      document: documentText,
      checklist: nextChecklist,
      sectionAnchors: liveAssignment.sectionAnchors,
    })

    const nextAssignment: Assignment = {
      ...assignment,
      checklist: nextChecklist,
      document: editorContent,
      sectionAnchors: liveAssignment.sectionAnchors,
      review: derived.review,
      progressPercent: derived.progressPercent,
      status: derived.status,
      updatedAt: new Date().toISOString(),
    }

    setAssignment(nextAssignment)

    await updateAssignment(assignment.id, {
      checklist: nextChecklist,
      review: derived.review,
      progressPercent: derived.progressPercent,
      status: derived.status,
    })
  }

  const syncReferences = async (nextReferences: AssignmentReference[]) => {
    if (!assignment || !liveAssignment) return

    const previewReview = recomputeAssignmentState({
      assignment,
      document: documentText,
      references: nextReferences,
      sectionAnchors: liveAssignment.sectionAnchors,
    }).review
    const nextChecklist = buildSmartChecklist({
      assignment,
      document: documentText,
      sectionAnchors: liveAssignment.sectionAnchors,
      references: nextReferences,
      review: previewReview,
    })
    const derived = recomputeAssignmentState({
      assignment,
      document: documentText,
      checklist: nextChecklist,
      references: nextReferences,
      sectionAnchors: liveAssignment.sectionAnchors,
    })

    const nextAssignment: Assignment = {
      ...assignment,
      checklist: nextChecklist,
      references: nextReferences,
      document: editorContent,
      sectionAnchors: liveAssignment.sectionAnchors,
      review: derived.review,
      progressPercent: derived.progressPercent,
      status: derived.status,
      updatedAt: new Date().toISOString(),
    }

    setAssignment(nextAssignment)

    await updateAssignment(assignment.id, {
      checklist: nextChecklist,
      references: nextReferences,
      review: derived.review,
      progressPercent: derived.progressPercent,
      status: derived.status,
    })
  }

  const jumpToSection = (sectionId: string) => {
    if (!assignment || !editorRef.current) return

    const section = assignment.outline.find((item) => item.id === sectionId)
    const body = editorRef.current.getBody?.()
    if (!section || !body) return

    pendingSectionJumpRef.current = sectionId
    setActiveSectionId(sectionId)

    const match = findTextNodeContaining(body, section.title)
    if (!match) {
      pendingSectionJumpRef.current = null
      return
    }

    const range = body.ownerDocument.createRange()
    range.setStart(match.node, match.startIndex)
    range.setEnd(match.node, match.startIndex + section.title.length)
    editorRef.current.selection.setRng(range)
    editorRef.current.focus()
    match.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      if (pendingSectionJumpRef.current === sectionId) {
        pendingSectionJumpRef.current = null
      }
    }, 150)
  }

  const handleRenameSection = async (sectionId: string) => {
    if (!assignment || !liveAssignment) return

    const nextTitle = editingSectionTitle.trim()
    if (!nextTitle) return

    const currentSection = assignment.outline.find((section) => section.id === sectionId)
    if (!currentSection || currentSection.title === nextTitle) {
      setEditingSectionId('')
      setEditingSectionTitle('')
      return
    }

    const nextDocumentText = replaceSectionTitle({
      document: documentText,
      anchors: liveAssignment.sectionAnchors,
      sectionId,
      nextTitle,
    })
    const nextEditorContent = plainTextToHtml(nextDocumentText)
    const nextOutline = assignment.outline.map((section) =>
      section.id === sectionId ? { ...section, title: nextTitle } : section
    )
    const nextAnchors = computeSectionAnchors(nextDocumentText, nextOutline)
    const previewReview = recomputeAssignmentState({
      assignment: {
        ...assignment,
        outline: nextOutline,
      },
      document: nextDocumentText,
      sectionAnchors: nextAnchors,
    }).review
    const nextChecklist = buildSmartChecklist({
      assignment: {
        ...assignment,
        outline: nextOutline,
      },
      document: nextDocumentText,
      sectionAnchors: nextAnchors,
      references: assignment.references,
      review: previewReview,
    })
    const derived = recomputeAssignmentState({
      assignment: {
        ...assignment,
        outline: nextOutline,
      },
      document: nextDocumentText,
      checklist: nextChecklist,
      sectionAnchors: nextAnchors,
    })

    setEditorContent(nextEditorContent)
    setAssignment((current) =>
      current
        ? {
          ...current,
          outline: nextOutline,
          document: nextEditorContent,
          sectionAnchors: nextAnchors,
          checklist: nextChecklist,
          review: derived.review,
          progressPercent: derived.progressPercent,
          status: derived.status,
          updatedAt: new Date().toISOString(),
        }
        : current
    )
    setSectionGuidance(currentSection.guidance ?? null)
    setResearchGuidance(currentSection.researchGuidance ?? null)
    setEditingSectionId('')
    setEditingSectionTitle('')

    try {
      await renameAssignmentOutlineSection({
        assignmentId: assignment.id,
        outline: assignment.outline,
        sectionId,
        title: nextTitle,
        extraUpdates: {
          document: nextEditorContent,
          sectionAnchors: nextAnchors,
          checklist: nextChecklist,
          review: derived.review,
          progressPercent: derived.progressPercent,
          status: derived.status,
        },
      })
    } catch (renameError) {
      console.error(renameError)
      setGuidanceError(
        renameError instanceof Error ? renameError.message : 'We could not rename this section right now.'
      )
    }
  }

  const handleEditorSelectionChange = (editor: TinyMCEEditorInstance) => {
    if (!liveAssignment) return

    if (pendingSectionJumpRef.current) {
      setActiveSectionId(pendingSectionJumpRef.current)
      return
    }

    const { start } = getSelectionOffsets(editor)
    setActiveSectionId((current) =>
      getActiveSectionId(start, liveAssignment.sectionAnchors, current)
    )
  }

  // Later on
  const handleAssistAction = (action: AssistAction) => {
    if (!liveAssignment || !editorRef.current || !activeSection) return

    const { start, end } = getSelectionOffsets(editorRef.current)
    const result = applyAssistAction({
      action,
      document: documentText,
      selectionStart: start,
      selectionEnd: end,
      activeSectionText,
    })

    setEditorContent(plainTextToHtml(result.document))
    setAssistMessage(result.message)
  }

  const handleAddReference = async (citation: string) => {
    if (!assignment) return

    const nextReferences = [
      ...assignment.references,
      {
        id: `reference-${Date.now()}`,
        citation,
        createdAt: new Date().toISOString(),
      },
    ]

    await syncReferences(nextReferences)
  }

  const handleRunReview = async () => {
    if (!liveAssignment) return

    setReviewLoading(true)
    setReviewError('')

    try {
      const result = await fetchAssignmentReview({
        assignmentText: documentText,
        rubric: [
          ...liveAssignment.breakdown.requirements,
          ...liveAssignment.breakdown.hiddenExpectations,
        ],
        structure: liveAssignment.outline.map((section) => ({
          title: section.title,
          purpose: section.description,
          word_count: section.targetWords,
        })),
      })

      setReviewResult(result)
    } catch (reviewLoadError) {
      console.error(reviewLoadError)
      setReviewError(
        reviewLoadError instanceof Error ? reviewLoadError.message : 'We could not run the final review right now.'
      )
      setReviewResult(null)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleCopyExport = async () => {
    await navigator.clipboard.writeText(documentText)
  }

  const handleDownload = () => {
    const blob = new Blob([documentText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(assignment?.title || 'assignment-draft').replace(/\s+/g, '-').toLowerCase()}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleRenameAssignmentTitle = async (title: string) => {
    if (!assignment) return

    setAssignment((current) =>
      current
        ? {
          ...current,
          title,
          updatedAt: new Date().toISOString(),
        }
        : current
    )

    await updateAssignment(assignment.id, { title })
  }

  if (loading || (user && loadingAssignment)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
        <div className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          Loading assignment workspace...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error || !assignment || !liveAssignment) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto size-10 text-rose-500" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">Assignment unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error || 'We could not load this assignment. Please head back to your dashboard and try again.'}
          </p>
          <Button className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => router.push('/profile')}>
            Back to dashboard
          </Button>
        </div>
      </main>
    )
  }

  return (
    <>
      <AssignmentHeader
        assignment={assignment}
        documentText={documentText}
        saveState={saveState}
        handleCopyExport={handleCopyExport}
        handleDownload={handleDownload}
        onRenameTitle={handleRenameAssignmentTitle}
      />

      <main className="min-h-[calc(100svh-120px)] bg-[#f7f5ef] pb-6 text-slate-950">
        <div className="px-3 pt-4 sm:px-4 lg:px-5">
          <div className="mx-auto grid max-w-[1800px] gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_23rem]">

            {/* Left side bar  */}
            <aside className="space-y-4 xl:sticky xl:top-[120px] xl:h-[calc(100svh-145px)] xl:self-start xl:overflow-y-auto xl:pr-2 assignment-sidebar-scroll">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Outline & Expectations</p>

              {/* Outline */}
              <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Outline</p>
                <div className="mt-4 space-y-2">
                  {assignment.outline.map((section) => (
                    <div
                      key={section.id}
                      className={`rounded-2xl px-3 py-3 text-sm transition ${activeSectionId === section.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {editingSectionId === section.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingSectionTitle}
                            onChange={(event) => setEditingSectionTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                void handleRenameSection(section.id)
                              }
                              if (event.key === 'Escape') {
                                setEditingSectionId('')
                                setEditingSectionTitle('')
                              }
                            }}
                            className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleRenameSection(section.id)}
                              className="h-8 bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSectionId('')
                                setEditingSectionTitle('')
                              }}
                              className="h-8 px-3"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => jumpToSection(section.id)}
                            className={`flex-1 text-left ${activeSectionId === section.id ? 'font-semibold' : ''}`}
                          >
                            {section.title}
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-slate-500 hover:text-slate-900"
                            onClick={() => {
                              setEditingSectionId(section.id)
                              setEditingSectionTitle(section.title)
                            }}
                            aria-label={`Rename ${section.title}`}
                          >
                            <PencilLine className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Assignment File */}
              <section className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <FileSearch className="size-3.5 text-emerald-600" />
                  Assignment File
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">{assignment.upload.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {(assignment.upload.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </section>

              {/* Completion */}
              <section className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <ClipboardCheck className="size-3.5 text-emerald-600" />
                  Completion
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${liveAssignment.progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                  <span>{liveAssignment.progressPercent}% complete</span>
                  <span>{liveAssignment.status.replace('_', ' ')}</span>
                </div>

                <div className="mt-5 space-y-3">
                  {liveAssignment.checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(event) =>
                          void syncChecklist(
                            liveAssignment.checklist.map((check) =>
                              check.id === item.id ? { ...check, completed: event.target.checked } : check
                            )
                          )
                        }
                        className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Expectations */}
              <section className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  Expectations
                </div>
                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  {assignment.breakdown.requirements.map((requirement) => (
                    <li key={requirement} className="rounded-2xl bg-slate-50 px-3 py-3">
                      {requirement}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl bg-[#122118] px-4 py-4 text-sm text-emerald-50">
                  <p className="font-semibold text-white">Deliverable</p>
                  <p className="mt-1">{assignment.breakdown.deliverable}</p>
                </div>
              </section>
            </aside>

            {/* Editor */}
            <section className="min-w-0 flex items-start justify-center">
              <div className="w-full max-w-[800px] border border-slate-200 bg-[#eef2f3] shadow-sm">
                <div className="px-2 py-2">
                  <TinyMCEEditor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
                    value={editorContent}
                    onEditorChange={(value) => setEditorContent(value)}
                    onInit={(_, editor) => {
                      editorRef.current = editor
                    }}
                    onSelectionChange={(_, editor) => {
                      handleEditorSelectionChange(editor)
                    }}
                    onNodeChange={(_, editor) => {
                      handleEditorSelectionChange(editor)
                    }}
                    init={{
                      menubar: false,
                      branding: false,
                      statusbar: false,
                      height: 980,
                      resize: false,
                      promotion: false,
                      plugins: [
                        'advlist',
                        'autolink',
                        'lists',
                        'link',
                        'image',
                        'charmap',
                        'preview',
                        'anchor',
                        'searchreplace',
                        'visualblocks',
                        'code',
                        'fullscreen',
                        'insertdatetime',
                        'media',
                        'table',
                        'wordcount',
                      ],
                      toolbar:
                        'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | removeformat',
                      font_family_formats:
                        'Inter=Inter,sans-serif;Space Grotesk="Space Grotesk",sans-serif;Bricolage Grotesque="Bricolage Grotesque",sans-serif;Arial=arial,helvetica,sans-serif;Times New Roman="Times New Roman",times,serif',
                      content_style: `
                        body {
                          background: #fffefb;
                          color: #2c2f30;
                          font-family: Inter, sans-serif;
                          font-size: 15px;
                          line-height: 2;
                          max-width: 850px;
                          margin: 0 auto;
                          padding: 32px 40px;
                        }
                        p { margin: 0 0 1rem; }
                        h1, h2, h3, h4 {
                          font-family: "Space Grotesk", sans-serif;
                          color: #0f172a;
                        }
                      `,
                      skin: 'oxide',
                      content_css: 'default',
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Right side bar  */}
            <aside className="space-y-4 xl:sticky xl:top-[120px] xl:h-[calc(100svh-145px)] xl:self-start xl:overflow-y-auto xl:pr-2 assignment-sidebar-scroll">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">AI Assistant</p>
              {/* Section Intelligence */}
              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <Sparkles className="size-4 text-emerald-600" />
                  Section Intelligence
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {activeSection?.title || 'Current section'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {activeSection?.description}
                </p>

                {guidanceLoading ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <Loader2 className="size-4 animate-spin" />
                    Loading section guidance...
                  </div>
                ) : guidanceError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                    {guidanceError}
                  </div>
                ) : sectionGuidance ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key points</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {sectionGuidance.key_points.map((item) => (
                          <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggestions</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {sectionGuidance.suggestions.map((item) => (
                          <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Common mistakes</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {sectionGuidance.common_mistakes.map((item) => (
                          <li key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* AI Assist */}
              {/* <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <WandSparkles className="size-4 text-emerald-600" />
                  AI Assist
                </div>
                <div className="mt-4 grid gap-2">
                  {assistActions.map((action) => (
                    <Button key={action.id} variant="outline" className="justify-start text-left" onClick={() => handleAssistAction(action.id)}>
                      {action.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Assist tools only transform the selected text or active section. They do not generate an entire essay for the user.
                </p>
                {assistMessage ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                    {assistMessage}
                  </div>
                ) : null}
              </div> */}

              {/* Research Guidance */}
              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <LibraryBig className="size-4 text-emerald-600" />
                  Research Guidance
                </div>
                {guidanceLoading ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <Loader2 className="size-4 animate-spin" />
                    Loading research guidance...
                  </div>
                ) : guidanceError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                    {guidanceError}
                  </div>
                ) : researchGuidance ? (
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Angles</p>
                      <ul className="mt-2 space-y-2">
                        {researchGuidance.angles.map((topic) => (
                          <li key={topic} className="rounded-2xl bg-slate-50 px-3 py-2.5">{topic}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Keywords</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {researchGuidance.keywords.map((keyword) => (
                          <span key={keyword} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Example ideas</p>
                      <ul className="mt-2 space-y-2">
                        {researchGuidance.example_ideas.map((idea) => (
                          <li key={idea} className="rounded-2xl bg-slate-50 px-3 py-2.5">{idea}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>


              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <ReferenceGenerator
                  embedded
                  title="Reference Integration"
                  description="Generate Harvard-style references and attach them directly to this assignment."
                  references={assignment.references.map((reference) => reference.citation)}
                  onAddReference={(citation) => void handleAddReference(citation)}
                />
              </div>

              {/* Final Review Mode */}
              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Final Review Mode
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm leading-6 text-slate-500">
                    Run a structured review against the assignment rubric and generated outline.
                  </p>
                  <Button variant="outline" onClick={() => void handleRunReview()} disabled={reviewLoading}>
                    {reviewLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Run Review
                  </Button>
                </div>
                {reviewError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                    {reviewError}
                  </div>
                ) : null}
                {reviewResult ? (
                  <>
                    <div className="mt-4 space-y-2">
                      {Object.entries(reviewResult.scores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          <span>{key.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())}</span>
                          <span className="font-semibold text-slate-900">{value}/10</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Issues</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {reviewResult.issues.map((item) => (
                          <li key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggestions</p>
                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                        {reviewResult.suggestions.map((item) => (
                          <li key={item} className="rounded-2xl border border-slate-200 px-3 py-2.5">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No review has been run yet.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
