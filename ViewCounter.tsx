import React, { useEffect, useState } from 'react';

const ViewCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using countapi.xyz with a specific namespace for this app
    // Namespace: minecraft-randomizer-v5, Key: visits
    fetch('https://api.countapi.xyz/hit/minecraft-randomizer-v5/visits')
      .then(response => response.json())
      .then(data => {
        setCount(data.value);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching view count:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{count ? count.toLocaleString() : '---'} Views</span>
    </div>
  );
};

export default ViewCounter;
