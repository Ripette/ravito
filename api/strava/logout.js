const { stravaToken, setCookie } = require('../_lib');

module.exports = async (req, res) => {
  const s = await stravaToken(req, res).catch(() => null);
  if (s) await fetch('https://www.strava.com/oauth/deauthorize', {
    method: 'POST', headers: { Authorization: 'Bearer ' + s.at },
  }).catch(() => {});
  setCookie(res, 'rv_strava', '', 0);
  res.json({ ok: true });
};
