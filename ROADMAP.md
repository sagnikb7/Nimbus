# Nimbus Roadmap

## Standout Features

These are differentiators — things most weather apps don't do well.

- [ ] **"What should I wear?" recommendations** — Use feels-like temp, wind, UV, and precipitation probability to generate outfit/activity suggestions. Simple rule-based logic, high user delight.
- [ ] **Precipitation timeline** — Slim bar chart showing "rain starts in 23 min, lasts ~45 min." The killer feature that made Dark Sky famous. Powered by WeatherAPI's minute-by-minute data.
- [ ] **Weather comparison** — Side-by-side comparison of two saved cities. Useful for "should I stay here or drive to the coast?" decisions.
- [ ] **Moon phase + golden hour** — Extend the sunrise/sunset arc with moon phase, golden hour, and blue hour. A go-to for photographers and outdoor enthusiasts.
- [ ] **Natural language daily summary** — One-liner derived from hourly data: *"Warm morning, rain likely after 2 PM, clearing by evening."* Numbers are useful; words are memorable.

## High-Impact Gaps

Features users expect from a serious weather app.

- [ ] **7-10 day forecast** — 3 days feels limited. Upgrade WeatherAPI tier and extend the Forecast component.
- [ ] **Severe weather alerts** — NWS alerts or WeatherAPI's alerts endpoint. Safety feature and trust builder.
- [ ] **Hourly rain probability** — Add precipitation % to the HourlyForecast component. Small indicator, big utility.
- [ ] **Auto-detect location on first visit** — Prompt geolocation on load instead of requiring manual search or GPS click.

## Polish

Small additions that compound into a premium feel.

- [ ] **Dew point + "feels like" explainer** — Tooltip or expandable pill explaining wind chill vs. heat index. Matches the educational depth already in AQI/Wind detail overlays.
- [ ] **Animated precipitation radar** — Embedded map with rain overlay via RainViewer API (free). Visually impressive and practical.
- [ ] **Daily notification** — Leverage PWA setup to send a morning weather briefing push notification.

## Suggested Build Order

Priority based on effort-to-impact ratio:

1. Natural language daily summary (low effort, high delight)
2. 7-10 day forecast (removes the biggest "incomplete" signal)
3. Precipitation timeline (single most useful feature in any weather app)
4. Hourly rain probability (small change, big utility)
5. Auto-detect location on first visit (friction removal)
6. "What should I wear?" recommendations (differentiator)
7. Severe weather alerts (trust and safety)
8. Moon phase + golden hour (niche but memorable)
9. Dew point + "feels like" explainer (educational polish)
10. Weather comparison (power-user feature)
11. Animated precipitation radar (visual wow factor, more complex)
12. Daily notification (requires notification permission UX)
