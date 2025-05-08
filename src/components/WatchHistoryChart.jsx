import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

export default function WatchHistoryChart({ zipFile }) {
  const [chartData, setChartData] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const parseWatchHistory = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);

        const file = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('watch history.txt')
        );

        if (!file) {
          setStatus('Watch History.txt not found.');
          return;
        }

        const text = await file.async('string');
        const lines = text.split('\n');

        const dateCounts = {};
        const videos = [];
        let currentDate = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith('Date:')) {
            currentDate = line.replace('Date:', '').trim().split(' ')[0];
            dateCounts[currentDate] = (dateCounts[currentDate] || 0) + 1;
          }

          if (line.startsWith('Link:')) {
            const url = line.replace('Link:', '').trim();
            videos.push({ date: currentDate, url });
          }
        }

        const chart = Object.entries(dateCounts)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setChartData(chart);
        setVideoList(videos);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Failed to parse watch history.');
      }
    };

    parseWatchHistory();
  }, [zipFile]);

  const getVideoId = (url) => {
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  return (
    <div>
      <h2>Watch Activity by Date</h2>
      {status && <p>{status}</p>}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {videoList.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Watched Videos</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {videoList.map((video, index) => {
              const videoId = getVideoId(video.url);
              const thumbnailUrl = videoId
                ? `https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/${videoId}_~tplv-obj.image`
                : null;

              return (
                <li key={index} style={{ marginBottom: '1rem' }}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        style={{ height: 120, display: 'block' }}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : null}
                    {video.url}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}