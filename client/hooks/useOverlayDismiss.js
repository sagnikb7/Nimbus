import { useEffect } from 'react';

// Shared full-screen-overlay behavior (AQIDetail / WindDetail / SettingsPanel):
// lock body scroll while mounted, and close on Escape.
export default function useOverlayDismiss(onClose) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}
