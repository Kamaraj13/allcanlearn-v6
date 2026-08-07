import { useEffect, useState } from 'react';

// Single source of truth for the mobile breakpoint.
// Must stay in sync with the 768px media queries in index.css.
const QUERY = '(max-width: 768px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export default useIsMobile;
