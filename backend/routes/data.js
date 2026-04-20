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
  const p = prompt.toLowerCase();
  // Helper for word-based matching to avoid "se" matching in "closed"
  const hasWord = (str, word) => new RegExp(`\\b${word}\\b`, 'i').test(str);

  let response = '';

  // 1. Specific Zone/Stand queries
  const standMatch = Object.entries(zones).find(([id, z]) => 
    p.includes(z.label.toLowerCase()) || hasWord(p, id)
  );
  
  if (standMatch) {
    const [id, z] = standMatch;
    response = `The ${z.label} is currently at a ${z.level} congestion level. `;
    if (z.level === 'critical' || z.level === 'high') {
      response += 'It is quite busy there right now. We recommend checking nearby sections for more space.';
    } else {
      response += 'There is plenty of space in this area.';
    }
  } 
  
  // 2. Specific Facility queries (Wait times)
  else if (p.includes('wait') || p.includes('food') || p.includes('restroom') || p.includes('court')) {
    const facilityMatch = waitData.find(w => p.includes(w.name.toLowerCase()));
    if (facilityMatch) {
      response = `The wait time for ${facilityMatch.name} is currently ${facilityMatch.time} minutes. `;
      if (facilityMatch.time > 10) {
        const shorter = waitData.filter(w => w.name.includes(facilityMatch.name.split(' ')[0]) && w.time < facilityMatch.time);
        if (shorter.length > 0) {
          response += `For a shorter wait, try ${shorter[0].name} (${shorter[0].time}m).`;
        }
      }
    } else {
      response = 'Current wait times: ' + waitData.slice(0, 3).map(w => `${w.name}: ${w.time}m`).join(', ') + '...';
    }
  }

  // 3. Specific Gate/Alert queries
  else if (p.includes('gate') || p.includes('alert') || p.includes('issue') || p.includes('exit')) {
    const criticalAlert = alertData.find(a => a.level === 'critical');
    if (p.includes('gate e') || (p.includes('gate') && criticalAlert && criticalAlert.msg.includes('Gate E'))) {
      response = 'Gate E is currently critically congested. We strongly advise using Gate W or S for a faster exit.';
    } else if (alertData.length > 0) {
      response = `Current alerts: ${alertData[0].msg}`;
    } else {
      response = 'There are no critical alerts at the moment. All gates are operating normally.';
    }
  }

  // 4. Specific Route queries
  else if (p.includes('route') || p.includes('way') || p.includes('get to') || p.includes('how do i')) {
    const destination = p.includes('section d') ? 'Section D' : 'your destination';
    const bestRoute = routes.find(r => r.status === 'clear') || routes[0];
    response = `To get to ${destination} quickly, the best route is ${bestRoute.label}. It's currently ${bestRoute.status} with an ETA of ${bestRoute.eta}.`;
  }

  // 5. Greetings & Metadata
  else if (hasWord(p, 'hi') || hasWord(p, 'hello') || hasWord(p, 'hey')) {
    response = `Hello! I'm your CrowdFlow AI assistant. Currently, the stadium is at ${occupancy}% occupancy. How can I help you navigate the venue today?`;
  }

  // Fallback
  else {
    response = "I'm not quite sure about that. I can help with stadium navigation, wait times for food or restrooms, and current stand congestion. What would you like to know?";
  }

  res.json({ response });
});

module.exports = router;