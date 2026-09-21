import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import youtubesearchapi from 'youtube-search-api'

function youtubeSearchPlugin() {
  return {
    name: 'vite-plugin-youtube-search',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
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
                const thumb = item.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
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
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), youtubeSearchPlugin()],
  server: {
    port: 3000,
    open: true
  }
})

