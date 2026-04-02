'use client'

import { useEffect, useRef, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Assignment } from '@/lib/assignments/types'
import { Copy, Download } from 'lucide-react'

const topMenus = ['File', 'Edit', 'Insert', 'Format', 'Help']

interface AssignmentHeaderProps {
  assignment: Assignment;
  documentText: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  handleCopyExport: () => void;
  handleDownload: () => void;
  onRenameTitle: (title: string) => Promise<void>;
}

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

function AssignmentHeader({ assignment, documentText, saveState, handleCopyExport, handleDownload, onRenameTitle,
}: AssignmentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(assignment.title)
  const [titleError, setTitleError] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditingTitle])

  const handleSubmitTitle = async () => {
    const nextTitle = draftTitle.trim()

    if (!nextTitle) {
      setTitleError('Title cannot be empty.')
      return
    }

    if (nextTitle === assignment.title) {
      setTitleError('')
      setIsEditingTitle(false)
      return
    }

    try {
      setTitleError('')
      await onRenameTitle(nextTitle)
      setIsEditingTitle(false)
    } catch (error) {
      setTitleError(
        error instanceof Error ? error.message : 'We could not rename this assignment right now.'
      )
    }
  }

  return (
    <section className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="flex flex-col gap-1 px-4 pt-3 pb-2 sm:px-6">

        {/* Top Row */}
        <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/80">
              Assignment Workspace
            </p>
            {isEditingTitle ? (
              <div className="w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false)
                    setDraftTitle(assignment.title)
                    setTitleError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleSubmitTitle()
                    }

                    if (event.key === 'Escape') {
                      setIsEditingTitle(false)
                      setDraftTitle(assignment.title)
                      setTitleError('')
                    }
                  }}
                  className="w-full rounded-lg border-2 border-emerald-500 bg-white px-2 py-0 text-xl font-semibold tracking-tight text-slate-900 outline-none"
                  style={{ lineHeight: '1.75rem' }} // Force matching height
                />
                {titleError && <p className="mt-1 text-xs text-rose-600">{titleError}</p>}
              </div>
            ) : (
              <h1
                className="w-full border-2 border-transparent px-2 text-xl font-semibold tracking-tight text-slate-900 cursor-text truncate"
                style={{ lineHeight: '1.75rem' }}
                onDoubleClick={() => {
                  setDraftTitle(assignment.title)
                  setIsEditingTitle(true)
                }}
              >
                {assignment.title}
              </h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-medium font-bold uppercase tracking-wider text-slate-400">Deadline</span>
              <span className="font-medium text-slate-700">{formatDate(assignment.deadline)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium font-bold uppercase tracking-wider text-slate-400">Word Target</span>
              <span className="font-medium text-slate-700">{assignment.wordCountTarget}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium font-bold uppercase tracking-wider text-slate-400">Current</span>
              <span className="font-medium text-emerald-600">{countWords(documentText)} words</span>
            </div>
          </div>
        </div>

        {/* Dropdown Menu Row */}
        <div className="flex flex-wrap items-center gap-0.5 pb-1">
          {topMenus.map((menu) => (
            <DropdownMenu key={menu}>
              <DropdownMenuTrigger className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                {menu}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>{menu} action 1</DropdownMenuItem>
                <DropdownMenuItem>{menu} action 2</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-slate-400 italic">
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'All changes saved' : 'Autosave ready'}
            </span>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyExport} className="h-8 gap-2 rounded-full border-slate-200 px-4 text-xs font-semibold hover:bg-slate-50">
                <Copy className="size-3.5" />
                Copy
              </Button>
              <Button size="sm" onClick={handleDownload} className="h-8 gap-2 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm">
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AssignmentHeader
