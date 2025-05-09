import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import html2pdf from 'html2pdf.js';
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

  const reportRef = useRef(null);

  useEffect(() => {
    const parseTxtFiles = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);

        const watchFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('watch history.txt')
        );

        const likesFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('like list.txt')
        );

        const searchFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().includes('searches.txt')
        );

        if (!watchFile || !likesFile || !searchFile) {
          setStatus('One or more .txt files not found (watch, like, search).');
          return;
        }

        const [watchText, likesText, searchText] = await Promise.all([
          watchFile.async('string'),
          likesFile.async('string'),
          searchFile.async('string')
        ]);

        // Parse Watch History
        const lines = watchText.split('\n');
        const viewMap = {};
        const hourMap = {};
        const domainMap = {};
        let currentDateTime = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith('Date:')) {
            currentDateTime = line.replace('Date:', '').trim();
          }

          if (line.startsWith('Link:')) {
            const url = line.replace('Link:', '').trim();
            const domain = getDomain(url);
            const date = new Date(currentDateTime);
            const hour = date.getHours();

            viewMap[url] = (viewMap[url] || 0) + 1;
            hourMap[hour] = (hourMap[hour] || 0) + 1;
            if (domain) domainMap[domain] = (domainMap[domain] || 0) + 1;
          }
        }

        const repeats = Object.entries(viewMap)
          .filter(([_, count]) => count > 1)
          .map(([link, count]) => ({ link, count }));

        const hourDist = Object.entries(hourMap).map(([hour, count]) => ({
          hour: `${hour}:00`, count
        }));

        const domainDist = Object.entries(domainMap).map(([name, value]) => ({
          name, value
        }));

        // Parse Likes
        const likes = (likesText.match(/Link:/g) || []).length;
        const watches = Object.values(viewMap).reduce((sum, c) => sum + c, 0);
        const likeRatio = watches > 0 ? likes / watches : 0;

        // Parse Searches
        const searchLines = searchText.split('\n');
        const searchMap = {};
        for (let line of searchLines) {
          if (line.startsWith('SearchTerm:')) {
            const term = line.replace('SearchTerm:', '').trim().toLowerCase();
            if (term) searchMap[term] = (searchMap[term] || 0) + 1;
          }
        }

        const searchList = Object.entries(searchMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([term, count]) => ({ term, count }));

        setRepeatViews(repeats);
        setLikesToWatchRatio(likeRatio);
        setTopSearches(searchList);
        setTimeOfDayDist(hourDist);
        setTopDomains(domainDist);
        setPersonaLabel(buildPersonaLabel(likeRatio, hourMap, searchList));
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Error parsing .txt files.');
      }
    };

    parseTxtFiles();
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

  const exportToPDF = () => {
    const element = reportRef.current;
    html2pdf().set({
      margin: 0.5,
      filename: 'whoareyou_tiktok_report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save();
  };

  return (
    <div ref={reportRef} style={{ padding: '2rem' }}>
      <h1>My WhoAreYou On TikTok Report</h1>
      {status && <p>{status}</p>}

      {!status && (
        <>
          <section>
            <h2>🧠 Algorithm Signals</h2>
            <p><strong>Persona:</strong> {personaLabel}</p>
            <p><strong>Likes-to-Watch Ratio:</strong> {(likesToWatchRatio * 100).toFixed(1)}%</p>
            <p><strong>Repeat Videos:</strong> {repeatViews.length}</p>
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
            <button onClick={exportToPDF}>📄 Export to PDF</button>
          </div>
        </>
      )}
    </div>
  );
}