import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { url } = await request.json();
        const videoId = extractYouTubeId(url);

        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;

        // 1. Fetch from YouTube Data API (Reliable for Date and Channel Title)
        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
        );

        if (!videoResponse.ok) {
            throw new Error(`YouTube API failed: ${videoResponse.statusText}`);
        }

        const videoData = await videoResponse.json();
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
            snippet
        });

    } catch (error: any) {
        console.error('YouTube API error:', error.message);
        return NextResponse.json({
            title: 'Could not fetch',
            author: 'Unknown Author',
            year: new Date().getFullYear().toString(),
        }, { status: 200 });
    }
}

function extractYouTubeId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}