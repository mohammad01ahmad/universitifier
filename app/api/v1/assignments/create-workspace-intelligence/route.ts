import { NextResponse } from 'next/server'

import type {
  AssignmentBreakdown,
  AssignmentUpload,
  AssignmentWorkspaceIntelligenceResponse,
  ResearchGuidanceResponse,
  SectionGuidance,
} from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const MAX_UPLOAD_COUNT = 5
const MAX_UPLOAD_SIZE_BYTES = 700 * 1024
const REQUEST_TIMEOUT_MS = 60000

const normalizeStringArray = (value: unknown, fallback: string[] = []) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : fallback

const normalizeBreakdown = (value: unknown): AssignmentBreakdown => {
  const item = typeof value === 'object' && value ? value as Record<string, unknown> : {}

  return {
    requirements: normalizeStringArray(item.requirements, ['Address the assignment task directly.']).slice(0, 8),
    deliverable:
      typeof item.deliverable === 'string' && item.deliverable.trim()
        ? item.deliverable.trim()
        : 'Essay',
    hiddenExpectations: normalizeStringArray(
      item.hiddenExpectations,
      ['critical thinking', 'structure', 'references']
    ).slice(0, 6),
  }
}

const normalizeSectionGuidance = (value: unknown): SectionGuidance => {
  const item = typeof value === 'object' && value ? itemToRecord(value) : {}

  return {
    key_points: normalizeStringArray(item.key_points, ['Define the core idea clearly.']),
    suggestions: normalizeStringArray(item.suggestions, ['Add evidence and link the point back to the task.']),
    common_mistakes: normalizeStringArray(item.common_mistakes, ['Being too descriptive']),
  }
}

const normalizeResearchGuidance = (value: unknown): ResearchGuidanceResponse => {
  const item = typeof value === 'object' && value ? itemToRecord(value) : {}

  return {
    angles: normalizeStringArray(item.angles, ['Core impact']),
    keywords: normalizeStringArray(item.keywords, ['scholarly articles']),
    example_ideas: normalizeStringArray(item.example_ideas, ['A relevant case study']),
  }
}

const itemToRecord = (value: unknown) => value as Record<string, unknown>

const normalizeOutline = (
  value: unknown,
  wordCountTarget: number
): AssignmentWorkspaceIntelligenceResponse['outline'] => {
  if (!Array.isArray(value) || value.length === 0) {
    const introWords = Math.max(120, Math.round(wordCountTarget * 0.15))
    const conclusionWords = Math.max(120, Math.round(wordCountTarget * 0.15))
    const bodyWords = Math.max(180, Math.round((wordCountTarget - introWords - conclusionWords) / 2))

    return [
      {
        title: 'Introduction',
        word_count: introWords,
        purpose: 'Introduce the topic and thesis.',
        guidance: normalizeSectionGuidance({}),
        researchGuidance: normalizeResearchGuidance({}),
      },
      {
        title: 'Main Analysis',
        word_count: bodyWords,
        purpose: 'Develop the core argument with evidence.',
        guidance: normalizeSectionGuidance({}),
        researchGuidance: normalizeResearchGuidance({}),
      },
      {
        title: 'Critical Discussion',
        word_count: bodyWords,
        purpose: 'Evaluate perspectives, limitations, and implications.',
        guidance: normalizeSectionGuidance({}),
        researchGuidance: normalizeResearchGuidance({}),
      },
      {
        title: 'Conclusion',
        word_count: conclusionWords,
        purpose: 'Synthesize the argument and answer the task.',
        guidance: normalizeSectionGuidance({}),
        researchGuidance: normalizeResearchGuidance({}),
      },
    ]
  }

  return value.map((section, index) => {
    const item = typeof section === 'object' && section ? itemToRecord(section) : {}
    return {
      title:
        typeof item.title === 'string' && item.title.trim()
          ? item.title.trim()
          : `Section ${index + 1}`,
      word_count:
        typeof item.word_count === 'number' && Number.isFinite(item.word_count) && item.word_count > 0
          ? Math.round(item.word_count)
          : Math.max(120, Math.round(wordCountTarget / Math.max(value.length, 1))),
      purpose:
        typeof item.purpose === 'string' && item.purpose.trim()
          ? item.purpose.trim()
          : 'Develop this part of the assignment with a clear argument and evidence.',
      guidance: normalizeSectionGuidance(item.guidance),
      researchGuidance: normalizeResearchGuidance(item.researchGuidance),
    }
  })
}

const normalizeWorkspaceIntelligence = (
  value: unknown,
  title: string | undefined,
  uploads: AssignmentUpload[],
  wordCountTarget: number
): AssignmentWorkspaceIntelligenceResponse => {
  const item = typeof value === 'object' && value ? itemToRecord(value) : {}
  const fallbackTitle =
    title?.trim() ||
    uploads[0]?.fileName.replace(/\.[^.]+$/, '') ||
    'Untitled assignment'

  return {
    title:
      typeof item.title === 'string' && item.title.trim()
        ? item.title.trim()
        : fallbackTitle,
    analysisText:
      typeof item.analysisText === 'string' && item.analysisText.trim()
        ? item.analysisText.trim()
        : fallbackTitle,
    breakdown: normalizeBreakdown(item.breakdown),
    outline: normalizeOutline(item.outline, wordCountTarget),
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini assignment setup is not configured right now.' },
        { status: 500 }
      )
    }

    const body = await request.json() as {
      title?: string
      uploads?: AssignmentUpload[]
      wordCountTarget?: number
    }

    const uploads = Array.isArray(body.uploads) ? body.uploads : []
    const wordCountTarget = typeof body.wordCountTarget === 'number' ? body.wordCountTarget : NaN

    if (uploads.length === 0) {
      return NextResponse.json(
        { error: 'At least one assignment document is required.' },
        { status: 400 }
      )
    }

    if (uploads.length > MAX_UPLOAD_COUNT) {
      return NextResponse.json(
        { error: `You can upload up to ${MAX_UPLOAD_COUNT} files per assignment.` },
        { status: 400 }
      )
    }

    if (!Number.isFinite(wordCountTarget) || wordCountTarget <= 0) {
      return NextResponse.json(
        { error: 'A valid wordCountTarget is required.' },
        { status: 400 }
      )
    }

    const invalidUpload = uploads.find(
      (upload) => !upload?.fileName || !upload?.base64 || upload.size > MAX_UPLOAD_SIZE_BYTES
    )

    if (invalidUpload) {
      return NextResponse.json(
        {
          error:
            invalidUpload.size > MAX_UPLOAD_SIZE_BYTES
              ? 'Each uploaded file must be under 700 KB in the current base64 setup.'
              : 'Every uploaded file must include a name and base64 content.',
        },
        { status: 400 }
      )
    }

    const prompt = `
You are generating a complete assignment workspace for a student writing system.
Read all uploaded files together and return strict JSON only in this exact shape:
{
  "title": "optional resolved title",
  "analysisText": "short plain-text summary of the assignment task and marking expectations",
  "breakdown": {
    "requirements": ["string"],
    "deliverable": "string",
    "hiddenExpectations": ["string"]
  },
  "outline": [
    {
      "title": "Introduction",
      "word_count": 150,
      "purpose": "Introduce topic and thesis",
      "guidance": {
        "key_points": ["string"],
        "suggestions": ["string"],
        "common_mistakes": ["string"]
      },
      "researchGuidance": {
        "angles": ["string"],
        "keywords": ["string"],
        "example_ideas": ["string"]
      }
    }
  ]
}

Rules:
- Generate the full assignment workspace in one response.
- The total outline should fit a ${wordCountTarget}-word submission.
- Use 4 to 6 sections when possible.
- Include section guidance and research guidance for every section.
- Requirements and hidden expectations must be concise and actionable.
- Keep analysisText short and useful for workspace context.
- Return JSON only. No markdown. No explanation.
${body.title ? `- User-provided title: ${body.title}` : ''}
    `.trim()

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...uploads.map((upload) => ({
                  inline_data: {
                    mime_type: upload.mimeType || 'application/octet-stream',
                    data: upload.base64,
                  },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                analysisText: { type: 'STRING' },
                breakdown: {
                  type: 'OBJECT',
                  properties: {
                    requirements: { type: 'ARRAY', items: { type: 'STRING' } },
                    deliverable: { type: 'STRING' },
                    hiddenExpectations: { type: 'ARRAY', items: { type: 'STRING' } },
                  },
                  required: ['requirements', 'deliverable', 'hiddenExpectations'],
                },
                outline: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      word_count: { type: 'NUMBER' },
                      purpose: { type: 'STRING' },
                      guidance: {
                        type: 'OBJECT',
                        properties: {
                          key_points: { type: 'ARRAY', items: { type: 'STRING' } },
                          suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
                          common_mistakes: { type: 'ARRAY', items: { type: 'STRING' } },
                        },
                        required: ['key_points', 'suggestions', 'common_mistakes'],
                      },
                      researchGuidance: {
                        type: 'OBJECT',
                        properties: {
                          angles: { type: 'ARRAY', items: { type: 'STRING' } },
                          keywords: { type: 'ARRAY', items: { type: 'STRING' } },
                          example_ideas: { type: 'ARRAY', items: { type: 'STRING' } },
                        },
                        required: ['angles', 'keywords', 'example_ideas'],
                      },
                    },
                    required: ['title', 'word_count', 'purpose', 'guidance', 'researchGuidance'],
                  },
                },
              },
              required: ['analysisText', 'breakdown', 'outline'],
            },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    )

    const payload = await response.json() as Record<string, unknown>

    if (!response.ok) {
      const message =
        typeof payload.error === 'object' && payload.error && 'message' in payload.error
          ? String((payload.error as { message?: string }).message)
          : 'Gemini assignment setup failed.'

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json(
        { error: 'Gemini returned an empty assignment setup response.' },
        { status: 502 }
      )
    }

    const parsed = JSON.parse(rawText) as unknown

    return NextResponse.json(
      normalizeWorkspaceIntelligence(parsed, body.title, uploads, wordCountTarget)
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name === 'TimeoutError'
            ? 'Assignment setup timed out. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Unexpected assignment setup failure.',
      },
      { status: 500 }
    )
  }
}
