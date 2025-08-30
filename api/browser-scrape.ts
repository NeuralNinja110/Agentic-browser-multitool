import dotenv from "dotenv";
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BrowserScrapeService } from "../server/services/browser-scrape.js";

const browserScrapeService = new BrowserScrapeService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, selector } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await browserScrapeService.scrapeUrl(url, selector || 'body');
    res.status(200).json(result);
  } catch (error) {
    console.error('Browser Scrape Error:', error);
    res.status(500).json({ error: 'Browser scraping failed', details: error.message });
  }
}
