import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import SearchTermsWordCloud from './SearchTermsWordCloud';

export default function SearchTermsChart({ zipFile }) {
  const [status, setStatus] = useState('Loading...');
  const [searchTerms, setSearchTerms] = useState([]);
  const [sortMethod, setSortMethod] = useState('frequency');

  useEffect(() => {
    const parseSearches = async () => {
      try {
        const zip = await JSZip.loadAsync(zipFile);

        const searchFile = Object.values(zip.files).find(f =>
          f.name.toLowerCase().endsWith('searches.txt')
        );        

        if (!searchFile) {
          setStatus('Searches.txt not found in the zip file.');
          return;
        }

        const text = await searchFile.async('string');
        const lines = text.split('\n');

        const termMap = {};
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('SearchTerm:')) {
            const term = line.replace('SearchTerm:', '').trim().toLowerCase();
            if (term) termMap[term] = (termMap[term] || 0) + 1;
          }
        }

        const termArray = Object.entries(termMap).map(([term, count]) => ({
          term, count
        }));

        setSearchTerms(termArray);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Failed to parse search terms.');
      }
    };

    parseSearches();
  }, [zipFile]);

  const sortedTerms = [...searchTerms].sort((a, b) => {
    if (sortMethod === 'frequency') return b.count - a.count;
    if (sortMethod === 'az') return a.term.localeCompare(b.term);
    if (sortMethod === 'za') return b.term.localeCompare(a.term);
    return 0;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔍 Search Terms Analysis</h2>
      {status && <p>{status}</p>}

      {!status && (
        <>
          <div style={{ margin: '1rem 0' }}>
            <label>Sort by: </label>
            <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value)}>
              <option value="frequency">Most Frequent</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedTerms.slice(0, 15)}>
              <XAxis dataKey="term" angle={-45} textAnchor="end" interval={0} height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <section style={{ marginTop: '2rem' }}>
            <h3>☁️ Search Term Word Cloud</h3>
            <SearchTermsWordCloud terms={sortedTerms.slice(0, 50)} />
          </section>

          <ul style={{ marginTop: '2rem' }}>
            {sortedTerms.map((item, i) => (
              <li key={i}>
                {item.term} — {item.count} search{item.count > 1 ? 'es' : ''}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}