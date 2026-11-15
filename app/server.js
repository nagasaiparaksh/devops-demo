const express = require('express');
const os = require('os');

const app = express();
const VERSION = process.env.APP_VERSION || 'v1';
const COLOR = process.env.APP_COLOR || 'none';

const COLORS = { blue: '#1d4ed8', green: '#15803d' };

app.get('/', (req, res) => {
  const info = {
    message: 'Release 2 is live',
    version: VERSION,
    color: COLOR,
    pod: os.hostname()
  };

  // Browsers get a coloured page; curl and the tests get JSON
  if (req.accepts(['json', 'html']) === 'html') {
    const bg = COLORS[COLOR] || '#374151';
    res.send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + COLOR + '</title></head>' +
      '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'background:' + bg + ';color:#fff;font-family:system-ui,sans-serif;text-align:center">' +
      '<div><h1 style="font-size:72px;margin:0">' + COLOR.toUpperCase() + '</h1>' +
      '<p style="font-size:24px">' + info.message + '</p>' +
      '<p style="font-size:20px">version: ' + VERSION + '<br>pod: ' + info.pod + '</p></div>' +
      '</body></html>'
    );
  } else {
    res.json(info);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Server listening on ' + port));
}
