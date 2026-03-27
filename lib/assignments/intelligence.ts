import {
  type Assignment,
  type AssignmentBreakdown,
  type AssignmentChecklistItem,
  type AssignmentSection,
  type AssistAction,
  type ParsedAssignmentSeed,
  type ReviewResult,
  type SectionAnchor,
} from '@/lib/assignments/types'

const sentenceSplitRegex = /(?<=[.!?])\s+/g

const actionPatterns: Record<string, string> = {
  discuss: 'Discuss',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  compare: 'Compare',
  explain: 'Explain',
  examine: 'Examine',
  justify: 'Justify',
  reflect: 'Reflect on',
}

const hiddenExpectationLibrary = [
  {
    keywords: ['analy', 'evaluate', 'crit'],
    value: 'Move beyond description and show critical evaluation.',
  },
  {
    keywords: ['compare', 'contrast'],
    value: 'Weigh alternative viewpoints instead of presenting one side only.',
  },
  {
    keywords: ['reference', 'citation', 'source'],
    value: 'Support claims with credible academic sources and accurate referencing.',
  },
  {
    keywords: ['case', 'example', 'apply'],
    value: 'Ground arguments in examples rather than staying abstract.',
  },
]

const sanitizeSeed = (seed: string) =>
  seed
    .replace(/\s+/g, ' ')
    .replace(/[•\-]\s+/g, '')
    .trim()

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const getSentences = (seed: string) =>
  sanitizeSeed(seed)
    .split(sentenceSplitRegex)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

const extractDeliverable = (seed: string) => {
  const lower = seed.toLowerCase()

  if (lower.includes('presentation')) return 'Presentation'
  if (lower.includes('report')) return 'Report'
  if (lower.includes('case study')) return 'Case study'
  if (lower.includes('reflection')) return 'Reflective essay'
  return 'Essay'
}

export const deriveAssignmentTitle = (seed: string) => {
  const cleaned = sanitizeSeed(seed)
  if (!cleaned) return 'Untitled assignment'

  const firstSentence = getSentences(cleaned)[0] ?? cleaned
  const words = firstSentence.split(' ').slice(0, 8).join(' ')
  return words.length > 72 ? `${words.slice(0, 69)}...` : words
}

export const generateBreakdown = (seed: string): AssignmentBreakdown => {
  const lowerBrief = seed.toLowerCase()
  const sentences = getSentences(seed)

  const requirements = sentences
    .flatMap((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      const matchedAction = Object.entries(actionPatterns).find(([pattern]) =>
        lowerSentence.includes(pattern)
      )

      if (matchedAction) {
        const [, label] = matchedAction
        const cleanedSentence = sentence.replace(/\.$/, '')
        return `${label} ${cleanedSentence.charAt(0).toLowerCase()}${cleanedSentence.slice(1)}`
      }

      if (sentence.length > 25) {
        return sentence.replace(/\.$/, '')
      }

      return []
    })
    .slice(0, 5)

  const hiddenExpectations = hiddenExpectationLibrary
    .filter(({ keywords }) => keywords.some((keyword) => lowerBrief.includes(keyword)))
    .map(({ value }) => value)

  if (hiddenExpectations.length === 0) {
    hiddenExpectations.push(
      'Present a clear argument, not just a summary of facts.',
      'Keep the structure purposeful so each section earns its place.'
    )
  }

  if (!lowerBrief.includes('reference') && !lowerBrief.includes('citation')) {
    hiddenExpectations.push('Use evidence and references to make the argument feel credible.')
  }

  return {
    requirements:
      requirements.length > 0
        ? requirements
        : [
            'Address the core question directly.',
            'Use evidence to support each main point.',
            'Finish with a concise conclusion that answers the assignment task.',
          ],
    deliverable: extractDeliverable(seed),
    hiddenExpectations: hiddenExpectations.slice(0, 4),
  }
}

const deriveTopics = (seed: string) => {
  const cleaned = sanitizeSeed(seed)
  const phraseCandidates = cleaned
    .split(/[,;:.]/)
    .map((part) => part.trim())
    .filter((part) => part.split(' ').length >= 3)

  const keywordCandidates = cleaned.match(/\b[A-Za-z][A-Za-z-]{3,}\b/g) ?? []
  const unique = new Set<string>()

  for (const phrase of phraseCandidates) {
    unique.add(toTitleCase(phrase.split(' ').slice(0, 5).join(' ')))
    if (unique.size >= 2) break
  }

  for (const word of keywordCandidates) {
    if (unique.size >= 4) break
    const lower = word.toLowerCase()
    if (['assignment', 'student', 'university', 'words', 'essay', 'report'].includes(lower)) {
      continue
    }
    unique.add(toTitleCase(word))
  }

  return Array.from(unique).slice(0, 4)
}

export const generateOutline = (seed: string, wordCountTarget: number): AssignmentSection[] => {
  const topics = deriveTopics(seed)
  const introWords = Math.max(120, Math.round(wordCountTarget * 0.15))
  const conclusionWords = Math.max(120, Math.round(wordCountTarget * 0.15))
  const bodyWords = Math.max(180, Math.round((wordCountTarget - introWords - conclusionWords) / 3))

  const titles = [
    'Introduction',
    topics[0] ? `${topics[0]} Overview` : 'Key Context',
    topics[1] ? `${topics[1]} Analysis` : 'Main Analysis',
    topics[2] ? `${topics[2]} Evaluation` : 'Critical Discussion',
    'Conclusion',
  ]

  const descriptions = [
    'Set the context, define the focus, and state the main thesis.',
    'Establish the first major argument and support it with evidence.',
    'Develop the second major argument and show how it links to the assignment task.',
    'Compare perspectives, limitations, or implications to deepen analysis.',
    'Synthesize the key points and answer the task with confidence.',
  ]

  const targets = [introWords, bodyWords, bodyWords, bodyWords, conclusionWords]

  return titles.map((title, index) => ({
    id: `section-${index + 1}`,
    title,
    description: descriptions[index],
    targetWords: targets[index],
  }))
}

export const generateInitialChecklist = (): AssignmentChecklistItem[] => [
  { id: 'check-intro', label: 'Introduction drafted', completed: false },
  { id: 'check-body-1', label: 'First argument developed', completed: false },
  { id: 'check-body-2', label: 'Critical analysis added', completed: false },
  { id: 'check-refs', label: 'References added', completed: false },
  { id: 'check-review', label: 'Final review complete', completed: false },
]

export const buildDocumentFromOutline = (outline: AssignmentSection[]) =>
  outline
    .map(
      (section) =>
        `${section.title}\n[Target: ${section.targetWords} words]\n\n${section.description}\n\n`
    )
    .join('\n')
    .trim()

export const computeSectionAnchors = (
  document: string,
  outline: AssignmentSection[]
): SectionAnchor[] => {
  return outline.map((section, index) => {
    const start = document.indexOf(section.title)
    const nextSection = outline[index + 1]
    const nextStart = nextSection ? document.indexOf(nextSection.title) : document.length

    return {
      sectionId: section.id,
      title: section.title,
      start: Math.max(start, 0),
      end: nextStart > -1 ? nextStart : document.length,
    }
  })
}

export const getActiveSectionId = (
  cursorPosition: number,
  anchors: SectionAnchor[],
  fallbackSectionId?: string
) => {
  const activeAnchor = anchors.find(
    (anchor) => cursorPosition >= anchor.start && cursorPosition < anchor.end
  )

  return activeAnchor?.sectionId ?? fallbackSectionId ?? anchors[0]?.sectionId ?? ''
}

export const extractSectionText = (
  document: string,
  anchors: SectionAnchor[],
  sectionId: string
) => {
  const anchor = anchors.find((item) => item.sectionId === sectionId)
  if (!anchor) return ''

  return document.slice(anchor.start, anchor.end).trim()
}

const getGuidanceSeed = (section: AssignmentSection, seed: string) => {
  const topics = deriveTopics(seed)
  const primaryTopic = topics[0] ?? 'the core topic'
  const secondaryTopic = topics[1] ?? 'the supporting perspective'

  return {
    suggestedArguments: [
      `Connect ${section.title.toLowerCase()} directly back to the assignment task.`,
      `Use evidence to support each claim about ${primaryTopic.toLowerCase()}.`,
      `Show why the point matters instead of leaving it descriptive.`,
    ],
    keyPoints: [
      `Define the main idea behind ${section.title.toLowerCase()}.`,
      `Link the discussion to ${secondaryTopic.toLowerCase()} where it strengthens the argument.`,
      'Keep each paragraph tied to one clear claim.',
    ],
    commonMistakes: [
      'Listing facts without explaining why they matter.',
      'Repeating the task wording instead of advancing the argument.',
      'Ending the section without a mini-conclusion or transition.',
    ],
    exampleStructure: [
      'Claim',
      'Evidence or reference',
      'Analysis',
      'Link back to the assignment question',
    ],
    keywords: [section.title, primaryTopic, secondaryTopic, 'critical evaluation'],
    researchTopics: [
      `${primaryTopic} academic debate`,
      `${secondaryTopic} evidence`,
      `${section.title} scholarly sources`,
    ],
  }
}

export const generateSectionGuidance = (
  section: AssignmentSection,
  seed: string,
  currentText: string
) => {
  const guidance = getGuidanceSeed(section, seed)
  const lowerText = currentText.toLowerCase()

  if (!lowerText.includes('because')) {
    guidance.commonMistakes.unshift('Your draft may need stronger explanation of cause, impact, or significance.')
  }

  if (currentText.split(/\s+/).filter(Boolean).length < Math.max(80, section.targetWords * 0.35)) {
    guidance.suggestedArguments.unshift('This section looks light, so prioritize one strong argument before adding extra breadth.')
  }

  return guidance
}

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length

export const evaluateReview = (
  assignmentLike: Pick<
    Assignment,
    'document' | 'outline' | 'references' | 'sectionAnchors' | 'wordCountTarget'
  >
): ReviewResult => {
  const wordCount = countWords(assignmentLike.document)
  const coverage = assignmentLike.outline.map((section) =>
    countWords(extractSectionText(assignmentLike.document, assignmentLike.sectionAnchors, section.id))
  )
  const underdevelopedSections = coverage.filter((count, index) => {
    const target = assignmentLike.outline[index]?.targetWords ?? 0
    return count < Math.max(60, target * 0.35)
  }).length

  const structureComplete = underdevelopedSections === 0
  const referencesIncluded = assignmentLike.references.length > 0
  const academicTone = !/\b(I|you|thing|stuff|a lot)\b/i.test(assignmentLike.document)
  const clarity = wordCount >= Math.max(250, assignmentLike.wordCountTarget * 0.4)

  const highlights: string[] = []
  if (!structureComplete) highlights.push('At least one section still needs fuller development.')
  if (!referencesIncluded) highlights.push('Add references so the draft feels evidence-backed.')
  if (!academicTone) highlights.push('Some phrasing still feels informal for an academic submission.')
  if (!clarity) highlights.push('The draft is still short compared with the target word count.')
  if (highlights.length === 0) {
    highlights.push('The structure is coherent and the draft is close to submission-ready.')
  }

  const completedChecks = [structureComplete, academicTone, clarity, referencesIncluded].filter(Boolean)
    .length

  return {
    status:
      completedChecks >= 4 ? 'nearly_ready' : completedChecks >= 2 ? 'on_track' : 'needs_attention',
    checks: {
      structureComplete,
      academicTone,
      clarity,
      referencesIncluded,
    },
    highlights,
  }
}

export const calculateProgress = (
  assignmentLike: Pick<
    Assignment,
    'checklist' | 'document' | 'wordCountTarget' | 'references' | 'review'
  >
) => {
  const checklistScore =
    assignmentLike.checklist.filter((item) => item.completed).length /
    Math.max(assignmentLike.checklist.length, 1)
  const wordScore = Math.min(countWords(assignmentLike.document) / Math.max(assignmentLike.wordCountTarget, 1), 1)
  const referenceScore = assignmentLike.references.length > 0 ? 1 : 0
  const reviewScore =
    Object.values(assignmentLike.review.checks).filter(Boolean).length /
    Object.values(assignmentLike.review.checks).length

  return Math.round((checklistScore * 0.35 + wordScore * 0.3 + referenceScore * 0.1 + reviewScore * 0.25) * 100)
}

export const createSeededAssignmentState = (seed: string, wordCountTarget: number) => {
  const breakdown = generateBreakdown(seed)
  const outline = generateOutline(seed, wordCountTarget)
  return buildAssignmentStateFromSeed({
    analysisText: seed,
    breakdown,
    outline,
    wordCountTarget,
  })
}

export const buildAssignmentStateFromSeed = ({
  analysisText,
  breakdown,
  outline,
  wordCountTarget,
}: ParsedAssignmentSeed & { wordCountTarget: number }) => {
  const document = buildDocumentFromOutline(outline)
  const sectionAnchors = computeSectionAnchors(document, outline)
  const checklist = generateInitialChecklist()
  const references: Assignment['references'] = []
  const review = evaluateReview({
    document,
    outline,
    references,
    sectionAnchors,
    wordCountTarget,
  })
  const progressPercent = calculateProgress({
    checklist,
    document,
    wordCountTarget,
    references,
    review,
  })

  return {
    analysisText,
    breakdown,
    outline,
    document,
    sectionAnchors,
    checklist,
    references,
    review,
    progressPercent,
  }
}

const replaceSelection = (
  document: string,
  selectionStart: number,
  selectionEnd: number,
  replacement: string
) => `${document.slice(0, selectionStart)}${replacement}${document.slice(selectionEnd)}`

export const applyAssistAction = ({
  action,
  document,
  selectionStart,
  selectionEnd,
  activeSectionText,
}: {
  action: AssistAction
  document: string
  selectionStart: number
  selectionEnd: number
  activeSectionText: string
}) => {
  const selectedText = document.slice(selectionStart, selectionEnd).trim()
  const baseText = selectedText || activeSectionText.trim()

  if (!baseText) {
    return {
      document,
      message: 'Start writing in the section first so the assist tools have something to work with.',
    }
  }

  let replacement = baseText

  switch (action) {
    case 'academic-tone':
      replacement = baseText
        .replace(/\bI think\b/gi, 'This discussion suggests')
        .replace(/\ba lot of\b/gi, 'many')
        .replace(/\bbig\b/gi, 'significant')
        .replace(/\bget\b/gi, 'obtain')
      break
    case 'expand-idea':
      replacement = `${baseText} This point becomes stronger when it is unpacked through evidence, explanation, and a clear link back to the assignment question.`
      break
    case 'simplify':
      replacement = baseText
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\butilize\b/gi, 'use')
        .replace(/\bfacilitate\b/gi, 'help')
      break
    case 'critical-depth':
      replacement = `${baseText} A stronger critical reading would also weigh the limitations of this point, compare alternative interpretations, and explain why one position is more convincing.`
      break
    case 'add-example':
      replacement = `${baseText} For example, a recent case or well-known theory could be introduced here to demonstrate how the argument works in practice.`
      break
    case 'continue-writing':
      replacement = `${baseText} This naturally leads to the next point, where the argument can be extended with further evidence and a sharper evaluative stance.`
      break
  }

  if (selectedText) {
    return {
      document: replaceSelection(document, selectionStart, selectionEnd, replacement),
      message: 'Assist suggestion applied to your selected text.',
    }
  }

  return {
    document: document.replace(activeSectionText, replacement),
    message: 'Assist suggestion applied to the active section.',
  }
}
