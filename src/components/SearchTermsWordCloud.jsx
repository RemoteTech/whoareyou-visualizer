import React from 'react';

export default function SearchTermsWordCloud({ terms }) {
  // Normalize font size range (between 14 and 50px)
  const minSize = 14;
  const maxSize = 50;

  const max = Math.max(...terms.map(t => t.count));
  const min = Math.min(...terms.map(t => t.count));

  const getFontSize = (count) => {
    if (max === min) return maxSize;
    return minSize + ((count - min) / (max - min)) * (maxSize - minSize);
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: '8px',
      background: '#f9f9f9',
      marginTop: '2rem'
    }}>
      {terms.map((term, i) => (
        <span
          key={i}
          title={`${term.term} — ${term.count} searches`}
          style={{
            fontSize: `${getFontSize(term.count)}px`,
            color: '#444',
            cursor: 'default',
          }}
        >
          {term.term}
        </span>
      ))}
    </div>
  );
}
