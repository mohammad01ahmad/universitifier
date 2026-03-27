import { NextResponse } from 'next/server'

import type { SectionGuidance } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash'

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const normalizeList = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : fallback

const normalizeGuidance = (value: unknown): SectionGuidance => {
  const item = typeof value === 'object' && value ? value as Record<string, unknown> : {}

  return {
    key_points: normalizeList(item.key_points, ['Define the core idea clearly.', 'Connect the section back to the assignment task.']),
    suggestions: normalizeList(item.suggestions, ['Add specific evidence or an example.', 'Push beyond description into analysis.']),
    common_mistakes: normalizeList(item.common_mistakes, ['Being too descriptive', 'Losing focus on the section question']),
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini section guidance is not configured right now.' }, { status: 500 })
    }

    const body = await request.json() as {
      sectionTitle?: string
      assignmentContext?: string
      currentText?: string
    }

    if (!body.sectionTitle || !body.assignmentContext) {
      return NextResponse.json({ error: 'sectionTitle and assignmentContext are required.' }, { status: 400 })
    }

    const prompt = `
You are helping a student write one assignment section.
Return strict JSON only in this exact shape:
{
  "key_points": ["Define AI briefly", "Explain job displacement"],
  "suggestions": ["Add a real-world example", "Compare short vs long term impact"],
  "common_mistakes": ["Being too descriptive", "No critical analysis"]
}

Section title: ${body.sectionTitle}
Assignment context: ${body.assignmentContext}
Current text: ${body.currentText || ''}

Rules:
- Keep guidance short and actionable.
- Focus on what to include, how to improve, and what to avoid.
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
                key_points: { type: 'ARRAY', items: { type: 'STRING' } },
                suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
                common_mistakes: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['key_points', 'suggestions', 'common_mistakes'],
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
          : 'Gemini section guidance failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned an empty section guidance response.' }, { status: 502 })
    }

    return NextResponse.json(normalizeGuidance(JSON.parse(cleanJson(rawText))))
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Section guidance timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unexpected section guidance failure.',
    }, { status: 500 })
  }
}
