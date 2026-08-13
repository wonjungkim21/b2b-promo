const express = require('express');
const corsMiddleware = require('./middlewares/cors.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorMiddleware);

module.exports = app;
