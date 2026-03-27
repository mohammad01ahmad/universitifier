import { NextResponse } from 'next/server'

import type { AssignmentReviewResponse } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash'

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const clampScore = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(10, Math.round(value)))
    : 0

const normalizeList = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : fallback

const normalizeReview = (value: unknown): AssignmentReviewResponse => {
  const item = typeof value === 'object' && value ? value as Record<string, unknown> : {}
  const scores = typeof item.scores === 'object' && item.scores ? item.scores as Record<string, unknown> : {}

  return {
    scores: {
      structure: clampScore(scores.structure),
      clarity: clampScore(scores.clarity),
      critical_thinking: clampScore(scores.critical_thinking),
      referencing: clampScore(scores.referencing),
    },
    issues: normalizeList(item.issues, ['No major issues identified.']),
    suggestions: normalizeList(item.suggestions, ['Strengthen the argument with more evidence where needed.']),
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini review is not configured right now.' }, { status: 500 })
    }

    const body = await request.json() as {
      assignmentText?: string
      rubric?: string[]
      structure?: Array<{ title?: string; purpose?: string; word_count?: number }>
    }

    if (!body.assignmentText || !Array.isArray(body.rubric) || !Array.isArray(body.structure)) {
      return NextResponse.json({ error: 'assignmentText, rubric, and structure are required.' }, { status: 400 })
    }

    const prompt = `
You are reviewing a student assignment draft against a rubric and target structure.
Return strict JSON only in this exact shape:
{
  "scores": {
    "structure": 8,
    "clarity": 7,
    "critical_thinking": 6,
    "referencing": 5
  },
  "issues": ["Conclusion is weak", "Lacks critical comparison"],
  "suggestions": ["Add contrasting viewpoints", "Strengthen final argument"]
}

Rubric: ${JSON.stringify(body.rubric)}
Structure: ${JSON.stringify(body.structure)}
Assignment text:
${body.assignmentText}

Rules:
- Scores must be integers from 0 to 10.
- Issues should be concise and concrete.
- Suggestions should be actionable.
- Return JSON only with no markdown or explanation.
    `.trim()

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                scores: {
                  type: 'OBJECT',
                  properties: {
                    structure: { type: 'NUMBER' },
                    clarity: { type: 'NUMBER' },
                    critical_thinking: { type: 'NUMBER' },
                    referencing: { type: 'NUMBER' },
                  },
                  required: ['structure', 'clarity', 'critical_thinking', 'referencing'],
                },
                issues: { type: 'ARRAY', items: { type: 'STRING' } },
                suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['scores', 'issues', 'suggestions'],
            },
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )

    const payload = await response.json() as Record<string, unknown>
    if (!response.ok) {
      const message =
        typeof payload.error === 'object' && payload.error && 'message' in payload.error
          ? String((payload.error as { message?: string }).message)
          : 'Gemini review failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned an empty review response.' }, { status: 502 })
    }

    return NextResponse.json(normalizeReview(JSON.parse(cleanJson(rawText))))
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Review timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unexpected review failure.',
    }, { status: 500 })
  }
}
