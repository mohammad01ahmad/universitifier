'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarClock, FilePenLine, FolderOpen } from 'lucide-react'

import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal'
import { Button } from '@/components/ui/button'
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser'
import { createAssignment, fetchAssignmentsForUser } from '@/lib/assignments/firestore'
import type { Assignment, AssignmentAnalysis, AssignmentUpload, ParsedAssignmentSeed } from '@/lib/assignments/types'
import { DashboardHeader } from '../dashboard/DashboardHeader'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const daysUntil = (value: string) =>
  Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

export function AssignmentsIndex() {
  const router = useRouter()
  const { user, loading } = useAuthenticatedUser()

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, router, user])

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) return

      setLoadingAssignments(true)
      setError('')

      try {
        const nextAssignments = await fetchAssignmentsForUser(user.uid)
        setAssignments(nextAssignments)
      } catch (loadError) {
        console.error(loadError)
        setError('We could not load your assignments right now.')
      } finally {
        setLoadingAssignments(false)
      }
    }

    void loadAssignments()
  }, [user])

  const handleCreate = async (values: {
    title: string
    uploads: AssignmentUpload[]
    upload: AssignmentUpload
    parsed: ParsedAssignmentSeed
    analysis: AssignmentAnalysis
    wordCountTarget: number
    deadline: string
  }) => {
    if (!user) return

    const assignmentId = await createAssignment({
      userId: user.uid,
      title: values.title,
      upload: values.upload,
      parsed: values.parsed,
      wordCountTarget: values.wordCountTarget,
      deadline: values.deadline,
    })

    setCreateOpen(false)
    router.push(`/profile/assignments/${assignmentId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef] pt-24">
        <div className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
          Loading your assignments...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 pb-16 pt-28 text-slate-950 sm:px-6 lg:px-8">
      <DashboardHeader />

      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col gap-5 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Assignments</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              All assignment workspaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Open any assignment directly from here, or create a new workspace when a fresh brief comes in.
            </p>
          </div>

          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
            <FilePenLine className="size-4" />
            New Assignment
          </Button>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loadingAssignments ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)] p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">No assignments yet.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create an assignment to generate a workspace, checklist, progress tracker, and writing canvas.
            </p>
            <Button className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
              Create Assignment
            </Button>
          </div>
        ) : (
          <section className="space-y-4">
            {assignments.map((assignment) => {
              const urgency = daysUntil(assignment.deadline)
              const urgencyLabel =
                urgency < 0
                  ? 'Past due'
                  : urgency === 0
                    ? 'Due today'
                    : urgency === 1
                      ? 'Due tomorrow'
                      : `${urgency} days left`

              return (
                <Link
                  key={assignment.id}
                  href={`/profile/assignments/${assignment.id}`}
                  className="block rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {assignment.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${urgency <= 3
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          {urgencyLabel}
                        </span>
                      </div>
                      <h2 className="truncate text-xl font-semibold text-slate-950">{assignment.title}</h2>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="size-4" />
                          {formatDate(assignment.deadline)}
                        </span>
                        <span>{assignment.wordCountTarget} words</span>
                        <span>{assignment.references.length} references</span>
                        <span className="inline-flex items-center gap-1.5">
                          <FolderOpen className="size-4" />
                          {assignment.upload.fileName}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-44 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-900">{assignment.progressPercent}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${assignment.progressPercent}%` }}
                        />
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                        Open assignment
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </div>

      <CreateAssignmentModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
    </main>
  )
}
