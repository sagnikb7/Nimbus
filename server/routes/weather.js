const express = require('express');
const axios = require('axios');
const { weatherApiKey } = require('../config');

const router = express.Router();

router.get('/api/weather', async (req, res) => {
  const city = req.query.city;

  if (!city) {
    return res.status(400).json({ error: 'City query parameter is required' });
  }

  if (!weatherApiKey) {
    return res.status(500).json({ error: 'Weather API key is not configured' });
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(city)}&days=3&aqi=yes`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || 'Failed to fetch weather data';
    res.status(status).json({ error: message });
  }
});

module.exports = router;
