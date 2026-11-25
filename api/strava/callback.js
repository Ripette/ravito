const { cookies, setCookie, seal } = require('../_lib');

module.exports = async (req, res) => {
  const { code, state, error } = req.query;
  const back = (m) => { res.writeHead(302, { Location: '/?strava=' + m + '#week' }); res.end(); };
  if (error || !code) return back('refuse');
  if (!state || state !== cookies(req).rv_state) return back('etat');
  setCookie(res, 'rv_state', '', 0);
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!r.ok) return back('echec');
  const t = await r.json();
  const a = t.athlete || {};
  setCookie(res, 'rv_strava', seal({
    at: t.access_token, rt: t.refresh_token, exp: t.expires_at,
    name: [a.firstname, a.lastname].filter(Boolean).join(' '),
  }), 60 * 60 * 24 * 180);
  back('ok');
};
