'use client'

import React, { useState } from 'react'
import { ChevronDownIcon, FileUp, Loader2, Sparkles, X } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { AssignmentUpload } from '@/lib/assignments/types'

type CreateAssignmentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: {
    title: string
    upload: AssignmentUpload
    wordCountTarget: number
    deadline: string
  }) => Promise<void>
}

const MAX_FIRESTORE_UPLOAD_SIZE_BYTES = 700 * 1024

const readFileAsBase64 = (file: File) =>
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

export function CreateAssignmentModal({ open, onClose, onSubmit }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState({ title: '', wordCountTarget: 1500, deadline: '', })
  const [upload, setUpload] = useState<AssignmentUpload | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedDeadline = formData.deadline ? new Date(`${formData.deadline}T12:00:00`) : undefined

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!upload) {
      setError('Upload the assignment file so we can create the workspace.')
      return
    }

    if (!formData.deadline) {
      setError('Choose a deadline so the dashboard can track urgency.')
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        title: formData.title,
        upload,
        wordCountTarget: Number(formData.wordCountTarget) || 1500,
        deadline: formData.deadline,
      })

      setFormData({
        title: '',
        wordCountTarget: 1500,
        deadline: '',
      })
      setUpload(null)
    } catch (submitError) {
      console.error(submitError)
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Error in creating assignment. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,#fffdf6_0%,#ffffff_35%,#f6f7fb_100%)] p-6 shadow-[0_35px_120px_rgba(15,23,42,0.25)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              <Sparkles className="size-3.5" />
              Assignment Setup
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Create a writing workspace
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload the assignment, set the target, and the app will generate the structure, checklist, and seeded guidance for the first draft.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close create assignment dialog">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Assignment title
              <input
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Optional: Strategic Management Essay"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="space-y-2 text-sm font-medium text-slate-700">
            <span>Upload Assignment</span>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-5 py-4 transition hover:border-emerald-400 hover:bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <FileUp className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {upload?.fileName || 'Choose an assignment file'}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Browse
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0]

                  if (!file) {
                    setUpload(null)
                    return
                  }

                  setError('')

                  if (file.size > MAX_FIRESTORE_UPLOAD_SIZE_BYTES) {
                    setUpload(null)
                    setError('This file is too large for the current Firestore base64 setup. Please upload a file under 700 KB.')
                    return
                  }

                  try {
                    const base64 = await readFileAsBase64(file)
                    setUpload({
                      fileName: file.name,
                      mimeType: file.type || 'application/octet-stream',
                      size: file.size,
                      base64,
                    })
                  } catch (uploadError) {
                    console.error(uploadError)
                    setError('We could not read that file. Please try another one.')
                  }
                }}
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Word count
              <input
                type="number"
                min={250}
                step={50}
                value={formData.wordCountTarget}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    wordCountTarget: Number(event.target.value),
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              />
            </label>

            <div className="space-y-2 text-sm font-medium text-slate-700">
              <label htmlFor="deadline">Deadline</label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    deadline: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              V1 uses seeded intelligence so we can validate the workflow before plugging in a live AI backend.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Generate Workspace
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
