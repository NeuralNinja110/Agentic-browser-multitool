import dotenv from "dotenv";
dotenv.config();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JsExecutorService } from "../server/services/js-executor.js";

const jsExecutor = new JsExecutorService();

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
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'JavaScript code is required' });
    }

    const result = await jsExecutor.execute(code);
    res.status(200).json(result);
  } catch (error) {
    console.error('JS Execution Error:', error);
    res.status(500).json({ error: 'Execution failed', details: error.message });
  }
}
