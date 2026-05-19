import React from 'react';

export function Skeleton({ width, height, borderRadius = 8, style: extra = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius,
        flexShrink: 0,
        ...extra,
      }}
    />
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '200px',
      maxWidth: '220px',
    }}>
      <Skeleton height="160px" borderRadius={12} />
      <Skeleton height="16px" width="80%" />
      <Skeleton height="12px" width="60%" />
      <Skeleton height="12px" width="45%" />
    </div>
  );
}

export default Skeleton;
