
import { NextResponse } from "next/server";
import { JSDOM } from 'jsdom'
import got from 'got'

// Secure website reference route for admin

export async function POST(request: any) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const html = await got(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: { request: 10000 }
        }).then(res => res.body)

        const dom = new JSDOM(html)
        const doc = dom.window.document

        // Helper function to try multiple selectors
        const trySelectors = (selectors: string[], attr?: string) => {
            for (const selector of selectors) {
                const element = doc.querySelector(selector)
                if (element) {
                    const value = attr ? element.getAttribute(attr) : element.textContent
                    if (value?.trim()) return value.trim()
                }
            }
            return null
        }

        // Get Title
        const title = trySelectors([
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
            'meta[property="citation_title"]',
            'h1',
            'title'
        ], 'content') || trySelectors(['h1', 'title']) || 'Title not found'

        // Get Author
        const author = trySelectors([
            'meta[property="article:author"]',
            'meta[name="author"]',
            'meta[name="citation_author"]',
            'meta[name="citation_authors"]',
            'meta[name="DC.creator"]',
            'meta[property="author"]',
        ], 'content') || trySelectors([
            '[rel="author"]',
            '.author',
            '.byline',
            '.article-author',
            '[itemprop="author"]'
        ]) || 'Author not found'

        // Get Year
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
        ])

        // Extract year from date string
        let year = 'Year not found'
        if (dateStr) {
            const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/)
            if (yearMatch) year = yearMatch[0]
        }

        console.log(title, author, year)
        return NextResponse.json({ title, author, year })

    } catch (error) {
        console.error('Error fetching data:', error)
        return NextResponse.json({ error: 'Error fetching data' }, { status: 500 })
    }
}