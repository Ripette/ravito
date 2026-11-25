const { stravaToken } = require('../_lib');

// GET /api/strava/activities?days=3  -> activités réalisées récentes, format simplifié
module.exports = async (req, res) => {
  const s = await stravaToken(req, res);
  if (!s) return res.status(401).json({ connected: false });
  const days = Math.min(30, Math.max(1, parseInt(req.query.days, 10) || 3));
  const after = Math.floor(Date.now() / 1000) - days * 86400;
  const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
    headers: { Authorization: 'Bearer ' + s.at },
  });
  if (r.status === 429) return res.status(429).json({ error: 'Limite Strava atteinte, réessaie dans 15 min' });
  if (!r.ok) return res.status(502).json({ error: 'Strava a répondu ' + r.status });
  const list = await r.json();
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    connected: true,
    athlete: s.name,
    activities: list.map(a => ({
      id: a.id,
      name: a.name,
      type: a.sport_type || a.type,
      start: a.start_date_local,          // heure locale, format ISO
      moving: a.moving_time,              // secondes
      hr: a.average_heartrate || null,
      watts: a.weighted_average_watts || a.average_watts || null,
      kj: a.kilojoules || null,
    })),
  });
};
