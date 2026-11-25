// Outils partagés : cookies chiffrés (AES-256-GCM), pas de base de données.
const crypto = require('crypto');

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET manquant (32 caractères minimum)');
  return crypto.createHash('sha256').update(s).digest();
}
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64url');
}
function unseal(str) {
  try {
    const b = Buffer.from(str, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch { return null; }
}
function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function setCookie(res, name, value, maxAge) {
  const c = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
}
function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

// Session Strava : renvoie un jeton valide (rafraîchi si besoin) ou null.
async function stravaToken(req, res) {
  const s = unseal(cookies(req).rv_strava || '');
  if (!s) return null;
  if (s.exp > Date.now() / 1000 + 60) return s;
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: s.rt,
    }),
  });
  if (!r.ok) return null;
  const t = await r.json();
  const ns = { ...s, at: t.access_token, rt: t.refresh_token, exp: t.expires_at };
  setCookie(res, 'rv_strava', seal(ns), 60 * 60 * 24 * 180);
  return ns;
}

module.exports = { seal, unseal, cookies, setCookie, baseUrl, stravaToken };
