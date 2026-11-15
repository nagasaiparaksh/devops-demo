const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// --- Hardening ---
app.disable('x-powered-by');                      // do not advertise the framework
app.use(helmet());                                // secure HTTP response headers
app.use(express.json({ limit: '10kb' }));         // cap request body size
app.use(rateLimit({ windowMs: 60 * 1000, limit: 100,
                    standardHeaders: true, legacyHeaders: false })); // brute-force / DoS protection

// --- Audit logging (HIPAA "audit controls"): who/what/outcome, never patient data or keys ---
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'access',
      method: req.method,
      path: req.path,
      status: res.statusCode
    }));
  });
  next();
});

// --- Synthetic data only. No real patient information anywhere in this project. ---
const PATIENTS = [
  { id: 1, name: 'Patient A', age: 45, ward: 'Cardiology', diagnosisCode: 'I10' },
  { id: 2, name: 'Patient B', age: 62, ward: 'Oncology',   diagnosisCode: 'C50' },
  { id: 3, name: 'Patient C', age: 31, ward: 'Orthopedics', diagnosisCode: 'S82' }
];

// --- Authentication: constant-time API key check, fails closed ---
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  const provided = req.get('x-api-key') || '';
  if (!expected || !safeEqual(provided, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/patients', requireApiKey, (req, res) => {
  res.json(PATIENTS);
});

app.get('/patients/:id', requireApiKey, (req, res) => {
  // Input validation: digits only, max 6 characters
  if (!/^[0-9]{1,6}$/.test(req.params.id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const patient = PATIENTS.find(p => p.id === Number(req.params.id));
  if (!patient) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json(patient);
});

module.exports = app;

if (require.main === module) {
  if (!process.env.API_KEY) {
    console.error('API_KEY is required. Refusing to start without authentication.');
    process.exit(1);
  }
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('patient-api listening on ' + port));
}
