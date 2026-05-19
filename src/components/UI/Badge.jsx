import React from 'react';
import { topicGradient } from '../../services/api';

function topicToColor(topic = '') {
  const [c1] = topicGradient(topic);
  return c1;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

export function Badge({ children, topic, color, style: extra = {}, ...props }) {
  const baseColor = color || (topic ? topicToColor(topic) : 'var(--accent)');
  const rgb = baseColor.startsWith('#') ? hexToRgb(baseColor) : null;
  const bgColor = rgb ? `rgba(${rgb},0.15)` : 'rgba(124,58,237,0.15)';
  const textColor = baseColor;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: bgColor,
        color: textColor,
        border: `1px solid ${bgColor}`,
        whiteSpace: 'nowrap',
        ...extra,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
