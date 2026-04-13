require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3033,
  weatherApiKey: process.env.WEATHER_API_KEY,
};
