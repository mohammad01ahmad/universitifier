import { NextResponse } from 'next/server'

import type { AssignmentAnalysis, AssignmentUpload } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_UPLOAD_COUNT = 5
const MAX_UPLOAD_SIZE_BYTES = 700 * 1024
const REQUEST_TIMEOUT_MS = 45000

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const normalizeStringArray = (value: unknown, fallback: string[] = []) => {
  if (!Array.isArray(value)) return fallback

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeAnalysis = (value: unknown): AssignmentAnalysis => {
  const item = typeof value === 'object' && value ? value as Record<string, unknown> : {}

  return {
    task_type:
      typeof item.task_type === 'string' && item.task_type.trim()
        ? item.task_type.trim().toLowerCase()
        : 'essay',
    requirements: normalizeStringArray(item.requirements, ['Analyze the core task', 'Support points with evidence']),
    key_topics: normalizeStringArray(item.key_topics),
    rubric_points: normalizeStringArray(item.rubric_points, ['critical thinking', 'structure', 'references']),
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini assignment analysis is not configured right now.' },
        { status: 500 }
      )
    }

    const body = await request.json() as {
      title?: string
      uploads?: AssignmentUpload[]
    }

    const uploads = Array.isArray(body.uploads) ? body.uploads : []

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

    const invalidUpload = uploads.find(
      (upload) =>
        !upload?.fileName ||
        !upload?.base64 ||
        upload.size > MAX_UPLOAD_SIZE_BYTES
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
You are analyzing uploaded university assignment documents for a student writing workflow.
Read all uploaded files together and return strict JSON only in this exact shape:
{
  "task_type": "essay",
  "requirements": ["Analyze impact", "Provide examples"],
  "key_topics": ["AI", "employment"],
  "rubric_points": ["critical thinking", "structure", "references"]
}

Rules:
- Return JSON only. No markdown. No explanation.
- "task_type" must be a short lowercase string such as essay, report, presentation, reflection, case-study, or dissertation.
- "requirements" must contain concise actionable instructions taken from the assignment brief and marking guidance.
- "key_topics" must contain the most important topics or subject areas the student needs to cover.
- "rubric_points" must contain grading criteria, hidden expectations, or marking priorities.
- Use between 2 and 8 items for each array when possible.
- If details are sparse, infer safe academic defaults instead of failing.
- Analyze all uploaded documents together before deciding the output.
${body.title ? `- The user-provided assignment title is: ${body.title}` : ''}
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
                task_type: {
                  type: 'STRING',
                },
                requirements: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                  },
                },
                key_topics: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                  },
                },
                rubric_points: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                  },
                },
              },
              required: ['task_type', 'requirements', 'key_topics', 'rubric_points'],
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
          : 'Gemini assignment analysis failed.'

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json(
        { error: 'Gemini returned an empty analysis response.' },
        { status: 502 }
      )
    }

    const parsed = JSON.parse(cleanJson(rawText)) as unknown
    const analysis = normalizeAnalysis(parsed)

    return NextResponse.json(analysis)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name === 'TimeoutError'
            ? 'Gemini assignment analysis timed out. Please try again.'
            : error instanceof Error
              ? error.message
              : 'Unexpected assignment analysis failure.',
      },
      { status: 500 }
    )
  }
}
