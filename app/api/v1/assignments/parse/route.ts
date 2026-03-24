import { NextResponse } from 'next/server'

import type { AssignmentUpload, ParsedAssignmentSeed } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_UPLOAD_SIZE_BYTES = 700 * 1024

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const normalizeOutline = (outline: unknown, wordCountTarget: number) => {
  if (!Array.isArray(outline) || outline.length === 0) {
    return [
      { id: 'section-1', title: 'Introduction', description: 'Set the context and thesis.', targetWords: Math.max(120, Math.round(wordCountTarget * 0.15)) },
      { id: 'section-2', title: 'Main Analysis', description: 'Develop the core argument with evidence.', targetWords: Math.max(180, Math.round(wordCountTarget * 0.35)) },
      { id: 'section-3', title: 'Critical Discussion', description: 'Evaluate alternative views and limitations.', targetWords: Math.max(180, Math.round(wordCountTarget * 0.35)) },
      { id: 'section-4', title: 'Conclusion', description: 'Synthesize the key points and answer the task.', targetWords: Math.max(120, Math.round(wordCountTarget * 0.15)) },
    ]
  }

  return outline.map((section, index) => {
    const item = typeof section === 'object' && section ? section as Record<string, unknown> : {}
    return {
      id: `section-${index + 1}`,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Section ${index + 1}`,
      description: typeof item.description === 'string' && item.description.trim()
        ? item.description.trim()
        : 'Develop this part of the assignment with a clear argument and evidence.',
      targetWords: typeof item.targetWords === 'number' && Number.isFinite(item.targetWords)
        ? item.targetWords
        : Math.max(120, Math.round(wordCountTarget / Math.max(outline.length, 1))),
    }
  })
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini parsing is not configured right now.' }, { status: 500 })
    }

    const body = await request.json() as {
      title?: string
      wordCountTarget?: number
      upload?: AssignmentUpload
    }

    const upload = body.upload
    const wordCountTarget = typeof body.wordCountTarget === 'number' ? body.wordCountTarget : 1500

    if (!upload?.base64 || !upload.fileName) {
      return NextResponse.json({ error: 'Assignment upload is required.' }, { status: 400 })
    }

    if (upload.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({
        error: 'This file is too large for Firestore base64 storage in the current V1 setup. Please upload a file under 700 KB.',
      }, { status: 400 })
    }

    const prompt = `
You are parsing a university assignment file for a student writing workspace.
Read the uploaded assignment and return strict JSON only with this shape:
{
  "title": "string",
  "analysisText": "short plain-text summary of the assignment task and marking expectations",
  "breakdown": {
    "requirements": ["string"],
    "deliverable": "string",
    "hiddenExpectations": ["string"]
  },
  "outline": [
    {
      "title": "string",
      "description": "string",
      "targetWords": 150
    }
  ]
}

Rules:
- Use 4 to 6 outline sections total.
- Make the outline suitable for a ${wordCountTarget}-word submission.
- Requirements should be concise and actionable.
- Hidden expectations should focus on academic quality, evaluation, and evidence.
- analysisText should be short and useful for later context-aware assistance.
- If the uploaded file is sparse, infer a safe academic structure instead of failing.
- Return JSON only with no markdown fences or explanation.
`.trim()

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: upload.mimeType || 'application/octet-stream',
                    data: upload.base64,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      }
    )

    const payload = await response.json() as Record<string, unknown>

    if (!response.ok) {
      const message =
        typeof payload.error === 'object' && payload.error && 'message' in payload.error
          ? String((payload.error as { message?: string }).message)
          : 'Gemini parsing failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned an empty parsing response.' }, { status: 502 })
    }

    const parsed = JSON.parse(cleanJson(rawText)) as Partial<ParsedAssignmentSeed> & {
      breakdown?: ParsedAssignmentSeed['breakdown']
      outline?: ParsedAssignmentSeed['outline']
    }

    return NextResponse.json({
      title: parsed.title || body.title || upload.fileName.replace(/\.[^.]+$/, ''),
      analysisText:
        parsed.analysisText ||
        `Assignment uploaded from ${upload.fileName}. Focus on the core task, academic evidence, and a clear evaluative structure.`,
      breakdown: {
        requirements: parsed.breakdown?.requirements?.slice(0, 6) ?? ['Address the core assignment task directly.'],
        deliverable: parsed.breakdown?.deliverable || 'Essay',
        hiddenExpectations: parsed.breakdown?.hiddenExpectations?.slice(0, 4) ?? [
          'Use evidence to support every major claim.',
          'Show critical thinking, not just description.',
        ],
      },
      outline: normalizeOutline(parsed.outline, wordCountTarget),
    })
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Gemini parsing timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unexpected parsing failure.',
    }, { status: 500 })
  }
}
