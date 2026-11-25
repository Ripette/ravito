// Connecteur Garmin Connect (clé API personnelle, mode « pull »).
// POST { key, from, to } -> activités réalisées entre deux dates (AAAA-MM-JJ).
// 1) échange la clé contre un jeton d'accès, 2) lit la liste des activités.
const BASE = 'https://personal.connectapi.garmin.com';

function pickToken(j) {
  if (!j) return null;
  if (typeof j === 'string') return j;
  return j.access_token || j.accessToken || j.token || (j.data && pickToken(j.data)) || null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { key, from, to } = req.body || {};
  const day = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || '');
  if (typeof key !== 'string' || !/^[\w.\-=+/]{10,1024}$/.test(key.trim()) || !day(from) || !day(to))
    return res.status(400).json({ error: 'Paramètres invalides' });
  try {
    const tr = await fetch(BASE + '/personalapitoken-service/personal-api/personal-api-key/token', {
      method: 'POST',
      headers: { Authorization: 'ApiKey ' + key.trim(), Accept: '*/*' },
      signal: AbortSignal.timeout(15000),
    });
    if (tr.status === 401 || tr.status === 403) return res.status(401).json({ error: 'Clé Garmin refusée (expirée ou supprimée ?)' });
    if (!tr.ok) return res.status(502).json({ error: 'Garmin (jeton) a répondu ' + tr.status });
    const raw = await tr.text();
    let j; try { j = JSON.parse(raw); } catch { j = raw.trim(); }
    const token = pickToken(j);
    if (!token) return res.status(502).json({ error: 'Format de jeton Garmin inattendu', champs: Object.keys(j || {}) });

    const q = new URLSearchParams({ startDate: from, endDate: to, start: '0', limit: '100' });
    const ar = await fetch(`${BASE}/activitylist-service/activities/search/activities?${q}`, {
      headers: { Authorization: 'Bearer ' + token, Accept: '*/*' },
      signal: AbortSignal.timeout(15000),
    });
    if (!ar.ok) return res.status(502).json({ error: 'Garmin (activités) a répondu ' + ar.status });
    const list = await ar.json();
    const arr = Array.isArray(list) ? list : (list.activityList || list.activities || []);
    res.setHeader('Cache-Control', 'no-store');
    res.json(arr.map(a => ({
      id: a.activityId,
      name: a.activityName || '',
      type: (a.activityType && a.activityType.typeKey) || '',
      start: a.startTimeLocal || '',                     // « AAAA-MM-JJ HH:MM:SS », heure locale
      dur: a.movingDuration || a.duration || a.elapsedDuration || 0, // secondes
      hr: a.averageHR || null,
      watts: a.normPower || a.avgPower || null,
      te: a.trainingEffectLabel || null,                 // ex. TEMPO, THRESHOLD, VO2MAX
      ate: a.anaerobicTrainingEffect || null,
    })));
  } catch (e) {
    res.status(502).json({ error: 'Garmin injoignable' });
  }
};
