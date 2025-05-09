import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#AF19FF'];

export default function LikesChart({ zipFile }) {
  const [likesData, setLikesData] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const parseLikes = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);

        const jsonFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('user_data_tiktok.json')
        );

        const txtFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('like list.txt')
        );

        const domainCount = {};

        if (jsonFile) {
          const text = await jsonFile.async('string');
          const json = JSON.parse(text);
          const likes = json['Likes and Favorites']?.['Like List'];

          if (likes && Array.isArray(likes)) {
            likes.forEach(item => {
              try {
                const url = item.Link;
                const domain = new URL(url).hostname.replace('www.', '');
                domainCount[domain] = (domainCount[domain] || 0) + 1;
              } catch {
                // ignore malformed URLs
              }
            });
          }
        } else if (txtFile) {
          const text = await txtFile.async('string');
          const lines = text.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('Link:')) {
              const url = lines[i].replace('Link:', '').trim();
              try {
                const domain = new URL(url).hostname.replace('www.', '');
                domainCount[domain] = (domainCount[domain] || 0) + 1;
              } catch {
                continue;
              }
            }
          }
        } else {
          setStatus('Like List not found in .txt or .json');
          return;
        }

        const chartData = Object.entries(domainCount).map(([name, value]) => ({ name, value }));
        setLikesData(chartData);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Error parsing likes.');
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