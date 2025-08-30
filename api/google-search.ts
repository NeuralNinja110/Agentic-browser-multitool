import dotenv from "dotenv";
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSearchService } from "../server/services/google-search.js";

const googleSearchService = new GoogleSearchService();

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
    const { query, limit } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const results = await googleSearchService.search(query, limit || 5);
    res.status(200).json(results);
  } catch (error) {
    console.error('Google Search Error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}
