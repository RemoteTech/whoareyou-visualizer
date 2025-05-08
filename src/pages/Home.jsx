import React from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>TikTok Data Visualizer</h1>
      <p>Upload your TikTok data ZIP file to explore your activity.</p>
      <input type="file" accept=".zip" onChange={handleUpload} />
    </div>
  );
}
