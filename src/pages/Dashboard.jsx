import SignalsReport from '../components/SignalsReport';
import { useLocation } from 'react-router-dom';
import LikesChart from '../components/LikesChart';
import WatchHistoryChart from '../components/WatchHistoryChart';
import SearchTermsChart from '../components/SearchTermsChart';
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const location = useLocation();
  const [view, setView] = useState('report');
  const zipFile = location.state?.zipFile;

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }, []);
  
  if (!zipFile) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>No data file uploaded</h2>
        <p>Please return to the homepage and upload your TikTok data zip.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setView('report')}>My WhoAreYou On TikTok Report</button>
        <button onClick={() => setView('search')}>Search Terms</button>
        <button onClick={() => setView('likes')}>Likes</button>
        <button onClick={() => setView('watch')}>Watch History</button>
      </div>
      {view === 'report' && <SignalsReport zipFile={zipFile} />}
      {view === 'search' && <SearchTermsChart zipFile={zipFile} />}
      {view === 'likes' && <LikesChart zipFile={zipFile} />}
      {view === 'watch' && <WatchHistoryChart zipFile={zipFile} />}
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-6011504846169529"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
