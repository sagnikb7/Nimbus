// ============================================================
// EPA AQI Breakpoint Tables
// Each row: [AQI_low, AQI_high, C_low, C_high]
// Concentrations use EPA-native units (see conversions below).
// ============================================================

const BREAKPOINTS = {
  // PM2.5 — μg/m³ (24-hour / NowCast)
  pm2_5: [
    [0, 50, 0.0, 12.0],
    [51, 100, 12.1, 35.4],
    [101, 150, 35.5, 55.4],
    [151, 200, 55.5, 150.4],
    [201, 300, 150.5, 250.4],
    [301, 400, 250.5, 350.4],
    [401, 500, 350.5, 500.4],
  ],
  // PM10 — μg/m³ (24-hour)
  pm10: [
    [0, 50, 0, 54],
    [51, 100, 55, 154],
    [101, 150, 155, 254],
    [151, 200, 255, 354],
    [201, 300, 355, 424],
    [301, 400, 425, 504],
    [401, 500, 505, 604],
  ],
  // O₃ — ppm (8-hour average)
  o3: [
    [0, 50, 0, 0.054],
    [51, 100, 0.055, 0.070],
    [101, 150, 0.071, 0.085],
    [151, 200, 0.086, 0.105],
    [201, 300, 0.106, 0.200],
  ],
  // NO₂ — ppb (1-hour)
  no2: [
    [0, 50, 0, 53],
    [51, 100, 54, 100],
    [101, 150, 101, 360],
    [151, 200, 361, 649],
    [201, 300, 650, 1249],
    [301, 400, 1250, 1649],
    [401, 500, 1650, 2049],
  ],
  // SO₂ — ppb (1-hour)
  so2: [
    [0, 50, 0, 35],
    [51, 100, 36, 75],
    [101, 150, 76, 185],
    [151, 200, 186, 304],
    [201, 300, 305, 604],
    [301, 400, 605, 804],
    [401, 500, 805, 1004],
  ],
  // CO — ppm (8-hour)
  co: [
    [0, 50, 0.0, 4.4],
    [51, 100, 4.5, 9.4],
    [101, 150, 9.5, 12.4],
    [151, 200, 12.5, 15.4],
    [201, 300, 15.5, 30.4],
    [301, 400, 30.5, 40.4],
    [401, 500, 40.5, 50.4],
  ],
};

// WeatherAPI returns all values in μg/m³ — convert to EPA-native units.
// Conversion uses ideal gas at 25 °C / 1 atm (molar volume 24.45 L).
const CONVERT = {
  pm2_5: (v) => v,                // already μg/m³
  pm10:  (v) => v,                // already μg/m³
  o3:    (v) => v / 1963,         // μg/m³ → ppm  (MW 48)
  no2:   (v) => v / 1.882,        // μg/m³ → ppb  (MW 46)
  so2:   (v) => v / 2.618,        // μg/m³ → ppb  (MW 64)
  co:    (v) => v / 1145,         // μg/m³ → ppm  (MW 28)
};

// Standard EPA linear interpolation within a breakpoint row
function subIndex(table, concentration) {
  for (const [iLo, iHi, cLo, cHi] of table) {
    if (concentration <= cHi) {
      return Math.round(((iHi - iLo) / (cHi - cLo)) * (concentration - cLo) + iLo);
    }
  }
  return 500; // above highest breakpoint
}

// Calculates the numeric US AQI (0–500) from raw pollutant concentrations.
// Returns { aqi, dominant } or null if no pollutant data is available.
export function calculateAQI(airQuality) {
  if (!airQuality) return null;

  let maxAqi = 0;
  let dominant = null;
  let calculated = false;

  const pollutants = [
    { key: 'pm2_5', bp: 'pm2_5' },
    { key: 'pm10',  bp: 'pm10' },
    { key: 'o3',    bp: 'o3' },
    { key: 'no2',   bp: 'no2' },
    { key: 'so2',   bp: 'so2' },
    { key: 'co',    bp: 'co' },
  ];

  for (const { key, bp } of pollutants) {
    const raw = airQuality[key];
    if (raw == null) continue;
    const converted = CONVERT[key](raw);
    const si = subIndex(BREAKPOINTS[bp], Math.max(0, converted));
    calculated = true;
    if (si > maxAqi) {
      maxAqi = si;
      dominant = key;
    }
  }

  return calculated ? { aqi: maxAqi, dominant } : null;
}


// ============================================================
// AQI Level Metadata
// ============================================================

export const AQI_LEVELS = [
  {
    index: 1,
    label: 'Good',
    className: 'good',
    color: '#10b981',
    rangeMin: 0,
    rangeMax: 50,
    range: '0–50',
    healthSummary: 'Air quality is satisfactory with little or no health risk.',
    sensitiveAdvice: 'No precautions needed.',
    outdoorGuidance: 'Great conditions for outdoor activities.',
  },
  {
    index: 2,
    label: 'Moderate',
    className: 'moderate',
    color: '#fbbf24',
    rangeMin: 51,
    rangeMax: 100,
    range: '51–100',
    healthSummary: 'Air quality is acceptable. Unusually sensitive people may experience minor effects.',
    sensitiveAdvice: 'Consider reducing prolonged outdoor exertion if you experience symptoms.',
    outdoorGuidance: 'Suitable for most outdoor activities.',
  },
  {
    index: 3,
    label: 'Unhealthy (Sensitive)',
    className: 'unhealthy-sensitive',
    color: '#fb923c',
    rangeMin: 101,
    rangeMax: 150,
    range: '101–150',
    healthSummary: 'Sensitive groups may experience health effects. The general public is less likely to be affected.',
    sensitiveAdvice: 'People with heart/lung disease, older adults, and children should reduce outdoor exertion.',
    outdoorGuidance: 'Sensitive groups should limit outdoor activity. Others can be active but watch for symptoms.',
  },
  {
    index: 4,
    label: 'Unhealthy',
    className: 'unhealthy',
    color: '#ef4444',
    rangeMin: 151,
    rangeMax: 200,
    range: '151–200',
    healthSummary: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.',
    sensitiveAdvice: 'Everyone should reduce outdoor exertion. Sensitive groups should avoid outdoor activity.',
    outdoorGuidance: 'Reduce outdoor activities. Move exercise indoors when possible.',
  },
  {
    index: 5,
    label: 'Very Unhealthy',
    className: 'very-unhealthy',
    color: '#a855f7',
    rangeMin: 201,
    rangeMax: 300,
    range: '201–300',
    healthSummary: 'Health alert: increased risk of health effects for everyone.',
    sensitiveAdvice: 'Everyone should avoid prolonged outdoor exertion. Sensitive groups should remain indoors.',
    outdoorGuidance: 'Avoid outdoor activities. Keep windows closed.',
  },
  {
    index: 6,
    label: 'Hazardous',
    className: 'hazardous',
    color: '#881337',
    rangeMin: 301,
    rangeMax: 500,
    range: '301–500',
    healthSummary: 'Health warning: emergency conditions. Everyone is at risk.',
    sensitiveAdvice: 'Avoid all outdoor physical activity. Stay indoors with air filtration if possible.',
    outdoorGuidance: 'Stay indoors. Avoid all outdoor physical activity.',
  },
];

// Maps a numeric AQI (0–500) to its level object
export function getAQILevel(numericAqi) {
  if (numericAqi == null || numericAqi <= 50) return AQI_LEVELS[0];
  if (numericAqi <= 100) return AQI_LEVELS[1];
  if (numericAqi <= 150) return AQI_LEVELS[2];
  if (numericAqi <= 200) return AQI_LEVELS[3];
  if (numericAqi <= 300) return AQI_LEVELS[4];
  return AQI_LEVELS[5];
}

// Fallback: maps the EPA category index (1–6) to its level object
export function getAQILevelFromEpa(epaIndex) {
  const i = Math.max(0, Math.min(5, (epaIndex || 1) - 1));
  return AQI_LEVELS[i];
}


// ============================================================
// Pollutant Reference Data
// ============================================================

export const POLLUTANT_INFO = {
  pm2_5: {
    key: 'pm2_5',
    label: 'PM2.5',
    fullName: 'Fine Particulate Matter',
    unit: 'μg/m³',
    description: 'Particles under 2.5 micrometers that penetrate deep into lungs and can enter the bloodstream.',
    goodThreshold: 12,
    sources: 'Vehicle exhaust, wildfires, power plants, cooking',
  },
  pm10: {
    key: 'pm10',
    label: 'PM10',
    fullName: 'Coarse Particulate Matter',
    unit: 'μg/m³',
    description: 'Particles under 10 micrometers including dust, pollen, and mold spores.',
    goodThreshold: 54,
    sources: 'Dust, construction, agriculture, road debris',
  },
  o3: {
    key: 'o3',
    label: 'O\u2083',
    fullName: 'Ozone',
    unit: 'μg/m³',
    description: 'Ground-level ozone formed by sunlight reacting with pollutants. Triggers asthma and reduces lung function.',
    goodThreshold: 60,
    sources: 'Formed by NOx and VOCs reacting in sunlight',
  },
  no2: {
    key: 'no2',
    label: 'NO\u2082',
    fullName: 'Nitrogen Dioxide',
    unit: 'μg/m³',
    description: 'A gas from burning fuel that irritates airways and worsens respiratory conditions.',
    goodThreshold: 53,
    sources: 'Traffic, power plants, industrial processes',
  },
  so2: {
    key: 'so2',
    label: 'SO\u2082',
    fullName: 'Sulfur Dioxide',
    unit: 'μg/m³',
    description: 'A gas from burning sulfur-containing fuels that causes breathing difficulties.',
    goodThreshold: 35,
    sources: 'Power plants, refineries, metal smelting',
  },
  co: {
    key: 'co',
    label: 'CO',
    fullName: 'Carbon Monoxide',
    unit: 'μg/m³',
    description: 'A colorless, odorless gas from incomplete combustion that reduces oxygen delivery to organs.',
    goodThreshold: 4400,
    sources: 'Vehicle exhaust, generators, stoves, fireplaces',
  },
};


// ============================================================
// Pollutant Helpers
// ============================================================

// Returns 'good' | 'moderate' | 'poor' | 'bad' for a pollutant value vs its safe threshold
export function getPollutantStatus(value, goodThreshold) {
  if (value == null) return 'unknown';
  const ratio = value / goodThreshold;
  if (ratio <= 1) return 'good';
  if (ratio <= 2.5) return 'moderate';
  if (ratio <= 5) return 'poor';
  return 'bad';
}

// Returns the primary (worst) pollutant by how far it exceeds its threshold
export function getPrimaryPollutant(airQuality) {
  if (!airQuality) return null;

  let highest = null;
  let highestRatio = 0;

  for (const info of Object.values(POLLUTANT_INFO)) {
    const value = airQuality[info.key];
    if (value == null) continue;
    const ratio = value / info.goodThreshold;
    if (ratio > highestRatio) {
      highestRatio = ratio;
      highest = { ...info, value, ratio };
    }
  }

  return highest;
}

// Returns all available pollutants sorted by concern level (highest ratio first)
export function getSortedPollutants(airQuality) {
  if (!airQuality) return [];

  return Object.values(POLLUTANT_INFO)
    .map((info) => ({
      ...info,
      value: airQuality[info.key],
      ratio: airQuality[info.key] != null ? airQuality[info.key] / info.goodThreshold : 0,
    }))
    .filter((p) => p.value != null)
    .sort((a, b) => b.ratio - a.ratio);
}

function round(v) {
  return Math.round(v * 10) / 10;
}

// Generates a plain-language AQI summary
export function getAQISummary(airQuality) {
  if (!airQuality) return 'Air quality data is not available.';

  const result = calculateAQI(airQuality);
  const epa = airQuality['us-epa-index'];
  const level = result ? getAQILevel(result.aqi) : getAQILevelFromEpa(epa);
  const primary = getPrimaryPollutant(airQuality);

  const sentences = [];
  if (result) {
    sentences.push(`Air quality is currently rated ${level.label.toLowerCase()} with a US AQI of ${result.aqi}.`);
  } else {
    sentences.push(`Air quality is currently rated ${level.label.toLowerCase()}.`);
  }

  if (primary) {
    if (primary.ratio > 2) {
      sentences.push(
        `${primary.fullName} (${primary.label}) is elevated at ${round(primary.value)} ${primary.unit}.`
      );
    } else if (primary.ratio > 1) {
      sentences.push(
        `${primary.fullName} (${primary.label}) is the primary concern at ${round(primary.value)} ${primary.unit}.`
      );
    } else {
      sentences.push('All pollutants are within acceptable ranges.');
    }
  }

  sentences.push(level.healthSummary);

  return sentences.join(' ');
}
