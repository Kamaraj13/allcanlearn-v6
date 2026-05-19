import React from 'react';

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};

const variants = {
  primary: {
    background: 'var(--gradient)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  },
  secondary: {
    background: 'var(--surface2)',
    color: 'var(--text)',
    border: '1px solid var(--border-h)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--muted)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'rgba(239,68,68,0.15)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  icon: {
    background: 'transparent',
    color: 'var(--muted)',
    borderRadius: '8px',
    padding: '6px',
  },
};

const sizes = {
  sm:  { fontSize: '0.8125rem', padding: '6px 12px' },
  md:  { fontSize: '0.9375rem', padding: '10px 20px' },
  lg:  { fontSize: '1rem',      padding: '14px 28px' },
  xl:  { fontSize: '1.125rem',  padding: '16px 36px' },
  icon:{ fontSize: '1rem',      padding: '8px' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style: extraStyle = {},
  ...props
}) {
  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle    = sizes[size] || sizes.md;

  return (
    <button
      disabled={disabled || loading}
      style={{
        ...styles.base,
        ...variantStyle,
        ...sizeStyle,
        opacity: disabled || loading ? 0.55 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...extraStyle,
      }}
      {...props}
    >
      {loading ? (
        <span style={{
          width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block'
        }} />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
