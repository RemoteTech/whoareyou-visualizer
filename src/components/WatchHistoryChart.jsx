import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const ITEMS_PER_PAGE = 20;

export default function WatchHistoryChart({ zipFile }) {
  const [chartData, setChartData] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [status, setStatus] = useState('Loading...');
  const [sortMethod, setSortMethod] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);

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
        let currentDateTime = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith('Date:')) {
            currentDateTime = line.replace('Date:', '').trim();
            const dateOnly = currentDateTime.split(' ')[0];
            dateCounts[dateOnly] = (dateCounts[dateOnly] || 0) + 1;
          }

          if (line.startsWith('Link:')) {
            const url = line.replace('Link:', '').trim();
            const videoId = (url.match(/video\/(\d+)/) || [])[1] || null;
            const timeOfDay = getTimeOfDay(currentDateTime.split(' ')[1]);
            const domain = getDomain(url);
            videos.push({
              url,
              dateTime: currentDateTime,
              date: currentDateTime.split(' ')[0],
              time: currentDateTime.split(' ')[1],
              domain,
              timeOfDay,
              videoId,
            });
          }
        }

        const chart = Object.entries(dateCounts)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setChartData(chart);
        setAllVideos(videos);
        setFilteredVideos(videos);
        setStatus('');
      } catch (err) {
        console.error(err);
        setStatus('Failed to parse watch history.');
      }
    };

    parseWatchHistory();
  }, [zipFile]);

  // Sorting and filtering
  useEffect(() => {
    let videos = [...allVideos];
    if (selectedDate) {
      videos = videos.filter(video => video.date === selectedDate);
    }

    switch (sortMethod) {
      case 'date-desc':
        videos.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        break;
      case 'date-asc':
        videos.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        break;
      case 'domain':
        videos.sort((a, b) => a.domain.localeCompare(b.domain));
        break;
      case 'timeofday':
        const order = ['morning', 'afternoon', 'evening', 'night'];
        videos.sort((a, b) =>
          order.indexOf(a.timeOfDay) - order.indexOf(b.timeOfDay)
        );
        break;
      default:
        break;
    }

    setFilteredVideos(videos);
    setCurrentPage(1);
  }, [selectedDate, sortMethod, allVideos]);

  const getVideoId = (url) => {
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const getTimeOfDay = (timeStr) => {
    if (!timeStr) return '';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleBarClick = (data) => {
    if (selectedDate === data.date) {
      setSelectedDate(null); // toggle off
    } else {
      setSelectedDate(data.date);
    }
  };

  return (
    <div>
      <h2>Watch Activity by Date</h2>
      {status && <p>{status}</p>}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} onClick={({ activeLabel }) => handleBarClick({ date: activeLabel })}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {allVideos.length > 0 && (
        <>
          <div style={{ margin: '1rem 0' }}>
            <label>Sort by: </label>
            <select value={sortMethod} onChange={(e) => setSortMethod(e.target.value)}>
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="domain">Domain (A–Z)</option>
              <option value="timeofday">Time of Day</option>
            </select>
          </div>

          {selectedDate && (
            <p>
              Showing videos watched on <strong>{selectedDate}</strong>{' '}
              <button onClick={() => setSelectedDate(null)}>Clear Filter</button>
            </p>
          )}

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {currentVideos.map((video, idx) => (
              <li key={idx} style={{ marginBottom: '1rem' }}>
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  {video.videoId && (
                    <img
                      src={`https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/${video.videoId}_~tplv-obj.image`}
                      alt="Thumbnail"
                      style={{ height: 100, marginRight: '1rem', verticalAlign: 'middle' }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  )}
                  {video.url}
                </a>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                  Viewed on: {video.dateTime} | Domain: {video.domain} | Time: {video.timeOfDay}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                Prev
              </button>
              <span style={{ margin: '0 1rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}