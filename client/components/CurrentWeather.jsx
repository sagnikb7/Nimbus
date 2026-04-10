import useAnimatedNumber from '../hooks/useAnimatedNumber';
import SunriseSunset from './SunriseSunset';

export default function CurrentWeather({ data, isSaved, canSave, onToggleSave, onShare, sharing, astro, tempUnit }) {
  const { location, current } = data;
  const u = tempUnit === 'c' ? 'temp_c' : 'temp_f';
  const fu = tempUnit === 'c' ? 'feelslike_c' : 'feelslike_f';

  const date = new Date(location.localtime);
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const icon = current.condition.icon;
  const iconUrl = icon.startsWith('//') ? `https:${icon}` : icon;

  const animTemp = useAnimatedNumber(Math.round(current[u]));
  const animFeels = useAnimatedNumber(Math.round(current[fu]));

  return (
    <div className="current-weather">
      <div className="current-actions">
        <button
          className="share-btn"
          onClick={onShare}
          disabled={sharing}
          title="Share weather"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
        <button
          className={`save-btn${isSaved ? ' saved' : ''}`}
          onClick={onToggleSave}
          disabled={!isSaved && !canSave}
          title={
            isSaved
              ? 'Remove from saved'
              : canSave
                ? 'Save location'
                : 'Maximum 5 locations'
          }
        >
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={isSaved ? 'currentColor' : 'none'}>
            <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </button>
      </div>

      <div className="current-location">
        <h2 className="current-city">{location.name}</h2>
        <p className="current-region">
          {[location.region, location.country].filter(Boolean).join(', ')}
        </p>
        <p className="current-date">{formatted}</p>
      </div>

      <div className="current-temp-group">
        <span className="current-temp">{animTemp}&deg;</span>
        <div className="current-condition">
          <img src={iconUrl} alt={current.condition.text} />
          <span>{current.condition.text}</span>
        </div>
        <p className="current-feels">
          Feels like {animFeels}&deg;
        </p>
      </div>

      {astro && (
        <SunriseSunset astro={astro} localtime={location.localtime} />
      )}
    </div>
  );
}
