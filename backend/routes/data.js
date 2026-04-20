const express = require('express');
const router = express.Router();

let zones = {
  north: { level: 'critical', label: 'North Stand' },
  south: { level: 'medium', label: 'South Stand' },
  east: { level: 'critical', label: 'East Stand' },
  west: { level: 'low', label: 'West Stand' },
  ne: { level: 'high', label: 'NE Corner' },
  nw: { level: 'low', label: 'NW Corner' },
  se: { level: 'high', label: 'SE Corner' },
  sw: { level: 'low', label: 'SW Corner' },
};

let waitData = [
  { name: 'Food Court A', time: 14, max: 20 },
  { name: 'Food Court B', time: 6, max: 20 },
  { name: 'Restroom N', time: 9, max: 20 },
  { name: 'Restroom S', time: 3, max: 20 },
  { name: 'Gate E Exit', time: 18, max: 20 },
  { name: 'Gate W Exit', time: 4, max: 20 },
];

let alertData = [
  { level: 'critical', msg: 'Gate E critically congested. Use Gate W or S.', time: 'now' },
  { level: 'warn', msg: 'Food Court A queue: 14 min. Court B is clear.', time: '2m' },
  { level: 'info', msg: 'North Stand at 94%. Enter via south concourse.', time: '5m' },
];

let routes = [
  { from: 'Gate W', label: 'Gate W → Sec D', status: 'clear', eta: '3 min' },
  { from: 'Gate N', label: 'Gate N → Sec D', status: 'moderate', eta: '7 min' },
  { from: 'Gate E', label: 'Gate E → Sec D', status: 'congested', eta: '14 min' },
];

let sparkVals = [22, 55, 78, 87, 65, 40];
let occupancy = 87;
let avgWait = 6.4;
let activeAlerts = 3;
let crowdScore = 74;

// Simulate data updates
setInterval(() => {
  // Update wait times
  waitData.forEach(w => {
    const delta = (Math.random() - 0.48) * 2;
    w.time = Math.max(1, Math.min(w.max - 1, w.time + delta));
    w.time = Math.round(w.time);
  });

  // Update zones occasionally
  const levelCycle = ['low', 'medium', 'high', 'critical'];
  ['north', 'east'].forEach(k => {
    if (Math.random() > 0.7) {
      const cur = levelCycle.indexOf(zones[k].level);
      zones[k].level = levelCycle[Math.min(3, Math.max(0, cur + (Math.random() > 0.5 ? 1 : -1)))];
    }
  });

  // Update stats
  avgWait = (waitData.reduce((a, w) => a + w.time, 0) / waitData.length).toFixed(1);
  crowdScore = 100 - Math.round(avgWait * 3.5);
  crowdScore = Math.max(20, Math.min(99, crowdScore));
}, 2800);

router.get('/zones', (req, res) => {
  res.json(zones);
});

router.get('/wait-times', (req, res) => {
  res.json(waitData);
});

router.get('/alerts', (req, res) => {
  res.json(alertData);
});

router.get('/routes', (req, res) => {
  res.json(routes);
});

router.get('/sparkline', (req, res) => {
  res.json({ hours: ['18', '19', '20', '21', '22', '23'], values: sparkVals });
});

router.get('/stats', (req, res) => {
  res.json({
    occupancy: `${occupancy}%`,
    avgWait: `${avgWait}min`,
    activeAlerts,
    crowdScore
  });
});

router.post('/chat', (req, res) => {
  const { prompt } = req.body;
  let response = '';

  const p = prompt.toLowerCase();

  if (p.includes('route') || p.includes('way') || p.includes('get to') || p.includes('section d')) {
    const bestRoute = routes.find(r => r.status === 'clear') || routes[0];
    response = `Best route to Section D: ${bestRoute.label}. ETA: ${bestRoute.eta}. Status: ${bestRoute.status}. Avoid Gate E due to congestion.`;
  } else if (p.includes('wait') || p.includes('food') || p.includes('restroom')) {
    const relevant = waitData.filter(w => p.includes(w.name.toLowerCase().split(' ')[0]));
    if (relevant.length > 0) {
      response = relevant.map(w => `${w.name}: ${w.time} min wait.`).join(' ');
    } else {
      response = 'Current wait times: ' + waitData.map(w => `${w.name}: ${w.time}m`).join(', ') + '.';
    }
  } else if (p.includes('alert') || p.includes('issue')) {
    response = 'Active alerts: ' + alertData.map(a => a.msg).join(' ');
  } else if (p.includes('occupancy') || p.includes('crowd')) {
    response = `Current occupancy: ${occupancy}%. Crowd score: ${crowdScore}/100. North and East stands are congested.`;
  } else if (p.includes('help') || p.includes('what')) {
    response = 'I can help with routing, wait times, alerts, and crowd info. Try asking "Best route to Section D" or "Wait time for Food Court".';
  } else {
    response = 'I\'m CrowdFlow AI. Ask me about routes, wait times, or current crowd status.';
  }

  res.json({ response });
});

module.exports = router;