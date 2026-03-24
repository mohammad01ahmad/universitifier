'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, AlignCenter, AlignLeft, AlignRight, Bold, CheckCircle2, ClipboardCheck, Copy, Download, FileSearch, GraduationCap, Italic, LibraryBig, Link2, List, ListOrdered, Loader2, Pilcrow, Sparkles, Strikethrough, Underline, WandSparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ReferenceGenerator } from '@/components/ReferenceGenerator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, } from '@/components/ui/sidebar'
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser'
import { applyAssistAction, computeSectionAnchors, extractSectionText, generateSectionGuidance, getActiveSectionId, } from '@/lib/assignments/intelligence'
import { fetchAssignmentById, recomputeAssignmentState, updateAssignment, } from '@/lib/assignments/firestore'
import type { Assignment, AssignmentReference, AssistAction } from '@/lib/assignments/types'
import AssignmentHeader from './AssignmentHeader'

const assistActions: { id: AssistAction; label: string }[] = [
  { id: 'academic-tone', label: 'Improve Academic Tone' },
  { id: 'expand-idea', label: 'Expand This Idea' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'critical-depth', label: 'Make More Critical' },
  { id: 'add-example', label: 'Add Example' },
  { id: 'continue-writing', label: 'Continue Writing' },
]

const topMenus = ['File', 'Edit', 'Insert', 'Format', 'Help']

const formattingActions = [
  { icon: Bold, label: 'Bold' },
  { icon: Italic, label: 'Italic' },
  { icon: Underline, label: 'Underline' },
  { icon: Strikethrough, label: 'Strikethrough' },
  { icon: Pilcrow, label: 'Paragraph' },
  { icon: List, label: 'Bullet list' },
  { icon: ListOrdered, label: 'Numbered list' },
  { icon: AlignLeft, label: 'Align left' },
  { icon: AlignCenter, label: 'Align center' },
  { icon: AlignRight, label: 'Align right' },
  { icon: Link2, label: 'Insert link' },
]

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [documentText, setDocumentText] = useState('')
  const [loadingAssignment, setLoadingAssignment] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [activeSectionId, setActiveSectionId] = useState('')
  const [assistMessage, setAssistMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
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
        setDocumentText(nextAssignment.document)
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

  const activeSection = liveAssignment?.outline.find((section) => section.id === activeSectionId) ?? liveAssignment?.outline[0]
  const activeSectionText =
    liveAssignment && activeSection
      ? extractSectionText(liveAssignment.document, liveAssignment.sectionAnchors, activeSection.id)
      : ''
  const sectionGuidance =
    liveAssignment && activeSection
      ? generateSectionGuidance(
        activeSection,
        liveAssignment.analysisText || [liveAssignment.title, liveAssignment.upload.fileName].filter(Boolean).join(' '),
        activeSectionText
      )
      : null

  useEffect(() => {
    if (!assignment || documentText === assignment.document) return

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
          document: documentText,
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
              document: documentText,
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
  }, [assignment, documentText])

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
      document: documentText,
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
      document: documentText,
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

  const handleSelectionChange = () => {
    if (!liveAssignment || !textareaRef.current) return
    const cursor = textareaRef.current.selectionStart
    setActiveSectionId((current) =>
      getActiveSectionId(cursor, liveAssignment.sectionAnchors, current)
    )
  }

  const handleAssistAction = (action: AssistAction) => {
    if (!liveAssignment || !textareaRef.current || !activeSection) return

    const textarea = textareaRef.current
    const result = applyAssistAction({
      action,
      document: documentText,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
      activeSectionText,
    })

    setDocumentText(result.document)
    setAssistMessage(result.message)
  }

  const jumpToSection = (sectionId: string) => {
    if (!liveAssignment || !textareaRef.current) return
    const anchor = liveAssignment.sectionAnchors.find((item) => item.sectionId === sectionId)
    if (!anchor) return

    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(anchor.start, anchor.start)
    setActiveSectionId(sectionId)
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

  const handleCopyExport = async () => {
    await navigator.clipboard.writeText(documentText)
    setAssistMessage('Draft copied to your clipboard.')
  }

  const handleDownload = () => {
    const blob = new Blob([documentText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(assignment?.title || 'assignment-draft').replace(/\s+/g, '-').toLowerCase()}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setAssistMessage('Draft downloaded as a text file.')
  }

  if (loading || loadingAssignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
        <div className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          Loading assignment workspace...
        </div>
      </div>
    )
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
      />


      <SidebarProvider
        style={
          {
            '--sidebar-width': '21rem',
          } as React.CSSProperties
        }
      >
        <Sidebar variant="inset" collapsible="offcanvas" className="top-[172px] h-[calc(100svh-172px)]">
          <SidebarContent className="gap-2 px-2 pb-4 pt-4">
            <SidebarGroup>
              <SidebarGroupLabel>Outline</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {assignment.outline.map((section) => (
                    <SidebarMenuItem key={section.id}>
                      <SidebarMenuButton
                        isActive={activeSectionId === section.id}
                        onClick={() => jumpToSection(section.id)}
                        tooltip={section.title}
                      >
                        <span>{section.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Upload</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <FileSearch className="size-3.5 text-emerald-600" />
                    Assignment File
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">{assignment.upload.fileName}</p>
                    <p className="text-xs text-slate-500">{assignment.upload.mimeType}</p>
                    <p className="text-xs text-slate-500">
                      {(assignment.upload.size / 1024).toFixed(1)} KB stored in Firebase
                    </p>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Progress</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
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
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Requirements</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
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
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-[calc(100svh-172px)] bg-[#f7f5ef] md:m-0 md:rounded-none md:shadow-none">
          <main className="pb-12 text-slate-950">
            <div className="px-3 pt-4 sm:px-4 lg:px-5">
              <div className="mb-4 flex items-center">
                <SidebarTrigger className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" />
              </div>

              <div className="flex justify-center">
                <section className="w-full max-w-5xl rounded-[1.8rem] border border-slate-200 bg-[#eef2f3] p-4 shadow-sm">
                  <div className="rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Document Canvas
                        </p>
                        <h2 className="mt-1 text-xl font-semibold">Focused draft editor</h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignment.outline.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => jumpToSection(section.id)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${activeSectionId === section.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300'
                              }`}
                          >
                            {section.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-6">
                      <textarea
                        ref={textareaRef}
                        value={documentText}
                        onChange={(event) => {
                          setDocumentText(event.target.value)
                          const anchors = computeSectionAnchors(event.target.value, assignment.outline)
                          setActiveSectionId((current) =>
                            getActiveSectionId(event.target.selectionStart, anchors, current)
                          )
                        }}
                        onClick={handleSelectionChange}
                        onKeyUp={handleSelectionChange}
                        onSelect={handleSelectionChange}
                        spellCheck
                        className="min-h-[980px] w-full resize-none rounded-[1.4rem] border border-slate-200 bg-[#fffefb] px-8 py-8 text-[15px] leading-8 text-slate-800 shadow-inner outline-none transition focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </SidebarInset>

        <Sidebar
          side="right"
          variant="inset"
          collapsible="none"
          className="top-[172px] hidden h-[calc(100svh-172px)] border-l border-slate-200 bg-[#f7f5ef] xl:flex"
          style={
            {
              '--sidebar-width': '23rem',
            } as React.CSSProperties
          }
        >
          <SidebarContent className="gap-4 px-4 py-4">
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

              {sectionGuidance ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggested arguments</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                      {sectionGuidance.suggestedArguments.map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2.5">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Common mistakes</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                      {sectionGuidance.commonMistakes.map((item) => (
                        <li key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
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
            </div>

            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <LibraryBig className="size-4 text-emerald-600" />
                Research Guidance
              </div>
              {sectionGuidance ? (
                <div className="mt-4 space-y-4 text-sm text-slate-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Topics to search</p>
                    <ul className="mt-2 space-y-2">
                      {sectionGuidance.researchTopics.map((topic) => (
                        <li key={topic} className="rounded-2xl bg-slate-50 px-3 py-2.5">{topic}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Keywords</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sectionGuidance.keywords.map((keyword) => (
                        <span key={keyword} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                          {keyword}
                        </span>
                      ))}
                    </div>
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

            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Final Review Mode
              </div>
              <div className="mt-4 flex items-center gap-2">
                {liveAssignment.review.status === 'needs_attention' ? (
                  <AlertCircle className="size-5 text-amber-500" />
                ) : liveAssignment.review.status === 'on_track' ? (
                  <Loader2 className="size-5 text-sky-500" />
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
                <p className="text-sm font-semibold text-slate-900">
                  {liveAssignment.review.status === 'needs_attention'
                    ? 'Needs attention'
                    : liveAssignment.review.status === 'on_track'
                      ? 'On track'
                      : 'Nearly ready'}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {Object.entries(liveAssignment.review.checks).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span>
                    <span className={value ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                      {value ? 'Pass' : 'Review'}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {liveAssignment.review.highlights.map((item) => (
                  <li key={item} className="rounded-2xl border border-slate-200 px-3 py-2.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </>
  )
}
