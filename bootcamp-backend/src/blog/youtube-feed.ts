// src/blog/youtube-feed.ts
// Lee los últimos videos del canal de YouTube desde su feed RSS público.
// No necesita clave de API. El resultado se guarda en memoria 30 minutos.

export interface VideoYoutube {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

const CACHE_MS = 30 * 60 * 1000;
let cache: { at: number; channel: string; videos: VideoYoutube[] } | null = null;

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};

export async function obtenerVideosYoutube(channelId: string): Promise<VideoYoutube[]> {
  if (!channelId) return [];
  if (cache && cache.channel === channelId && Date.now() - cache.at < CACHE_MS) {
    return cache.videos;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    const videos = (xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [])
      .map((entry) => ({
        videoId: tag(entry, 'yt:videoId'),
        title: tag(entry, 'title'),
        description: tag(entry, 'media:description'),
        publishedAt: tag(entry, 'published'),
      }))
      .filter((v) => v.videoId && v.title)
      .slice(0, 12);

    cache = { at: Date.now(), channel: channelId, videos };
    return videos;
  } catch {
    // Sin internet o YouTube caído: se usa lo último que se tenga
    return cache?.videos ?? [];
  }
}
