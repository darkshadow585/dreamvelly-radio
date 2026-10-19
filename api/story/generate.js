import { generateStory } from '../storyService.js';

function parseRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const payload =
      req.method === 'GET'
        ? {
            genre: req.query?.genre || 'Horror',
            mode: req.query?.mode || 'create',
            topic: req.query?.topic || '',
          }
        : parseRequestBody(req);

    const story = await generateStory(payload);
    return res.status(200).json(story);
  } catch (err) {
    console.error('Vercel /api/story/generate error:', err);
    return res.status(500).json({
      error: err.message || 'Story generation failed on serverless endpoint',
    });
  }
}
