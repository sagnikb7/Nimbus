require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  weatherApiKey: process.env.WEATHER_API_KEY,
};
