import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WatchHistoryChart({ zipFile }) {
  const [chartData, setChartData] = useState([]);
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

        lines.forEach(line => {
          if (line.startsWith('Date:')) {
            const dateStr = line.replace('Date:', '').trim().split(' ')[0];
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          }
        });

        const data = Object.entries(dateCounts)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setChartData(data);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Failed to parse watch history.');
      }
    };

    parseWatchHistory();
  }, [zipFile]);

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
    </div>
  );
}