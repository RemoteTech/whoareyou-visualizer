const express = require('express');
const cors = require('cors');
const scrapeTikTokVideo = require('./scrapeTikTokVideo');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  const data = await scrapeTikTokVideo(url);
  res.json(data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Scraper server running on port ${PORT}`));
