import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#AF19FF'];

export default function SignalsReport({ zipFile }) {
  const [status, setStatus] = useState('Loading...');
  const [repeatViews, setRepeatViews] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [likesToWatchRatio, setLikesToWatchRatio] = useState(0);
  const [timeOfDayDist, setTimeOfDayDist] = useState([]);
  const [topDomains, setTopDomains] = useState([]);
  const [personaLabel, setPersonaLabel] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);
        const file = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('user_data_tiktok.json')
        );

        if (!file) {
          setStatus('user_data_tiktok.json not found.');
          return;
        }

        const text = await file.async('string');
        const json = JSON.parse(text);

        const watch = json['Watch History']?.['VideoList'] || [];
        const likes = json['Likes and Favorites']?.['Like List'] || [];
        const searches = json['Your Activity']?.['Searches']?.['SearchList'] || [];

        // Repeat views
        const viewMap = {};
        const hourMap = {};
        const domainMap = {};
        watch.forEach(({ Link, Date }) => {
          const date = new Date(Date);
          const hour = date.getHours();
          const domain = getDomain(Link);

          viewMap[Link] = (viewMap[Link] || 0) + 1;
          hourMap[hour] = (hourMap[hour] || 0) + 1;
          if (domain) domainMap[domain] = (domainMap[domain] || 0) + 1;
        });

        const repeats = Object.entries(viewMap)
          .filter(([_, count]) => count > 1)
          .map(([link, count]) => ({ link, count }));

        const hourDist = Object.entries(hourMap).map(([hour, count]) => ({
          hour: `${hour}:00`, count
        }));

        const domainDist = Object.entries(domainMap).map(([name, value]) => ({
          name, value
        }));

        // Like ratio
        const ratio = watch.length > 0 ? likes.length / watch.length : 0;

        // Top searches
        const searchMap = {};
        searches.forEach(s => {
          const term = s.SearchTerm?.trim().toLowerCase();
          if (term) searchMap[term] = (searchMap[term] || 0) + 1;
        });

        const searchList = Object.entries(searchMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([term, count]) => ({ term, count }));

        setRepeatViews(repeats);
        setLikesToWatchRatio(ratio);
        setTopSearches(searchList);
        setTimeOfDayDist(hourDist);
        setTopDomains(domainDist);

        // Persona label
        const persona = buildPersonaLabel(ratio, hourMap, searchList);
        setPersonaLabel(persona);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Error parsing signal data.');
      }
    };

    loadData();
  }, [zipFile]);

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const buildPersonaLabel = (ratio, hourMap, searchList) => {
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    const timeTag =
      peakHour >= 0 && peakHour < 6 ? 'Late Night' :
      peakHour >= 6 && peakHour < 12 ? 'Morning' :
      peakHour >= 12 && peakHour < 18 ? 'Afternoon' : 'Evening';

    const topTerm = searchList[0]?.term || 'everything';
    const engagement =
      ratio > 0.5 ? 'Highly Engaged' :
      ratio > 0.2 ? 'Moderately Engaged' : 'Passive';

    return `${engagement} ${timeTag} Viewer — Likely into ${topTerm}`;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My WhoAreYou On TikTok Report</h1>
      {status && <p>{status}</p>}

      {!status && (
        <>
          <section style={{ marginTop: '2rem' }}>
            <h2>🧠 Your Algorithm Signals</h2>
            <p><strong>Persona:</strong> {personaLabel}</p>
            <p><strong>Likes-to-Watch Ratio:</strong> {(likesToWatchRatio * 100).toFixed(1)}%</p>
            <p><strong>Repeat Views:</strong> {repeatViews.length}</p>
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h3>⏱ Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeOfDayDist}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h3>🔍 Top Search Terms</h3>
            <ul>
              {topSearches.map((s, i) => (
                <li key={i}>{s.term} — {s.count} search{(s.count > 1) ? 'es' : ''}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h3>🌐 Top Video Domains</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topDomains} dataKey="value" nameKey="name" outerRadius={120} label>
                  {topDomains.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section style={{ marginTop: '2rem' }}>
            <h3>🔁 Repeat Videos</h3>
            <ul>
              {repeatViews.map((v, i) => (
                <li key={i}>
                  <a href={v.link} target="_blank" rel="noopener noreferrer">{v.link}</a> — viewed {v.count}×
                </li>
              ))}
            </ul>
          </section>

          <div style={{ marginTop: '2rem' }}>
            <button onClick={() => alert('PDF export coming soon.')}>📄 Export to PDF</button>
          </div>
        </>
      )}
    </div>
  );
}