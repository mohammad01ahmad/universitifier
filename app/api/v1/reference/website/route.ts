import { NextResponse } from "next/server";
import * as cheerio from 'cheerio';
import { checkRateLimit } from "@/lib/security/rateLimit";
import { parseSafeWebsiteUrl } from "@/lib/security/referenceGuards";

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred while fetching website data.'
}

export async function POST(request: Request) {
    try {
        const rateLimit = checkRateLimit(request, {
            key: 'reference-website',
            limit: 20,
            windowMs: 60 * 1000,
        })

        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: 'Too many website reference requests. Please try again shortly.',
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

        const safeUrlResult = parseSafeWebsiteUrl(url)
        if (!safeUrlResult.isValid) {
            return NextResponse.json({ error: safeUrlResult.error }, { status: 400 });
        }

        // Fetching HTML with your User-Agent to prevent blocking
        const response = await fetch(safeUrlResult.url.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            return NextResponse.json({
                error: `Failed to fetch website content (${response.status} ${response.statusText})`
            }, { status: response.status });
        }

        const html = await response.text();

        if (!html.trim()) {
            return NextResponse.json({ error: 'The website returned empty content' }, { status: 422 });
        }

        const $ = cheerio.load(html);

        // Helper function to try multiple selectors using Cheerio
        const trySelectors = (selectors: string[], attr?: string) => {
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length) {
                    const value = attr ? element.attr(attr) : element.text();
                    if (value?.trim()) return value.trim();
                }
            }
            return null;
        };

        // 1. Get Title
        const title = trySelectors([
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
            'meta[property="citation_title"]',
        ], 'content') || trySelectors(['h1', 'title']) || 'Title not found';

        // 2. Get Author
        let author = 'Author not found';

        // Strategy A: Collect all citation_author tags (Common in ScienceDirect)
        const metaAuthors: string[] = [];
        $('meta[name="citation_author"]').each((_, el) => {
            const name = $(el).attr('content');
            if (name) metaAuthors.push(name);
        });

        if (metaAuthors.length > 0) {
            author = metaAuthors.length > 3
                ? `${metaAuthors[0]} et al.`
                : metaAuthors.join(', ');
        } else {
            // Strategy B: Fallback to general selectors but with a length check
            const fallbackAuthor = $('meta[name="author"]').attr('content') || $('.author').first().text().trim();
            // If the "author" is longer than 200 chars, it's likely an abstract by mistake
            if (fallbackAuthor && fallbackAuthor.length < 200) {
                author = fallbackAuthor;
            }
        }

        // 3. Get Date String
        const dateStr = trySelectors([
            'meta[property="article:published_time"]',
            'meta[name="publication_date"]',
            'meta[name="citation_publication_date"]',
            'meta[name="citation_date"]',
            'meta[name="date"]',
            'meta[property="og:updated_time"]',
        ], 'content') || trySelectors([
            'time[datetime]',
            '.published-date',
            '.article-date'
        ], 'datetime') || trySelectors([
            'time',
            '.date',
            '.publish-date'
        ]);

        // 4. Extract year from date string
        let year = 'Year not found';
        if (dateStr) {
            const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) year = yearMatch[0];
        }

        return NextResponse.json({ title, author, year });

    } catch (error: unknown) {
        return NextResponse.json({
            error: error instanceof Error && error.name === 'TimeoutError'
                ? 'Website request timed out. Please try again.'
                : getErrorMessage(error),
        }, { status: 500 });
    }
}
