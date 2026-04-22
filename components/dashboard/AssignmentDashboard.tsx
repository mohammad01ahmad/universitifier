'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarClock, FilePenLine, FolderOpen, Target, } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateAssignmentModal } from '@/components/assignments/CreateAssignmentModal'
import { createAssignment, fetchAssignmentsForUser } from '@/lib/assignments/firestore'
import type { Assignment, AssignmentUpload, ParsedAssignmentSeed } from '@/lib/assignments/types'
import { useAuth } from '@/lib/authContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const daysUntil = (value: string) =>
  Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

export function AssignmentDashboard() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const { user, loading } = useAuth();

  // Redirect to signin if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, router, user])

  // Load assignments for the user
  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) return

      setDashboardLoading(true)
      setError('')

      try {
        const nextAssignments = await fetchAssignmentsForUser(user.uid)
        setAssignments(nextAssignments)
      } catch (loadError) {
        console.error(loadError)
        setError('We could not load your assignments right now.')
      } finally {
        setDashboardLoading(false)
      }
    }
    void loadAssignments()
  }, [user?.uid])

  // Calculate stats for the dashboard. 
  // TO DO: Good for now, but if there are >50 assignments, then fetch from db directly
  const stats = useMemo(() => {
    const active = assignments.length
    const dueSoon = assignments.filter((assignment) => daysUntil(assignment.deadline) <= 3).length
    const averageProgress =
      assignments.length > 0
        ? Math.round(
          assignments.reduce((total, assignment) => total + assignment.progressPercent, 0) /
          assignments.length
        )
        : 0

    return { active, dueSoon, averageProgress }
  }, [assignments])

  // Handle creating a new assignment
  const handleCreate = async (values: {
    title: string
    uploads: AssignmentUpload[]
    upload: AssignmentUpload
    parsed: ParsedAssignmentSeed
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
          Loading your assignment workspace...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 pb-16 pt-28 text-slate-950 sm:px-6 lg:px-8">

      {/* TopNavBar, Selected nav menu highlighted */}
      <DashboardHeader />

      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,#fef3c7_0%,#fffdf5_32%,#e9f7ef_100%)] p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Good Morning, {user?.displayName?.split(' ')[1]}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Track deadlines, break down briefs, write in a focused workspace, and keep references and review checks alongside the draft.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
                  <FilePenLine className="size-4" />
                  New Assignment
                </Button>
                <Link href={assignments[0] ? `/profile/assignments/${assignments[0].id}` : '#'} className={!assignments[0] ? 'pointer-events-none opacity-50' : ''}>
                  <Button variant="outline">
                    <FolderOpen className="size-4" />
                    Open Latest Workspace
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  label: 'Active assignments',
                  value: stats.active,
                  icon: FolderOpen,
                },
                {
                  label: 'Due in 3 days',
                  value: stats.dueSoon,
                  icon: CalendarClock,
                },
                {
                  label: 'Average progress',
                  value: `${stats.averageProgress}%`,
                  icon: Target,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">{item.label}</span>
                    <item.icon className="size-4 text-emerald-600" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.45fr_0.75fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Active assignments</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Every draft keeps the upload, progress, structure, and references in one workspace.
                </p>
              </div>
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                New
              </Button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {dashboardLoading ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)] p-8 text-center">
                <p className="text-lg font-semibold text-slate-900">Your first assignment workspace is one click away.</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create an assignment to generate the structure, checklist, progress tracker, and writing canvas.
                </p>
                <Button className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
                  Create Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
                          <h3 className="truncate text-xl font-semibold text-slate-950">
                            {assignment.title}
                          </h3>
                          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span>Deadline: {formatDate(assignment.deadline)}</span>
                            <span>{assignment.wordCountTarget} words</span>
                            <span>{assignment.references.length} references</span>
                            <span>{assignment.upload.fileName}</span>
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
                            Open workspace
                            <ArrowRight className="size-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <CreateAssignmentModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />
    </main>
  )
}
