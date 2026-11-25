module.exports = (req, res) => res.json({ enabled: !!(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET) });
