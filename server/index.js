const express = require('express');
const path = require('path');
const { port } = require('./config');
const weatherRoutes = require('./routes/weather');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(weatherRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
