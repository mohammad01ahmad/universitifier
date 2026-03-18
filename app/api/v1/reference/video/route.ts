import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { extractYouTubeVideoId } from "@/lib/security/referenceGuards";

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred while fetching video data.'
}

export async function POST(request: Request) {
    try {
        const rateLimit = checkRateLimit(request, {
            key: 'reference-video',
            limit: 30,
            windowMs: 60 * 1000,
        })

        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: 'Too many video reference requests. Please try again shortly.',
            }, {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfterSeconds),
                },
            });
        }

        const body = await request.json();
        const url = typeof body?.url === 'string' ? body.url.trim() : ''

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const videoId = extractYouTubeVideoId(url);

        if (!videoId) {
            return NextResponse.json({ error: 'Please enter a valid YouTube URL' }, { status: 400 });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Video reference service is not configured right now' }, { status: 500 });
        }

        // 1. Fetch from YouTube Data API (Reliable for Date and Channel Title)
        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
            {
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!videoResponse.ok) {
            return NextResponse.json({
                error: `Failed to fetch video details (${videoResponse.status} ${videoResponse.statusText})`
            }, { status: videoResponse.status });
        }

        const videoData = await videoResponse.json();
        const apiErrorMessage = videoData?.error?.message;

        if (apiErrorMessage) {
            return NextResponse.json({ error: apiErrorMessage }, { status: 502 });
        }

        const snippet = videoData.items?.[0]?.snippet;

        if (!snippet) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // 2. Extract Data correctly
        const title = snippet.title;
        const author = snippet.channelTitle; // Use channelTitle from Data API snippet
        const publishDate = snippet.publishedAt; // e.g., "2023-05-15T..."
        const year = publishDate ? publishDate.split('-')[0] : new Date().getFullYear().toString();

        return NextResponse.json({
            title,
            author,
            year,
        });

    } catch (error: unknown) {
        return NextResponse.json({
            error: error instanceof Error && error.name === 'TimeoutError'
                ? 'Video request timed out. Please try again.'
                : getErrorMessage(error),
        }, { status: 500 });
    }
}
