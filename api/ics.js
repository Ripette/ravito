// Relais pour lire un agenda iCal (Garmin Connect, Nolio, Google Agenda…).
// POST { url } -> texte .ics brut. Protégé contre les adresses internes.
const dns = require('dns').promises;
const net = require('net');

function privateIp(ip) {
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l.startsWith('::ffff:')) return privateIp(l.slice(7));
    return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
async function safeUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim().replace(/^webcals?:\/\//i, 'https://')); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null;
  const addrs = await dns.lookup(u.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some(a => privateIp(a.address))) return null;
  return u;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let u = await safeUrl((req.body || {}).url);
  if (!u) return res.status(400).json({ error: 'Lien invalide (il doit commencer par https:// ou webcal://)' });
  try {
    let r;
    for (let i = 0; i < 4; i++) {
      r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { Accept: 'text/calendar, */*' } });
      if (r.status < 300 || r.status >= 400) break;
      u = await safeUrl(new URL(r.headers.get('location') || '', u));
      if (!u) return res.status(400).json({ error: 'Redirection refusée' });
    }
    if (!r.ok) return res.status(502).json({ error: 'L\'agenda a répondu ' + r.status });
    const txt = await r.text();
    if (txt.length > 3e6) return res.status(413).json({ error: 'Agenda trop volumineux' });
    if (!txt.includes('BEGIN:VCALENDAR')) return res.status(422).json({ error: 'Ce lien n\'est pas un agenda iCal (page web ou connexion requise ?)' });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.end(txt);
  } catch (e) {
    res.status(502).json({ error: 'Impossible de lire l\'agenda' });
  }
};
