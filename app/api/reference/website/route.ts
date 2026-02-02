import { NextResponse } from "next/server";
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetching HTML with your User-Agent to prevent blocking
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 3600 } // Optional: cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.statusText}`);
        }

        const html = await response.text();
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

        console.log('Extracted Data:', { title, author, year });
        return NextResponse.json({ title, author, year });

    } catch (error: any) {
        console.error('Error fetching data:', error.message);
        return NextResponse.json({
            error: 'Error fetching data',
            details: error.message
        }, { status: 500 });
    }
}