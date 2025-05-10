const fetch = require('node-fetch');

async function scrapeTikTokVideo(shareUrl) {
  try {
    const videoIdMatch = shareUrl.match(/video\/(\d+)/);
    if (!videoIdMatch) {
      return { error: 'Invalid TikTok URL', url: shareUrl };
    }

    const videoId = videoIdMatch[1];

    // Use oEmbed with fallback video URL
    const oEmbedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/video/${videoId}`;

    const response = await fetch(oEmbedUrl);
    if (!response.ok) throw new Error('oEmbed request failed');

    const data = await response.json();

    return {
      videoId,
      url: data.url,
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url
    };
  } catch (err) {
    console.error(`Failed to scrape ${shareUrl}:`, err.message);
    return { error: true, message: err.message, url: shareUrl };
  }
}

module.exports = scrapeTikTokVideo;
