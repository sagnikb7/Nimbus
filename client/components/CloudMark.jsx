// The Nimbus cloud mark — lobe circles + a rounded base rect, filled with
// currentColor. Kept in one place so the header logo, empty state, and Settings
// about-mark stay in visual sync with the favicon. (ShareCard keeps its own
// inline copy because html2canvas needs explicit fill colors.)
export default function CloudMark({ className }) {
  return (
    <svg className={className} viewBox="2 4 20 15" fill="currentColor" aria-hidden="true">
      <circle cx="10.2" cy="9.8" r="4.8" />
      <circle cx="15.2" cy="10.8" r="3.6" />
      <circle cx="6.6" cy="12.8" r="3.6" />
      <circle cx="18.2" cy="13.6" r="3.1" />
      <rect x="6.2" y="11.2" width="12.4" height="5.6" rx="2.8" />
    </svg>
  );
}
