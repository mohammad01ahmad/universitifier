'use client'

import React, { useState } from 'react'
import { FileUp, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { analyzeAssignmentWithGemini, generateStructureWithGemini, parseAssignmentWithGemini } from '@/lib/assignments/parser'
import type { AssignmentAnalysis, AssignmentUpload, ParsedAssignmentSeed } from '@/lib/assignments/types'
import { readFileAsBase64 } from '@/lib/assignments/parser'
import { buildAggregatedParsedSeed, ParsedUpload } from '@/lib/assignments/parser'

type CreateAssignmentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: {
    title: string
    uploads: AssignmentUpload[]
    upload: AssignmentUpload
    parsed: ParsedAssignmentSeed
    analysis: AssignmentAnalysis
    wordCountTarget: number
    deadline: string
  }) => Promise<void>
}

const MAX_FIRESTORE_UPLOAD_SIZE_BYTES = 700 * 1024
const MAX_UPLOAD_COUNT = 5

export function CreateAssignmentModal({ open, onClose, onSubmit }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    wordCountTarget: 1500,
    deadline: '',
  })
  const [uploads, setUploads] = useState<ParsedUpload[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isParsing = uploads.some((item) => item.status === 'parsing')
  const hasParseErrors = uploads.some((item) => item.status === 'error')
  const parsedUploads = uploads.filter((item) => item.status === 'parsed' && item.parsed)
  const isReadyToGenerate =
    uploads.length > 0 &&
    !isParsing &&
    !hasParseErrors &&
    parsedUploads.length === uploads.length

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (uploads.length === 0) {
      setError('Upload at least one assignment document so we can create the workspace.')
      return
    }

    if (!isReadyToGenerate) {
      setError('Wait for all uploaded documents to finish parsing before generating the workspace.')
      return
    }

    if (!formData.deadline) {
      setError('Choose a deadline so the dashboard can track urgency.')
      return
    }

    if (!Number.isFinite(formData.wordCountTarget) || formData.wordCountTarget <= 0) {
      setError('Enter a valid word count before generating the workspace.')
      return
    }

    setSubmitting(true)

    try {
      const readyUploads = parsedUploads.map((item) => item.upload)
      const analysis = await analyzeAssignmentWithGemini({
        title: formData.title,
        uploads: readyUploads,
      })

      const structure = await generateStructureWithGemini({
        analysis,
        wordCount: formData.wordCountTarget,
      })

      const parsed = buildAggregatedParsedSeed({
        title: formData.title,
        analysis,
        structure,
        parsedUploads,
      })

      await onSubmit({
        title: formData.title,
        uploads: readyUploads,
        upload: readyUploads[0],
        parsed,
        analysis,
        wordCountTarget: Number(formData.wordCountTarget) || 1500,
        deadline: formData.deadline,
      })

      setFormData({
        title: '',
        wordCountTarget: 1500,
        deadline: '',
      })
      setUploads([])
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
              Upload up to five assignment documents. Parsing starts immediately, and the workspace can only be generated once every file is ready.
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
                    {uploads.length > 0
                      ? `${uploads.length} document${uploads.length > 1 ? 's' : ''} uploaded`
                      : 'Upload assignment, rubric, or any relevant documents'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Up to 5 files. Parsing starts immediately after upload.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Browse
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="sr-only"
                onChange={async (event) => {
                  const selectedFiles = Array.from(event.target.files ?? [])
                  event.target.value = ''

                  if (selectedFiles.length === 0) return

                  setError('')

                  if (uploads.length + selectedFiles.length > MAX_UPLOAD_COUNT) {
                    setError(`You can upload a maximum of ${MAX_UPLOAD_COUNT} files.`)
                    return
                  }

                  try {
                    const nextUploads = await Promise.all(
                      selectedFiles.map(async (file) => {
                        if (file.size > MAX_FIRESTORE_UPLOAD_SIZE_BYTES) {
                          throw new Error(`"${file.name}" is too large. Please upload files under 700 KB.`)
                        }

                        const base64 = await readFileAsBase64(file)
                        return {
                          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                          upload: {
                            fileName: file.name,
                            mimeType: file.type || 'application/octet-stream',
                            size: file.size,
                            base64,
                          },
                          status: 'parsing' as const,
                        }
                      })
                    )

                    setUploads((current) => [...current, ...nextUploads])

                    await Promise.all(
                      nextUploads.map(async (item) => {
                        try {
                          const parsed = await parseAssignmentWithGemini({
                            title: formData.title || item.upload.fileName.replace(/\.[^.]+$/, ''),
                            upload: item.upload,
                            wordCountTarget: Number(formData.wordCountTarget) || 1500,
                          })

                          setUploads((current) =>
                            current.map((currentItem) =>
                              currentItem.id === item.id
                                ? { ...currentItem, status: 'parsed', parsed, error: undefined }
                                : currentItem
                            )
                          )
                        } catch (parseError) {
                          console.error(parseError)
                          setUploads((current) =>
                            current.map((currentItem) =>
                              currentItem.id === item.id
                                ? {
                                  ...currentItem,
                                  status: 'error',
                                  error:
                                    parseError instanceof Error
                                      ? parseError.message
                                      : 'We could not parse this document.',
                                }
                                : currentItem
                            )
                          )
                        }
                      })
                    )
                  } catch (uploadError) {
                    console.error(uploadError)
                    setError(
                      uploadError instanceof Error
                        ? uploadError.message
                        : 'We could not read those files. Please try again.'
                    )
                  }
                }}
              />
            </label>

            {uploads.length > 0 ? (
              <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                {uploads.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.upload.fileName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {(item.upload.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${item.status === 'parsed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'error'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                          {item.status === 'parsed' ? 'Parsed' : item.status === 'error' ? 'Error' : 'Parsing'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUploads((current) => current.filter((currentItem) => currentItem.id !== item.id))
                          }}
                          aria-label={`Remove ${item.upload.fileName}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {item.error ? (
                      <p className="mt-2 text-xs text-rose-600">{item.error}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {isParsing ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Loader2 className="size-4 animate-spin" />
                Parsing uploaded documents. Generate Workspace will unlock once all files are ready.
              </div>
            ) : null}
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
                    wordCountTarget: Number(event.target.value) || 0,
                  }))
                }
                required
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

          <div className="flex gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !isReadyToGenerate}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitting ? 'Generating Workspace...' : isParsing ? 'Parsing Documents...' : 'Generate Workspace'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
