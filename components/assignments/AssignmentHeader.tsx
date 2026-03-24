import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Assignment } from '@/lib/assignments/types'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Copy, Download, Italic,
  Link2, List, ListOrdered, Strikethrough, Underline,
  Undo2, Redo2, Printer, Type, Highlighter, ChevronDown,
  Search, Baseline, Image as ImageIcon
} from 'lucide-react'

const topMenus = ['File', 'Edit', 'Insert', 'Format', 'Help']

interface AssignmentHeaderProps {
  assignment: Assignment;
  documentText: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  handleCopyExport: () => void;
  handleDownload: () => void;
}

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

function AssignmentHeader({ assignment, documentText, saveState, handleCopyExport, handleDownload }: AssignmentHeaderProps) {
  return (
    <section className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="flex flex-col gap-1 px-4 pt-3 pb-2 sm:px-6">

        {/* Top Row */}
        <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/80">
              Assignment Workspace
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">{assignment.title}</h1>
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
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-0.5 rounded-full border border-slate-200 bg-[#f8fafc] p-1 shadow-sm">
            {/* History Group */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><Undo2 className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><Redo2 className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><Printer className="size-4" /></Button>

            <div className="mx-1 h-4 w-[1px] bg-slate-300" /> {/* Separator */}

            {/* Text Style Group */}
            <Button variant="ghost" className="h-8 gap-1 px-2 text-xs font-medium text-slate-700 rounded-full">
              Normal text <ChevronDown className="size-3" />
            </Button>

            <div className="mx-1 h-4 w-[1px] bg-slate-300" />

            {/* Font Control */}
            <Button variant="ghost" className="h-8 gap-1 px-2 text-xs font-medium text-slate-700 rounded-full">
              Inter <ChevronDown className="size-3" />
            </Button>

            <div className="mx-1 h-4 w-[1px] bg-slate-300" />

            {/* Main Formatting */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full font-bold text-slate-700"><Bold className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full italic text-slate-700"><Italic className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-700"><Underline className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-700"><Baseline className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-700"><Highlighter className="size-4" /></Button>

            <div className="mx-1 h-4 w-[1px] bg-slate-300" />

            {/* Tools Group */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><Link2 className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><ImageIcon className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><AlignLeft className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600"><List className="size-4" /></Button>
          </div>

          {/* Action Buttons */}
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
    </section>
  )
}

export default AssignmentHeader