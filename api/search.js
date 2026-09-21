import youtubesearchapi from 'youtube-search-api';

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query?.q || req.query?.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Missing query parameter q', items: [] });
  }

  try {
    const data = await youtubesearchapi.GetListByKeyword(query.trim(), false, 12);
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

    // Cache on Vercel CDN for 10 minutes to speed up repeat queries
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    return res.status(200).json({ items });
  } catch (err) {
    console.error('YouTube search API error:', err);
    return res.status(500).json({ error: err.message, items: [] });
  }
}
