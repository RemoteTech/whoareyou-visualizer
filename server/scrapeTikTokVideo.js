const puppeteer = require('puppeteer');

async function scrapeTikTokVideo(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for main content
    await page.waitForSelector('h1[data-e2e="browse-video-desc"]', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const caption = document.querySelector('h1[data-e2e="browse-video-desc"]')?.innerText || '';
      const user = document.querySelector('a[data-e2e="browse-username"]')?.innerText || '';
      const sound = document.querySelector('a[data-e2e="browse-music-link"]')?.innerText || '';
      const hashtags = Array.from(document.querySelectorAll('strong')).map(el => el.innerText).filter(tag => tag.startsWith('#'));
      return { caption, user, sound, hashtags };
    });

    return { ...data, url };
  } catch (error) {
    console.error(`Failed to scrape ${url}`, error.message);
    return { error: true, url };
  } finally {
    await browser.close();
  }
}

module.exports = scrapeTikTokVideo;
