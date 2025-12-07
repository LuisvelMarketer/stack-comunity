/**
 * Converts various video URLs to embeddable format
 * Supports: YouTube, Vimeo, and direct embed URLs
 */
export function getEmbedUrl(url: string): string {
  if (!url) return "";

  // Already an embed URL
  if (url.includes("/embed/") || url.includes("player.vimeo.com")) {
    return url;
  }

  // YouTube URLs
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
  }

  // Vimeo URLs
  const vimeoPattern = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Loom URLs
  const loomPattern = /loom\.com\/share\/([a-zA-Z0-9]+)/;
  const loomMatch = url.match(loomPattern);
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  // Return original URL if no pattern matches (might be a direct embed)
  return url;
}