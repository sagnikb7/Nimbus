exports.handler = async (event) => {
  const city = event.queryStringParameters?.city;

  if (!city) {
    return { statusCode: 400, body: JSON.stringify({ error: 'City query parameter is required' }) };
  }

  const weatherApiKey = process.env.WEATHER_API_KEY;
  if (!weatherApiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Weather API key is not configured' }) };
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(city)}&days=3&aqi=yes`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: data.error?.message || 'Failed to fetch weather data' }) };
    }

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch weather data' }) };
  }
};
