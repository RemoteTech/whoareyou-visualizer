import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#AF19FF'];

export default function LikesChart({ zipFile }) {
  const [likesData, setLikesData] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const parseLikes = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);
        const file = Object.values(zip.files).find(f => {
          const name = f.name.toLowerCase();
          return name.includes('like list.txt') || name.includes('likes.json');
        });
        
        
        if (!file) {
          setStatus('Like List.txt not found.');
          return;
        }

        const text = await file.async('string');
        if (text.includes('no data')) {
          setStatus('No likes data found.');
          return;
        }

        const domainCount = {};
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('Link:')) {
            try {
              const url = lines[i].replace('Link:', '').trim();
              const domain = new URL(url).hostname.replace('www.', '');
              domainCount[domain] = (domainCount[domain] || 0) + 1;
            } catch {
              continue;
            }
          }
        }

        const chartData = Object.entries(domainCount).map(([name, value]) => ({ name, value }));
        setLikesData(chartData);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Failed to parse likes.');
      }
    };

    parseLikes();
  }, [zipFile]);

  return (
    <div>
      <h2>Likes by Domain</h2>
      {status && <p>{status}</p>}
      {likesData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={likesData}
            dataKey="value"
            nameKey="name"
            outerRadius={150}
            label
          >
            {likesData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>
);
}