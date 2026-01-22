// app/api/metadata/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = {
      author: $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content') || "",
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || "",
      year: new Date($('meta[property="article:published_time"]').attr('content') || Date.now()).getFullYear().toString(),
      url: url,
      container: $('meta[property="og:site_name"]').attr('content') || "",
      accessDate: new Date().toLocaleDateString('en-GB') // Standard Harvard access date format
    };

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}