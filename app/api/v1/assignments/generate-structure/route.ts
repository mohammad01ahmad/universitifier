import { NextResponse } from 'next/server'

import type { AssignmentAnalysis, AssignmentStructureResponse } from '@/lib/assignments/types'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

const normalizeSections = (value: unknown, wordCount: number): AssignmentStructureResponse['sections'] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      { title: 'Introduction', word_count: Math.max(120, Math.round(wordCount * 0.15)), purpose: 'Introduce the topic and thesis.' },
      { title: 'Main Analysis', word_count: Math.max(180, Math.round(wordCount * 0.35)), purpose: 'Develop the core argument with evidence.' },
      { title: 'Critical Discussion', word_count: Math.max(180, Math.round(wordCount * 0.35)), purpose: 'Evaluate perspectives, limitations, and implications.' },
      { title: 'Conclusion', word_count: Math.max(120, Math.round(wordCount * 0.15)), purpose: 'Synthesize the argument and answer the task.' },
    ]
  }

  return value.map((section, index) => {
    const item = typeof section === 'object' && section ? section as Record<string, unknown> : {}
    return {
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Section ${index + 1}`,
      word_count:
        typeof item.word_count === 'number' && Number.isFinite(item.word_count) && item.word_count > 0
          ? Math.round(item.word_count)
          : Math.max(120, Math.round(wordCount / Math.max(value.length, 1))),
      purpose:
        typeof item.purpose === 'string' && item.purpose.trim()
          ? item.purpose.trim()
          : 'Develop this part of the assignment with a clear argument and evidence.',
    }
  })
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini structure generation is not configured right now.' }, { status: 500 })
    }

    const body = await request.json() as {
      analysis?: AssignmentAnalysis
      wordCount?: number
    }

    const analysis = body.analysis
    const wordCount = typeof body.wordCount === 'number' ? body.wordCount : NaN

    if (!analysis || !Number.isFinite(wordCount) || wordCount <= 0) {
      return NextResponse.json({ error: 'A valid analyzer output and wordCount are required.' }, { status: 400 })
    }

    const prompt = `
You are generating an academic assignment structure.
Return strict JSON only in this exact shape:
{
  "sections": [
    {
      "title": "Introduction",
      "word_count": 150,
      "purpose": "Introduce topic and thesis"
    }
  ]
}

Assignment analysis:
${JSON.stringify(analysis)}

Rules:
- Total structure should fit a ${wordCount}-word submission.
- Use 4 to 6 sections when possible.
- Include an introduction and conclusion when appropriate.
- Titles must be concise and assignment-relevant.
- Purposes must be short and actionable.
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
                sections: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      word_count: { type: 'NUMBER' },
                      purpose: { type: 'STRING' },
                    },
                    required: ['title', 'word_count', 'purpose'],
                  },
                },
              },
              required: ['sections'],
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
          : 'Gemini structure generation failed.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const rawText =
      ((payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned an empty structure response.' }, { status: 502 })
    }

    const parsed = JSON.parse(cleanJson(rawText)) as { sections?: unknown }
    return NextResponse.json({ sections: normalizeSections(parsed.sections, wordCount) })
  } catch (error) {
    return NextResponse.json({
      error:
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Structure generation timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unexpected structure generation failure.',
    }, { status: 500 })
  }
}
