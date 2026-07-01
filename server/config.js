require('dotenv').config();

// Provider selection is a CLIENT concern now (sent per request as ?provider=,
// default open-meteo) and each provider resolves its own key from env via its
// descriptor — see server/adapters/. So config only owns the port.
module.exports = {
  port: process.env.PORT || 3033,
};
