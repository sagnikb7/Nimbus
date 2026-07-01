const express = require('express');
const path = require('path');
const { port } = require('./config');
const weatherRoutes = require('./routes/weather');
const { listProviders } = require('./adapters');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(weatherRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  // Report which providers are usable in this environment (key present or keyless).
  const providers = listProviders()
    .map((p) => `${p.id}${p.available ? '' : ' (no key — unavailable)'}`)
    .join(', ');
  console.log(`Weather providers: ${providers}`);
});
