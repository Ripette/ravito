// Relais vers Intervals.icu (évite le blocage CORS du navigateur).
// POST { id, key, oldest, newest, kind: 'events' | 'activities' }
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { id, key, oldest, newest } = req.body || {};
  const kind = (req.body || {}).kind === 'activities' ? 'activities' : 'events';
  const ok = (x) => typeof x === 'string' && /^[\w-]{1,64}$/.test(x);
  const day = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || '');
  if (!ok(id) || !ok(key) || !day(oldest) || !day(newest))
    return res.status(400).json({ error: 'Paramètres invalides' });
  const r = await fetch(`https://intervals.icu/api/v1/athlete/${id}/${kind}?oldest=${oldest}&newest=${newest}`, {
    headers: { Authorization: 'Basic ' + Buffer.from('API_KEY:' + key).toString('base64') },
  });
  if (!r.ok) return res.status(r.status === 401 || r.status === 403 ? 401 : 502).json({ error: 'Intervals.icu a répondu ' + r.status });
  res.setHeader('Cache-Control', 'no-store');
  res.json(await r.json());
};
