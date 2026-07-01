// Shared ✕ close button for full-screen overlays. The class + label vary per
// overlay (aqi-detail-close / wind-detail-close / settings-close), so pass them in.
export default function CloseButton({ className, onClick, label = 'Close' }) {
  return (
    <button className={className} onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
