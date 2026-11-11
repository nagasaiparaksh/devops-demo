const express = require('express');
const os = require('os');

const app = express();
const VERSION = process.env.APP_VERSION || 'v1';

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from the Jenkins CI/CD pipeline',
    version: VERSION,
    pod: os.hostname()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Server listening on ' + port));
}
