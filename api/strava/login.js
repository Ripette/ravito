const crypto = require('crypto');
const { setCookie, baseUrl } = require('../_lib');

module.exports = (req, res) => {
  if (!process.env.STRAVA_CLIENT_ID) return res.status(500).send('STRAVA_CLIENT_ID manquant');
  const state = crypto.randomBytes(16).toString('hex');
  setCookie(res, 'rv_state', state, 600);
  const q = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: 'code',
    redirect_uri: baseUrl(req) + '/api/strava/callback',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state,
  });
  res.writeHead(302, { Location: 'https://www.strava.com/oauth/authorize?' + q });
  res.end();
};
