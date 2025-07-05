import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
 

export default function Home() {
  const navigate = useNavigate();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      // Navigate to dashboard with file in state
      navigate('/dashboard', { state: { zipFile: file } });
    } else {
      alert('Please upload a valid .zip file from TikTok.');
    }
  };

   useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>WhoAreYou TikTok Algorithm Persona</h1>
      <p>Upload your TikTok data ZIP file to explore your data and analysis.</p>
      <input type="file" accept=".zip" onChange={handleUpload} />
      <section style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2>📥 How to Download Your TikTok Data</h2>
        <ol style={{ lineHeight: '1.6' }}>
          <li>Go to <a href="https://www.tiktok.com/setting/download-your-data" target="_blank" rel="noopener noreferrer">TikTok’s Download Your Data page</a></li>
          <li>Choose <strong>"All Data"</strong> and select the file format <strong>".TXT"</strong></li>
          <li>Submit the request — TikTok will notify you by email when your data is ready</li>
          <li>Download the <code>.zip</code> file from the same TikTok page once available</li>
          <li>Return to this site and upload your TikTok data ZIP file to view your report</li>
        </ol>
        <p><strong>✅ Tip:</strong> Be sure to include <em>Watch History</em>, <em>Likes</em>, and <em>Searches</em> when exporting.</p>
      </section>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-6011504846169529"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}
