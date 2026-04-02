import { NextResponse } from 'next/server'

import type { ResearchGuidanceResponse } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'

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

const normalizeResearch = (value: unknown): ResearchGuidanceResponse => {
  const item = typeof value === 'object' && value ? value as Record<string, unknown> : {}

  return {
    angles: normalizeList(item.angles, ['Core impact', 'Counterarguments']),
    keywords: normalizeList(item.keywords, ['scholarly articles', 'case studies']),
    example_ideas: normalizeList(item.example_ideas, ['A contemporary real-world example', 'A contrasting case study']),
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini research guidance is not configured right now.' }, { status: 500 })
    }

    const body = await request.json() as {
      section?: string
      assignmentContext?: string
    }

    if (!body.section || !body.assignmentContext) {
      return NextResponse.json({ error: 'section and assignmentContext are required.' }, { status: 400 })
    }

    const prompt = `
You are helping a student research one assignment section.
Return strict JSON only in this exact shape:
{
  "angles": ["economic impact", "ethical concerns"],
  "keywords": ["AI job displacement statistics", "automation case studies"],
  "example_ideas": ["Amazon warehouse automation", "ChatGPT replacing tasks"]
}

Section: ${body.section}
Assignment context: ${body.assignmentContext}

Rules:
- Keep outputs concise and practical for research.
- Keywords should be real search phrases.
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
                angles: { type: 'ARRAY', items: { type: 'STRING' } },
                keywords: { type: 'ARRAY', items: { type: 'STRING' } },
                example_ideas: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['angles', 'keywords', 'example_ideas'],
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
          : 'Gemini research guidance failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned an empty research guidance response.' }, { status: 502 })
    }

    return NextResponse.json(normalizeResearch(JSON.parse(cleanJson(rawText))))
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Research guidance timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unexpected research guidance failure.',
    }, { status: 500 })
  }
}
