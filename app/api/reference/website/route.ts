
import { NextResponse } from "next/server";
import { JSDOM } from 'jsdom'
import got from 'got'

// Secure website reference route for admin

export async function POST(request: any) {
    const formData = await request.json()

    const res = await got(formData.url)
    const dom = new JSDOM(res.body)

    // Get Title
    let titleElementText = dom.window.document?.querySelector('title')?.textContent;
    titleElementText = titleElementText || "Title not found"

    // Get Author
    let author = dom.window.document.querySelector('meta[property="article:author"], meta[property="author"], meta[name="author"]')?.getAttribute('content')
    if (!author) {
        author = dom.window.document.querySelector('meta[name="DC.creator"]')?.getAttribute('content');
    }
    if (!author) {
        author = dom.window.document.querySelector('.author, [rel="author"], .byline')?.textContent?.trim();
    }
    author = author || "Author not found";

    if (author === "Author not found") {
        author = dom.window.document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    }

    // Get Year
    let year = dom.window.document.querySelector('meta[property="article:published_time"]')?.getAttribute('content')
    if (year) {
        year = year.split('-')[0]
    }
    year = year || "Year not found"

    console.log(titleElementText, author, year)
    return NextResponse.json({ titleElementText, author, year })
}