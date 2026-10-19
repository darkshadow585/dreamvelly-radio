import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import youtubesearchapi from 'youtube-search-api';
import fs from 'fs';
import { generateStory, narrateStory } from './api/storyService.js';

// Hydrate GEMINI_API_KEY from /app/.dev.env.json if Vite process started with placeholder
try {
  if (
    (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') &&
    fs.existsSync('/app/.dev.env.json')
  ) {
    const devEnv = JSON.parse(fs.readFileSync('/app/.dev.env.json', 'utf-8'));
    if (devEnv.GEMINI_API_KEY && devEnv.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      process.env.GEMINI_API_KEY = devEnv.GEMINI_API_KEY.trim();
    }
  }
} catch {}

function parseJsonBody(req) {
  if (req.body) {
    try {
      return Promise.resolve(
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      );
    } catch {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
    if (typeof req.resume === 'function') {
      req.resume();
    }
  });
}

function serverApiPlugin() {
  const handleApi = async (req, res, next) => {
    // 1. YouTube Search
    if (req.url && req.url.startsWith('/api/search')) {
      try {
        const url = new URL(req.url, 'http://localhost');
        const query = url.searchParams.get('q');
        if (!query || !query.trim()) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing query parameter q', items: [] }));
          return;
        }
        const data = await youtubesearchapi.GetListByKeyword(query.trim(), false, 8);
        const items = (data?.items || [])
          .filter((item) => item.id && (item.type === 'video' || !item.type))
          .map((item) => {
            const thumb =
              item.thumbnail?.thumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
            return {
              id: item.id,
              title: item.title || 'Untitled Track',
              artist: item.channelTitle || 'YouTube Music',
              duration: item.length?.simpleText || '3:30',
              cover: thumb,
              isYouTube: true,
            };
          });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ items }));
      } catch (err) {
        console.error('YouTube search error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message, items: [] }));
      }
      return;
    }

    // 2. AI Story Generation (Gemini 3.8 Flash)
    if (
      req.url &&
      req.url.startsWith('/api/story/generate') &&
      req.method === 'POST'
    ) {
      try {
        const body = await parseJsonBody(req);
        const story = await generateStory(body);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(story));
      } catch (err) {
        console.error('Story generation error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({ error: err.message || 'Story generation failed' })
        );
      }
      return;
    }

    // 3. AI Story Narration (Gemini 3.8 Flash TTS with Emotion Tags)
    if (
      req.url &&
      req.url.startsWith('/api/story/narrate') &&
      req.method === 'POST'
    ) {
      try {
        const body = await parseJsonBody(req);
        const narration = await narrateStory(body);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(narration));
      } catch (err) {
        console.error('Story narration error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({ error: err.message || 'Story narration failed' })
        );
      }
      return;
    }

    next();
  };

  return {
    name: 'vite-plugin-server-api',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}

export default defineConfig({
  plugins: [react(), serverApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all',
  },
});
